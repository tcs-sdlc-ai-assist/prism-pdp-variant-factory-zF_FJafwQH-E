/**
 * CohortIntake service for the Prism PDP Variant Factory.
 * Manages cohort × behavior target configuration.
 * Provides loadCohortSet(), saveCohortSet(targets), validateCohortSet(targets), getDefaultCohortSet().
 * Serializes/deserializes cohort-set data to/from persistence.
 * Validates required fields (cohort, overlay, baseSku, label) and batch count (1-10).
 *
 * @module cohortIntakeService
 */

import defaultCohorts from '@/data/defaultCohorts.js';
import { STORAGE_KEYS, MAX_VARIANTS } from '@/constants/constants.js';
import { save, load } from '@/services/persistenceManager.js';
import { validateCohortSet as schemaValidateCohortSet, validateCohortTarget } from '@/schemas/schemas.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * In-memory cache of the cohort set data
 * @type {import('@/data/defaultCohorts.js').DefaultCohortSet | null}
 */
let cohortSetCache = null;

/**
 * Minimum number of cohort targets allowed
 * @type {number}
 */
const MIN_COHORT_TARGETS = 1;

/**
 * Maximum number of cohort targets allowed
 * @type {number}
 */
const MAX_COHORT_TARGETS = MAX_VARIANTS;

/**
 * Validates a single cohort target for intake-specific requirements.
 * Checks required fields: cohortType, behavioralOverlay, baseSku, label.
 *
 * @param {*} target - The cohort target to validate
 * @param {number} index - The index of the target in the array (for error messages)
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateIntakeTarget(target, index) {
  const errors = [];

  if (!target || typeof target !== 'object') {
    return { valid: false, errors: [`cohorts[${index}]: Target must be a non-null object`] };
  }

  if (!target.label || typeof target.label !== 'string' || target.label.trim().length === 0) {
    errors.push(`cohorts[${index}]: Target must have a non-empty string "label"`);
  }

  if (!target.cohortType || typeof target.cohortType !== 'string' || target.cohortType.trim().length === 0) {
    errors.push(`cohorts[${index}]: Target must have a non-empty string "cohortType"`);
  }

  if (!target.behavioralOverlay || typeof target.behavioralOverlay !== 'string' || target.behavioralOverlay.trim().length === 0) {
    errors.push(`cohorts[${index}]: Target must have a non-empty string "behavioralOverlay"`);
  }

  if (!target.baseSku || typeof target.baseSku !== 'string' || target.baseSku.trim().length === 0) {
    errors.push(`cohorts[${index}]: Target must have a non-empty string "baseSku"`);
  }

  const schemaResult = validateCohortTarget(target);
  if (!schemaResult.valid) {
    schemaResult.errors.forEach((err) => {
      errors.push(`cohorts[${index}]: ${err}`);
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a complete cohort set for intake requirements.
 * Checks schema validity, required fields on each target, and batch count (1-10).
 *
 * @param {*} cohortSet - The cohort set to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCohortSet(cohortSet) {
  const errors = [];

  if (!cohortSet || typeof cohortSet !== 'object') {
    return { valid: false, errors: ['Cohort set must be a non-null object'] };
  }

  if (!cohortSet.id || typeof cohortSet.id !== 'string' || cohortSet.id.trim().length === 0) {
    errors.push('Cohort set must have a non-empty string "id"');
  }

  if (!cohortSet.name || typeof cohortSet.name !== 'string' || cohortSet.name.trim().length === 0) {
    errors.push('Cohort set must have a non-empty string "name"');
  }

  if (!Array.isArray(cohortSet.cohorts)) {
    errors.push('Cohort set must have an array "cohorts"');
    return { valid: false, errors };
  }

  if (cohortSet.cohorts.length < MIN_COHORT_TARGETS) {
    errors.push(`Cohort set must contain at least ${MIN_COHORT_TARGETS} cohort target`);
  }

  if (cohortSet.cohorts.length > MAX_COHORT_TARGETS) {
    errors.push(`Cohort set must contain at most ${MAX_COHORT_TARGETS} cohort targets`);
  }

  cohortSet.cohorts.forEach((target, index) => {
    const targetResult = validateIntakeTarget(target, index);
    if (!targetResult.valid) {
      targetResult.errors.forEach((err) => {
        errors.push(err);
      });
    }
  });

  if (cohortSet.description !== undefined && typeof cohortSet.description !== 'string') {
    errors.push('Cohort set "description" must be a string when provided');
  }

  if (cohortSet.createdAt !== undefined && (typeof cohortSet.createdAt !== 'string' || cohortSet.createdAt.trim().length === 0)) {
    errors.push('Cohort set "createdAt" must be a non-empty string when provided');
  }

  if (cohortSet.updatedAt !== undefined && (typeof cohortSet.updatedAt !== 'string' || cohortSet.updatedAt.trim().length === 0)) {
    errors.push('Cohort set "updatedAt" must be a non-empty string when provided');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Returns a deep copy of the default cohort set from defaultCohorts.js.
 *
 * @returns {import('@/data/defaultCohorts.js').DefaultCohortSet}
 */
