import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';

/**
 * @typedef {'pending' | 'generating' | 'complete' | 'error'} VariantStatus
 */

/**
 * @typedef {Object} VariantStatusEntry
 * @property {number} index - The variant index (0-based)
 * @property {string} label - The cohort target label
 * @property {VariantStatus} status - Current generation status
 * @property {string} [errorMessage] - Error message if status is 'error'
 */

/**
 * @typedef {Object} GenerationProgressProps
 * @property {number} total - Total number of variants to generate
 * @property {number} completed - Number of variants generated so far
 * @property {number} failed - Number of variants that failed to generate
 * @property {number} percent - Completion percentage (0-100)
 * @property {boolean} inProgress - Whether generation is currently in progress
 * @property {string|null} [currentCohort] - The cohort currently being processed
 * @property {Array<{ label: string, cohortId: string }>} [cohortTargets] - Array of cohort targets for per-variant status
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Returns the status icon SVG for a given variant status.
 *
 * @param {{ status: VariantStatus }} props
 * @returns {React.ReactElement}
 */
function StatusIcon({ status }) {
  switch (status) {
    case 'complete':
      return (
        <svg
          className="h-4 w-4 text-green-600"
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
      );
    case 'generating':
      return (
        <svg
          className="h-4 w-4 text-primary-500 animate-spin"
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
      );
    case 'error':
      return (
        <svg
          className="h-4 w-4 text-red-600"
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
      );
    case 'pending':
    default:
      return (
        <svg
          className="h-4 w-4 text-neutral-300"
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
            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      );
  }
}

StatusIcon.propTypes = {
  status: PropTypes.oneOf(['pending', 'generating', 'complete', 'error']).isRequired,
};

/**
 * Returns a human-readable label for a variant status.
 *
 * @param {VariantStatus} status - The variant status
 * @returns {string}
 */
function getStatusLabel(status) {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'generating':
      return 'Generating…';
    case 'error':
      return 'Error';
    case 'pending':
    default:
      return 'Pending';
  }
}

/**
 * Returns the CSS classes for a variant status badge.
 *
 * @param {VariantStatus} status - The variant status
 * @returns {string}
 */
function getStatusBadgeClasses(status) {
  switch (status) {
    case 'complete':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'generating':
      return 'bg-primary-50 text-primary-700 border-primary-200';
    case 'error':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'pending':
    default:
      return 'bg-neutral-50 text-neutral-500 border-neutral-200';
  }
}

/**
 * Formats elapsed time in seconds to a human-readable string.
 *
 * @param {number} seconds - Elapsed time in seconds
 * @returns {string}
 */
function formatElapsedTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0.0s';
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}

/**
 * Derives per-variant status entries from progress props.
 *
 * @param {number} total - Total number of variants
 * @param {number} completed - Number completed
 * @param {number} failed - Number failed
 * @param {boolean} inProgress - Whether generation is in progress
 * @param {string|null} currentCohort - Current cohort being processed
 * @param {Array<{ label: string, cohortId: string }>} [cohortTargets] - Cohort target labels
 * @returns {VariantStatusEntry[]}
 */
function deriveVariantStatuses(total, completed, failed, inProgress, currentCohort, cohortTargets) {
  const statuses = [];
  const safeTotal = Math.max(0, Math.min(total, 10));

  for (let i = 0; i < safeTotal; i++) {
    const label =
      Array.isArray(cohortTargets) && cohortTargets[i] && typeof cohortTargets[i].label === 'string'
        ? cohortTargets[i].label
        : `Variant ${i + 1}`;

    /** @type {VariantStatus} */
    let status = 'pending';

    if (i < completed) {
      status = 'complete';
    } else if (i < completed + failed) {
      status = 'error';
    } else if (inProgress && i === completed + failed) {
      status = 'generating';
    }

    statuses.push({
      index: i,
      label,
      status,
    });
  }

  return statuses;
}

/**
 * Variant generation progress component: displays staggered fan-out animation
 * as up to 10 variants generate. Shows progress bar, per-variant status indicators
 * (pending/generating/complete/error), elapsed time, and completion count.
 * Uses skeleton loaders during generation.
 *
 * @param {GenerationProgressProps} props
 * @returns {React.ReactElement}
 */
