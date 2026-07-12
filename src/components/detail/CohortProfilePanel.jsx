import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { TAILORING_DIMENSIONS } from '@/constants/constants.js';

/**
 * @typedef {Object} CohortProfilePanelProps
 * @property {object} variant - The variant object to display cohort profile for
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Formats a cohort type key to a human-readable label.
 *
 * @param {string} cohortType - The cohort type identifier
 * @returns {string} Human-readable label
 */
function formatCohortType(cohortType) {
  if (!cohortType || typeof cohortType !== 'string') {
    return 'Unknown';
  }
  return cohortType
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a behavioral overlay key to a human-readable label.
 *
 * @param {string} overlay - The behavioral overlay identifier
 * @returns {string} Human-readable label
 */
function formatBehavioralOverlay(overlay) {
  if (!overlay || typeof overlay !== 'string') {
    return 'None';
  }
  return overlay
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a tailoring dimension key to a human-readable label.
 *
 * @param {string} dimension - The tailoring dimension key
 * @returns {string} Human-readable label
 */
function formatDimensionLabel(dimension) {
  if (!dimension || typeof dimension !== 'string') {
    return '';
  }
  return dimension.charAt(0).toUpperCase() + dimension.slice(1);
}

/**
 * Returns the badge color classes for a cohort type.
 *
 * @param {string} cohortType - The cohort type identifier
 * @returns {{ bg: string, text: string }}
 */
function getCohortBadgeColors(cohortType) {
  const type = (cohortType || '').toLowerCase();

  if (type.includes('budget') || type.includes('bargain')) {
    return { bg: 'bg-green-50', text: 'text-green-700' };
  }
  if (type.includes('tech') || type.includes('enthusiast')) {
    return { bg: 'bg-primary-50', text: 'text-primary-700' };
  }
  if (type.includes('loyalty') || type.includes('member')) {
    return { bg: 'bg-purple-50', text: 'text-purple-700' };
  }
  if (type.includes('gift')) {
    return { bg: 'bg-pink-50', text: 'text-pink-700' };
  }
  if (type.includes('business')) {
    return { bg: 'bg-neutral-100', text: 'text-neutral-700' };
  }
  if (type.includes('student')) {
    return { bg: 'bg-blue-50', text: 'text-blue-700' };
  }
  if (type.includes('high-value') || type.includes('high_value')) {
    return { bg: 'bg-amber-50', text: 'text-amber-700' };
  }
  if (type.includes('returning')) {
    return { bg: 'bg-teal-50', text: 'text-teal-700' };
  }
  if (type.includes('first')) {
    return { bg: 'bg-indigo-50', text: 'text-indigo-700' };
  }

  return { bg: 'bg-neutral-100', text: 'text-neutral-600' };
}

/**
 * Returns the badge color classes for a behavioral overlay.
 *
 * @param {string} overlay - The behavioral overlay identifier
 * @returns {{ bg: string, text: string }}
 */
function getOverlayBadgeColors(overlay) {
  const type = (overlay || '').toLowerCase();

  if (type.includes('browse') || type.includes('heavy')) {
    return { bg: 'bg-sky-50', text: 'text-sky-700' };
  }
  if (type.includes('comparison') || type.includes('shopper')) {
    return { bg: 'bg-violet-50', text: 'text-violet-700' };
  }
  if (type.includes('deal') || type.includes('seeker')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
  }
  if (type.includes('cart') || type.includes('abandon')) {
    return { bg: 'bg-red-50', text: 'text-red-700' };
  }
  if (type.includes('seasonal') || type.includes('browser')) {
    return { bg: 'bg-orange-50', text: 'text-orange-700' };
  }
  if (type.includes('bulk') || type.includes('research')) {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
  }
  if (type.includes('brand') || type.includes('loyal')) {
    return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' };
  }
  if (type.includes('quick') || type.includes('purchas')) {
    return { bg: 'bg-cyan-50', text: 'text-cyan-700' };
  }

  return { bg: 'bg-neutral-50', text: 'text-neutral-600' };
}

/**
 * Returns the color classes for a weight value.
 *
 * @param {number} weight - The weight value (0-100)
 * @returns {string} Tailwind color class for the progress bar
 */
function getWeightBarColor(weight) {
  if (weight >= 80) {
    return 'bg-primary-500';
  }
  if (weight >= 60) {
    return 'bg-primary-400';
  }
  if (weight >= 40) {
    return 'bg-primary-300';
  }
  return 'bg-neutral-300';
}

/**
 * Returns the action badge color classes.
 *
 * @param {string} action - The transformation action
 * @returns {{ bg: string, text: string }}
 */
function getActionBadgeColors(action) {
  const a = (action || '').toLowerCase();

  if (a === 'emphasize') {
    return { bg: 'bg-primary-50', text: 'text-primary-700' };
  }
  if (a === 'replace') {
    return { bg: 'bg-red-50', text: 'text-red-700' };
  }
  if (a === 'reorder') {
    return { bg: 'bg-amber-50', text: 'text-amber-700' };
  }
  if (a === 'augment') {
    return { bg: 'bg-green-50', text: 'text-green-700' };
  }
  if (a === 'suppress') {
    return { bg: 'bg-neutral-100', text: 'text-neutral-600' };
  }

  return { bg: 'bg-neutral-50', text: 'text-neutral-600' };
}

/**
 * Extracts tailoring emphasis entries from a variant object.
 *
 * @param {object} variant - The variant object
 * @returns {Array<{ dimension: string, weight: number, strategy: string }>}
 */
function extractTailoringEmphasis(variant) {
  if (!variant || typeof variant !== 'object') {
    return [];
  }

  if (variant.tailoring && typeof variant.tailoring === 'object' && !Array.isArray(variant.tailoring)) {
    return Object.entries(variant.tailoring)
      .filter(([key]) => TAILORING_DIMENSIONS.includes(key))
      .map(([dimension, entry]) => ({
        dimension,
        weight: entry && typeof entry.weight === 'number' && Number.isFinite(entry.weight) ? entry.weight : 50,
        strategy: entry && typeof entry.rationale === 'string' ? entry.rationale : '',
      }))
      .sort((a, b) => b.weight - a.weight);
  }

  return [];
}

/**
 * Extracts applied tailoring rules from a variant object.
 *
 * @param {object} variant - The variant object
 * @returns {Array<{ dimension: string, action: string, change: string, rationale: string, weight: number }>}
 */
function extractAppliedTailoring(variant) {
  if (!variant || typeof variant !== 'object') {
    return [];
  }

  if (
    variant.manifest &&
    typeof variant.manifest === 'object' &&
    Array.isArray(variant.manifest.appliedTailoring)
  ) {
    return variant.manifest.appliedTailoring
      .map((entry) => ({
        dimension: entry.dimension || '',
        action: entry.change && typeof entry.change === 'string' ? entry.change.split(':')[0].trim() : '',
        change: entry.change || '',
        rationale: entry.rationale || '',
        weight: typeof entry.weight === 'number' && Number.isFinite(entry.weight) ? entry.weight : 0,
      }))
      .sort((a, b) => b.weight - a.weight);
  }

  return [];
}

/**
 * Variant detail side panel component: displays cohort type, behavioral overlay,
 * base SKU, tailoring emphasis, and applied tailoring rules for the selected variant.
 * Styled with brand colors and icons.
 *
 * @param {CohortProfilePanelProps} props
 * @returns {React.ReactElement}
 */
function CohortProfilePanel({ variant, className }) {
  if (!variant || typeof variant !== 'object') {
    return (
      <aside
        role="complementary"
        aria-label="Cohort profile"
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <p className="text-sm text-neutral-500">No variant data available.</p>
      </aside>
    );
  }

  const cohortType = variant.cohortType || '';
  const behavioralOverlay = variant.behavioralOverlay || '';
  const baseSku = variant.baseSku || variant.sku || '';
  const label = variant.label || variant.name || '';
  const priority = typeof variant.priority === 'number' ? variant.priority : 0;
  const controlFlag = variant.controlFlag === true;
  const variantId = variant.variantId || variant.id || '';

  const cohortColors = useMemo(() => getCohortBadgeColors(cohortType), [cohortType]);
  const overlayColors = useMemo(() => getOverlayBadgeColors(behavioralOverlay), [behavioralOverlay]);

  const tailoringEmphasis = useMemo(() => extractTailoringEmphasis(variant), [variant]);
  const appliedTailoring = useMemo(() => extractAppliedTailoring(variant), [variant]);

  const diffDimensions = useMemo(() => {
    if (variant.diff && typeof variant.diff === 'object' && Array.isArray(variant.diff.dimensions)) {
      return variant.diff.dimensions;
    }
    if (
      variant.manifest &&
      typeof variant.manifest === 'object' &&
      variant.manifest.diffSummary &&
      typeof variant.manifest.diffSummary === 'object' &&
      Array.isArray(variant.manifest.diffSummary.dimensions)
    ) {
      return variant.manifest.diffSummary.dimensions;
    }
    return [];
  }, [variant]);

  return (
    <aside
      role="complementary"
      aria-label={`Cohort profile: ${label || 'Variant'}`}
      className={`flex flex-col gap-5 rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-5 py-4">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-primary-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900 truncate">
            Cohort Profile
          </h3>
          <p className="text-xs text-neutral-500 truncate" title={label}>
            {label || 'Untitled Variant'}
          </p>
        </div>
        {controlFlag && (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
              />
            </svg>
            Control
          </span>
        )}
        {priority > 0 && (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-500 text-xs font-bold text-white flex-shrink-0">
            {priority}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5 px-5 pb-5">
        {/* Cohort Type */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-neutral-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Cohort Type
            </span>
          </div>
          {cohortType ? (
            <span
              className={`inline-flex items-center self-start rounded-md px-2.5 py-1 text-sm font-medium ${cohortColors.bg} ${cohortColors.text}`}
            >
              {formatCohortType(cohortType)}
            </span>
          ) : (
            <span className="text-sm text-neutral-400">Not specified</span>
          )}
        </div>

        {/* Behavioral Overlay */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-neutral-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
              />
            </svg>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Behavioral Overlay
            </span>
          </div>
          {behavioralOverlay ? (
            <span
              className={`inline-flex items-center self-start rounded-md px-2.5 py-1 text-sm font-medium ${overlayColors.bg} ${overlayColors.text}`}
            >
              {formatBehavioralOverlay(behavioralOverlay)}
            </span>
          ) : (
            <span className="text-sm text-neutral-400">Not specified</span>
          )}
        </div>

        {/* Base SKU */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-neutral-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6h.008v.008H6V6Z"
              />
            </svg>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Base SKU
            </span>
          </div>
          {baseSku ? (
            <span className="text-sm font-mono text-neutral-800">
              {baseSku}
            </span>
          ) : (
            <span className="text-sm text-neutral-400">Not specified</span>
          )}
        </div>

        {/* Variant ID */}
        {variantId && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33"
                />
              </svg>
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Variant ID
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-500 truncate" title={variantId}>
              {variantId}
            </span>
          </div>
        )}

        {/* Diff Dimensions */}
        {diffDimensions.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-accent-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                />
              </svg>
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Changed Dimensions
              </span>
              <span className="inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full bg-accent-500 px-1 text-xs font-bold text-neutral-900">
                {diffDimensions.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {diffDimensions.map((dimension) => (
                <span
                  key={dimension}
                  className="inline-flex items-center rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-neutral-800"
                >
                  {formatDimensionLabel(dimension)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tailoring Emphasis */}
        {tailoringEmphasis.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-primary-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                />
              </svg>
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Tailoring Emphasis
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {tailoringEmphasis.map((entry) => (
                <div key={entry.dimension} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-700">
                      {formatDimensionLabel(entry.dimension)}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">
                      {entry.weight}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getWeightBarColor(entry.weight)}`}
                      style={{ width: `${Math.max(0, Math.min(100, entry.weight))}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  {entry.strategy && (
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {entry.strategy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applied Tailoring Rules */}
        {appliedTailoring.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-primary-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.194-.14 1.743"
                />
              </svg>
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Applied Tailoring Rules
              </span>
              <span className="inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full bg-primary-100 px-1 text-xs font-bold text-primary-700">
                {appliedTailoring.length}
              </span>
            </div>
            <div className="flex flex-col gap-2" role="list" aria-label="Applied tailoring rules">
              {appliedTailoring.map((rule, index) => {
                const actionColors = getActionBadgeColors(rule.action);
                return (
                  <div
                    key={`${rule.dimension}-${index}`}
                    role="listitem"
                    className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2.5 transition-colors duration-200 hover:bg-neutral-100"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-neutral-800">
                          {formatDimensionLabel(rule.dimension)}
                        </span>
                        {rule.action && (
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${actionColors.bg} ${actionColors.text}`}
                          >
                            {rule.action}
                          </span>
                        )}
                      </div>
                      {rule.weight > 0 && (
                        <span className="text-xs font-mono text-neutral-400">
                          w:{rule.weight}
                        </span>
                      )}
                    </div>
                    {rule.change && (
                      <p className="text-xs text-neutral-600 mb-1 font-mono">
                        {rule.change}
                      </p>
                    )}
                    {rule.rationale && (
                      <div className="flex items-start gap-1 mt-1">
                        <svg
                          className="h-3 w-3 flex-shrink-0 text-neutral-400 mt-0.5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          {rule.rationale}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state for no tailoring */}
        {tailoringEmphasis.length === 0 && appliedTailoring.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 border-t border-neutral-100 pt-4">
            <svg
              className="h-8 w-8 text-neutral-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
              />
            </svg>
            <p className="text-xs text-neutral-400 text-center">
              {controlFlag
                ? 'Control variant — no tailoring applied'
                : 'No tailoring data available for this variant'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
          <svg
            className="h-3 w-3 text-neutral-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <p className="text-xs text-neutral-400">
            {cohortType && formatCohortType(cohortType)}
            {behavioralOverlay && ` · ${formatBehavioralOverlay(behavioralOverlay)}`}
            {baseSku && ` · ${baseSku}`}
            {tailoringEmphasis.length > 0 && ` · ${tailoringEmphasis.length} dimension${tailoringEmphasis.length === 1 ? '' : 's'} emphasized`}
            {appliedTailoring.length > 0 && ` · ${appliedTailoring.length} rule${appliedTailoring.length === 1 ? '' : 's'} applied`}
          </p>
        </div>
      </div>
    </aside>
  );
}

CohortProfilePanel.propTypes = {
  variant: PropTypes.shape({
    id: PropTypes.string,
    variantId: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.string,
    productId: PropTypes.string,
    sku: PropTypes.string,
    cohortId: PropTypes.string,
    cohortType: PropTypes.string,
    behavioralOverlay: PropTypes.string,
    baseSku: PropTypes.string,
    priority: PropTypes.number,
    controlFlag: PropTypes.bool,
    isActive: PropTypes.bool,
    weight: PropTypes.number,
    tailoring: PropTypes.object,
    variantPdp: PropTypes.object,
    diff: PropTypes.object,
    manifest: PropTypes.object,
    description: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }),
  className: PropTypes.string,
};

CohortProfilePanel.defaultProps = {
  variant: undefined,
  className: undefined,
};

export default CohortProfilePanel;