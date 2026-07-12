/**
 * DiffEngine for the Prism PDP Variant Factory.
 * Compares a variant against the canonical PDP and returns a structured diff object
 * identifying which sections/fields changed, the type of change, and the cohort-driven reason.
 * Used by gallery diff toggle and detail view diff highlighting.
 * All functions are pure — no side effects.
 *
 * @module diffEngine
 */

import { TAILORING_DIMENSIONS } from '@/constants/constants.js';

/**
 * @typedef {Object} FieldChange
 * @property {string} field - The field name that changed
 * @property {*} from - The original value from the canonical PDP
 * @property {*} to - The new value in the variant PDP
 * @property {string} changeType - The type of change ('added', 'removed', 'modified', 'reordered')
 * @property {string} dimension - The tailoring dimension this field maps to (if applicable)
 * @property {string} rationale - The cohort-driven reason for this change (if available)
 * @property {number} weight - The priority weight of this change (0-100, if available)
 */

/**
 * @typedef {Object} DimensionSummary
 * @property {string} dimension - The tailoring dimension name
 * @property {number} changeCount - Number of fields changed in this dimension
 * @property {FieldChange[]} changes - Array of field changes in this dimension
 * @property {string} rationale - The primary rationale for changes in this dimension
 * @property {number} weight - The highest weight among changes in this dimension
 */

/**
 * @typedef {Object} DiffResult
 * @property {string[]} dimensions - Array of tailoring dimension names that changed
 * @property {FieldChange[]} changes - Array of all field-level changes
 * @property {DimensionSummary[]} dimensionSummaries - Per-dimension summaries of changes
 * @property {number} totalChanges - Total number of field-level changes
 * @property {number} dimensionsChanged - Number of tailoring dimensions affected
 * @property {boolean} hasChanges - Whether any changes were detected
 * @property {Object.<string, FieldChange[]>} changesByDimension - Changes grouped by dimension
 */

/**
 * Maps variant PDP fields to their corresponding tailoring dimensions.
 * Fields not in this map are categorized under 'other'.
 *
 * @type {Object.<string, string>}
 */
const FIELD_TO_DIMENSION_MAP = {
  price: 'price',
  memberPrice: 'price',
  priceDisplay: 'price',
  showSavings: 'price',
  showMemberPrice: 'price',
  priceCallout: 'price',

  badge: 'badge',
  badges: 'badge',
  urgencyLevel: 'badge',
  urgencyMessage: 'badge',

  title: 'title',
  primaryCTA: 'title',
  secondaryCTA: 'title',
  ctaTone: 'title',

  description: 'description',
  layout: 'description',
  primaryFocus: 'description',

  media: 'media',
  imageUrl: 'media',
  mediaStrategy: 'media',
  mediaPrioritizedIndices: 'media',
  showVideo: 'media',

  rating: 'rating',
  reviewCount: 'rating',
  socialProofDisplay: 'rating',
  showReviewCount: 'rating',
  showExpertReviews: 'rating',
  reviewFilter: 'rating',
  maxHighlightedReviews: 'rating',
  reviewSortBy: 'rating',

  fulfillment: 'fulfillment',
  prioritizedSpecs: 'fulfillment',
  specsExpandedByDefault: 'fulfillment',

  warranty: 'warranty',

  accessories: 'accessories',
  crossSellStrategy: 'accessories',
  crossSellHeading: 'accessories',
  crossSellMaxItems: 'accessories',

  promotion: 'promotion',
};

/**
 * Determines the tailoring dimension for a given field name.
 *
 * @param {string} field - The field name
 * @returns {string} The tailoring dimension, or 'other' if not mapped
 */
function getDimensionForField(field) {
  if (!field || typeof field !== 'string') {
    return 'other';
  }
  return FIELD_TO_DIMENSION_MAP[field] || 'other';
}

/**
 * Determines the type of change between two values.
 *
 * @param {*} fromValue - The original value
 * @param {*} toValue - The new value
 * @returns {string} The change type ('added', 'removed', 'modified', 'reordered')
 */
function determineChangeType(fromValue, toValue) {
  if (fromValue === undefined || fromValue === null) {
    return 'added';
  }
  if (toValue === undefined || toValue === null) {
    return 'removed';
  }
  if (Array.isArray(fromValue) && Array.isArray(toValue)) {
    if (fromValue.length === toValue.length) {
      const fromSorted = [...fromValue].sort();
      const toSorted = [...toValue].sort();
      const sameElements = fromSorted.every((val, idx) => JSON.stringify(val) === JSON.stringify(toSorted[idx]));
      if (sameElements) {
        return 'reordered';
      }
    }
  }
  return 'modified';
}

/**
 * Extracts the rationale for a field change from the variant's manifest or tailoring data.
 *
 * @param {string} field - The field name that changed
 * @param {string} dimension - The tailoring dimension for this field
 * @param {object|null} manifest - The variant's manifest object (if available)
 * @param {object|null} tailoring - The variant's tailoring map (if available)
 * @returns {string} The rationale string, or empty string if not found
 */
