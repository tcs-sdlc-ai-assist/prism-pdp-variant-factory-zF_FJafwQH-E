import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { getSkuById } from '@/services/catalogLoader.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import { ROUTE_PATHS } from '@/constants/constants.js';
import CanonicalPdp from '@/components/pdp/CanonicalPdp.jsx';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';

/**
 * Breadcrumb navigation component for the PDP page.
 *
 * @param {{ productTitle: string, category: string }} props
 * @returns {React.ReactElement}
 */
function Breadcrumbs({ productTitle, category }) {
  return (
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
            to={ROUTE_PATHS.CATALOG}
            className="text-neutral-500 hover:text-primary-500 transition-colors duration-200 no-underline"
          >
            Catalog
          </Link>
        </li>
        {category && (
          <>
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
              <span className="text-neutral-400">{category}</span>
            </li>
          </>
        )}
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
          <span className="text-neutral-700 font-medium truncate max-w-[200px] inline-block align-bottom" aria-current="page" title={productTitle}>
            {productTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
}

Breadcrumbs.propTypes = {
  productTitle: PropTypes.string.isRequired,
  category: PropTypes.string,
};

Breadcrumbs.defaultProps = {
  category: '',
};

/**
 * Canonical PDP page component: route /pdp/:sku (also supports /catalog/:productId).
 * Loads product data by SKU or product ID from catalog, renders full CanonicalPdp component.
 * Includes breadcrumb navigation and link to Cohort Intake.
 * Shows 404 state if SKU/product not found. Lazy-loaded route.
 *
 * @returns {React.ReactElement}
 */
function PdpPage() {
  const { sku, productId } = useParams();
  const { catalog, isLoading } = useAppContext();

  const product = useMemo(() => {
    if (!Array.isArray(catalog) || catalog.length === 0) {
      return null;
    }

    // Try to find by SKU param first
    if (sku && typeof sku === 'string') {
      const found = catalog.find((item) => item.sku === sku);
      if (found) {
        return found;
      }
    }

    // Try to find by productId param (for /catalog/:productId route)
    if (productId && typeof productId === 'string') {
      const foundById = catalog.find((item) => item.id === productId);
      if (foundById) {
        return foundById;
      }
      // Also try matching productId as a SKU
      const foundBySku = catalog.find((item) => item.sku === productId);
      if (foundBySku) {
        return foundBySku;
      }
    }

    return null;
  }, [catalog, sku, productId]);

  // Emit PDP load event when product is found
  useMemo(() => {
    if (product) {
      emitEvent(EVENT_TYPES.PDP_LOAD, {
        action: 'PdpPage:load',
        productId: product.id,
        sku: product.sku,
        title: product.title,
      });
    }
  }, [product]);

  const identifier = sku || productId || '';

  // Loading state
  if (isLoading) {
    return (
      <section
        role="region"
        aria-label="Product detail page"
        className="flex flex-col gap-6 animate-fade-in"
      >
        <SkeletonLoader shape="text" width="w-64" height="h-4" ariaLabel="Loading breadcrumbs" />
        <SkeletonLoader shape="rectangle" width="w-full" height="h-64" ariaLabel="Loading product hero" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SkeletonLoader shape="rectangle" width="w-full" height="h-48" ariaLabel="Loading price block" />
          </div>
          <div className="lg:col-span-7">
            <SkeletonLoader shape="rectangle" width="w-full" height="h-48" ariaLabel="Loading spec table" />
          </div>
        </div>
        <SkeletonLoader shape="rectangle" width="w-full" height="h-40" ariaLabel="Loading reviews" />
      </section>
    );
  }

  // 404 state
  if (!product) {
    return (
      <section
        role="region"
        aria-label="Product not found"
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
                to={ROUTE_PATHS.CATALOG}
                className="text-neutral-500 hover:text-primary-500 transition-colors duration-200 no-underline"
              >
                Catalog
              </Link>
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
          <h2 className="text-lg font-semibold text-neutral-700 mb-1">
            Product Not Found
          </h2>
          <p className="text-sm text-neutral-500 text-center max-w-md mb-4">
            {identifier
              ? `No product found with identifier "${identifier}". It may have been removed or the URL may be incorrect.`
              : 'No product identifier specified. Navigate to the catalog to select a product.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTE_PATHS.CATALOG}
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
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
              Back to Catalog
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label={`Product detail page: ${product.title || 'Product'}`}
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* Breadcrumb */}
      <Breadcrumbs
        productTitle={product.title || 'Product'}
        category={product.category || ''}
      />

      {/* Action bar: Back to Catalog + Generate Variants link */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={ROUTE_PATHS.CATALOG}
          className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 no-underline self-start"
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
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to Catalog
        </Link>

        <Link
          to={ROUTE_PATHS.COHORTS}
          className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 no-underline self-start"
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
          Generate Variants
        </Link>
      </div>

      {/* Full Canonical PDP */}
      <CanonicalPdp product={product} />

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
          {product.title}
          {product.sku && ` · ${product.sku}`}
          {product.category && ` · ${product.category}`}
          {product.brand && ` · ${product.brand}`}
          {' · '}
          <Link
            to={ROUTE_PATHS.COHORTS}
            className="text-primary-500 hover:text-primary-600 transition-colors duration-200 no-underline"
          >
            Configure cohorts to generate variants
          </Link>
        </p>
      </div>
    </section>
  );
}

export default PdpPage;