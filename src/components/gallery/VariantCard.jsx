import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { computeSimpleDiff } from '@/services/diffEngine.js';
import { TAILORING_DIMENSIONS } from '@/constants/constants.js';

/**
 * @typedef {Object} VariantCardProps
 * @property {object} variant - The variant object to display
 * @property {object} [canonicalPdp] - The canonical/control product data for diff computation
 * @property {number} [index=0] - The index of this card in the gallery grid (for stagger animation)
 * @property {boolean} [showDiff=true] - Whether to show diff summary information
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Formats a tailoring dimension key to a human-readable label.
 *
 * @param {string} dimension - The tailoring dimension key
 * @returns {string} Human-readable label
 */
function formatDimensionLabel(dimension) {
  if (!dimension || typeof dimension !== 'string') {
    return '';
  }
  return dimension.charAt(0).toUpperCase() + dimension.slice(1);
}

/**
 * Returns the badge color classes for a cohort type.
 *
 * @param {string} cohortType - The cohort type identifier
 * @returns {{ bg: string, text: string }}
 */
function getCohortBadgeColors(cohortType) {
  const type = (cohortType || '').toLowerCase();

  if (type.includes('budget') || type.includes('bargain')) {
    return { bg: 'bg-green-50', text: 'text-green-700' };
  }
  if (type.includes('tech') || type.includes('enthusiast')) {
    return { bg: 'bg-primary-50', text: 'text-primary-700' };
  }
  if (type.includes('loyalty') || type.includes('member')) {
    return { bg: 'bg-purple-50', text: 'text-purple-700' };
  }
  if (type.includes('gift')) {
    return { bg: 'bg-pink-50', text: 'text-pink-700' };
  }
  if (type.includes('business')) {
    return { bg: 'bg-neutral-100', text: 'text-neutral-700' };
  }
  if (type.includes('student')) {
    return { bg: 'bg-blue-50', text: 'text-blue-700' };
  }
  if (type.includes('high-value') || type.includes('high_value')) {
    return { bg: 'bg-amber-50', text: 'text-amber-700' };
  }
  if (type.includes('returning')) {
    return { bg: 'bg-teal-50', text: 'text-teal-700' };
  }
  if (type.includes('first')) {
    return { bg: 'bg-indigo-50', text: 'text-indigo-700' };
  }

  return { bg: 'bg-neutral-100', text: 'text-neutral-600' };
}

/**
 * Returns the badge color classes for a behavioral overlay.
 *
 * @param {string} overlay - The behavioral overlay identifier
 * @returns {{ bg: string, text: string }}
 */
function getOverlayBadgeColors(overlay) {
  const type = (overlay || '').toLowerCase();

  if (type.includes('browse') || type.includes('heavy')) {
    return { bg: 'bg-sky-50', text: 'text-sky-700' };
  }
  if (type.includes('comparison') || type.includes('shopper')) {
    return { bg: 'bg-violet-50', text: 'text-violet-700' };
  }
  if (type.includes('deal') || type.includes('seeker')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
  }
  if (type.includes('cart') || type.includes('abandon')) {
    return { bg: 'bg-red-50', text: 'text-red-700' };
  }
  if (type.includes('seasonal') || type.includes('browser')) {
    return { bg: 'bg-orange-50', text: 'text-orange-700' };
  }
  if (type.includes('bulk') || type.includes('research')) {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
  }
  if (type.includes('brand') || type.includes('loyal')) {
    return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' };
  }
  if (type.includes('quick') || type.includes('purchas')) {
    return { bg: 'bg-cyan-50', text: 'text-cyan-700' };
  }

  return { bg: 'bg-neutral-50', text: 'text-neutral-600' };
}

/**
 * Returns the color classes for a diff change count indicator.
 *
 * @param {number} changeCount - Number of changes
 * @returns {string} CSS classes
 */
function getDiffCountColor(changeCount) {
  if (changeCount === 0) {
    return 'bg-neutral-100 text-neutral-500';
  }
  if (changeCount <= 2) {
    return 'bg-green-100 text-green-700';
  }
  if (changeCount <= 5) {
    return 'bg-primary-100 text-primary-700';
  }
  return 'bg-accent-100 text-neutral-800';
}

/**
 * Extracts the applied tailoring dimensions from a variant object.
 *
 * @param {object} variant - The variant object
 * @returns {string[]} Array of tailoring dimension names
 */
