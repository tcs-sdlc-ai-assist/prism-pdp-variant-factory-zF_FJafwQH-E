import { useState, useCallback, useMemo, useId } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import {
  saveCohortSet,
  validateCohortSet,
  getDefaultCohortSet,
} from '@/services/cohortIntakeService.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import { MAX_VARIANTS } from '@/constants/constants.js';
import CohortTargetForm from '@/components/cohorts/CohortTargetForm.jsx';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';

/**
 * Minimum number of cohort targets allowed
 * @type {number}
 */
const MIN_TARGETS = 1;

/**
 * Maximum number of cohort targets allowed
 * @type {number}
 */
const MAX_TARGETS = MAX_VARIANTS;

/**
 * Creates a new empty cohort target with default values.
 *
 * @param {number} index - The index for priority assignment
 * @returns {import('@/data/defaultCohorts.js').CohortTarget}
 */
function createEmptyTarget(index) {
  return {
    cohortId: `cohort-target-${uuidv4()}`,
    label: '',
    cohortType: '',
    behavioralOverlay: '',
    baseSku: '',
    priority: index + 1,
    behavioralOverlays: [],
    tailoringEmphasis: {},
  };
}

/**
 * Validates a single cohort target for the intake panel.
 * Returns per-field error messages.
 *
 * @param {object} target - The cohort target to validate
 * @returns {Object.<string, string>} Per-field error messages
 */
function validateTarget(target) {
  const errors = {};

  if (!target) {
    return { label: 'Target is required' };
  }

  if (!target.label || typeof target.label !== 'string' || target.label.trim().length === 0) {
    errors.label = 'Variant label is required';
  } else if (target.label.trim().length > 120) {
    errors.label = 'Variant label must be 120 characters or fewer';
  }

  if (!target.cohortType || typeof target.cohortType !== 'string' || target.cohortType.trim().length === 0) {
    errors.cohortType = 'Cohort type is required';
  }

  if (!target.behavioralOverlay || typeof target.behavioralOverlay !== 'string' || target.behavioralOverlay.trim().length === 0) {
    errors.behavioralOverlay = 'Behavioral overlay is required';
  }

  if (!target.baseSku || typeof target.baseSku !== 'string' || target.baseSku.trim().length === 0) {
    errors.baseSku = 'Base SKU is required';
  }

  return errors;
}

/**
 * Checks whether a per-field errors object has any errors.
 *
 * @param {Object.<string, string>} errors - Per-field error messages
 * @returns {boolean}
 */
function hasErrors(errors) {
  if (!errors || typeof errors !== 'object') {
    return false;
  }
  return Object.keys(errors).length > 0;
}

/**
 * @typedef {Object} CohortIntakePanelProps
 * @property {function} [onGenerate] - Callback invoked with the validated cohort set when Generate is clicked
 * @property {boolean} [disabled=false] - Whether the entire panel is disabled
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Cohort & Behaviour Intake Module panel component: renders up to 10 CohortTargetForm rows,
 * batch count input (1-10), add/remove target buttons, validation summary, and Generate button
 * (disabled until all targets valid). Serializes configuration on submit.
 * Uses cohortIntakeService for persistence.
 *
 * @param {CohortIntakePanelProps} props
 * @returns {React.ReactElement}
 */
