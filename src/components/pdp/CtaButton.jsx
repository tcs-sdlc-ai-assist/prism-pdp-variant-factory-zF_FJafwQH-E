import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * @typedef {Object} CtaButtonProps
 * @property {string} [primaryCTA='Add to Cart'] - Primary call-to-action button text
 * @property {string} [secondaryCTA='Save for Later'] - Secondary call-to-action button text
 * @property {string} [ctaTone='standard'] - CTA tone ('standard', 'urgent', 'value', 'premium', 'friendly')
 * @property {DiffHighlights} [diffHighlights] - Diff highlights for accent outline
 * @property {boolean} [showDiffOutline=false] - Whether to show diff accent outlines
 * @property {function} [onPrimaryClick] - Click handler for primary CTA
 * @property {function} [onSecondaryClick] - Click handler for secondary CTA
 * @property {boolean} [disabled=false] - Whether the buttons are disabled
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Determines whether a specific field has a diff highlight.
 *
 * @param {DiffHighlights|null|undefined} diffHighlights - The diff highlights object
 * @param {string} field - The field name to check
 * @returns {boolean}
 */
function hasFieldDiff(diffHighlights, field) {
  if (!diffHighlights || !Array.isArray(diffHighlights.fields)) {
    return false;
  }
  return diffHighlights.fields.includes(field);
}

/**
 * Determines whether a specific dimension has a diff highlight.
 *
 * @param {DiffHighlights|null|undefined} diffHighlights - The diff highlights object
 * @param {string} dimension - The dimension name to check
 * @returns {boolean}
 */
function hasDimensionDiff(diffHighlights, dimension) {
  if (!diffHighlights || !Array.isArray(diffHighlights.dimensions)) {
    return false;
  }
  return diffHighlights.dimensions.includes(dimension);
}

/**
 * Returns the diff outline class string if diff highlighting is active for the given field/dimension.
 *
 * @param {boolean} showDiffOutline - Whether diff outlines are enabled
 * @param {DiffHighlights|null|undefined} diffHighlights - The diff highlights object
 * @param {string} field - The field name to check
 * @param {string} [dimension] - The dimension name to check
 * @returns {string} CSS class string for diff outline, or empty string
 */
function getDiffOutlineClass(showDiffOutline, diffHighlights, field, dimension) {
  if (!showDiffOutline || !diffHighlights || !diffHighlights.hasChanges) {
    return '';
  }
  if (hasFieldDiff(diffHighlights, field) || (dimension && hasDimensionDiff(diffHighlights, dimension))) {
    return ' ring-2 ring-accent-500 ring-offset-1 rounded-md';
  }
  return '';
}

/**
 * Returns the CTA button color classes based on the tone.
 *
 * @param {string} tone - The CTA tone
 * @returns {{ primary: string, secondary: string }}
 */
function getCTAClasses(tone) {
  switch (tone) {
    case 'urgent':
      return {
        primary:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
        secondary:
          'text-red-700 ring-red-300 hover:bg-red-50 focus-visible:outline-red-600',
      };
    case 'value':
      return {
        primary:
          'bg-green-600 text-white hover:bg-green-700 focus-visible:outline-green-600',
        secondary:
          'text-green-700 ring-green-300 hover:bg-green-50 focus-visible:outline-green-600',
      };
    case 'premium':
      return {
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-600',
        secondary:
          'text-primary-700 ring-primary-300 hover:bg-primary-50 focus-visible:outline-primary-600',
      };
    case 'friendly':
      return {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-primary-500',
        secondary:
          'text-primary-600 ring-primary-200 hover:bg-primary-50 focus-visible:outline-primary-500',
      };
    case 'standard':
    default:
      return {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-primary-500',
        secondary:
          'text-neutral-700 ring-neutral-300 hover:bg-neutral-50 focus-visible:outline-primary-500',
      };
  }
}

/**
 * Returns a human-readable label for the CTA tone.
 *
 * @param {string} tone - The CTA tone
 * @returns {string}
 */
function getToneLabel(tone) {
  switch (tone) {
    case 'urgent':
      return 'Urgent';
    case 'value':
      return 'Value';
    case 'premium':
      return 'Premium';
    case 'friendly':
      return 'Friendly';
    case 'standard':
    default:
      return 'Standard';
  }
}

/**
 * PDP call-to-action button component: 'Add to Cart' primary button with
 * variant-specific copy changes (e.g., 'Grab This Deal' for deal-seeker,
 * 'Add to Gift List' for gift-shopper). Supports diff highlights prop for
 * accent outline. Accessible with proper ARIA labels.
 *
 * @param {CtaButtonProps} props
 * @returns {React.ReactElement}
 */