function extractTailoringDimensions(variant) {
  if (!variant || typeof variant !== 'object') {
    return [];
  }

  if (variant.tailoring && typeof variant.tailoring === 'object' && !Array.isArray(variant.tailoring)) {
    return Object.keys(variant.tailoring).filter((d) => TAILORING_DIMENSIONS.includes(d));
  }

  if (
    variant.manifest &&
    typeof variant.manifest === 'object' &&
    Array.isArray(variant.manifest.appliedTailoring)
  ) {
    const dims = variant.manifest.appliedTailoring
      .map((t) => t.dimension)
      .filter((d) => typeof d === 'string' && d.length > 0);
    return [...new Set(dims)];
  }

  if (variant.diff && typeof variant.diff === 'object' && Array.isArray(variant.diff.dimensions)) {
    return variant.diff.dimensions.filter((d) => TAILORING_DIMENSIONS.includes(d));
  }

  return [];
}

/**
 * Formats a currency value for compact display.
 *
 * @param {number} value - The numeric value
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '$0.00';
  }
  return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Variant gallery card component: renders a compact live preview of a variant PDP
 * with variant label, cohort + behavioral overlay badges, short list of applied
 * tailoring dimensions, and diff summary. Clickable to navigate to detail view.
 * Responsive card layout with hover effects. Accessible with keyboard focus and
 * ARIA attributes.
 *
 * @param {VariantCardProps} props
 * @returns {React.ReactElement}
 */
