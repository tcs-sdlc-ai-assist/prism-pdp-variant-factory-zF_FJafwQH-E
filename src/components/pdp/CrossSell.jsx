import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * @typedef {Object} CrossSellProps
 * @property {object} product - The product/catalog item to display cross-sells for
 * @property {string} [strategy='complementary'] - Cross-sell strategy ('complementary', 'upgrade', 'bundle', 'history-based', 'essentials', 'none')
 * @property {string} [heading='You Might Also Like'] - Section heading text
 * @property {number} [maxItems=3] - Maximum number of cross-sell items to display
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
 * @typedef {Object} CrossSellItem
 * @property {string} id - Item identifier
 * @property {string} title - Item title
 * @property {number} price - Item price
 * @property {string} imageUrl - Item image placeholder URL
 * @property {string} category - Item category
 * @property {number} rating - Item rating
 * @property {string} badge - Optional badge text
 */

/**
 * Generates deterministic mock cross-sell items based on product and strategy.
 *
 * @param {object} product - The source product
 * @param {string} strategy - The cross-sell strategy
 * @param {number} maxItems - Maximum number of items to return
 * @returns {CrossSellItem[]}
 */
function generateCrossSellItems(product, strategy, maxItems) {
  const title = product.title || 'Product';
  const brand = product.brand || 'Brand';
  const category = product.category || 'Electronics';
  const price = typeof product.price === 'number' ? product.price : 99.99;

  /** @type {Object.<string, CrossSellItem[]>} */
  const itemsByStrategy = {
    complementary: [
      {
        id: 'cs-comp-001',
        title: `${brand} Premium Carrying Case`,
        price: 49.99,
        imageUrl: `https://placehold.co/300x200/e2e8f0/64748b?text=Carrying+Case`,
        category: 'Accessories',
        rating: 4.5,
        badge: 'Popular',
      },
      {
        id: 'cs-comp-002',
        title: `USB-C Hub Adapter — 7-in-1 Multiport`,
        price: 39.99,
        imageUrl: `https://placehold.co/300x200/e2e8f0/64748b?text=USB-C+Hub`,
        category: 'Accessories',
        rating: 4.3,
        badge: '',
      },
      {
        id: 'cs-comp-003',
        title: `${brand} Wireless Charging Pad`,
        price: 29.99,
        imageUrl: `https://placehold.co/300x200/e2e8f0/64748b?text=Charging+Pad`,
        category: 'Accessories',
        rating: 4.4,
        badge: 'Best Seller',
      },
      {
        id: 'cs-comp-004',
        title: `Screen Protector — Tempered Glass`,
        price: 14.99,
        imageUrl: `https://placehold.co/300x200/e2e8f0/64748b?text=Screen+Protector`,
        category: 'Accessories',
        rating: 4.2,
        badge: '',
      },
      {
        id: 'cs-comp-005',
        title: `${brand} Bluetooth Mouse`,
        price: 34.99,
        imageUrl: `https://placehold.co/300x200/e2e8f0/64748b?text=Bluetooth+Mouse`,
        category: 'Accessories',
        rating: 4.6,
        badge: '',
      },
    ],
    upgrade: [
      {
        id: 'cs-upg-001',
        title: `${brand} Pro Model — Next Generation`,
        price: Math.round(price * 1.4 * 100) / 100,
        imageUrl: `https://placehold.co/300x200/0046BE/FFF200?text=Pro+Model`,
        category,
        rating: 4.8,
        badge: 'Upgrade',
      },
      {
        id: 'cs-upg-002',
        title: `${brand} Max Edition — Enhanced Performance`,
        price: Math.round(price * 1.25 * 100) / 100,
        imageUrl: `https://placehold.co/300x200/0046BE/FFF200?text=Max+Edition`,
        category,
        rating: 4.7,
        badge: 'Top Rated',
      },
      {
        id: 'cs-upg-003',
        title: `${brand} Ultra — Premium Tier`,
        price: Math.round(price * 1.6 * 100) / 100,
        imageUrl: `https://placehold.co/300x200/0046BE/FFF200?text=Ultra+Model`,
        category,
        rating: 4.9,
        badge: 'Premium',
      },
    ],
    bundle: [
      {
        id: 'cs-bun-001',
        title: `${title} + Case Bundle`,
        price: Math.round((price + 49.99) * 0.9 * 100) / 100,
        imageUrl: `https://placehold.co/300x200/16a34a/FFFFFF?text=Bundle+Deal`,
        category: 'Bundles',
        rating: 4.6,
        badge: 'Save 10%',
      },
      {
        id: 'cs-bun-002',
        title: `Essential Accessories Bundle`,
        price: 89.99,
        imageUrl: `https://placehold.co/300x200/16a34a/FFFFFF?text=Essentials+Bundle`,
        category: 'Bundles',
        rating: 4.4,
        badge: 'Bundle & Save',
      },
      {
        id: 'cs-bun-003',
        title: `Complete Protection Bundle`,
        price: 129.99,
        imageUrl: `https://placehold.co/300x200/16a34a/FFFFFF?text=Protection+Bundle`,
        category: 'Bundles',
        rating: 4.5,
        badge: 'Best Value',
      },
    ],
    'history-based': [
      {
        id: 'cs-hist-001',
        title: `Recently Viewed: ${brand} Wireless Earbuds`,
        price: 149.99,
        imageUrl: `https://placehold.co/300x200/8e8e93/FFFFFF?text=Wireless+Earbuds`,
        category: 'Audio',
        rating: 4.5,
        badge: 'Viewed',
      },
      {
        id: 'cs-hist-002',
        title: `Previously Browsed: Smart Watch`,
        price: 299.99,
        imageUrl: `https://placehold.co/300x200/8e8e93/FFFFFF?text=Smart+Watch`,
        category: 'Wearables',
        rating: 4.6,
        badge: 'Browsed',
      },
    ],
    essentials: [
      {
        id: 'cs-ess-001',
        title: `${brand} Extended Warranty — 3 Year`,
        price: 79.99,
        imageUrl: `https://placehold.co/300x200/475569/FFFFFF?text=Extended+Warranty`,
        category: 'Services',
        rating: 4.3,
        badge: 'Recommended',
      },
      {
        id: 'cs-ess-002',
        title: `Professional Setup Service`,
        price: 49.99,
        imageUrl: `https://placehold.co/300x200/475569/FFFFFF?text=Setup+Service`,
        category: 'Services',
        rating: 4.7,
        badge: '',
      },
      {
        id: 'cs-ess-003',
        title: `USB-C Power Adapter — 65W`,
        price: 44.99,
        imageUrl: `https://placehold.co/300x200/475569/FFFFFF?text=Power+Adapter`,
        category: 'Accessories',
        rating: 4.4,
        badge: 'Essential',
      },
      {
        id: 'cs-ess-004',
        title: `Surge Protector — 8 Outlet`,
        price: 24.99,
        imageUrl: `https://placehold.co/300x200/475569/FFFFFF?text=Surge+Protector`,
        category: 'Accessories',
        rating: 4.2,
        badge: '',
      },
      {
        id: 'cs-ess-005',
        title: `Cleaning Kit — Premium`,
        price: 12.99,
        imageUrl: `https://placehold.co/300x200/475569/FFFFFF?text=Cleaning+Kit`,
        category: 'Accessories',
        rating: 4.1,
        badge: '',
      },
    ],
  };

  const items = itemsByStrategy[strategy] || itemsByStrategy.complementary;

  return items.slice(0, Math.max(0, maxItems));
}

