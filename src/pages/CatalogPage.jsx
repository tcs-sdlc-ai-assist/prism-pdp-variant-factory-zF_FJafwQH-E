import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { resetCatalog } from '@/services/catalogLoader.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';

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
 * Returns badge color classes based on badge text.
 *
 * @param {string} badge - The badge text
 * @returns {{ bg: string, text: string }}
 */
function getBadgeColors(badge) {
  const label = (badge || '').toLowerCase();

  if (label.includes('best seller') || label.includes('top rated')) {
    return { bg: 'bg-primary-500', text: 'text-white' };
  }
  if (label.includes('price drop') || label.includes('clearance')) {
    return { bg: 'bg-green-600', text: 'text-white' };
  }
  if (label.includes('new') || label.includes('release')) {
    return { bg: 'bg-accent-500', text: 'text-neutral-900' };
  }
  if (label.includes('member') || label.includes('deal')) {
    return { bg: 'bg-primary-600', text: 'text-white' };
  }
  if (label.includes('great value')) {
    return { bg: 'bg-green-600', text: 'text-white' };
  }

  return { bg: 'bg-neutral-600', text: 'text-white' };
}

/**
 * Single product card component for the catalog grid.
 *
 * @param {{ product: object, index: number }} props
 * @returns {React.ReactElement}
 */
