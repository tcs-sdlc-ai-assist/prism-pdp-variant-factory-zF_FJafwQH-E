/**
 * ManifestBuilder service for the Prism PDP Variant Factory.
 * Constructs manifest objects per variant with variantId, cohort, behavioralOverlay,
 * baseSku, appliedTailoring[], created timestamp, and controlFlag.
 * Validates against manifest schema before returning.
 * Also provides buildBulkManifest(variants) for full-set export.
 *
 * @module manifestBuilder
 */

import { v4 as uuidv4 } from 'uuid';
import { validateManifest } from '@/schemas/schemas.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * @typedef {Object} AppliedTailoringEntry
 * @property {string} dimension - The tailoring dimension
 * @property {string} change - Description of the change applied
 * @property {string} rationale - Cohort-driven reason for the change
 * @property {number} [weight] - Priority weight of the transformation (0-100)
 */

/**
 * @typedef {Object} ManifestJSON
 * @property {string} id - Unique manifest identifier
 * @property {string} name - Human-readable manifest name
 * @property {string} version - Manifest schema version
 * @property {string} variantId - The variant this manifest describes
 * @property {string[]} variantIds - Array containing the variantId (for schema compliance)
 * @property {string} cohort - Cohort type identifier
 * @property {string} behavioralOverlay - Behavioral overlay identifier
 * @property {string} baseSku - The base SKU from the catalog
 * @property {string} label - Human-readable label for the cohort target
 * @property {number} priority - Priority ranking
 * @property {AppliedTailoringEntry[]} appliedTailoring - Array of applied tailoring transformations
 * @property {Object} diffSummary - Summary of diff dimensions
 * @property {string} created - ISO 8601 creation timestamp
 * @property {string} createdAt - ISO 8601 creation timestamp (alias for schema)
 * @property {boolean} controlFlag - Whether this is the control variant
 * @property {string} status - Manifest status ('draft', 'published', 'archived')
 * @property {string} description - Human-readable description
 */

/**
 * @typedef {Object} BulkManifest
 * @property {string} id - Unique bulk manifest identifier
 * @property {string} name - Human-readable bulk manifest name
 * @property {string} version - Manifest schema version
 * @property {string[]} variantIds - Array of variant IDs included
 * @property {ManifestJSON[]} variants - Array of per-variant manifests
 * @property {number} totalVariants - Total number of variants
 * @property {number} totalTransformations - Total number of applied transformations across all variants
 * @property {string} createdAt - ISO 8601 creation timestamp
 * @property {string} status - Manifest status
 * @property {string} description - Human-readable description
 */

/**
 * Current manifest schema version
 * @type {string}
 */
const MANIFEST_VERSION = '1.0.0';

/**
 * Extracts applied tailoring entries from a variant object.
 * Looks for tailoring data in variant.manifest.appliedTailoring,
 * variant.tailoring, or variant.diff.
 *
 * @param {object} variant - The variant object
 * @returns {AppliedTailoringEntry[]} Array of applied tailoring entries
 */
function extractAppliedTailoring(variant) {
  if (!variant || typeof variant !== 'object') {
    return [];
  }

  // First, check if the variant already has a manifest with appliedTailoring
  if (
    variant.manifest &&
    typeof variant.manifest === 'object' &&
    Array.isArray(variant.manifest.appliedTailoring)
  ) {
    return variant.manifest.appliedTailoring.map((entry) => ({
      dimension: entry.dimension || '',
      change: entry.change || '',
      rationale: entry.rationale || '',
      weight: typeof entry.weight === 'number' && Number.isFinite(entry.weight) ? entry.weight : 0,
    }));
  }

  // Second, build from variant.tailoring map
  if (variant.tailoring && typeof variant.tailoring === 'object' && !Array.isArray(variant.tailoring)) {
    const entries = [];
    const dimensions = Object.keys(variant.tailoring);

    for (const dimension of dimensions) {
      const entry = variant.tailoring[dimension];
      if (entry && typeof entry === 'object') {
        entries.push({
          dimension,
          change: entry.action && entry.value ? `${entry.action}: ${entry.value}` : entry.value || '',
          rationale: entry.rationale || '',
          weight: typeof entry.weight === 'number' && Number.isFinite(entry.weight) ? entry.weight : 0,
        });
      }
    }

    return entries;
  }

  return [];
}

/**
 * Extracts diff summary from a variant object.
 *
 * @param {object} variant - The variant object
 * @returns {{ dimensionsChanged: number, dimensions: string[] }}
 */
