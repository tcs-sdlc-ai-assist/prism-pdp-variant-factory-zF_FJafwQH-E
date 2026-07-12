import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * @typedef {Object} ProductHeroProps
 * @property {object} product - The product/catalog item to display
 * @property {string} [layout='standard'] - Hero layout variant ('standard', 'price-forward', 'media-rich', 'spec-heavy', 'social-proof', 'urgency')
 * @property {string} [primaryFocus='media'] - The primary content area to emphasize
 * @property {string[]} [badges] - Array of badge labels to display
 * @property {string} [urgencyLevel='none'] - Urgency level ('none', 'low', 'medium', 'high')
 * @property {string} [urgencyMessage] - Urgency message text
 * @property {DiffHighlights} [diffHighlights] - Diff highlights for accent outline
 * @property {boolean} [showDiffOutline=false] - Whether to show diff accent outlines
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Renders a star rating display with filled, half, and empty stars.
 *
 * @param {{ rating: number, maxStars?: number }} props
 * @returns {React.ReactElement}
 */
function StarRating({ rating, maxStars = 5 }) {
  const clampedRating = Math.max(0, Math.min(maxStars, rating));

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    const filled = clampedRating >= i;
    const halfFilled = !filled && clampedRating >= i - 0.5;

    stars.push(
      <svg
        key={i}
        className={`h-4 w-4 flex-shrink-0 ${
          filled
            ? 'text-accent-500'
            : halfFilled
              ? 'text-accent-400'
              : 'text-neutral-300'
        }`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
          clipRule="evenodd"
        />
      </svg>,
    );
  }

  return (
    <div className="flex items-center gap-0.5" aria-label={`${clampedRating} out of ${maxStars} stars`}>
      {stars}
    </div>
  );
}

StarRating.propTypes = {
  rating: PropTypes.number.isRequired,
  maxStars: PropTypes.number,
};

StarRating.defaultProps = {
  maxStars: 5,
};

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
 * PDP hero section component: displays product image placeholder, title,
 * rating stars, review count, and category badge. Supports variant-specific
 * layout transformations (e.g., image size, badge emphasis). Accepts diff
 * highlights prop for accent outline.
 *
 * @param {ProductHeroProps} props
 * @returns {React.ReactElement}
 */
