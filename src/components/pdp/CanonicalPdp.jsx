import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ProductHero from '@/components/pdp/ProductHero.jsx';
import PriceBlock from '@/components/pdp/PriceBlock.jsx';
import UrgencyBadge from '@/components/pdp/UrgencyBadge.jsx';
import SpecTable from '@/components/pdp/SpecTable.jsx';
import ReviewSummary from '@/components/pdp/ReviewSummary.jsx';
import CrossSell from '@/components/pdp/CrossSell.jsx';
import CtaButton from '@/components/pdp/CtaButton.jsx';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * @typedef {Object} CanonicalPdpProps
 * @property {object} product - The product/catalog item to display
 * @property {string} [layout='standard'] - Hero layout variant ('standard', 'price-forward', 'media-rich', 'spec-heavy', 'social-proof', 'urgency')
 * @property {string} [primaryFocus='media'] - The primary content area to emphasize
 * @property {string[]} [badges] - Array of badge labels to display
 * @property {string} [urgencyLevel='none'] - Urgency level ('none', 'low', 'medium', 'high')
 * @property {string} [urgencyMessage] - Urgency message text
 * @property {string} [priceDisplay='standard'] - Price display mode
 * @property {boolean} [showSavings=false] - Whether to show savings amount
 * @property {boolean} [showMemberPrice=false] - Whether to show member-exclusive pricing
 * @property {string} [priceCallout=''] - Price-related callout text
 * @property {string} [primaryCTA='Add to Cart'] - Primary call-to-action button text
 * @property {string} [secondaryCTA='Save for Later'] - Secondary call-to-action button text
 * @property {string} [ctaTone='standard'] - CTA tone
 * @property {string[]} [prioritizedSpecs] - Ordered list of spec keys to show first
 * @property {boolean} [expandByDefault=false] - Whether the specs section should be expanded by default
 * @property {string} [socialProofDisplay='standard'] - Social proof display mode
 * @property {boolean} [showReviewCount=true] - Whether to show total review count
 * @property {boolean} [showExpertReviews=false] - Whether to highlight expert reviews
 * @property {string} [reviewFilter='none'] - Review filter strategy
 * @property {number} [maxHighlightedReviews=3] - Maximum number of highlighted reviews
 * @property {string} [reviewSortBy='relevance'] - Sort criteria for reviews
 * @property {string} [crossSellStrategy='complementary'] - Cross-sell strategy
 * @property {string} [crossSellHeading='You Might Also Like'] - Cross-sell section heading
 * @property {number} [crossSellMaxItems=3] - Maximum number of cross-sell items
 * @property {DiffHighlights} [diffHighlights] - Diff highlights for accent outline
 * @property {boolean} [showDiffOutline=false] - Whether to show diff accent outlines
 * @property {function} [onPrimaryClick] - Click handler for primary CTA
 * @property {function} [onSecondaryClick] - Click handler for secondary CTA
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Full canonical PDP composition component: assembles ProductHero, PriceBlock,
 * UrgencyBadge, SpecTable, ReviewSummary, CrossSell, and CtaButton into a
 * complete Best Buy-style product detail page. Accepts product data and optional
 * diff highlights. Responsive layout with Tailwind grid.
 *
 * @param {CanonicalPdpProps} props
 * @returns {React.ReactElement}
 */
