import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext.jsx';
import { useVariants } from '@/hooks/useVariants.js';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import { ROUTE_PATHS } from '@/constants/constants.js';
import CohortIntakePanel from '@/components/cohorts/CohortIntakePanel.jsx';
import GenerationProgress from '@/components/cohorts/GenerationProgress.jsx';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';

/**
 * Cohort Intake page component: route /cohorts.
 * Renders CohortIntakePanel and GenerationProgress components.
 * Manages the full cohort configuration and variant generation flow.
 * Navigates to Gallery on successful generation. Lazy-loaded route.
 *
 * @returns {React.ReactElement}
 */
function CohortsPage() {
  const navigate = useNavigate();
  const { catalog, cohortSet, isLoading } = useAppContext();
  const { announceToScreenReader } = useAccessibility();
  const {
    variants,
    isGenerating,
    error: generationError,
    progress,
    generateVariants,
    generateForSku,
    retry,
    clearError,
    clearVariants,
  } = useVariants();

  const [announcement, setAnnouncement] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);

  const defaultProduct = useMemo(() => {
    if (!Array.isArray(catalog) || catalog.length === 0) {
      return null;
    }
    return catalog[0];
  }, [catalog]);

  const cohortTargets = useMemo(() => {
    if (!cohortSet || !Array.isArray(cohortSet.cohorts)) {
      return [];
    }
    return cohortSet.cohorts.map((c) => ({
      label: c.label || '',
      cohortId: c.cohortId || '',
    }));
  }, [cohortSet]);

  const handleGenerate = useCallback(
    async (newCohortSet) => {
      if (!newCohortSet || typeof newCohortSet !== 'object') {
        const errorMsg = 'Invalid cohort set configuration';
        setAnnouncement(errorMsg);
        announceToScreenReader(errorMsg, 'assertive');
        return;
      }

      if (!Array.isArray(catalog) || catalog.length === 0) {
        const errorMsg = 'No catalog products available. Please load the catalog first.';
        setAnnouncement(errorMsg);
        announceToScreenReader(errorMsg, 'assertive');
        return;
      }

      setHasGenerated(true);
      setGenerationComplete(false);
      clearError();

      const targets = Array.isArray(newCohortSet.cohorts) ? newCohortSet.cohorts : [];

      const firstBaseSku = targets.length > 0 && targets[0].baseSku ? targets[0].baseSku : '';

      let canonicalPdp = null;

      if (firstBaseSku) {
        canonicalPdp = catalog.find((item) => item.sku === firstBaseSku) || null;
      }

      if (!canonicalPdp) {
        canonicalPdp = defaultProduct;
      }

      if (!canonicalPdp) {
        const errorMsg = 'No matching product found in catalog for the configured base SKU.';
        setAnnouncement(errorMsg);
        announceToScreenReader(errorMsg, 'assertive');
        return;
      }

      const message = `Starting variant generation for ${targets.length} cohort target${targets.length === 1 ? '' : 's'}…`;
      setAnnouncement(message);
      announceToScreenReader(message, 'polite');

      emitEvent(EVENT_TYPES.COHORT_CONFIG, {
        action: 'CohortsPage:generate',
        cohortSetId: newCohortSet.id,
        cohortCount: targets.length,
        productId: canonicalPdp.id,
        sku: canonicalPdp.sku,
      });

      try {
        const result = await generateVariants(canonicalPdp, newCohortSet);

        setGenerationComplete(true);

        if (result.success && result.variants.length > 0) {
          const successMsg = `Successfully generated ${result.variants.length} variant${result.variants.length === 1 ? '' : 's'}. Navigating to gallery…`;
          setAnnouncement(successMsg);
          announceToScreenReader(successMsg, 'polite');

          emitEvent(EVENT_TYPES.VARIANT_GENERATED, {
            action: 'CohortsPage:generateComplete',
            generatedCount: result.variants.length,
            errorCount: result.errors.length,
          });

          setTimeout(() => {
            navigate(ROUTE_PATHS.VARIANTS);
          }, 1500);
        } else {
          const failMsg = result.errors.length > 0
            ? `Generation completed with errors: ${result.errors.join('; ')}`
            : 'Variant generation completed but no variants were produced.';
          setAnnouncement(failMsg);
          announceToScreenReader(failMsg, 'assertive');

          emitEvent(EVENT_TYPES.ERROR, {
            action: 'CohortsPage:generateFailed',
            errors: result.errors,
          });
        }
      } catch (e) {
        setGenerationComplete(true);
        const errorMsg = `Variant generation failed: ${e.message}`;
        setAnnouncement(errorMsg);
        announceToScreenReader(errorMsg, 'assertive');

        emitEvent(EVENT_TYPES.ERROR, {
          action: 'CohortsPage:generateError',
          error: e.message,
        });
      }
    },
    [catalog, defaultProduct, generateVariants, clearError, announceToScreenReader, navigate],
  );

  const handleRetry = useCallback(async () => {
    setGenerationComplete(false);
    clearError();

    const message = 'Retrying variant generation…';
    setAnnouncement(message);
    announceToScreenReader(message, 'polite');

    await retry();
  }, [retry, clearError, announceToScreenReader]);

  const handleNavigateToGallery = useCallback(() => {
    navigate(ROUTE_PATHS.VARIANTS);
  }, [navigate]);

  const handleNavigateToCatalog = useCallback(() => {
    navigate(ROUTE_PATHS.CATALOG);
  }, [navigate]);

  const showProgress = hasGenerated && (isGenerating || generationComplete);
  const hasVariants = Array.isArray(variants) && variants.length > 0;

  if (isLoading) {
    return (
      <section
        role="region"
        aria-label="Cohort intake"
        className="flex flex-col gap-6 animate-fade-in"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SkeletonLoader shape="circle" width="w-6" height="h-6" ariaLabel="Loading cohort header" />
            <SkeletonLoader shape="text" width="w-48" height="h-6" ariaLabel="Loading cohort title" />
          </div>
          <SkeletonLoader shape="text" width="w-32" height="h-8" ariaLabel="Loading cohort controls" />
        </div>

        <SkeletonLoader shape="rectangle" width="w-full" height="h-48" ariaLabel="Loading cohort intake panel" />
        <SkeletonLoader shape="rectangle" width="w-full" height="h-32" ariaLabel="Loading cohort form" />
        <SkeletonLoader shape="text" lines={2} ariaLabel="Loading cohort details" />
      </section>
    );
  }

  const hasCatalog = Array.isArray(catalog) && catalog.length > 0;

  return (
    <section
      role="region"
      aria-label="Cohort intake and variant generation"
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
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
            />
          </svg>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">
              Cohort Intake & Variant Generation
            </h1>
            <p className="text-sm text-neutral-500">
              Configure cohort targets and generate tailored PDP variants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigate to catalog */}
          <button
            type="button"
            onClick={handleNavigateToCatalog}
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
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
            View Catalog
          </button>

          {/* Navigate to gallery if variants exist */}
          {hasVariants && (
            <button
              type="button"
              onClick={handleNavigateToGallery}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
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
              View Gallery ({variants.length})
            </button>
          )}
        </div>
      </div>

      {/* No catalog warning */}
      {!hasCatalog && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3"
        >
          <svg
            className="h-5 w-5 flex-shrink-0 text-yellow-600 mt-0.5"
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              No catalog products loaded
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Navigate to the{' '}
              <button
                type="button"
                onClick={handleNavigateToCatalog}
                className="font-medium text-yellow-800 underline hover:text-yellow-900 transition-colors duration-200"
              >
                Catalog page
              </button>{' '}
              to load or reset the product catalog before generating variants.
            </p>
          </div>
        </div>
      )}

      {/* Generation error */}
      {generationError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <svg
            className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5"
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Variant generation error
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {generationError}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isGenerating}
              className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors duration-200 hover:bg-red-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="h-3.5 w-3.5"
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
              Retry
            </button>
            <button
              type="button"
              onClick={clearError}
              className="inline-flex items-center rounded-md p-1.5 text-red-600 hover:bg-red-100 hover:text-red-800 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors duration-200"
              aria-label="Dismiss error"
            >
              <svg
                className="h-4 w-4"
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
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Generation Progress */}
      {showProgress && (
        <GenerationProgress
          total={progress.total}
          completed={progress.completed}
          failed={progress.failed}
          percent={progress.percent}
          inProgress={progress.inProgress}
          currentCohort={progress.currentCohort}
          cohortTargets={cohortTargets}
        />
      )}

      {/* Cohort Intake Panel */}
      <CohortIntakePanel
        onGenerate={handleGenerate}
        disabled={isGenerating || !hasCatalog}
      />

      {/* Existing variants info */}
      {hasVariants && !isGenerating && (
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-green-600"
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
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-neutral-800">
                {variants.length} variant{variants.length === 1 ? '' : 's'} available
              </p>
              <p className="text-xs text-neutral-500">
                Previously generated variants are ready for review in the gallery.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNavigateToGallery}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors duration-200 hover:bg-primary-100 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            View Gallery
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
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      )}

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
          Configure cohort × behavioral overlay targets above, then click Generate to create tailored PDP variants.
          {hasVariants && ` · ${variants.length} variant${variants.length === 1 ? '' : 's'} currently generated`}
          {isGenerating && ' · Generation in progress…'}
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

export default CohortsPage;