import PropTypes from 'prop-types';

/**
 * Lifecycle / Geek Squad service module for the canonical PDP.
 * Conditionally shown for post-purchase and loyalty cohorts.
 * PRD §9.9 and §10.1 requirement.
 *
 * Shows setup, renewal, or upgrade prompts depending on the cohort context.
 *
 * @param {{ cohortType?: string, behavioralOverlay?: string, product?: object, diffHighlights?: object, showDiffOutline?: boolean, className?: string }} props
 * @returns {React.ReactElement|null}
 */
function LifecycleModule({ cohortType, behavioralOverlay, product, diffHighlights, showDiffOutline = false, className }) {
  // Determine which lifecycle scenario to show based on cohort
  const cohortLower = (cohortType || '').toLowerCase();
  const overlayLower = (behavioralOverlay || '').toLowerCase();

  const isPostPurchase = overlayLower.includes('post') || overlayLower.includes('lifecycle') || overlayLower.includes('upgrade');
  const isLoyalty = cohortLower.includes('loyalty') || cohortLower.includes('member');
  const isFamily = cohortLower.includes('family');
  const isBusiness = cohortLower.includes('business');

  // Only render for relevant cohorts
  if (!isPostPurchase && !isLoyalty && !isFamily && !isBusiness) {
    return null;
  }

  // Determine module variant
  let scenario = 'setup';
  if (isPostPurchase && (overlayLower.includes('upgrade') || overlayLower.includes('lifecycle'))) {
    scenario = 'upgrade';
  } else if (isLoyalty && isPostPurchase) {
    scenario = 'renewal';
  } else if (isFamily) {
    scenario = 'setup';
  } else if (isBusiness) {
    scenario = 'fleet';
  }

  const scenarios = {
    setup: {
      title: 'Set It Up Right — Geek Squad',
      description: 'Let a Geek Squad Agent set up your new device, transfer your data, and make sure everything\'s connected the way you need it.',
      cta: 'Add Geek Squad Setup ($99)',
      badge: 'Popular with new purchases',
      icon: (
        <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
        </svg>
      ),
    },
    upgrade: {
      title: 'Time to Upgrade? — My Best Buy',
      description: 'Based on your purchase history, your current device may be eligible for a trade-in upgrade. See what your device is worth today.',
      cta: 'Check Trade-In Value',
      badge: 'Upgrade offer available',
      icon: (
        <svg className="h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      ),
    },
    renewal: {
      title: 'Your Protection Plan — Geek Squad',
      description: 'Your Geek Squad Protection plan expires in 30 days. Renew now and continue enjoying unlimited repairs, no deductibles, and 24/7 tech support.',
      cta: 'Renew Protection Plan',
      badge: 'Expiring soon',
      icon: (
        <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
        </svg>
      ),
    },
    fleet: {
      title: 'Fleet & Business Services — Best Buy for Business',
      description: 'Need multiple units? Our business team offers volume pricing, dedicated deployment services, and fleet management through Geek Squad Business.',
      cta: 'Talk to a Business Specialist',
      badge: 'Business pricing available',
      icon: (
        <svg className="h-5 w-5 text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
      ),
    },
  };

  const { title, description, cta, badge, icon } = scenarios[scenario];

  const diffClass =
    showDiffOutline && diffHighlights?.hasChanges &&
    (diffHighlights?.dimensions?.includes('lifecycle') || diffHighlights?.dimensions?.includes('crossSell'))
      ? ' ring-2 ring-accent-500 ring-offset-1'
      : '';

  return (
    <section
      role="region"
      aria-label="Geek Squad and lifecycle services"
      className={`rounded-lg border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm animate-fade-in${diffClass}${className ? ` ${className}` : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
            <span className="inline-flex items-center rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
              {badge}
            </span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed mb-3">{description}</p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {cta}
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Diff tag */}
      {showDiffOutline && diffHighlights?.hasChanges &&
        (diffHighlights?.dimensions?.includes('lifecycle') || diffHighlights?.dimensions?.includes('crossSell')) && (
        <div className="mt-3 flex items-center gap-1 border-t border-primary-100 pt-2">
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
          <span className="text-xs text-accent-600 font-medium">Lifecycle service changed for this cohort</span>
        </div>
      )}
    </section>
  );
}

LifecycleModule.propTypes = {
  cohortType: PropTypes.string,
  behavioralOverlay: PropTypes.string,
  product: PropTypes.object,
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

LifecycleModule.defaultProps = {
  cohortType: '',
  behavioralOverlay: '',
  product: undefined,
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default LifecycleModule;
