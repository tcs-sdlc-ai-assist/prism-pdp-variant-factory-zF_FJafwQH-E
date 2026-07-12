import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { useDiff } from '@/hooks/useDiff.js';
import CanonicalPdp from '@/components/pdp/CanonicalPdp.jsx';
import CohortProfilePanel from '@/components/detail/CohortProfilePanel.jsx';
import ManifestViewer from '@/components/detail/ManifestViewer.jsx';
import VariantActions from '@/components/detail/VariantActions.jsx';
import DiffHighlight from '@/components/gallery/DiffHighlight.jsx';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';

/**
 * @typedef {Object} VariantDetailLayoutProps
 * @property {object} [variant] - The variant object to display (overrides route param lookup)
 * @property {object} [canonicalPdp] - The canonical/control product data for diff computation
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Extracts the product data from a variant for PDP rendering.
 * Prefers variantPdp if available, otherwise falls back to the variant itself.
 *
 * @param {object|null} variant - The variant object
 * @returns {object|null} The product data for PDP rendering
 */
function extractProductData(variant) {
  if (!variant || typeof variant !== 'object') {
    return null;
  }
  if (variant.variantPdp && typeof variant.variantPdp === 'object') {
    return variant.variantPdp;
  }
  return variant;
}

/**
 * Extracts PDP composition props from a variant's manifest tailoring descriptors.
 *
 * @param {object|null} variant - The variant object
 * @returns {object} Props to pass to CanonicalPdp
 */