function VariantCard({ variant, canonicalPdp, index = 0, showDiff = true, className }) {
  const navigate = useNavigate();
  const { diffToggle, addToCart } = useAppContext();

  const variantId = variant ? variant.variantId || variant.id || '' : '';
  const variantPdp = useMemo(() => {
    if (!variant) {
      return null;
    }
    if (variant.variantPdp && typeof variant.variantPdp === 'object') {
      return variant.variantPdp;
    }
    return variant;
  }, [variant]);

  const handleAddToCart = useCallback(
    (event) => {
      event.stopPropagation();
      if (!variantPdp || typeof addToCart !== 'function') {
        return;
      }
      addToCart(variantPdp);
    },
    [variantPdp, addToCart],
  );

  const label = variant ? variant.label || variant.name || `Variant ${index + 1}` : `Variant ${index + 1}`;
  const cohortType = variant ? variant.cohortType || '' : '';
  const behavioralOverlay = variant ? variant.behavioralOverlay || '' : '';
  const controlFlag = variant ? variant.controlFlag === true : false;
  const priority = variant && typeof variant.priority === 'number' ? variant.priority : 0;

  const productTitle = variantPdp ? variantPdp.title || '' : '';
  const productPrice = variantPdp && typeof variantPdp.price === 'number' ? variantPdp.price : null;
  const productImageUrl = variantPdp ? variantPdp.imageUrl || '' : '';
  const productBadges = variantPdp && Array.isArray(variantPdp.badges) ? variantPdp.badges : [];
  const primaryCTA = variantPdp ? variantPdp.primaryCTA || 'Add to Cart' : 'Add to Cart';
  const ctaTone = variantPdp ? variantPdp.ctaTone || 'standard' : 'standard';

  const tailoringDimensions = useMemo(() => extractTailoringDimensions(variant), [variant]);

  const simpleDiff = useMemo(() => {
    if (!showDiff || !diffToggle || !canonicalPdp || !variant) {
      return { dimensions: [], fields: [], hasChanges: false };
    }
    return computeSimpleDiff(canonicalPdp, variant);
  }, [showDiff, diffToggle, canonicalPdp, variant]);

  const cohortColors = useMemo(() => getCohortBadgeColors(cohortType), [cohortType]);
  const overlayColors = useMemo(() => getOverlayBadgeColors(behavioralOverlay), [behavioralOverlay]);

  const handleClick = useCallback(() => {
    if (variantId) {
      navigate(`/variants/${variantId}`);
    }
  }, [variantId, navigate]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  if (!variant || typeof variant !== 'object') {
    return (
      <div
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <p className="text-sm text-neutral-500">No variant data available.</p>
      </div>
    );
  }

  const diffHighlightClass =
    showDiff && diffToggle && simpleDiff.hasChanges
      ? ' ring-2 ring-accent-500 ring-offset-2'
      : '';

  return (
    <article
      role="article"
      aria-label={`Variant card: ${label}`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:border-neutral-300 hover:-translate-y-0.5 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 animate-fade-in${diffHighlightClass}${className ? ` ${className}` : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image preview */}
      <div className="relative aspect-[16/9] w-full bg-neutral-100 overflow-hidden">
        {productImageUrl ? (
          <img
            src={productImageUrl}
            alt={productTitle || label}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100">
            <svg
              className="h-10 w-10 text-neutral-300"
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
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
              />
            </svg>
          </div>
        )}

        {/* Control flag badge */}
        {controlFlag && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-neutral-900/80 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
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

        {/* Priority badge */}
        {priority > 0 && (
          <span className="absolute top-2 right-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-500 text-xs font-bold text-white shadow-sm">
            {priority}
          </span>
        )}

        {/* Product badges overlay */}
        {productBadges.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {productBadges.slice(0, 2).map((badgeLabel, badgeIndex) => (
              <span
                key={`${badgeLabel}-${badgeIndex}`}
                className="inline-flex items-center rounded-md bg-primary-500/90 px-1.5 py-0.5 text-xs font-semibold text-white shadow-sm"
              >
                {badgeLabel}
              </span>
            ))}
            {productBadges.length > 2 && (
              <span className="inline-flex items-center rounded-md bg-neutral-900/60 px-1.5 py-0.5 text-xs font-medium text-white">
                +{productBadges.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Diff accent tag — "changed for [cohort]" (PRD §15) */}
        {showDiff && diffToggle && simpleDiff.hasChanges && (
          <div className="flex items-center gap-1.5 rounded-md bg-accent-50 border border-accent-200 px-2.5 py-1.5 animate-fade-in">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0 text-accent-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
            <span className="text-xs font-semibold text-accent-700">
              {simpleDiff.dimensions.length} change{simpleDiff.dimensions.length === 1 ? '' : 's'} from control
            </span>
            {cohortType && (
              <span className="text-xs text-accent-600 truncate">· for {cohortType.replace(/[-_]/g, ' ')}</span>
            )}
          </div>
        )}

        {/* Variant label */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
            {label}
          </h3>
          {productTitle && productTitle !== label && (
            <p className="mt-0.5 text-xs text-neutral-500 truncate" title={productTitle}>
              {productTitle}
            </p>
          )}
        </div>

        {/* Cohort + Behavioral overlay badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {cohortType && (
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cohortColors.bg} ${cohortColors.text}`}
            >
              {cohortType.replace(/-/g, ' ').replace(/_/g, ' ')}
            </span>
          )}
          {behavioralOverlay && (
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${overlayColors.bg} ${overlayColors.text}`}
            >
              {behavioralOverlay.replace(/-/g, ' ').replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Price + CTA preview */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            {productPrice !== null && (
              <span className="text-sm font-bold text-neutral-900">
                {formatCurrency(productPrice)}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                ctaTone === 'urgent'
                  ? 'bg-red-50 text-red-700'
                  : ctaTone === 'value'
                    ? 'bg-green-50 text-green-700'
                    : ctaTone === 'premium'
                      ? 'bg-primary-50 text-primary-700'
                      : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {primaryCTA}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            Add to Cart
          </button>
        </div>

        {/* Tailoring dimensions */}
        {tailoringDimensions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tailoringDimensions.slice(0, 5).map((dimension) => (
              <span
                key={dimension}
                className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
              >
                {formatDimensionLabel(dimension)}
              </span>
            ))}
            {tailoringDimensions.length > 5 && (
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                +{tailoringDimensions.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Diff summary */}
        {showDiff && diffToggle && simpleDiff.hasChanges && (
          <div className="flex items-center gap-2 border-t border-neutral-100 pt-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${getDiffCountColor(simpleDiff.dimensions.length)}`}
            >
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
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                />
              </svg>
              {simpleDiff.dimensions.length} dimension{simpleDiff.dimensions.length === 1 ? '' : 's'}
            </span>
            <span className="text-xs text-neutral-400">
              {simpleDiff.fields.length} field{simpleDiff.fields.length === 1 ? '' : 's'} changed
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
        <div className="flex items-center gap-1">
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
          <span className="text-xs text-neutral-400 font-mono truncate max-w-[120px]" title={variantId}>
            {variantId}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 group-hover:text-primary-600 transition-colors duration-200">
          View Details
          <svg
            className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
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
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </span>
      </div>
    </article>
  );
}

VariantCard.propTypes = {
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
  index: PropTypes.number,
  showDiff: PropTypes.bool,
  className: PropTypes.string,
};

VariantCard.defaultProps = {
  variant: undefined,
  canonicalPdp: undefined,
  index: 0,
  showDiff: true,
  className: undefined,
};

export default VariantCard;