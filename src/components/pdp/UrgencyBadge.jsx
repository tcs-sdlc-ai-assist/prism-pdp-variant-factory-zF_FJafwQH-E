import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * @typedef {Object} UrgencyBadgeProps
 * @property {string[]} [badges] - Array of badge labels to display
 * @property {string} [urgencyLevel='none'] - Urgency level ('none', 'low', 'medium', 'high')
 * @property {string} [urgencyMessage] - Urgency message text
 * @property {string} [productBadge] - Original product badge from catalog item
 * @property {DiffHighlights} [diffHighlights] - Diff highlights for accent outline
 * @property {boolean} [showDiffOutline=false] - Whether to show diff accent outlines
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
 * Returns the color classes for a badge based on its label text.
 *
 * @param {string} badgeLabel - The badge label text
 * @returns {{ bg: string, text: string, icon: string }}
 */
function getBadgeColors(badgeLabel) {
  const label = (badgeLabel || '').toLowerCase();

  if (label.includes('best seller') || label.includes('top rated') || label.includes('expert pick')) {
    return {
      bg: 'bg-primary-500',
      text: 'text-white',
      icon: 'star',
    };
  }

  if (label.includes('low stock') || label.includes('limited') || label.includes('hurry')) {
    return {
      bg: 'bg-red-600',
      text: 'text-white',
      icon: 'clock',
    };
  }

  if (label.includes('member') || label.includes('vip') || label.includes('loyalty') || label.includes('exclusive')) {
    return {
      bg: 'bg-primary-600',
      text: 'text-white',
      icon: 'member',
    };
  }

  if (label.includes('price drop') || label.includes('clearance') || label.includes('best value') || label.includes('save')) {
    return {
      bg: 'bg-green-600',
      text: 'text-white',
      icon: 'tag',
    };
  }

  if (label.includes('new') || label.includes('release') || label.includes('just arrived')) {
    return {
      bg: 'bg-accent-500',
      text: 'text-neutral-900',
      icon: 'sparkle',
    };
  }

  if (label.includes('gift') || label.includes('top gift')) {
    return {
      bg: 'bg-pink-600',
      text: 'text-white',
      icon: 'gift',
    };
  }

  if (label.includes('deal') || label.includes('bundle') || label.includes('starter')) {
    return {
      bg: 'bg-green-600',
      text: 'text-white',
      icon: 'tag',
    };
  }

  if (label.includes('student') || label.includes('back to school') || label.includes('education')) {
    return {
      bg: 'bg-primary-500',
      text: 'text-white',
      icon: 'academic',
    };
  }

  if (label.includes('business') || label.includes('enterprise')) {
    return {
      bg: 'bg-neutral-700',
      text: 'text-white',
      icon: 'briefcase',
    };
  }

  if (label.includes('welcome') || label.includes('reorder') || label.includes('returning')) {
    return {
      bg: 'bg-primary-400',
      text: 'text-white',
      icon: 'refresh',
    };
  }

  if (label.includes('early access')) {
    return {
      bg: 'bg-primary-700',
      text: 'text-white',
      icon: 'sparkle',
    };
  }

  return {
    bg: 'bg-neutral-600',
    text: 'text-white',
    icon: 'default',
  };
}

/**
 * Renders the appropriate icon SVG for a badge.
 *
 * @param {{ icon: string }} props
 * @returns {React.ReactElement|null}
 */
function BadgeIcon({ icon }) {
  switch (icon) {
    case 'star':
      return (
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
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      );
    case 'clock':
      return (
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
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      );
    case 'member':
      return (
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
            d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
          />
        </svg>
      );
    case 'tag':
      return (
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
            d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 6h.008v.008H6V6Z"
          />
        </svg>
      );
    case 'gift':
      return (
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
            d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
          />
        </svg>
      );
    case 'sparkle':
      return (
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
      );
    case 'academic':
      return (
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
            d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
          />
        </svg>
      );
    case 'briefcase':
      return (
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
            d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      );
    case 'refresh':
      return (
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
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
          />
        </svg>
      );
    case 'default':
    default:
      return (
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
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      );
  }
}

BadgeIcon.propTypes = {
  icon: PropTypes.string.isRequired,
};

/**
 * Returns the urgency bar color classes based on urgency level.
 *
 * @param {string} urgencyLevel - The urgency level
 * @returns {{ bar: string, text: string, bg: string }}
 */
function getUrgencyColors(urgencyLevel) {
  switch (urgencyLevel) {
    case 'high':
      return {
        bar: 'bg-red-600',
        text: 'text-red-800',
        bg: 'bg-red-50',
      };
    case 'medium':
      return {
        bar: 'bg-yellow-500',
        text: 'text-yellow-800',
        bg: 'bg-yellow-50',
      };
    case 'low':
      return {
        bar: 'bg-yellow-300',
        text: 'text-yellow-700',
        bg: 'bg-yellow-50',
      };
    case 'none':
    default:
      return {
        bar: '',
        text: '',
        bg: '',
      };
  }
}

