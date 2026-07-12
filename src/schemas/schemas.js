import { TAILORING_DIMENSIONS } from '@/constants/constants.js';

/**
 * Creates a validation result object
 * @param {boolean} valid - Whether validation passed
 * @param {string[]} errors - Array of error messages
 * @returns {{ valid: boolean, errors: string[] }}
 */
function result(valid, errors) {
  return { valid, errors };
}

/**
 * Checks if a value is a non-empty string
 * @param {*} value
 * @returns {boolean}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if a value is a positive number
 * @param {*} value
 * @returns {boolean}
 */
function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Checks if a value is a non-negative number
 * @param {*} value
 * @returns {boolean}
 */
function isNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Validates a catalog item object
 * @param {*} item - The catalog item to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCatalogItem(item) {
  const errors = [];

  if (!item || typeof item !== 'object') {
    return result(false, ['Catalog item must be a non-null object']);
  }

  if (!isNonEmptyString(item.id)) {
    errors.push('Catalog item must have a non-empty string "id"');
  }

  if (!isNonEmptyString(item.title)) {
    errors.push('Catalog item must have a non-empty string "title"');
  }

  if (!isNonEmptyString(item.sku)) {
    errors.push('Catalog item must have a non-empty string "sku"');
  }

  if (item.price !== undefined && !isNonNegativeNumber(item.price)) {
    errors.push('Catalog item "price" must be a non-negative number when provided');
  }

  if (item.category !== undefined && !isNonEmptyString(item.category)) {
    errors.push('Catalog item "category" must be a non-empty string when provided');
  }

  if (item.imageUrl !== undefined && !isNonEmptyString(item.imageUrl)) {
    errors.push('Catalog item "imageUrl" must be a non-empty string when provided');
  }

  if (item.description !== undefined && typeof item.description !== 'string') {
    errors.push('Catalog item "description" must be a string when provided');
  }

  return result(errors.length === 0, errors);
}

