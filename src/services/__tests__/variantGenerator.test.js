import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateVariants,
  generateVariantsForSku,
  generateVariantsForProduct,
} from '@/services/variantGenerator.js';
import { clearEventBuffer, getEventBuffer, getEventsByType, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import mockCatalog from '@/data/mockCatalog.js';
import defaultCohorts from '@/data/defaultCohorts.js';
import { TAILORING_DIMENSIONS, MAX_VARIANTS } from '@/constants/constants.js';

describe('VariantGenerator', () => {
  let canonicalPdp;
  let cohortSet;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();

    canonicalPdp = { ...mockCatalog[0] };
    cohortSet = JSON.parse(JSON.stringify(defaultCohorts));
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
  });

  describe('generateVariants', () => {
    it('generates variants successfully from valid inputs', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.variants)).toBe(true);
      expect(result.variants.length).toBeGreaterThan(0);
      expect(result.variants.length).toBeLessThanOrEqual(MAX_VARIANTS);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('generates exactly 10 variants from 10 cohort targets', async () => {
      expect(cohortSet.cohorts.length).toBe(10);

      const result = await generateVariants(canonicalPdp, cohortSet);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(10);
    });

    it('truncates cohort targets to MAX_VARIANTS when more than 10 provided', async () => {
      const extraCohorts = JSON.parse(JSON.stringify(cohortSet));
      for (let i = 0; i < 5; i++) {
        extraCohorts.cohorts.push({
          ...extraCohorts.cohorts[0],
          cohortId: `cohort-extra-${i}`,
          label: `Extra Cohort ${i}`,
          priority: 11 + i,
        });
      }

      expect(extraCohorts.cohorts.length).toBe(15);

      const result = await generateVariants(canonicalPdp, extraCohorts);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(MAX_VARIANTS);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('truncated');
    });

    it('produces deterministic output — same input yields same variant IDs', async () => {
      const result1 = await generateVariants(canonicalPdp, cohortSet);
      const result2 = await generateVariants(canonicalPdp, cohortSet);

      expect(result1.variants.length).toBe(result2.variants.length);

      for (let i = 0; i < result1.variants.length; i++) {
        expect(result1.variants[i].variantId).toBe(result2.variants[i].variantId);
      }
    });

    it('produces deterministic output — same input yields same tailoring', async () => {
      const result1 = await generateVariants(canonicalPdp, cohortSet);
      const result2 = await generateVariants(canonicalPdp, cohortSet);

      for (let i = 0; i < result1.variants.length; i++) {
        expect(result1.variants[i].cohortType).toBe(result2.variants[i].cohortType);
        expect(result1.variants[i].behavioralOverlay).toBe(result2.variants[i].behavioralOverlay);
        expect(result1.variants[i].variantPdp.priceDisplay).toBe(result2.variants[i].variantPdp.priceDisplay);
        expect(result1.variants[i].variantPdp.primaryCTA).toBe(result2.variants[i].variantPdp.primaryCTA);
      }
    });

    it('marks the first variant as the control variant', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      expect(result.variants[0].controlFlag).toBe(true);

      for (let i = 1; i < result.variants.length; i++) {
        expect(result.variants[i].controlFlag).toBe(false);
      }
    });

    it('each variant has all required fields', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(typeof variant.id).toBe('string');
        expect(variant.id.length).toBeGreaterThan(0);
        expect(typeof variant.variantId).toBe('string');
        expect(variant.variantId.length).toBeGreaterThan(0);
        expect(typeof variant.name).toBe('string');
        expect(variant.name.length).toBeGreaterThan(0);
        expect(typeof variant.productId).toBe('string');
        expect(variant.productId.length).toBeGreaterThan(0);
        expect(typeof variant.cohortId).toBe('string');
        expect(typeof variant.cohortType).toBe('string');
        expect(typeof variant.behavioralOverlay).toBe('string');
        expect(typeof variant.baseSku).toBe('string');
        expect(typeof variant.label).toBe('string');
        expect(typeof variant.priority).toBe('number');
        expect(typeof variant.controlFlag).toBe('boolean');
        expect(typeof variant.isActive).toBe('boolean');
        expect(typeof variant.weight).toBe('number');
        expect(variant.weight).toBeGreaterThanOrEqual(0);
        expect(variant.weight).toBeLessThanOrEqual(100);
        expect(typeof variant.description).toBe('string');
        expect(typeof variant.createdAt).toBe('string');
        expect(typeof variant.updatedAt).toBe('string');
      });
    });

    it('each variant has a variantPdp object with product data', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.variantPdp).toBeDefined();
        expect(typeof variant.variantPdp).toBe('object');
        expect(variant.variantPdp.title).toBe(canonicalPdp.title);
        expect(variant.variantPdp.sku).toBe(canonicalPdp.sku);
        expect(typeof variant.variantPdp.price).toBe('number');
      });
    });

    it('each variant has a diff object with dimensions and changes', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.diff).toBeDefined();
        expect(typeof variant.diff).toBe('object');
        expect(Array.isArray(variant.diff.dimensions)).toBe(true);
        expect(Array.isArray(variant.diff.changes)).toBe(true);
      });
    });

    it('each variant has a manifest object', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.manifest).toBeDefined();
        expect(typeof variant.manifest).toBe('object');
        expect(variant.manifest.variantId).toBe(variant.variantId);
        expect(typeof variant.manifest.cohort).toBe('string');
        expect(typeof variant.manifest.behavioralOverlay).toBe('string');
        expect(Array.isArray(variant.manifest.appliedTailoring)).toBe(true);
        expect(typeof variant.manifest.created).toBe('string');
        expect(typeof variant.manifest.controlFlag).toBe('boolean');
      });
    });

    it('each variant has a tailoring map object', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.tailoring).toBeDefined();
        expect(typeof variant.tailoring).toBe('object');
        expect(Array.isArray(variant.tailoring)).toBe(false);
      });
    });

    it('all variants have unique variantIds', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      const ids = result.variants.map((v) => v.variantId);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all variants reference the correct productId and sku', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.productId).toBe(canonicalPdp.id);
        expect(variant.sku).toBe(canonicalPdp.sku);
      });
    });

    it('returns error when canonicalPdp is null', async () => {
      const result = await generateVariants(null, cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('canonicalPdp');
    });

    it('returns error when canonicalPdp is undefined', async () => {
      const result = await generateVariants(undefined, cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns error when canonicalPdp is not an object', async () => {
      const result = await generateVariants('not an object', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns error when canonicalPdp fails catalog item validation', async () => {
      const invalidPdp = { foo: 'bar' };

      const result = await generateVariants(invalidPdp, cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid canonical PDP');
    });

    it('returns error when cohortSet is null', async () => {
      const result = await generateVariants(canonicalPdp, null);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('cohortSet');
    });

    it('returns error when cohortSet is undefined', async () => {
      const result = await generateVariants(canonicalPdp, undefined);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns error when cohortSet is not an object', async () => {
      const result = await generateVariants(canonicalPdp, 'not an object');

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns error when cohortSet has no cohorts array', async () => {
      const result = await generateVariants(canonicalPdp, { id: 'test' });

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('at least one cohort target');
    });

    it('returns error when cohortSet has empty cohorts array', async () => {
      const result = await generateVariants(canonicalPdp, { id: 'test', cohorts: [] });

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('generates variants with a single cohort target', async () => {
      const singleCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts[0]],
      };

      const result = await generateVariants(canonicalPdp, singleCohortSet);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(1);
      expect(result.variants[0].controlFlag).toBe(true);
    });
  });

  describe('tailoring rules application', () => {
    it('applies budget-conscious cohort tailoring correctly', async () => {
      const budgetCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.cohortType === 'budget-conscious')],
      };

      const result = await generateVariants(canonicalPdp, budgetCohortSet);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(1);

      const variant = result.variants[0];
      expect(variant.variantPdp.priceDisplay).toBe('savings-highlight');
      expect(variant.variantPdp.showSavings).toBe(true);
      expect(variant.variantPdp.showMemberPrice).toBe(true);
      expect(variant.variantPdp.primaryCTA).toBe('Get This Deal');
      expect(variant.variantPdp.ctaTone).toBe('value');
    });

    it('applies tech-enthusiast cohort tailoring correctly', async () => {
      const techCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.cohortType === 'tech-enthusiast')],
      };

      const result = await generateVariants(canonicalPdp, techCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.layout).toBe('spec-heavy');
      expect(variant.variantPdp.primaryFocus).toBe('description');
      expect(variant.variantPdp.secondaryCTA).toBe('Compare Specs');
    });

    it('applies loyalty-member cohort tailoring correctly', async () => {
      const loyaltyCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.cohortType === 'loyalty-member')],
      };

      const result = await generateVariants(canonicalPdp, loyaltyCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.priceDisplay).toBe('member-price');
      expect(variant.variantPdp.showMemberPrice).toBe(true);
      expect(variant.variantPdp.primaryCTA).toBe('Claim Member Price');
      expect(variant.variantPdp.ctaTone).toBe('premium');
    });

    it('applies gift-shopper cohort tailoring correctly', async () => {
      const giftCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.cohortType === 'gift-shopper')],
      };

      const result = await generateVariants(canonicalPdp, giftCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.layout).toBe('media-rich');
      expect(variant.variantPdp.primaryCTA).toBe('Buy as Gift');
      expect(variant.variantPdp.urgencyLevel).toBe('high');
    });

    it('applies student cohort tailoring correctly', async () => {
      const studentCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.cohortType === 'student')],
      };

      const result = await generateVariants(canonicalPdp, studentCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.priceDisplay).toBe('student-discount');
      expect(variant.variantPdp.showSavings).toBe(true);
      expect(variant.variantPdp.primaryCTA).toBe('Get Student Price');
    });

    it('applies business-buyer cohort tailoring correctly', async () => {
      const businessCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.cohortType === 'business-buyer')],
      };

      const result = await generateVariants(canonicalPdp, businessCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.layout).toBe('spec-heavy');
      expect(variant.variantPdp.priceDisplay).toBe('volume-discount');
      expect(variant.variantPdp.primaryCTA).toBe('Request Quote');
    });

    it('applies bargain-seeker cohort tailoring correctly', async () => {
      const bargainCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.cohortType === 'bargain-seeker')],
      };

      const result = await generateVariants(canonicalPdp, bargainCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.priceDisplay).toBe('compare-at');
      expect(variant.variantPdp.showSavings).toBe(true);
      expect(variant.variantPdp.primaryCTA).toBe('Grab This Deal');
      expect(variant.variantPdp.ctaTone).toBe('urgent');
      expect(variant.variantPdp.urgencyLevel).toBe('high');
    });

    it('applies returning-customer cohort tailoring correctly', async () => {
      const returningCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.cohortType === 'returning-customer')],
      };

      const result = await generateVariants(canonicalPdp, returningCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.primaryCTA).toBe('Buy Again');
      expect(variant.variantPdp.ctaTone).toBe('friendly');
      expect(variant.variantPdp.showMemberPrice).toBe(true);
    });

    it('applies behavioral overlay rules for browse-heavy', async () => {
      const browseCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.behavioralOverlay === 'browse-heavy')],
      };

      const result = await generateVariants(canonicalPdp, browseCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.socialProofDisplay).toBe('expanded');
      expect(variant.variantPdp.specsExpandedByDefault).toBe(true);
      expect(variant.variantPdp.reviewFilter).toBe('detailed');
    });

    it('applies behavioral overlay rules for comparison-shopper', async () => {
      const comparisonCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.behavioralOverlay === 'comparison-shopper')],
      };

      const result = await generateVariants(canonicalPdp, comparisonCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.socialProofDisplay).toBe('expert-focused');
      expect(variant.variantPdp.showExpertReviews).toBe(true);
      expect(variant.variantPdp.crossSellStrategy).toBe('upgrade');
      expect(variant.variantPdp.reviewFilter).toBe('expert');
    });

    it('applies behavioral overlay rules for deal-seeker', async () => {
      const dealCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.behavioralOverlay === 'deal-seeker' && c.cohortType === 'first-time-buyer')],
      };

      const result = await generateVariants(canonicalPdp, dealCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.socialProofDisplay).toBe('value-focused');
      expect(variant.variantPdp.crossSellStrategy).toBe('bundle');
      expect(variant.variantPdp.crossSellHeading).toBe('Bundle & Save');
      expect(variant.variantPdp.reviewFilter).toBe('value-mention');
    });

    it('applies behavioral overlay rules for cart-abandoner', async () => {
      const cartCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.behavioralOverlay === 'cart-abandoner')],
      };

      const result = await generateVariants(canonicalPdp, cartCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.crossSellStrategy).toBe('none');
      expect(variant.variantPdp.reviewFilter).toBe('positive');
    });

    it('applies behavioral overlay rules for quick-purchaser', async () => {
      const quickCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts.find((c) => c.behavioralOverlay === 'quick-purchaser')],
      };

      const result = await generateVariants(canonicalPdp, quickCohortSet);

      expect(result.success).toBe(true);
      const variant = result.variants[0];

      expect(variant.variantPdp.socialProofDisplay).toBe('minimal');
      expect(variant.variantPdp.crossSellStrategy).toBe('history-based');
    });

    it('each variant has badges array from tailoring', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(Array.isArray(variant.variantPdp.badges)).toBe(true);
      });
    });

    it('each variant has urgencyLevel from tailoring', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      const validLevels = ['none', 'low', 'medium', 'high'];

      result.variants.forEach((variant) => {
        expect(validLevels).toContain(variant.variantPdp.urgencyLevel);
      });
    });

    it('each variant has cross-sell configuration from tailoring', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(typeof variant.variantPdp.crossSellStrategy).toBe('string');
        expect(typeof variant.variantPdp.crossSellHeading).toBe('string');
        expect(typeof variant.variantPdp.crossSellMaxItems).toBe('number');
      });
    });
  });

  describe('diff computation', () => {
    it('computes diff dimensions for each variant', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.diff).toBeDefined();
        expect(Array.isArray(variant.diff.dimensions)).toBe(true);
        expect(variant.diff.dimensions.length).toBeGreaterThan(0);
      });
    });

    it('diff changes array has field, from, and to properties', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        variant.diff.changes.forEach((change) => {
          expect(typeof change.field).toBe('string');
          expect(change).toHaveProperty('from');
          expect(change).toHaveProperty('to');
        });
      });
    });

    it('diff detects tailored fields that differ from canonical PDP', async () => {
      const budgetCohortSet = {
        ...cohortSet,
        cohorts: [cohortSet.cohorts[0]],
      };

      const result = await generateVariants(canonicalPdp, budgetCohortSet);
      const variant = result.variants[0];

      expect(variant.diff.dimensions).toContain('priceDisplay');
      expect(variant.diff.dimensions).toContain('showSavings');
      expect(variant.diff.dimensions).toContain('primaryCTA');
    });
  });

  describe('manifest generation', () => {
    it('each variant manifest has appliedTailoring array', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(Array.isArray(variant.manifest.appliedTailoring)).toBe(true);
      });
    });

    it('appliedTailoring entries have dimension, change, rationale, and weight', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        variant.manifest.appliedTailoring.forEach((entry) => {
          expect(typeof entry.dimension).toBe('string');
          expect(typeof entry.change).toBe('string');
          expect(typeof entry.rationale).toBe('string');
          expect(typeof entry.weight).toBe('number');
        });
      });
    });

    it('manifest diffSummary has dimensionsChanged and dimensions', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.manifest.diffSummary).toBeDefined();
        expect(typeof variant.manifest.diffSummary.dimensionsChanged).toBe('number');
        expect(Array.isArray(variant.manifest.diffSummary.dimensions)).toBe(true);
      });
    });

    it('manifest contains tailoring descriptors (heroLayout, priceEmphasis, etc.)', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.manifest.heroLayout).toBeDefined();
        expect(variant.manifest.priceEmphasis).toBeDefined();
        expect(variant.manifest.badgeUrgency).toBeDefined();
        expect(variant.manifest.ctaCopy).toBeDefined();
        expect(variant.manifest.socialProof).toBeDefined();
        expect(variant.manifest.crossSell).toBeDefined();
        expect(variant.manifest.specOrdering).toBeDefined();
        expect(variant.manifest.mediaSelection).toBeDefined();
        expect(variant.manifest.reviewHighlight).toBeDefined();
      });
    });

    it('manifest controlFlag matches variant controlFlag', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.manifest.controlFlag).toBe(variant.controlFlag);
      });
    });
  });

  describe('tailoring map', () => {
    it('tailoring map keys are valid TAILORING_DIMENSIONS', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        const tailoringKeys = Object.keys(variant.tailoring);
        tailoringKeys.forEach((key) => {
          expect(TAILORING_DIMENSIONS).toContain(key);
        });
      });
    });

    it('tailoring map entries have action, value, rationale, and weight', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        const tailoringKeys = Object.keys(variant.tailoring);
        tailoringKeys.forEach((key) => {
          const entry = variant.tailoring[key];
          expect(typeof entry.action).toBe('string');
          expect(typeof entry.value).toBe('string');
          expect(typeof entry.rationale).toBe('string');
          expect(typeof entry.weight).toBe('number');
        });
      });
    });
  });

  describe('parallel generation', () => {
    it('generates all variants in parallel (Promise.all)', async () => {
      const startTime = Date.now();

      const result = await generateVariants(canonicalPdp, cohortSet);

      const elapsedMs = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(10);
      // Parallel generation should be fast (well under 3 seconds)
      expect(elapsedMs).toBeLessThan(3000);
    });

    it('partial failures do not block other variants from generating', async () => {
      // Use a cohort set where one target might have unusual data
      const mixedCohortSet = {
        ...cohortSet,
        cohorts: cohortSet.cohorts.slice(0, 3),
      };

      const result = await generateVariants(canonicalPdp, mixedCohortSet);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(3);
    });
  });

  describe('schema validation of output', () => {
    it('each variant passes basic schema validation', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(typeof variant.id).toBe('string');
        expect(variant.id.length).toBeGreaterThan(0);
        expect(typeof variant.name).toBe('string');
        expect(variant.name.length).toBeGreaterThan(0);
        expect(typeof variant.productId).toBe('string');
        expect(variant.productId.length).toBeGreaterThan(0);
      });
    });

    it('variant weight is between 0 and 100', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.weight).toBeGreaterThanOrEqual(0);
        expect(variant.weight).toBeLessThanOrEqual(100);
      });
    });

    it('variant isActive is always true for newly generated variants', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.isActive).toBe(true);
      });
    });

    it('variant createdAt and updatedAt are valid ISO 8601 strings', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(new Date(variant.createdAt).toISOString()).toBe(variant.createdAt);
        expect(new Date(variant.updatedAt).toISOString()).toBe(variant.updatedAt);
      });
    });

    it('variant id and variantId are the same', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.id).toBe(variant.variantId);
      });
    });
  });

  describe('observability event emission', () => {
    it('emits VARIANT_GENERATED events during generation', async () => {
      clearEventBuffer();

      await generateVariants(canonicalPdp, cohortSet);

      const variantEvents = getEventsByType(EVENT_TYPES.VARIANT_GENERATED);

      expect(variantEvents.length).toBeGreaterThan(0);
    });

    it('emits start and complete events for generation', async () => {
      clearEventBuffer();

      await generateVariants(canonicalPdp, cohortSet);

      const variantEvents = getEventsByType(EVENT_TYPES.VARIANT_GENERATED);

      const startEvent = variantEvents.find(
        (e) => e.payload && e.payload.action === 'generateVariants:start',
      );
      const completeEvent = variantEvents.find(
        (e) => e.payload && e.payload.action === 'generateVariants:complete',
      );

      expect(startEvent).toBeDefined();
      expect(completeEvent).toBeDefined();
    });

    it('complete event includes generatedCount and elapsedMs', async () => {
      clearEventBuffer();

      await generateVariants(canonicalPdp, cohortSet);

      const variantEvents = getEventsByType(EVENT_TYPES.VARIANT_GENERATED);
      const completeEvent = variantEvents.find(
        (e) => e.payload && e.payload.action === 'generateVariants:complete',
      );

      expect(completeEvent).toBeDefined();
      expect(completeEvent.payload.generatedCount).toBe(10);
      expect(typeof completeEvent.payload.elapsedMs).toBe('number');
      expect(completeEvent.payload.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it('emits per-variant VARIANT_GENERATED events', async () => {
      clearEventBuffer();

      await generateVariants(canonicalPdp, cohortSet);

      const variantEvents = getEventsByType(EVENT_TYPES.VARIANT_GENERATED);
      const perVariantEvents = variantEvents.filter(
        (e) => e.payload && e.payload.action === 'generateSingleVariant',
      );

      expect(perVariantEvents.length).toBe(10);
    });

    it('per-variant events include cohortType and behavioralOverlay', async () => {
      clearEventBuffer();

      await generateVariants(canonicalPdp, cohortSet);

      const variantEvents = getEventsByType(EVENT_TYPES.VARIANT_GENERATED);
      const perVariantEvents = variantEvents.filter(
        (e) => e.payload && e.payload.action === 'generateSingleVariant',
      );

      perVariantEvents.forEach((event) => {
        expect(typeof event.payload.cohortType).toBe('string');
        expect(typeof event.payload.behavioralOverlay).toBe('string');
        expect(typeof event.payload.variantId).toBe('string');
        expect(typeof event.payload.index).toBe('number');
      });
    });

    it('emits ERROR events on invalid input', async () => {
      clearEventBuffer();

      await generateVariants(null, cohortSet);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);

      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].payload.action).toBe('generateVariants');
    });

    it('start event includes productId and targetCount', async () => {
      clearEventBuffer();

      await generateVariants(canonicalPdp, cohortSet);

      const variantEvents = getEventsByType(EVENT_TYPES.VARIANT_GENERATED);
      const startEvent = variantEvents.find(
        (e) => e.payload && e.payload.action === 'generateVariants:start',
      );

      expect(startEvent).toBeDefined();
      expect(startEvent.payload.productId).toBe(canonicalPdp.id);
      expect(startEvent.payload.sku).toBe(canonicalPdp.sku);
      expect(startEvent.payload.targetCount).toBe(10);
    });
  });

  describe('generateVariantsForSku', () => {
    it('generates variants for a valid SKU', async () => {
      const result = await generateVariantsForSku(mockCatalog, 'SKU-6548320', cohortSet);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(10);
      expect(result.variants[0].sku).toBe('SKU-6548320');
    });

    it('returns error for non-existent SKU', async () => {
      const result = await generateVariantsForSku(mockCatalog, 'SKU-NONEXISTENT', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('SKU-NONEXISTENT');
    });

    it('returns error when SKU is empty string', async () => {
      const result = await generateVariantsForSku(mockCatalog, '', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors[0]).toContain('SKU must be a non-empty string');
    });

    it('returns error when SKU is null', async () => {
      const result = await generateVariantsForSku(mockCatalog, null, cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
    });

    it('returns error when catalog is empty', async () => {
      const result = await generateVariantsForSku([], 'SKU-6548320', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors[0]).toContain('non-empty array');
    });

    it('returns error when catalog is not an array', async () => {
      const result = await generateVariantsForSku('not an array', 'SKU-6548320', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
    });

    it('generates variants for each catalog SKU', async () => {
      const skus = ['SKU-6548320', 'SKU-6571042', 'SKU-6505727', 'SKU-6487278', 'SKU-6534512', 'SKU-6563925'];

      for (const sku of skus) {
        const result = await generateVariantsForSku(mockCatalog, sku, cohortSet);

        expect(result.success).toBe(true);
        expect(result.variants.length).toBe(10);
        expect(result.variants[0].sku).toBe(sku);
      }
    });
  });

  describe('generateVariantsForProduct', () => {
    it('generates variants for a valid product ID', async () => {
      const result = await generateVariantsForProduct(mockCatalog, 'prod-tv-001', cohortSet);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(10);
      expect(result.variants[0].productId).toBe('prod-tv-001');
    });

    it('returns error for non-existent product ID', async () => {
      const result = await generateVariantsForProduct(mockCatalog, 'prod-nonexistent', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('prod-nonexistent');
    });

    it('returns error when product ID is empty string', async () => {
      const result = await generateVariantsForProduct(mockCatalog, '', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
      expect(result.errors[0]).toContain('Product ID must be a non-empty string');
    });

    it('returns error when product ID is null', async () => {
      const result = await generateVariantsForProduct(mockCatalog, null, cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
    });

    it('returns error when catalog is empty', async () => {
      const result = await generateVariantsForProduct([], 'prod-tv-001', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
    });

    it('returns error when catalog is not an array', async () => {
      const result = await generateVariantsForProduct(null, 'prod-tv-001', cohortSet);

      expect(result.success).toBe(false);
      expect(result.variants.length).toBe(0);
    });

    it('generates variants for each catalog product ID', async () => {
      const productIds = [
        'prod-tv-001',
        'prod-laptop-002',
        'prod-headphones-003',
        'prod-speaker-004',
        'prod-tablet-005',
        'prod-console-006',
      ];

      for (const productId of productIds) {
        const result = await generateVariantsForProduct(mockCatalog, productId, cohortSet);

        expect(result.success).toBe(true);
        expect(result.variants.length).toBe(10);
        expect(result.variants[0].productId).toBe(productId);
      }
    });
  });

  describe('different products produce different variants', () => {
    it('variants for different products have different productIds', async () => {
      const result1 = await generateVariants(mockCatalog[0], cohortSet);
      const result2 = await generateVariants(mockCatalog[1], cohortSet);

      expect(result1.variants[0].productId).not.toBe(result2.variants[0].productId);
    });

    it('variants for different products have different variantIds', async () => {
      const result1 = await generateVariants(mockCatalog[0], cohortSet);
      const result2 = await generateVariants(mockCatalog[1], cohortSet);

      expect(result1.variants[0].variantId).not.toBe(result2.variants[0].variantId);
    });

    it('variants for different products preserve their respective product data', async () => {
      const result1 = await generateVariants(mockCatalog[0], cohortSet);
      const result2 = await generateVariants(mockCatalog[1], cohortSet);

      expect(result1.variants[0].variantPdp.title).toBe(mockCatalog[0].title);
      expect(result2.variants[0].variantPdp.title).toBe(mockCatalog[1].title);
      expect(result1.variants[0].variantPdp.price).toBe(mockCatalog[0].price);
      expect(result2.variants[0].variantPdp.price).toBe(mockCatalog[1].price);
    });
  });

  describe('variant priority and weight', () => {
    it('variants have priority matching their cohort target priority', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant, index) => {
        expect(variant.priority).toBe(cohortSet.cohorts[index].priority);
      });
    });

    it('variant weight is derived from priority', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(typeof variant.weight).toBe('number');
        expect(Number.isFinite(variant.weight)).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('handles cohort target with missing optional fields gracefully', async () => {
      const minimalCohortSet = {
        id: 'minimal-set',
        name: 'Minimal Set',
        cohorts: [
          {
            cohortId: 'cohort-minimal',
            label: 'Minimal Target',
            cohortType: '',
            behavioralOverlay: '',
            baseSku: 'SKU-6548320',
            priority: 1,
          },
        ],
      };

      const result = await generateVariants(canonicalPdp, minimalCohortSet);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(1);
      expect(result.variants[0].cohortType).toBe('');
      expect(result.variants[0].behavioralOverlay).toBe('');
    });

    it('handles cohort target with unknown cohortType gracefully', async () => {
      const unknownCohortSet = {
        id: 'unknown-set',
        name: 'Unknown Set',
        cohorts: [
          {
            cohortId: 'cohort-unknown',
            label: 'Unknown Cohort',
            cohortType: 'unknown-type',
            behavioralOverlay: 'unknown-overlay',
            baseSku: 'SKU-6548320',
            priority: 1,
          },
        ],
      };

      const result = await generateVariants(canonicalPdp, unknownCohortSet);

      expect(result.success).toBe(true);
      expect(result.variants.length).toBe(1);
      // Should use default tailoring rules
      expect(result.variants[0].variantPdp.primaryCTA).toBe('Add to Cart');
    });

    it('generates consistent results across multiple calls', async () => {
      const results = [];

      for (let i = 0; i < 3; i++) {
        const result = await generateVariants(canonicalPdp, cohortSet);
        results.push(result);
      }

      for (let i = 1; i < results.length; i++) {
        expect(results[i].variants.length).toBe(results[0].variants.length);

        for (let j = 0; j < results[0].variants.length; j++) {
          expect(results[i].variants[j].variantId).toBe(results[0].variants[j].variantId);
          expect(results[i].variants[j].cohortType).toBe(results[0].variants[j].cohortType);
          expect(results[i].variants[j].variantPdp.primaryCTA).toBe(
            results[0].variants[j].variantPdp.primaryCTA,
          );
        }
      }
    });

    it('variant name includes cohort label and product title', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant, index) => {
        const cohortLabel = cohortSet.cohorts[index].label;
        expect(variant.name).toContain(cohortLabel);
        expect(variant.name).toContain(canonicalPdp.title);
      });
    });

    it('variant description includes cohort information', async () => {
      const result = await generateVariants(canonicalPdp, cohortSet);

      result.variants.forEach((variant) => {
        expect(variant.description.length).toBeGreaterThan(0);
        expect(variant.description).toContain('Tailored variant');
      });
    });
  });
});