function CohortIntakePanel({ onGenerate, disabled = false, className }) {
  const uniqueId = useId();
  const { catalog, cohortSet, setCohortSet } = useAppContext();
  const { announceToScreenReader } = useAccessibility();

  const [announcement, setAnnouncement] = useState('');

  const initialTargets = useMemo(() => {
    if (cohortSet && Array.isArray(cohortSet.cohorts) && cohortSet.cohorts.length > 0) {
      return cohortSet.cohorts.slice(0, MAX_TARGETS);
    }
    const defaults = getDefaultCohortSet();
    if (defaults && Array.isArray(defaults.cohorts) && defaults.cohorts.length > 0) {
      return defaults.cohorts.slice(0, MAX_TARGETS);
    }
    return [createEmptyTarget(0)];
  }, [cohortSet]);

  const [targets, setTargets] = useState(initialTargets);
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const catalogItems = useMemo(() => {
    if (!Array.isArray(catalog)) {
      return [];
    }
    return catalog.map((item) => ({
      id: item.id,
      sku: item.sku,
      title: item.title,
    }));
  }, [catalog]);

  const targetErrors = useMemo(() => {
    return targets.map((target) => validateTarget(target));
  }, [targets]);

  const allValid = useMemo(() => {
    if (targets.length < MIN_TARGETS || targets.length > MAX_TARGETS) {
      return false;
    }
    return targetErrors.every((errors) => !hasErrors(errors));
  }, [targets, targetErrors]);

  const validationSummary = useMemo(() => {
    if (!touched) {
      return [];
    }
    const summary = [];

    if (targets.length < MIN_TARGETS) {
      summary.push(`At least ${MIN_TARGETS} cohort target is required`);
    }

    if (targets.length > MAX_TARGETS) {
      summary.push(`Maximum of ${MAX_TARGETS} cohort targets allowed`);
    }

    targetErrors.forEach((errors, index) => {
      const fieldErrors = Object.values(errors);
      if (fieldErrors.length > 0) {
        summary.push(`Target ${index + 1}: ${fieldErrors.join(', ')}`);
      }
    });

    return summary;
  }, [touched, targets, targetErrors]);

  const invalidCount = useMemo(() => {
    return targetErrors.filter((errors) => hasErrors(errors)).length;
  }, [targetErrors]);

  const handleTargetChange = useCallback(
    (index, fieldName, value) => {
      setTouched(true);
      setTargets((prev) => {
        const updated = [...prev];
        if (index >= 0 && index < updated.length) {
          updated[index] = { ...updated[index], [fieldName]: value };
        }
        return updated;
      });
    },
    [],
  );

  const handleAddTarget = useCallback(() => {
    if (targets.length >= MAX_TARGETS) {
      announceToScreenReader(`Maximum of ${MAX_TARGETS} cohort targets reached`, 'polite');
      return;
    }

    setTouched(true);
    const newTarget = createEmptyTarget(targets.length);
    setTargets((prev) => [...prev, newTarget]);
    announceToScreenReader(`Cohort target ${targets.length + 1} added`, 'polite');
    setAnnouncement(`Cohort target ${targets.length + 1} added`);
  }, [targets.length, announceToScreenReader]);

  const handleRemoveTarget = useCallback(
    (index) => {
      if (targets.length <= MIN_TARGETS) {
        announceToScreenReader(`At least ${MIN_TARGETS} cohort target is required`, 'polite');
        return;
      }

      setTouched(true);
      setTargets((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        return updated.map((target, i) => ({
          ...target,
          priority: i + 1,
        }));
      });
      announceToScreenReader(`Cohort target ${index + 1} removed`, 'polite');
      setAnnouncement(`Cohort target ${index + 1} removed`);
    },
    [targets.length, announceToScreenReader],
  );

  const handleLoadDefaults = useCallback(() => {
    const defaults = getDefaultCohortSet();
    if (defaults && Array.isArray(defaults.cohorts)) {
      setTargets(defaults.cohorts.slice(0, MAX_TARGETS));
      setTouched(false);
      setSaveError(null);
      announceToScreenReader('Default cohort targets loaded', 'polite');
      setAnnouncement('Default cohort targets loaded');

      emitEvent(EVENT_TYPES.COHORT_CONFIG, {
        action: 'CohortIntakePanel:loadDefaults',
        cohortCount: defaults.cohorts.length,
      });
    }
  }, [announceToScreenReader]);

  const handleClearAll = useCallback(() => {
    setTargets([createEmptyTarget(0)]);
    setTouched(true);
    setSaveError(null);
    announceToScreenReader('All cohort targets cleared', 'polite');
    setAnnouncement('All cohort targets cleared');
  }, [announceToScreenReader]);

  const buildCohortSet = useCallback(() => {
    const now = new Date().toISOString();
    const existingId = cohortSet && cohortSet.id ? cohortSet.id : `cohort-set-${uuidv4()}`;
    const existingName = cohortSet && cohortSet.name ? cohortSet.name : 'Custom PDP Variant Cohort Set';

    return {
      id: existingId,
      name: existingName,
      description: cohortSet && cohortSet.description
        ? cohortSet.description
        : 'Custom cohort set configured via intake panel.',
      cohorts: targets.map((target, index) => ({
        ...target,
        priority: index + 1,
        cohortId: target.cohortId || `cohort-target-${uuidv4()}`,
      })),
      createdAt: cohortSet && cohortSet.createdAt ? cohortSet.createdAt : now,
      updatedAt: now,
    };
  }, [targets, cohortSet]);

  const handleGenerate = useCallback(async () => {
    setTouched(true);

    if (!allValid) {
      announceToScreenReader(
        `Cannot generate: ${invalidCount} target${invalidCount === 1 ? '' : 's'} have validation errors`,
        'assertive',
      );
      setAnnouncement(
        `Cannot generate: ${invalidCount} target${invalidCount === 1 ? '' : 's'} have validation errors`,
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const newCohortSet = buildCohortSet();

      const validation = validateCohortSet(newCohortSet);
      if (!validation.valid) {
        setSaveError(`Validation failed: ${validation.errors.join('; ')}`);
        announceToScreenReader('Cohort set validation failed', 'assertive');
        setAnnouncement('Cohort set validation failed');
        setIsSaving(false);
        return;
      }

      setCohortSet(newCohortSet);

      emitEvent(EVENT_TYPES.COHORT_CONFIG, {
        action: 'CohortIntakePanel:generate',
        cohortCount: newCohortSet.cohorts.length,
        cohortSetId: newCohortSet.id,
      });

      announceToScreenReader(
        `Cohort set saved with ${newCohortSet.cohorts.length} target${newCohortSet.cohorts.length === 1 ? '' : 's'}. Starting variant generation.`,
        'polite',
      );
      setAnnouncement(
        `Cohort set saved with ${newCohortSet.cohorts.length} target${newCohortSet.cohorts.length === 1 ? '' : 's'}`,
      );

      if (typeof onGenerate === 'function') {
        await onGenerate(newCohortSet);
      }
    } catch (e) {
      const errorMsg = `Failed to save cohort set: ${e.message}`;
      setSaveError(errorMsg);
      announceToScreenReader(errorMsg, 'assertive');
      setAnnouncement(errorMsg);

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'CohortIntakePanel:generate',
        error: e.message,
      });
    } finally {
      setIsSaving(false);
    }
  }, [allValid, invalidCount, buildCohortSet, setCohortSet, onGenerate, announceToScreenReader]);

  const handleBatchCountChange = useCallback(
    (event) => {
      const value = parseInt(event.target.value, 10);
      if (!Number.isFinite(value) || value < MIN_TARGETS || value > MAX_TARGETS) {
        return;
      }

      setTouched(true);

      setTargets((prev) => {
        if (value > prev.length) {
          const newTargets = [...prev];
          for (let i = prev.length; i < value; i++) {
            newTargets.push(createEmptyTarget(i));
          }
          return newTargets;
        }
        if (value < prev.length) {
          return prev.slice(0, value).map((target, i) => ({
            ...target,
            priority: i + 1,
          }));
        }
        return prev;
      });

      announceToScreenReader(`Batch count set to ${value}`, 'polite');
    },
    [announceToScreenReader],
  );

  return (
    <section
      role="region"
      aria-label="Cohort & Behaviour Intake"
      className={`flex flex-col gap-6 animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-6 w-6 text-primary-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Cohort & Behaviour Intake
            </h2>
            <p className="text-sm text-neutral-500">
              Configure up to {MAX_TARGETS} cohort × behavioral overlay targets for PDP variant generation.
            </p>
          </div>
        </div>

        {/* Batch count + action buttons */}
        <div className="flex items-center gap-3">
          {/* Batch count */}
          <div className="flex items-center gap-2">
            <label
              htmlFor={`${uniqueId}-batch-count`}
              className="text-sm font-medium text-neutral-700 whitespace-nowrap"
            >
              Targets:
            </label>
            <input
              type="number"
              id={`${uniqueId}-batch-count`}
              value={targets.length}
              onChange={handleBatchCountChange}
              min={MIN_TARGETS}
              max={MAX_TARGETS}
              step={1}
              disabled={disabled || isSaving}
              className="w-16 rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900 shadow-sm transition-colors duration-200 hover:border-neutral-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
              aria-label="Number of cohort targets"
            />
          </div>

          {/* Load defaults */}
          <button
            type="button"
            onClick={handleLoadDefaults}
            disabled={disabled || isSaving}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            Load Defaults
          </button>

          {/* Clear all */}
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled || isSaving}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-red-50 hover:text-red-700 hover:ring-red-300 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            Clear All
          </button>
        </div>
      </div>

      {/* Target count badge */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-md bg-primary-50 px-2.5 py-1 text-sm font-medium text-primary-700">
          {targets.length} target{targets.length === 1 ? '' : 's'} configured
        </span>
        {touched && invalidCount > 0 && (
          <span className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1 text-sm font-medium text-red-700">
            {invalidCount} target{invalidCount === 1 ? '' : 's'} with errors
          </span>
        )}
        {touched && allValid && (
          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-sm font-medium text-green-700">
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            All targets valid
          </span>
        )}
      </div>

      {/* Save error */}
      {saveError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <svg
            className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}

      {/* Validation summary */}
      {touched && validationSummary.length > 0 && (
        <div
          role="alert"
          aria-label="Validation summary"
          className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-4 w-4 text-yellow-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <h3 className="text-sm font-semibold text-yellow-800">
              Validation Issues ({validationSummary.length})
            </h3>
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {validationSummary.map((msg, index) => (
              <li key={index} className="text-xs text-yellow-700">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cohort target forms */}
      <div className="flex flex-col gap-4" role="list" aria-label="Cohort targets">
        {targets.map((target, index) => (
          <div key={target.cohortId || index} role="listitem">
            <CohortTargetForm
              target={target}
              index={index}
              catalogItems={catalogItems}
              onChange={handleTargetChange}
              onRemove={handleRemoveTarget}
              canRemove={targets.length > MIN_TARGETS}
              disabled={disabled || isSaving}
              errors={touched ? targetErrors[index] : undefined}
            />
          </div>
        ))}
      </div>

      {/* Add target button */}
      {targets.length < MAX_TARGETS && (
        <button
          type="button"
          onClick={handleAddTarget}
          disabled={disabled || isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-600 transition-colors duration-200 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-300 disabled:hover:text-neutral-600 disabled:hover:bg-transparent"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Cohort Target ({targets.length}/{MAX_TARGETS})
        </button>
      )}

      {/* Footer: Generate button */}
      <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-neutral-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <p className="text-xs text-neutral-400">
            {targets.length} target{targets.length === 1 ? '' : 's'} will generate {targets.length} PDP variant{targets.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled || isSaving || (touched && !allValid)}
          aria-label={`Generate ${targets.length} variant${targets.length === 1 ? '' : 's'}`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
        >
          {isSaving ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                />
              </svg>
              Generate {targets.length} Variant{targets.length === 1 ? '' : 's'}
            </>
          )}
        </button>
      </div>

      {/* Aria live region for announcements */}
      <AriaLiveRegion
        message={announcement}
        politeness="polite"
        atomic={true}
        clearAfterMs={5000}
      />
    </section>
  );
}

CohortIntakePanel.propTypes = {
  onGenerate: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

CohortIntakePanel.defaultProps = {
  onGenerate: undefined,
  disabled: false,
  className: undefined,
};

export default CohortIntakePanel;