function CtaButton({
  primaryCTA = 'Add to Cart',
  secondaryCTA = 'Save for Later',
  ctaTone = 'standard',
  diffHighlights,
  showDiffOutline = false,
  onPrimaryClick,
  onSecondaryClick,
  disabled = false,
  className,
}) {
  const ctaClasses = useMemo(() => getCTAClasses(ctaTone), [ctaTone]);

  const isCustomCTA = primaryCTA !== 'Add to Cart' || secondaryCTA !== 'Save for Later';
  const isCustomTone = ctaTone !== 'standard';

  const containerDiffClass = getDiffOutlineClass(
    showDiffOutline,
    diffHighlights,
    'primaryCTA',
    'title',
  );

  const secondaryDiffClass = getDiffOutlineClass(
    showDiffOutline,
    diffHighlights,
    'secondaryCTA',
    'title',
  );

  const toneDiffClass = getDiffOutlineClass(
    showDiffOutline,
    diffHighlights,
    'ctaTone',
    'title',
  );

  return (
    <div
      role="group"
      aria-label="Product actions"
      className={`flex flex-col gap-2 sm:flex-row animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Primary CTA */}
      <button
        type="button"
        onClick={onPrimaryClick}
        disabled={disabled}
        aria-label={primaryCTA}
        className={`inline-flex flex-1 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold shadow-sm transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${ctaClasses.primary}${containerDiffClass}${toneDiffClass}${disabled ? ' opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Cart icon for standard Add to Cart */}
        {primaryCTA === 'Add to Cart' && (
          <svg
            className="mr-2 h-4 w-4"
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
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
        )}

        {/* Deal/tag icon for deal-oriented CTAs */}
        {(primaryCTA === 'Grab This Deal' || primaryCTA === 'Get This Deal' || primaryCTA === 'Get Student Price') && (
          <svg
            className="mr-2 h-4 w-4"
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
              d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6h.008v.008H6V6Z"
            />
          </svg>
        )}

        {/* Gift icon for gift-oriented CTAs */}
        {primaryCTA === 'Buy as Gift' && (
          <svg
            className="mr-2 h-4 w-4"
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
              d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
            />
          </svg>
        )}

        {/* Member/star icon for member-oriented CTAs */}
        {primaryCTA === 'Claim Member Price' && (
          <svg
            className="mr-2 h-4 w-4"
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
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
        )}

        {/* Repeat icon for returning customer CTAs */}
        {primaryCTA === 'Buy Again' && (
          <svg
            className="mr-2 h-4 w-4"
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
        )}

        {/* Document icon for business CTAs */}
        {primaryCTA === 'Request Quote' && (
          <svg
            className="mr-2 h-4 w-4"
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
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
        )}

        {/* Generic buy icon for Buy Now */}
        {primaryCTA === 'Buy Now' && (
          <svg
            className="mr-2 h-4 w-4"
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
              d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
        )}

        {primaryCTA}
      </button>

      {/* Secondary CTA */}
      <button
        type="button"
        onClick={onSecondaryClick}
        disabled={disabled}
        aria-label={secondaryCTA}
        className={`inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium shadow-sm ring-1 ring-inset transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${ctaClasses.secondary}${secondaryDiffClass}${toneDiffClass}${disabled ? ' opacity-50 cursor-not-allowed' : ''}`}
      >
        {secondaryCTA}
      </button>

      {/* Tailored CTA indicator */}
      {(isCustomCTA || isCustomTone) && (
        <div className="flex items-center gap-1 self-center sm:self-auto">
          <svg
            className="h-3 w-3 text-primary-400"
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
          <span className="text-xs text-neutral-400">
            {isCustomTone ? `${getToneLabel(ctaTone)} tone` : 'Tailored CTA'}
          </span>
        </div>
      )}
    </div>
  );
}

CtaButton.propTypes = {
  primaryCTA: PropTypes.string,
  secondaryCTA: PropTypes.string,
  ctaTone: PropTypes.oneOf(['standard', 'urgent', 'value', 'premium', 'friendly']),
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  onPrimaryClick: PropTypes.func,
  onSecondaryClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

CtaButton.defaultProps = {
  primaryCTA: 'Add to Cart',
  secondaryCTA: 'Save for Later',
  ctaTone: 'standard',
  diffHighlights: undefined,
  showDiffOutline: false,
  onPrimaryClick: undefined,
  onSecondaryClick: undefined,
  disabled: false,
  className: undefined,
};

export default CtaButton;