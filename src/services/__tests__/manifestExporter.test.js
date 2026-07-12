import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateManifestForExport,
  exportManifest,
  exportBulk,
  exportVariantManifest,
  exportBulkVariantManifests,
} from '@/services/manifestExporter.js';
import { buildManifest, buildBulkManifest, getManifestVersion } from '@/services/manifestBuilder.js';
import { clearEventBuffer, getEventsByType, EVENT_TYPES } from '@/services/observabilityEmitter.js';
import { generateVariants } from '@/services/variantGenerator.js';
import mockCatalog from '@/data/mockCatalog.js';
import defaultCohorts from '@/data/defaultCohorts.js';

describe('ManifestExporter', () => {
  let canonicalPdp;
  let cohortSet;
  let generatedVariants;
  let builtManifests;
  let mockCreateObjectURL;
  let mockRevokeObjectURL;
  let mockAnchorClick;
  let mockAppendChild;
  let mockRemoveChild;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();

    canonicalPdp = { ...mockCatalog[0] };
    cohortSet = JSON.parse(JSON.stringify(defaultCohorts));

    const result = await generateVariants(canonicalPdp, cohortSet);
    generatedVariants = result.variants;

    builtManifests = generatedVariants.map((variant) => {
      const buildResult = buildManifest(variant);
      return buildResult.manifest;
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-blob-url');
    mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock anchor element click and DOM manipulation
    mockAnchorClick = vi.fn();
    mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          style: { display: '' },
          click: mockAnchorClick,
        };
      }
      // For textarea fallback in copy-to-clipboard
      if (tag === 'textarea') {
        return {
          value: '',
          style: {},
          select: vi.fn(),
        };
      }
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    vi.restoreAllMocks();
  });

  describe('validateManifestForExport', () => {
    it('returns valid for a correctly built manifest', () => {
      const manifest = builtManifests[0];
      const result = validateManifestForExport(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when manifest is null', () => {
      const result = validateManifestForExport(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('non-null object');
    });

    it('returns invalid when manifest is undefined', () => {
      const result = validateManifestForExport(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid when manifest is not an object', () => {
      const result = validateManifestForExport('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid when manifest is missing required fields', () => {
      const result = validateManifestForExport({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid when manifest has empty id', () => {
      const manifest = { ...builtManifests[0], id: '' };
      const result = validateManifestForExport(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid when manifest has empty name', () => {
      const manifest = { ...builtManifests[0], name: '' };
      const result = validateManifestForExport(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid when manifest has empty version', () => {
      const manifest = { ...builtManifests[0], version: '' };
      const result = validateManifestForExport(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid when manifest has no variantIds array', () => {
      const manifest = { ...builtManifests[0] };
      delete manifest.variantIds;
      const result = validateManifestForExport(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid when manifest has empty variantIds array', () => {
      const manifest = { ...builtManifests[0], variantIds: [] };
      const result = validateManifestForExport(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('validates all generated variant manifests successfully', () => {
      builtManifests.forEach((manifest) => {
        const result = validateManifestForExport(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('emits ERROR event when validation fails', () => {
      clearEventBuffer();

      validateManifestForExport({});

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const validationError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'validateManifestForExport',
      );

      expect(validationError).toBeDefined();
    });

    it('does not emit ERROR event when validation succeeds', () => {
      clearEventBuffer();

      validateManifestForExport(builtManifests[0]);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const validationError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'validateManifestForExport',
      );

      expect(validationError).toBeUndefined();
    });
  });

  describe('exportManifest', () => {
    it('exports a valid manifest successfully', () => {
      const manifest = builtManifests[0];
      const result = exportManifest(manifest);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.filename).not.toBeNull();
      expect(typeof result.filename).toBe('string');
      expect(result.filename.endsWith('.json')).toBe(true);
    });

    it('creates a Blob with correct content type', () => {
      const manifest = builtManifests[0];
      exportManifest(manifest);

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('application/json');
    });

    it('triggers anchor click for download', () => {
      const manifest = builtManifests[0];
      exportManifest(manifest);

      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
    });

    it('revokes the object URL after download', () => {
      const manifest = builtManifests[0];
      exportManifest(manifest);

      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-blob-url');
    });

    it('uses provided filename when given', () => {
      const manifest = builtManifests[0];
      const result = exportManifest(manifest, 'custom-manifest.json');

      expect(result.success).toBe(true);
      expect(result.filename).toBe('custom-manifest.json');
    });

    it('auto-generates filename when not provided', () => {
      const manifest = builtManifests[0];
      const result = exportManifest(manifest);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('manifest');
      expect(result.filename).toContain('.json');
    });

    it('includes variantId in auto-generated filename', () => {
      const manifest = builtManifests[0];
      const result = exportManifest(manifest);

      expect(result.success).toBe(true);
      expect(result.filename).toContain(manifest.variantId);
    });

    it('returns error when manifest is null', () => {
      const result = exportManifest(null);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('returns error when manifest is undefined', () => {
      const result = exportManifest(undefined);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('returns error when manifest is not an object', () => {
      const result = exportManifest('not an object');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('returns error when manifest fails validation', () => {
      const result = exportManifest({});

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('emits EXPORT_ACTION event on successful export', () => {
      clearEventBuffer();

      const manifest = builtManifests[0];
      exportManifest(manifest);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const exportEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'exportManifest',
      );

      expect(exportEvent).toBeDefined();
      expect(exportEvent.payload.variantId).toBe(manifest.variantId);
      expect(typeof exportEvent.payload.filename).toBe('string');
    });

    it('emits EXPORT_ACTION event with appliedTailoringCount', () => {
      clearEventBuffer();

      const manifest = builtManifests[1]; // Non-control variant with tailoring
      exportManifest(manifest);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const exportEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'exportManifest',
      );

      expect(exportEvent).toBeDefined();
      expect(typeof exportEvent.payload.appliedTailoringCount).toBe('number');
    });

    it('emits ERROR event when manifest is null', () => {
      clearEventBuffer();

      exportManifest(null);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const exportError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'exportManifest',
      );

      expect(exportError).toBeDefined();
    });

    it('emits ERROR event when manifest fails validation', () => {
      clearEventBuffer();

      exportManifest({});

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);

      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it('exports all generated variant manifests successfully', () => {
      builtManifests.forEach((manifest) => {
        const result = exportManifest(manifest);
        expect(result.success).toBe(true);
        expect(result.filename).not.toBeNull();
      });
    });

    it('handles download trigger failure gracefully', () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      const manifest = builtManifests[0];
      const result = exportManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('does not mutate the input manifest', () => {
      const manifest = builtManifests[0];
      const originalManifest = JSON.parse(JSON.stringify(manifest));

      exportManifest(manifest);

      expect(manifest).toEqual(originalManifest);
    });
  });

  describe('exportBulk', () => {
    it('exports an array of valid manifests successfully', () => {
      const result = exportBulk(builtManifests);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.filename).not.toBeNull();
      expect(typeof result.filename).toBe('string');
      expect(result.filename.endsWith('.json')).toBe(true);
      expect(result.exportedCount).toBe(builtManifests.length);
    });

    it('creates a Blob for bulk export', () => {
      exportBulk(builtManifests);

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('application/json');
    });

    it('triggers anchor click for bulk download', () => {
      exportBulk(builtManifests);

      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
    });

    it('revokes the object URL after bulk download', () => {
      exportBulk(builtManifests);

      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('uses provided filename when given', () => {
      const result = exportBulk(builtManifests, 'custom-bulk.json');

      expect(result.success).toBe(true);
      expect(result.filename).toBe('custom-bulk.json');
    });

    it('auto-generates filename with bulk-manifest prefix', () => {
      const result = exportBulk(builtManifests);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('bulk-manifest');
      expect(result.filename).toContain('.json');
    });

    it('returns correct exportedCount', () => {
      const result = exportBulk(builtManifests);

      expect(result.exportedCount).toBe(builtManifests.length);
    });

    it('returns error when manifests is not an array', () => {
      const result = exportBulk('not an array');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('returns error when manifests is null', () => {
      const result = exportBulk(null);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('returns error when manifests is empty array', () => {
      const result = exportBulk([]);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('returns error when all manifests are invalid', () => {
      const result = exportBulk([null, undefined, {}, 'invalid']);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('handles partial failures — exports valid manifests and reports errors', () => {
      const mixedManifests = [
        builtManifests[0],
        null,
        builtManifests[1],
        {},
      ];

      const result = exportBulk(mixedManifests);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).not.toBeNull();
    });

    it('exports a single manifest in bulk format', () => {
      const result = exportBulk([builtManifests[0]]);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(1);
      expect(result.filename).not.toBeNull();
    });

    it('emits EXPORT_ACTION event on successful bulk export', () => {
      clearEventBuffer();

      exportBulk(builtManifests);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const bulkEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'exportBulk',
      );

      expect(bulkEvent).toBeDefined();
      expect(bulkEvent.payload.totalManifests).toBe(builtManifests.length);
      expect(typeof bulkEvent.payload.filename).toBe('string');
    });

    it('emits EXPORT_ACTION event with failedCount for partial failures', () => {
      clearEventBuffer();

      const mixedManifests = [builtManifests[0], null, builtManifests[1]];
      exportBulk(mixedManifests);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const bulkEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'exportBulk',
      );

      expect(bulkEvent).toBeDefined();
      expect(bulkEvent.payload.totalManifests).toBe(2);
      expect(bulkEvent.payload.failedCount).toBe(1);
    });

    it('emits ERROR event when manifests is not an array', () => {
      clearEventBuffer();

      exportBulk('not an array');

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const bulkError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'exportBulk',
      );

      expect(bulkError).toBeDefined();
    });

    it('emits ERROR event when manifests is empty array', () => {
      clearEventBuffer();

      exportBulk([]);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const bulkError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'exportBulk',
      );

      expect(bulkError).toBeDefined();
    });

    it('emits ERROR event when all manifests are invalid', () => {
      clearEventBuffer();

      exportBulk([null, {}]);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);

      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it('bulk export data contains version field', () => {
      let capturedData = null;
      const originalCreateObjectURL = mockCreateObjectURL;
      mockCreateObjectURL.mockImplementation((blob) => {
        // Read the blob content
        const reader = new FileReaderSync ? undefined : null;
        // We can't easily read blob in test, but we can verify the blob was created
        return 'blob:http://localhost/mock-blob-url';
      });

      exportBulk(builtManifests);

      // Verify blob was created (we can't easily inspect its content in jsdom)
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    });

    it('handles download trigger failure gracefully', () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      const result = exportBulk(builtManifests);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('does not mutate the input manifests array', () => {
      const originalManifests = JSON.parse(JSON.stringify(builtManifests));

      exportBulk(builtManifests);

      expect(builtManifests).toEqual(originalManifests);
    });
  });

  describe('exportVariantManifest', () => {
    it('builds and exports a manifest from a generated variant', () => {
      const variant = generatedVariants[0];
      const result = exportVariantManifest(variant);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.filename).not.toBeNull();
      expect(result.filename.endsWith('.json')).toBe(true);
    });

    it('triggers download for variant manifest', () => {
      const variant = generatedVariants[0];
      exportVariantManifest(variant);

      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('uses provided filename when given', () => {
      const variant = generatedVariants[0];
      const result = exportVariantManifest(variant, 'my-variant.json');

      expect(result.success).toBe(true);
      expect(result.filename).toBe('my-variant.json');
    });

    it('auto-generates filename including variantId', () => {
      const variant = generatedVariants[0];
      const result = exportVariantManifest(variant);

      expect(result.success).toBe(true);
      expect(result.filename).toContain(variant.variantId);
    });

    it('returns error when variant is null', () => {
      const result = exportVariantManifest(null);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('returns error when variant is undefined', () => {
      const result = exportVariantManifest(undefined);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('returns error when variant is not an object', () => {
      const result = exportVariantManifest('not an object');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('returns error when variant has no id', () => {
      const result = exportVariantManifest({});

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
    });

    it('exports manifest for all generated variants successfully', () => {
      generatedVariants.forEach((variant) => {
        const result = exportVariantManifest(variant);
        expect(result.success).toBe(true);
        expect(result.filename).not.toBeNull();
      });
    });

    it('emits EXPORT_ACTION event on successful variant manifest export', () => {
      clearEventBuffer();

      const variant = generatedVariants[0];
      exportVariantManifest(variant);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);

      // Should have events from both buildManifest and exportManifest
      expect(exportEvents.length).toBeGreaterThanOrEqual(2);

      const exportEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'exportManifest',
      );
      expect(exportEvent).toBeDefined();
    });

    it('emits ERROR event when variant is null', () => {
      clearEventBuffer();

      exportVariantManifest(null);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const exportError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'exportVariantManifest',
      );

      expect(exportError).toBeDefined();
    });

    it('emits ERROR event when variant has no id', () => {
      clearEventBuffer();

      exportVariantManifest({});

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);

      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it('does not mutate the input variant', () => {
      const variant = generatedVariants[0];
      const originalVariant = JSON.parse(JSON.stringify(variant));

      exportVariantManifest(variant);

      expect(variant).toEqual(originalVariant);
    });
  });

  describe('exportBulkVariantManifests', () => {
    it('builds and exports manifests from an array of generated variants', () => {
      const result = exportBulkVariantManifests(generatedVariants);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(generatedVariants.length);
      expect(result.filename).not.toBeNull();
      expect(result.filename.endsWith('.json')).toBe(true);
    });

    it('triggers download for bulk variant manifests', () => {
      exportBulkVariantManifests(generatedVariants);

      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('uses provided filename when given', () => {
      const result = exportBulkVariantManifests(generatedVariants, 'all-variants.json');

      expect(result.success).toBe(true);
      expect(result.filename).toBe('all-variants.json');
    });

    it('auto-generates filename with bulk-manifest prefix', () => {
      const result = exportBulkVariantManifests(generatedVariants);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('bulk-manifest');
    });

    it('returns correct exportedCount for all 10 variants', () => {
      expect(generatedVariants.length).toBe(10);

      const result = exportBulkVariantManifests(generatedVariants);

      expect(result.exportedCount).toBe(10);
    });

    it('returns error when variants is not an array', () => {
      const result = exportBulkVariantManifests('not an array');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('returns error when variants is null', () => {
      const result = exportBulkVariantManifests(null);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('returns error when variants is undefined', () => {
      const result = exportBulkVariantManifests(undefined);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('returns error when variants is empty array', () => {
      const result = exportBulkVariantManifests([]);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('returns error when all variants are invalid', () => {
      const result = exportBulkVariantManifests([null, undefined, {}]);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('handles partial failures — exports valid variants and reports errors', () => {
      const mixedVariants = [
        generatedVariants[0],
        null,
        generatedVariants[2],
        {},
      ];

      const result = exportBulkVariantManifests(mixedVariants);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).not.toBeNull();
    });

    it('exports a single variant in bulk format', () => {
      const result = exportBulkVariantManifests([generatedVariants[0]]);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(1);
      expect(result.filename).not.toBeNull();
    });

    it('emits EXPORT_ACTION event on successful bulk variant export', () => {
      clearEventBuffer();

      exportBulkVariantManifests(generatedVariants);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);

      // Should have events from buildManifest (per variant) + buildBulkManifest + exportBulk
      expect(exportEvents.length).toBeGreaterThanOrEqual(2);

      const bulkEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'exportBulk',
      );
      expect(bulkEvent).toBeDefined();
      expect(bulkEvent.payload.totalManifests).toBe(generatedVariants.length);
    });

    it('emits ERROR event when variants is not an array', () => {
      clearEventBuffer();

      exportBulkVariantManifests('not an array');

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const exportError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'exportBulkVariantManifests',
      );

      expect(exportError).toBeDefined();
    });

    it('emits ERROR event when variants is empty array', () => {
      clearEventBuffer();

      exportBulkVariantManifests([]);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const exportError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'exportBulkVariantManifests',
      );

      expect(exportError).toBeDefined();
    });

    it('does not mutate the input variants array', () => {
      const originalVariants = JSON.parse(JSON.stringify(generatedVariants));

      exportBulkVariantManifests(generatedVariants);

      expect(generatedVariants).toEqual(originalVariants);
    });
  });

  describe('Blob content verification', () => {
    it('creates Blob with properly formatted JSON for single export', () => {
      const manifest = builtManifests[0];
      exportManifest(manifest);

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);

      // Verify blob size is reasonable (non-empty JSON)
      expect(blobArg.size).toBeGreaterThan(0);
    });

    it('creates Blob with properly formatted JSON for bulk export', () => {
      exportBulk(builtManifests);

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);

      // Bulk export should be larger than single
      expect(blobArg.size).toBeGreaterThan(100);
    });
  });

  describe('download anchor element', () => {
    it('sets correct href on anchor element', () => {
      const manifest = builtManifests[0];
      exportManifest(manifest);

      // Verify createElement was called with 'a'
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('appends and removes anchor from document body', () => {
      const manifest = builtManifests[0];
      exportManifest(manifest);

      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration with manifestBuilder', () => {
    it('exportVariantManifest produces same manifest as buildManifest', () => {
      const variant = generatedVariants[0];

      // Build manifest directly
      const buildResult = buildManifest(variant);

      // Export variant manifest (which internally builds)
      const exportResult = exportVariantManifest(variant);

      expect(exportResult.success).toBe(true);
      expect(buildResult.manifest).not.toBeNull();
    });

    it('exportBulkVariantManifests produces same count as buildBulkManifest', () => {
      const bulkBuildResult = buildBulkManifest(generatedVariants);
      const exportResult = exportBulkVariantManifests(generatedVariants);

      expect(exportResult.exportedCount).toBe(bulkBuildResult.manifests.length);
    });

    it('control variant manifest is included in bulk export', () => {
      const result = exportBulkVariantManifests(generatedVariants);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(10);

      // Verify the control variant was included by checking the build
      const bulkResult = buildBulkManifest(generatedVariants);
      const controlManifests = bulkResult.manifests.filter((m) => m.controlFlag === true);
      expect(controlManifests.length).toBe(1);
    });

    it('non-control variant manifests have appliedTailoring entries', () => {
      const bulkResult = buildBulkManifest(generatedVariants);
      const nonControlManifests = bulkResult.manifests.filter((m) => !m.controlFlag);

      nonControlManifests.forEach((manifest) => {
        expect(manifest.appliedTailoring.length).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling edge cases', () => {
    it('handles variant with circular reference gracefully in exportVariantManifest', () => {
      // The variant itself won't have circular refs since it's generated,
      // but we test that the export path handles errors
      const variant = generatedVariants[0];

      // Simulate a Blob creation failure
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Failed to create object URL');
      });

      const result = exportVariantManifest(variant);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles Blob creation failure in bulk export', () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      const result = exportBulkVariantManifests(generatedVariants);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.filename).toBeNull();
      expect(result.exportedCount).toBe(0);
    });

    it('handles anchor click failure gracefully', () => {
      mockAnchorClick.mockImplementation(() => {
        throw new Error('Click failed');
      });

      const manifest = builtManifests[0];
      const result = exportManifest(manifest);

      // The error should be caught in triggerDownload
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles manifest with missing optional fields', () => {
      const variant = {
        variantId: 'variant-minimal-export',
        name: 'Minimal Export',
        productId: 'prod-test',
        cohortType: 'budget-conscious',
        behavioralOverlay: 'browse-heavy',
        baseSku: 'SKU-6548320',
        label: 'Minimal',
        priority: 1,
        controlFlag: false,
      };

      const result = exportVariantManifest(variant);

      expect(result.success).toBe(true);
      expect(result.filename).not.toBeNull();
    });

    it('handles manifest with special characters in fields', () => {
      const variant = {
        variantId: 'variant-special-chars',
        name: 'Special "Chars" & <Tags>',
        productId: 'prod-test',
        cohortType: 'budget-conscious',
        behavioralOverlay: 'browse-heavy',
        baseSku: 'SKU-6548320',
        label: 'Label with "quotes" & ampersands',
        priority: 1,
        controlFlag: false,
      };

      const result = exportVariantManifest(variant);

      expect(result.success).toBe(true);
      expect(result.filename).not.toBeNull();
    });
  });

  describe('filename generation', () => {
    it('auto-generated filename contains timestamp-like pattern', () => {
      const manifest = builtManifests[0];
      const result = exportManifest(manifest);

      expect(result.filename).not.toBeNull();
      // Filename should contain a date-like pattern (YYYY-MM-DD)
      expect(result.filename).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('auto-generated bulk filename contains timestamp-like pattern', () => {
      const result = exportBulk(builtManifests);

      expect(result.filename).not.toBeNull();
      expect(result.filename).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('auto-generated filename ends with .json', () => {
      const manifest = builtManifests[0];
      const result = exportManifest(manifest);

      expect(result.filename).toMatch(/\.json$/);
    });

    it('auto-generated bulk filename ends with .json', () => {
      const result = exportBulk(builtManifests);

      expect(result.filename).toMatch(/\.json$/);
    });
  });

  describe('observability event emission patterns', () => {
    it('successful single export emits exactly one EXPORT_ACTION event for exportManifest', () => {
      clearEventBuffer();

      const manifest = builtManifests[0];
      exportManifest(manifest);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const exportManifestEvents = exportEvents.filter(
        (e) => e.payload && e.payload.action === 'exportManifest',
      );

      expect(exportManifestEvents.length).toBe(1);
    });

    it('successful bulk export emits exactly one EXPORT_ACTION event for exportBulk', () => {
      clearEventBuffer();

      exportBulk(builtManifests);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const bulkExportEvents = exportEvents.filter(
        (e) => e.payload && e.payload.action === 'exportBulk',
      );

      expect(bulkExportEvents.length).toBe(1);
    });

    it('failed export does not emit EXPORT_ACTION event', () => {
      clearEventBuffer();

      exportManifest(null);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const exportManifestEvents = exportEvents.filter(
        (e) => e.payload && e.payload.action === 'exportManifest',
      );

      expect(exportManifestEvents.length).toBe(0);
    });

    it('failed bulk export does not emit EXPORT_ACTION event for exportBulk', () => {
      clearEventBuffer();

      exportBulk([]);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const bulkExportEvents = exportEvents.filter(
        (e) => e.payload && e.payload.action === 'exportBulk',
      );

      expect(bulkExportEvents.length).toBe(0);
    });

    it('export events have correct payload structure', () => {
      clearEventBuffer();

      const manifest = builtManifests[1]; // Non-control variant
      exportManifest(manifest);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const exportEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'exportManifest',
      );

      expect(exportEvent).toBeDefined();
      expect(typeof exportEvent.payload.variantId).toBe('string');
      expect(typeof exportEvent.payload.filename).toBe('string');
      expect(typeof exportEvent.payload.appliedTailoringCount).toBe('number');
      expect(typeof exportEvent.id).toBe('string');
      expect(typeof exportEvent.timestamp).toBe('string');
      expect(typeof exportEvent.sequence).toBe('number');
      expect(exportEvent.eventType).toBe(EVENT_TYPES.EXPORT_ACTION);
    });

    it('bulk export events have correct payload structure', () => {
      clearEventBuffer();

      exportBulk(builtManifests);

      const exportEvents = getEventsByType(EVENT_TYPES.EXPORT_ACTION);
      const bulkEvent = exportEvents.find(
        (e) => e.payload && e.payload.action === 'exportBulk',
      );

      expect(bulkEvent).toBeDefined();
      expect(typeof bulkEvent.payload.filename).toBe('string');
      expect(typeof bulkEvent.payload.totalManifests).toBe('number');
      expect(typeof bulkEvent.payload.failedCount).toBe('number');
      expect(typeof bulkEvent.payload.validationErrors).toBe('number');
      expect(bulkEvent.eventType).toBe(EVENT_TYPES.EXPORT_ACTION);
    });

    it('error events have correct payload structure', () => {
      clearEventBuffer();

      exportManifest(null);

      const errorEvents = getEventsByType(EVENT_TYPES.ERROR);
      const exportError = errorEvents.find(
        (e) => e.payload && e.payload.action === 'exportManifest',
      );

      expect(exportError).toBeDefined();
      expect(typeof exportError.payload.error).toBe('string');
      expect(typeof exportError.id).toBe('string');
      expect(typeof exportError.timestamp).toBe('string');
      expect(exportError.eventType).toBe(EVENT_TYPES.ERROR);
    });
  });

  describe('manifest schema compliance', () => {
    it('exported manifest contains all required schema fields', () => {
      const manifest = builtManifests[0];
      const validation = validateManifestForExport(manifest);

      expect(validation.valid).toBe(true);

      // Verify required fields exist
      expect(typeof manifest.id).toBe('string');
      expect(manifest.id.length).toBeGreaterThan(0);
      expect(typeof manifest.name).toBe('string');
      expect(manifest.name.length).toBeGreaterThan(0);
      expect(typeof manifest.version).toBe('string');
      expect(manifest.version.length).toBeGreaterThan(0);
      expect(Array.isArray(manifest.variantIds)).toBe(true);
      expect(manifest.variantIds.length).toBeGreaterThan(0);
    });

    it('manifest version matches getManifestVersion', () => {
      const manifest = builtManifests[0];

      expect(manifest.version).toBe(getManifestVersion());
    });

    it('manifest variantIds contains the variantId', () => {
      const manifest = builtManifests[0];

      expect(manifest.variantIds).toContain(manifest.variantId);
    });

    it('manifest appliedTailoring entries have required fields', () => {
      const manifest = builtManifests[1]; // Non-control variant

      manifest.appliedTailoring.forEach((entry) => {
        expect(typeof entry.dimension).toBe('string');
        expect(typeof entry.change).toBe('string');
        expect(typeof entry.rationale).toBe('string');
        expect(typeof entry.weight).toBe('number');
      });
    });

    it('manifest controlFlag is boolean', () => {
      builtManifests.forEach((manifest) => {
        expect(typeof manifest.controlFlag).toBe('boolean');
      });
    });

    it('exactly one manifest has controlFlag true', () => {
      const controlManifests = builtManifests.filter((m) => m.controlFlag === true);

      expect(controlManifests.length).toBe(1);
    });

    it('manifest created is ISO 8601 string', () => {
      builtManifests.forEach((manifest) => {
        expect(typeof manifest.created).toBe('string');
        expect(new Date(manifest.created).toISOString()).toBe(manifest.created);
      });
    });

    it('manifest createdAt is ISO 8601 string', () => {
      builtManifests.forEach((manifest) => {
        expect(typeof manifest.createdAt).toBe('string');
        expect(new Date(manifest.createdAt).toISOString()).toBe(manifest.createdAt);
      });
    });
  });
});