function extractRationale(field, dimension, manifest, tailoring) {
  if (tailoring && typeof tailoring === 'object' && tailoring[dimension]) {
    const entry = tailoring[dimension];
    if (entry && typeof entry.rationale === 'string' && entry.rationale.length > 0) {
      return entry.rationale;
    }
  }

  if (manifest && typeof manifest === 'object' && Array.isArray(manifest.appliedTailoring)) {
    const match = manifest.appliedTailoring.find(
      (t) => t.dimension === dimension,
    );
    if (match && typeof match.rationale === 'string' && match.rationale.length > 0) {
      return match.rationale;
    }
  }

  return '';
}

/**
 * Extracts the weight for a field change from the variant's tailoring data.
 *
 * @param {string} dimension - The tailoring dimension for this field
 * @param {object|null} tailoring - The variant's tailoring map (if available)
 * @returns {number} The weight value (0-100), or 0 if not found
 */
function extractWeight(dimension, tailoring) {
  if (tailoring && typeof tailoring === 'object' && tailoring[dimension]) {
    const entry = tailoring[dimension];
    if (entry && typeof entry.weight === 'number' && Number.isFinite(entry.weight)) {
      return Math.max(0, Math.min(100, entry.weight));
    }
  }
  return 0;
}

/**
 * Compares two values for deep equality using JSON serialization.
 *
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if values are deeply equal
 */
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (_e) {
    return false;
  }
}

/**
 * Computes a structured diff between a canonical PDP and a variant.
 * Identifies which sections/fields changed, the type of change, and the cohort-driven reason.
 * Pure function with no side effects.
 *
 * @param {object} canonicalPdp - The base/control product data
 * @param {object} variant - The variant object (may contain variantPdp, manifest, tailoring)
 * @returns {DiffResult} Structured diff result
 */
export function computeDiff(canonicalPdp, variant) {
  const emptyResult = {
    dimensions: [],
    changes: [],
    dimensionSummaries: [],
    totalChanges: 0,
    dimensionsChanged: 0,
    hasChanges: false,
    changesByDimension: {},
  };

  if (!canonicalPdp || typeof canonicalPdp !== 'object') {
    return emptyResult;
  }

  if (!variant || typeof variant !== 'object') {
    return emptyResult;
  }

  const variantPdp = variant.variantPdp && typeof variant.variantPdp === 'object'
    ? variant.variantPdp
    : variant;

  const manifest = variant.manifest && typeof variant.manifest === 'object'
    ? variant.manifest
    : null;

  const tailoring = variant.tailoring && typeof variant.tailoring === 'object' && !Array.isArray(variant.tailoring)
    ? variant.tailoring
    : null;

  const allKeys = new Set([
    ...Object.keys(canonicalPdp),
    ...Object.keys(variantPdp),
  ]);

  const internalKeys = new Set([
    'id', 'variantId', 'name', 'productId', 'cohortId', 'cohortType',
    'behavioralOverlay', 'baseSku', 'label', 'priority', 'controlFlag',
    'isActive', 'weight', 'tailoring', 'variantPdp', 'diff', 'manifest',
    'createdAt', 'updatedAt',
  ]);

  /** @type {FieldChange[]} */
  const changes = [];

  for (const key of allKeys) {
    if (internalKeys.has(key)) {
      continue;
    }

    const fromValue = canonicalPdp[key];
    const toValue = variantPdp[key];

    if (deepEqual(fromValue, toValue)) {
      continue;
    }

    const dimension = getDimensionForField(key);
    const changeType = determineChangeType(fromValue, toValue);
    const rationale = extractRationale(key, dimension, manifest, tailoring);
    const weight = extractWeight(dimension, tailoring);

    changes.push({
      field: key,
      from: fromValue !== undefined ? fromValue : null,
      to: toValue !== undefined ? toValue : null,
      changeType,
      dimension,
      rationale,
      weight,
    });
  }

  /** @type {Object.<string, FieldChange[]>} */
  const changesByDimension = {};

  for (const change of changes) {
    if (!changesByDimension[change.dimension]) {
      changesByDimension[change.dimension] = [];
    }
    changesByDimension[change.dimension].push(change);
  }

  const dimensionKeys = Object.keys(changesByDimension);

  /** @type {DimensionSummary[]} */
  const dimensionSummaries = dimensionKeys.map((dimension) => {
    const dimChanges = changesByDimension[dimension];
    const maxWeight = dimChanges.reduce((max, c) => Math.max(max, c.weight), 0);
    const primaryRationale = dimChanges.find((c) => c.rationale.length > 0);

    return {
      dimension,
      changeCount: dimChanges.length,
      changes: dimChanges,
      rationale: primaryRationale ? primaryRationale.rationale : '',
      weight: maxWeight,
    };
  });

  dimensionSummaries.sort((a, b) => b.weight - a.weight);

  const tailoringDimensions = dimensionKeys.filter(
    (d) => TAILORING_DIMENSIONS.includes(d),
  );

  const dimensions = [
    ...tailoringDimensions.sort(),
    ...dimensionKeys.filter((d) => !TAILORING_DIMENSIONS.includes(d)).sort(),
  ];

  return {
    dimensions,
    changes,
    dimensionSummaries,
    totalChanges: changes.length,
    dimensionsChanged: dimensions.length,
    hasChanges: changes.length > 0,
    changesByDimension,
  };
}

