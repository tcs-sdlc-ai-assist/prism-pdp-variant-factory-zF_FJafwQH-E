/**
 * VariantGenerator engine for the Prism PDP Variant Factory.
 * Deterministically generates up to 10 tailored PDP variants in parallel.
 * Each variant applies tailoring rules based on its cohort/behavioral overlay.
 * Uses seeded hash for determinism (same input → same output).
 *
 * @module variantGenerator
 */

import { v4 as uuidv4 } from 'uuid';
import { MAX_VARIANTS } from '@/constants/constants.js';
import { getTailoringForCohortTarget } from '@/data/tailoringRules.js';
import { validateCatalogItem, validateVariant } from '@/schemas/schemas.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * Maximum number of retry attempts for a single variant generation
 * @type {number}
 */
const MAX_RETRIES = 2;

/**
 * Generates a deterministic seed hash from a string input.
 * Same input always produces the same numeric hash.
 *
 * @param {string} input - The input string to hash
 * @returns {number} A deterministic 32-bit integer hash
 */
function deterministicHash(input) {
  let hash = 0;
  const str = String(input);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Generates a deterministic variant ID based on cohort and product inputs.
 * Falls back to uuidv4 if inputs are insufficient.
 *
 * @param {string} cohortId - The cohort target ID
 * @param {string} productId - The product/SKU ID
 * @param {number} index - The variant index
 * @returns {string} A variant ID string
 */
function generateVariantId(cohortId, productId, index) {
  if (!cohortId || !productId) {
    return `variant-${uuidv4()}`;
  }
  const seed = deterministicHash(`${cohortId}:${productId}:${index}`);
  const hex = seed.toString(16).padStart(8, '0');
  return `variant-${hex}-${index}`;
}

/**
 * Applies tailoring transformations to a canonical PDP to produce a variant PDP.
 * Returns a new object with tailored fields based on the tailoring result.
 *
 * @param {import('@/data/mockCatalog.js').CatalogItem} canonicalPdp - The base product data
 * @param {import('@/data/defaultCohorts.js').CohortTarget} cohortTarget - The cohort target configuration
 * @param {number} index - The variant index in the batch
 * @returns {{ variant: object, tailoringResult: object }}
 */
function applyTailoring(canonicalPdp, cohortTarget, index) {
  const tailoringResult = getTailoringForCohortTarget(cohortTarget);

  const variantPdp = { ...canonicalPdp };

  if (tailoringResult.priceEmphasis) {
    variantPdp.priceDisplay = tailoringResult.priceEmphasis.display;
    variantPdp.showSavings = tailoringResult.priceEmphasis.showSavings;
    variantPdp.showMemberPrice = tailoringResult.priceEmphasis.showMemberPrice;
    variantPdp.priceCallout = tailoringResult.priceEmphasis.callout;
  }

  if (tailoringResult.badgeUrgency) {
    variantPdp.badges = tailoringResult.badgeUrgency.badges;
    variantPdp.urgencyLevel = tailoringResult.badgeUrgency.urgencyLevel;
    variantPdp.urgencyMessage = tailoringResult.badgeUrgency.urgencyMessage;
  }

  if (tailoringResult.heroLayout) {
    variantPdp.layout = tailoringResult.heroLayout.layout;
    variantPdp.primaryFocus = tailoringResult.heroLayout.primaryFocus;
  }

  if (tailoringResult.ctaCopy) {
    variantPdp.primaryCTA = tailoringResult.ctaCopy.primaryCTA;
    variantPdp.secondaryCTA = tailoringResult.ctaCopy.secondaryCTA;
    variantPdp.ctaTone = tailoringResult.ctaCopy.tone;
  }

  if (tailoringResult.socialProof) {
    variantPdp.socialProofDisplay = tailoringResult.socialProof.display;
    variantPdp.showReviewCount = tailoringResult.socialProof.showReviewCount;
    variantPdp.showExpertReviews = tailoringResult.socialProof.showExpertReviews;
  }

  if (tailoringResult.crossSell) {
    variantPdp.crossSellStrategy = tailoringResult.crossSell.strategy;
    variantPdp.crossSellHeading = tailoringResult.crossSell.heading;
    variantPdp.crossSellMaxItems = tailoringResult.crossSell.maxItems;
  }

  if (tailoringResult.specOrdering) {
    variantPdp.prioritizedSpecs = tailoringResult.specOrdering.prioritizedSpecs;
    variantPdp.specsExpandedByDefault = tailoringResult.specOrdering.expandByDefault;
  }

  if (tailoringResult.mediaSelection) {
    variantPdp.mediaStrategy = tailoringResult.mediaSelection.strategy;
    variantPdp.mediaPrioritizedIndices = tailoringResult.mediaSelection.prioritizedIndices;
    variantPdp.showVideo = tailoringResult.mediaSelection.showVideo;
  }

  if (tailoringResult.reviewHighlight) {
    variantPdp.reviewFilter = tailoringResult.reviewHighlight.filter;
    variantPdp.maxHighlightedReviews = tailoringResult.reviewHighlight.maxHighlighted;
    variantPdp.reviewSortBy = tailoringResult.reviewHighlight.sortBy;
  }

  return { variant: variantPdp, tailoringResult };
}

/**
 * Computes the diff between a control (canonical) PDP and a variant PDP.
 * Returns an object describing which dimensions changed and how.
 *
 * @param {object} controlPdp - The canonical/control PDP object
 * @param {object} variantPdp - The tailored variant PDP object
 * @returns {{ dimensions: string[], changes: Array<{ field: string, from: *, to: * }> }}
 */
function computeDiff(controlPdp, variantPdp) {
  const dimensions = [];
  const changes = [];

  const allKeys = new Set([...Object.keys(controlPdp), ...Object.keys(variantPdp)]);

  for (const key of allKeys) {
    const controlVal = controlPdp[key];
    const variantVal = variantPdp[key];

    const controlStr = JSON.stringify(controlVal);
    const variantStr = JSON.stringify(variantVal);

    if (controlStr !== variantStr) {
      dimensions.push(key);
      changes.push({
        field: key,
        from: controlVal !== undefined ? controlVal : null,
        to: variantVal !== undefined ? variantVal : null,
      });
    }
  }

  return { dimensions, changes };
}

/**
 * Builds a manifest object for a single variant.
 *
 * @param {object} variant - The variant data object
 * @param {object} diff - The diff result from computeDiff
 * @param {object} cohortTarget - The cohort target configuration
 * @param {object} tailoringResult - The full tailoring result
 * @param {boolean} controlFlag - Whether this is the control variant
 * @returns {object} The manifest object
 */
function buildManifest(variant, diff, cohortTarget, tailoringResult, controlFlag) {
  const appliedTailoring = (tailoringResult.transformations || []).map((t) => ({
    dimension: t.dimension,
    change: `${t.action}: ${t.value}`,
    rationale: t.rationale,
    weight: t.weight,
  }));

  return {
    variantId: variant.variantId,
    cohort: cohortTarget.cohortType || '',
    behavioralOverlay: cohortTarget.behavioralOverlay || '',
    baseSku: cohortTarget.baseSku || '',
    label: cohortTarget.label || '',
    priority: cohortTarget.priority || 0,
    appliedTailoring,
    diffSummary: {
      dimensionsChanged: diff.dimensions.length,
      dimensions: diff.dimensions,
    },
    heroLayout: tailoringResult.heroLayout || null,
    priceEmphasis: tailoringResult.priceEmphasis || null,
    badgeUrgency: tailoringResult.badgeUrgency || null,
    ctaCopy: tailoringResult.ctaCopy || null,
    socialProof: tailoringResult.socialProof || null,
    crossSell: tailoringResult.crossSell || null,
    specOrdering: tailoringResult.specOrdering || null,
    mediaSelection: tailoringResult.mediaSelection || null,
    reviewHighlight: tailoringResult.reviewHighlight || null,
    created: new Date().toISOString(),
    controlFlag,
  };
}

/**
 * Generates a single variant from a cohort target and canonical PDP.
 * Includes retry logic for error resilience.
 *
 * @param {import('@/data/mockCatalog.js').CatalogItem} canonicalPdp - The base product data
 * @param {import('@/data/defaultCohorts.js').CohortTarget} cohortTarget - The cohort target configuration
 * @param {number} index - The variant index in the batch
 * @param {number} [attempt=0] - Current retry attempt number
 * @returns {Promise<object>} The generated variant object
 */
async function generateSingleVariant(canonicalPdp, cohortTarget, index, attempt = 0) {
  try {
    const variantId = generateVariantId(
      cohortTarget.cohortId,
      canonicalPdp.id,
      index,
    );

    const controlFlag = index === 0;

    const { variant: variantPdp, tailoringResult } = applyTailoring(
      canonicalPdp,
      cohortTarget,
      index,
    );

    const diff = computeDiff(canonicalPdp, variantPdp);

    const now = new Date().toISOString();

    const manifest = buildManifest(
      { variantId },
      diff,
      cohortTarget,
      tailoringResult,
      controlFlag,
    );

    const variantObject = {
      id: variantId,
      variantId,
      name: `${cohortTarget.label || 'Variant'} — ${canonicalPdp.title || canonicalPdp.sku}`,
      productId: canonicalPdp.id,
      sku: canonicalPdp.sku,
      cohortId: cohortTarget.cohortId,
      cohortType: cohortTarget.cohortType || '',
      behavioralOverlay: cohortTarget.behavioralOverlay || '',
      baseSku: cohortTarget.baseSku || '',
      label: cohortTarget.label || '',
      priority: cohortTarget.priority || 0,
      controlFlag,
      isActive: true,
      weight: typeof cohortTarget.priority === 'number'
        ? Math.max(0, Math.min(100, 100 - (cohortTarget.priority - 1) * 10))
        : 50,
      tailoring: buildTailoringMap(tailoringResult),
      variantPdp,
      diff,
      manifest,
      description: `Tailored variant for ${cohortTarget.label || 'unknown cohort'} targeting ${cohortTarget.cohortType || 'unknown'} with ${cohortTarget.behavioralOverlay || 'no'} behavioral overlay.`,
      createdAt: now,
      updatedAt: now,
    };

    const validation = validateVariant(variantObject);
    if (!validation.valid) {
      console.warn(
        `[VariantGenerator] Variant validation warnings for index ${index}:`,
        validation.errors,
      );
    }

    emitEvent(EVENT_TYPES.VARIANT_GENERATED, {
      action: 'generateSingleVariant',
      variantId,
      cohortId: cohortTarget.cohortId,
      cohortType: cohortTarget.cohortType,
      behavioralOverlay: cohortTarget.behavioralOverlay,
      baseSku: cohortTarget.baseSku,
      index,
      diffDimensions: diff.dimensions.length,
      transformations: tailoringResult.transformations ? tailoringResult.transformations.length : 0,
      controlFlag,
      attempt,
    });

    return variantObject;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(
        `[VariantGenerator] Retrying variant generation for index ${index}, attempt ${attempt + 1}:`,
        error.message,
      );

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'generateSingleVariant',
        index,
        attempt,
        error: error.message,
        retrying: true,
      });

      return generateSingleVariant(canonicalPdp, cohortTarget, index, attempt + 1);
    }

    console.error(
      `[VariantGenerator] Failed to generate variant for index ${index} after ${MAX_RETRIES + 1} attempts:`,
      error.message,
    );

    emitEvent(EVENT_TYPES.ERROR, {
      action: 'generateSingleVariant',
      index,
      attempt,
      error: error.message,
      retrying: false,
      cohortId: cohortTarget ? cohortTarget.cohortId : 'unknown',
    });

    throw error;
  }
}

