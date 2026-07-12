import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import { ROUTE_PATHS } from '@/constants/constants.js';
import VariantGalleryGrid from '@/components/gallery/VariantGalleryGrid.jsx';
import BulkExportButton from '@/components/gallery/BulkExportButton.jsx';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';

/**
 * Variant Gallery page component: route /variants (gallery).
 * Renders VariantGalleryGrid and BulkExportButton.
 * Shows empty state with CTA to Cohort Intake if no variants exist.
 * Lazy-loaded route.
 *
 * @returns {React.ReactElement}
 */
function GalleryPage() {
  const navigate = useNavigate();
  const { variants, catalog, isLoading } = useAppContext();
  const { announceToScreenReader } = useAccessibility();

  const [announcement, setAnnouncement] = useState('');

  const hasVariants = useMemo(() => {
    return Array.isArray(variants) && variants.length > 0;
  }, [variants]);

  const variantCount = useMemo(() => {
    return Array.isArray(variants) ? variants.length : 0;
  }, [variants]);

  const controlVariant = useMemo(() => {
    if (!Array.isArray(variants)) {
      return null;
    }
    return variants.find((v) => v && v.controlFlag === true) || null;
  }, [variants]);

  const canonicalPdp = useMemo(() => {
    if (controlVariant && controlVariant.variantPdp && typeof controlVariant.variantPdp === 'object') {
      return controlVariant.variantPdp;
    }
    if (Array.isArray(catalog) && catalog.length > 0) {
      return catalog[0];
    }
    return null;
  }, [controlVariant, catalog]);

  const handleNavigateToCohorts = useCallback(() => {
    navigate(ROUTE_PATHS.COHORTS);
  }, [navigate]);

  const handleNavigateToCatalog = useCallback(() => {
    navigate(ROUTE_PATHS.CATALOG);
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return (
      <section
        role="region"
        aria-label="Variant gallery"
        className="flex flex-col gap-6 animate-fade-in"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SkeletonLoader shape="circle" width="w-6" height="h-6" ariaLabel="Loading gallery header" />
            <SkeletonLoader shape="text" width="w-48" height="h-6" ariaLabel="Loading gallery title" />
          </div>
          <SkeletonLoader shape="text" width="w-32" height="h-8" ariaLabel="Loading gallery controls" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
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

  // Empty state — no variants generated
  if (!hasVariants) {
    return (
      <section
        role="region"
        aria-label="Variant gallery"
        className="flex flex-col gap-6 animate-fade-in"
      >
        {/* Page Header */}
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
              <h1 className="text-lg font-bold text-neutral-900">
                Variant Gallery
              </h1>
              <p className="text-sm text-neutral-500">
                No variants generated yet.
              </p>
            </div>
          </div>
        </div>

        {/* Empty state CTA */}
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border-2 border-dashed border-neutral-300 bg-white p-8">
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
          <p className="text-sm text-neutral-500 text-center max-w-md mb-6">
            Configure cohort targets and generate tailored PDP variants to see them displayed here.
            Navigate to the Cohorts page to get started.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleNavigateToCohorts}
              className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              <svg
                className="h-4 w-4"
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
              Go to Cohort Intake
            </button>
            <button
              type="button"
              onClick={handleNavigateToCatalog}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              <svg
                className="h-4 w-4"
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
              View Catalog
            </button>
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
            No variants to display. Configure cohort targets on the Cohorts page to generate variants.
          </p>
        </div>

        <AriaLiveRegion
          message={announcement}
          politeness="polite"
          atomic={true}
          clearAfterMs={5000}
        />
      </section>
    );
  }

  // Gallery with variants
  return (
    <section
      role="region"
      aria-label="Variant gallery"
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* Page Header */}
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
            <h1 className="text-lg font-bold text-neutral-900">
              Variant Gallery
            </h1>
            <p className="text-sm text-neutral-500">
              {variantCount} variant{variantCount === 1 ? '' : 's'} generated · Review, compare, and export.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigate to cohorts */}
          <button
            type="button"
            onClick={handleNavigateToCohorts}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <svg
              className="h-4 w-4"
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
            Cohort Intake
          </button>

          {/* Bulk export button */}
          <BulkExportButton variants={variants} />
        </div>
      </div>

      {/* Variant Gallery Grid */}
      <VariantGalleryGrid
        variants={variants}
        canonicalPdp={canonicalPdp}
        loading={false}
        showDiffToggle={true}
      />

      {/* Footer */}
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
            {' · Click a card to view variant details'}
          </p>
        </div>

        <p className="text-xs text-neutral-400">
          Use the export button to download variant manifests
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

export default GalleryPage;