function ProductCard({ product, index }) {
  const navigate = useNavigate();

  const title = product.title || 'Untitled Product';
  const price = typeof product.price === 'number' ? product.price : 0;
  const memberPrice = typeof product.memberPrice === 'number' ? product.memberPrice : null;
  const rating = typeof product.rating === 'number' ? product.rating : 0;
  const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : 0;
  const imageUrl = product.imageUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  const category = product.category || '';
  const brand = product.brand || '';
  const badge = product.badge || '';
  const sku = product.sku || '';
  const fulfillment = product.fulfillment || '';

  const badgeColors = useMemo(() => getBadgeColors(badge), [badge]);

  const handleViewPdp = useCallback(() => {
    if (sku) {
      navigate(`/catalog/${product.id}`);
    }
  }, [sku, product.id, navigate]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleViewPdp();
      }
    },
    [handleViewPdp],
  );

  return (
    <article
      role="article"
      aria-label={`Product card: ${title}`}
      tabIndex={0}
      onClick={handleViewPdp}
      onKeyDown={handleKeyDown}
      className="group relative flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:border-neutral-300 hover:-translate-y-0.5 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[3/2] w-full bg-neutral-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badge */}
        {badge && (
          <span
            className={`absolute top-2 left-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold shadow-sm ${badgeColors.bg} ${badgeColors.text}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category */}
        {category && (
          <span className="inline-flex items-center self-start rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
            {category}
          </span>
        )}

        {/* Brand */}
        {brand && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">
            {brand}
          </p>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
          {title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <StarRating rating={rating} />
          <span className="text-sm font-medium text-neutral-700">
            {rating.toFixed(1)}
          </span>
          {reviewCount > 0 && (
            <span className="text-xs text-neutral-500">
              ({reviewCount.toLocaleString()})
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-lg font-bold text-neutral-900">
            {formatCurrency(price)}
          </span>
          {memberPrice !== null && memberPrice < price && (
            <span className="text-sm font-semibold text-primary-600">
              {formatCurrency(memberPrice)} Member
            </span>
          )}
        </div>

        {/* Fulfillment */}
        {fulfillment && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0 text-green-600"
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
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
            <span className="truncate">{fulfillment}</span>
          </div>
        )}

        {/* SKU */}
        <p className="text-xs text-neutral-400 font-mono">
          SKU: {sku}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
        <span className="text-xs text-neutral-400">
          {category}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 group-hover:text-primary-600 transition-colors duration-200">
          View PDP
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

ProductCard.propTypes = {
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
  }).isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * Catalog page component: displays the mock product catalog as a responsive grid
 * of product cards. Each card shows product image placeholder, title, price, rating,
 * and a 'View PDP' link. Includes catalog reset button and loading/empty states.
 *
 * @returns {React.ReactElement}
 */
function CatalogPage() {
  const { catalog, setCatalog, isLoading } = useAppContext();
  const { announceToScreenReader } = useAccessibility();

  const [isResetting, setIsResetting] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const catalogItems = useMemo(() => {
    if (!Array.isArray(catalog)) {
      return [];
    }
    return catalog;
  }, [catalog]);

  const catalogCount = catalogItems.length;

  const handleResetCatalog = useCallback(() => {
    if (isResetting) {
      return;
    }

    setIsResetting(true);

    try {
      const result = resetCatalog();

      if (result.catalog && Array.isArray(result.catalog)) {
        setCatalog(result.catalog);
      }

      const message = `Catalog reset to ${result.catalog ? result.catalog.length : 0} default products`;
      setAnnouncement(message);
      announceToScreenReader(message, 'polite');

      emitEvent(EVENT_TYPES.PDP_LOAD, {
        action: 'CatalogPage:resetCatalog',
        itemCount: result.catalog ? result.catalog.length : 0,
      });
    } catch (e) {
      const errorMsg = `Failed to reset catalog: ${e.message}`;
      setAnnouncement(errorMsg);
      announceToScreenReader(errorMsg, 'assertive');

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'CatalogPage:resetCatalog',
        error: e.message,
      });
    } finally {
      setIsResetting(false);
    }
  }, [isResetting, setCatalog, announceToScreenReader]);

  // Loading state
  if (isLoading) {
    return (
      <section
        role="region"
        aria-label="Product catalog"
        className="flex flex-col gap-6 animate-fade-in"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SkeletonLoader shape="circle" width="w-6" height="h-6" ariaLabel="Loading catalog header" />
            <SkeletonLoader shape="text" width="w-48" height="h-6" ariaLabel="Loading catalog title" />
          </div>
          <SkeletonLoader shape="text" width="w-32" height="h-8" ariaLabel="Loading catalog controls" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex flex-col gap-3">
              <SkeletonLoader
                shape="rectangle"
                width="w-full"
                height="h-44"
                ariaLabel={`Loading product card ${i + 1}`}
              />
              <SkeletonLoader shape="text" width="w-3/4" ariaLabel="Loading product title" />
              <SkeletonLoader shape="text-sm" width="w-1/2" ariaLabel="Loading product details" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (catalogCount === 0) {
    return (
      <section
        role="region"
        aria-label="Product catalog"
        className="flex flex-col gap-6 animate-fade-in"
      >
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
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <h3 className="text-base font-semibold text-neutral-700 mb-1">
            No Products Found
          </h3>
          <p className="text-sm text-neutral-500 text-center max-w-md mb-4">
            The product catalog is empty. Reset to load the default demo catalog with 6 Best Buy-style products.
          </p>
          <button
            type="button"
            onClick={handleResetCatalog}
            disabled={isResetting}
            className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            {isResetting ? 'Resetting…' : 'Reset Catalog'}
          </button>
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

  return (
    <section
      role="region"
      aria-label="Product catalog"
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* Header */}
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
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">
              Product Catalog
            </h1>
            <p className="text-sm text-neutral-500">
              {catalogCount} product{catalogCount === 1 ? '' : 's'} available for PDP variant generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Product count badge */}
          <span className="inline-flex items-center rounded-md bg-primary-50 px-2.5 py-1 text-sm font-medium text-primary-700">
            {catalogCount} product{catalogCount === 1 ? '' : 's'}
          </span>

          {/* Reset catalog button */}
          <button
            type="button"
            onClick={handleResetCatalog}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`h-4 w-4${isResetting ? ' animate-spin' : ''}`}
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
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            {isResetting ? 'Resetting…' : 'Reset Catalog'}
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
        role="list"
        aria-label={`Product catalog — ${catalogCount} product${catalogCount === 1 ? '' : 's'}`}
      >
        {catalogItems.map((product, index) => (
          <div key={product.id || product.sku || `product-${index}`} role="listitem">
            <ProductCard product={product} index={index} />
          </div>
        ))}
      </div>

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
            {catalogCount} product{catalogCount === 1 ? '' : 's'} displayed · Select a product to view its PDP and generate variants
          </p>
        </div>

        <p className="text-xs text-neutral-400">
          Mock catalog data for demonstration purposes
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

export default CatalogPage;