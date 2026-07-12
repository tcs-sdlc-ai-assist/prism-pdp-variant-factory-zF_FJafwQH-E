import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';

/**
 * @typedef {Object} DiffHighlightProps
 * @property {import('@/services/diffEngine.js').DiffResult} [diffResult] - The diff result from the diff engine
 * @property {string} section - The tailoring dimension / section name to check for changes (e.g., 'price', 'badge', 'title')
 * @property {string} [cohortLabel=''] - Human-readable cohort label for the "changed for" tag
 * @property {boolean} [enabled] - Override for diff toggle (defaults to AppContext diffToggle)
 * @property {boolean} [showTag=true] - Whether to show the "changed for [cohort]" tag
 * @property {string} [tagPosition='top-right'] - Position of the change tag ('top-right', 'top-left', 'bottom-right', 'bottom-left')
 * @property {React.ReactNode} children - The PDP section content to wrap
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Checks whether a specific dimension has changes in the diff result.
 *
 * @param {import('@/services/diffEngine.js').DiffResult|null|undefined} diffResult - The diff result
 * @param {string} section - The section/dimension name to check
 * @returns {boolean} True if the section has changes
 */
function sectionHasChanges(diffResult, section) {
  if (!diffResult || typeof diffResult !== 'object') {
    return false;
  }

  if (!diffResult.hasChanges) {
    return false;
  }

  if (!section || typeof section !== 'string') {
    return false;
  }

  // Check dimensions array
  if (Array.isArray(diffResult.dimensions) && diffResult.dimensions.includes(section)) {
    return true;
  }

  // Check changesByDimension
  if (
    diffResult.changesByDimension &&
    typeof diffResult.changesByDimension === 'object' &&
    Array.isArray(diffResult.changesByDimension[section]) &&
    diffResult.changesByDimension[section].length > 0
  ) {
    return true;
  }

  // Check individual field changes for matching dimension
  if (Array.isArray(diffResult.changes)) {
    return diffResult.changes.some((change) => change.dimension === section);
  }

  return false;
}

/**
 * Returns the change count for a specific section from the diff result.
 *
 * @param {import('@/services/diffEngine.js').DiffResult|null|undefined} diffResult - The diff result
 * @param {string} section - The section/dimension name
 * @returns {number} Number of changes in this section
 */
function getSectionChangeCount(diffResult, section) {
  if (!diffResult || typeof diffResult !== 'object') {
    return 0;
  }

  if (
    diffResult.changesByDimension &&
    typeof diffResult.changesByDimension === 'object' &&
    Array.isArray(diffResult.changesByDimension[section])
  ) {
    return diffResult.changesByDimension[section].length;
  }

  if (Array.isArray(diffResult.changes)) {
    return diffResult.changes.filter((change) => change.dimension === section).length;
  }

  return 0;
}

/**
 * Returns the rationale for a section change from the diff result.
 *
 * @param {import('@/services/diffEngine.js').DiffResult|null|undefined} diffResult - The diff result
 * @param {string} section - The section/dimension name
 * @returns {string} The rationale string, or empty string
 */
function getSectionRationale(diffResult, section) {
  if (!diffResult || typeof diffResult !== 'object') {
    return '';
  }

  if (Array.isArray(diffResult.dimensionSummaries)) {
    const summary = diffResult.dimensionSummaries.find((s) => s.dimension === section);
    if (summary && typeof summary.rationale === 'string' && summary.rationale.length > 0) {
      return summary.rationale;
    }
  }

  if (
    diffResult.changesByDimension &&
    typeof diffResult.changesByDimension === 'object' &&
    Array.isArray(diffResult.changesByDimension[section])
  ) {
    const changeWithRationale = diffResult.changesByDimension[section].find(
      (c) => typeof c.rationale === 'string' && c.rationale.length > 0,
    );
    if (changeWithRationale) {
      return changeWithRationale.rationale;
    }
  }

  return '';
}

/**
 * Returns the CSS classes for the tag position.
 *
 * @param {string} position - The tag position
 * @returns {string} CSS classes for positioning
 */
function getTagPositionClasses(position) {
  switch (position) {
    case 'top-left':
      return 'top-0 left-0 -translate-y-1/2';
    case 'bottom-right':
      return 'bottom-0 right-0 translate-y-1/2';
    case 'bottom-left':
      return 'bottom-0 left-0 translate-y-1/2';
    case 'top-right':
    default:
      return 'top-0 right-0 -translate-y-1/2';
  }
}

