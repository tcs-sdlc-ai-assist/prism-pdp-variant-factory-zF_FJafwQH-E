import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * @typedef {Object} SpecTableProps
 * @property {object} product - The product/catalog item to display specs for
 * @property {string[]} [prioritizedSpecs] - Ordered list of spec keys to show first
 * @property {boolean} [expandByDefault=false] - Whether the specs section should be expanded by default
 * @property {DiffHighlights} [diffHighlights] - Diff highlights for accent outline
 * @property {boolean} [showDiffOutline=false] - Whether to show diff accent outlines
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Determines whether a specific field has a diff highlight.
 *
 * @param {DiffHighlights|null|undefined} diffHighlights - The diff highlights object
 * @param {string} field - The field name to check
 * @returns {boolean}
 */
function hasFieldDiff(diffHighlights, field) {
  if (!diffHighlights || !Array.isArray(diffHighlights.fields)) {
    return false;
  }
  return diffHighlights.fields.includes(field);
}

/**
 * Determines whether a specific dimension has a diff highlight.
 *
 * @param {DiffHighlights|null|undefined} diffHighlights - The diff highlights object
 * @param {string} dimension - The dimension name to check
 * @returns {boolean}
 */
function hasDimensionDiff(diffHighlights, dimension) {
  if (!diffHighlights || !Array.isArray(diffHighlights.dimensions)) {
    return false;
  }
  return diffHighlights.dimensions.includes(dimension);
}

/**
 * Returns the diff outline class string if diff highlighting is active for the given field/dimension.
 *
 * @param {boolean} showDiffOutline - Whether diff outlines are enabled
 * @param {DiffHighlights|null|undefined} diffHighlights - The diff highlights object
 * @param {string} field - The field name to check
 * @param {string} [dimension] - The dimension name to check
 * @returns {string} CSS class string for diff outline, or empty string
 */
function getDiffOutlineClass(showDiffOutline, diffHighlights, field, dimension) {
  if (!showDiffOutline || !diffHighlights || !diffHighlights.hasChanges) {
    return '';
  }
  if (hasFieldDiff(diffHighlights, field) || (dimension && hasDimensionDiff(diffHighlights, dimension))) {
    return ' ring-2 ring-accent-500 ring-offset-1 rounded-md';
  }
  return '';
}

/**
 * Formats a spec key from camelCase or kebab-case to a human-readable label.
 *
 * @param {string} key - The spec key to format
 * @returns {string} Human-readable label
 */
function formatSpecLabel(key) {
  if (!key || typeof key !== 'string') {
    return '';
  }
  // Convert camelCase to spaced words
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Convert kebab-case and underscores to spaces
  const cleaned = spaced.replace(/[-_]/g, ' ');
  // Capitalize first letter of each word
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a spec value for display. Handles strings, numbers, booleans, and arrays.
 *
 * @param {*} value - The spec value to format
 * @returns {string} Formatted value string
 */
function formatSpecValue(value) {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return '—';
  }
  return String(value);
}

/**
 * Orders spec entries based on prioritized spec keys.
 * Prioritized specs appear first in the specified order, followed by remaining specs in original order.
 *
 * @param {Array<[string, *]>} specEntries - Array of [key, value] spec entries
 * @param {string[]} prioritizedSpecs - Ordered list of spec keys to show first
 * @returns {Array<[string, *]>} Ordered spec entries
 */
function orderSpecs(specEntries, prioritizedSpecs) {
  if (!Array.isArray(prioritizedSpecs) || prioritizedSpecs.length === 0) {
    return specEntries;
  }

  const specMap = new Map(specEntries);
  const ordered = [];
  const seen = new Set();

  // Add prioritized specs first, in order
  for (const key of prioritizedSpecs) {
    if (specMap.has(key) && !seen.has(key)) {
      ordered.push([key, specMap.get(key)]);
      seen.add(key);
    }
  }

  // Add remaining specs in original order
  for (const [key, value] of specEntries) {
    if (!seen.has(key)) {
      ordered.push([key, value]);
      seen.add(key);
    }
  }

  return ordered;
}

/**
 * PDP specifications table component: renders product specs in a two-column table
 * with JetBrains Mono font. Supports variant-specific spec ordering based on cohort
 * interest. Accepts diff highlights prop for accent outline.
 *
 * @param {SpecTableProps} props
 * @returns {React.ReactElement}
 */
