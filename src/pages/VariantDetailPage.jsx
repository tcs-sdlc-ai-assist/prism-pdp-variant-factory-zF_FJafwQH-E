import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext.jsx';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import { ROUTE_PATHS } from '@/constants/constants.js';
import VariantDetailLayout from '@/components/detail/VariantDetailLayout.jsx';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';

/**
 * Variant Detail page component: route /variants/:variantId.
 * Loads variant data by ID from context, computes diff from canonical PDP,
 * renders VariantDetailLayout. Shows 404 state if variant not found.
 * Lazy-loaded route.
 *
 * @returns {React.ReactElement}
 */
function VariantDetailPage() {
  const { variantId } = useParams();
  const { variants, catalog, isLoading } = useAppContext();

  const resolvedVariant = useMemo(() => {
    if (!variantId || !Array.isArray(variants) || variants.length === 0) {
      return null;
    }
    return (
      variants.find(
        (v) => v && (v.variantId === variantId || v.id === variantId),
      ) || null
    );
  }, [variantId, variants]);

  const controlVariant = useMemo(() => {
    if (!Array.isArray(variants)) {
      return null;
    }
    return variants.find((v) => v && v.controlFlag === true) || null;
  }, [variants]);

  const canonicalPdp = useMemo(() => {
    if (
      controlVariant &&
      controlVariant.variantPdp &&
      typeof controlVariant.variantPdp === 'object'
    ) {
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
    if (Array.isArray(catalog) && catalog.length > 0) {
      return catalog[0];
    }
    return null;
  }, [controlVariant, resolvedVariant, catalog]);

  // Emit PDP load event when variant is found
  useMemo(() => {
    if (resolvedVariant) {
      emitEvent(EVENT_TYPES.PDP_LOAD, {
        action: 'VariantDetailPage:load',
        variantId: resolvedVariant.variantId || resolvedVariant.id,
        label: resolvedVariant.label || resolvedVariant.name,
        cohortType: resolvedVariant.cohortType,
        behavioralOverlay: resolvedVariant.behavioralOverlay,
      });
    }
  }, [resolvedVariant]);

  // Loading state
  if (isLoading) {
    return (
      <section
        role="region"
        aria-label="Variant detail page"
        className="flex flex-col gap-6 animate-fade-in"
      >
        <SkeletonLoader shape="text" width="w-64" height="h-4" ariaLabel="Loading breadcrumbs" />
        <SkeletonLoader
          shape="rectangle"
          width="w-full"
          height="h-10"
          ariaLabel="Loading variant actions"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <SkeletonLoader
              shape="rectangle"
              width="w-full"
              height="h-64"
              ariaLabel="Loading product hero"
            />
            <SkeletonLoader
              shape="rectangle"
              width="w-full"
              height="h-40"
              ariaLabel="Loading price block"
            />
            <SkeletonLoader shape="text" lines={3} ariaLabel="Loading product details" />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <SkeletonLoader
              shape="rectangle"
              width="w-full"
              height="h-48"
              ariaLabel="Loading cohort profile"
            />
            <SkeletonLoader
              shape="rectangle"
              width="w-full"
              height="h-32"
              ariaLabel="Loading manifest viewer"
            />
          </div>
        </div>
      </section>
    );
  }

  // 404 state — variant not found
  if (!resolvedVariant) {
    return (
      <section
        role="region"
        aria-label="Variant not found"
        className="flex flex-col gap-6 animate-fade-in"
      >
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-neutral-500" role="list">
            <li>
              <Link
                to={ROUTE_PATHS.HOME}
                className="text-neutral-500 hover:text-primary-500 transition-colors duration-200 no-underline"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <svg
                className="h-3.5 w-3.5 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </li>
            <li>
              <Link
                to={ROUTE_PATHS.VARIANTS}
                className="text-neutral-500 hover:text-primary-500 transition-colors duration-200 no-underline"
              >
                Gallery
              </Link>
            </li>
            <li aria-hidden="true">
              <svg
                className="h-3.5 w-3.5 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </li>
            <li>
              <span className="text-neutral-700 font-medium" aria-current="page">
                Not Found
              </span>
            </li>
          </ol>
        </nav>

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
              d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-neutral-700 mb-1">Variant Not Found</h2>
          <p className="text-sm text-neutral-500 text-center max-w-md mb-6">
            {variantId
              ? `No variant found with ID "${variantId}". It may have been removed or not yet generated.`
              : 'No variant specified. Navigate to the gallery to select a variant.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTE_PATHS.VARIANTS}
              className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 no-underline"
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
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
                />
              </svg>
              Back to Gallery
            </Link>
            <Link
              to={ROUTE_PATHS.COHORTS}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 no-underline"
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
            </Link>
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
            Variant not found
            {variantId && ` · Requested ID: ${variantId}`}
            {' · Navigate to the gallery or generate new variants from the Cohorts page'}
          </p>
        </div>
      </section>
    );
  }

  const variantLabel = resolvedVariant.label || resolvedVariant.name || 'Variant';

  // Variant found — render detail layout
  return (
    <section
      role="region"
      aria-label={`Variant detail page: ${variantLabel}`}
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="animate-fade-in">
        <ol className="flex items-center gap-1.5 text-sm text-neutral-500" role="list">
          <li>
            <Link
              to={ROUTE_PATHS.HOME}
              className="text-neutral-500 hover:text-primary-500 transition-colors duration-200 no-underline"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <svg
              className="h-3.5 w-3.5 text-neutral-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </li>
          <li>
            <Link
              to={ROUTE_PATHS.VARIANTS}
              className="text-neutral-500 hover:text-primary-500 transition-colors duration-200 no-underline"
            >
              Gallery
            </Link>
          </li>
          <li aria-hidden="true">
            <svg
              className="h-3.5 w-3.5 text-neutral-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </li>
          <li>
            <span
              className="text-neutral-700 font-medium truncate max-w-[200px] inline-block align-bottom"
              aria-current="page"
              title={variantLabel}
            >
              {variantLabel}
            </span>
          </li>
        </ol>
      </nav>

      {/* Variant Detail Layout */}
      <VariantDetailLayout variant={resolvedVariant} canonicalPdp={canonicalPdp} />
    </section>
  );
}

export default VariantDetailPage;