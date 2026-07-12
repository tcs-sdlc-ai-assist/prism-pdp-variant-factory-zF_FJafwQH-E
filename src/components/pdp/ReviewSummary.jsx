import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * @typedef {Object} ReviewSummaryProps
 * @property {object} product - The product/catalog item to display reviews for
 * @property {string} [socialProofDisplay='standard'] - Social proof display mode ('standard', 'expanded', 'expert-focused', 'value-focused', 'minimal')
 * @property {boolean} [showReviewCount=true] - Whether to show total review count
 * @property {boolean} [showExpertReviews=false] - Whether to highlight expert reviews
 * @property {string} [reviewFilter='none'] - Review filter strategy ('none', 'positive', 'detailed', 'expert', 'value-mention', 'recent')
 * @property {number} [maxHighlightedReviews=3] - Maximum number of highlighted reviews
 * @property {string} [reviewSortBy='relevance'] - Sort criteria ('relevance', 'rating', 'recency', 'helpfulness')
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
 * Generates a deterministic seeded pseudo-random number from a string seed.
 *
 * @param {string} seed - The seed string
 * @returns {number} A number between 0 and 1
 */
function seededRandom(seed) {
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

/**
 * Generates a deterministic rating distribution from a product's rating and review count.
 *
 * @param {number} rating - Average rating (0-5)
 * @param {number} reviewCount - Total number of reviews
 * @returns {Array<{ stars: number, count: number, percent: number }>}
 */
function generateRatingDistribution(rating, reviewCount) {
  if (reviewCount <= 0 || rating <= 0) {
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: 0,
      percent: 0,
    }));
  }

  const clampedRating = Math.max(0, Math.min(5, rating));

  // Deterministic distribution based on average rating
  const weights = [5, 4, 3, 2, 1].map((stars) => {
    const distance = Math.abs(stars - clampedRating);
    return Math.max(0.02, Math.exp(-distance * 1.2));
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalized = weights.map((w) => w / totalWeight);

  let remaining = reviewCount;
  const counts = normalized.map((n, i) => {
    if (i === normalized.length - 1) {
      return remaining;
    }
    const count = Math.round(reviewCount * n);
    remaining -= count;
    return count;
  });

  return [5, 4, 3, 2, 1].map((stars, index) => ({
    stars,
    count: Math.max(0, counts[index]),
    percent: reviewCount > 0 ? Math.round((Math.max(0, counts[index]) / reviewCount) * 100) : 0,
  }));
}

/**
 * @typedef {Object} MockReview
 * @property {string} id - Review identifier
 * @property {string} author - Reviewer name
 * @property {number} rating - Review rating (1-5)
 * @property {string} excerpt - Review excerpt text
 * @property {string} date - Review date string
 * @property {boolean} verified - Whether the reviewer is verified
 * @property {boolean} expert - Whether this is an expert review
 * @property {string} tag - Review tag/category
 */

/**
 * Generates deterministic mock review excerpts based on product and filter settings.
 *
 * @param {object} product - The product object
 * @param {string} reviewFilter - The review filter strategy
 * @param {number} maxReviews - Maximum number of reviews to return
 * @returns {MockReview[]}
 */
function generateMockReviews(product, reviewFilter, maxReviews) {
  const title = product.title || 'this product';
  const brand = product.brand || 'the brand';

  /** @type {MockReview[]} */
  const allReviews = [
    {
      id: 'review-001',
      author: 'TechReviewer42',
      rating: 5,
      excerpt: `Absolutely love ${title}. The build quality is exceptional and performance exceeds expectations. Highly recommend for anyone looking for a premium experience.`,
      date: '2024-05-28',
      verified: true,
      expert: true,
      tag: 'expert',
    },
    {
      id: 'review-002',
      author: 'BargainHunter',
      rating: 4,
      excerpt: `Great value for the price. Compared several options and this ${brand} product offers the best bang for your buck. Worth every penny.`,
      date: '2024-06-01',
      verified: true,
      expert: false,
      tag: 'value-mention',
    },
    {
      id: 'review-003',
      author: 'DetailedDave',
      rating: 5,
      excerpt: `After extensive testing over 3 weeks, I can confirm this delivers on all promises. The specs are accurate and real-world performance matches the benchmarks. Battery life is solid.`,
      date: '2024-05-15',
      verified: true,
      expert: false,
      tag: 'detailed',
    },
    {
      id: 'review-004',
      author: 'HappyCustomer',
      rating: 5,
      excerpt: `Perfect purchase! Setup was easy and it works flawlessly. ${brand} never disappoints. Already recommended it to friends and family.`,
      date: '2024-06-05',
      verified: true,
      expert: false,
      tag: 'positive',
    },
    {
      id: 'review-005',
      author: 'ProAnalyst',
      rating: 4,
      excerpt: `From a professional standpoint, this is a solid choice. The ${brand} ecosystem integration is seamless. Minor improvements could be made to the software, but hardware is top-notch.`,
      date: '2024-05-20',
      verified: true,
      expert: true,
      tag: 'expert',
    },
    {
      id: 'review-006',
      author: 'SmartShopper',
      rating: 4,
      excerpt: `Waited for a sale and got this at a great price. The value proposition is strong — you get premium features without the premium markup. Very satisfied with my purchase.`,
      date: '2024-06-03',
      verified: true,
      expert: false,
      tag: 'value-mention',
    },
    {
      id: 'review-007',
      author: 'RecentBuyer',
      rating: 5,
      excerpt: `Just received this yesterday and I'm already impressed. Packaging was excellent, product looks and feels premium. Can't wait to use it more.`,
      date: '2024-06-08',
      verified: true,
      expert: false,
      tag: 'recent',
    },
  ];

  let filtered;

  switch (reviewFilter) {
    case 'positive':
      filtered = allReviews.filter((r) => r.rating >= 4);
      break;
    case 'detailed':
      filtered = allReviews.filter((r) => r.tag === 'detailed' || r.excerpt.length > 120);
      break;
    case 'expert':
      filtered = allReviews.filter((r) => r.expert);
      break;
    case 'value-mention':
      filtered = allReviews.filter((r) => r.tag === 'value-mention');
      break;
    case 'recent':
      filtered = [...allReviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'none':
    default:
      filtered = allReviews;
      break;
  }

  return filtered.slice(0, Math.max(0, maxReviews));
}

/**
 * Renders a star rating display with filled, half, and empty stars.
 *
 * @param {{ rating: number, maxStars?: number, size?: string }} props
 * @returns {React.ReactElement}
 */
function StarRating({ rating, maxStars = 5, size = 'h-5 w-5' }) {
  const clampedRating = Math.max(0, Math.min(maxStars, rating));

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    const filled = clampedRating >= i;
    const halfFilled = !filled && clampedRating >= i - 0.5;

    stars.push(
      <svg
        key={i}
        className={`${size} flex-shrink-0 ${
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
  size: PropTypes.string,
};

StarRating.defaultProps = {
  maxStars: 5,
  size: 'h-5 w-5',
};

/**
 * Renders a single rating distribution bar row.
 *
 * @param {{ stars: number, count: number, percent: number, totalReviews: number }} props
 * @returns {React.ReactElement}
 */
function RatingBar({ stars, count, percent, totalReviews }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right text-xs font-medium text-neutral-600">
        {stars}
        <span className="sr-only"> star{stars === 1 ? '' : 's'}</span>
      </span>
      <svg
        className="h-3 w-3 flex-shrink-0 text-accent-500"
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
      </svg>
      <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-500 transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="w-12 text-right text-xs text-neutral-500">
        {count.toLocaleString()}
      </span>
    </div>
  );
}

RatingBar.propTypes = {
  stars: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  percent: PropTypes.number.isRequired,
  totalReviews: PropTypes.number.isRequired,
};

/**
 * Renders a single review excerpt card.
 *
 * @param {{ review: MockReview, showExpertBadge: boolean }} props
 * @returns {React.ReactElement}
 */
function ReviewCard({ review, showExpertBadge }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-colors duration-200 hover:bg-neutral-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-700">
              {review.author.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-800">{review.author}</p>
            <div className="flex items-center gap-1.5">
              <StarRating rating={review.rating} size="h-3 w-3" />
              {review.verified && (
                <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
                  <svg
                    className="h-3 w-3"
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
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {showExpertBadge && review.expert && (
            <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
              Expert
            </span>
          )}
          <span className="text-xs text-neutral-400">{review.date}</span>
        </div>
      </div>
      <p className="text-sm text-neutral-700 leading-relaxed">{review.excerpt}</p>
    </div>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    excerpt: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    verified: PropTypes.bool.isRequired,
    expert: PropTypes.bool.isRequired,
    tag: PropTypes.string.isRequired,
  }).isRequired,
  showExpertBadge: PropTypes.bool.isRequired,
};

/**
 * Returns a human-readable label for the review filter strategy.
 *
 * @param {string} filter - The review filter strategy
 * @returns {string}
 */
function getFilterLabel(filter) {
  switch (filter) {
    case 'positive':
      return 'Positive reviews';
    case 'detailed':
      return 'Detailed reviews';
    case 'expert':
      return 'Expert reviews';
    case 'value-mention':
      return 'Value-focused reviews';
    case 'recent':
      return 'Recent reviews';
    case 'none':
    default:
      return 'All reviews';
  }
}

/**
 * PDP review summary component: displays average rating, rating distribution bar chart,
 * and highlighted review excerpts. Supports variant-specific review highlighting
 * (e.g., value-focused reviews for budget cohort). Accepts diff highlights prop for accent outline.
 *
 * @param {ReviewSummaryProps} props
 * @returns {React.ReactElement}
 */
function ReviewSummary({
  product,
  socialProofDisplay = 'standard',
  showReviewCount = true,
  showExpertReviews = false,
  reviewFilter = 'none',
  maxHighlightedReviews = 3,
  reviewSortBy = 'relevance',
  diffHighlights,
  showDiffOutline = false,
  className,
}) {
  if (!product || typeof product !== 'object') {
    return (
      <div
        role="region"
        aria-label="Customer reviews"
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <p className="text-sm text-neutral-500">No product data available.</p>
      </div>
    );
  }

  const rating = typeof product.rating === 'number' ? product.rating : 0;
  const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : 0;

  const distribution = useMemo(
    () => generateRatingDistribution(rating, reviewCount),
    [rating, reviewCount],
  );

  const reviews = useMemo(
    () => generateMockReviews(product, reviewFilter, maxHighlightedReviews),
    [product, reviewFilter, maxHighlightedReviews],
  );

  const isMinimal = socialProofDisplay === 'minimal';
  const isExpanded = socialProofDisplay === 'expanded';
  const isExpertFocused = socialProofDisplay === 'expert-focused';
  const isValueFocused = socialProofDisplay === 'value-focused';

  const effectiveShowExpert = showExpertReviews || isExpertFocused;

  const hasCustomFilter = reviewFilter !== 'none';

  const containerDiffClass =
    showDiffOutline && diffHighlights && diffHighlights.hasChanges
      ? ' ring-1 ring-primary-300 ring-offset-2'
      : '';

  if (isMinimal) {
    return (
      <section
        role="region"
        aria-label="Customer reviews"
        className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-sm animate-fade-in${containerDiffClass}${className ? ` ${className}` : ''}`}
      >
        <div
          className={`flex items-center gap-3${getDiffOutlineClass(showDiffOutline, diffHighlights, 'rating', 'rating')}`}
        >
          <StarRating rating={rating} />
          <span className="text-sm font-medium text-neutral-700">
            {rating.toFixed(1)}
          </span>
          {showReviewCount && reviewCount > 0 && (
            <span className="text-sm text-neutral-500">
              ({reviewCount.toLocaleString()} review{reviewCount === 1 ? '' : 's'})
            </span>
          )}
        </div>

        {socialProofDisplay !== 'standard' && (
          <div className="mt-2 flex items-center gap-1">
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
              Tailored display: {socialProofDisplay.replace('-', ' ')}
            </span>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label="Customer reviews"
      className={`rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden animate-fade-in${containerDiffClass}${className ? ` ${className}` : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-primary-500"
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
          <h3 className="text-base font-semibold text-neutral-900">
            Customer Reviews
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {hasCustomFilter && (
            <span
              className={`inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700${getDiffOutlineClass(showDiffOutline, diffHighlights, 'reviewFilter', 'rating')}`}
            >
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
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
                />
              </svg>
              {getFilterLabel(reviewFilter)}
            </span>
          )}

          {socialProofDisplay !== 'standard' && (
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
              {socialProofDisplay.replace('-', ' ')}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Rating summary and distribution */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
          {/* Average rating */}
          <div
            className={`sm:col-span-4 flex flex-col items-center justify-center${getDiffOutlineClass(showDiffOutline, diffHighlights, 'rating', 'rating')}`}
          >
            <span className="text-4xl font-bold text-neutral-900">
              {rating.toFixed(1)}
            </span>
            <div className="mt-1">
              <StarRating rating={rating} />
            </div>
            {showReviewCount && reviewCount > 0 && (
              <p
                className={`mt-1 text-sm text-neutral-500${getDiffOutlineClass(showDiffOutline, diffHighlights, 'reviewCount', 'rating')}`}
              >
                {reviewCount.toLocaleString()} review{reviewCount === 1 ? '' : 's'}
              </p>
            )}
            {rating >= 4.5 && (
              <span className="mt-2 inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Highly Rated
              </span>
            )}
          </div>

          {/* Rating distribution bar chart */}
          <div className="sm:col-span-8">
            <div className="flex flex-col gap-1.5" role="img" aria-label="Rating distribution">
              {distribution.map((entry) => (
                <RatingBar
                  key={entry.stars}
                  stars={entry.stars}
                  count={entry.count}
                  percent={entry.percent}
                  totalReviews={reviewCount}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Highlighted review excerpts */}
        {reviews.length > 0 && (
          <div
            className={`mt-6 border-t border-neutral-100 pt-5${getDiffOutlineClass(showDiffOutline, diffHighlights, 'reviewFilter', 'rating')}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-neutral-800">
                {hasCustomFilter ? getFilterLabel(reviewFilter) : 'Highlighted Reviews'}
              </h4>
              {effectiveShowExpert && (
                <span
                  className={`inline-flex items-center gap-1 text-xs text-primary-600${getDiffOutlineClass(showDiffOutline, diffHighlights, 'showExpertReviews', 'rating')}`}
                >
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
                      d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
                    />
                  </svg>
                  Expert reviews highlighted
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showExpertBadge={effectiveShowExpert}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sort indicator */}
        {reviewSortBy !== 'relevance' && (
          <div
            className={`mt-4 flex items-center gap-1${getDiffOutlineClass(showDiffOutline, diffHighlights, 'reviewSortBy', 'rating')}`}
          >
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
                d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 16.5m0 0L12 12m4.5 4.5V7.5"
              />
            </svg>
            <span className="text-xs text-neutral-400">
              Sorted by: {reviewSortBy}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-100 px-6 py-3">
        <p className="text-xs text-neutral-400">
          {reviews.length} highlighted review{reviews.length === 1 ? '' : 's'}
          {hasCustomFilter && ` · Filtered: ${getFilterLabel(reviewFilter).toLowerCase()}`}
          {socialProofDisplay !== 'standard' && ` · Display: ${socialProofDisplay.replace('-', ' ')}`}
        </p>
      </div>
    </section>
  );
}

ReviewSummary.propTypes = {
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
    specs: PropTypes.object,
    features: PropTypes.arrayOf(PropTypes.string),
  }),
  socialProofDisplay: PropTypes.oneOf([
    'standard',
    'expanded',
    'expert-focused',
    'value-focused',
    'minimal',
  ]),
  showReviewCount: PropTypes.bool,
  showExpertReviews: PropTypes.bool,
  reviewFilter: PropTypes.oneOf([
    'none',
    'positive',
    'detailed',
    'expert',
    'value-mention',
    'recent',
  ]),
  maxHighlightedReviews: PropTypes.number,
  reviewSortBy: PropTypes.oneOf(['relevance', 'rating', 'recency', 'helpfulness']),
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

ReviewSummary.defaultProps = {
  product: undefined,
  socialProofDisplay: 'standard',
  showReviewCount: true,
  showExpertReviews: false,
  reviewFilter: 'none',
  maxHighlightedReviews: 3,
  reviewSortBy: 'relevance',
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default ReviewSummary;