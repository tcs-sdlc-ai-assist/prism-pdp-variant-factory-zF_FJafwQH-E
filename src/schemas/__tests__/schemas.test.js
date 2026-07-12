import { describe, it, expect } from 'vitest';
import {
  validateCatalogItem,
  validateCohortTarget,
  validateCohortSet,
  validateVariant,
  validateManifest,
} from '@/schemas/schemas.js';
import { TAILORING_DIMENSIONS } from '@/constants/constants.js';
import mockCatalog from '@/data/mockCatalog.js';
import defaultCohorts from '@/data/defaultCohorts.js';

describe('schemas', () => {
  describe('validateCatalogItem', () => {
    it('validates a valid catalog item from mock data', () => {
      const result = validateCatalogItem(mockCatalog[0]);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates all mock catalog items successfully', () => {
      mockCatalog.forEach((item) => {
        const result = validateCatalogItem(item);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('validates a minimal valid catalog item', () => {
      const item = {
        id: 'prod-test-001',
        sku: 'SKU-TEST-001',
        title: 'Test Product',
      };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates a catalog item with all optional fields', () => {
      const item = {
        id: 'prod-test-002',
        sku: 'SKU-TEST-002',
        title: 'Full Product',
        price: 199.99,
        category: 'Electronics',
        imageUrl: 'https://example.com/image.jpg',
        description: 'A full product description',
      };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when item is null', () => {
      const result = validateCatalogItem(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when item is undefined', () => {
      const result = validateCatalogItem(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when item is a string', () => {
      const result = validateCatalogItem('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when item is a number', () => {
      const result = validateCatalogItem(42);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when item is an array', () => {
      const result = validateCatalogItem([]);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when id is missing', () => {
      const item = { sku: 'SKU-001', title: 'Test' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item must have a non-empty string "id"');
    });

    it('returns invalid when id is empty string', () => {
      const item = { id: '', sku: 'SKU-001', title: 'Test' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item must have a non-empty string "id"');
    });

    it('returns invalid when id is a number', () => {
      const item = { id: 123, sku: 'SKU-001', title: 'Test' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item must have a non-empty string "id"');
    });

    it('returns invalid when title is missing', () => {
      const item = { id: 'prod-001', sku: 'SKU-001' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item must have a non-empty string "title"');
    });

    it('returns invalid when title is empty string', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: '' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item must have a non-empty string "title"');
    });

    it('returns invalid when sku is missing', () => {
      const item = { id: 'prod-001', title: 'Test' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item must have a non-empty string "sku"');
    });

    it('returns invalid when sku is empty string', () => {
      const item = { id: 'prod-001', sku: '', title: 'Test' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item must have a non-empty string "sku"');
    });

    it('returns invalid when price is negative', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', price: -10 };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item "price" must be a non-negative number when provided');
    });

    it('returns invalid when price is NaN', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', price: NaN };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item "price" must be a non-negative number when provided');
    });

    it('returns invalid when price is Infinity', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', price: Infinity };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item "price" must be a non-negative number when provided');
    });

    it('returns invalid when price is a string', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', price: '99.99' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item "price" must be a non-negative number when provided');
    });

    it('accepts price of zero', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', price: 0 };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when category is empty string', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', category: '' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item "category" must be a non-empty string when provided');
    });

    it('returns invalid when imageUrl is empty string', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', imageUrl: '' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item "imageUrl" must be a non-empty string when provided');
    });

    it('returns invalid when description is not a string', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', description: 123 };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Catalog item "description" must be a string when provided');
    });

    it('accepts empty string description', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test', description: '' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('collects multiple errors for multiple missing fields', () => {
      const item = {};

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors).toContain('Catalog item must have a non-empty string "id"');
      expect(result.errors).toContain('Catalog item must have a non-empty string "title"');
      expect(result.errors).toContain('Catalog item must have a non-empty string "sku"');
    });

    it('does not validate when price is undefined (optional field)', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(true);
    });

    it('does not validate when category is undefined (optional field)', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(true);
    });

    it('does not validate when imageUrl is undefined (optional field)', () => {
      const item = { id: 'prod-001', sku: 'SKU-001', title: 'Test' };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateCohortTarget', () => {
    it('validates a valid cohort target from default cohorts', () => {
      const target = defaultCohorts.cohorts[0];
      const result = validateCohortTarget(target);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates all default cohort targets successfully', () => {
      defaultCohorts.cohorts.forEach((target) => {
        const result = validateCohortTarget(target);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('validates a minimal valid cohort target', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when target is null', () => {
      const result = validateCohortTarget(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when target is undefined', () => {
      const result = validateCohortTarget(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when target is a string', () => {
      const result = validateCohortTarget('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when target is a number', () => {
      const result = validateCohortTarget(42);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when cohortId is missing', () => {
      const target = { label: 'Test Cohort' };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target must have a non-empty string "cohortId"');
    });

    it('returns invalid when cohortId is empty string', () => {
      const target = { cohortId: '', label: 'Test Cohort' };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target must have a non-empty string "cohortId"');
    });

    it('returns invalid when cohortId is a number', () => {
      const target = { cohortId: 123, label: 'Test Cohort' };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target must have a non-empty string "cohortId"');
    });

    it('returns invalid when label is missing', () => {
      const target = { cohortId: 'cohort-001' };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target must have a non-empty string "label"');
    });

    it('returns invalid when label is empty string', () => {
      const target = { cohortId: 'cohort-001', label: '' };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target must have a non-empty string "label"');
    });

    it('returns invalid when label is a number', () => {
      const target = { cohortId: 'cohort-001', label: 42 };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target must have a non-empty string "label"');
    });

    it('returns invalid when behavioralOverlays is not an array', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        behavioralOverlays: 'not-an-array',
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target "behavioralOverlays" must be an array when provided');
    });

    it('returns invalid when behavioralOverlays contains non-string elements', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        behavioralOverlays: ['valid', 123, ''],
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('behavioralOverlays[1]'))).toBe(true);
      expect(result.errors.some((e) => e.includes('behavioralOverlays[2]'))).toBe(true);
    });

    it('accepts valid behavioralOverlays array', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        behavioralOverlays: ['browse_history', 'price_sensitivity'],
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts empty behavioralOverlays array', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        behavioralOverlays: [],
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when priority is zero', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        priority: 0,
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target "priority" must be a positive number when provided');
    });

    it('returns invalid when priority is negative', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        priority: -1,
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target "priority" must be a positive number when provided');
    });

    it('returns invalid when priority is NaN', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        priority: NaN,
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target "priority" must be a positive number when provided');
    });

    it('returns invalid when priority is a string', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        priority: '1',
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort target "priority" must be a positive number when provided');
    });

    it('accepts valid positive priority', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
        priority: 5,
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('does not validate priority when undefined', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test Cohort',
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(true);
    });

    it('collects multiple errors for multiple missing fields', () => {
      const target = {};

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors).toContain('Cohort target must have a non-empty string "cohortId"');
      expect(result.errors).toContain('Cohort target must have a non-empty string "label"');
    });
  });

  describe('validateCohortSet', () => {
    it('validates the default cohort set successfully', () => {
      const result = validateCohortSet(defaultCohorts);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates a minimal valid cohort set', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [
          { cohortId: 'cohort-001', label: 'Test Cohort' },
        ],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates a cohort set with all optional fields', () => {
      const cohortSet = {
        id: 'cs-002',
        name: 'Full Set',
        description: 'A full cohort set',
        cohorts: [
          { cohortId: 'cohort-001', label: 'Test Cohort', priority: 1 },
        ],
        createdAt: '2024-06-10T12:00:00Z',
        updatedAt: '2024-06-10T12:00:00Z',
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when cohortSet is null', () => {
      const result = validateCohortSet(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when cohortSet is undefined', () => {
      const result = validateCohortSet(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when cohortSet is a string', () => {
      const result = validateCohortSet('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when id is missing', () => {
      const cohortSet = {
        name: 'Test Set',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set must have a non-empty string "id"');
    });

    it('returns invalid when id is empty string', () => {
      const cohortSet = {
        id: '',
        name: 'Test Set',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set must have a non-empty string "id"');
    });

    it('returns invalid when name is missing', () => {
      const cohortSet = {
        id: 'cs-001',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set must have a non-empty string "name"');
    });

    it('returns invalid when name is empty string', () => {
      const cohortSet = {
        id: 'cs-001',
        name: '',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set must have a non-empty string "name"');
    });

    it('returns invalid when cohorts is not an array', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: 'not an array',
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set must have an array "cohorts"');
    });

    it('returns invalid when cohorts is missing', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set must have an array "cohorts"');
    });

    it('returns invalid when cohorts is empty array', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set "cohorts" must contain at least one cohort target');
    });

    it('returns invalid when cohorts contain invalid targets', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [
          { cohortId: 'c-1', label: 'Valid' },
          { label: 'Missing cohortId' },
        ],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('cohorts[1]'))).toBe(true);
    });

    it('returns invalid when all cohorts are invalid', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [
          {},
          { label: 'No ID' },
        ],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('cohorts[0]'))).toBe(true);
      expect(result.errors.some((e) => e.includes('cohorts[1]'))).toBe(true);
    });

    it('returns invalid when description is not a string', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
        description: 123,
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set "description" must be a string when provided');
    });

    it('accepts empty string description', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
        description: '',
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when createdAt is empty string', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
        createdAt: '',
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set "createdAt" must be a non-empty string when provided');
    });

    it('returns invalid when updatedAt is empty string', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
        updatedAt: '',
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort set "updatedAt" must be a non-empty string when provided');
    });

    it('accepts valid createdAt and updatedAt timestamps', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [{ cohortId: 'c-1', label: 'Test' }],
        createdAt: '2024-06-10T12:00:00Z',
        updatedAt: '2024-06-10T12:00:00Z',
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(true);
    });

    it('collects multiple errors for multiple issues', () => {
      const cohortSet = {
        id: '',
        name: '',
        cohorts: [],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('validates cohort set with multiple valid cohorts', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Multi Cohort Set',
        cohorts: [
          { cohortId: 'c-1', label: 'Cohort 1', priority: 1 },
          { cohortId: 'c-2', label: 'Cohort 2', priority: 2 },
          { cohortId: 'c-3', label: 'Cohort 3', priority: 3 },
        ],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateVariant', () => {
    it('validates a valid variant object', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test Variant',
        productId: 'prod-001',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates a variant with all optional fields', () => {
      const variant = {
        id: 'variant-002',
        name: 'Full Variant',
        productId: 'prod-001',
        cohortId: 'cohort-001',
        tailoring: {
          price: { weight: 90, strategy: 'emphasize savings' },
        },
        weight: 75,
        isActive: true,
        description: 'A full variant description',
        createdAt: '2024-06-10T12:00:00Z',
        updatedAt: '2024-06-10T12:00:00Z',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when variant is null', () => {
      const result = validateVariant(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when variant is undefined', () => {
      const result = validateVariant(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when variant is a string', () => {
      const result = validateVariant('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when id is missing', () => {
      const variant = { name: 'Test', productId: 'prod-001' };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant must have a non-empty string "id"');
    });

    it('returns invalid when id is empty string', () => {
      const variant = { id: '', name: 'Test', productId: 'prod-001' };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant must have a non-empty string "id"');
    });

    it('returns invalid when name is missing', () => {
      const variant = { id: 'variant-001', productId: 'prod-001' };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant must have a non-empty string "name"');
    });

    it('returns invalid when name is empty string', () => {
      const variant = { id: 'variant-001', name: '', productId: 'prod-001' };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant must have a non-empty string "name"');
    });

    it('returns invalid when productId is missing', () => {
      const variant = { id: 'variant-001', name: 'Test' };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant must have a non-empty string "productId"');
    });

    it('returns invalid when productId is empty string', () => {
      const variant = { id: 'variant-001', name: 'Test', productId: '' };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant must have a non-empty string "productId"');
    });

    it('returns invalid when cohortId is empty string', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        cohortId: '',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "cohortId" must be a non-empty string when provided');
    });

    it('does not validate cohortId when undefined', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when tailoring is not an object', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        tailoring: 'not an object',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "tailoring" must be a non-null object when provided');
    });

    it('returns invalid when tailoring is an array', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        tailoring: ['not', 'an', 'object'],
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "tailoring" must be a non-null object when provided');
    });

    it('returns invalid when tailoring is null', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        tailoring: null,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "tailoring" must be a non-null object when provided');
    });

    it('returns invalid when tailoring contains unknown dimensions', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        tailoring: {
          unknownDimension: { weight: 50, strategy: 'test' },
        },
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('unknown dimension "unknownDimension"'))).toBe(true);
      expect(result.errors.some((e) => e.includes('Allowed:'))).toBe(true);
    });

    it('accepts tailoring with valid TAILORING_DIMENSIONS keys', () => {
      const tailoring = {};
      TAILORING_DIMENSIONS.forEach((dim) => {
        tailoring[dim] = { weight: 50, strategy: 'test' };
      });

      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        tailoring,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts empty tailoring object', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        tailoring: {},
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when weight is negative', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        weight: -1,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "weight" must be a number between 0 and 100 when provided');
    });

    it('returns invalid when weight is greater than 100', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        weight: 101,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "weight" must be a number between 0 and 100 when provided');
    });

    it('returns invalid when weight is NaN', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        weight: NaN,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "weight" must be a number between 0 and 100 when provided');
    });

    it('returns invalid when weight is Infinity', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        weight: Infinity,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "weight" must be a number between 0 and 100 when provided');
    });

    it('returns invalid when weight is a string', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        weight: '50',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "weight" must be a number between 0 and 100 when provided');
    });

    it('accepts weight of 0', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        weight: 0,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
    });

    it('accepts weight of 100', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        weight: 100,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
    });

    it('accepts weight of 50', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        weight: 50,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when isActive is not a boolean', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        isActive: 'true',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "isActive" must be a boolean when provided');
    });

    it('returns invalid when isActive is a number', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        isActive: 1,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "isActive" must be a boolean when provided');
    });

    it('accepts isActive true', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        isActive: true,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
    });

    it('accepts isActive false', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        isActive: false,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when description is not a string', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        description: 123,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "description" must be a string when provided');
    });

    it('accepts empty string description', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        description: '',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when createdAt is empty string', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        createdAt: '',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "createdAt" must be a non-empty string when provided');
    });

    it('returns invalid when updatedAt is empty string', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        updatedAt: '',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Variant "updatedAt" must be a non-empty string when provided');
    });

    it('accepts valid createdAt and updatedAt timestamps', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        createdAt: '2024-06-10T12:00:00Z',
        updatedAt: '2024-06-10T12:00:00Z',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
    });

    it('collects multiple errors for multiple missing required fields', () => {
      const variant = {};

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors).toContain('Variant must have a non-empty string "id"');
      expect(result.errors).toContain('Variant must have a non-empty string "name"');
      expect(result.errors).toContain('Variant must have a non-empty string "productId"');
    });

    it('collects errors from both required and optional field validations', () => {
      const variant = {
        id: '',
        name: '',
        productId: '',
        weight: -5,
        isActive: 'yes',
        description: 42,
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('validateManifest', () => {
    it('validates a valid manifest object', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test Manifest',
        version: '1.0.0',
        variantIds: ['variant-001'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates a manifest with all optional fields', () => {
      const manifest = {
        id: 'manifest-002',
        name: 'Full Manifest',
        version: '1.0.0',
        variantIds: ['variant-001', 'variant-002'],
        cohortSetId: 'cs-001',
        status: 'draft',
        description: 'A full manifest description',
        createdAt: '2024-06-10T12:00:00Z',
        updatedAt: '2024-06-10T12:00:00Z',
        publishedAt: '2024-06-11T12:00:00Z',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when manifest is null', () => {
      const result = validateManifest(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when manifest is undefined', () => {
      const result = validateManifest(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when manifest is a string', () => {
      const result = validateManifest('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when manifest is a number', () => {
      const result = validateManifest(42);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when id is missing', () => {
      const manifest = {
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must have a non-empty string "id"');
    });

    it('returns invalid when id is empty string', () => {
      const manifest = {
        id: '',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must have a non-empty string "id"');
    });

    it('returns invalid when name is missing', () => {
      const manifest = {
        id: 'manifest-001',
        version: '1.0.0',
        variantIds: ['v-1'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must have a non-empty string "name"');
    });

    it('returns invalid when name is empty string', () => {
      const manifest = {
        id: 'manifest-001',
        name: '',
        version: '1.0.0',
        variantIds: ['v-1'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must have a non-empty string "name"');
    });

    it('returns invalid when version is missing', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        variantIds: ['v-1'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must have a non-empty string "version"');
    });

    it('returns invalid when version is empty string', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '',
        variantIds: ['v-1'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must have a non-empty string "version"');
    });

    it('returns invalid when variantIds is missing', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must have an array "variantIds"');
    });

    it('returns invalid when variantIds is not an array', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: 'not-an-array',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must have an array "variantIds"');
    });

    it('returns invalid when variantIds is empty array', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: [],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest "variantIds" must contain at least one variant ID');
    });

    it('returns invalid when variantIds contains non-string elements', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['valid-id', 123, ''],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('variantIds[1]'))).toBe(true);
      expect(result.errors.some((e) => e.includes('variantIds[2]'))).toBe(true);
    });

    it('returns invalid when variantIds contains empty strings', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['', ''],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('variantIds[0]'))).toBe(true);
      expect(result.errors.some((e) => e.includes('variantIds[1]'))).toBe(true);
    });

    it('accepts variantIds with multiple valid entries', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['variant-001', 'variant-002', 'variant-003'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when cohortSetId is empty string', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        cohortSetId: '',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest "cohortSetId" must be a non-empty string when provided');
    });

    it('does not validate cohortSetId when undefined', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
    });

    it('accepts valid cohortSetId', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        cohortSetId: 'cs-001',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when status is not a valid value', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        status: 'invalid-status',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('status'))).toBe(true);
      expect(result.errors.some((e) => e.includes('draft'))).toBe(true);
      expect(result.errors.some((e) => e.includes('published'))).toBe(true);
      expect(result.errors.some((e) => e.includes('archived'))).toBe(true);
    });

    it('accepts status "draft"', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        status: 'draft',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
    });

    it('accepts status "published"', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        status: 'published',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
    });

    it('accepts status "archived"', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        status: 'archived',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
    });

    it('does not validate status when undefined', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when description is not a string', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        description: 123,
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest "description" must be a string when provided');
    });

    it('accepts empty string description', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        description: '',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when createdAt is empty string', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        createdAt: '',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest "createdAt" must be a non-empty string when provided');
    });

    it('returns invalid when updatedAt is empty string', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        updatedAt: '',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest "updatedAt" must be a non-empty string when provided');
    });

    it('returns invalid when publishedAt is empty string', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        publishedAt: '',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest "publishedAt" must be a non-empty string when provided');
    });

    it('accepts valid timestamp fields', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        createdAt: '2024-06-10T12:00:00Z',
        updatedAt: '2024-06-10T12:00:00Z',
        publishedAt: '2024-06-11T12:00:00Z',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
    });

    it('collects multiple errors for multiple missing required fields', () => {
      const manifest = {};

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.errors).toContain('Manifest must have a non-empty string "id"');
      expect(result.errors).toContain('Manifest must have a non-empty string "name"');
      expect(result.errors).toContain('Manifest must have a non-empty string "version"');
      expect(result.errors).toContain('Manifest must have an array "variantIds"');
    });

    it('collects errors from both required and optional field validations', () => {
      const manifest = {
        id: '',
        name: '',
        version: '',
        variantIds: [],
        status: 'invalid',
        description: 42,
        createdAt: '',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('return value structure', () => {
    it('all validators return { valid: boolean, errors: string[] }', () => {
      const catalogResult = validateCatalogItem(mockCatalog[0]);
      expect(typeof catalogResult.valid).toBe('boolean');
      expect(Array.isArray(catalogResult.errors)).toBe(true);

      const cohortTargetResult = validateCohortTarget(defaultCohorts.cohorts[0]);
      expect(typeof cohortTargetResult.valid).toBe('boolean');
      expect(Array.isArray(cohortTargetResult.errors)).toBe(true);

      const cohortSetResult = validateCohortSet(defaultCohorts);
      expect(typeof cohortSetResult.valid).toBe('boolean');
      expect(Array.isArray(cohortSetResult.errors)).toBe(true);

      const variantResult = validateVariant({ id: 'v-1', name: 'Test', productId: 'p-1' });
      expect(typeof variantResult.valid).toBe('boolean');
      expect(Array.isArray(variantResult.errors)).toBe(true);

      const manifestResult = validateManifest({ id: 'm-1', name: 'Test', version: '1.0.0', variantIds: ['v-1'] });
      expect(typeof manifestResult.valid).toBe('boolean');
      expect(Array.isArray(manifestResult.errors)).toBe(true);
    });

    it('valid results always have empty errors array', () => {
      const catalogResult = validateCatalogItem(mockCatalog[0]);
      expect(catalogResult.valid).toBe(true);
      expect(catalogResult.errors).toEqual([]);

      const cohortTargetResult = validateCohortTarget(defaultCohorts.cohorts[0]);
      expect(cohortTargetResult.valid).toBe(true);
      expect(cohortTargetResult.errors).toEqual([]);

      const cohortSetResult = validateCohortSet(defaultCohorts);
      expect(cohortSetResult.valid).toBe(true);
      expect(cohortSetResult.errors).toEqual([]);

      const variantResult = validateVariant({ id: 'v-1', name: 'Test', productId: 'p-1' });
      expect(variantResult.valid).toBe(true);
      expect(variantResult.errors).toEqual([]);

      const manifestResult = validateManifest({ id: 'm-1', name: 'Test', version: '1.0.0', variantIds: ['v-1'] });
      expect(manifestResult.valid).toBe(true);
      expect(manifestResult.errors).toEqual([]);
    });

    it('invalid results always have non-empty errors array', () => {
      const catalogResult = validateCatalogItem(null);
      expect(catalogResult.valid).toBe(false);
      expect(catalogResult.errors.length).toBeGreaterThan(0);

      const cohortTargetResult = validateCohortTarget(null);
      expect(cohortTargetResult.valid).toBe(false);
      expect(cohortTargetResult.errors.length).toBeGreaterThan(0);

      const cohortSetResult = validateCohortSet(null);
      expect(cohortSetResult.valid).toBe(false);
      expect(cohortSetResult.errors.length).toBeGreaterThan(0);

      const variantResult = validateVariant(null);
      expect(variantResult.valid).toBe(false);
      expect(variantResult.errors.length).toBeGreaterThan(0);

      const manifestResult = validateManifest(null);
      expect(manifestResult.valid).toBe(false);
      expect(manifestResult.errors.length).toBeGreaterThan(0);
    });

    it('error messages are all strings', () => {
      const result = validateCatalogItem({});

      result.errors.forEach((error) => {
        expect(typeof error).toBe('string');
        expect(error.length).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases', () => {
    it('validateCatalogItem handles item with extra unknown fields', () => {
      const item = {
        id: 'prod-001',
        sku: 'SKU-001',
        title: 'Test',
        unknownField: 'extra data',
        anotherField: 42,
      };

      const result = validateCatalogItem(item);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validateCohortTarget handles target with extra unknown fields', () => {
      const target = {
        cohortId: 'cohort-001',
        label: 'Test',
        extraField: 'extra',
      };

      const result = validateCohortTarget(target);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validateVariant handles variant with extra unknown fields', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        extraField: 'extra',
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validateManifest handles manifest with extra unknown fields', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['v-1'],
        extraField: 'extra',
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validateCatalogItem handles whitespace-only id', () => {
      const item = { id: '   ', sku: 'SKU-001', title: 'Test' };

      const result = validateCatalogItem(item);

      // Whitespace-only strings pass the typeof check but are non-empty
      // The schema checks for non-empty string, whitespace-only passes length > 0
      expect(result.valid).toBe(true);
    });

    it('validateCohortSet validates nested cohort targets', () => {
      const cohortSet = {
        id: 'cs-001',
        name: 'Test Set',
        cohorts: [
          { cohortId: 'c-1', label: 'Valid' },
          { cohortId: '', label: 'Invalid cohortId' },
          { cohortId: 'c-3' },
        ],
      };

      const result = validateCohortSet(cohortSet);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('cohorts[1]'))).toBe(true);
      expect(result.errors.some((e) => e.includes('cohorts[2]'))).toBe(true);
    });

    it('validateVariant handles tailoring with mixed valid and invalid dimensions', () => {
      const variant = {
        id: 'variant-001',
        name: 'Test',
        productId: 'prod-001',
        tailoring: {
          price: { weight: 90, strategy: 'test' },
          invalidDimension: { weight: 50, strategy: 'test' },
          badge: { weight: 70, strategy: 'test' },
        },
      };

      const result = validateVariant(variant);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalidDimension'))).toBe(true);
      // Valid dimensions should not produce errors
      expect(result.errors.some((e) => e.includes('"price"'))).toBe(false);
      expect(result.errors.some((e) => e.includes('"badge"'))).toBe(false);
    });

    it('validateManifest handles variantIds with null elements', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['valid-id', null],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('variantIds[1]'))).toBe(true);
    });

    it('validateManifest handles variantIds with undefined elements', () => {
      const manifest = {
        id: 'manifest-001',
        name: 'Test',
        version: '1.0.0',
        variantIds: ['valid-id', undefined],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('variantIds[1]'))).toBe(true);
    });

    it('all validators are pure functions — do not mutate inputs', () => {
      const catalogItem = { ...mockCatalog[0] };
      const originalCatalogItem = JSON.parse(JSON.stringify(catalogItem));
      validateCatalogItem(catalogItem);
      expect(catalogItem).toEqual(originalCatalogItem);

      const cohortTarget = { ...defaultCohorts.cohorts[0] };
      const originalCohortTarget = JSON.parse(JSON.stringify(cohortTarget));
      validateCohortTarget(cohortTarget);
      expect(cohortTarget).toEqual(originalCohortTarget);

      const cohortSet = JSON.parse(JSON.stringify(defaultCohorts));
      const originalCohortSet = JSON.parse(JSON.stringify(cohortSet));
      validateCohortSet(cohortSet);
      expect(cohortSet).toEqual(originalCohortSet);

      const variant = { id: 'v-1', name: 'Test', productId: 'p-1', tailoring: { price: { weight: 50 } } };
      const originalVariant = JSON.parse(JSON.stringify(variant));
      validateVariant(variant);
      expect(variant).toEqual(originalVariant);

      const manifest = { id: 'm-1', name: 'Test', version: '1.0.0', variantIds: ['v-1'] };
      const originalManifest = JSON.parse(JSON.stringify(manifest));
      validateManifest(manifest);
      expect(manifest).toEqual(originalManifest);
    });

    it('all validators produce deterministic output', () => {
      const item = mockCatalog[0];
      const result1 = validateCatalogItem(item);
      const result2 = validateCatalogItem(item);
      expect(result1).toEqual(result2);

      const target = defaultCohorts.cohorts[0];
      const result3 = validateCohortTarget(target);
      const result4 = validateCohortTarget(target);
      expect(result3).toEqual(result4);

      const result5 = validateCohortSet(defaultCohorts);
      const result6 = validateCohortSet(defaultCohorts);
      expect(result5).toEqual(result6);

      const variant = { id: 'v-1', name: 'Test', productId: 'p-1' };
      const result7 = validateVariant(variant);
      const result8 = validateVariant(variant);
      expect(result7).toEqual(result8);

      const manifest = { id: 'm-1', name: 'Test', version: '1.0.0', variantIds: ['v-1'] };
      const result9 = validateManifest(manifest);
      const result10 = validateManifest(manifest);
      expect(result9).toEqual(result10);
    });
  });
});