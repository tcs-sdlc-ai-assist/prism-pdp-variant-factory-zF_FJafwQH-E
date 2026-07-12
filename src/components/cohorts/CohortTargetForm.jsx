import { useState, useCallback, useMemo, useId } from 'react';
import PropTypes from 'prop-types';
import {
  COHORT_OPTIONS,
  BEHAVIORAL_OVERLAY_OPTIONS,
  TAILORING_DIMENSIONS,
} from '@/constants/constants.js';

/**
 * @typedef {Object} CohortTargetFormValues
 * @property {string} cohortId - Unique cohort target identifier
 * @property {string} label - Human-readable label for the cohort target
 * @property {string} cohortType - The type/segment of the cohort
 * @property {string} behavioralOverlay - Behavioral overlay applied to this target
 * @property {string} baseSku - The base SKU from the mock catalog this target applies to
 * @property {number} priority - Priority ranking (1 = highest)
 * @property {string[]} behavioralOverlays - Array of behavioral overlay identifiers
 * @property {Object.<string, { weight: number, strategy: string }>} [tailoringEmphasis] - Per-dimension tailoring emphasis
 */

/**
 * @typedef {Object} CohortTargetFormProps
 * @property {CohortTargetFormValues} target - The cohort target data to display/edit
 * @property {number} index - The index of this target in the cohort set
 * @property {Array<{ id: string, sku: string, title: string }>} catalogItems - Available catalog items for SKU dropdown
 * @property {function(number, string, *): void} onChange - Callback when a field value changes (index, fieldName, value)
 * @property {function(number): void} onRemove - Callback to remove this target row
 * @property {boolean} [canRemove=true] - Whether the remove button should be enabled
 * @property {boolean} [disabled=false] - Whether all form controls should be disabled
 * @property {Object.<string, string>} [errors] - Per-field validation error messages
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Maps cohort option values to their display labels.
 *
 * @param {string} value - The cohort option value
 * @returns {string} The display label
 */
function getCohortLabel(value) {
  const option = COHORT_OPTIONS.find((o) => o.value === value);
  return option ? option.label : value;
}

/**
 * Maps behavioral overlay option values to their display labels.
 *
 * @param {string} value - The behavioral overlay option value
 * @returns {string} The display label
 */
function getBehavioralOverlayLabel(value) {
  const option = BEHAVIORAL_OVERLAY_OPTIONS.find((o) => o.value === value);
  return option ? option.label : value;
}

/**
 * Formats a tailoring dimension key to a human-readable label.
 *
 * @param {string} dimension - The tailoring dimension key
 * @returns {string} Human-readable label
 */
function formatDimensionLabel(dimension) {
  if (!dimension || typeof dimension !== 'string') {
    return '';
  }
  return dimension.charAt(0).toUpperCase() + dimension.slice(1);
}

/**
 * Single cohort target form row component: form fields for cohort type (dropdown),
 * behavioral overlay (dropdown), base SKU (dropdown from catalog), tailoring emphasis
 * (multi-select), and variant label (text input). Inline validation with error messages.
 * Accessible form controls with labels and ARIA attributes.
 *
 * @param {CohortTargetFormProps} props
 * @returns {React.ReactElement}
 */