function extractPdpProps(variant) {
  if (!variant || typeof variant !== 'object') {
    return {};
  }

  const manifest = variant.manifest && typeof variant.manifest === 'object' ? variant.manifest : null;
  const variantPdp = variant.variantPdp && typeof variant.variantPdp === 'object' ? variant.variantPdp : variant;

  const props = {};

  // Hero layout
  if (manifest && manifest.heroLayout && typeof manifest.heroLayout === 'object') {
    props.layout = manifest.heroLayout.layout || 'standard';
    props.primaryFocus = manifest.heroLayout.primaryFocus || 'media';
  } else if (variantPdp.layout) {
    props.layout = variantPdp.layout;
    props.primaryFocus = variantPdp.primaryFocus || 'media';
  }

  // Price emphasis
  if (manifest && manifest.priceEmphasis && typeof manifest.priceEmphasis === 'object') {
    props.priceDisplay = manifest.priceEmphasis.display || 'standard';
    props.showSavings = manifest.priceEmphasis.showSavings === true;
    props.showMemberPrice = manifest.priceEmphasis.showMemberPrice === true;
    props.priceCallout = manifest.priceEmphasis.callout || '';
  } else {
    if (variantPdp.priceDisplay) props.priceDisplay = variantPdp.priceDisplay;
    if (typeof variantPdp.showSavings === 'boolean') props.showSavings = variantPdp.showSavings;
    if (typeof variantPdp.showMemberPrice === 'boolean') props.showMemberPrice = variantPdp.showMemberPrice;
    if (variantPdp.priceCallout) props.priceCallout = variantPdp.priceCallout;
  }

  // Badge urgency
  if (manifest && manifest.badgeUrgency && typeof manifest.badgeUrgency === 'object') {
    props.badges = Array.isArray(manifest.badgeUrgency.badges) ? manifest.badgeUrgency.badges : undefined;
    props.urgencyLevel = manifest.badgeUrgency.urgencyLevel || 'none';
    props.urgencyMessage = manifest.badgeUrgency.urgencyMessage || undefined;
  } else {
    if (Array.isArray(variantPdp.badges)) props.badges = variantPdp.badges;
    if (variantPdp.urgencyLevel) props.urgencyLevel = variantPdp.urgencyLevel;
    if (variantPdp.urgencyMessage) props.urgencyMessage = variantPdp.urgencyMessage;
  }

  // CTA copy
  if (manifest && manifest.ctaCopy && typeof manifest.ctaCopy === 'object') {
    props.primaryCTA = manifest.ctaCopy.primaryCTA || 'Add to Cart';
    props.secondaryCTA = manifest.ctaCopy.secondaryCTA || 'Save for Later';
    props.ctaTone = manifest.ctaCopy.tone || 'standard';
  } else {
    if (variantPdp.primaryCTA) props.primaryCTA = variantPdp.primaryCTA;
    if (variantPdp.secondaryCTA) props.secondaryCTA = variantPdp.secondaryCTA;
    if (variantPdp.ctaTone) props.ctaTone = variantPdp.ctaTone;
  }

  // Social proof
  if (manifest && manifest.socialProof && typeof manifest.socialProof === 'object') {
    props.socialProofDisplay = manifest.socialProof.display || 'standard';
    if (typeof manifest.socialProof.showReviewCount === 'boolean') props.showReviewCount = manifest.socialProof.showReviewCount;
    if (typeof manifest.socialProof.showExpertReviews === 'boolean') props.showExpertReviews = manifest.socialProof.showExpertReviews;
  } else {
    if (variantPdp.socialProofDisplay) props.socialProofDisplay = variantPdp.socialProofDisplay;
    if (typeof variantPdp.showReviewCount === 'boolean') props.showReviewCount = variantPdp.showReviewCount;
    if (typeof variantPdp.showExpertReviews === 'boolean') props.showExpertReviews = variantPdp.showExpertReviews;
  }

  // Cross-sell
  if (manifest && manifest.crossSell && typeof manifest.crossSell === 'object') {
    props.crossSellStrategy = manifest.crossSell.strategy || 'complementary';
    props.crossSellHeading = manifest.crossSell.heading || 'You Might Also Like';
    props.crossSellMaxItems = typeof manifest.crossSell.maxItems === 'number' ? manifest.crossSell.maxItems : 3;
  } else {
    if (variantPdp.crossSellStrategy) props.crossSellStrategy = variantPdp.crossSellStrategy;
    if (variantPdp.crossSellHeading) props.crossSellHeading = variantPdp.crossSellHeading;
    if (typeof variantPdp.crossSellMaxItems === 'number') props.crossSellMaxItems = variantPdp.crossSellMaxItems;
  }

  // Spec ordering
  if (manifest && manifest.specOrdering && typeof manifest.specOrdering === 'object') {
    props.prioritizedSpecs = Array.isArray(manifest.specOrdering.prioritizedSpecs) ? manifest.specOrdering.prioritizedSpecs : undefined;
    props.expandByDefault = manifest.specOrdering.expandByDefault === true;
  } else {
    if (Array.isArray(variantPdp.prioritizedSpecs)) props.prioritizedSpecs = variantPdp.prioritizedSpecs;
    if (typeof variantPdp.specsExpandedByDefault === 'boolean') props.expandByDefault = variantPdp.specsExpandedByDefault;
  }

  // Review highlight
  if (manifest && manifest.reviewHighlight && typeof manifest.reviewHighlight === 'object') {
    props.reviewFilter = manifest.reviewHighlight.filter || 'none';
    props.maxHighlightedReviews = typeof manifest.reviewHighlight.maxHighlighted === 'number' ? manifest.reviewHighlight.maxHighlighted : 3;
    props.reviewSortBy = manifest.reviewHighlight.sortBy || 'relevance';
  } else {
    if (variantPdp.reviewFilter) props.reviewFilter = variantPdp.reviewFilter;
    if (typeof variantPdp.maxHighlightedReviews === 'number') props.maxHighlightedReviews = variantPdp.maxHighlightedReviews;
    if (variantPdp.reviewSortBy) props.reviewSortBy = variantPdp.reviewSortBy;
  }

  return props;
}

/**
 * Variant detail view layout component: split-pane layout with full PDP render
 * on the left and CohortProfilePanel + ManifestViewer + VariantActions on the
 * right side panel. Responsive: stacks vertically on mobile. Includes diff
 * highlighting when enabled.
 *
 * @param {VariantDetailLayoutProps} props
 * @returns {React.ReactElement}
 */