function CanonicalPdp({
  product,
  layout = 'standard',
  primaryFocus = 'media',
  badges,
  urgencyLevel = 'none',
  urgencyMessage,
  priceDisplay = 'standard',
  showSavings = false,
  showMemberPrice = false,
  priceCallout = '',
  primaryCTA = 'Add to Cart',
  secondaryCTA = 'Save for Later',
  ctaTone = 'standard',
  prioritizedSpecs,
  expandByDefault = false,
  socialProofDisplay = 'standard',
  showReviewCount = true,
  showExpertReviews = false,
  reviewFilter = 'none',
  maxHighlightedReviews = 3,
  reviewSortBy = 'relevance',
  crossSellStrategy = 'complementary',
  crossSellHeading = 'You Might Also Like',
  crossSellMaxItems = 3,
  diffHighlights,
  showDiffOutline = false,
  onPrimaryClick,
  onSecondaryClick,
  className,
}) {
  if (!product || typeof product !== 'object') {
    return (
      <div
        role="region"
        aria-label="Product detail page"
        className={`flex flex-col items-center justify-center min-h-[300px] rounded-lg border border-neutral-200 bg-white p-8 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <svg
          className="h-12 w-12 text-neutral-300 mb-4"
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
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
        <p className="text-sm font-medium text-neutral-500">
          No product data available. Select a product from the catalog to view its detail page.
        </p>
      </div>
    );
  }

  const productBadge = product.badge || '';

  return (
    <article
      role="region"
      aria-label={`Product detail page: ${product.title || 'Product'}`}
      className={`flex flex-col gap-6 animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Product Hero Section */}
      <ProductHero
        product={product}
        layout={layout}
        primaryFocus={primaryFocus}
        badges={badges}
        urgencyLevel={urgencyLevel}
        urgencyMessage={urgencyMessage}
        diffHighlights={diffHighlights}
        showDiffOutline={showDiffOutline}
      />

      {/* Urgency Badge & Badges Section */}
      <UrgencyBadge
        badges={badges}
        urgencyLevel={urgencyLevel}
        urgencyMessage={urgencyMessage}
        productBadge={productBadge}
        diffHighlights={diffHighlights}
        showDiffOutline={showDiffOutline}
      />

      {/* Main Content Grid: Price + Specs side by side on larger screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Price Block + CTA */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <PriceBlock
            product={product}
            priceDisplay={priceDisplay}
            showSavings={showSavings}
            showMemberPrice={showMemberPrice}
            priceCallout={priceCallout}
            primaryCTA={primaryCTA}
            secondaryCTA={secondaryCTA}
            ctaTone={ctaTone}
            diffHighlights={diffHighlights}
            showDiffOutline={showDiffOutline}
          />

          {/* Standalone CTA Buttons */}
          <CtaButton
            primaryCTA={primaryCTA}
            secondaryCTA={secondaryCTA}
            ctaTone={ctaTone}
            diffHighlights={diffHighlights}
            showDiffOutline={showDiffOutline}
            onPrimaryClick={onPrimaryClick}
            onSecondaryClick={onSecondaryClick}
          />
        </div>

        {/* Right Column: Spec Table */}
        <div className="lg:col-span-7">
          <SpecTable
            product={product}
            prioritizedSpecs={prioritizedSpecs}
            expandByDefault={expandByDefault}
            diffHighlights={diffHighlights}
            showDiffOutline={showDiffOutline}
          />
        </div>
      </div>

      {/* Review Summary Section */}
      <ReviewSummary
        product={product}
        socialProofDisplay={socialProofDisplay}
        showReviewCount={showReviewCount}
        showExpertReviews={showExpertReviews}
        reviewFilter={reviewFilter}
        maxHighlightedReviews={maxHighlightedReviews}
        reviewSortBy={reviewSortBy}
        diffHighlights={diffHighlights}
        showDiffOutline={showDiffOutline}
      />

      {/* Cross-Sell Section */}
      <CrossSell
        product={product}
        strategy={crossSellStrategy}
        heading={crossSellHeading}
        maxItems={crossSellMaxItems}
        diffHighlights={diffHighlights}
        showDiffOutline={showDiffOutline}
      />
    </article>
  );
}

CanonicalPdp.propTypes = {
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
  primaryCTA: PropTypes.string,
  secondaryCTA: PropTypes.string,
  ctaTone: PropTypes.oneOf(['standard', 'urgent', 'value', 'premium', 'friendly']),
  prioritizedSpecs: PropTypes.arrayOf(PropTypes.string),
  expandByDefault: PropTypes.bool,
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
  crossSellStrategy: PropTypes.oneOf([
    'complementary',
    'upgrade',
    'bundle',
    'history-based',
    'essentials',
    'none',
  ]),
  crossSellHeading: PropTypes.string,
  crossSellMaxItems: PropTypes.number,
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  onPrimaryClick: PropTypes.func,
  onSecondaryClick: PropTypes.func,
  className: PropTypes.string,
};

CanonicalPdp.defaultProps = {
  product: undefined,
  layout: 'standard',
  primaryFocus: 'media',
  badges: undefined,
  urgencyLevel: 'none',
  urgencyMessage: undefined,
  priceDisplay: 'standard',
  showSavings: false,
  showMemberPrice: false,
  priceCallout: '',
  primaryCTA: 'Add to Cart',
  secondaryCTA: 'Save for Later',
  ctaTone: 'standard',
  prioritizedSpecs: undefined,
  expandByDefault: false,
  socialProofDisplay: 'standard',
  showReviewCount: true,
  showExpertReviews: false,
  reviewFilter: 'none',
  maxHighlightedReviews: 3,
  reviewSortBy: 'relevance',
  crossSellStrategy: 'complementary',
  crossSellHeading: 'You Might Also Like',
  crossSellMaxItems: 3,
  diffHighlights: undefined,
  showDiffOutline: false,
  onPrimaryClick: undefined,
  onSecondaryClick: undefined,
  className: undefined,
};

export default CanonicalPdp;