/**
 * Formats a section/dimension name to a human-readable label.
 *
 * @param {string} section - The section name
 * @returns {string} Human-readable label
 */
function formatSectionLabel(section) {
  if (!section || typeof section !== 'string') {
    return '';
  }
  return section.charAt(0).toUpperCase() + section.slice(1);
}

/**
 * Diff highlight wrapper component: wraps PDP sections and applies accent-colored
 * outline border and 'changed for [cohort]' tag when diff is detected and diff
 * toggle is enabled. Accepts diffResult, section name, and cohort label props.
 *
 * When diff highlighting is disabled or no changes are detected for the given
 * section, the children are rendered without any visual modification.
 *
 * @param {DiffHighlightProps} props
 * @returns {React.ReactElement}
 */
function DiffHighlight({
  diffResult,
  section,
  cohortLabel = '',
  enabled,
  showTag = true,
  tagPosition = 'top-right',
  children,
  className,
}) {
  const { diffToggle } = useAppContext();

  const isEnabled = typeof enabled === 'boolean' ? enabled : diffToggle;

  const hasChanges = useMemo(
    () => sectionHasChanges(diffResult, section),
    [diffResult, section],
  );

  const changeCount = useMemo(
    () => getSectionChangeCount(diffResult, section),
    [diffResult, section],
  );

  const rationale = useMemo(
    () => getSectionRationale(diffResult, section),
    [diffResult, section],
  );

  const shouldHighlight = isEnabled && hasChanges;

  const tagPositionClasses = useMemo(
    () => getTagPositionClasses(tagPosition),
    [tagPosition],
  );

  // When not highlighting, render children without wrapper modifications
  if (!shouldHighlight) {
    return (
      <div className={className || undefined}>
        {children}
      </div>
    );
  }

  const tagLabel = cohortLabel
    ? `Changed for ${cohortLabel}`
    : `${formatSectionLabel(section)} changed`;

  return (
    <div
      className={`relative ring-2 ring-accent-500 ring-offset-2 rounded-lg transition-all duration-300 animate-fade-in${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={`Diff highlight: ${formatSectionLabel(section)} section${cohortLabel ? ` — changed for ${cohortLabel}` : ''}`}
    >
      {/* Change tag */}
      {showTag && (
        <div
          className={`absolute z-10 ${tagPositionClasses}`}
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-2.5 py-1 text-xs font-semibold text-neutral-900 shadow-sm whitespace-nowrap">
            <svg
              className="h-3 w-3 flex-shrink-0"
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
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
              />
            </svg>
            {tagLabel}
            {changeCount > 1 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full bg-neutral-900/20 px-1 text-xs font-bold">
                {changeCount}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Wrapped content */}
      {children}

      {/* Rationale tooltip footer */}
      {rationale && (
        <div className="border-t border-accent-200 bg-accent-50 px-3 py-2 rounded-b-lg">
          <div className="flex items-start gap-1.5">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0 text-accent-600 mt-0.5"
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
            <p className="text-xs text-neutral-700 leading-relaxed">
              <span className="font-medium text-neutral-800">Rationale:</span>{' '}
              {rationale}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

DiffHighlight.propTypes = {
  diffResult: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    changes: PropTypes.arrayOf(
      PropTypes.shape({
        field: PropTypes.string,
        from: PropTypes.any,
        to: PropTypes.any,
        changeType: PropTypes.string,
        dimension: PropTypes.string,
        rationale: PropTypes.string,
        weight: PropTypes.number,
      }),
    ),
    dimensionSummaries: PropTypes.arrayOf(
      PropTypes.shape({
        dimension: PropTypes.string,
        changeCount: PropTypes.number,
        changes: PropTypes.array,
        rationale: PropTypes.string,
        weight: PropTypes.number,
      }),
    ),
    totalChanges: PropTypes.number,
    dimensionsChanged: PropTypes.number,
    hasChanges: PropTypes.bool,
    changesByDimension: PropTypes.object,
  }),
  section: PropTypes.string.isRequired,
  cohortLabel: PropTypes.string,
  enabled: PropTypes.bool,
  showTag: PropTypes.bool,
  tagPosition: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DiffHighlight.defaultProps = {
  diffResult: undefined,
  cohortLabel: '',
  enabled: undefined,
  showTag: true,
  tagPosition: 'top-right',
  className: undefined,
};

export default DiffHighlight;