/**
 * Computes a simplified diff that returns only the changed dimensions and field names.
 * Useful for lightweight diff indicators in gallery views.
 *
 * @param {object} canonicalPdp - The base/control product data
 * @param {object} variant - The variant object
 * @returns {{ dimensions: string[], fields: string[], hasChanges: boolean }}
 */
export function computeSimpleDiff(canonicalPdp, variant) {
  const result = computeDiff(canonicalPdp, variant);

  return {
    dimensions: result.dimensions,
    fields: result.changes.map((c) => c.field),
    hasChanges: result.hasChanges,
  };
}

/**
 * Returns the changes for a specific tailoring dimension from a diff result.
 *
 * @param {DiffResult} diffResult - The full diff result
 * @param {string} dimension - The tailoring dimension to filter by
 * @returns {FieldChange[]} Array of field changes for the specified dimension
 */
export function getChangesForDimension(diffResult, dimension) {
  if (!diffResult || typeof diffResult !== 'object') {
    return [];
  }

  if (!dimension || typeof dimension !== 'string') {
    return [];
  }

  if (diffResult.changesByDimension && diffResult.changesByDimension[dimension]) {
    return [...diffResult.changesByDimension[dimension]];
  }

  return [];
}

/**
 * Returns the dimension summary for a specific tailoring dimension from a diff result.
 *
 * @param {DiffResult} diffResult - The full diff result
 * @param {string} dimension - The tailoring dimension to look up
 * @returns {DimensionSummary|null} The dimension summary, or null if not found
 */
export function getDimensionSummary(diffResult, dimension) {
  if (!diffResult || typeof diffResult !== 'object') {
    return null;
  }

  if (!dimension || typeof dimension !== 'string') {
    return null;
  }

  if (!Array.isArray(diffResult.dimensionSummaries)) {
    return null;
  }

  const summary = diffResult.dimensionSummaries.find((s) => s.dimension === dimension);
  return summary || null;
}

/**
 * Checks whether a specific field has changed in the diff result.
 *
 * @param {DiffResult} diffResult - The full diff result
 * @param {string} field - The field name to check
 * @returns {boolean} True if the field has changed
 */
export function hasFieldChanged(diffResult, field) {
  if (!diffResult || typeof diffResult !== 'object') {
    return false;
  }

  if (!field || typeof field !== 'string') {
    return false;
  }

  if (!Array.isArray(diffResult.changes)) {
    return false;
  }

  return diffResult.changes.some((c) => c.field === field);
}

/**
 * Returns the change details for a specific field from a diff result.
 *
 * @param {DiffResult} diffResult - The full diff result
 * @param {string} field - The field name to look up
 * @returns {FieldChange|null} The field change details, or null if not found
 */
export function getFieldChange(diffResult, field) {
  if (!diffResult || typeof diffResult !== 'object') {
    return null;
  }

  if (!field || typeof field !== 'string') {
    return null;
  }

  if (!Array.isArray(diffResult.changes)) {
    return null;
  }

  const change = diffResult.changes.find((c) => c.field === field);
  return change || null;
}

/**
 * Formats a diff result into a human-readable summary string.
 *
 * @param {DiffResult} diffResult - The full diff result
 * @returns {string} A human-readable summary of the diff
 */
export function formatDiffSummary(diffResult) {
  if (!diffResult || typeof diffResult !== 'object' || !diffResult.hasChanges) {
    return 'No changes detected.';
  }

  const parts = [];
  parts.push(`${diffResult.totalChanges} field${diffResult.totalChanges === 1 ? '' : 's'} changed`);
  parts.push(`across ${diffResult.dimensionsChanged} dimension${diffResult.dimensionsChanged === 1 ? '' : 's'}`);

  if (diffResult.dimensions.length > 0) {
    parts.push(`(${diffResult.dimensions.join(', ')})`);
  }

  return parts.join(' ');
}

/**
 * Returns the field-to-dimension mapping used by the diff engine.
 * Useful for UI components that need to know which fields belong to which dimensions.
 *
 * @returns {Object.<string, string>} A copy of the field-to-dimension map
 */
export function getFieldToDimensionMap() {
  return { ...FIELD_TO_DIMENSION_MAP };
}

const diffEngine = {
  computeDiff,
  computeSimpleDiff,
  getChangesForDimension,
  getDimensionSummary,
  hasFieldChanged,
  getFieldChange,
  formatDiffSummary,
  getFieldToDimensionMap,
};

export default diffEngine;