/**
 * Validates a cohort target object
 * @param {*} target - The cohort target to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCohortTarget(target) {
  const errors = [];

  if (!target || typeof target !== 'object') {
    return result(false, ['Cohort target must be a non-null object']);
  }

  if (!isNonEmptyString(target.cohortId)) {
    errors.push('Cohort target must have a non-empty string "cohortId"');
  }

  if (!isNonEmptyString(target.label)) {
    errors.push('Cohort target must have a non-empty string "label"');
  }

  if (target.behavioralOverlays !== undefined) {
    if (!Array.isArray(target.behavioralOverlays)) {
      errors.push('Cohort target "behavioralOverlays" must be an array when provided');
    } else {
      target.behavioralOverlays.forEach((overlay, index) => {
        if (!isNonEmptyString(overlay)) {
          errors.push(`Cohort target "behavioralOverlays[${index}]" must be a non-empty string`);
        }
      });
    }
  }

  if (target.priority !== undefined && !isPositiveNumber(target.priority)) {
    errors.push('Cohort target "priority" must be a positive number when provided');
  }

  return result(errors.length === 0, errors);
}

/**
 * Validates a cohort set object
 * @param {*} cohortSet - The cohort set to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCohortSet(cohortSet) {
  const errors = [];

  if (!cohortSet || typeof cohortSet !== 'object') {
    return result(false, ['Cohort set must be a non-null object']);
  }

  if (!isNonEmptyString(cohortSet.id)) {
    errors.push('Cohort set must have a non-empty string "id"');
  }

  if (!isNonEmptyString(cohortSet.name)) {
    errors.push('Cohort set must have a non-empty string "name"');
  }

  if (!Array.isArray(cohortSet.cohorts)) {
    errors.push('Cohort set must have an array "cohorts"');
  } else if (cohortSet.cohorts.length === 0) {
    errors.push('Cohort set "cohorts" must contain at least one cohort target');
  } else {
    cohortSet.cohorts.forEach((cohort, index) => {
      const cohortResult = validateCohortTarget(cohort);
      if (!cohortResult.valid) {
        cohortResult.errors.forEach((err) => {
          errors.push(`cohorts[${index}]: ${err}`);
        });
      }
    });
  }

  if (cohortSet.description !== undefined && typeof cohortSet.description !== 'string') {
    errors.push('Cohort set "description" must be a string when provided');
  }

  if (cohortSet.createdAt !== undefined && !isNonEmptyString(cohortSet.createdAt)) {
    errors.push('Cohort set "createdAt" must be a non-empty string when provided');
  }

  if (cohortSet.updatedAt !== undefined && !isNonEmptyString(cohortSet.updatedAt)) {
    errors.push('Cohort set "updatedAt" must be a non-empty string when provided');
  }

  return result(errors.length === 0, errors);
}

/**
 * Validates a variant object
 * @param {*} variant - The variant to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateVariant(variant) {
  const errors = [];

  if (!variant || typeof variant !== 'object') {
    return result(false, ['Variant must be a non-null object']);
  }

  if (!isNonEmptyString(variant.id)) {
    errors.push('Variant must have a non-empty string "id"');
  }

  if (!isNonEmptyString(variant.name)) {
    errors.push('Variant must have a non-empty string "name"');
  }

  if (!isNonEmptyString(variant.productId)) {
    errors.push('Variant must have a non-empty string "productId"');
  }

  if (variant.cohortId !== undefined && !isNonEmptyString(variant.cohortId)) {
    errors.push('Variant "cohortId" must be a non-empty string when provided');
  }

  if (variant.tailoring !== undefined) {
    if (!variant.tailoring || typeof variant.tailoring !== 'object' || Array.isArray(variant.tailoring)) {
      errors.push('Variant "tailoring" must be a non-null object when provided');
    } else {
      const tailoringKeys = Object.keys(variant.tailoring);
      tailoringKeys.forEach((key) => {
        if (!TAILORING_DIMENSIONS.includes(key)) {
          errors.push(`Variant "tailoring" contains unknown dimension "${key}". Allowed: ${TAILORING_DIMENSIONS.join(', ')}`);
        }
      });
    }
  }

  if (variant.weight !== undefined) {
    if (typeof variant.weight !== 'number' || !Number.isFinite(variant.weight) || variant.weight < 0 || variant.weight > 100) {
      errors.push('Variant "weight" must be a number between 0 and 100 when provided');
    }
  }

  if (variant.isActive !== undefined && typeof variant.isActive !== 'boolean') {
    errors.push('Variant "isActive" must be a boolean when provided');
  }

  if (variant.description !== undefined && typeof variant.description !== 'string') {
    errors.push('Variant "description" must be a string when provided');
  }

  if (variant.createdAt !== undefined && !isNonEmptyString(variant.createdAt)) {
    errors.push('Variant "createdAt" must be a non-empty string when provided');
  }

  if (variant.updatedAt !== undefined && !isNonEmptyString(variant.updatedAt)) {
    errors.push('Variant "updatedAt" must be a non-empty string when provided');
  }

  return result(errors.length === 0, errors);
}

/**
 * Validates a manifest object
 * @param {*} manifest - The manifest to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return result(false, ['Manifest must be a non-null object']);
  }

  if (!isNonEmptyString(manifest.id)) {
    errors.push('Manifest must have a non-empty string "id"');
  }

  if (!isNonEmptyString(manifest.name)) {
    errors.push('Manifest must have a non-empty string "name"');
  }

  if (!isNonEmptyString(manifest.version)) {
    errors.push('Manifest must have a non-empty string "version"');
  }

  if (!Array.isArray(manifest.variantIds)) {
    errors.push('Manifest must have an array "variantIds"');
  } else {
    if (manifest.variantIds.length === 0) {
      errors.push('Manifest "variantIds" must contain at least one variant ID');
    }
    manifest.variantIds.forEach((variantId, index) => {
      if (!isNonEmptyString(variantId)) {
        errors.push(`Manifest "variantIds[${index}]" must be a non-empty string`);
      }
    });
  }

  if (manifest.cohortSetId !== undefined && !isNonEmptyString(manifest.cohortSetId)) {
    errors.push('Manifest "cohortSetId" must be a non-empty string when provided');
  }

  if (manifest.status !== undefined) {
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(manifest.status)) {
      errors.push(`Manifest "status" must be one of: ${validStatuses.join(', ')}`);
    }
  }

  if (manifest.description !== undefined && typeof manifest.description !== 'string') {
    errors.push('Manifest "description" must be a string when provided');
  }

  if (manifest.createdAt !== undefined && !isNonEmptyString(manifest.createdAt)) {
    errors.push('Manifest "createdAt" must be a non-empty string when provided');
  }

  if (manifest.updatedAt !== undefined && !isNonEmptyString(manifest.updatedAt)) {
    errors.push('Manifest "updatedAt" must be a non-empty string when provided');
  }

  if (manifest.publishedAt !== undefined && !isNonEmptyString(manifest.publishedAt)) {
    errors.push('Manifest "publishedAt" must be a non-empty string when provided');
  }

  return result(errors.length === 0, errors);
}