function extractDiffSummary(variant) {
  if (!variant || typeof variant !== 'object') {
    return { dimensionsChanged: 0, dimensions: [] };
  }

  if (variant.diff && typeof variant.diff === 'object') {
    const dimensions = Array.isArray(variant.diff.dimensions) ? variant.diff.dimensions : [];
    return {
      dimensionsChanged: dimensions.length,
      dimensions: [...dimensions],
    };
  }

  if (
    variant.manifest &&
    typeof variant.manifest === 'object' &&
    variant.manifest.diffSummary &&
    typeof variant.manifest.diffSummary === 'object'
  ) {
    const dimensions = Array.isArray(variant.manifest.diffSummary.dimensions)
      ? variant.manifest.diffSummary.dimensions
      : [];
    return {
      dimensionsChanged: dimensions.length,
      dimensions: [...dimensions],
    };
  }

  return { dimensionsChanged: 0, dimensions: [] };
}

/**
 * Builds a manifest object for a single variant.
 * Validates against the manifest schema before returning.
 *
 * @param {object} variant - The variant object to build a manifest for
 * @returns {{ manifest: ManifestJSON|null, valid: boolean, errors: string[] }}
 */
export function buildManifest(variant) {
  if (!variant || typeof variant !== 'object') {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'buildManifest',
      error: 'Variant must be a non-null object',
    });
    return {
      manifest: null,
      valid: false,
      errors: ['Variant must be a non-null object'],
    };
  }

  const variantId = variant.variantId || variant.id || '';

  if (!variantId) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'buildManifest',
      error: 'Variant must have a variantId or id',
    });
    return {
      manifest: null,
      valid: false,
      errors: ['Variant must have a variantId or id'],
    };
  }

  const cohort = variant.cohortType || variant.cohort || '';
  const behavioralOverlay = variant.behavioralOverlay || '';
  const baseSku = variant.baseSku || variant.sku || '';
  const label = variant.label || variant.name || '';
  const priority = typeof variant.priority === 'number' ? variant.priority : 0;
  const controlFlag = typeof variant.controlFlag === 'boolean' ? variant.controlFlag : false;

  const appliedTailoring = extractAppliedTailoring(variant);
  const diffSummary = extractDiffSummary(variant);

  const now = new Date().toISOString();
  const manifestId = `manifest-${variantId}`;

  const manifest = {
    id: manifestId,
    name: `Manifest for ${label || variantId}`,
    version: MANIFEST_VERSION,
    variantId,
    variantIds: [variantId],
    cohort,
    behavioralOverlay,
    baseSku,
    label,
    priority,
    appliedTailoring,
    diffSummary,
    created: now,
    createdAt: now,
    updatedAt: now,
    controlFlag,
    status: 'draft',
    description: `Manifest describing tailoring applied to variant "${variantId}" for cohort "${cohort}" with behavioral overlay "${behavioralOverlay}".`,
  };

  // Carry forward additional tailoring descriptors from existing manifest
  if (variant.manifest && typeof variant.manifest === 'object') {
    if (variant.manifest.heroLayout) {
      manifest.heroLayout = variant.manifest.heroLayout;
    }
    if (variant.manifest.priceEmphasis) {
      manifest.priceEmphasis = variant.manifest.priceEmphasis;
    }
    if (variant.manifest.badgeUrgency) {
      manifest.badgeUrgency = variant.manifest.badgeUrgency;
    }
    if (variant.manifest.ctaCopy) {
      manifest.ctaCopy = variant.manifest.ctaCopy;
    }
    if (variant.manifest.socialProof) {
      manifest.socialProof = variant.manifest.socialProof;
    }
    if (variant.manifest.crossSell) {
      manifest.crossSell = variant.manifest.crossSell;
    }
    if (variant.manifest.specOrdering) {
      manifest.specOrdering = variant.manifest.specOrdering;
    }
    if (variant.manifest.mediaSelection) {
      manifest.mediaSelection = variant.manifest.mediaSelection;
    }
    if (variant.manifest.reviewHighlight) {
      manifest.reviewHighlight = variant.manifest.reviewHighlight;
    }
  }

  const validation = validateManifest(manifest);

  if (!validation.valid) {
    console.warn('[ManifestBuilder] Manifest validation warnings:', validation.errors);

    emitEvent(EVENT_TYPES.ERROR, {
      action: 'buildManifest',
      variantId,
      validationErrors: validation.errors,
    });

    return {
      manifest,
      valid: false,
      errors: validation.errors,
    };
  }

  emitEvent(EVENT_TYPES.EXPORT_ACTION, {
    action: 'buildManifest',
    variantId,
    cohort,
    behavioralOverlay,
    baseSku,
    appliedTailoringCount: appliedTailoring.length,
    controlFlag,
  });

  return {
    manifest,
    valid: true,
    errors: [],
  };
}

/**
 * Builds a bulk manifest containing manifests for all provided variants.
 * Validates each individual manifest and the overall structure.
 *
 * @param {object[]} variants - Array of variant objects
 * @returns {{ bulkManifest: BulkManifest|null, manifests: ManifestJSON[], valid: boolean, errors: string[] }}
 */
