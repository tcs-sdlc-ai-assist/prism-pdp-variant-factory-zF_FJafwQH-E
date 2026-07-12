import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import VariantCard from '@/components/gallery/VariantCard.jsx';
import DiffToggle from '@/components/gallery/DiffToggle.jsx';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';
import { MAX_VARIANTS } from '@/constants/constants.js';

/**
 * @typedef {Object} VariantGalleryGridProps
 * @property {Array<object>} [variants] - Array of variant objects to display (defaults to context variants)
 * @property {object} [canonicalPdp] - The canonical/control product data for diff computation
 * @property {boolean} [loading=false] - Whether variants are currently loading
 * @property {boolean} [showDiffToggle=true] - Whether to show the diff toggle control
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Returns the appropriate grid column classes for responsive layout.
 * 1 col at mobile (375px), 2 cols at 768px, 3 cols at 1024px, 4 cols at 1280px.
 *
 * @returns {string} Tailwind grid column classes
 */
function getGridClasses() {
  return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6';
}

/**
 * Variant gallery grid component: renders responsive grid of up to 10 VariantCard
 * components. Includes DiffToggle, gallery header with variant count, and empty state.
 * Responsive: 1 col at 375px, 2 cols at 768px, 3-4 cols at 1280px.
 * Manages gallery-level state and keyboard navigation between cards.
 *
 * @param {VariantGalleryGridProps} props
 * @returns {React.ReactElement}
 */
