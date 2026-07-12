/**
 * CatalogLoader service for the Prism PDP Variant Factory.
 * Loads mock catalog from persistence or seeds from mockCatalog.js on first load.
 * Validates each SKU against schema. Provides getCatalog(), getSkuById(sku), resetCatalog().
 * Emits observability events on load/reset.
 *
 * @module catalogLoader
 */

import mockCatalog from '@/data/mockCatalog.js';
import { STORAGE_KEYS } from '@/constants/constants.js';
import { save, load } from '@/services/persistenceManager.js';
import { validateCatalogItem } from '@/schemas/schemas.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * In-memory cache of the catalog data
 * @type {import('@/data/mockCatalog.js').CatalogItem[] | null}
 */
let catalogCache = null;

/**
 * Validates an array of catalog items against the schema.
 * Returns only the valid items and logs warnings for invalid ones.
 *
 * @param {Array<*>} items - Array of catalog items to validate
 * @returns {{ validItems: Array<*>, errors: string[] }}
 */
function validateCatalogItems(items) {
  const validItems = [];
  const errors = [];

  if (!Array.isArray(items)) {
    errors.push('Catalog data must be an array');
    return { validItems, errors };
  }

  items.forEach((item, index) => {
    const result = validateCatalogItem(item);
    if (result.valid) {
      validItems.push(item);
    } else {
      result.errors.forEach((err) => {
        errors.push(`catalog[${index}] (${item?.sku || 'unknown SKU'}): ${err}`);
      });
    }
  });

  return { validItems, errors };
}

/**
 * Seeds the catalog from the default mockCatalog data.
 * Validates all items and persists to storage.
 *
 * @returns {{ catalog: Array<*>, errors: string[] }}
 */
function seedCatalog() {
  const { validItems, errors } = validateCatalogItems(mockCatalog);

  if (errors.length > 0) {
    console.warn('[CatalogLoader] Seed validation warnings:', errors);
  }

  const saveResult = save(STORAGE_KEYS.CATALOG_KEY, validItems);
  if (!saveResult.success) {
    console.error('[CatalogLoader] Failed to persist seeded catalog:', saveResult.error);
  }

  catalogCache = validItems;

  return { catalog: validItems, errors };
}

/**
 * Loads the catalog from persistence or seeds from mockCatalog.js on first load.
 * Validates each SKU against schema. Emits a PDP_LOAD observability event.
 *
 * @returns {{ catalog: Array<*>, errors: string[], fromCache: boolean, fromStorage: boolean, seeded: boolean }}
 */
export function getCatalog() {
  if (catalogCache !== null) {
    emitEvent(EVENT_TYPES.PDP_LOAD, {
      action: 'getCatalog',
      source: 'cache',
      itemCount: catalogCache.length,
    });
    return {
      catalog: [...catalogCache],
      errors: [],
      fromCache: true,
      fromStorage: false,
      seeded: false,
    };
  }

  const loadResult = load(STORAGE_KEYS.CATALOG_KEY);

  if (loadResult.data !== null && Array.isArray(loadResult.data) && loadResult.data.length > 0) {
    const { validItems, errors } = validateCatalogItems(loadResult.data);

    if (validItems.length > 0) {
      catalogCache = validItems;

      if (errors.length > 0) {
        console.warn('[CatalogLoader] Storage catalog validation warnings:', errors);
        const saveResult = save(STORAGE_KEYS.CATALOG_KEY, validItems);
        if (!saveResult.success) {
          console.error('[CatalogLoader] Failed to persist cleaned catalog:', saveResult.error);
        }
      }

      emitEvent(EVENT_TYPES.PDP_LOAD, {
        action: 'getCatalog',
        source: 'storage',
        itemCount: validItems.length,
        validationErrors: errors.length,
      });

      return {
        catalog: [...validItems],
        errors,
        fromCache: false,
        fromStorage: true,
        seeded: false,
      };
    }
  }

  if (loadResult.error) {
    console.warn('[CatalogLoader] Storage load error, seeding from defaults:', loadResult.error);
  }

  const seedResult = seedCatalog();

  emitEvent(EVENT_TYPES.PDP_LOAD, {
    action: 'getCatalog',
    source: 'seed',
    itemCount: seedResult.catalog.length,
    validationErrors: seedResult.errors.length,
  });

  return {
    catalog: [...seedResult.catalog],
    errors: seedResult.errors,
    fromCache: false,
    fromStorage: false,
    seeded: true,
  };
}

/**
 * Returns a single catalog item by its SKU identifier.
 * Loads the catalog if not already cached.
 *
 * @param {string} sku - The SKU string to look up
 * @returns {{ item: *|null, error: string|null }}
 */
export function getSkuById(sku) {
  if (!sku || typeof sku !== 'string') {
    return { item: null, error: 'SKU must be a non-empty string' };
  }

  const { catalog } = getCatalog();

  const item = catalog.find((entry) => entry.sku === sku) || null;

  if (!item) {
    return { item: null, error: `No catalog item found for SKU "${sku}"` };
  }

  return { item, error: null };
}

/**
 * Returns a single catalog item by its product ID.
 * Loads the catalog if not already cached.
 *
 * @param {string} productId - The product ID to look up
 * @returns {{ item: *|null, error: string|null }}
 */
export function getProductById(productId) {
  if (!productId || typeof productId !== 'string') {
    return { item: null, error: 'Product ID must be a non-empty string' };
  }

  const { catalog } = getCatalog();

  const item = catalog.find((entry) => entry.id === productId) || null;

  if (!item) {
    return { item: null, error: `No catalog item found for product ID "${productId}"` };
  }

  return { item, error: null };
}

/**
 * Resets the catalog to the default mock data.
 * Clears the in-memory cache, re-seeds from mockCatalog.js, and persists.
 * Emits a PDP_LOAD observability event with reset action.
 *
 * @returns {{ catalog: Array<*>, errors: string[], success: boolean }}
 */
export function resetCatalog() {
  catalogCache = null;

  const seedResult = seedCatalog();

  emitEvent(EVENT_TYPES.PDP_LOAD, {
    action: 'resetCatalog',
    source: 'seed',
    itemCount: seedResult.catalog.length,
    validationErrors: seedResult.errors.length,
  });

  return {
    catalog: [...seedResult.catalog],
    errors: seedResult.errors,
    success: true,
  };
}

/**
 * Returns the number of items currently in the catalog.
 * Loads the catalog if not already cached.
 *
 * @returns {number}
 */
export function getCatalogCount() {
  const { catalog } = getCatalog();
  return catalog.length;
}

/**
 * Clears the in-memory catalog cache without affecting persistence.
 * Useful for testing or forcing a reload from storage on next access.
 *
 * @returns {void}
 */
export function clearCatalogCache() {
  catalogCache = null;
}

const catalogLoader = {
  getCatalog,
  getSkuById,
  getProductById,
  resetCatalog,
  getCatalogCount,
  clearCatalogCache,
};

export default catalogLoader;