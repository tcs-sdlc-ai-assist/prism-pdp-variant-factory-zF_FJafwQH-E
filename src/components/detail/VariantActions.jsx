import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { exportVariantManifest } from '@/services/manifestExporter.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import { ROUTE_PATHS } from '@/constants/constants.js';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';

/**
 * @typedef {Object} VariantActionsProps
 * @property {object} variant - The variant object to act upon
 * @property {boolean} [disabled=false] - Whether all action buttons are disabled
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Variant detail action bar component: renders 'Package variant' (export single manifest),
 * 'View diff from control' (toggle diff highlighting), and 'Back to Gallery' navigation button.
 * Uses manifestExporter for export action.
 *
 * @param {VariantActionsProps} props
 * @returns {React.ReactElement}
 */
function VariantActions({ variant, disabled = false, className }) {
  const navigate = useNavigate();
  const { diffToggle, toggleDiff } = useAppContext();
  const { announceToScreenReader } = useAccessibility();

  const [exportState, setExportState] = useState('idle');
  const [exportError, setExportError] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  const variantId = variant ? variant.variantId || variant.id || '' : '';
  const label = variant ? variant.label || variant.name || 'Variant' : 'Variant';

  const handleExport = useCallback(() => {
    if (!variant || typeof variant !== 'object' || disabled || exportState === 'exporting') {
      return;
    }

    setExportState('exporting');
    setExportError(null);

    try {
      const result = exportVariantManifest(variant);

      if (result.success) {
        setExportState('success');
        setAnnouncement(`Manifest exported for ${label}`);
        announceToScreenReader(`Manifest exported for ${label}`, 'polite');

        emitEvent(EVENT_TYPES.EXPORT_ACTION, {
          action: 'VariantActions:exportManifest',
          variantId,
          filename: result.filename,
        });

        setTimeout(() => {
          setExportState('idle');
        }, 3000);
      } else {
        const errorMsg = result.errors.length > 0
          ? result.errors.join('; ')
          : 'Export failed';
        setExportState('error');
        setExportError(errorMsg);
        setAnnouncement(`Export failed: ${errorMsg}`);
        announceToScreenReader(`Export failed: ${errorMsg}`, 'assertive');

        emitEvent(EVENT_TYPES.ERROR, {
          action: 'VariantActions:exportManifest',
          variantId,
          error: errorMsg,
        });

        setTimeout(() => {
          setExportState('idle');
          setExportError(null);
        }, 5000);
      }
    } catch (e) {
      const errorMsg = `Export error: ${e.message}`;
      setExportState('error');
      setExportError(errorMsg);
      setAnnouncement(errorMsg);
      announceToScreenReader(errorMsg, 'assertive');

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'VariantActions:exportManifest',
        variantId,
        error: e.message,
      });

      setTimeout(() => {
        setExportState('idle');
        setExportError(null);
      }, 5000);
    }
  }, [variant, disabled, exportState, variantId, label, announceToScreenReader]);

  const handleToggleDiff = useCallback(() => {
    if (disabled) {
      return;
    }

    toggleDiff();

    const nextState = !diffToggle;
    const message = nextState
      ? 'Diff highlighting enabled'
      : 'Diff highlighting disabled';

    setAnnouncement(message);
    announceToScreenReader(message, 'polite');

    emitEvent(EVENT_TYPES.PDP_LOAD, {
      action: 'VariantActions:toggleDiff',
      variantId,
      diffEnabled: nextState,
    });
  }, [disabled, diffToggle, toggleDiff, variantId, announceToScreenReader]);

  const handleBackToGallery = useCallback(() => {
    navigate(ROUTE_PATHS.VARIANTS);
  }, [navigate]);

  return (
    <div
      role="toolbar"
      aria-label="Variant actions"
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Left: Back to Gallery */}
      <button
        type="button"
        onClick={handleBackToGallery}
        disabled={disabled}
        aria-label="Back to variant gallery"
        className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        Back to Gallery
      </button>

      {/* Right: Diff toggle + Export */}
      <div className="flex items-center gap-3">
        {/* Diff toggle button */}
        <button
          type="button"
          onClick={handleToggleDiff}
          disabled={disabled}
          aria-pressed={diffToggle}
          aria-label={diffToggle ? 'Disable diff highlighting from control' : 'Enable diff highlighting from control'}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium shadow-sm ring-1 ring-inset transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            diffToggle
              ? 'bg-accent-50 text-neutral-800 ring-accent-300 hover:bg-accent-100'
              : 'bg-white text-neutral-700 ring-neutral-300 hover:bg-neutral-50'
          }`}
        >
          <svg
            className={`h-4 w-4 ${diffToggle ? 'text-accent-600' : 'text-neutral-400'}`}
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
          {diffToggle ? 'Diff On' : 'View Diff'}
        </button>

        {/* Export manifest button */}
        <button
          type="button"
          onClick={handleExport}
          disabled={disabled || exportState === 'exporting' || !variant}
          aria-label={
            exportState === 'success'
              ? 'Manifest exported successfully'
              : exportState === 'error'
                ? 'Export failed — click to retry'
                : `Package variant manifest for ${label}`
          }
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            exportState === 'success'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : exportState === 'error'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          {exportState === 'exporting' ? (
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
              Exporting…
            </>
          ) : exportState === 'success' ? (
            <>
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Exported
            </>
          ) : exportState === 'error' ? (
            <>
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
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              Retry Export
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Package Variant
            </>
          )}
        </button>
      </div>

      {/* Export error message */}
      {exportError && (
        <div
          role="alert"
          className="w-full flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:col-span-2"
        >
          <svg
            className="h-4 w-4 flex-shrink-0 text-red-600 mt-0.5"
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
          <p className="text-xs text-red-700">{exportError}</p>
        </div>
      )}

      {/* Aria live region for announcements */}
      <AriaLiveRegion
        message={announcement}
        politeness="polite"
        atomic={true}
        clearAfterMs={5000}
      />
    </div>
  );
}

VariantActions.propTypes = {
  variant: PropTypes.shape({
    id: PropTypes.string,
    variantId: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.string,
    productId: PropTypes.string,
    sku: PropTypes.string,
    cohortId: PropTypes.string,
    cohortType: PropTypes.string,
    behavioralOverlay: PropTypes.string,
    baseSku: PropTypes.string,
    priority: PropTypes.number,
    controlFlag: PropTypes.bool,
    isActive: PropTypes.bool,
    weight: PropTypes.number,
    tailoring: PropTypes.object,
    variantPdp: PropTypes.object,
    diff: PropTypes.object,
    manifest: PropTypes.object,
    description: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

VariantActions.defaultProps = {
  variant: undefined,
  disabled: false,
  className: undefined,
};

export default VariantActions;