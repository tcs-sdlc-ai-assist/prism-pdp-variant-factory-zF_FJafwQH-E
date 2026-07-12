import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCatalog,
  getSkuById,
  getProductById,
  resetCatalog,
  getCatalogCount,
  clearCatalogCache,
} from '@/services/catalogLoader.js';
import { STORAGE_KEYS } from '@/constants/constants.js';
import mockCatalog from '@/data/mockCatalog.js';

describe('CatalogLoader', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearCatalogCache();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearCatalogCache();
  });

  describe('getCatalog', () => {
    it('seeds catalog from mock data on first load when storage is empty', () => {
      const result = getCatalog();

      expect(result.catalog).toBeDefined();
      expect(Array.isArray(result.catalog)).toBe(true);
      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
      expect(result.fromCache).toBe(false);
      expect(result.fromStorage).toBe(false);
    });

    it('returns catalog from cache on subsequent calls', () => {
      const firstResult = getCatalog();
      const secondResult = getCatalog();

      expect(secondResult.fromCache).toBe(true);
      expect(secondResult.fromStorage).toBe(false);
      expect(secondResult.seeded).toBe(false);
      expect(secondResult.catalog.length).toBe(firstResult.catalog.length);
    });

    it('loads catalog from storage when cache is cleared', () => {
      getCatalog();
      clearCatalogCache();

      const result = getCatalog();

      expect(result.fromStorage).toBe(true);
      expect(result.fromCache).toBe(false);
      expect(result.seeded).toBe(false);
      expect(result.catalog.length).toBe(mockCatalog.length);
    });

    it('returns empty errors array on successful load', () => {
      const result = getCatalog();

      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('persists seeded catalog to localStorage', () => {
      getCatalog();

      const raw = localStorage.getItem(STORAGE_KEYS.CATALOG_KEY);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(mockCatalog.length);
    });

    it('returns a copy of catalog data, not a reference', () => {
      const result1 = getCatalog();
      const result2 = getCatalog();

      expect(result1.catalog).not.toBe(result2.catalog);
      expect(result1.catalog).toEqual(result2.catalog);
    });

    it('seeds from defaults when storage contains corrupted data', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, '{invalid json!!!');
      clearCatalogCache();

      const result = getCatalog();

      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
    });

    it('seeds from defaults when storage contains empty array', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify([]));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
    });

    it('seeds from defaults when storage contains non-array data', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify({ not: 'an array' }));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
    });

    it('filters out invalid catalog items from storage and keeps valid ones', () => {
      const mixedData = [
        mockCatalog[0],
        { invalid: true },
        mockCatalog[1],
      ];
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify(mixedData));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.fromStorage).toBe(true);
      expect(result.catalog.length).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('contains all expected SKUs from mock catalog', () => {
      const result = getCatalog();

      const skus = result.catalog.map((item) => item.sku);
      expect(skus).toContain('SKU-6548320');
      expect(skus).toContain('SKU-6571042');
      expect(skus).toContain('SKU-6505727');
      expect(skus).toContain('SKU-6487278');
      expect(skus).toContain('SKU-6534512');
      expect(skus).toContain('SKU-6563925');
    });

    it('each catalog item has required fields', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        expect(typeof item.id).toBe('string');
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.sku).toBe('string');
        expect(item.sku.length).toBeGreaterThan(0);
        expect(typeof item.title).toBe('string');
        expect(item.title.length).toBeGreaterThan(0);
      });
    });

    it('each catalog item has valid price data', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        expect(typeof item.price).toBe('number');
        expect(Number.isFinite(item.price)).toBe(true);
        expect(item.price).toBeGreaterThan(0);

        if (item.memberPrice !== undefined) {
          expect(typeof item.memberPrice).toBe('number');
          expect(Number.isFinite(item.memberPrice)).toBe(true);
          expect(item.memberPrice).toBeGreaterThan(0);
        }
      });
    });

    it('each catalog item has valid rating data', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        expect(typeof item.rating).toBe('number');
        expect(item.rating).toBeGreaterThanOrEqual(0);
        expect(item.rating).toBeLessThanOrEqual(5);

        expect(typeof item.reviewCount).toBe('number');
        expect(item.reviewCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getSkuById', () => {
    it('returns the correct catalog item for a valid SKU', () => {
      const result = getSkuById('SKU-6548320');

      expect(result.item).not.toBeNull();
      expect(result.error).toBeNull();
      expect(result.item.sku).toBe('SKU-6548320');
      expect(result.item.title).toContain('Samsung');
    });

    it('returns null item and error for a non-existent SKU', () => {
      const result = getSkuById('SKU-NONEXISTENT');

      expect(result.item).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error).toContain('SKU-NONEXISTENT');
    });

    it('returns error when SKU is empty string', () => {
      const result = getSkuById('');

      expect(result.item).toBeNull();
      expect(result.error).toBe('SKU must be a non-empty string');
    });

    it('returns error when SKU is null', () => {
      const result = getSkuById(null);

      expect(result.item).toBeNull();
      expect(result.error).toBe('SKU must be a non-empty string');
    });

    it('returns error when SKU is undefined', () => {
      const result = getSkuById(undefined);

      expect(result.item).toBeNull();
      expect(result.error).toBe('SKU must be a non-empty string');
    });

    it('returns error when SKU is a number', () => {
      const result = getSkuById(12345);

      expect(result.item).toBeNull();
      expect(result.error).toBe('SKU must be a non-empty string');
    });

    it('returns correct item for each mock catalog SKU', () => {
      const expectedSkus = [
        'SKU-6548320',
        'SKU-6571042',
        'SKU-6505727',
        'SKU-6487278',
        'SKU-6534512',
        'SKU-6563925',
      ];

      expectedSkus.forEach((sku) => {
        const result = getSkuById(sku);
        expect(result.item).not.toBeNull();
        expect(result.item.sku).toBe(sku);
        expect(result.error).toBeNull();
      });
    });

    it('returned item has all expected properties', () => {
      const result = getSkuById('SKU-6571042');

      expect(result.item).not.toBeNull();
      expect(result.item.id).toBeDefined();
      expect(result.item.sku).toBe('SKU-6571042');
      expect(result.item.title).toBeDefined();
      expect(result.item.description).toBeDefined();
      expect(result.item.price).toBeDefined();
      expect(result.item.category).toBeDefined();
      expect(result.item.brand).toBeDefined();
      expect(result.item.imageUrl).toBeDefined();
    });
  });

  describe('getProductById', () => {
    it('returns the correct catalog item for a valid product ID', () => {
      const result = getProductById('prod-tv-001');

      expect(result.item).not.toBeNull();
      expect(result.error).toBeNull();
      expect(result.item.id).toBe('prod-tv-001');
      expect(result.item.sku).toBe('SKU-6548320');
    });

    it('returns null item and error for a non-existent product ID', () => {
      const result = getProductById('prod-nonexistent');

      expect(result.item).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error).toContain('prod-nonexistent');
    });

    it('returns error when product ID is empty string', () => {
      const result = getProductById('');

      expect(result.item).toBeNull();
      expect(result.error).toBe('Product ID must be a non-empty string');
    });

    it('returns error when product ID is null', () => {
      const result = getProductById(null);

      expect(result.item).toBeNull();
      expect(result.error).toBe('Product ID must be a non-empty string');
    });

    it('returns error when product ID is undefined', () => {
      const result = getProductById(undefined);

      expect(result.item).toBeNull();
      expect(result.error).toBe('Product ID must be a non-empty string');
    });

    it('returns correct item for each mock catalog product ID', () => {
      const expectedIds = [
        'prod-tv-001',
        'prod-laptop-002',
        'prod-headphones-003',
        'prod-speaker-004',
        'prod-tablet-005',
        'prod-console-006',
      ];

      expectedIds.forEach((id) => {
        const result = getProductById(id);
        expect(result.item).not.toBeNull();
        expect(result.item.id).toBe(id);
        expect(result.error).toBeNull();
      });
    });
  });

  describe('resetCatalog', () => {
    it('resets catalog to default mock data', () => {
      const result = resetCatalog();

      expect(result.success).toBe(true);
      expect(result.catalog.length).toBe(mockCatalog.length);
    });

    it('returns catalog with all expected SKUs after reset', () => {
      resetCatalog();
      const result = getCatalog();

      const skus = result.catalog.map((item) => item.sku);
      expect(skus.length).toBe(mockCatalog.length);

      mockCatalog.forEach((item) => {
        expect(skus).toContain(item.sku);
      });
    });

    it('clears cache and re-seeds from defaults', () => {
      getCatalog();

      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify([mockCatalog[0]]));

      const resetResult = resetCatalog();

      expect(resetResult.catalog.length).toBe(mockCatalog.length);

      const loadResult = getCatalog();
      expect(loadResult.catalog.length).toBe(mockCatalog.length);
      expect(loadResult.fromCache).toBe(true);
    });

    it('persists reset catalog to storage', () => {
      resetCatalog();

      const raw = localStorage.getItem(STORAGE_KEYS.CATALOG_KEY);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw);
      expect(parsed.length).toBe(mockCatalog.length);
    });

    it('returns empty errors array on successful reset', () => {
      const result = resetCatalog();

      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('can be called multiple times without issues', () => {
      const result1 = resetCatalog();
      const result2 = resetCatalog();
      const result3 = resetCatalog();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(result1.catalog.length).toBe(result2.catalog.length);
      expect(result2.catalog.length).toBe(result3.catalog.length);
    });

    it('restores catalog after it was modified in storage', () => {
      getCatalog();

      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify([]));
      clearCatalogCache();

      const resetResult = resetCatalog();

      expect(resetResult.catalog.length).toBe(mockCatalog.length);
    });
  });

  describe('getCatalogCount', () => {
    it('returns the correct count of catalog items', () => {
      const count = getCatalogCount();

      expect(count).toBe(mockCatalog.length);
    });

    it('returns correct count after reset', () => {
      resetCatalog();
      const count = getCatalogCount();

      expect(count).toBe(mockCatalog.length);
    });
  });

  describe('clearCatalogCache', () => {
    it('clears the in-memory cache', () => {
      getCatalog();

      clearCatalogCache();

      localStorage.setItem(
        STORAGE_KEYS.CATALOG_KEY,
        JSON.stringify([mockCatalog[0], mockCatalog[1]]),
      );

      const result = getCatalog();

      expect(result.fromStorage).toBe(true);
      expect(result.fromCache).toBe(false);
      expect(result.catalog.length).toBe(2);
    });

    it('does not affect persisted data', () => {
      getCatalog();

      const rawBefore = localStorage.getItem(STORAGE_KEYS.CATALOG_KEY);

      clearCatalogCache();

      const rawAfter = localStorage.getItem(STORAGE_KEYS.CATALOG_KEY);

      expect(rawAfter).toBe(rawBefore);
    });
  });

  describe('schema validation', () => {
    it('rejects catalog items missing id field', () => {
      const invalidItems = [
        { sku: 'SKU-TEST', title: 'Test Product', price: 99.99 },
      ];
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify(invalidItems));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.seeded).toBe(true);
    });

    it('rejects catalog items missing sku field', () => {
      const invalidItems = [
        { id: 'prod-test', title: 'Test Product', price: 99.99 },
      ];
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify(invalidItems));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.seeded).toBe(true);
    });

    it('rejects catalog items missing title field', () => {
      const invalidItems = [
        { id: 'prod-test', sku: 'SKU-TEST', price: 99.99 },
      ];
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify(invalidItems));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.seeded).toBe(true);
    });

    it('accepts valid catalog items from storage', () => {
      const validItems = [
        {
          id: 'prod-custom-001',
          sku: 'SKU-CUSTOM-001',
          title: 'Custom Product',
          price: 199.99,
          category: 'Custom',
          imageUrl: 'https://example.com/image.jpg',
          description: 'A custom product for testing',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify(validItems));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.fromStorage).toBe(true);
      expect(result.catalog.length).toBe(1);
      expect(result.catalog[0].sku).toBe('SKU-CUSTOM-001');
    });

    it('filters invalid items and keeps valid ones from mixed storage data', () => {
      const mixedItems = [
        {
          id: 'prod-valid',
          sku: 'SKU-VALID',
          title: 'Valid Product',
          price: 49.99,
        },
        { invalid: 'no required fields' },
        null,
        {
          id: 'prod-valid-2',
          sku: 'SKU-VALID-2',
          title: 'Another Valid Product',
          price: 79.99,
        },
      ];
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify(mixedItems));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.fromStorage).toBe(true);
      expect(result.catalog.length).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('persistence round-trip', () => {
    it('round-trips catalog data through storage correctly', () => {
      const firstLoad = getCatalog();
      clearCatalogCache();

      const secondLoad = getCatalog();

      expect(secondLoad.catalog).toEqual(firstLoad.catalog);
      expect(secondLoad.fromStorage).toBe(true);
    });

    it('preserves all catalog item fields through round-trip', () => {
      const firstLoad = getCatalog();
      const firstItem = firstLoad.catalog[0];

      clearCatalogCache();

      const secondLoad = getCatalog();
      const secondItem = secondLoad.catalog.find((item) => item.sku === firstItem.sku);

      expect(secondItem).toBeDefined();
      expect(secondItem.id).toBe(firstItem.id);
      expect(secondItem.sku).toBe(firstItem.sku);
      expect(secondItem.title).toBe(firstItem.title);
      expect(secondItem.description).toBe(firstItem.description);
      expect(secondItem.price).toBe(firstItem.price);
      expect(secondItem.memberPrice).toBe(firstItem.memberPrice);
      expect(secondItem.rating).toBe(firstItem.rating);
      expect(secondItem.reviewCount).toBe(firstItem.reviewCount);
      expect(secondItem.category).toBe(firstItem.category);
      expect(secondItem.brand).toBe(firstItem.brand);
      expect(secondItem.badge).toBe(firstItem.badge);
      expect(secondItem.fulfillment).toBe(firstItem.fulfillment);
      expect(secondItem.warranty).toBe(firstItem.warranty);
    });

    it('preserves specs object through round-trip', () => {
      const firstLoad = getCatalog();
      const firstItem = firstLoad.catalog.find((item) => item.sku === 'SKU-6548320');

      clearCatalogCache();

      const secondLoad = getCatalog();
      const secondItem = secondLoad.catalog.find((item) => item.sku === 'SKU-6548320');

      expect(secondItem.specs).toEqual(firstItem.specs);
    });

    it('preserves features array through round-trip', () => {
      const firstLoad = getCatalog();
      const firstItem = firstLoad.catalog.find((item) => item.sku === 'SKU-6571042');

      clearCatalogCache();

      const secondLoad = getCatalog();
      const secondItem = secondLoad.catalog.find((item) => item.sku === 'SKU-6571042');

      expect(secondItem.features).toEqual(firstItem.features);
    });

    it('preserves media array through round-trip', () => {
      const firstLoad = getCatalog();
      const firstItem = firstLoad.catalog.find((item) => item.sku === 'SKU-6505727');

      clearCatalogCache();

      const secondLoad = getCatalog();
      const secondItem = secondLoad.catalog.find((item) => item.sku === 'SKU-6505727');

      expect(secondItem.media).toEqual(firstItem.media);
    });
  });

  describe('error handling', () => {
    it('handles corrupted JSON in storage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, 'not valid json at all');
      clearCatalogCache();

      const result = getCatalog();

      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
    });

    it('handles null value in storage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, 'null');
      clearCatalogCache();

      const result = getCatalog();

      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
    });

    it('handles string value in storage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify('just a string'));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
    });

    it('handles number value in storage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify(42));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
    });

    it('handles array of nulls in storage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify([null, null, null]));
      clearCatalogCache();

      const result = getCatalog();

      expect(result.catalog.length).toBe(mockCatalog.length);
      expect(result.seeded).toBe(true);
    });

    it('getSkuById works correctly after corrupted data recovery', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, 'corrupted!!!');
      clearCatalogCache();

      getCatalog();

      const result = getSkuById('SKU-6548320');
      expect(result.item).not.toBeNull();
      expect(result.item.sku).toBe('SKU-6548320');
    });

    it('getProductById works correctly after corrupted data recovery', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, 'corrupted!!!');
      clearCatalogCache();

      getCatalog();

      const result = getProductById('prod-laptop-002');
      expect(result.item).not.toBeNull();
      expect(result.item.id).toBe('prod-laptop-002');
    });
  });

  describe('mock catalog data integrity', () => {
    it('contains exactly 6 products', () => {
      const result = getCatalog();

      expect(result.catalog.length).toBe(6);
    });

    it('all products have unique SKUs', () => {
      const result = getCatalog();
      const skus = result.catalog.map((item) => item.sku);
      const uniqueSkus = new Set(skus);

      expect(uniqueSkus.size).toBe(skus.length);
    });

    it('all products have unique IDs', () => {
      const result = getCatalog();
      const ids = result.catalog.map((item) => item.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all products have specs objects', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        expect(item.specs).toBeDefined();
        expect(typeof item.specs).toBe('object');
        expect(item.specs).not.toBeNull();
        expect(Object.keys(item.specs).length).toBeGreaterThan(0);
      });
    });

    it('all products have features arrays', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        expect(Array.isArray(item.features)).toBe(true);
        expect(item.features.length).toBeGreaterThan(0);
      });
    });

    it('all products have media arrays', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        expect(Array.isArray(item.media)).toBe(true);
        expect(item.media.length).toBeGreaterThan(0);
      });
    });

    it('all products have brand, category, and badge fields', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        expect(typeof item.brand).toBe('string');
        expect(item.brand.length).toBeGreaterThan(0);
        expect(typeof item.category).toBe('string');
        expect(item.category.length).toBeGreaterThan(0);
        expect(typeof item.badge).toBe('string');
        expect(item.badge.length).toBeGreaterThan(0);
      });
    });

    it('all products have fulfillment and warranty fields', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        expect(typeof item.fulfillment).toBe('string');
        expect(item.fulfillment.length).toBeGreaterThan(0);
        expect(typeof item.warranty).toBe('string');
        expect(item.warranty.length).toBeGreaterThan(0);
      });
    });

    it('member prices are less than or equal to regular prices', () => {
      const result = getCatalog();

      result.catalog.forEach((item) => {
        if (item.memberPrice !== undefined && item.memberPrice !== null) {
          expect(item.memberPrice).toBeLessThanOrEqual(item.price);
        }
      });
    });
  });
});