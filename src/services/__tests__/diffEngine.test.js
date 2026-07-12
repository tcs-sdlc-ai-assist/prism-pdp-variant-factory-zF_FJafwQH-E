import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeDiff,
  computeSimpleDiff,
  getChangesForDimension,
  getDimensionSummary,
  hasFieldChanged,
  getFieldChange,
  formatDiffSummary,
  getFieldToDimensionMap,
} from '@/services/diffEngine.js';
import { TAILORING_DIMENSIONS } from '@/constants/constants.js';
import mockCatalog from '@/data/mockCatalog.js';

describe('DiffEngine', () => {
  let canonicalPdp;

  beforeEach(() => {
    canonicalPdp = { ...mockCatalog[0] };
  });

  describe('computeDiff', () => {
    it('returns empty diff result when canonical and variant are identical', () => {
      const variant = {
        variantPdp: { ...canonicalPdp },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
      expect(result.dimensionsChanged).toBe(0);
      expect(result.dimensions).toEqual([]);
      expect(result.changes).toEqual([]);
      expect(result.dimensionSummaries).toEqual([]);
      expect(result.changesByDimension).toEqual({});
    });

    it('detects a single field change', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.hasChanges).toBe(true);
      expect(result.totalChanges).toBeGreaterThanOrEqual(1);
      expect(result.dimensions).toContain('price');

      const priceDisplayChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceDisplayChange).toBeDefined();
      expect(priceDisplayChange.to).toBe('savings-highlight');
      expect(priceDisplayChange.changeType).toBe('added');
      expect(priceDisplayChange.dimension).toBe('price');
    });

    it('detects multiple field changes across different dimensions', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'member-price',
          showSavings: true,
          primaryCTA: 'Grab This Deal',
          ctaTone: 'urgent',
          urgencyLevel: 'high',
          urgencyMessage: 'Limited time offer',
          crossSellStrategy: 'bundle',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.hasChanges).toBe(true);
      expect(result.totalChanges).toBeGreaterThanOrEqual(5);
      expect(result.dimensionsChanged).toBeGreaterThanOrEqual(3);
      expect(result.dimensions).toContain('price');
      expect(result.dimensions).toContain('title');
      expect(result.dimensions).toContain('badge');
      expect(result.dimensions).toContain('accessories');
    });

    it('returns correct DiffResult structure', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(Array.isArray(result.dimensions)).toBe(true);
      expect(Array.isArray(result.changes)).toBe(true);
      expect(Array.isArray(result.dimensionSummaries)).toBe(true);
      expect(typeof result.totalChanges).toBe('number');
      expect(typeof result.dimensionsChanged).toBe('number');
      expect(typeof result.hasChanges).toBe('boolean');
      expect(typeof result.changesByDimension).toBe('object');
      expect(result.changesByDimension).not.toBeNull();
    });

    it('returns empty diff result when canonicalPdp is null', () => {
      const variant = { variantPdp: { title: 'Test' } };

      const result = computeDiff(null, variant);

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
      expect(result.dimensions).toEqual([]);
      expect(result.changes).toEqual([]);
    });

    it('returns empty diff result when canonicalPdp is undefined', () => {
      const variant = { variantPdp: { title: 'Test' } };

      const result = computeDiff(undefined, variant);

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
    });

    it('returns empty diff result when variant is null', () => {
      const result = computeDiff(canonicalPdp, null);

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
      expect(result.dimensions).toEqual([]);
      expect(result.changes).toEqual([]);
    });

    it('returns empty diff result when variant is undefined', () => {
      const result = computeDiff(canonicalPdp, undefined);

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
    });

    it('returns empty diff result when canonicalPdp is not an object', () => {
      const result = computeDiff('not an object', { variantPdp: {} });

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
    });

    it('returns empty diff result when variant is not an object', () => {
      const result = computeDiff(canonicalPdp, 'not an object');

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
    });

    it('returns empty diff result when both inputs are null', () => {
      const result = computeDiff(null, null);

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
    });

    it('uses variant directly when variantPdp is not present', () => {
      const variant = {
        ...canonicalPdp,
        priceDisplay: 'member-price',
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.hasChanges).toBe(true);
      const priceDisplayChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceDisplayChange).toBeDefined();
      expect(priceDisplayChange.to).toBe('member-price');
    });

    it('prefers variantPdp over variant root when both exist', () => {
      const variant = {
        priceDisplay: 'should-not-use',
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceDisplayChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceDisplayChange).toBeDefined();
      expect(priceDisplayChange.to).toBe('savings-highlight');
    });

    it('excludes internal keys from diff comparison', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          variantId: 'variant-123',
          cohortId: 'cohort-456',
          controlFlag: true,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const internalFields = ['variantId', 'cohortId', 'controlFlag', 'isActive', 'createdAt', 'updatedAt'];
      internalFields.forEach((field) => {
        const change = result.changes.find((c) => c.field === field);
        expect(change).toBeUndefined();
      });
    });

    it('detects added fields (present in variant but not in canonical)', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          showSavings: true,
          priceCallout: 'Save big today!',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const showSavingsChange = result.changes.find((c) => c.field === 'showSavings');
      expect(showSavingsChange).toBeDefined();
      expect(showSavingsChange.changeType).toBe('added');
      expect(showSavingsChange.from).toBeNull();
      expect(showSavingsChange.to).toBe(true);

      const priceCalloutChange = result.changes.find((c) => c.field === 'priceCallout');
      expect(priceCalloutChange).toBeDefined();
      expect(priceCalloutChange.changeType).toBe('added');
    });

    it('detects modified fields (different values)', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          title: 'Modified Title',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const titleChange = result.changes.find((c) => c.field === 'title');
      expect(titleChange).toBeDefined();
      expect(titleChange.changeType).toBe('modified');
      expect(titleChange.from).toBe(canonicalPdp.title);
      expect(titleChange.to).toBe('Modified Title');
    });

    it('detects modified array fields', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          badges: ['Best Seller', 'Price Drop'],
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const badgesChange = result.changes.find((c) => c.field === 'badges');
      expect(badgesChange).toBeDefined();
      expect(badgesChange.dimension).toBe('badge');
    });

    it('groups changes by dimension correctly', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          showSavings: true,
          showMemberPrice: true,
          priceCallout: 'Great deal!',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.changesByDimension).toBeDefined();
      expect(result.changesByDimension['price']).toBeDefined();
      expect(Array.isArray(result.changesByDimension['price'])).toBe(true);
      expect(result.changesByDimension['price'].length).toBeGreaterThanOrEqual(3);
    });

    it('produces dimension summaries sorted by weight descending', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
          crossSellStrategy: 'bundle',
        },
        tailoring: {
          price: { action: 'emphasize', value: 'savings', rationale: 'Budget shopper', weight: 90 },
          title: { action: 'augment', value: 'CTA change', rationale: 'Urgency', weight: 50 },
          accessories: { action: 'augment', value: 'bundle', rationale: 'Cross-sell', weight: 70 },
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      if (result.dimensionSummaries.length >= 2) {
        for (let i = 1; i < result.dimensionSummaries.length; i++) {
          expect(result.dimensionSummaries[i - 1].weight).toBeGreaterThanOrEqual(
            result.dimensionSummaries[i].weight,
          );
        }
      }
    });

    it('extracts rationale from variant tailoring map', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings',
            rationale: 'Budget-conscious shoppers respond best to savings emphasis',
            weight: 90,
          },
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.rationale).toBe('Budget-conscious shoppers respond best to savings emphasis');
    });

    it('extracts rationale from variant manifest appliedTailoring', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'member-price',
        },
        manifest: {
          appliedTailoring: [
            {
              dimension: 'price',
              change: 'emphasize: member-price',
              rationale: 'Loyalty member pricing emphasis',
              weight: 80,
            },
          ],
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.rationale).toBe('Loyalty member pricing emphasis');
    });

    it('extracts weight from variant tailoring map', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings',
            rationale: 'Budget focus',
            weight: 85,
          },
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.weight).toBe(85);
    });

    it('returns weight 0 when no tailoring data is available', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.weight).toBe(0);
    });

    it('returns empty rationale when no tailoring data is available', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.rationale).toBe('');
    });

    it('handles variant with all sections changed', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          title: 'Changed Title',
          price: 999.99,
          priceDisplay: 'compare-at',
          showSavings: true,
          showMemberPrice: true,
          priceCallout: 'Lowest price!',
          badges: ['VIP Exclusive'],
          urgencyLevel: 'high',
          urgencyMessage: 'Almost gone!',
          primaryCTA: 'Grab This Deal',
          secondaryCTA: 'Price Match',
          ctaTone: 'urgent',
          layout: 'price-forward',
          primaryFocus: 'price',
          socialProofDisplay: 'expanded',
          showReviewCount: false,
          showExpertReviews: true,
          reviewFilter: 'expert',
          crossSellStrategy: 'upgrade',
          crossSellHeading: 'Compare Similar',
          crossSellMaxItems: 5,
          prioritizedSpecs: ['processor', 'memory'],
          specsExpandedByDefault: true,
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.hasChanges).toBe(true);
      expect(result.totalChanges).toBeGreaterThanOrEqual(10);
      expect(result.dimensionsChanged).toBeGreaterThanOrEqual(5);
    });

    it('is a pure function — does not mutate inputs', () => {
      const originalCanonical = JSON.parse(JSON.stringify(canonicalPdp));
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };
      const originalVariant = JSON.parse(JSON.stringify(variant));

      computeDiff(canonicalPdp, variant);

      expect(canonicalPdp).toEqual(originalCanonical);
      expect(variant).toEqual(originalVariant);
    });

    it('produces deterministic output — same inputs yield same result', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
        },
      };

      const result1 = computeDiff(canonicalPdp, variant);
      const result2 = computeDiff(canonicalPdp, variant);

      expect(result1.totalChanges).toBe(result2.totalChanges);
      expect(result1.dimensionsChanged).toBe(result2.dimensionsChanged);
      expect(result1.hasChanges).toBe(result2.hasChanges);
      expect(result1.dimensions).toEqual(result2.dimensions);
      expect(result1.changes.length).toBe(result2.changes.length);
    });

    it('maps fields to correct tailoring dimensions', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          badges: ['New'],
          primaryCTA: 'Buy Now',
          socialProofDisplay: 'expanded',
          crossSellStrategy: 'bundle',
          prioritizedSpecs: ['processor'],
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange.dimension).toBe('price');

      const badgeChange = result.changes.find((c) => c.field === 'badges');
      expect(badgeChange.dimension).toBe('badge');

      const ctaChange = result.changes.find((c) => c.field === 'primaryCTA');
      expect(ctaChange.dimension).toBe('title');

      const socialChange = result.changes.find((c) => c.field === 'socialProofDisplay');
      expect(socialChange.dimension).toBe('rating');

      const crossSellChange = result.changes.find((c) => c.field === 'crossSellStrategy');
      expect(crossSellChange.dimension).toBe('accessories');

      const specChange = result.changes.find((c) => c.field === 'prioritizedSpecs');
      expect(specChange.dimension).toBe('fulfillment');
    });

    it('maps unknown fields to "other" dimension', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          customUnknownField: 'some value',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const unknownChange = result.changes.find((c) => c.field === 'customUnknownField');
      expect(unknownChange).toBeDefined();
      expect(unknownChange.dimension).toBe('other');
    });

    it('dimension summaries contain correct changeCount', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          showSavings: true,
          showMemberPrice: true,
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceSummary = result.dimensionSummaries.find((s) => s.dimension === 'price');
      expect(priceSummary).toBeDefined();
      expect(priceSummary.changeCount).toBeGreaterThanOrEqual(3);
      expect(priceSummary.changes.length).toBe(priceSummary.changeCount);
    });

    it('dimension summaries contain rationale from changes', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings',
            rationale: 'Budget-conscious emphasis',
            weight: 90,
          },
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceSummary = result.dimensionSummaries.find((s) => s.dimension === 'price');
      expect(priceSummary).toBeDefined();
      expect(priceSummary.rationale).toBe('Budget-conscious emphasis');
    });

    it('dimension summaries contain highest weight among changes', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          showSavings: true,
        },
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings',
            rationale: 'Budget focus',
            weight: 95,
          },
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceSummary = result.dimensionSummaries.find((s) => s.dimension === 'price');
      expect(priceSummary).toBeDefined();
      expect(priceSummary.weight).toBe(95);
    });

    it('handles deeply nested object changes (specs)', () => {
      const modifiedSpecs = { ...canonicalPdp.specs, screenSize: '75"' };
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          specs: modifiedSpecs,
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const specsChange = result.changes.find((c) => c.field === 'specs');
      expect(specsChange).toBeDefined();
      expect(specsChange.changeType).toBe('modified');
    });

    it('handles array reordering detection', () => {
      const originalFeatures = [...canonicalPdp.features];
      const reorderedFeatures = [...originalFeatures].reverse();

      const variant = {
        variantPdp: {
          ...canonicalPdp,
          features: reorderedFeatures,
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const featuresChange = result.changes.find((c) => c.field === 'features');
      if (featuresChange) {
        expect(['reordered', 'modified']).toContain(featuresChange.changeType);
      }
    });

    it('clamps weight values between 0 and 100', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings',
            rationale: 'Test',
            weight: 150,
          },
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.weight).toBeLessThanOrEqual(100);
      expect(priceChange.weight).toBeGreaterThanOrEqual(0);
    });

    it('handles negative weight values by clamping to 0', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
        tailoring: {
          price: {
            action: 'emphasize',
            value: 'savings',
            rationale: 'Test',
            weight: -10,
          },
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.weight).toBeGreaterThanOrEqual(0);
    });

    it('handles tailoring as an array gracefully (ignores it)', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
        tailoring: ['not', 'an', 'object'],
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.hasChanges).toBe(true);
      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.weight).toBe(0);
      expect(priceChange.rationale).toBe('');
    });

    it('handles manifest without appliedTailoring gracefully', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
        manifest: {
          variantId: 'test-variant',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.hasChanges).toBe(true);
      const priceChange = result.changes.find((c) => c.field === 'priceDisplay');
      expect(priceChange).toBeDefined();
      expect(priceChange.rationale).toBe('');
    });

    it('sorts tailoring dimensions before other dimensions in result', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          customField: 'custom value',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const tailoringDims = result.dimensions.filter((d) => TAILORING_DIMENSIONS.includes(d));
      const otherDims = result.dimensions.filter((d) => !TAILORING_DIMENSIONS.includes(d));

      if (tailoringDims.length > 0 && otherDims.length > 0) {
        const lastTailoringIndex = result.dimensions.lastIndexOf(tailoringDims[tailoringDims.length - 1]);
        const firstOtherIndex = result.dimensions.indexOf(otherDims[0]);
        expect(lastTailoringIndex).toBeLessThan(firstOtherIndex);
      }
    });

    it('each FieldChange has all required properties', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      result.changes.forEach((change) => {
        expect(typeof change.field).toBe('string');
        expect(change).toHaveProperty('from');
        expect(change).toHaveProperty('to');
        expect(typeof change.changeType).toBe('string');
        expect(typeof change.dimension).toBe('string');
        expect(typeof change.rationale).toBe('string');
        expect(typeof change.weight).toBe('number');
      });
    });
  });

  describe('computeSimpleDiff', () => {
    it('returns simplified diff with dimensions and fields', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
        },
      };

      const result = computeSimpleDiff(canonicalPdp, variant);

      expect(Array.isArray(result.dimensions)).toBe(true);
      expect(Array.isArray(result.fields)).toBe(true);
      expect(typeof result.hasChanges).toBe('boolean');
      expect(result.hasChanges).toBe(true);
      expect(result.dimensions).toContain('price');
      expect(result.dimensions).toContain('title');
      expect(result.fields).toContain('priceDisplay');
      expect(result.fields).toContain('primaryCTA');
    });

    it('returns no changes for identical inputs', () => {
      const variant = {
        variantPdp: { ...canonicalPdp },
      };

      const result = computeSimpleDiff(canonicalPdp, variant);

      expect(result.hasChanges).toBe(false);
      expect(result.dimensions).toEqual([]);
      expect(result.fields).toEqual([]);
    });

    it('returns empty result for null canonical PDP', () => {
      const result = computeSimpleDiff(null, { variantPdp: {} });

      expect(result.hasChanges).toBe(false);
      expect(result.dimensions).toEqual([]);
      expect(result.fields).toEqual([]);
    });

    it('returns empty result for null variant', () => {
      const result = computeSimpleDiff(canonicalPdp, null);

      expect(result.hasChanges).toBe(false);
      expect(result.dimensions).toEqual([]);
      expect(result.fields).toEqual([]);
    });

    it('is a pure function — does not mutate inputs', () => {
      const originalCanonical = JSON.parse(JSON.stringify(canonicalPdp));
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };
      const originalVariant = JSON.parse(JSON.stringify(variant));

      computeSimpleDiff(canonicalPdp, variant);

      expect(canonicalPdp).toEqual(originalCanonical);
      expect(variant).toEqual(originalVariant);
    });
  });

  describe('getChangesForDimension', () => {
    it('returns changes for a specific dimension', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          showSavings: true,
          primaryCTA: 'Buy Now',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const priceChanges = getChangesForDimension(diffResult, 'price');

      expect(Array.isArray(priceChanges)).toBe(true);
      expect(priceChanges.length).toBeGreaterThanOrEqual(1);
      priceChanges.forEach((change) => {
        expect(change.dimension).toBe('price');
      });
    });

    it('returns empty array for dimension with no changes', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const warrantyChanges = getChangesForDimension(diffResult, 'warranty');

      expect(Array.isArray(warrantyChanges)).toBe(true);
      expect(warrantyChanges.length).toBe(0);
    });

    it('returns empty array when diffResult is null', () => {
      const result = getChangesForDimension(null, 'price');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('returns empty array when diffResult is undefined', () => {
      const result = getChangesForDimension(undefined, 'price');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('returns empty array when dimension is null', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const result = getChangesForDimension(diffResult, null);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('returns empty array when dimension is empty string', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const result = getChangesForDimension(diffResult, '');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('returns a copy of changes, not a reference', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const changes1 = getChangesForDimension(diffResult, 'price');
      const changes2 = getChangesForDimension(diffResult, 'price');

      expect(changes1).not.toBe(changes2);
      expect(changes1).toEqual(changes2);
    });
  });

  describe('getDimensionSummary', () => {
    it('returns dimension summary for a changed dimension', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          showSavings: true,
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const summary = getDimensionSummary(diffResult, 'price');

      expect(summary).not.toBeNull();
      expect(summary.dimension).toBe('price');
      expect(typeof summary.changeCount).toBe('number');
      expect(summary.changeCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(summary.changes)).toBe(true);
      expect(typeof summary.rationale).toBe('string');
      expect(typeof summary.weight).toBe('number');
    });

    it('returns null for dimension with no changes', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const summary = getDimensionSummary(diffResult, 'warranty');

      expect(summary).toBeNull();
    });

    it('returns null when diffResult is null', () => {
      const result = getDimensionSummary(null, 'price');

      expect(result).toBeNull();
    });

    it('returns null when diffResult is undefined', () => {
      const result = getDimensionSummary(undefined, 'price');

      expect(result).toBeNull();
    });

    it('returns null when dimension is null', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const result = getDimensionSummary(diffResult, null);

      expect(result).toBeNull();
    });

    it('returns null when dimension is empty string', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const result = getDimensionSummary(diffResult, '');

      expect(result).toBeNull();
    });

    it('returns null when dimensionSummaries is not an array', () => {
      const result = getDimensionSummary({ dimensionSummaries: 'not an array' }, 'price');

      expect(result).toBeNull();
    });
  });

  describe('hasFieldChanged', () => {
    it('returns true for a changed field', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);

      expect(hasFieldChanged(diffResult, 'priceDisplay')).toBe(true);
    });

    it('returns false for an unchanged field', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);

      expect(hasFieldChanged(diffResult, 'title')).toBe(false);
    });

    it('returns false when diffResult is null', () => {
      expect(hasFieldChanged(null, 'priceDisplay')).toBe(false);
    });

    it('returns false when diffResult is undefined', () => {
      expect(hasFieldChanged(undefined, 'priceDisplay')).toBe(false);
    });

    it('returns false when field is null', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);

      expect(hasFieldChanged(diffResult, null)).toBe(false);
    });

    it('returns false when field is empty string', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);

      expect(hasFieldChanged(diffResult, '')).toBe(false);
    });

    it('returns false when changes array is missing', () => {
      expect(hasFieldChanged({}, 'priceDisplay')).toBe(false);
    });
  });

  describe('getFieldChange', () => {
    it('returns change details for a changed field', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const change = getFieldChange(diffResult, 'priceDisplay');

      expect(change).not.toBeNull();
      expect(change.field).toBe('priceDisplay');
      expect(change.to).toBe('savings-highlight');
      expect(change.dimension).toBe('price');
    });

    it('returns null for an unchanged field', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const change = getFieldChange(diffResult, 'title');

      expect(change).toBeNull();
    });

    it('returns null when diffResult is null', () => {
      expect(getFieldChange(null, 'priceDisplay')).toBeNull();
    });

    it('returns null when diffResult is undefined', () => {
      expect(getFieldChange(undefined, 'priceDisplay')).toBeNull();
    });

    it('returns null when field is null', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);

      expect(getFieldChange(diffResult, null)).toBeNull();
    });

    it('returns null when field is empty string', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);

      expect(getFieldChange(diffResult, '')).toBeNull();
    });

    it('returns null when changes array is missing', () => {
      expect(getFieldChange({}, 'priceDisplay')).toBeNull();
    });
  });

  describe('formatDiffSummary', () => {
    it('returns human-readable summary for a diff with changes', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const summary = formatDiffSummary(diffResult);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('changed');
      expect(summary).toContain('dimension');
    });

    it('returns "No changes detected." for identical inputs', () => {
      const variant = {
        variantPdp: { ...canonicalPdp },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const summary = formatDiffSummary(diffResult);

      expect(summary).toBe('No changes detected.');
    });

    it('returns "No changes detected." when diffResult is null', () => {
      const summary = formatDiffSummary(null);

      expect(summary).toBe('No changes detected.');
    });

    it('returns "No changes detected." when diffResult is undefined', () => {
      const summary = formatDiffSummary(undefined);

      expect(summary).toBe('No changes detected.');
    });

    it('returns "No changes detected." when hasChanges is false', () => {
      const summary = formatDiffSummary({ hasChanges: false, totalChanges: 0, dimensionsChanged: 0, dimensions: [] });

      expect(summary).toBe('No changes detected.');
    });

    it('includes dimension names in summary', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const summary = formatDiffSummary(diffResult);

      expect(summary).toContain('price');
    });

    it('handles singular field count correctly', () => {
      const diffResult = {
        hasChanges: true,
        totalChanges: 1,
        dimensionsChanged: 1,
        dimensions: ['price'],
        changes: [{ field: 'priceDisplay' }],
      };

      const summary = formatDiffSummary(diffResult);

      expect(summary).toContain('1 field changed');
      expect(summary).toContain('1 dimension');
    });

    it('handles plural field count correctly', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
          crossSellStrategy: 'bundle',
        },
      };

      const diffResult = computeDiff(canonicalPdp, variant);
      const summary = formatDiffSummary(diffResult);

      expect(summary).toContain('fields changed');
    });
  });

  describe('getFieldToDimensionMap', () => {
    it('returns a non-null object', () => {
      const map = getFieldToDimensionMap();

      expect(map).not.toBeNull();
      expect(typeof map).toBe('object');
    });

    it('returns a copy, not the original map', () => {
      const map1 = getFieldToDimensionMap();
      const map2 = getFieldToDimensionMap();

      expect(map1).not.toBe(map2);
      expect(map1).toEqual(map2);
    });

    it('contains expected price-related field mappings', () => {
      const map = getFieldToDimensionMap();

      expect(map.price).toBe('price');
      expect(map.memberPrice).toBe('price');
      expect(map.priceDisplay).toBe('price');
      expect(map.showSavings).toBe('price');
      expect(map.showMemberPrice).toBe('price');
      expect(map.priceCallout).toBe('price');
    });

    it('contains expected badge-related field mappings', () => {
      const map = getFieldToDimensionMap();

      expect(map.badge).toBe('badge');
      expect(map.badges).toBe('badge');
      expect(map.urgencyLevel).toBe('badge');
      expect(map.urgencyMessage).toBe('badge');
    });

    it('contains expected title-related field mappings', () => {
      const map = getFieldToDimensionMap();

      expect(map.title).toBe('title');
      expect(map.primaryCTA).toBe('title');
      expect(map.secondaryCTA).toBe('title');
      expect(map.ctaTone).toBe('title');
    });

    it('contains expected description-related field mappings', () => {
      const map = getFieldToDimensionMap();

      expect(map.description).toBe('description');
      expect(map.layout).toBe('description');
      expect(map.primaryFocus).toBe('description');
    });

    it('contains expected media-related field mappings', () => {
      const map = getFieldToDimensionMap();

      expect(map.media).toBe('media');
      expect(map.imageUrl).toBe('media');
    });

    it('contains expected rating-related field mappings', () => {
      const map = getFieldToDimensionMap();

      expect(map.rating).toBe('rating');
      expect(map.reviewCount).toBe('rating');
      expect(map.socialProofDisplay).toBe('rating');
      expect(map.showReviewCount).toBe('rating');
      expect(map.showExpertReviews).toBe('rating');
      expect(map.reviewFilter).toBe('rating');
    });

    it('contains expected fulfillment-related field mappings', () => {
      const map = getFieldToDimensionMap();

      expect(map.fulfillment).toBe('fulfillment');
      expect(map.prioritizedSpecs).toBe('fulfillment');
      expect(map.specsExpandedByDefault).toBe('fulfillment');
    });

    it('contains expected accessories-related field mappings', () => {
      const map = getFieldToDimensionMap();

      expect(map.crossSellStrategy).toBe('accessories');
      expect(map.crossSellHeading).toBe('accessories');
      expect(map.crossSellMaxItems).toBe('accessories');
    });

    it('contains warranty field mapping', () => {
      const map = getFieldToDimensionMap();

      expect(map.warranty).toBe('warranty');
    });

    it('contains promotion field mapping', () => {
      const map = getFieldToDimensionMap();

      expect(map.promotion).toBe('promotion');
    });

    it('all mapped dimensions are valid TAILORING_DIMENSIONS or known values', () => {
      const map = getFieldToDimensionMap();
      const validDimensions = [...TAILORING_DIMENSIONS, 'other'];

      Object.values(map).forEach((dimension) => {
        expect(validDimensions).toContain(dimension);
      });
    });
  });

  describe('integration with real catalog data', () => {
    it('computes diff correctly for all mock catalog products', () => {
      mockCatalog.forEach((product) => {
        const variant = {
          variantPdp: {
            ...product,
            priceDisplay: 'savings-highlight',
            primaryCTA: 'Buy Now',
          },
        };

        const result = computeDiff(product, variant);

        expect(result.hasChanges).toBe(true);
        expect(result.totalChanges).toBeGreaterThanOrEqual(2);
        expect(result.dimensions).toContain('price');
        expect(result.dimensions).toContain('title');
      });
    });

    it('produces no diff when variant PDP is exact copy of catalog item', () => {
      mockCatalog.forEach((product) => {
        const variant = {
          variantPdp: { ...product },
        };

        const result = computeDiff(product, variant);

        expect(result.hasChanges).toBe(false);
        expect(result.totalChanges).toBe(0);
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty objects for both canonical and variant', () => {
      const result = computeDiff({}, { variantPdp: {} });

      expect(result.hasChanges).toBe(false);
      expect(result.totalChanges).toBe(0);
    });

    it('handles canonical with fields and empty variant', () => {
      const result = computeDiff(canonicalPdp, { variantPdp: {} });

      expect(result.hasChanges).toBe(true);
      expect(result.totalChanges).toBeGreaterThan(0);
    });

    it('handles empty canonical and variant with fields', () => {
      const result = computeDiff({}, {
        variantPdp: {
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
        },
      });

      expect(result.hasChanges).toBe(true);
      expect(result.totalChanges).toBeGreaterThanOrEqual(2);
    });

    it('handles boolean field changes correctly', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          showSavings: true,
          showMemberPrice: false,
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const showSavingsChange = result.changes.find((c) => c.field === 'showSavings');
      expect(showSavingsChange).toBeDefined();
      expect(showSavingsChange.to).toBe(true);
    });

    it('handles numeric field changes correctly', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          price: 1299.99,
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const priceChange = result.changes.find((c) => c.field === 'price');
      expect(priceChange).toBeDefined();
      expect(priceChange.from).toBe(canonicalPdp.price);
      expect(priceChange.to).toBe(1299.99);
      expect(priceChange.changeType).toBe('modified');
    });

    it('handles null field values in variant', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          badge: null,
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      if (canonicalPdp.badge) {
        const badgeChange = result.changes.find((c) => c.field === 'badge');
        expect(badgeChange).toBeDefined();
        expect(badgeChange.changeType).toBe('removed');
      }
    });

    it('handles undefined field values in variant', () => {
      const variantPdp = { ...canonicalPdp };
      delete variantPdp.badge;

      const variant = {
        variantPdp,
      };

      const result = computeDiff(canonicalPdp, variant);

      if (canonicalPdp.badge) {
        const badgeChange = result.changes.find((c) => c.field === 'badge');
        expect(badgeChange).toBeDefined();
        expect(badgeChange.changeType).toBe('removed');
      }
    });

    it('handles string field changes correctly', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          title: 'Completely Different Product Title',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const titleChange = result.changes.find((c) => c.field === 'title');
      expect(titleChange).toBeDefined();
      expect(titleChange.from).toBe(canonicalPdp.title);
      expect(titleChange.to).toBe('Completely Different Product Title');
    });

    it('totalChanges equals changes array length', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
          crossSellStrategy: 'bundle',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.totalChanges).toBe(result.changes.length);
    });

    it('dimensionsChanged equals dimensions array length', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      expect(result.dimensionsChanged).toBe(result.dimensions.length);
    });

    it('changesByDimension keys match dimensions array', () => {
      const variant = {
        variantPdp: {
          ...canonicalPdp,
          priceDisplay: 'savings-highlight',
          primaryCTA: 'Buy Now',
          crossSellStrategy: 'bundle',
        },
      };

      const result = computeDiff(canonicalPdp, variant);

      const changesByDimKeys = Object.keys(result.changesByDimension).sort();
      const dimensionsSorted = [...result.dimensions].sort();

      expect(changesByDimKeys).toEqual(dimensionsSorted);
    });
  });
});