function CohortTargetForm({
  target,
  index,
  catalogItems,
  onChange,
  onRemove,
  canRemove = true,
  disabled = false,
  errors,
  className,
}) {
  const uniqueId = useId();
  const [isExpanded, setIsExpanded] = useState(true);

  const fieldId = useCallback(
    (fieldName) => `cohort-target-${uniqueId}-${index}-${fieldName}`,
    [uniqueId, index],
  );

  const errorId = useCallback(
    (fieldName) => `cohort-target-${uniqueId}-${index}-${fieldName}-error`,
    [uniqueId, index],
  );

  const hasError = useCallback(
    (fieldName) => {
      return errors && typeof errors === 'object' && typeof errors[fieldName] === 'string' && errors[fieldName].length > 0;
    },
    [errors],
  );

  const getError = useCallback(
    (fieldName) => {
      if (hasError(fieldName)) {
        return errors[fieldName];
      }
      return '';
    },
    [errors, hasError],
  );

  const handleFieldChange = useCallback(
    (fieldName, value) => {
      if (typeof onChange === 'function') {
        onChange(index, fieldName, value);
      }
    },
    [index, onChange],
  );

  const handleTextChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      handleFieldChange(name, value);
    },
    [handleFieldChange],
  );

  const handleSelectChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      handleFieldChange(name, value);
    },
    [handleFieldChange],
  );

  const handlePriorityChange = useCallback(
    (event) => {
      const value = event.target.value;
      const numValue = parseInt(value, 10);
      handleFieldChange('priority', Number.isFinite(numValue) && numValue > 0 ? numValue : 1);
    },
    [handleFieldChange],
  );

  const handleTailoringDimensionToggle = useCallback(
    (dimension) => {
      const currentEmphasis = target.tailoringEmphasis && typeof target.tailoringEmphasis === 'object'
        ? { ...target.tailoringEmphasis }
        : {};

      if (currentEmphasis[dimension]) {
        delete currentEmphasis[dimension];
      } else {
        currentEmphasis[dimension] = { weight: 50, strategy: '' };
      }

      handleFieldChange('tailoringEmphasis', currentEmphasis);
    },
    [target.tailoringEmphasis, handleFieldChange],
  );

  const handleTailoringWeightChange = useCallback(
    (dimension, weight) => {
      const currentEmphasis = target.tailoringEmphasis && typeof target.tailoringEmphasis === 'object'
        ? { ...target.tailoringEmphasis }
        : {};

      if (currentEmphasis[dimension]) {
        currentEmphasis[dimension] = {
          ...currentEmphasis[dimension],
          weight: Math.max(0, Math.min(100, weight)),
        };
      }

      handleFieldChange('tailoringEmphasis', currentEmphasis);
    },
    [target.tailoringEmphasis, handleFieldChange],
  );

  const handleRemove = useCallback(() => {
    if (typeof onRemove === 'function' && canRemove) {
      onRemove(index);
    }
  }, [index, onRemove, canRemove]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const selectedDimensions = useMemo(() => {
    if (!target.tailoringEmphasis || typeof target.tailoringEmphasis !== 'object') {
      return [];
    }
    return Object.keys(target.tailoringEmphasis);
  }, [target.tailoringEmphasis]);

  const cohortTypeValue = target.cohortType || '';
  const behavioralOverlayValue = target.behavioralOverlay || '';
  const baseSkuValue = target.baseSku || '';
  const labelValue = target.label || '';
  const priorityValue = typeof target.priority === 'number' ? target.priority : index + 1;

  const inputBaseClasses =
    'block w-full rounded-md border px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed';

  const inputNormalBorder = 'border-neutral-300 hover:border-neutral-400';
  const inputErrorBorder = 'border-red-400 hover:border-red-500';

  return (
    <fieldset
      aria-label={`Cohort target ${index + 1}: ${labelValue || 'Untitled'}`}
      className={`rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden animate-fade-in${className ? ` ${className}` : ''}`}
      disabled={disabled}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {index + 1}
          </span>
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-controls={`cohort-target-body-${uniqueId}-${index}`}
            className="text-sm font-medium text-neutral-800 hover:text-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200"
          >
            {labelValue || `Cohort Target ${index + 1}`}
          </button>
          {cohortTypeValue && (
            <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {getCohortLabel(cohortTypeValue)}
            </span>
          )}
          {behavioralOverlayValue && (
            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
              {getBehavioralOverlayLabel(behavioralOverlayValue)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse cohort target form' : 'Expand cohort target form'}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleRemove}
            disabled={!canRemove || disabled}
            aria-label={`Remove cohort target ${index + 1}: ${labelValue || 'Untitled'}`}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400"
          >
            <svg
              className="h-4 w-4"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div
          id={`cohort-target-body-${uniqueId}-${index}`}
          className="px-4 py-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Label */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor={fieldId('label')}
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Variant Label <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id={fieldId('label')}
                name="label"
                value={labelValue}
                onChange={handleTextChange}
                disabled={disabled}
                placeholder="e.g., Budget-Conscious Browse-Heavy Shopper"
                maxLength={120}
                required
                aria-required="true"
                aria-invalid={hasError('label') ? 'true' : undefined}
                aria-describedby={hasError('label') ? errorId('label') : undefined}
                className={`${inputBaseClasses} ${hasError('label') ? inputErrorBorder : inputNormalBorder}`}
              />
              {hasError('label') && (
                <p
                  id={errorId('label')}
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {getError('label')}
                </p>
              )}
            </div>

            {/* Cohort Type */}
            <div>
              <label
                htmlFor={fieldId('cohortType')}
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Cohort Type <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select
                id={fieldId('cohortType')}
                name="cohortType"
                value={cohortTypeValue}
                onChange={handleSelectChange}
                disabled={disabled}
                required
                aria-required="true"
                aria-invalid={hasError('cohortType') ? 'true' : undefined}
                aria-describedby={hasError('cohortType') ? errorId('cohortType') : undefined}
                className={`${inputBaseClasses} ${hasError('cohortType') ? inputErrorBorder : inputNormalBorder}`}
              >
                <option value="">Select cohort type…</option>
                {COHORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {hasError('cohortType') && (
                <p
                  id={errorId('cohortType')}
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {getError('cohortType')}
                </p>
              )}
            </div>

            {/* Behavioral Overlay */}
            <div>
              <label
                htmlFor={fieldId('behavioralOverlay')}
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Behavioral Overlay <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select
                id={fieldId('behavioralOverlay')}
                name="behavioralOverlay"
                value={behavioralOverlayValue}
                onChange={handleSelectChange}
                disabled={disabled}
                required
                aria-required="true"
                aria-invalid={hasError('behavioralOverlay') ? 'true' : undefined}
                aria-describedby={hasError('behavioralOverlay') ? errorId('behavioralOverlay') : undefined}
                className={`${inputBaseClasses} ${hasError('behavioralOverlay') ? inputErrorBorder : inputNormalBorder}`}
              >
                <option value="">Select behavioral overlay…</option>
                {BEHAVIORAL_OVERLAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {hasError('behavioralOverlay') && (
                <p
                  id={errorId('behavioralOverlay')}
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {getError('behavioralOverlay')}
                </p>
              )}
            </div>

            {/* Base SKU */}
            <div>
              <label
                htmlFor={fieldId('baseSku')}
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Base SKU <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select
                id={fieldId('baseSku')}
                name="baseSku"
                value={baseSkuValue}
                onChange={handleSelectChange}
                disabled={disabled}
                required
                aria-required="true"
                aria-invalid={hasError('baseSku') ? 'true' : undefined}
                aria-describedby={hasError('baseSku') ? errorId('baseSku') : undefined}
                className={`${inputBaseClasses} ${hasError('baseSku') ? inputErrorBorder : inputNormalBorder}`}
              >
                <option value="">Select base SKU…</option>
                {Array.isArray(catalogItems) &&
                  catalogItems.map((item) => (
                    <option key={item.sku || item.id} value={item.sku}>
                      {item.sku} — {item.title}
                    </option>
                  ))}
              </select>
              {hasError('baseSku') && (
                <p
                  id={errorId('baseSku')}
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {getError('baseSku')}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor={fieldId('priority')}
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Priority
              </label>
              <input
                type="number"
                id={fieldId('priority')}
                name="priority"
                value={priorityValue}
                onChange={handlePriorityChange}
                disabled={disabled}
                min={1}
                max={10}
                step={1}
                aria-invalid={hasError('priority') ? 'true' : undefined}
                aria-describedby={hasError('priority') ? errorId('priority') : undefined}
                className={`${inputBaseClasses} ${hasError('priority') ? inputErrorBorder : inputNormalBorder}`}
              />
              {hasError('priority') && (
                <p
                  id={errorId('priority')}
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {getError('priority')}
                </p>
              )}
            </div>

            {/* Tailoring Emphasis (multi-select) */}
            <div className="sm:col-span-2 lg:col-span-3">
              <fieldset>
                <legend className="block text-sm font-medium text-neutral-700 mb-2">
                  Tailoring Emphasis
                </legend>
                <p className="text-xs text-neutral-500 mb-2">
                  Select dimensions to emphasize for this cohort target. Adjust weight (0–100) for each selected dimension.
                </p>
                {hasError('tailoringEmphasis') && (
                  <p
                    id={errorId('tailoringEmphasis')}
                    role="alert"
                    className="mb-2 text-xs text-red-600"
                  >
                    {getError('tailoringEmphasis')}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {TAILORING_DIMENSIONS.map((dimension) => {
                    const isSelected = selectedDimensions.includes(dimension);
                    const dimensionCheckboxId = fieldId(`tailoring-${dimension}`);

                    return (
                      <div key={dimension} className="flex flex-col gap-1">
                        <label
                          htmlFor={dimensionCheckboxId}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors duration-200 border ${
                            isSelected
                              ? 'bg-primary-50 text-primary-700 border-primary-300 hover:bg-primary-100'
                              : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                          }${disabled ? ' opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="checkbox"
                            id={dimensionCheckboxId}
                            checked={isSelected}
                            onChange={() => handleTailoringDimensionToggle(dimension)}
                            disabled={disabled}
                            className="sr-only"
                            aria-label={`${formatDimensionLabel(dimension)} tailoring emphasis`}
                          />
                          <span
                            className={`inline-block h-3 w-3 rounded-sm border flex-shrink-0 ${
                              isSelected
                                ? 'bg-primary-500 border-primary-500'
                                : 'bg-white border-neutral-300'
                            }`}
                            aria-hidden="true"
                          >
                            {isSelected && (
                              <svg
                                className="h-3 w-3 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={3}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.5 12.75l6 6 9-13.5"
                                />
                              </svg>
                            )}
                          </span>
                          {formatDimensionLabel(dimension)}
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-1 px-1">
                            <label
                              htmlFor={fieldId(`tailoring-weight-${dimension}`)}
                              className="sr-only"
                            >
                              {formatDimensionLabel(dimension)} weight
                            </label>
                            <input
                              type="range"
                              id={fieldId(`tailoring-weight-${dimension}`)}
                              min={0}
                              max={100}
                              step={5}
                              value={
                                target.tailoringEmphasis &&
                                target.tailoringEmphasis[dimension] &&
                                typeof target.tailoringEmphasis[dimension].weight === 'number'
                                  ? target.tailoringEmphasis[dimension].weight
                                  : 50
                              }
                              onChange={(e) =>
                                handleTailoringWeightChange(dimension, parseInt(e.target.value, 10))
                              }
                              disabled={disabled}
                              className="w-16 h-1.5 accent-primary-500"
                              aria-label={`${formatDimensionLabel(dimension)} weight`}
                            />
                            <span className="text-xs text-neutral-500 w-7 text-right font-mono">
                              {target.tailoringEmphasis &&
                              target.tailoringEmphasis[dimension] &&
                              typeof target.tailoringEmphasis[dimension].weight === 'number'
                                ? target.tailoringEmphasis[dimension].weight
                                : 50}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Summary footer */}
          <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-3">
            <svg
              className="h-3 w-3 text-neutral-400"
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
              Target #{index + 1}
              {cohortTypeValue && ` · ${getCohortLabel(cohortTypeValue)}`}
              {behavioralOverlayValue && ` · ${getBehavioralOverlayLabel(behavioralOverlayValue)}`}
              {baseSkuValue && ` · ${baseSkuValue}`}
              {selectedDimensions.length > 0 && ` · ${selectedDimensions.length} dimension${selectedDimensions.length === 1 ? '' : 's'} emphasized`}
            </p>
          </div>
        </div>
      )}
    </fieldset>
  );
}

CohortTargetForm.propTypes = {
  target: PropTypes.shape({
    cohortId: PropTypes.string,
    label: PropTypes.string,
    cohortType: PropTypes.string,
    behavioralOverlay: PropTypes.string,
    baseSku: PropTypes.string,
    priority: PropTypes.number,
    behavioralOverlays: PropTypes.arrayOf(PropTypes.string),
    tailoringEmphasis: PropTypes.object,
  }).isRequired,
  index: PropTypes.number.isRequired,
  catalogItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      sku: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  canRemove: PropTypes.bool,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  className: PropTypes.string,
};

CohortTargetForm.defaultProps = {
  canRemove: true,
  disabled: false,
  errors: undefined,
  className: undefined,
};

export default CohortTargetForm;