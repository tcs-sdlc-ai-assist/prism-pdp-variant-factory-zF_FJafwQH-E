/**
 * ManifestExporter for the Prism PDP Variant Factory.
 * Validates manifest schema, creates Blob from JSON, triggers browser download
 * via anchor click. Handles export errors gracefully.
 * Emits observability events on export actions.
 *
 * @module manifestExporter
 */

import { validateManifest } from '@/schemas/schemas.js';
import { buildManifest, buildBulkManifest, getManifestVersion } from '@/services/manifestBuilder.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * Validates a manifest object against the manifest schema.
 * Returns a validation result with valid flag and error messages.
 *
 * @param {object} manifest - The manifest object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateManifestForExport(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a non-null object'] };
  }

  const schemaResult = validateManifest(manifest);

  if (!schemaResult.valid) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'validateManifestForExport',
      errors: schemaResult.errors,
    });
  }

  return schemaResult;
}

/**
 * Creates a Blob from a JSON-serializable object and triggers a browser download.
 *
 * @param {*} data - The data to serialize to JSON
 * @param {string} filename - The filename for the download
 * @returns {{ success: boolean, error: string|null }}
 */
function triggerDownload(data, filename) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    return { success: true, error: null };
  } catch (e) {
    console.error('[ManifestExporter] Download trigger failed:', e.message);
    return { success: false, error: `Download failed: ${e.message}` };
  }
}

/**
 * Generates a default filename for a manifest export.
 *
 * @param {string} [prefix='manifest'] - Filename prefix
 * @param {string} [variantId=''] - Optional variant ID to include in filename
 * @returns {string} The generated filename
 */
function generateFilename(prefix = 'manifest', variantId = '') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const idPart = variantId ? `-${variantId}` : '';
  return `${prefix}${idPart}-${timestamp}.json`;
}

/**
 * Validates and exports a single manifest as a JSON file download.
 * Validates the manifest against the schema before export.
 * Emits observability events on success or failure.
 *
 * @param {object} manifest - The manifest object to export
 * @param {string} [filename] - Optional filename for the download (auto-generated if not provided)
 * @returns {{ success: boolean, errors: string[], filename: string|null }}
 */
export function exportManifest(manifest, filename) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    const errorMsg = 'Manifest must be a non-null object';
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportManifest',
      error: errorMsg,
    });
    return { success: false, errors: [errorMsg], filename: null };
  }

  const validation = validateManifestForExport(manifest);

  if (!validation.valid) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportManifest',
      validationErrors: validation.errors,
    });
    return { success: false, errors: validation.errors, filename: null };
  }

  const variantId = manifest.variantId || manifest.id || '';
  const resolvedFilename = filename || generateFilename('manifest', variantId);

  const downloadResult = triggerDownload(manifest, resolvedFilename);

  if (!downloadResult.success) {
    errors.push(downloadResult.error);

    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportManifest',
      variantId,
      error: downloadResult.error,
    });

    return { success: false, errors, filename: null };
  }

  emitEvent(EVENT_TYPES.EXPORT_ACTION, {
    action: 'exportManifest',
    variantId,
    filename: resolvedFilename,
    appliedTailoringCount: Array.isArray(manifest.appliedTailoring)
      ? manifest.appliedTailoring.length
      : 0,
  });

  return { success: true, errors: [], filename: resolvedFilename };
}

/**
 * Validates and exports multiple manifests as a single bulk JSON file download.
 * Validates each manifest against the schema before export.
 * Emits observability events on success or failure.
 *
 * @param {object[]} manifests - Array of manifest objects to export
 * @param {string} [filename] - Optional filename for the download (auto-generated if not provided)
 * @returns {{ success: boolean, errors: string[], filename: string|null, exportedCount: number }}
 */
