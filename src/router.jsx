import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout.jsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';

const CatalogPage = lazy(() => import('@/pages/CatalogPage.jsx'));
const CohortsPage = lazy(() => import('@/pages/CohortsPage.jsx'));
const GalleryPage = lazy(() => import('@/pages/GalleryPage.jsx'));
const PdpPage = lazy(() => import('@/pages/PdpPage.jsx'));
const VariantDetailPage = lazy(() => import('@/pages/VariantDetailPage.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

/**
 * Suspense fallback component for lazy-loaded route pages.
 *
 * @returns {React.ReactElement}
 */
function PageLoader() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <SkeletonLoader shape="circle" width="w-6" height="h-6" ariaLabel="Loading page header" />
          <SkeletonLoader shape="text" width="w-48" height="h-6" ariaLabel="Loading page title" />
        </div>
        <SkeletonLoader shape="text" width="w-32" height="h-8" ariaLabel="Loading page controls" />
      </div>
      <SkeletonLoader shape="rectangle" width="w-full" height="h-48" ariaLabel="Loading page content" />
      <SkeletonLoader shape="text" lines={3} ariaLabel="Loading page details" />
    </div>
  );
}

/**
 * Wraps a lazy-loaded page component in Suspense with the PageLoader fallback.
 *
 * @param {React.ReactElement} element - The lazy-loaded page element
 * @returns {React.ReactElement}
 */
function withSuspense(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

/**
 * React Router v6 browser router configuration.
 * Defines all application routes with lazy-loaded pages.
 *
 * Routes:
 * - / → redirects to /cohorts
 * - /catalog → CatalogPage
 * - /catalog/:productId → PdpPage
 * - /pdp/:sku → PdpPage
 * - /cohorts → CohortsPage
 * - /variants → GalleryPage (gallery)
 * - /variants/:variantId → VariantDetailPage
 * - * → NotFoundPage
 *
 * Uses Layout as the parent route element for all pages.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: (
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        </ErrorBoundary>
      </Layout>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/cohorts" replace />,
      },
      {
        path: 'catalog',
        element: withSuspense(<CatalogPage />),
      },
      {
        path: 'catalog/:productId',
        element: withSuspense(<PdpPage />),
      },
      {
        path: 'pdp/:sku',
        element: withSuspense(<PdpPage />),
      },
      {
        path: 'cohorts',
        element: withSuspense(<CohortsPage />),
      },
      {
        path: 'cohorts/:cohortId',
        element: withSuspense(<CohortsPage />),
      },
      {
        path: 'variants',
        element: withSuspense(<GalleryPage />),
      },
      {
        path: 'variants/:variantId',
        element: withSuspense(<VariantDetailPage />),
      },
      {
        path: '*',
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
]);

export default router;