function VariantDetailLayout({ variant: variantProp, canonicalPdp: canonicalPdpProp, className }) {
  const { variantId } = useParams();
  const { variants, catalog, diffToggle } = useAppContext();

  const resolvedVariant = useMemo(() => {
    if (variantProp && typeof variantProp === 'object') {
      return variantProp;
    }
    if (!variantId || !Array.isArray(variants)) {
      return null;
    }
    return variants.find(
      (v) => v && (v.variantId === variantId || v.id === variantId),
    ) || null;
  }, [variantProp, variantId, variants]);

  const controlVariant = useMemo(() => {
    if (!Array.isArray(variants)) {
      return null;
    }
    return variants.find((v) => v && v.controlFlag === true) || null;
  }, [variants]);

  const resolvedCanonicalPdp = useMemo(() => {
    if (canonicalPdpProp && typeof canonicalPdpProp === 'object') {
      return canonicalPdpProp;
    }
    if (controlVariant && controlVariant.variantPdp && typeof controlVariant.variantPdp === 'object') {
      return controlVariant.variantPdp;
    }
    if (resolvedVariant && resolvedVariant.baseSku && Array.isArray(catalog)) {
      const catalogItem = catalog.find((item) => item.sku === resolvedVariant.baseSku);
      if (catalogItem) {
        return catalogItem;
      }
    }
    if (resolvedVariant && resolvedVariant.sku && Array.isArray(catalog)) {
      const catalogItem = catalog.find((item) => item.sku === resolvedVariant.sku);
      if (catalogItem) {
        return catalogItem;
      }
    }
    if (resolvedVariant && resolvedVariant.productId && Array.isArray(catalog)) {
      const catalogItem = catalog.find((item) => item.id === resolvedVariant.productId);
      if (catalogItem) {
        return catalogItem;
      }
    }
    return null;
  }, [canonicalPdpProp, controlVariant, resolvedVariant, catalog]);

  const { diffResult, isDiffEnabled } = useDiff(resolvedCanonicalPdp, resolvedVariant);

  const productData = useMemo(() => extractProductData(resolvedVariant), [resolvedVariant]);

  const pdpProps = useMemo(() => extractPdpProps(resolvedVariant), [resolvedVariant]);

  const diffHighlights = useMemo(() => {
    if (!isDiffEnabled || !diffResult || !diffResult.hasChanges) {
      return undefined;
    }
    return {
      dimensions: diffResult.dimensions || [],
      fields: diffResult.changes ? diffResult.changes.map((c) => c.field) : [],
      hasChanges: diffResult.hasChanges,
    };
  }, [isDiffEnabled, diffResult]);

  const showDiffOutline = isDiffEnabled && diffResult && diffResult.hasChanges;

  const variantLabel = resolvedVariant
    ? resolvedVariant.label || resolvedVariant.name || 'Variant'
    : 'Variant';

  // Not found state
  if (!resolvedVariant) {
    return (
      <div
        role="region"
        aria-label="Variant detail"
        className={`flex flex-col items-center justify-center min-h-[400px] rounded-lg border-2 border-dashed border-neutral-300 bg-white p-8 animate-fade-in${className ? ` ${className}` : ''}`}
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
            d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-neutral-700 mb-1">
          Variant Not Found
        </h2>
        <p className="text-sm text-neutral-500 text-center max-w-md">
          {variantId
            ? `No variant found with ID "${variantId}". It may have been removed or not yet generated.`
            : 'No variant specified. Navigate to the gallery to select a variant.'}
        </p>
        <p className="mt-3 text-xs text-neutral-400">
          Go to the Cohorts page to configure targets and generate variants.
        </p>
      </div>
    );
  }

  // Loading state (no product data yet)
  if (!productData) {
    return (
      <div
        role="region"
        aria-label="Variant detail loading"
        className={`flex flex-col gap-6 animate-fade-in${className ? ` ${className}` : ''}`}
      >
        <SkeletonLoader shape="rectangle" width="w-full" height="h-10" ariaLabel="Loading variant actions" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <SkeletonLoader shape="rectangle" width="w-full" height="h-64" ariaLabel="Loading product hero" />
            <SkeletonLoader shape="rectangle" width="w-full" height="h-40" ariaLabel="Loading price block" />
            <SkeletonLoader shape="text" lines={3} ariaLabel="Loading product details" />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <SkeletonLoader shape="rectangle" width="w-full" height="h-48" ariaLabel="Loading cohort profile" />
            <SkeletonLoader shape="rectangle" width="w-full" height="h-32" ariaLabel="Loading manifest viewer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={`Variant detail: ${variantLabel}`}
      className={`flex flex-col gap-6 animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Variant Actions Bar */}
      <VariantActions variant={resolvedVariant} />

      {/* Variant header info */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {resolvedVariant.controlFlag && (
            <span className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
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
                  d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
                />
              </svg>
              Control
            </span>
          )}
          <h1 className="text-lg font-bold text-neutral-900 truncate" title={variantLabel}>
            {variantLabel}
          </h1>
          {typeof resolvedVariant.priority === 'number' && resolvedVariant.priority > 0 && (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-500 text-xs font-bold text-white flex-shrink-0">
              {resolvedVariant.priority}
            </span>
          )}
        </div>

        {/* Diff status indicator */}
        {isDiffEnabled && diffResult && diffResult.hasChanges && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-accent-50 px-2.5 py-1 text-xs font-medium text-neutral-800">
              <svg
                className="h-3.5 w-3.5 text-accent-600"
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
              {diffResult.dimensionsChanged} dimension{diffResult.dimensionsChanged === 1 ? '' : 's'} changed
            </span>
            <span className="text-xs text-neutral-400">
              {diffResult.totalChanges} field{diffResult.totalChanges === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* Split-pane layout: PDP left, side panel right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Full PDP render */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <DiffHighlight
            diffResult={diffResult}
            section="title"
            cohortLabel={variantLabel}
            showTag={isDiffEnabled}
            tagPosition="top-right"
          >
            <CanonicalPdp
              product={productData}
              diffHighlights={diffHighlights}
              showDiffOutline={showDiffOutline}
              {...pdpProps}
            />
          </DiffHighlight>
        </div>

        {/* Right: Side panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Cohort Profile Panel */}
          <DiffHighlight
            diffResult={diffResult}
            section="badge"
            cohortLabel={variantLabel}
            showTag={isDiffEnabled}
            tagPosition="top-left"
          >
            <CohortProfilePanel variant={resolvedVariant} />
          </DiffHighlight>

          {/* Manifest Viewer */}
          <DiffHighlight
            diffResult={diffResult}
            section="description"
            cohortLabel={variantLabel}
            showTag={isDiffEnabled}
            tagPosition="top-left"
          >
            <ManifestViewer variant={resolvedVariant} collapsed={false} />
          </DiffHighlight>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-neutral-200 pt-4">
        <svg
          className="h-4 w-4 text-neutral-400"
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
          {variantLabel}
          {resolvedVariant.cohortType && ` · ${resolvedVariant.cohortType.replace(/[-_]/g, ' ')}`}
          {resolvedVariant.behavioralOverlay && ` · ${resolvedVariant.behavioralOverlay.replace(/[-_]/g, ' ')}`}
          {resolvedVariant.baseSku && ` · ${resolvedVariant.baseSku}`}
          {isDiffEnabled && diffResult && diffResult.hasChanges && ` · ${diffResult.totalChanges} change${diffResult.totalChanges === 1 ? '' : 's'} from control`}
          {resolvedVariant.controlFlag && ' · Control variant'}
        </p>
      </div>
    </div>
  );
}

VariantDetailLayout.propTypes = {
  variant: PropTypes.shape({
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
  canonicalPdp: PropTypes.shape({
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
  className: PropTypes.string,
};

VariantDetailLayout.defaultProps = {
  variant: undefined,
  canonicalPdp: undefined,
  className: undefined,
};

export default VariantDetailLayout;