/**
 * Builds a tailoring map from the tailoring result transformations.
 * Maps each dimension to its transformation descriptor.
 *
 * @param {object} tailoringResult - The full tailoring result
 * @returns {Object.<string, object>} Map of dimension to transformation info
 */
function buildTailoringMap(tailoringResult) {
  const map = {};

  if (!tailoringResult || !Array.isArray(tailoringResult.transformations)) {
    return map;
  }

  for (const transformation of tailoringResult.transformations) {
    if (transformation.dimension) {
      map[transformation.dimension] = {
        action: transformation.action,
        value: transformation.value,
        rationale: transformation.rationale,
        weight: transformation.weight,
      };
    }
  }

  return map;
}

/**
 * Generates up to 10 tailored PDP variants deterministically in parallel.
 * Each variant applies tailoring rules based on its cohort/behavioral overlay.
 *
 * @param {import('@/data/mockCatalog.js').CatalogItem} canonicalPdp - The base product data (canonical PDP)
 * @param {import('@/data/defaultCohorts.js').DefaultCohortSet} cohortSet - The cohort set configuration
 * @returns {Promise<{ variants: object[], errors: string[], success: boolean }>}
 */
export async function generateVariants(canonicalPdp, cohortSet) {
  const errors = [];
  const startTime = Date.now();

  if (!canonicalPdp || typeof canonicalPdp !== 'object') {
    const errorMsg = 'canonicalPdp must be a non-null object';
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'generateVariants',
      error: errorMsg,
    });
    return { variants: [], errors: [errorMsg], success: false };
  }

  const catalogValidation = validateCatalogItem(canonicalPdp);
  if (!catalogValidation.valid) {
    const errorMsg = `Invalid canonical PDP: ${catalogValidation.errors.join('; ')}`;
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'generateVariants',
      error: errorMsg,
    });
    return { variants: [], errors: [errorMsg], success: false };
  }

  if (!cohortSet || typeof cohortSet !== 'object') {
    const errorMsg = 'cohortSet must be a non-null object';
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'generateVariants',
      error: errorMsg,
    });
    return { variants: [], errors: [errorMsg], success: false };
  }

  if (!Array.isArray(cohortSet.cohorts) || cohortSet.cohorts.length === 0) {
    const errorMsg = 'cohortSet must contain at least one cohort target';
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'generateVariants',
      error: errorMsg,
    });
    return { variants: [], errors: [errorMsg], success: false };
  }

  const targets = cohortSet.cohorts.slice(0, MAX_VARIANTS);

  if (cohortSet.cohorts.length > MAX_VARIANTS) {
    errors.push(
      `Cohort set contains ${cohortSet.cohorts.length} targets; truncated to ${MAX_VARIANTS}`,
    );
  }

  emitEvent(EVENT_TYPES.VARIANT_GENERATED, {
    action: 'generateVariants:start',
    productId: canonicalPdp.id,
    sku: canonicalPdp.sku,
    cohortSetId: cohortSet.id || 'unknown',
    targetCount: targets.length,
  });

  const variantPromises = targets.map((cohortTarget, index) =>
    generateSingleVariant(canonicalPdp, cohortTarget, index).catch((error) => {
      errors.push(
        `Failed to generate variant for cohort "${cohortTarget.cohortId || 'unknown'}" (index ${index}): ${error.message}`,
      );
      return null;
    }),
  );

  const results = await Promise.all(variantPromises);

  const variants = results.filter((v) => v !== null);

  const elapsedMs = Date.now() - startTime;

  emitEvent(EVENT_TYPES.VARIANT_GENERATED, {
    action: 'generateVariants:complete',
    productId: canonicalPdp.id,
    sku: canonicalPdp.sku,
    cohortSetId: cohortSet.id || 'unknown',
    requestedCount: targets.length,
    generatedCount: variants.length,
    failedCount: targets.length - variants.length,
    elapsedMs,
    errors: errors.length,
  });

  return {
    variants,
    errors,
    success: variants.length > 0,
  };
}