function SpecTable({
  product,
  prioritizedSpecs,
  expandByDefault = false,
  diffHighlights,
  showDiffOutline = false,
  className,
}) {
  if (!product || typeof product !== 'object') {
    return (
      <div
        role="region"
        aria-label="Product specifications"
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <p className="text-sm text-neutral-500">No product data available.</p>
      </div>
    );
  }

  const specs = product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs)
    ? product.specs
    : null;

  if (!specs || Object.keys(specs).length === 0) {
    return (
      <div
        role="region"
        aria-label="Product specifications"
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <p className="text-sm text-neutral-500">No specifications available for this product.</p>
      </div>
    );
  }

  const orderedSpecs = useMemo(() => {
    const entries = Object.entries(specs);
    return orderSpecs(entries, prioritizedSpecs);
  }, [specs, prioritizedSpecs]);

  const hasPrioritization = Array.isArray(prioritizedSpecs) && prioritizedSpecs.length > 0;

  const containerDiffClass =
    showDiffOutline && diffHighlights && diffHighlights.hasChanges
      ? ' ring-1 ring-primary-300 ring-offset-2'
      : '';

  return (
    <section
      role="region"
      aria-label="Product specifications"
      className={`rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden animate-fade-in${containerDiffClass}${className ? ` ${className}` : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-primary-500"
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
              d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
            />
          </svg>
          <h3 className="text-base font-semibold text-neutral-900">
            Specifications
          </h3>
        </div>

        {hasPrioritization && (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
            <svg
              className="h-3 w-3"
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
            Tailored ordering
          </span>
        )}
      </div>

      {/* Spec Table */}
      <div className={`px-6 py-4${expandByDefault ? '' : ''}`}>
        <table className="w-full" role="table" aria-label="Product specifications table">
          <thead className="sr-only">
            <tr>
              <th scope="col">Specification</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orderedSpecs.map(([key, value], index) => {
              const isPrioritized = hasPrioritization &&
                Array.isArray(prioritizedSpecs) &&
                prioritizedSpecs.includes(key);

              const rowDiffClass = getDiffOutlineClass(
                showDiffOutline,
                diffHighlights,
                'prioritizedSpecs',
                'fulfillment',
              );

              return (
                <tr
                  key={key}
                  className={`transition-colors duration-200 hover:bg-neutral-50${isPrioritized ? ' bg-primary-50/30' : ''}${rowDiffClass}`}
                >
                  <td className="py-3 pr-4 text-sm font-medium text-neutral-600 w-1/3 align-top">
                    <div className="flex items-center gap-1.5">
                      {isPrioritized && (
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-primary-500 flex-shrink-0"
                          aria-hidden="true"
                          title="Prioritized spec"
                        />
                      )}
                      {formatSpecLabel(key)}
                    </div>
                  </td>
                  <td className="py-3 text-sm text-neutral-900 font-mono align-top">
                    {formatSpecValue(value)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with spec count */}
      <div className="border-t border-neutral-100 px-6 py-3">
        <p className="text-xs text-neutral-400">
          {orderedSpecs.length} specification{orderedSpecs.length === 1 ? '' : 's'}
          {hasPrioritization && (
            <span>
              {' · '}
              {prioritizedSpecs.filter((k) => specs[k] !== undefined).length} prioritized
            </span>
          )}
        </p>
      </div>
    </section>
  );
}

SpecTable.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string,
    sku: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    memberPrice: PropTypes.number,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    category: PropTypes.string,
    imageUrl: PropTypes.string,
    media: PropTypes.arrayOf(PropTypes.string),
    brand: PropTypes.string,
    badge: PropTypes.string,
    fulfillment: PropTypes.string,
    warranty: PropTypes.string,
    specs: PropTypes.object,
    features: PropTypes.arrayOf(PropTypes.string),
  }),
  prioritizedSpecs: PropTypes.arrayOf(PropTypes.string),
  expandByDefault: PropTypes.bool,
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

SpecTable.defaultProps = {
  product: undefined,
  prioritizedSpecs: undefined,
  expandByDefault: false,
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default SpecTable;