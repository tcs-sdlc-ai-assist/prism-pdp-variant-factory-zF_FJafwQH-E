import { useState, useCallback, useRef } from 'react';
import { useAppContext } from '@/context/AppContext.jsx';
import { generateVariants as generateVariantsService, generateVariantsForSku, generateVariantsForProduct } from '@/services/variantGenerator.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * @typedef {Object} FanOutProgress
 * @property {number} total - Total number of variants to generate
 * @property {number} completed - Number of variants generated so far
 * @property {number} failed - Number of variants that failed to generate
 * @property {number} percent - Completion percentage (0-100)
 * @property {boolean} inProgress - Whether generation is currently in progress
 * @property {string|null} currentCohort - The cohort currently being processed
 */

/**
 * @typedef {Object} UseVariantsReturn
 * @property {Array<*>} variants - The current variants array from context
 * @property {boolean} isGenerating - Whether variant generation is in progress
 * @property {string|null} error - Current error message, if any
 * @property {FanOutProgress} progress - Fan-out progress state for UI animation
 * @property {function(object, object): Promise<{ variants: Array<*>, errors: string[], success: boolean }>} generateVariants - Generate variants from a canonical PDP and cohort set
 * @property {function(string): Promise<{ variants: Array<*>, errors: string[], success: boolean }>} generateForSku - Generate variants for a specific SKU
 * @property {function(string): Promise<{ variants: Array<*>, errors: string[], success: boolean }>} generateForProduct - Generate variants for a specific product ID
 * @property {function(): Promise<void>} retry - Retry the last generation operation
 * @property {function(): void} clearError - Clear the current error state
 * @property {function(): void} clearVariants - Clear all variants
 */

/**
 * Maximum number of retry attempts for variant generation
 * @type {number}
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Custom hook for managing variant state and generation.
 * Accesses AppContext to provide variants, generateVariants action,
 * loading state, error state, and retry logic.
 * Manages fan-out progress state for UI animation.
 *
 * @returns {UseVariantsReturn}
 */