/**
 * Returns a human-readable label for the cross-sell strategy.
 *
 * @param {string} strategy - The cross-sell strategy
 * @returns {string}
 */
function getStrategyLabel(strategy) {
  switch (strategy) {
    case 'complementary':
      return 'Complementary products';
    case 'upgrade':
      return 'Upgrade options';
    case 'bundle':
      return 'Bundle deals';
    case 'history-based':
      return 'Based on your history';
    case 'essentials':
      return 'Business essentials';
    case 'none':
      return 'No cross-sell';
    default:
      return 'Related products';
  }
}

/**
 * Renders a star rating display with filled and empty stars.
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
        className={`h-3 w-3 flex-shrink-0 ${
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
 * Renders a single cross-sell item card.
 *
 * @param {{ item: CrossSellItem }} props
 * @returns {React.ReactElement}
 */
function CrossSellCard({ item }) {
  return (
    <div className="flex-shrink-0 w-48 sm:w-56 rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-neutral-300">
      {/* Image */}
      <div className="relative aspect-[3/2] w-full bg-neutral-100 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        {item.badge && (
          <span className="absolute top-2 left-2 inline-flex items-center rounded-md bg-primary-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
            {item.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-xs text-neutral-500 mb-0.5">{item.category}</p>
        <h4 className="text-sm font-medium text-neutral-800 leading-snug line-clamp-2 min-h-[2.5rem]">
          {item.title}
        </h4>
        <div className="mt-1.5 flex items-center gap-1">
          <StarRating rating={item.rating} />
          <span className="text-xs text-neutral-500">{item.rating.toFixed(1)}</span>
        </div>
        <p className="mt-1.5 text-sm font-bold text-neutral-900">
          {formatCurrency(item.price)}
        </p>
        <button
          type="button"
          className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors duration-200 hover:bg-primary-100 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

CrossSellCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    imageUrl: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    badge: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * PDP cross-sell/accessories component: displays related products carousel with
 * image placeholders, titles, and prices. Supports variant-specific cross-sell
 * selection based on cohort behavior. Accepts diff highlights prop for accent outline.
 *
 * @param {CrossSellProps} props
 * @returns {React.ReactElement}
 */
function CrossSell({
  product,
  strategy = 'complementary',
  heading = 'You Might Also Like',
  maxItems = 3,
  diffHighlights,
  showDiffOutline = false,
  className,
}) {
  if (strategy === 'none') {
    return null;
  }

  if (!product || typeof product !== 'object') {
    return (
      <div
        role="region"
        aria-label="Cross-sell recommendations"
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <p className="text-sm text-neutral-500">No product data available.</p>
      </div>
    );
  }

  const items = useMemo(
    () => generateCrossSellItems(product, strategy, maxItems),
    [product, strategy, maxItems],
  );

  const hasCustomStrategy = strategy !== 'complementary';

  const containerDiffClass =
    showDiffOutline && diffHighlights && diffHighlights.hasChanges
      ? ' ring-1 ring-primary-300 ring-offset-2'
      : '';

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      role="region"
      aria-label="Cross-sell recommendations"
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
              d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
            />
          </svg>
          <h3
            className={`text-base font-semibold text-neutral-900${getDiffOutlineClass(showDiffOutline, diffHighlights, 'crossSellHeading', 'accessories')}`}
          >
            {heading}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {hasCustomStrategy && (
            <span
              className={`inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700${getDiffOutlineClass(showDiffOutline, diffHighlights, 'crossSellStrategy', 'accessories')}`}
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
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                />
              </svg>
              {getStrategyLabel(strategy)}
            </span>
          )}
        </div>
      </div>

      {/* Cross-sell items carousel */}
      <div
        className={`px-6 py-5${getDiffOutlineClass(showDiffOutline, diffHighlights, 'crossSellStrategy', 'accessories')}`}
      >
        <div
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin"
          role="list"
          aria-label={`${heading} — ${items.length} item${items.length === 1 ? '' : 's'}`}
        >
          {items.map((item) => (
            <div key={item.id} role="listitem">
              <CrossSellCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-100 px-6 py-3">
        <p className="text-xs text-neutral-400">
          {items.length} recommendation{items.length === 1 ? '' : 's'}
          {hasCustomStrategy && ` · Strategy: ${getStrategyLabel(strategy).toLowerCase()}`}
          {strategy !== 'complementary' && (
            <span>
              {' · '}
              <span className="inline-flex items-center gap-0.5">
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
                Tailored selection
              </span>
            </span>
          )}
        </p>
      </div>
    </section>
  );
}

CrossSell.propTypes = {
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
  strategy: PropTypes.oneOf([
    'complementary',
    'upgrade',
    'bundle',
    'history-based',
    'essentials',
    'none',
  ]),
  heading: PropTypes.string,
  maxItems: PropTypes.number,
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

CrossSell.defaultProps = {
  product: undefined,
  strategy: 'complementary',
  heading: 'You Might Also Like',
  maxItems: 3,
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default CrossSell;