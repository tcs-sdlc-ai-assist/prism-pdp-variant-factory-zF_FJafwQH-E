import PropTypes from 'prop-types';
import { useState } from 'react';

/**
 * @typedef {Object} DiffHighlights
 * @property {string[]} [dimensions] - Array of tailoring dimension names that changed
 * @property {string[]} [fields] - Array of field names that changed
 * @property {boolean} [hasChanges] - Whether any changes were detected
 */

/**
 * AEM-style product overview / description section for the canonical PDP.
 * Shows product description, key features list, and a simulated AEM content
 * fragment badge. Expandable for long descriptions.
 *
 * @param {{ product: object, diffHighlights?: DiffHighlights, showDiffOutline?: boolean, className?: string }} props
 * @returns {React.ReactElement}
 */
function ProductDescription({ product, diffHighlights, showDiffOutline = false, className }) {
  const [expanded, setExpanded] = useState(false);

  if (!product || typeof product !== 'object') {
    return null;
  }

  const description = product.description || '';
  const features = Array.isArray(product.features) ? product.features : [];
  const isLong = description.length > 300;
  const displayedDescription = isLong && !expanded ? `${description.slice(0, 300)}…` : description;

  const hasDiffOnField = (field) => {
    if (!showDiffOutline || !diffHighlights || !diffHighlights.hasChanges) return false;
    return (
      (Array.isArray(diffHighlights.fields) && diffHighlights.fields.includes(field)) ||
      (Array.isArray(diffHighlights.dimensions) && diffHighlights.dimensions.includes('description'))
    );
  };

  const diffClass = hasDiffOnField('description') ? ' ring-2 ring-accent-500 ring-offset-1 rounded-md' : '';

  return (
    <section
      role="region"
      aria-label="Product overview"
      className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-neutral-900">Product Overview</h3>
        {/* AEM content fragment badge */}
        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
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
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          AEM Content Fragment
        </span>
      </div>

      {/* Description */}
      {description && (
        <div className={`mb-4${diffClass}`}>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {displayedDescription}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors duration-200 focus:outline-none focus-visible:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Key Features */}
      {features.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-2">Key Features</h4>
          <ul className="space-y-1.5" role="list" aria-label="Key product features">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                <svg
                  className="h-4 w-4 flex-shrink-0 text-primary-500 mt-0.5"
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
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diff tag */}
      {showDiffOutline && diffHighlights?.hasChanges && hasDiffOnField('description') && (
        <div className="mt-3 flex items-center gap-1">
          <svg
            className="h-3 w-3 text-accent-500"
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
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
            />
          </svg>
          <span className="text-xs text-accent-600 font-medium">Changed for this cohort</span>
        </div>
      )}
    </section>
  );
}

ProductDescription.propTypes = {
  product: PropTypes.shape({
    description: PropTypes.string,
    features: PropTypes.arrayOf(PropTypes.string),
  }),
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

ProductDescription.defaultProps = {
  product: undefined,
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default ProductDescription;