/**
 * Returns a human-readable label for the urgency level.
 *
 * @param {string} urgencyLevel - The urgency level
 * @returns {string}
 */
function getUrgencyLabel(urgencyLevel) {
  switch (urgencyLevel) {
    case 'high':
      return 'High urgency';
    case 'medium':
      return 'Medium urgency';
    case 'low':
      return 'Low urgency';
    case 'none':
    default:
      return 'No urgency';
  }
}

/**
 * PDP urgency/social proof badge component: displays contextual badges like
 * 'Best Seller', 'Low Stock', 'Member Exclusive', 'Top Rated'. Supports
 * variant-specific badge selection based on cohort/behavior. Accepts diff
 * highlights prop for accent outline.
 *
 * @param {UrgencyBadgeProps} props
 * @returns {React.ReactElement|null}
 */
function UrgencyBadge({
  badges,
  urgencyLevel = 'none',
  urgencyMessage,
  productBadge,
  diffHighlights,
  showDiffOutline = false,
  className,
}) {
  const resolvedBadges = useMemo(() => {
    if (Array.isArray(badges) && badges.length > 0) {
      return badges.filter((b) => typeof b === 'string' && b.trim().length > 0);
    }
    if (productBadge && typeof productBadge === 'string' && productBadge.trim().length > 0) {
      return [productBadge];
    }
    return [];
  }, [badges, productBadge]);

  const hasUrgency = urgencyLevel !== 'none' && urgencyMessage && typeof urgencyMessage === 'string' && urgencyMessage.trim().length > 0;
  const hasBadges = resolvedBadges.length > 0;
  const isCustomBadges = Array.isArray(badges) && badges.length > 0;

  if (!hasBadges && !hasUrgency) {
    return null;
  }

  const urgencyColors = getUrgencyColors(urgencyLevel);

  const containerDiffClass =
    showDiffOutline && diffHighlights && diffHighlights.hasChanges
      ? ' ring-1 ring-primary-300 ring-offset-2'
      : '';

  return (
    <div
      role="region"
      aria-label="Product badges and urgency"
      className={`flex flex-col gap-2 animate-fade-in${containerDiffClass}${className ? ` ${className}` : ''}`}
    >
      {/* Badge pills */}
      {hasBadges && (
        <div
          className={`flex flex-wrap items-center gap-2${getDiffOutlineClass(showDiffOutline, diffHighlights, 'badges', 'badge')}`}
          role="list"
          aria-label={`Product badges — ${resolvedBadges.length} badge${resolvedBadges.length === 1 ? '' : 's'}`}
        >
          {resolvedBadges.map((badgeLabel, index) => {
            const colors = getBadgeColors(badgeLabel);
            return (
              <span
                key={`${badgeLabel}-${index}`}
                role="listitem"
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm ${colors.bg} ${colors.text}${getDiffOutlineClass(showDiffOutline, diffHighlights, 'badge', 'badge')}`}
              >
                <BadgeIcon icon={colors.icon} />
                {badgeLabel}
              </span>
            );
          })}
        </div>
      )}

      {/* Urgency message bar */}
      {hasUrgency && (
        <div
          className={`flex items-center gap-2 rounded-md px-3 py-2 ${urgencyColors.bg}${getDiffOutlineClass(showDiffOutline, diffHighlights, 'urgencyMessage', 'promotion')}`}
          role="status"
          aria-live="polite"
        >
          {urgencyLevel === 'high' && (
            <svg
              className={`h-4 w-4 flex-shrink-0 ${urgencyColors.text}`}
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
          )}
          {urgencyLevel === 'medium' && (
            <svg
              className={`h-4 w-4 flex-shrink-0 ${urgencyColors.text}`}
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
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          )}
          {urgencyLevel === 'low' && (
            <svg
              className={`h-4 w-4 flex-shrink-0 ${urgencyColors.text}`}
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
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
          )}
          <p className={`text-xs font-medium ${urgencyColors.text}`}>
            {urgencyMessage}
          </p>
        </div>
      )}

      {/* Tailored badge indicator */}
      {isCustomBadges && (
        <div className="flex items-center gap-1">
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
            Tailored badges
            {hasUrgency && ` · ${getUrgencyLabel(urgencyLevel)}`}
          </span>
        </div>
      )}
    </div>
  );
}

UrgencyBadge.propTypes = {
  badges: PropTypes.arrayOf(PropTypes.string),
  urgencyLevel: PropTypes.oneOf(['none', 'low', 'medium', 'high']),
  urgencyMessage: PropTypes.string,
  productBadge: PropTypes.string,
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

UrgencyBadge.defaultProps = {
  badges: undefined,
  urgencyLevel: 'none',
  urgencyMessage: undefined,
  productBadge: undefined,
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default UrgencyBadge;