export function buildBulkManifest(variants) {
  const errors = [];

  if (!Array.isArray(variants)) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'buildBulkManifest',
      error: 'Variants must be an array',
    });
    return {
      bulkManifest: null,
      manifests: [],
      valid: false,
      errors: ['Variants must be an array'],
    };
  }

  if (variants.length === 0) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'buildBulkManifest',
      error: 'Variants array must contain at least one variant',
    });
    return {
      bulkManifest: null,
      manifests: [],
      valid: false,
      errors: ['Variants array must contain at least one variant'],
    };
  }

  const manifests = [];
  const variantIds = [];
  let totalTransformations = 0;

  variants.forEach((variant, index) => {
    const result = buildManifest(variant);

    if (result.manifest) {
      manifests.push(result.manifest);
      variantIds.push(result.manifest.variantId);
      totalTransformations += Array.isArray(result.manifest.appliedTailoring)
        ? result.manifest.appliedTailoring.length
        : 0;
    }

    if (!result.valid) {
      result.errors.forEach((err) => {
        errors.push(`variants[${index}]: ${err}`);
      });
    }
  });

  if (manifests.length === 0) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'buildBulkManifest',
      error: 'No valid manifests could be built from the provided variants',
    });
    return {
      bulkManifest: null,
      manifests: [],
      valid: false,
      errors: ['No valid manifests could be built from the provided variants', ...errors],
    };
  }

  const now = new Date().toISOString();
  const bulkId = `bulk-manifest-${uuidv4()}`;

  const bulkManifest = {
    id: bulkId,
    name: `Bulk Manifest — ${manifests.length} variant${manifests.length === 1 ? '' : 's'}`,
    version: MANIFEST_VERSION,
    variantIds,
    variants: manifests,
    totalVariants: manifests.length,
    totalTransformations,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    description: `Bulk manifest containing ${manifests.length} variant manifest${manifests.length === 1 ? '' : 's'} generated at ${now}.`,
  };

  emitEvent(EVENT_TYPES.EXPORT_ACTION, {
    action: 'buildBulkManifest',
    bulkManifestId: bulkId,
    totalVariants: manifests.length,
    totalTransformations,
    failedCount: variants.length - manifests.length,
    errors: errors.length,
  });

  return {
    bulkManifest,
    manifests,
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extracts a clean, export-ready manifest from a variant.
 * Strips internal fields and returns only the manifest contract fields.
 *
 * @param {object} variant - The variant object
 * @returns {{ exportManifest: object|null, error: string|null }}
 */
export function extractExportManifest(variant) {
  if (!variant || typeof variant !== 'object') {
    return { exportManifest: null, error: 'Variant must be a non-null object' };
  }

  const result = buildManifest(variant);

  if (!result.manifest) {
    return {
      exportManifest: null,
      error: result.errors.length > 0 ? result.errors.join('; ') : 'Failed to build manifest',
    };
  }

  const exportManifest = {
    variantId: result.manifest.variantId,
    cohort: result.manifest.cohort,
    behavioralOverlay: result.manifest.behavioralOverlay,
    baseSku: result.manifest.baseSku,
    label: result.manifest.label,
    priority: result.manifest.priority,
    appliedTailoring: result.manifest.appliedTailoring,
    diffSummary: result.manifest.diffSummary,
    created: result.manifest.created,
    controlFlag: result.manifest.controlFlag,
  };

  return { exportManifest, error: null };
}

/**
 * Extracts clean, export-ready manifests from an array of variants.
 * Returns a bulk export object suitable for JSON download.
 *
 * @param {object[]} variants - Array of variant objects
 * @returns {{ exportData: object|null, errors: string[] }}
 */
export function extractBulkExportManifests(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return {
      exportData: null,
      errors: ['Variants must be a non-empty array'],
    };
  }

  const exportManifests = [];
  const errors = [];

  variants.forEach((variant, index) => {
    const result = extractExportManifest(variant);
    if (result.exportManifest) {
      exportManifests.push(result.exportManifest);
    }
    if (result.error) {
      errors.push(`variants[${index}]: ${result.error}`);
    }
  });

  if (exportManifests.length === 0) {
    return {
      exportData: null,
      errors: ['No valid export manifests could be extracted', ...errors],
    };
  }

  const now = new Date().toISOString();

  const exportData = {
    version: MANIFEST_VERSION,
    exportedAt: now,
    totalVariants: exportManifests.length,
    variants: exportManifests,
  };

  return { exportData, errors };
}

/**
 * Returns the current manifest schema version.
 *
 * @returns {string}
 */
export function getManifestVersion() {
  return MANIFEST_VERSION;
}

const manifestBuilder = {
  buildManifest,
  buildBulkManifest,
  extractExportManifest,
  extractBulkExportManifests,
  getManifestVersion,
};

export default manifestBuilder;