export function useVariants() {
  const { catalog, cohortSet, variants, setVariants } = useAppContext();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    percent: 0,
    inProgress: false,
    currentCohort: null,
  });

  /** @type {React.MutableRefObject<{ canonicalPdp: object|null, cohortSet: object|null, type: string, sku: string|null, productId: string|null }>} */
  const lastOperationRef = useRef({
    canonicalPdp: null,
    cohortSet: null,
    type: 'generate',
    sku: null,
    productId: null,
  });

  /** @type {React.MutableRefObject<number>} */
  const retryCountRef = useRef(0);

  /**
   * Resets the progress state to initial values.
   */
  const resetProgress = useCallback(() => {
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
      percent: 0,
      inProgress: false,
      currentCohort: null,
    });
  }, []);

  /**
   * Updates the progress state during variant generation.
   *
   * @param {Partial<FanOutProgress>} updates - Partial progress updates
   */
  const updateProgress = useCallback((updates) => {
    setProgress((prev) => {
      const next = { ...prev, ...updates };
      if (next.total > 0) {
        next.percent = Math.round(((next.completed + next.failed) / next.total) * 100);
      }
      return next;
    });
  }, []);

  /**
   * Generates variants from a canonical PDP and cohort set.
   * Wraps variantGenerator.generateVariants with loading, error, and progress state.
   *
   * @param {object} canonicalPdp - The base product data
   * @param {object} cohortSetInput - The cohort set configuration
   * @returns {Promise<{ variants: Array<*>, errors: string[], success: boolean }>}
   */
  const generateVariants = useCallback(async (canonicalPdp, cohortSetInput) => {
    if (!canonicalPdp || typeof canonicalPdp !== 'object') {
      const errorMsg = 'Canonical PDP must be a non-null object';
      setError(errorMsg);
      return { variants: [], errors: [errorMsg], success: false };
    }

    if (!cohortSetInput || typeof cohortSetInput !== 'object') {
      const errorMsg = 'Cohort set must be a non-null object';
      setError(errorMsg);
      return { variants: [], errors: [errorMsg], success: false };
    }

    lastOperationRef.current = {
      canonicalPdp,
      cohortSet: cohortSetInput,
      type: 'generate',
      sku: null,
      productId: null,
    };
    retryCountRef.current = 0;

    setIsGenerating(true);
    setError(null);

    const targetCount = Array.isArray(cohortSetInput.cohorts)
      ? Math.min(cohortSetInput.cohorts.length, 10)
      : 0;

    updateProgress({
      total: targetCount,
      completed: 0,
      failed: 0,
      percent: 0,
      inProgress: true,
      currentCohort: targetCount > 0 ? cohortSetInput.cohorts[0].label || null : null,
    });

    try {
      const result = await generateVariantsService(canonicalPdp, cohortSetInput);

      const completedCount = result.variants.length;
      const failedCount = targetCount - completedCount;

      updateProgress({
        completed: completedCount,
        failed: failedCount,
        percent: 100,
        inProgress: false,
        currentCohort: null,
      });

      if (result.success) {
        setVariants(result.variants);

        emitEvent(EVENT_TYPES.VARIANT_GENERATED, {
          action: 'useVariants:generateVariants',
          generatedCount: result.variants.length,
          errorCount: result.errors.length,
          productId: canonicalPdp.id,
        });
      } else {
        const errorMsg = result.errors.length > 0
          ? result.errors.join('; ')
          : 'Variant generation failed with no specific error';
        setError(errorMsg);

        emitEvent(EVENT_TYPES.ERROR, {
          action: 'useVariants:generateVariants',
          error: errorMsg,
        });
      }

      setIsGenerating(false);
      return result;
    } catch (e) {
      const errorMsg = `Variant generation failed: ${e.message}`;
      setError(errorMsg);
      setIsGenerating(false);

      updateProgress({
        inProgress: false,
        currentCohort: null,
      });

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'useVariants:generateVariants',
        error: e.message,
      });

      return { variants: [], errors: [errorMsg], success: false };
    }
  }, [setVariants, updateProgress]);

  /**
   * Generates variants for a specific SKU using the catalog and cohort set from context.
   *
   * @param {string} sku - The SKU to generate variants for
   * @returns {Promise<{ variants: Array<*>, errors: string[], success: boolean }>}
   */
  const generateForSku = useCallback(async (sku) => {
    if (!sku || typeof sku !== 'string') {
      const errorMsg = 'SKU must be a non-empty string';
      setError(errorMsg);
      return { variants: [], errors: [errorMsg], success: false };
    }

    if (!Array.isArray(catalog) || catalog.length === 0) {
      const errorMsg = 'Catalog is empty or not loaded';
      setError(errorMsg);
      return { variants: [], errors: [errorMsg], success: false };
    }

    if (!cohortSet || typeof cohortSet !== 'object') {
      const errorMsg = 'Cohort set is not loaded';
      setError(errorMsg);
      return { variants: [], errors: [errorMsg], success: false };
    }

    lastOperationRef.current = {
      canonicalPdp: null,
      cohortSet,
      type: 'sku',
      sku,
      productId: null,
    };
    retryCountRef.current = 0;

    setIsGenerating(true);
    setError(null);

    const targetCount = Array.isArray(cohortSet.cohorts)
      ? Math.min(cohortSet.cohorts.length, 10)
      : 0;

    updateProgress({
      total: targetCount,
      completed: 0,
      failed: 0,
      percent: 0,
      inProgress: true,
      currentCohort: targetCount > 0 ? cohortSet.cohorts[0].label || null : null,
    });

    try {
      const result = await generateVariantsForSku(catalog, sku, cohortSet);

      const completedCount = result.variants.length;
      const failedCount = targetCount - completedCount;

      updateProgress({
        completed: completedCount,
        failed: failedCount,
        percent: 100,
        inProgress: false,
        currentCohort: null,
      });

      if (result.success) {
        setVariants(result.variants);

        emitEvent(EVENT_TYPES.VARIANT_GENERATED, {
          action: 'useVariants:generateForSku',
          sku,
          generatedCount: result.variants.length,
          errorCount: result.errors.length,
        });
      } else {
        const errorMsg = result.errors.length > 0
          ? result.errors.join('; ')
          : `Variant generation failed for SKU "${sku}"`;
        setError(errorMsg);

        emitEvent(EVENT_TYPES.ERROR, {
          action: 'useVariants:generateForSku',
          sku,
          error: errorMsg,
        });
      }

      setIsGenerating(false);
      return result;
    } catch (e) {
      const errorMsg = `Variant generation failed for SKU "${sku}": ${e.message}`;
      setError(errorMsg);
      setIsGenerating(false);

      updateProgress({
        inProgress: false,
        currentCohort: null,
      });

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'useVariants:generateForSku',
        sku,
        error: e.message,
      });

      return { variants: [], errors: [errorMsg], success: false };
    }
  }, [catalog, cohortSet, setVariants, updateProgress]);

  /**
   * Generates variants for a specific product ID using the catalog and cohort set from context.
   *
   * @param {string} productId - The product ID to generate variants for
   * @returns {Promise<{ variants: Array<*>, errors: string[], success: boolean }>}
   */
  const generateForProduct = useCallback(async (productId) => {
    if (!productId || typeof productId !== 'string') {
      const errorMsg = 'Product ID must be a non-empty string';
      setError(errorMsg);
      return { variants: [], errors: [errorMsg], success: false };
    }

    if (!Array.isArray(catalog) || catalog.length === 0) {
      const errorMsg = 'Catalog is empty or not loaded';
      setError(errorMsg);
      return { variants: [], errors: [errorMsg], success: false };
    }

    if (!cohortSet || typeof cohortSet !== 'object') {
      const errorMsg = 'Cohort set is not loaded';
      setError(errorMsg);
      return { variants: [], errors: [errorMsg], success: false };
    }

    lastOperationRef.current = {
      canonicalPdp: null,
      cohortSet,
      type: 'product',
      sku: null,
      productId,
    };
    retryCountRef.current = 0;

    setIsGenerating(true);
    setError(null);

    const targetCount = Array.isArray(cohortSet.cohorts)
      ? Math.min(cohortSet.cohorts.length, 10)
      : 0;

    updateProgress({
      total: targetCount,
      completed: 0,
      failed: 0,
      percent: 0,
      inProgress: true,
      currentCohort: targetCount > 0 ? cohortSet.cohorts[0].label || null : null,
    });

    try {
      const result = await generateVariantsForProduct(catalog, productId, cohortSet);

      const completedCount = result.variants.length;
      const failedCount = targetCount - completedCount;

      updateProgress({
        completed: completedCount,
        failed: failedCount,
        percent: 100,
        inProgress: false,
        currentCohort: null,
      });

      if (result.success) {
        setVariants(result.variants);

        emitEvent(EVENT_TYPES.VARIANT_GENERATED, {
          action: 'useVariants:generateForProduct',
          productId,
          generatedCount: result.variants.length,
          errorCount: result.errors.length,
        });
      } else {
        const errorMsg = result.errors.length > 0
          ? result.errors.join('; ')
          : `Variant generation failed for product "${productId}"`;
        setError(errorMsg);

        emitEvent(EVENT_TYPES.ERROR, {
          action: 'useVariants:generateForProduct',
          productId,
          error: errorMsg,
        });
      }

      setIsGenerating(false);
      return result;
    } catch (e) {
      const errorMsg = `Variant generation failed for product "${productId}": ${e.message}`;
      setError(errorMsg);
      setIsGenerating(false);

      updateProgress({
        inProgress: false,
        currentCohort: null,
      });

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'useVariants:generateForProduct',
        productId,
        error: e.message,
      });

      return { variants: [], errors: [errorMsg], success: false };
    }
  }, [catalog, cohortSet, setVariants, updateProgress]);

  /**
   * Retries the last generation operation.
   * Respects the maximum retry attempt limit.
   *
   * @returns {Promise<void>}
   */
  const retry = useCallback(async () => {
    const lastOp = lastOperationRef.current;

    if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
      const errorMsg = `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded`;
      setError(errorMsg);

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'useVariants:retry',
        error: errorMsg,
        retryCount: retryCountRef.current,
      });

      return;
    }

    retryCountRef.current += 1;

    emitEvent(EVENT_TYPES.VARIANT_GENERATED, {
      action: 'useVariants:retry',
      retryCount: retryCountRef.current,
      operationType: lastOp.type,
    });

    if (lastOp.type === 'generate' && lastOp.canonicalPdp && lastOp.cohortSet) {
      const savedCanonicalPdp = lastOp.canonicalPdp;
      const savedCohortSet = lastOp.cohortSet;
      await generateVariants(savedCanonicalPdp, savedCohortSet);
    } else if (lastOp.type === 'sku' && lastOp.sku) {
      await generateForSku(lastOp.sku);
    } else if (lastOp.type === 'product' && lastOp.productId) {
      await generateForProduct(lastOp.productId);
    } else {
      const errorMsg = 'No previous operation to retry';
      setError(errorMsg);

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'useVariants:retry',
        error: errorMsg,
      });
    }
  }, [generateVariants, generateForSku, generateForProduct]);

  /**
   * Clears the current error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clears all variants from context and resets progress.
   */
  const clearVariants = useCallback(() => {
    setVariants([]);
    resetProgress();
    setError(null);
  }, [setVariants, resetProgress]);

  return {
    variants,
    isGenerating,
    error,
    progress,
    generateVariants,
    generateForSku,
    generateForProduct,
    retry,
    clearError,
    clearVariants,
  };
}

export default useVariants;