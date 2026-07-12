import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { exportBulkVariantManifests } from '@/services/manifestExporter.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';

/**
 * @typedef {'idle' | 'exporting' | 'success' | 'error'} ExportState
 */

/**
 * @typedef {Object} BulkExportButtonProps
 * @property {Array<object>} [variants] - Array of variant objects to export (defaults to context variants)
 * @property {boolean} [disabled=false] - Whether the button is disabled
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Bulk export button component: renders a button in the gallery view that exports
 * all variant manifests as a combined JSON file. Uses manifestExporter.exportBulk().
 * Shows loading state during export and success/error feedback.
 *
 * @param {BulkExportButtonProps} props
 * @returns {React.ReactElement}
 */
function BulkExportButton({ variants: variantsProp, disabled = false, className }) {
  const { variants: contextVariants } = useAppContext();
  const { announceToScreenReader } = useAccessibility();

  const [exportState, setExportState] = useState('idle');
  const [exportError, setExportError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [exportedCount, setExportedCount] = useState(0);

  const variants = Array.isArray(variantsProp) ? variantsProp : contextVariants;
  const hasVariants = Array.isArray(variants) && variants.length > 0;
  const variantCount = hasVariants ? variants.length : 0;

  const handleExport = useCallback(() => {
    if (!hasVariants || disabled || exportState === 'exporting') {
      return;
    }

    setExportState('exporting');
    setExportError(null);
    setExportedCount(0);

    try {
      const result = exportBulkVariantManifests(variants);

      if (result.success) {
        setExportState('success');
        setExportedCount(result.exportedCount);

        const message = `Successfully exported ${result.exportedCount} variant manifest${result.exportedCount === 1 ? '' : 's'}`;
        setAnnouncement(message);
        announceToScreenReader(message, 'polite');

        emitEvent(EVENT_TYPES.EXPORT_ACTION, {
          action: 'BulkExportButton:export',
          exportedCount: result.exportedCount,
          filename: result.filename,
        });

        setTimeout(() => {
          setExportState('idle');
          setExportedCount(0);
        }, 3000);
      } else {
        const errorMsg = result.errors.length > 0
          ? result.errors.join('; ')
          : 'Bulk export failed';
        setExportState('error');
        setExportError(errorMsg);

        const message = `Export failed: ${errorMsg}`;
        setAnnouncement(message);
        announceToScreenReader(message, 'assertive');

        emitEvent(EVENT_TYPES.ERROR, {
          action: 'BulkExportButton:export',
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
        action: 'BulkExportButton:export',
        error: e.message,
      });

      setTimeout(() => {
        setExportState('idle');
        setExportError(null);
      }, 5000);
    }
  }, [hasVariants, disabled, exportState, variants, announceToScreenReader]);

  return (
    <div
      className={`inline-flex flex-col gap-2 animate-fade-in${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled || !hasVariants || exportState === 'exporting'}
        aria-label={
          exportState === 'success'
            ? `${exportedCount} manifest${exportedCount === 1 ? '' : 's'} exported successfully`
            : exportState === 'error'
              ? 'Export failed — click to retry'
              : `Export all ${variantCount} variant manifest${variantCount === 1 ? '' : 's'} as JSON`
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
            Exported {exportedCount} Manifest{exportedCount === 1 ? '' : 's'}
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
            Export All ({variantCount})
          </>
        )}
      </button>

      {/* Export error message */}
      {exportError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2"
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

BulkExportButton.propTypes = {
  variants: PropTypes.arrayOf(
    PropTypes.shape({
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
  ),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

BulkExportButton.defaultProps = {
  variants: undefined,
  disabled: false,
  className: undefined,
};

export default BulkExportButton;