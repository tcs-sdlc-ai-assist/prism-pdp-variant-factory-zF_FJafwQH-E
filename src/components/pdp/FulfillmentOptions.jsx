import { useState } from 'react';
import PropTypes from 'prop-types';
import CtaButton from '@/components/pdp/CtaButton.jsx';

/**
 * Fulfillment options component for the PDP buy box.
 * Shows ship / store pickup / curbside pickup toggles with
 * estimated delivery times. PRD §10.1 requirement.
 *
 * @param {{ product: object, diffHighlights?: object, showDiffOutline?: boolean, className?: string }} props
 * @returns {React.ReactElement}
 */
function FulfillmentOptions({ product, diffHighlights, showDiffOutline = false, className }) {
  const [selected, setSelected] = useState('ship');

  const options = [
    {
      id: 'ship',
      label: 'Ship',
      icon: (
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      detail: 'Free shipping · Arrives in 3–5 business days',
      available: true,
    },
    {
      id: 'pickup',
      label: 'Store Pickup',
      icon: (
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
      detail: 'Ready in 1 hour · Best Buy on Eastside',
      available: true,
    },
    {
      id: 'curbside',
      label: 'Curbside',
      icon: (
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75H19.5a.75.75 0 0 1 .75.75v.75m0 0-.75 13.5a2.25 2.25 0 0 1-2.246 2.25H6.246A2.25 2.25 0 0 1 4 18.75L3.25 5.25m17.25 0H3.75m13.5 0v15" />
        </svg>
      ),
      detail: 'Drive up ready in 30 min · No contact needed',
      available: true,
    },
  ];

  const diffClass =
    showDiffOutline && diffHighlights?.hasChanges &&
    (diffHighlights?.fields?.includes('fulfillment') || diffHighlights?.dimensions?.includes('fulfillment'))
      ? ' ring-2 ring-accent-500 ring-offset-1 rounded-lg'
      : '';

  return (
    <section
      role="region"
      aria-label="Fulfillment options"
      className={`rounded-lg border border-neutral-200 bg-white p-5 shadow-sm animate-fade-in${diffClass}${className ? ` ${className}` : ''}`}
    >
      <h4 className="text-sm font-semibold text-neutral-900 mb-3">How do you want to get it?</h4>

      {/* Fulfillment toggles */}
      <div className="flex gap-2 mb-4" role="group" aria-label="Select fulfillment method">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelected(opt.id)}
            aria-pressed={selected === opt.id}
            disabled={!opt.available}
            className={`flex-1 flex flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-40 disabled:cursor-not-allowed ${
              selected === opt.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <span className={selected === opt.id ? 'text-primary-600' : 'text-neutral-400'}>
              {opt.icon}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Detail for selected option */}
      {options.find((o) => o.id === selected) && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-100 px-3 py-2">
          <svg
            className="h-4 w-4 flex-shrink-0 text-green-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span className="text-xs text-green-800 font-medium">
            {options.find((o) => o.id === selected).detail}
          </span>
        </div>
      )}

      {/* Warranty info */}
      {product?.warranty && (
        <p className="mt-3 text-xs text-neutral-500">
          <span className="font-medium">Warranty: </span>
          {product.warranty}
        </p>
      )}

      {/* Diff tag */}
      {showDiffOutline && diffHighlights?.hasChanges &&
        (diffHighlights?.fields?.includes('fulfillment') || diffHighlights?.dimensions?.includes('fulfillment')) && (
        <div className="mt-2 flex items-center gap-1">
          <svg
            className="h-3 w-3 text-accent-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          <span className="text-xs text-accent-600 font-medium">Changed for this cohort</span>
        </div>
      )}
    </section>
  );
}

// Render CTA buttons within fulfillment so CTAs appear under "How do you want to get it?"
function FulfillmentOptionsWithCTA(props) {
  const {
    primaryCTA = 'Add to Cart',
    secondaryCTA = 'Save for Later',
    ctaTone = 'standard',
    onPrimaryClick,
    onSecondaryClick,
    diffHighlights,
    showDiffOutline,
  } = props;

  return (
    <div>
      <FulfillmentOptions {...props} />
      <div className="mt-3">
        <CtaButton
          primaryCTA={primaryCTA}
          secondaryCTA={secondaryCTA}
          ctaTone={ctaTone}
          diffHighlights={diffHighlights}
          showDiffOutline={showDiffOutline}
          onPrimaryClick={onPrimaryClick}
          onSecondaryClick={onSecondaryClick}
        />
      </div>
    </div>
  );
}

FulfillmentOptions.propTypes = {
  product: PropTypes.shape({
    fulfillment: PropTypes.string,
    warranty: PropTypes.string,
  }),
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

FulfillmentOptions.defaultProps = {
  product: undefined,
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

FulfillmentOptionsWithCTA.propTypes = {
  primaryCTA: PropTypes.string,
  secondaryCTA: PropTypes.string,
  ctaTone: PropTypes.oneOf(['standard', 'urgent', 'value', 'premium', 'friendly']),
  onPrimaryClick: PropTypes.func,
  onSecondaryClick: PropTypes.func,
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
};

FulfillmentOptionsWithCTA.defaultProps = {
  primaryCTA: 'Add to Cart',
  secondaryCTA: 'Save for Later',
  ctaTone: 'standard',
  onPrimaryClick: undefined,
  onSecondaryClick: undefined,
  diffHighlights: undefined,
  showDiffOutline: false,
};

export default FulfillmentOptionsWithCTA;