/**
 * Generates variants for a specific SKU by finding the matching catalog item.
 * Convenience wrapper around generateVariants.
 *
 * @param {import('@/data/mockCatalog.js').CatalogItem[]} catalog - The full catalog array
 * @param {string} sku - The SKU to generate variants for
 * @param {import('@/data/defaultCohorts.js').DefaultCohortSet} cohortSet - The cohort set configuration
 * @returns {Promise<{ variants: object[], errors: string[], success: boolean }>}
 */
export async function generateVariantsForSku(catalog, sku, cohortSet) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return { variants: [], errors: ['Catalog must be a non-empty array'], success: false };
  }

  if (!sku || typeof sku !== 'string') {
    return { variants: [], errors: ['SKU must be a non-empty string'], success: false };
  }

  const canonicalPdp = catalog.find((item) => item.sku === sku);

  if (!canonicalPdp) {
    return {
      variants: [],
      errors: [`No catalog item found for SKU "${sku}"`],
      success: false,
    };
  }

  return generateVariants(canonicalPdp, cohortSet);
}

/**
 * Generates variants for a specific product ID by finding the matching catalog item.
 * Convenience wrapper around generateVariants.
 *
 * @param {import('@/data/mockCatalog.js').CatalogItem[]} catalog - The full catalog array
 * @param {string} productId - The product ID to generate variants for
 * @param {import('@/data/defaultCohorts.js').DefaultCohortSet} cohortSet - The cohort set configuration
 * @returns {Promise<{ variants: object[], errors: string[], success: boolean }>}
 */
export async function generateVariantsForProduct(catalog, productId, cohortSet) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return { variants: [], errors: ['Catalog must be a non-empty array'], success: false };
  }

  if (!productId || typeof productId !== 'string') {
    return { variants: [], errors: ['Product ID must be a non-empty string'], success: false };
  }

  const canonicalPdp = catalog.find((item) => item.id === productId);

  if (!canonicalPdp) {
    return {
      variants: [],
      errors: [`No catalog item found for product ID "${productId}"`],
      success: false,
    };
  }

  return generateVariants(canonicalPdp, cohortSet);
}

/**
 * Computes the diff between a control PDP and a variant PDP.
 * Exported for use by other modules (e.g., DiffEngine, VariantGallery).
 *
 * @param {object} controlPdp - The canonical/control PDP object
 * @param {object} variantPdp - The tailored variant PDP object
 * @returns {{ dimensions: string[], changes: Array<{ field: string, from: *, to: * }> }}
 */
export { computeDiff };

const variantGenerator = {
  generateVariants,
  generateVariantsForSku,
  generateVariantsForProduct,
  computeDiff,
};

export default variantGenerator;