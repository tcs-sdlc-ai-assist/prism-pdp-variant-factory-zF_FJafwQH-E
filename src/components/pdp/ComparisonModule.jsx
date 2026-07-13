import PropTypes from 'prop-types';

/**
 * Comparison module for the canonical PDP.
 * Prominent for Tech Enthusiast and high-intent cohorts.
 * Shows a spec comparison table between the current product and alternatives.
 * PRD §9.4 requirement.
 *
 * @param {{ product?: object, cohortType?: string, visible?: boolean, diffHighlights?: object, showDiffOutline?: boolean, className?: string }} props
 * @returns {React.ReactElement|null}
 */
function ComparisonModule({ product, cohortType, visible = true, diffHighlights, showDiffOutline = false, className }) {
  if (!visible || !product) {
    return null;
  }

  const specs = product.specs || {};
  const title = product.title || 'This Product';
  const price = typeof product.price === 'number' ? product.price : 0;

  // Build mock competitor rows
  const comparators = [
    {
      label: 'This Product',
      isHighlight: true,
      price,
      specs: Object.fromEntries(Object.entries(specs).slice(0, 5)),
    },
    {
      label: 'Comparable Model A',
      isHighlight: false,
      price: price * 0.92,
      specs: Object.fromEntries(
        Object.entries(specs).slice(0, 5).map(([k, v]) => [k, k === 'refreshRate' ? '60Hz' : v])
      ),
    },
    {
      label: 'Comparable Model B',
      isHighlight: false,
      price: price * 1.08,
      specs: Object.fromEntries(
        Object.entries(specs).slice(0, 5).map(([k, v]) => [k, k === 'hdr' ? 'HDR10+' : v])
      ),
    },
  ];

  const specKeys = Object.keys(specs).slice(0, 5);

  const formatKey = (key) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

  const diffClass =
    showDiffOutline && diffHighlights?.hasChanges &&
    diffHighlights?.dimensions?.includes('comparison')
      ? ' ring-2 ring-accent-500 ring-offset-1'
      : '';

  return (
    <section
      role="region"
      aria-label="Product comparison"
      className={`rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden animate-fade-in${diffClass}${className ? ` ${className}` : ''}`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        <h3 className="text-base font-semibold text-neutral-900">Compare Models</h3>
        {showDiffOutline && diffHighlights?.hasChanges && diffHighlights?.dimensions?.includes('comparison') && (
          <span className="inline-flex items-center gap-1 rounded-md bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
            <svg className="h-3 w-3 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            Changed for this cohort
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Comparison table">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider w-32">
                Specification
              </th>
              {comparators.map((c, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    c.isHighlight
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={c.isHighlight ? 'text-primary-700' : 'text-neutral-700'}>{c.label}</span>
                    <span className={`text-base font-bold ${c.isHighlight ? 'text-primary-600' : 'text-neutral-800'}`}>
                      ${c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {c.isHighlight && (
                      <span className="inline-flex items-center rounded-full bg-primary-500 px-2 py-0.5 text-xs font-semibold text-white">
                        You're Viewing
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specKeys.map((key, rowIdx) => (
              <tr key={key} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                <td className="px-4 py-2.5 text-xs font-medium text-neutral-600 whitespace-nowrap">
                  {formatKey(key)}
                </td>
                {comparators.map((c, idx) => (
                  <td
                    key={idx}
                    className={`px-4 py-2.5 text-center text-xs ${
                      c.isHighlight
                        ? 'bg-primary-50 font-semibold text-primary-800'
                        : 'text-neutral-700'
                    }`}
                  >
                    {c.specs[key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50">
        <p className="text-xs text-neutral-400">
          Comparison data is illustrative. Verify specifications on individual product pages.
        </p>
      </div>
    </section>
  );
}

ComparisonModule.propTypes = {
  product: PropTypes.shape({
    title: PropTypes.string,
    price: PropTypes.number,
    specs: PropTypes.object,
  }),
  cohortType: PropTypes.string,
  visible: PropTypes.bool,
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

ComparisonModule.defaultProps = {
  product: undefined,
  cohortType: '',
  visible: true,
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default ComparisonModule;