function GenerationProgress({
  total,
  completed,
  failed,
  percent,
  inProgress,
  currentCohort,
  cohortTargets,
  className,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const prevInProgressRef = useRef(false);

  // Start/stop elapsed timer based on inProgress
  useEffect(() => {
    if (inProgress && !prevInProgressRef.current) {
      // Generation just started
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setElapsedSeconds(elapsed);
        }
      }, 100);
    }

    if (!inProgress && prevInProgressRef.current) {
      // Generation just finished
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (startTimeRef.current !== null) {
        const finalElapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedSeconds(finalElapsed);
      }
    }

    prevInProgressRef.current = inProgress;

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [inProgress]);

  // Announce progress changes
  useEffect(() => {
    if (inProgress && completed > 0) {
      setAnnouncement(
        `${completed} of ${total} variant${total === 1 ? '' : 's'} generated`,
      );
    }

    if (!inProgress && completed > 0 && total > 0) {
      const failedMsg = failed > 0 ? ` ${failed} failed.` : '';
      setAnnouncement(
        `Variant generation complete. ${completed} of ${total} variant${total === 1 ? '' : 's'} generated.${failedMsg}`,
      );
    }
  }, [inProgress, completed, total, failed]);

  const variantStatuses = useMemo(
    () => deriveVariantStatuses(total, completed, failed, inProgress, currentCohort, cohortTargets),
    [total, completed, failed, inProgress, currentCohort, cohortTargets],
  );

  const clampedPercent = Math.max(0, Math.min(100, percent));

  const isComplete = !inProgress && completed > 0 && total > 0;
  const hasErrors = failed > 0;

  const progressBarColor = hasErrors && isComplete
    ? 'bg-yellow-500'
    : isComplete
      ? 'bg-green-500'
      : 'bg-primary-500';

  if (total === 0 && !inProgress) {
    return null;
  }

  return (
    <section
      role="region"
      aria-label="Variant generation progress"
      className={`flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {inProgress ? (
            <svg
              className="h-5 w-5 text-primary-500 animate-spin"
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
          ) : isComplete ? (
            <svg
              className={`h-5 w-5 ${hasErrors ? 'text-yellow-500' : 'text-green-600'}`}
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
          ) : (
            <svg
              className="h-5 w-5 text-neutral-400"
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
          )}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              {inProgress
                ? 'Generating Variants…'
                : isComplete
                  ? 'Generation Complete'
                  : 'Variant Generation'}
            </h3>
            {currentCohort && inProgress && (
              <p className="text-xs text-neutral-500">
                Processing: {currentCohort}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {/* Elapsed time */}
          <div className="flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5 text-neutral-400"
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
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span className="text-xs font-mono text-neutral-500">
              {formatElapsedTime(elapsedSeconds)}
            </span>
          </div>

          {/* Completion count */}
          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
            {completed}/{total} complete
          </span>

          {/* Error count */}
          {hasErrors && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              {failed} failed
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600">
            Progress
          </span>
          <span className="text-xs font-mono text-neutral-500">
            {clampedPercent}%
          </span>
        </div>
        <div
          className="h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden"
          role="progressbar"
          aria-valuenow={clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Variant generation progress: ${clampedPercent}%`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${progressBarColor}`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>

      {/* Per-variant status indicators */}
      {variantStatuses.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium text-neutral-600">
            Variant Status
          </h4>
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
            role="list"
            aria-label="Per-variant generation status"
          >
            {variantStatuses.map((entry) => (
              <div
                key={entry.index}
                role="listitem"
                className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-all duration-300 ${getStatusBadgeClasses(entry.status)}${entry.status === 'generating' ? ' animate-pulse' : ''}`}
                style={{
                  animationDelay: `${entry.index * 100}ms`,
                }}
              >
                <StatusIcon status={entry.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" title={entry.label}>
                    {entry.label}
                  </p>
                  <p className="text-xs opacity-75">
                    {getStatusLabel(entry.status)}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs font-mono opacity-60">
                  #{entry.index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton loaders during generation */}
      {inProgress && (
        <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4">
          <p className="text-xs font-medium text-neutral-500">
            Generating variant previews…
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SkeletonLoader
              shape="rectangle"
              width="w-full"
              height="h-16"
              ariaLabel="Loading variant preview"
            />
            <SkeletonLoader
              shape="rectangle"
              width="w-full"
              height="h-16"
              ariaLabel="Loading variant preview"
            />
          </div>
          <SkeletonLoader
            shape="text"
            lines={2}
            ariaLabel="Loading variant details"
          />
        </div>
      )}

      {/* Completion summary */}
      {isComplete && (
        <div
          className={`flex items-start gap-2 rounded-md border px-4 py-3 ${
            hasErrors
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-green-200 bg-green-50'
          }`}
        >
          <svg
            className={`h-4 w-4 flex-shrink-0 mt-0.5 ${hasErrors ? 'text-yellow-600' : 'text-green-600'}`}
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
              d={
                hasErrors
                  ? 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'
                  : 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
              }
            />
          </svg>
          <div>
            <p className={`text-sm font-medium ${hasErrors ? 'text-yellow-800' : 'text-green-800'}`}>
              {completed} of {total} variant{total === 1 ? '' : 's'} generated successfully
              {hasErrors && ` · ${failed} failed`}
            </p>
            <p className={`text-xs ${hasErrors ? 'text-yellow-700' : 'text-green-700'}`}>
              Completed in {formatElapsedTime(elapsedSeconds)}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
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
          {inProgress
            ? `Generating ${total} PDP variant${total === 1 ? '' : 's'} with staggered fan-out…`
            : isComplete
              ? `${completed} variant${completed === 1 ? '' : 's'} ready for review in the gallery`
              : `${total} variant${total === 1 ? '' : 's'} queued for generation`}
        </p>
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

GenerationProgress.propTypes = {
  total: PropTypes.number.isRequired,
  completed: PropTypes.number.isRequired,
  failed: PropTypes.number.isRequired,
  percent: PropTypes.number.isRequired,
  inProgress: PropTypes.bool.isRequired,
  currentCohort: PropTypes.string,
  cohortTargets: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      cohortId: PropTypes.string.isRequired,
    }),
  ),
  className: PropTypes.string,
};

GenerationProgress.defaultProps = {
  currentCohort: null,
  cohortTargets: undefined,
  className: undefined,
};

export default GenerationProgress;