export function getDefaultCohortSet() {
  return JSON.parse(JSON.stringify(defaultCohorts));
}

/**
 * Seeds the cohort set from the default data.
 * Validates and persists to storage.
 *
 * @returns {{ cohortSet: object, errors: string[] }}
 */
function seedCohortSet() {
  const cohortSet = getDefaultCohortSet();
  const validation = validateCohortSet(cohortSet);

  if (!validation.valid) {
    console.warn('[CohortIntakeService] Default cohort set validation warnings:', validation.errors);
  }

  const saveResult = save(STORAGE_KEYS.COHORT_SET_KEY, cohortSet);
  if (!saveResult.success) {
    console.error('[CohortIntakeService] Failed to persist seeded cohort set:', saveResult.error);
  }

  cohortSetCache = cohortSet;

  return { cohortSet, errors: validation.errors };
}

/**
 * Loads the cohort set from persistence or seeds from defaults on first load.
 * Validates the loaded data against schema and intake requirements.
 * Emits a COHORT_CONFIG observability event.
 *
 * @returns {{ cohortSet: object, errors: string[], fromCache: boolean, fromStorage: boolean, seeded: boolean }}
 */
export function loadCohortSet() {
  if (cohortSetCache !== null) {
    emitEvent(EVENT_TYPES.COHORT_CONFIG, {
      action: 'loadCohortSet',
      source: 'cache',
      cohortCount: cohortSetCache.cohorts ? cohortSetCache.cohorts.length : 0,
    });
    return {
      cohortSet: JSON.parse(JSON.stringify(cohortSetCache)),
      errors: [],
      fromCache: true,
      fromStorage: false,
      seeded: false,
    };
  }

  const loadResult = load(STORAGE_KEYS.COHORT_SET_KEY);

  if (loadResult.data !== null && typeof loadResult.data === 'object' && !Array.isArray(loadResult.data)) {
    const validation = validateCohortSet(loadResult.data);

    if (validation.valid || (Array.isArray(loadResult.data.cohorts) && loadResult.data.cohorts.length > 0)) {
      cohortSetCache = loadResult.data;

      if (!validation.valid) {
        console.warn('[CohortIntakeService] Storage cohort set validation warnings:', validation.errors);
      }

      emitEvent(EVENT_TYPES.COHORT_CONFIG, {
        action: 'loadCohortSet',
        source: 'storage',
        cohortCount: loadResult.data.cohorts ? loadResult.data.cohorts.length : 0,
        validationErrors: validation.errors.length,
      });

      return {
        cohortSet: JSON.parse(JSON.stringify(cohortSetCache)),
        errors: validation.errors,
        fromCache: false,
        fromStorage: true,
        seeded: false,
      };
    }
  }

  if (loadResult.error) {
    console.warn('[CohortIntakeService] Storage load error, seeding from defaults:', loadResult.error);
  }

  const seedResult = seedCohortSet();

  emitEvent(EVENT_TYPES.COHORT_CONFIG, {
    action: 'loadCohortSet',
    source: 'seed',
    cohortCount: seedResult.cohortSet.cohorts ? seedResult.cohortSet.cohorts.length : 0,
    validationErrors: seedResult.errors.length,
  });

  return {
    cohortSet: JSON.parse(JSON.stringify(seedResult.cohortSet)),
    errors: seedResult.errors,
    fromCache: false,
    fromStorage: false,
    seeded: true,
  };
}

/**
 * Saves a cohort set to persistence after validation.
 * Updates the in-memory cache and sets the updatedAt timestamp.
 * Emits a COHORT_CONFIG observability event.
 *
 * @param {object} cohortSet - The cohort set to save
 * @returns {{ success: boolean, errors: string[], cohortSet: object|null }}
 */