export function exportBulk(manifests, filename) {
  const errors = [];

  if (!Array.isArray(manifests)) {
    const errorMsg = 'Manifests must be an array';
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportBulk',
      error: errorMsg,
    });
    return { success: false, errors: [errorMsg], filename: null, exportedCount: 0 };
  }

  if (manifests.length === 0) {
    const errorMsg = 'Manifests array must contain at least one manifest';
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportBulk',
      error: errorMsg,
    });
    return { success: false, errors: [errorMsg], filename: null, exportedCount: 0 };
  }

  const validManifests = [];

  manifests.forEach((manifest, index) => {
    if (!manifest || typeof manifest !== 'object') {
      errors.push(`manifests[${index}]: Manifest must be a non-null object`);
      return;
    }

    const validation = validateManifestForExport(manifest);

    if (validation.valid) {
      validManifests.push(manifest);
    } else {
      validation.errors.forEach((err) => {
        errors.push(`manifests[${index}]: ${err}`);
      });
    }
  });

  if (validManifests.length === 0) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportBulk',
      error: 'No valid manifests to export',
      validationErrors: errors.length,
    });
    return {
      success: false,
      errors: ['No valid manifests to export', ...errors],
      filename: null,
      exportedCount: 0,
    };
  }

  const now = new Date().toISOString();

  const bulkExportData = {
    version: getManifestVersion(),
    exportedAt: now,
    totalVariants: validManifests.length,
    manifests: validManifests,
  };

  const resolvedFilename = filename || generateFilename('bulk-manifest');

  const downloadResult = triggerDownload(bulkExportData, resolvedFilename);

  if (!downloadResult.success) {
    errors.push(downloadResult.error);

    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportBulk',
      error: downloadResult.error,
    });

    return { success: false, errors, filename: null, exportedCount: 0 };
  }

  emitEvent(EVENT_TYPES.EXPORT_ACTION, {
    action: 'exportBulk',
    filename: resolvedFilename,
    totalManifests: validManifests.length,
    failedCount: manifests.length - validManifests.length,
    validationErrors: errors.length,
  });

  return {
    success: true,
    errors,
    filename: resolvedFilename,
    exportedCount: validManifests.length,
  };
}

/**
 * Exports a manifest built from a variant object.
 * Builds the manifest using manifestBuilder, validates, and triggers download.
 *
 * @param {object} variant - The variant object to build and export a manifest for
 * @param {string} [filename] - Optional filename for the download
 * @returns {{ success: boolean, errors: string[], filename: string|null }}
 */
export function exportVariantManifest(variant, filename) {
  if (!variant || typeof variant !== 'object') {
    const errorMsg = 'Variant must be a non-null object';
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportVariantManifest',
      error: errorMsg,
    });
    return { success: false, errors: [errorMsg], filename: null };
  }

  const buildResult = buildManifest(variant);

  if (!buildResult.manifest) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportVariantManifest',
      errors: buildResult.errors,
    });
    return { success: false, errors: buildResult.errors, filename: null };
  }

  return exportManifest(buildResult.manifest, filename);
}

/**
 * Exports manifests built from an array of variant objects as a bulk download.
 * Builds each manifest using manifestBuilder, validates, and triggers download.
 *
 * @param {object[]} variants - Array of variant objects to build and export manifests for
 * @param {string} [filename] - Optional filename for the download
 * @returns {{ success: boolean, errors: string[], filename: string|null, exportedCount: number }}
 */
export function exportBulkVariantManifests(variants, filename) {
  if (!Array.isArray(variants) || variants.length === 0) {
    const errorMsg = 'Variants must be a non-empty array';
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportBulkVariantManifests',
      error: errorMsg,
    });
    return { success: false, errors: [errorMsg], filename: null, exportedCount: 0 };
  }

  const bulkResult = buildBulkManifest(variants);

  if (!bulkResult.manifests || bulkResult.manifests.length === 0) {
    emitEvent(EVENT_TYPES.ERROR, {
      action: 'exportBulkVariantManifests',
      errors: bulkResult.errors,
    });
    return {
      success: false,
      errors: bulkResult.errors,
      filename: null,
      exportedCount: 0,
    };
  }

  return exportBulk(bulkResult.manifests, filename);
}

const manifestExporter = {
  validateManifestForExport,
  exportManifest,
  exportBulk,
  exportVariantManifest,
  exportBulkVariantManifests,
};

export default manifestExporter;