function ProductHero({
  product,
  layout = 'standard',
  primaryFocus = 'media',
  badges,
  urgencyLevel = 'none',
  urgencyMessage,
  diffHighlights,
  showDiffOutline = false,
  className,
}) {
  if (!product || typeof product !== 'object') {
    return (
      <div
        role="region"
        aria-label="Product hero"
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <p className="text-sm text-neutral-500">No product data available.</p>
      </div>
    );
  }

  const title = product.title || 'Untitled Product';
  const imageUrl = product.imageUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  const rating = typeof product.rating === 'number' ? product.rating : 0;
  const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : 0;
  const category = product.category || '';
  const brand = product.brand || '';
  const badge = product.badge || '';

  const resolvedBadges = useMemo(() => {
    if (Array.isArray(badges) && badges.length > 0) {
      return badges;
    }
    if (badge) {
      return [badge];
    }
    return [];
  }, [badges, badge]);

  const isMediaRich = layout === 'media-rich';
  const isSpecHeavy = layout === 'spec-heavy';
  const isPriceForward = layout === 'price-forward';

  const imageColClass = isMediaRich
    ? 'md:col-span-7'
    : isSpecHeavy
      ? 'md:col-span-4'
      : 'md:col-span-5';

  const infoColClass = isMediaRich
    ? 'md:col-span-5'
    : isSpecHeavy
      ? 'md:col-span-8'
      : 'md:col-span-7';

  const urgencyColorMap = {
    none: '',
    low: 'border-yellow-200',
    medium: 'border-yellow-400',
    high: 'border-red-400',
  };

  const urgencyBorderClass = urgencyColorMap[urgencyLevel] || '';

  const containerDiffClass = showDiffOutline && diffHighlights && diffHighlights.hasChanges
    ? ' ring-1 ring-primary-300 ring-offset-2'
    : '';

  return (
    <section
      role="region"
      aria-label={`Product hero: ${title}`}
      className={`rounded-lg border bg-white shadow-sm overflow-hidden animate-fade-in ${urgencyBorderClass || 'border-neutral-200'}${containerDiffClass}${className ? ` ${className}` : ''}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Image Section */}
        <div
          className={`${imageColClass} relative bg-neutral-100${getDiffOutlineClass(showDiffOutline, diffHighlights, 'imageUrl', 'media')}`}
        >
          <div className="aspect-[3/2] w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Badges overlay */}
          {resolvedBadges.length > 0 && (
            <div
              className={`absolute top-3 left-3 flex flex-wrap gap-1.5${getDiffOutlineClass(showDiffOutline, diffHighlights, 'badge', 'badge')}`}
            >
              {resolvedBadges.map((badgeLabel, index) => (
                <span
                  key={`${badgeLabel}-${index}`}
                  className="inline-flex items-center rounded-md bg-primary-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
                >
                  {badgeLabel}
                </span>
              ))}
            </div>
          )}

          {/* Urgency message overlay */}
          {urgencyLevel !== 'none' && urgencyMessage && (
            <div
              className={`absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-medium ${
                urgencyLevel === 'high'
                  ? 'bg-red-600 text-white'
                  : urgencyLevel === 'medium'
                    ? 'bg-yellow-500 text-neutral-900'
                    : 'bg-yellow-100 text-yellow-800'
              }${getDiffOutlineClass(showDiffOutline, diffHighlights, 'urgencyMessage', 'promotion')}`}
            >
              {urgencyMessage}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className={`${infoColClass} flex flex-col justify-center p-6 md:p-8`}>
          {/* Category badge */}
          {category && (
            <div className={`mb-3${getDiffOutlineClass(showDiffOutline, diffHighlights, 'category')}`}>
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {category}
              </span>
            </div>
          )}

          {/* Brand */}
          {brand && (
            <p
              className={`text-xs font-semibold uppercase tracking-wider text-primary-500 mb-1${getDiffOutlineClass(showDiffOutline, diffHighlights, 'brand')}`}
            >
              {brand}
            </p>
          )}

          {/* Title */}
          <h2
            className={`text-lg font-bold text-neutral-900 leading-snug sm:text-xl md:text-2xl${getDiffOutlineClass(showDiffOutline, diffHighlights, 'title', 'title')}`}
          >
            {title}
          </h2>

          {/* Rating and review count */}
          <div
            className={`mt-3 flex items-center gap-2${getDiffOutlineClass(showDiffOutline, diffHighlights, 'rating', 'rating')}`}
          >
            <StarRating rating={rating} />
            <span className="text-sm font-medium text-neutral-700">
              {rating.toFixed(1)}
            </span>
            {reviewCount > 0 && (
              <span className="text-sm text-neutral-500">
                ({reviewCount.toLocaleString()} review{reviewCount === 1 ? '' : 's'})
              </span>
            )}
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="mt-2 text-xs text-neutral-400 font-mono">
              SKU: {product.sku}
            </p>
          )}

          {/* Layout indicator for variant awareness */}
          {layout !== 'standard' && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                <svg
                  className="h-3 w-3"
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
                {layout.replace('-', ' ')} layout
                {primaryFocus !== 'media' && ` · ${primaryFocus} focus`}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

ProductHero.propTypes = {
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
  }),
  layout: PropTypes.oneOf([
    'standard',
    'price-forward',
    'media-rich',
    'spec-heavy',
    'social-proof',
    'urgency',
  ]),
  primaryFocus: PropTypes.string,
  badges: PropTypes.arrayOf(PropTypes.string),
  urgencyLevel: PropTypes.oneOf(['none', 'low', 'medium', 'high']),
  urgencyMessage: PropTypes.string,
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

ProductHero.defaultProps = {
  product: undefined,
  layout: 'standard',
  primaryFocus: 'media',
  badges: undefined,
  urgencyLevel: 'none',
  urgencyMessage: undefined,
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default ProductHero;