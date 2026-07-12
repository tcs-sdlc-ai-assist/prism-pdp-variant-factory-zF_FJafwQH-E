import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  save,
  load,
  remove,
  reset,
  getIsFallbackMode,
  isLocalStorageAvailable,
  saveSync,
  loadSync,
} from '@/services/persistenceManager.js';
import { STORAGE_KEYS } from '@/constants/constants.js';

describe('PersistenceManager', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('isLocalStorageAvailable', () => {
    it('returns true when localStorage is functional', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('returns false when localStorage throws on setItem', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('SecurityError');
      };

      expect(isLocalStorageAvailable()).toBe(false);

      localStorage.setItem = originalSetItem;
    });

    it('returns false when localStorage getItem returns wrong value', () => {
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;
      localStorage.setItem = vi.fn();
      localStorage.getItem = vi.fn().mockReturnValue('wrong');
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn();

      expect(isLocalStorageAvailable()).toBe(false);

      localStorage.setItem = originalSetItem;
      localStorage.getItem = originalGetItem;
      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('save', () => {
    it('saves data to localStorage successfully', () => {
      const result = save('test_key', { foo: 'bar' });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.fallback).toBe(false);

      const raw = localStorage.getItem('test_key');
      expect(raw).toBe(JSON.stringify({ foo: 'bar' }));
    });

    it('saves string data correctly', () => {
      const result = save('test_string', 'hello world');

      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_string'))).toBe('hello world');
    });

    it('saves array data correctly', () => {
      const data = [1, 2, 3, 'four'];
      const result = save('test_array', data);

      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_array'))).toEqual(data);
    });

    it('saves null data correctly', () => {
      const result = save('test_null', null);

      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_null'))).toBeNull();
    });

    it('saves numeric data correctly', () => {
      const result = save('test_number', 42);

      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_number'))).toBe(42);
    });

    it('saves boolean data correctly', () => {
      const result = save('test_bool', true);

      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_bool'))).toBe(true);
    });

    it('returns error when key is empty string', () => {
      const result = save('', { foo: 'bar' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('returns error when key is null', () => {
      const result = save(null, { foo: 'bar' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('returns error when key is undefined', () => {
      const result = save(undefined, { foo: 'bar' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('returns error when key is a number', () => {
      const result = save(123, { foo: 'bar' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('handles circular reference serialization error', () => {
      const circular = {};
      circular.self = circular;

      const result = save('test_circular', circular);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Serialization error');
    });

    it('falls back to sessionStorage when localStorage throws quota exceeded', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = (key) => {
        if (key === '__prism_storage_test__') {
          return;
        }
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      };

      const result = save('test_quota', { data: 'large' });

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);

      const raw = sessionStorage.getItem('test_quota');
      expect(raw).toBe(JSON.stringify({ data: 'large' }));

      localStorage.setItem = originalSetItem;
    });

    it('overwrites existing data with same key', () => {
      save('test_overwrite', { version: 1 });
      save('test_overwrite', { version: 2 });

      const raw = localStorage.getItem('test_overwrite');
      expect(JSON.parse(raw)).toEqual({ version: 2 });
    });
  });

  describe('load', () => {
    it('loads data from localStorage successfully', () => {
      localStorage.setItem('test_load', JSON.stringify({ foo: 'bar' }));

      const result = load('test_load');

      expect(result.data).toEqual({ foo: 'bar' });
      expect(result.error).toBeNull();
    });

    it('returns null data when key does not exist', () => {
      const result = load('nonexistent_key');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('returns error when key is empty string', () => {
      const result = load('');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('returns error when key is null', () => {
      const result = load(null);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('returns error when key is undefined', () => {
      const result = load(undefined);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('returns error when key is a number', () => {
      const result = load(42);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('handles corrupted JSON data gracefully', () => {
      localStorage.setItem('test_corrupted', '{invalid json!!!');

      const result = load('test_corrupted');

      expect(result.data).toBeNull();
      expect(result.error).toContain('Corrupted data removed');

      // Corrupted data should be removed
      expect(localStorage.getItem('test_corrupted')).toBeNull();
    });

    it('loads string data correctly', () => {
      localStorage.setItem('test_string', JSON.stringify('hello'));

      const result = load('test_string');

      expect(result.data).toBe('hello');
      expect(result.error).toBeNull();
    });

    it('loads array data correctly', () => {
      const data = [1, 2, 3];
      localStorage.setItem('test_array', JSON.stringify(data));

      const result = load('test_array');

      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
    });

    it('loads numeric data correctly', () => {
      localStorage.setItem('test_number', JSON.stringify(99));

      const result = load('test_number');

      expect(result.data).toBe(99);
      expect(result.error).toBeNull();
    });

    it('loads boolean data correctly', () => {
      localStorage.setItem('test_bool', JSON.stringify(false));

      const result = load('test_bool');

      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });

    it('loads null data correctly', () => {
      localStorage.setItem('test_null', JSON.stringify(null));

      const result = load('test_null');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('loads nested object data correctly', () => {
      const data = { a: { b: { c: 'deep' } }, arr: [1, { x: true }] };
      localStorage.setItem('test_nested', JSON.stringify(data));

      const result = load('test_nested');

      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
    });
  });

  describe('save and load round-trip', () => {
    it('round-trips object data correctly', () => {
      const data = { name: 'test', count: 42, active: true, items: ['a', 'b'] };

      save('round_trip', data);
      const result = load('round_trip');

      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
    });

    it('round-trips empty object correctly', () => {
      save('empty_obj', {});
      const result = load('empty_obj');

      expect(result.data).toEqual({});
    });

    it('round-trips empty array correctly', () => {
      save('empty_arr', []);
      const result = load('empty_arr');

      expect(result.data).toEqual([]);
    });
  });

  describe('remove', () => {
    it('removes an existing key from localStorage', () => {
      localStorage.setItem('test_remove', JSON.stringify('value'));

      const result = remove('test_remove');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(localStorage.getItem('test_remove')).toBeNull();
    });

    it('succeeds even when key does not exist', () => {
      const result = remove('nonexistent_key');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('removes key from both localStorage and sessionStorage', () => {
      localStorage.setItem('test_both', JSON.stringify('local'));
      sessionStorage.setItem('test_both', JSON.stringify('session'));

      const result = remove('test_both');

      expect(result.success).toBe(true);
      expect(localStorage.getItem('test_both')).toBeNull();
      expect(sessionStorage.getItem('test_both')).toBeNull();
    });

    it('returns error when key is empty string', () => {
      const result = remove('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('returns error when key is null', () => {
      const result = remove(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage key must be a non-empty string');
    });

    it('returns error when key is undefined', () => {
      const result = remove(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage key must be a non-empty string');
    });
  });

  describe('reset', () => {
    it('clears all known storage keys', () => {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.setItem(key, JSON.stringify('data'));
      });

      const result = reset();

      expect(result.success).toBe(true);

      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(localStorage.getItem(key)).toBeNull();
      });
    });

    it('clears keys from both localStorage and sessionStorage', () => {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.setItem(key, JSON.stringify('local'));
        sessionStorage.setItem(key, JSON.stringify('session'));
      });

      const result = reset();

      expect(result.success).toBe(true);

      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(localStorage.getItem(key)).toBeNull();
        expect(sessionStorage.getItem(key)).toBeNull();
      });
    });

    it('returns keysCleared array with cleared keys', () => {
      localStorage.setItem(STORAGE_KEYS.CATALOG_KEY, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.VARIANTS_KEY, JSON.stringify([]));

      const result = reset();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.keysCleared)).toBe(true);
      expect(result.keysCleared.length).toBeGreaterThan(0);
    });

    it('succeeds even when storage is already empty', () => {
      const result = reset();

      expect(result.success).toBe(true);
    });

    it('clears prism-namespaced keys not in STORAGE_KEYS', () => {
      localStorage.setItem('prism_custom_key', JSON.stringify('custom'));

      const result = reset();

      expect(result.success).toBe(true);
      expect(localStorage.getItem('prism_custom_key')).toBeNull();
    });

    it('does not clear non-prism keys', () => {
      localStorage.setItem('other_app_key', JSON.stringify('other'));

      reset();

      expect(localStorage.getItem('other_app_key')).toBe(JSON.stringify('other'));
    });
  });

  describe('getIsFallbackMode', () => {
    it('returns false when localStorage is available', () => {
      const result = getIsFallbackMode();

      expect(result).toBe(false);
    });

    it('returns true when localStorage is unavailable', () => {
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;
      const originalRemoveItem = localStorage.removeItem;

      localStorage.setItem = () => {
        throw new Error('SecurityError');
      };
      localStorage.getItem = () => {
        throw new Error('SecurityError');
      };
      localStorage.removeItem = () => {
        throw new Error('SecurityError');
      };

      const result = getIsFallbackMode();

      expect(result).toBe(true);

      localStorage.setItem = originalSetItem;
      localStorage.getItem = originalGetItem;
      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('saveSync', () => {
    it('returns true on successful save', () => {
      const result = saveSync('sync_key', { data: 'value' });

      expect(result).toBe(true);
    });

    it('returns false on invalid key', () => {
      const result = saveSync('', { data: 'value' });

      expect(result).toBe(false);
    });

    it('returns false on serialization error', () => {
      const circular = {};
      circular.self = circular;

      const result = saveSync('sync_circular', circular);

      expect(result).toBe(false);
    });
  });

  describe('loadSync', () => {
    it('returns data on successful load', () => {
      localStorage.setItem('sync_load', JSON.stringify({ data: 'value' }));

      const result = loadSync('sync_load');

      expect(result).toEqual({ data: 'value' });
    });

    it('returns null when key does not exist', () => {
      const result = loadSync('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on invalid key', () => {
      const result = loadSync('');

      expect(result).toBeNull();
    });

    it('returns null on corrupted data', () => {
      localStorage.setItem('sync_corrupted', 'not valid json{{{');

      const result = loadSync('sync_corrupted');

      expect(result).toBeNull();
    });
  });

  describe('sessionStorage fallback behavior', () => {
    it('uses sessionStorage when localStorage is unavailable for save', () => {
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;
      const originalRemoveItem = localStorage.removeItem;

      localStorage.setItem = (key) => {
        if (key === '__prism_storage_test__') {
          throw new Error('SecurityError');
        }
      };
      localStorage.getItem = () => {
        throw new Error('SecurityError');
      };
      localStorage.removeItem = () => {
        throw new Error('SecurityError');
      };

      const result = save('fallback_test', { fallback: true });

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);

      const raw = sessionStorage.getItem('fallback_test');
      expect(JSON.parse(raw)).toEqual({ fallback: true });

      localStorage.setItem = originalSetItem;
      localStorage.getItem = originalGetItem;
      localStorage.removeItem = originalRemoveItem;
    });

    it('uses sessionStorage when localStorage is unavailable for load', () => {
      sessionStorage.setItem('fallback_load', JSON.stringify({ from: 'session' }));

      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;
      const originalRemoveItem = localStorage.removeItem;

      localStorage.setItem = () => {
        throw new Error('SecurityError');
      };
      localStorage.getItem = () => {
        throw new Error('SecurityError');
      };
      localStorage.removeItem = () => {
        throw new Error('SecurityError');
      };

      const result = load('fallback_load');

      expect(result.data).toEqual({ from: 'session' });
      expect(result.fallback).toBe(true);

      localStorage.setItem = originalSetItem;
      localStorage.getItem = originalGetItem;
      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('quota exceeded handling', () => {
    it('falls back to sessionStorage on quota exceeded with code 22', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = (key) => {
        if (key === '__prism_storage_test__') {
          return;
        }
        const err = new Error('Quota exceeded');
        err.code = 22;
        throw err;
      };

      const result = save('quota_code_22', { data: 'test' });

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);

      localStorage.setItem = originalSetItem;
    });

    it('falls back to sessionStorage on quota exceeded with code 1014', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = (key) => {
        if (key === '__prism_storage_test__') {
          return;
        }
        const err = new Error('Quota exceeded');
        err.code = 1014;
        throw err;
      };

      const result = save('quota_code_1014', { data: 'test' });

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);

      localStorage.setItem = originalSetItem;
    });
  });

  describe('STORAGE_KEYS integration', () => {
    it('saves and loads catalog data using STORAGE_KEYS.CATALOG_KEY', () => {
      const catalogData = [{ id: 'prod-1', sku: 'SKU-001', title: 'Test Product' }];

      save(STORAGE_KEYS.CATALOG_KEY, catalogData);
      const result = load(STORAGE_KEYS.CATALOG_KEY);

      expect(result.data).toEqual(catalogData);
      expect(result.error).toBeNull();
    });

    it('saves and loads variants data using STORAGE_KEYS.VARIANTS_KEY', () => {
      const variantsData = [{ id: 'var-1', name: 'Test Variant' }];

      save(STORAGE_KEYS.VARIANTS_KEY, variantsData);
      const result = load(STORAGE_KEYS.VARIANTS_KEY);

      expect(result.data).toEqual(variantsData);
      expect(result.error).toBeNull();
    });

    it('saves and loads cohort set data using STORAGE_KEYS.COHORT_SET_KEY', () => {
      const cohortData = { id: 'cs-1', name: 'Test Set', cohorts: [] };

      save(STORAGE_KEYS.COHORT_SET_KEY, cohortData);
      const result = load(STORAGE_KEYS.COHORT_SET_KEY);

      expect(result.data).toEqual(cohortData);
      expect(result.error).toBeNull();
    });

    it('saves and loads manifests data using STORAGE_KEYS.MANIFESTS_KEY', () => {
      const manifestsData = [{ id: 'man-1', name: 'Test Manifest' }];

      save(STORAGE_KEYS.MANIFESTS_KEY, manifestsData);
      const result = load(STORAGE_KEYS.MANIFESTS_KEY);

      expect(result.data).toEqual(manifestsData);
      expect(result.error).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles saving empty string value', () => {
      const result = save('empty_string_val', '');

      expect(result.success).toBe(true);

      const loaded = load('empty_string_val');
      expect(loaded.data).toBe('');
    });

    it('handles saving zero value', () => {
      const result = save('zero_val', 0);

      expect(result.success).toBe(true);

      const loaded = load('zero_val');
      expect(loaded.data).toBe(0);
    });

    it('handles saving false value', () => {
      const result = save('false_val', false);

      expect(result.success).toBe(true);

      const loaded = load('false_val');
      expect(loaded.data).toBe(false);
    });

    it('handles saving deeply nested object', () => {
      const deep = { a: { b: { c: { d: { e: { f: 'deep' } } } } } };

      save('deep_obj', deep);
      const result = load('deep_obj');

      expect(result.data).toEqual(deep);
    });

    it('handles saving large array', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ index: i, value: `item-${i}` }));

      save('large_array', largeArray);
      const result = load('large_array');

      expect(result.data).toHaveLength(1000);
      expect(result.data[0]).toEqual({ index: 0, value: 'item-0' });
      expect(result.data[999]).toEqual({ index: 999, value: 'item-999' });
    });

    it('handles saving object with special characters in values', () => {
      const data = { message: 'Hello "world" & <friends>' };

      save('special_chars', data);
      const result = load('special_chars');

      expect(result.data).toEqual(data);
    });

    it('handles saving object with unicode characters', () => {
      const data = { emoji: '🎉🚀', japanese: 'こんにちは' };

      save('unicode', data);
      const result = load('unicode');

      expect(result.data).toEqual(data);
    });
  });
});