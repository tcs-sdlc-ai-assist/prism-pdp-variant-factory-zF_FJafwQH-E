import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * @typedef {Object} PriceBlockProps
 * @property {object} product - The product/catalog item to display pricing for
 * @property {string} [priceDisplay='standard'] - Price display mode ('standard', 'savings-highlight', 'member-price', 'volume-discount', 'student-discount', 'compare-at')
 * @property {boolean} [showSavings=false] - Whether to show savings amount
 * @property {boolean} [showMemberPrice=false] - Whether to show member-exclusive pricing
 * @property {string} [priceCallout=''] - Price-related callout text
 * @property {string} [primaryCTA='Add to Cart'] - Primary call-to-action button text
 * @property {string} [secondaryCTA='Save for Later'] - Secondary call-to-action button text
 * @property {string} [ctaTone='standard'] - CTA tone ('standard', 'urgent', 'value', 'premium', 'friendly')
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
 * Formats a number as a USD currency string.
 *
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '$0.00';
  }
  return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
 * PDP price block component: displays regular price, member price, savings amount,
 * and financing placeholder. Supports variant-specific emphasis (e.g., member price
 * highlighted for loyalty cohort). Accepts diff highlights prop for accent outline.
 *
 * @param {PriceBlockProps} props
 * @returns {React.ReactElement}
 */
function PriceBlock({
  product,
  priceDisplay = 'standard',
  showSavings = false,
  showMemberPrice = false,
  priceCallout = '',
  primaryCTA = 'Add to Cart',
  secondaryCTA = 'Save for Later',
  ctaTone = 'standard',
  diffHighlights,
  showDiffOutline = false,
  className,
}) {
  if (!product || typeof product !== 'object') {
    return (
      <div
        role="region"
        aria-label="Product pricing"
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <p className="text-sm text-neutral-500">No pricing data available.</p>
      </div>
    );
  }

  const price = typeof product.price === 'number' ? product.price : 0;
  const memberPrice = typeof product.memberPrice === 'number' ? product.memberPrice : null;
  const fulfillment = product.fulfillment || '';

  const savings = useMemo(() => {
    if (memberPrice !== null && price > memberPrice) {
      return price - memberPrice;
    }
    return 0;
  }, [price, memberPrice]);

  const monthlyEstimate = useMemo(() => {
    if (price > 0) {
      return (price / 24).toFixed(2);
    }
    return null;
  }, [price]);

  const isMemberPriceEmphasis =
    priceDisplay === 'member-price' || priceDisplay === 'savings-highlight' || priceDisplay === 'compare-at';

  const ctaClasses = useMemo(() => getCTAClasses(ctaTone), [ctaTone]);

  const containerDiffClass =
    showDiffOutline && diffHighlights && diffHighlights.hasChanges
      ? ' ring-1 ring-primary-300 ring-offset-2'
      : '';

  return (
    <section
      role="region"
      aria-label="Product pricing"
      className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm animate-fade-in${containerDiffClass}${className ? ` ${className}` : ''}`}
    >
      {/* Price callout */}
      {priceCallout && (
        <div
          className={`mb-3${getDiffOutlineClass(showDiffOutline, diffHighlights, 'priceCallout', 'price')}`}
        >
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <svg
              className="mr-1 h-3 w-3"
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
            {priceCallout}
          </span>
        </div>
      )}

      {/* Price display mode indicator */}
      {priceDisplay !== 'standard' && (
        <div className="mb-2">
          <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
            {priceDisplay.replace('-', ' ')} pricing
          </span>
        </div>
      )}

      {/* Main price section */}
      <div
        className={`flex flex-col gap-1${getDiffOutlineClass(showDiffOutline, diffHighlights, 'price', 'price')}`}
      >
        {/* Member price emphasis layout */}
        {isMemberPriceEmphasis && showMemberPrice && memberPrice !== null ? (
          <>
            <div
              className={`flex items-baseline gap-2${getDiffOutlineClass(showDiffOutline, diffHighlights, 'memberPrice', 'price')}`}
            >
              <span className="text-3xl font-bold text-primary-600">
                {formatCurrency(memberPrice)}
              </span>
              <span className="text-sm font-semibold text-primary-500">
                Member Price
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg text-neutral-400 line-through">
                {formatCurrency(price)}
              </span>
              <span className="text-sm text-neutral-500">Regular Price</span>
            </div>
          </>
        ) : (
          <>
            {/* Standard price layout */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-neutral-900">
                {formatCurrency(price)}
              </span>
            </div>
            {/* Member price as secondary */}
            {showMemberPrice && memberPrice !== null && (
              <div
                className={`flex items-baseline gap-2${getDiffOutlineClass(showDiffOutline, diffHighlights, 'memberPrice', 'price')}`}
              >
                <span className="text-lg font-semibold text-primary-600">
                  {formatCurrency(memberPrice)}
                </span>
                <span className="text-xs font-medium text-primary-500">
                  Member Price
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Savings callout */}
      {showSavings && savings > 0 && (
        <div
          className={`mt-2${getDiffOutlineClass(showDiffOutline, diffHighlights, 'showSavings', 'price')}`}
        >
          <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-sm font-semibold text-green-800">
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
                d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5"
              />
            </svg>
            You save {formatCurrency(savings)}
          </span>
        </div>
      )}

      {/* Financing placeholder */}
      {monthlyEstimate && price >= 100 && (
        <div className="mt-3 border-t border-neutral-100 pt-3">
          <p className="text-xs text-neutral-500">
            Or as low as{' '}
            <span className="font-semibold text-neutral-700">
              ${monthlyEstimate}/mo
            </span>{' '}
            with 24-mo financing
            <span className="ml-1 text-neutral-400">
              <svg
                className="inline h-3 w-3"
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
            </span>
          </p>
        </div>
      )}

      {/* Fulfillment info */}
      {fulfillment && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
            <svg
              className="h-4 w-4 flex-shrink-0 text-green-600"
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
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
            <span>{fulfillment}</span>
          </div>
        </div>
      )}

      {/* CTA buttons moved to FulfillmentOptions to avoid duplication */}

      {/* Price display mode label for variant awareness */}
      {priceDisplay !== 'standard' && (
        <div className="mt-3 flex items-center gap-1">
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
            Tailored pricing: {priceDisplay.replace('-', ' ')}
          </span>
        </div>
      )}
    </section>
  );
}

PriceBlock.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string,
    sku: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    memberPrice: PropTypes.number,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    category: PropTypes.string,
    imageUrl: PropTypes.string,
    media: PropTypes.arrayOf(PropTypes.string),
    brand: PropTypes.string,
    badge: PropTypes.string,
    fulfillment: PropTypes.string,
    warranty: PropTypes.string,
  }),
  priceDisplay: PropTypes.oneOf([
    'standard',
    'savings-highlight',
    'member-price',
    'volume-discount',
    'student-discount',
    'compare-at',
  ]),
  showSavings: PropTypes.bool,
  showMemberPrice: PropTypes.bool,
  priceCallout: PropTypes.string,
  ctaTone: PropTypes.oneOf(['standard', 'urgent', 'value', 'premium', 'friendly']),
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

PriceBlock.defaultProps = {
  product: undefined,
  priceDisplay: 'standard',
  showSavings: false,
  showMemberPrice: false,
  priceCallout: '',
  ctaTone: 'standard',
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default PriceBlock;