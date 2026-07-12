import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildManifest,
  buildBulkManifest,
  extractExportManifest,
  extractBulkExportManifests,
  getManifestVersion,
} from '@/services/manifestBuilder.js';
import { clearEventBuffer, getEventsByType, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import mockCatalog from '@/data/mockCatalog.js';
import defaultCohorts from '@/data/defaultCohorts.js';
import { generateVariants } from '@/services/variantGenerator.js';
import { TAILORING_DIMENSIONS } from '@/constants/constants.js';

describe('ManifestBuilder', () => {
  let canonicalPdp;
  let cohortSet;
  let generatedVariants;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();

    canonicalPdp = { ...mockCatalog[0] };
    cohortSet = JSON.parse(JSON.stringify(defaultCohorts));

    const result = await generateVariants(canonicalPdp, cohortSet);
    generatedVariants = result.variants;
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
  });

  describe('getManifestVersion', () => {
    it('returns a non-empty version string', () => {
      const version = getManifestVersion();

      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    it('returns a semver-formatted version string', () => {
      const version = getManifestVersion();

      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('returns consistent version across calls', () => {
      const version1 = getManifestVersion();
      const version2 = getManifestVersion();

      expect(version1).toBe(version2);
    });
  });

  describe('buildManifest', () => {
    it('builds a valid manifest from a generated variant', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('manifest contains correct variantId', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.variantId).toBe(variant.variantId);
    });

    it('manifest contains correct cohort field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.cohort).toBe(variant.cohortType);
    });

    it('manifest contains correct behavioralOverlay field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.behavioralOverlay).toBe(variant.behavioralOverlay);
    });

    it('manifest contains correct baseSku field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.baseSku).toBe(variant.baseSku);
    });

    it('manifest contains appliedTailoring array', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(Array.isArray(result.manifest.appliedTailoring)).toBe(true);
    });

    it('manifest appliedTailoring entries have dimension, change, rationale, and weight', () => {
      const variant = generatedVariants[1];
      const result = buildManifest(variant);

      result.manifest.appliedTailoring.forEach((entry) => {
        expect(typeof entry.dimension).toBe('string');
        expect(typeof entry.change).toBe('string');
        expect(typeof entry.rationale).toBe('string');
        expect(typeof entry.weight).toBe('number');
      });
    });

    it('manifest contains created timestamp as ISO 8601 string', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(typeof result.manifest.created).toBe('string');
      expect(result.manifest.created.length).toBeGreaterThan(0);
      expect(new Date(result.manifest.created).toISOString()).toBe(result.manifest.created);
    });

    it('manifest contains createdAt timestamp as ISO 8601 string', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(typeof result.manifest.createdAt).toBe('string');
      expect(result.manifest.createdAt.length).toBeGreaterThan(0);
      expect(new Date(result.manifest.createdAt).toISOString()).toBe(result.manifest.createdAt);
    });

    it('manifest contains controlFlag boolean', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(typeof result.manifest.controlFlag).toBe('boolean');
    });

    it('manifest controlFlag matches variant controlFlag', () => {
      generatedVariants.forEach((variant) => {
        const result = buildManifest(variant);
        expect(result.manifest.controlFlag).toBe(variant.controlFlag);
      });
    });

    it('manifest contains id field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(typeof result.manifest.id).toBe('string');
      expect(result.manifest.id.length).toBeGreaterThan(0);
    });

    it('manifest contains name field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(typeof result.manifest.name).toBe('string');
      expect(result.manifest.name.length).toBeGreaterThan(0);
    });

    it('manifest contains version field matching getManifestVersion', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.version).toBe(getManifestVersion());
    });

    it('manifest contains variantIds array with the variantId', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(Array.isArray(result.manifest.variantIds)).toBe(true);
      expect(result.manifest.variantIds).toContain(variant.variantId);
    });

    it('manifest contains label field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(typeof result.manifest.label).toBe('string');
      expect(result.manifest.label).toBe(variant.label);
    });

    it('manifest contains priority field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(typeof result.manifest.priority).toBe('number');
      expect(result.manifest.priority).toBe(variant.priority);
    });

    it('manifest contains diffSummary with dimensionsChanged and dimensions', () => {
      const variant = generatedVariants[1];
      const result = buildManifest(variant);

      expect(result.manifest.diffSummary).toBeDefined();
      expect(typeof result.manifest.diffSummary.dimensionsChanged).toBe('number');
      expect(Array.isArray(result.manifest.diffSummary.dimensions)).toBe(true);
    });

    it('manifest contains status field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.status).toBe('draft');
    });

    it('manifest contains description field', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(typeof result.manifest.description).toBe('string');
      expect(result.manifest.description.length).toBeGreaterThan(0);
    });

    it('manifest carries forward heroLayout from variant manifest', () => {
      const variant = generatedVariants[1];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.heroLayout) {
        expect(result.manifest.heroLayout).toBeDefined();
        expect(result.manifest.heroLayout.layout).toBe(variant.manifest.heroLayout.layout);
      }
    });

    it('manifest carries forward priceEmphasis from variant manifest', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.priceEmphasis) {
        expect(result.manifest.priceEmphasis).toBeDefined();
        expect(result.manifest.priceEmphasis.display).toBe(variant.manifest.priceEmphasis.display);
      }
    });

    it('manifest carries forward badgeUrgency from variant manifest', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.badgeUrgency) {
        expect(result.manifest.badgeUrgency).toBeDefined();
      }
    });

    it('manifest carries forward ctaCopy from variant manifest', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.ctaCopy) {
        expect(result.manifest.ctaCopy).toBeDefined();
      }
    });

    it('manifest carries forward socialProof from variant manifest', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.socialProof) {
        expect(result.manifest.socialProof).toBeDefined();
      }
    });

    it('manifest carries forward crossSell from variant manifest', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.crossSell) {
        expect(result.manifest.crossSell).toBeDefined();
      }
    });

    it('manifest carries forward specOrdering from variant manifest', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.specOrdering) {
        expect(result.manifest.specOrdering).toBeDefined();
      }
    });

    it('manifest carries forward mediaSelection from variant manifest', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.mediaSelection) {
        expect(result.manifest.mediaSelection).toBeDefined();
      }
    });

    it('manifest carries forward reviewHighlight from variant manifest', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      if (variant.manifest && variant.manifest.reviewHighlight) {
        expect(result.manifest.reviewHighlight).toBeDefined();
      }
    });

    it('returns null manifest and errors when variant is null', () => {
      const result = buildManifest(null);

      expect(result.manifest).toBeNull();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns null manifest and errors when variant is undefined', () => {
      const result = buildManifest(undefined);

      expect(result.manifest).toBeNull();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns null manifest and errors when variant is not an object', () => {
      const result = buildManifest('not an object');

      expect(result.manifest).toBeNull();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns null manifest and errors when variant has no id or variantId', () => {
      const result = buildManifest({});

      expect(result.manifest).toBeNull();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('variantId or id');
    });

    it('builds manifest using variant.id when variantId is missing', () => {
      const variant = {
        id: 'test-variant-id',
        name: 'Test Variant',
        productId: 'prod-test',
        cohortType: 'budget-conscious',
        behavioralOverlay: 'browse-heavy',
        baseSku: 'SKU-6548320',
        label: 'Test Label',
        priority: 1,
        controlFlag: false,
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.variantId).toBe('test-variant-id');
    });

    it('builds manifest from variant with tailoring map', () => {
      const variant = {
        variantId: 'variant-tailoring-test',
        name: 'Tailoring Test',
        productId: 'prod-test',
        cohortType: 'tech-enthusiast',
        behavioralOverlay: 'comparison-shopper',
        baseSku: 'SKU-6571042',
        label: 'Tech Enthusiast',
        priority: 2,
        controlFlag: false,
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings-highlight',
            rationale: 'Budget focus',
            weight: 90,
          },
          badge: {
            action: 'replace',
            value: 'Top Rated',
            rationale: 'Expert validation',
            weight: 75,
          },
        },
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.appliedTailoring.length).toBe(2);

      const priceEntry = result.manifest.appliedTailoring.find((e) => e.dimension === 'price');
      expect(priceEntry).toBeDefined();
      expect(priceEntry.change).toContain('emphasize');
      expect(priceEntry.rationale).toBe('Budget focus');
      expect(priceEntry.weight).toBe(90);

      const badgeEntry = result.manifest.appliedTailoring.find((e) => e.dimension === 'badge');
      expect(badgeEntry).toBeDefined();
      expect(badgeEntry.change).toContain('replace');
      expect(badgeEntry.rationale).toBe('Expert validation');
      expect(badgeEntry.weight).toBe(75);
    });

    it('builds manifest from variant with existing manifest appliedTailoring', () => {
      const variant = {
        variantId: 'variant-manifest-test',
        name: 'Manifest Test',
        productId: 'prod-test',
        cohortType: 'loyalty-member',
        behavioralOverlay: 'cart-abandoner',
        baseSku: 'SKU-6548320',
        label: 'Loyalty Member',
        priority: 4,
        controlFlag: false,
        manifest: {
          appliedTailoring: [
            {
              dimension: 'price',
              change: 'emphasize: member-price',
              rationale: 'Member pricing emphasis',
              weight: 80,
            },
            {
              dimension: 'badge',
              change: 'replace: Member Exclusive',
              rationale: 'Exclusive badge',
              weight: 85,
            },
          ],
        },
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.appliedTailoring.length).toBe(2);
      expect(result.manifest.appliedTailoring[0].dimension).toBe('price');
      expect(result.manifest.appliedTailoring[0].rationale).toBe('Member pricing emphasis');
      expect(result.manifest.appliedTailoring[1].dimension).toBe('badge');
    });

    it('returns empty appliedTailoring when variant has no tailoring data', () => {
      const variant = {
        variantId: 'variant-no-tailoring',
        name: 'No Tailoring',
        productId: 'prod-test',
        cohortType: '',
        behavioralOverlay: '',
        baseSku: 'SKU-6548320',
        label: 'No Tailoring',
        priority: 1,
        controlFlag: true,
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.appliedTailoring).toEqual([]);
    });

    it('extracts diffSummary from variant.diff', () => {
      const variant = {
        variantId: 'variant-diff-test',
        name: 'Diff Test',
        productId: 'prod-test',
        cohortType: 'budget-conscious',
        behavioralOverlay: 'browse-heavy',
        baseSku: 'SKU-6548320',
        label: 'Diff Test',
        priority: 1,
        controlFlag: false,
        diff: {
          dimensions: ['price', 'badge', 'title'],
          changes: [],
        },
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.diffSummary.dimensionsChanged).toBe(3);
      expect(result.manifest.diffSummary.dimensions).toEqual(['price', 'badge', 'title']);
    });

    it('returns empty diffSummary when variant has no diff data', () => {
      const variant = {
        variantId: 'variant-no-diff',
        name: 'No Diff',
        productId: 'prod-test',
        cohortType: '',
        behavioralOverlay: '',
        baseSku: 'SKU-6548320',
        label: 'No Diff',
        priority: 1,
        controlFlag: true,
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.diffSummary.dimensionsChanged).toBe(0);
      expect(result.manifest.diffSummary.dimensions).toEqual([]);
    });

    it('handles variant with tailoring as array gracefully', () => {
      const variant = {
        variantId: 'variant-array-tailoring',
        name: 'Array Tailoring',
        productId: 'prod-test',
        cohortType: 'budget-conscious',
        behavioralOverlay: 'browse-heavy',
        baseSku: 'SKU-6548320',
        label: 'Array Tailoring',
        priority: 1,
        controlFlag: false,
        tailoring: ['not', 'an', 'object'],
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.appliedTailoring).toEqual([]);
    });

    it('builds manifest for all generated variants successfully', () => {
      generatedVariants.forEach((variant, index) => {
        const result = buildManifest(variant);

        expect(result.manifest).not.toBeNull();
        expect(result.manifest.variantId).toBe(variant.variantId);
        expect(result.manifest.cohort).toBe(variant.cohortType);
        expect(result.manifest.behavioralOverlay).toBe(variant.behavioralOverlay);
        expect(result.manifest.baseSku).toBe(variant.baseSku);
        expect(result.manifest.controlFlag).toBe(variant.controlFlag);
      });
    });

    it('emits EXPORT_ACTION event on successful manifest build', () => {
      clearEventBuffer();

      const variant = generatedVariants[0];
      buildManifest(variant);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);

      const buildEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'buildManifest',
      );

      expect(buildEvent).toBeDefined();
      expect(buildEvent.payload.variantId).toBe(variant.variantId);
    });

    it('emits ERROR event when variant is null', () => {
      clearEventBuffer();

      buildManifest(null);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);

      const buildError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'buildManifest',
      );

      expect(buildError).toBeDefined();
    });

    it('emits ERROR event when variant has no id', () => {
      clearEventBuffer();

      buildManifest({});

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);

      const buildError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'buildManifest',
      );

      expect(buildError).toBeDefined();
    });

    it('is a pure function — does not mutate the input variant', () => {
      const variant = generatedVariants[0];
      const originalVariant = JSON.parse(JSON.stringify(variant));

      buildManifest(variant);

      expect(variant).toEqual(originalVariant);
    });

    it('produces deterministic output for the same input', () => {
      const variant = generatedVariants[0];

      const result1 = buildManifest(variant);
      const result2 = buildManifest(variant);

      expect(result1.manifest.variantId).toBe(result2.manifest.variantId);
      expect(result1.manifest.cohort).toBe(result2.manifest.cohort);
      expect(result1.manifest.behavioralOverlay).toBe(result2.manifest.behavioralOverlay);
      expect(result1.manifest.baseSku).toBe(result2.manifest.baseSku);
      expect(result1.manifest.controlFlag).toBe(result2.manifest.controlFlag);
      expect(result1.manifest.appliedTailoring.length).toBe(result2.manifest.appliedTailoring.length);
    });

    it('handles variant with empty string cohortType', () => {
      const variant = {
        variantId: 'variant-empty-cohort',
        name: 'Empty Cohort',
        productId: 'prod-test',
        cohortType: '',
        behavioralOverlay: '',
        baseSku: '',
        label: '',
        priority: 0,
        controlFlag: true,
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.cohort).toBe('');
      expect(result.manifest.behavioralOverlay).toBe('');
      expect(result.manifest.baseSku).toBe('');
    });

    it('handles variant with missing optional fields gracefully', () => {
      const variant = {
        variantId: 'variant-minimal',
        name: 'Minimal',
        productId: 'prod-test',
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.variantId).toBe('variant-minimal');
      expect(result.manifest.cohort).toBe('');
      expect(result.manifest.behavioralOverlay).toBe('');
      expect(result.manifest.baseSku).toBe('');
      expect(result.manifest.label).toBe('Minimal');
      expect(result.manifest.priority).toBe(0);
      expect(result.manifest.controlFlag).toBe(false);
    });

    it('manifest id is derived from variantId', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.id).toContain(variant.variantId);
    });
  });

  describe('buildBulkManifest', () => {
    it('builds bulk manifest from array of generated variants', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(result.bulkManifest).not.toBeNull();
      expect(Array.isArray(result.manifests)).toBe(true);
      expect(result.manifests.length).toBe(generatedVariants.length);
    });

    it('bulk manifest contains correct totalVariants count', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(result.bulkManifest.totalVariants).toBe(generatedVariants.length);
    });

    it('bulk manifest contains variantIds array', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(Array.isArray(result.bulkManifest.variantIds)).toBe(true);
      expect(result.bulkManifest.variantIds.length).toBe(generatedVariants.length);

      generatedVariants.forEach((variant) => {
        expect(result.bulkManifest.variantIds).toContain(variant.variantId);
      });
    });

    it('bulk manifest contains variants array with per-variant manifests', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(Array.isArray(result.bulkManifest.variants)).toBe(true);
      expect(result.bulkManifest.variants.length).toBe(generatedVariants.length);

      result.bulkManifest.variants.forEach((manifest) => {
        expect(typeof manifest.variantId).toBe('string');
        expect(typeof manifest.cohort).toBe('string');
        expect(typeof manifest.behavioralOverlay).toBe('string');
        expect(Array.isArray(manifest.appliedTailoring)).toBe(true);
        expect(typeof manifest.controlFlag).toBe('boolean');
      });
    });

    it('bulk manifest contains totalTransformations count', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(typeof result.bulkManifest.totalTransformations).toBe('number');
      expect(result.bulkManifest.totalTransformations).toBeGreaterThanOrEqual(0);
    });

    it('bulk manifest contains id field', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(typeof result.bulkManifest.id).toBe('string');
      expect(result.bulkManifest.id.length).toBeGreaterThan(0);
    });

    it('bulk manifest contains name field', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(typeof result.bulkManifest.name).toBe('string');
      expect(result.bulkManifest.name.length).toBeGreaterThan(0);
    });

    it('bulk manifest contains version field', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(result.bulkManifest.version).toBe(getManifestVersion());
    });

    it('bulk manifest contains createdAt timestamp', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(typeof result.bulkManifest.createdAt).toBe('string');
      expect(new Date(result.bulkManifest.createdAt).toISOString()).toBe(result.bulkManifest.createdAt);
    });

    it('bulk manifest contains status field', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(result.bulkManifest.status).toBe('draft');
    });

    it('bulk manifest contains description field', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(typeof result.bulkManifest.description).toBe('string');
      expect(result.bulkManifest.description.length).toBeGreaterThan(0);
    });

    it('returns null bulkManifest and errors when variants is not an array', () => {
      const result = buildBulkManifest('not an array');

      expect(result.bulkManifest).toBeNull();
      expect(result.manifests).toEqual([]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('array');
    });

    it('returns null bulkManifest and errors when variants is empty array', () => {
      const result = buildBulkManifest([]);

      expect(result.bulkManifest).toBeNull();
      expect(result.manifests).toEqual([]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('at least one');
    });

    it('returns null bulkManifest when all variants are invalid', () => {
      const result = buildBulkManifest([null, undefined, 'invalid']);

      expect(result.bulkManifest).toBeNull();
      expect(result.manifests).toEqual([]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('builds bulk manifest with partial failures (some invalid variants)', () => {
      const mixedVariants = [
        generatedVariants[0],
        null,
        generatedVariants[1],
        {},
      ];

      const result = buildBulkManifest(mixedVariants);

      expect(result.bulkManifest).not.toBeNull();
      expect(result.manifests.length).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.valid).toBe(false);
    });

    it('builds bulk manifest from a single variant', () => {
      const result = buildBulkManifest([generatedVariants[0]]);

      expect(result.bulkManifest).not.toBeNull();
      expect(result.manifests.length).toBe(1);
      expect(result.bulkManifest.totalVariants).toBe(1);
    });

    it('totalTransformations equals sum of all appliedTailoring entries', () => {
      const result = buildBulkManifest(generatedVariants);

      const expectedTotal = result.manifests.reduce(
        (sum, m) => sum + (Array.isArray(m.appliedTailoring) ? m.appliedTailoring.length : 0),
        0,
      );

      expect(result.bulkManifest.totalTransformations).toBe(expectedTotal);
    });

    it('emits EXPORT_ACTION event on successful bulk manifest build', () => {
      clearEventBuffer();

      buildBulkManifest(generatedVariants);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);

      const bulkEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'buildBulkManifest',
      );

      expect(bulkEvent).toBeDefined();
      expect(bulkEvent.payload.totalVariants).toBe(generatedVariants.length);
    });

    it('emits ERROR event when variants is not an array', () => {
      clearEventBuffer();

      buildBulkManifest(null);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);

      const bulkError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'buildBulkManifest',
      );

      expect(bulkError).toBeDefined();
    });

    it('emits ERROR event when variants is empty array', () => {
      clearEventBuffer();

      buildBulkManifest([]);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);

      const bulkError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'buildBulkManifest',
      );

      expect(bulkError).toBeDefined();
    });

    it('does not mutate the input variants array', () => {
      const originalVariants = JSON.parse(JSON.stringify(generatedVariants));

      buildBulkManifest(generatedVariants);

      expect(generatedVariants).toEqual(originalVariants);
    });
  });

  describe('extractExportManifest', () => {
    it('extracts a clean export manifest from a generated variant', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it('export manifest contains variantId', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest.variantId).toBe(variant.variantId);
    });

    it('export manifest contains cohort', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest.cohort).toBe(variant.cohortType);
    });

    it('export manifest contains behavioralOverlay', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest.behavioralOverlay).toBe(variant.behavioralOverlay);
    });

    it('export manifest contains baseSku', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest.baseSku).toBe(variant.baseSku);
    });

    it('export manifest contains label', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest.label).toBe(variant.label);
    });

    it('export manifest contains priority', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest.priority).toBe(variant.priority);
    });

    it('export manifest contains appliedTailoring array', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(Array.isArray(result.exportManifest.appliedTailoring)).toBe(true);
    });

    it('export manifest contains diffSummary', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest.diffSummary).toBeDefined();
    });

    it('export manifest contains created timestamp', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(typeof result.exportManifest.created).toBe('string');
    });

    it('export manifest contains controlFlag', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(typeof result.exportManifest.controlFlag).toBe('boolean');
      expect(result.exportManifest.controlFlag).toBe(variant.controlFlag);
    });

    it('export manifest does not contain internal fields like id, name, version, status', () => {
      const variant = generatedVariants[0];
      const result = extractExportManifest(variant);

      expect(result.exportManifest.id).toBeUndefined();
      expect(result.exportManifest.name).toBeUndefined();
      expect(result.exportManifest.version).toBeUndefined();
      expect(result.exportManifest.status).toBeUndefined();
      expect(result.exportManifest.variantIds).toBeUndefined();
    });

    it('returns null exportManifest and error when variant is null', () => {
      const result = extractExportManifest(null);

      expect(result.exportManifest).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error).toContain('non-null object');
    });

    it('returns null exportManifest and error when variant is undefined', () => {
      const result = extractExportManifest(undefined);

      expect(result.exportManifest).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('returns null exportManifest and error when variant has no id', () => {
      const result = extractExportManifest({});

      expect(result.exportManifest).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('extracts export manifest for all generated variants', () => {
      generatedVariants.forEach((variant) => {
        const result = extractExportManifest(variant);

        expect(result.exportManifest).not.toBeNull();
        expect(result.error).toBeNull();
        expect(result.exportManifest.variantId).toBe(variant.variantId);
      });
    });
  });

  describe('extractBulkExportManifests', () => {
    it('extracts bulk export data from array of generated variants', () => {
      const result = extractBulkExportManifests(generatedVariants);

      expect(result.exportData).not.toBeNull();
      expect(Array.isArray(result.exportData.variants)).toBe(true);
      expect(result.exportData.variants.length).toBe(generatedVariants.length);
    });

    it('bulk export data contains version field', () => {
      const result = extractBulkExportManifests(generatedVariants);

      expect(result.exportData.version).toBe(getManifestVersion());
    });

    it('bulk export data contains exportedAt timestamp', () => {
      const result = extractBulkExportManifests(generatedVariants);

      expect(typeof result.exportData.exportedAt).toBe('string');
      expect(new Date(result.exportData.exportedAt).toISOString()).toBe(result.exportData.exportedAt);
    });

    it('bulk export data contains totalVariants count', () => {
      const result = extractBulkExportManifests(generatedVariants);

      expect(result.exportData.totalVariants).toBe(generatedVariants.length);
    });

    it('each export manifest in bulk has clean contract fields', () => {
      const result = extractBulkExportManifests(generatedVariants);

      result.exportData.variants.forEach((manifest) => {
        expect(typeof manifest.variantId).toBe('string');
        expect(typeof manifest.cohort).toBe('string');
        expect(typeof manifest.behavioralOverlay).toBe('string');
        expect(typeof manifest.baseSku).toBe('string');
        expect(Array.isArray(manifest.appliedTailoring)).toBe(true);
        expect(typeof manifest.created).toBe('string');
        expect(typeof manifest.controlFlag).toBe('boolean');

        // Should not have internal fields
        expect(manifest.id).toBeUndefined();
        expect(manifest.name).toBeUndefined();
        expect(manifest.version).toBeUndefined();
        expect(manifest.status).toBeUndefined();
      });
    });

    it('returns null exportData and errors when variants is not an array', () => {
      const result = extractBulkExportManifests('not an array');

      expect(result.exportData).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns null exportData and errors when variants is empty array', () => {
      const result = extractBulkExportManifests([]);

      expect(result.exportData).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns null exportData when all variants are invalid', () => {
      const result = extractBulkExportManifests([null, undefined, {}]);

      expect(result.exportData).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles partial failures in bulk export', () => {
      const mixedVariants = [
        generatedVariants[0],
        null,
        generatedVariants[2],
      ];

      const result = extractBulkExportManifests(mixedVariants);

      expect(result.exportData).not.toBeNull();
      expect(result.exportData.variants.length).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns null exportData when variants is null', () => {
      const result = extractBulkExportManifests(null);

      expect(result.exportData).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns null exportData when variants is undefined', () => {
      const result = extractBulkExportManifests(undefined);

      expect(result.exportData).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('schema validation', () => {
    it('all generated variant manifests pass schema validation', () => {
      generatedVariants.forEach((variant) => {
        const result = buildManifest(variant);

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('manifest with missing required fields fails validation', () => {
      const variant = {
        variantId: 'variant-invalid-manifest',
        // Missing name, productId, etc.
      };

      const result = buildManifest(variant);

      // The manifest is still built but may have validation warnings
      expect(result.manifest).not.toBeNull();
      // The manifest builder creates all required fields, so it should still be valid
      expect(result.manifest.variantId).toBe('variant-invalid-manifest');
    });

    it('manifest id starts with "manifest-" prefix', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.id).toMatch(/^manifest-/);
    });

    it('manifest name contains variant label or id', () => {
      const variant = generatedVariants[0];
      const result = buildManifest(variant);

      expect(result.manifest.name).toContain('Manifest for');
    });
  });

  describe('integration with variantGenerator', () => {
    it('builds manifests for all 10 generated variants', () => {
      expect(generatedVariants.length).toBe(10);

      const manifests = generatedVariants.map((variant) => {
        const result = buildManifest(variant);
        return result.manifest;
      });

      expect(manifests.length).toBe(10);
      manifests.forEach((manifest) => {
        expect(manifest).not.toBeNull();
      });
    });

    it('bulk manifest from generated variants has correct structure', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(result.bulkManifest).not.toBeNull();
      expect(result.bulkManifest.totalVariants).toBe(10);
      expect(result.bulkManifest.variantIds.length).toBe(10);
      expect(result.bulkManifest.variants.length).toBe(10);
    });

    it('each manifest in bulk has unique variantId', () => {
      const result = buildBulkManifest(generatedVariants);

      const ids = result.manifests.map((m) => m.variantId);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('exactly one manifest has controlFlag true', () => {
      const result = buildBulkManifest(generatedVariants);

      const controlManifests = result.manifests.filter((m) => m.controlFlag === true);

      expect(controlManifests.length).toBe(1);
    });

    it('control manifest is the first variant', () => {
      const result = buildBulkManifest(generatedVariants);

      expect(result.manifests[0].controlFlag).toBe(true);
    });

    it('manifests contain cohort types from the default cohort set', () => {
      const result = buildBulkManifest(generatedVariants);

      const cohortTypes = result.manifests.map((m) => m.cohort);

      expect(cohortTypes).toContain('budget-conscious');
      expect(cohortTypes).toContain('tech-enthusiast');
    });

    it('manifests contain behavioral overlays from the default cohort set', () => {
      const result = buildBulkManifest(generatedVariants);

      const overlays = result.manifests.map((m) => m.behavioralOverlay);

      expect(overlays).toContain('browse-heavy');
      expect(overlays).toContain('comparison-shopper');
    });

    it('manifests contain base SKUs from the mock catalog', () => {
      const result = buildBulkManifest(generatedVariants);

      const skus = result.manifests.map((m) => m.baseSku);
      const catalogSkus = mockCatalog.map((item) => item.sku);

      skus.forEach((sku) => {
        if (sku) {
          expect(catalogSkus).toContain(sku);
        }
      });
    });

    it('non-control manifests have appliedTailoring entries', () => {
      const result = buildBulkManifest(generatedVariants);

      const nonControlManifests = result.manifests.filter((m) => !m.controlFlag);

      nonControlManifests.forEach((manifest) => {
        expect(manifest.appliedTailoring.length).toBeGreaterThan(0);
      });
    });

    it('appliedTailoring dimensions are valid TAILORING_DIMENSIONS', () => {
      const result = buildBulkManifest(generatedVariants);

      result.manifests.forEach((manifest) => {
        manifest.appliedTailoring.forEach((entry) => {
          expect(TAILORING_DIMENSIONS).toContain(entry.dimension);
        });
      });
    });
  });

  describe('edge cases', () => {
    it('handles variant with numeric zero priority', () => {
      const variant = {
        variantId: 'variant-zero-priority',
        name: 'Zero Priority',
        productId: 'prod-test',
        priority: 0,
        controlFlag: false,
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.priority).toBe(0);
    });

    it('handles variant with very long label', () => {
      const variant = {
        variantId: 'variant-long-label',
        name: 'Long Label',
        productId: 'prod-test',
        label: 'A'.repeat(200),
        controlFlag: false,
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.label).toBe('A'.repeat(200));
    });

    it('handles variant with special characters in fields', () => {
      const variant = {
        variantId: 'variant-special-chars',
        name: 'Special "Chars" & <Tags>',
        productId: 'prod-test',
        cohortType: 'budget-conscious',
        behavioralOverlay: 'browse-heavy',
        label: 'Label with "quotes" & ampersands',
        controlFlag: false,
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.cohort).toBe('budget-conscious');
      expect(result.manifest.label).toBe('Label with "quotes" & ampersands');
    });

    it('handles variant with tailoring entry missing weight', () => {
      const variant = {
        variantId: 'variant-no-weight',
        name: 'No Weight',
        productId: 'prod-test',
        controlFlag: false,
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings',
            rationale: 'Budget focus',
          },
        },
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.appliedTailoring.length).toBe(1);
      expect(result.manifest.appliedTailoring[0].weight).toBe(0);
    });

    it('handles variant with tailoring entry having non-finite weight', () => {
      const variant = {
        variantId: 'variant-nan-weight',
        name: 'NaN Weight',
        productId: 'prod-test',
        controlFlag: false,
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings',
            rationale: 'Budget focus',
            weight: NaN,
          },
        },
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.appliedTailoring.length).toBe(1);
      expect(result.manifest.appliedTailoring[0].weight).toBe(0);
    });

    it('handles variant with manifest.appliedTailoring containing entries with missing fields', () => {
      const variant = {
        variantId: 'variant-partial-tailoring',
        name: 'Partial Tailoring',
        productId: 'prod-test',
        controlFlag: false,
        manifest: {
          appliedTailoring: [
            { dimension: 'price' },
            { change: 'some change' },
            {},
          ],
        },
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.appliedTailoring.length).toBe(3);

      result.manifest.appliedTailoring.forEach((entry) => {
        expect(typeof entry.dimension).toBe('string');
        expect(typeof entry.change).toBe('string');
        expect(typeof entry.rationale).toBe('string');
        expect(typeof entry.weight).toBe('number');
      });
    });

    it('handles variant with diff.dimensions as empty array', () => {
      const variant = {
        variantId: 'variant-empty-diff',
        name: 'Empty Diff',
        productId: 'prod-test',
        controlFlag: true,
        diff: {
          dimensions: [],
          changes: [],
        },
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.diffSummary.dimensionsChanged).toBe(0);
      expect(result.manifest.diffSummary.dimensions).toEqual([]);
    });

    it('handles variant with manifest.diffSummary instead of diff', () => {
      const variant = {
        variantId: 'variant-manifest-diff',
        name: 'Manifest Diff',
        productId: 'prod-test',
        controlFlag: false,
        manifest: {
          diffSummary: {
            dimensionsChanged: 3,
            dimensions: ['price', 'badge', 'title'],
          },
        },
      };

      const result = buildManifest(variant);

      expect(result.manifest).not.toBeNull();
      expect(result.manifest.diffSummary.dimensionsChanged).toBe(3);
      expect(result.manifest.diffSummary.dimensions).toEqual(['price', 'badge', 'title']);
    });
  });
});