function VariantGalleryGrid({
  variants: variantsProp,
  canonicalPdp,
  loading = false,
  showDiffToggle = true,
  className,
}) {
  const { variants: contextVariants, diffToggle } = useAppContext();
  const { announceToScreenReader, handleKeyboardNav } = useAccessibility();

  const [announcement, setAnnouncement] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const gridRef = useRef(null);
  const cardRefs = useRef([]);

  const variants = useMemo(() => {
    const source = Array.isArray(variantsProp) ? variantsProp : contextVariants;
    if (!Array.isArray(source)) {
      return [];
    }
    return source.slice(0, MAX_VARIANTS);
  }, [variantsProp, contextVariants]);

  const variantCount = variants.length;
  const hasVariants = variantCount > 0;
  const controlVariant = useMemo(() => {
    return variants.find((v) => v && v.controlFlag === true) || null;
  }, [variants]);

  const resolvedCanonicalPdp = useMemo(() => {
    if (canonicalPdp && typeof canonicalPdp === 'object') {
      return canonicalPdp;
    }
    if (controlVariant && controlVariant.variantPdp && typeof controlVariant.variantPdp === 'object') {
      return controlVariant.variantPdp;
    }
    return null;
  }, [canonicalPdp, controlVariant]);

  useEffect(() => {
    if (hasVariants && !loading) {
      emitEvent(EVENT_TYPES.PDP_LOAD, {
        action: 'VariantGalleryGrid:render',
        variantCount,
        diffEnabled: diffToggle,
      });
    }
  }, [hasVariants, loading, variantCount, diffToggle]);

  const setCardRef = useCallback((index, el) => {
    cardRefs.current[index] = el;
  }, []);

  const focusCard = useCallback((index) => {
    if (index >= 0 && index < variantCount && cardRefs.current[index]) {
      const card = cardRefs.current[index];
      const focusable = card.querySelector('[tabindex="0"], a, button');
      if (focusable) {
        focusable.focus();
      } else {
        card.focus();
      }
      setFocusedIndex(index);
    }
  }, [variantCount]);

  const handleGridKeyDown = useCallback(
    (event) => {
      if (!hasVariants) {
        return;
      }

      const gridEl = gridRef.current;
      if (!gridEl) {
        return;
      }

      const handlers = {
        ArrowRight: (e) => {
          e.preventDefault();
          const nextIndex = focusedIndex < variantCount - 1 ? focusedIndex + 1 : 0;
          focusCard(nextIndex);
          announceToScreenReader(
            `Variant ${nextIndex + 1} of ${variantCount}: ${variants[nextIndex]?.label || variants[nextIndex]?.name || `Variant ${nextIndex + 1}`}`,
            'polite',
          );
        },
        ArrowLeft: (e) => {
          e.preventDefault();
          const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : variantCount - 1;
          focusCard(prevIndex);
          announceToScreenReader(
            `Variant ${prevIndex + 1} of ${variantCount}: ${variants[prevIndex]?.label || variants[prevIndex]?.name || `Variant ${prevIndex + 1}`}`,
            'polite',
          );
        },
        ArrowDown: (e) => {
          e.preventDefault();
          const cols = getVisibleColumns(gridEl);
          const nextIndex = Math.min(focusedIndex + cols, variantCount - 1);
          if (nextIndex !== focusedIndex) {
            focusCard(nextIndex);
            announceToScreenReader(
              `Variant ${nextIndex + 1} of ${variantCount}: ${variants[nextIndex]?.label || variants[nextIndex]?.name || `Variant ${nextIndex + 1}`}`,
              'polite',
            );
          }
        },
        ArrowUp: (e) => {
          e.preventDefault();
          const cols = getVisibleColumns(gridEl);
          const prevIndex = Math.max(focusedIndex - cols, 0);
          if (prevIndex !== focusedIndex) {
            focusCard(prevIndex);
            announceToScreenReader(
              `Variant ${prevIndex + 1} of ${variantCount}: ${variants[prevIndex]?.label || variants[prevIndex]?.name || `Variant ${prevIndex + 1}`}`,
              'polite',
            );
          }
        },
        Home: (e) => {
          e.preventDefault();
          focusCard(0);
          announceToScreenReader(
            `First variant: ${variants[0]?.label || variants[0]?.name || 'Variant 1'}`,
            'polite',
          );
        },
        End: (e) => {
          e.preventDefault();
          focusCard(variantCount - 1);
          announceToScreenReader(
            `Last variant: ${variants[variantCount - 1]?.label || variants[variantCount - 1]?.name || `Variant ${variantCount}`}`,
            'polite',
          );
        },
      };

      handleKeyboardNav(event, handlers);
    },
    [hasVariants, focusedIndex, variantCount, variants, focusCard, announceToScreenReader, handleKeyboardNav],
  );

  const handleCardFocus = useCallback((index) => {
    setFocusedIndex(index);
  }, []);

  // Loading state
  if (loading) {
    return (
      <section
        role="region"
        aria-label="Variant gallery"
        className={`flex flex-col gap-6 animate-fade-in${className ? ` ${className}` : ''}`}
      >
        {/* Header skeleton */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SkeletonLoader shape="circle" width="w-6" height="h-6" ariaLabel="Loading gallery header" />
            <SkeletonLoader shape="text" width="w-48" height="h-5" ariaLabel="Loading gallery title" />
          </div>
          <SkeletonLoader shape="text" width="w-32" height="h-5" ariaLabel="Loading gallery controls" />
        </div>

        {/* Grid skeleton */}
        <div className={getGridClasses()}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex flex-col gap-3">
              <SkeletonLoader
                shape="rectangle"
                width="w-full"
                height="h-40"
                ariaLabel={`Loading variant card ${i + 1}`}
              />
              <SkeletonLoader shape="text" width="w-3/4" ariaLabel="Loading variant label" />
              <SkeletonLoader shape="text-sm" width="w-1/2" ariaLabel="Loading variant details" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (!hasVariants) {
    return (
      <section
        role="region"
        aria-label="Variant gallery"
        className={`flex flex-col gap-6 animate-fade-in${className ? ` ${className}` : ''}`}
      >
        <div className="flex flex-col items-center justify-center min-h-[300px] rounded-lg border-2 border-dashed border-neutral-300 bg-white p-8">
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
              d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
            />
          </svg>
          <h3 className="text-base font-semibold text-neutral-700 mb-1">
            No Variants Generated
          </h3>
          <p className="text-sm text-neutral-500 text-center max-w-md">
            Configure cohort targets and generate variants to see them displayed here.
            Navigate to the Cohorts page to get started.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label="Variant gallery"
      className={`flex flex-col gap-6 animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Gallery Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-6 w-6 text-primary-500"
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
              d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
            />
          </svg>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Variant Gallery
            </h2>
            <p className="text-sm text-neutral-500">
              {variantCount} variant{variantCount === 1 ? '' : 's'} generated
              {diffToggle && ' · Diff highlighting enabled'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Variant count badge */}
          <span className="inline-flex items-center rounded-md bg-primary-50 px-2.5 py-1 text-sm font-medium text-primary-700">
            {variantCount}/{MAX_VARIANTS} variant{variantCount === 1 ? '' : 's'}
          </span>

          {/* Diff toggle */}
          {showDiffToggle && (
            <DiffToggle disabled={!hasVariants} />
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div
        ref={gridRef}
        className={getGridClasses()}
        role="grid"
        aria-label={`Variant gallery grid — ${variantCount} variant${variantCount === 1 ? '' : 's'}`}
        onKeyDown={handleGridKeyDown}
      >
        {variants.map((variant, index) => (
          <div
            key={variant?.variantId || variant?.id || `variant-${index}`}
            ref={(el) => setCardRef(index, el)}
            role="gridcell"
            onFocus={() => handleCardFocus(index)}
          >
            <VariantCard
              variant={variant}
              canonicalPdp={resolvedCanonicalPdp}
              index={index}
              showDiff={diffToggle}
            />
          </div>
        ))}
      </div>

      {/* Gallery Footer */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
        <div className="flex items-center gap-2">
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
            {variantCount} variant{variantCount === 1 ? '' : 's'} displayed
            {controlVariant && ' · Control variant included'}
            {diffToggle && ` · Diff from control enabled`}
          </p>
        </div>

        <p className="text-xs text-neutral-400">
          Use arrow keys to navigate between cards
        </p>
      </div>

      {/* Aria live region for announcements */}
      <AriaLiveRegion
        message={announcement}
        politeness="polite"
        atomic={true}
        clearAfterMs={5000}
      />
    </section>
  );
}

/**
 * Estimates the number of visible columns in the grid based on container width.
 *
 * @param {HTMLElement} gridEl - The grid container element
 * @returns {number} Estimated number of columns
 */
function getVisibleColumns(gridEl) {
  if (!gridEl) {
    return 1;
  }

  const width = gridEl.offsetWidth;

  if (width >= 1280) {
    return 4;
  }
  if (width >= 1024) {
    return 3;
  }
  if (width >= 640) {
    return 2;
  }
  return 1;
}

VariantGalleryGrid.propTypes = {
  variants: PropTypes.arrayOf(
    PropTypes.shape({
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
  ),
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
  loading: PropTypes.bool,
  showDiffToggle: PropTypes.bool,
  className: PropTypes.string,
};

VariantGalleryGrid.defaultProps = {
  variants: undefined,
  canonicalPdp: undefined,
  loading: false,
  showDiffToggle: true,
  className: undefined,
};

export default VariantGalleryGrid;