import PropTypes from 'prop-types';

/**
 * Application footer component with Best Buy-style brand alignment.
 * Displays Prism prototype disclaimer, version number, and demo date.
 * Includes ARIA contentinfo landmark for accessibility.
 *
 * @param {{ className?: string }} props
 * @returns {React.ReactElement}
 */
function Footer({ className }) {
  const currentYear = new Date().getFullYear();
  const version = '1.0.0';
  const demoDate = 'June 2024';

  return (
    <footer
      role="contentinfo"
      className={`w-full border-t border-neutral-200 bg-neutral-50${className ? ` ${className}` : ''}`}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Brand + Disclaimer */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
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
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
                />
              </svg>
              <span className="text-sm font-semibold text-neutral-800">
                Prism PDP Variant Factory
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Internal prototype for demonstration purposes only. Not for production use.
            </p>
          </div>

          {/* Version + Date + Copyright */}
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                v{version}
              </span>
              <span className="text-xs text-neutral-400">
                Demo: {demoDate}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              &copy; {currentYear} Prism. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

Footer.propTypes = {
  className: PropTypes.string,
};

Footer.defaultProps = {
  className: undefined,
};

export default Footer;