export function saveCohortSet(cohortSet) {
  if (!cohortSet || typeof cohortSet !== 'object') {
    return {
      success: false,
      errors: ['Cohort set must be a non-null object'],
      cohortSet: null,
    };
  }

  const validation = validateCohortSet(cohortSet);

  if (!validation.valid) {
    emitEvent(EVENT_TYPES.COHORT_CONFIG, {
      action: 'saveCohortSet',
      success: false,
      validationErrors: validation.errors.length,
    });

    return {
      success: false,
      errors: validation.errors,
      cohortSet: null,
    };
  }

  const updatedCohortSet = {
    ...cohortSet,
    updatedAt: new Date().toISOString(),
  };

  if (!updatedCohortSet.createdAt) {
    updatedCohortSet.createdAt = updatedCohortSet.updatedAt;
  }

  const saveResult = save(STORAGE_KEYS.COHORT_SET_KEY, updatedCohortSet);

  if (!saveResult.success) {
    console.error('[CohortIntakeService] Failed to persist cohort set:', saveResult.error);

    emitEvent(EVENT_TYPES.ERROR, {
      action: 'saveCohortSet',
      error: saveResult.error,
    });

    return {
      success: false,
      errors: [`Persistence error: ${saveResult.error}`],
      cohortSet: null,
    };
  }

  cohortSetCache = updatedCohortSet;

  emitEvent(EVENT_TYPES.COHORT_CONFIG, {
    action: 'saveCohortSet',
    success: true,
    cohortCount: updatedCohortSet.cohorts.length,
    fallback: saveResult.fallback,
  });

  return {
    success: true,
    errors: [],
    cohortSet: JSON.parse(JSON.stringify(updatedCohortSet)),
  };
}

/**
 * Resets the cohort set to the default data.
 * Clears the in-memory cache, re-seeds from defaults, and persists.
 * Emits a COHORT_CONFIG observability event with reset action.
 *
 * @returns {{ cohortSet: object, errors: string[], success: boolean }}
 */
export function resetCohortSet() {
  cohortSetCache = null;

  const seedResult = seedCohortSet();

  emitEvent(EVENT_TYPES.COHORT_CONFIG, {
    action: 'resetCohortSet',
    source: 'seed',
    cohortCount: seedResult.cohortSet.cohorts ? seedResult.cohortSet.cohorts.length : 0,
    validationErrors: seedResult.errors.length,
  });

  return {
    cohortSet: JSON.parse(JSON.stringify(seedResult.cohortSet)),
    errors: seedResult.errors,
    success: true,
  };
}

/**
 * Returns the number of cohort targets in the current cohort set.
 * Loads the cohort set if not already cached.
 *
 * @returns {number}
 */
export function getCohortCount() {
  const { cohortSet } = loadCohortSet();
  return Array.isArray(cohortSet.cohorts) ? cohortSet.cohorts.length : 0;
}

/**
 * Returns a single cohort target by its cohortId.
 * Loads the cohort set if not already cached.
 *
 * @param {string} cohortId - The cohort target ID to look up
 * @returns {{ target: object|null, error: string|null }}
 */
export function getCohortTargetById(cohortId) {
  if (!cohortId || typeof cohortId !== 'string') {
    return { target: null, error: 'Cohort ID must be a non-empty string' };
  }

  const { cohortSet } = loadCohortSet();

  if (!Array.isArray(cohortSet.cohorts)) {
    return { target: null, error: 'No cohort targets available' };
  }

  const target = cohortSet.cohorts.find((c) => c.cohortId === cohortId) || null;

  if (!target) {
    return { target: null, error: `No cohort target found for ID "${cohortId}"` };
  }

  return { target: JSON.parse(JSON.stringify(target)), error: null };
}

/**
 * Clears the in-memory cohort set cache without affecting persistence.
 * Useful for testing or forcing a reload from storage on next access.
 *
 * @returns {void}
 */
export function clearCohortSetCache() {
  cohortSetCache = null;
}

const cohortIntakeService = {
  loadCohortSet,
  saveCohortSet,
  validateCohortSet,
  getDefaultCohortSet,
  resetCohortSet,
  getCohortCount,
  getCohortTargetById,
  clearCohortSetCache,
};

export default cohortIntakeService;