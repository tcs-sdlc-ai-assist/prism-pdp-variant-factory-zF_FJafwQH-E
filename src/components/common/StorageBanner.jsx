import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/hooks/useAccessibility.js';

/**
 * StorageBanner component displays a dismissible warning banner when
 * localStorage is unavailable and the application is operating in
 * sessionStorage fallback mode. Warns users that data will not persist
 * across browser sessions.
 *
 * @param {{ className?: string }} props
 * @returns {React.ReactElement|null}
 */
function StorageBanner({ className }) {
  const { isFallbackMode } = useAppContext();
  const { announceToScreenReader } = useAccessibility();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    announceToScreenReader('Storage warning banner dismissed', 'polite');
  }, [announceToScreenReader]);

  if (!isFallbackMode || isDismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 shadow-sm animate-slide-down${className ? ` ${className}` : ''}`}
    >
      <div className="flex-shrink-0">
        <svg
          className="h-5 w-5 text-yellow-600"
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
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <p className="flex-1 text-sm font-medium text-yellow-800">
        localStorage is unavailable. Your data is stored in sessionStorage and{' '}
        <strong>will not persist</strong> across browser sessions.
      </p>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss storage warning"
        className="flex-shrink-0 inline-flex items-center justify-center rounded-md p-1.5 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-800 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 transition-colors duration-200"
      >
        <svg
          className="h-4 w-4"
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
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

StorageBanner.propTypes = {
  className: PropTypes.string,
};

StorageBanner.defaultProps = {
  className: undefined,
};

export default StorageBanner;