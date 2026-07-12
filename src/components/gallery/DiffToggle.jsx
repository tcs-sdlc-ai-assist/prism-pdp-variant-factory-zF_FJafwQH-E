import { useCallback, useId } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * @typedef {Object} DiffToggleProps
 * @property {boolean} [disabled=false] - Whether the toggle is disabled
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Diff-from-control toggle button component: accessible toggle switch that
 * enables/disables diff highlighting across the gallery. Shows current state
 * (on/off) with visual indicator. Updates global diffToggle state via AppContext.
 *
 * @param {DiffToggleProps} props
 * @returns {React.ReactElement}
 */
function DiffToggle({ disabled = false, className }) {
  const uniqueId = useId();
  const { diffToggle, toggleDiff } = useAppContext();
  const { announceToScreenReader } = useAccessibility();

  const toggleId = `${uniqueId}-diff-toggle`;
  const labelId = `${uniqueId}-diff-toggle-label`;
  const descriptionId = `${uniqueId}-diff-toggle-description`;

  const handleToggle = useCallback(() => {
    if (disabled) {
      return;
    }

    toggleDiff();

    const nextState = !diffToggle;
    const message = nextState
      ? 'Diff highlighting enabled'
      : 'Diff highlighting disabled';

    announceToScreenReader(message, 'polite');

    emitEvent(EVENT_TYPES.PDP_LOAD, {
      action: 'DiffToggle:toggle',
      diffEnabled: nextState,
    });
  }, [disabled, diffToggle, toggleDiff, announceToScreenReader]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  return (
    <div
      className={`inline-flex items-center gap-3 animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Label */}
      <div className="flex flex-col">
        <span
          id={labelId}
          className="text-sm font-medium text-neutral-700"
        >
          Diff Highlighting
        </span>
        <span
          id={descriptionId}
          className="text-xs text-neutral-500"
        >
          {diffToggle
            ? 'Showing changes from control variant'
            : 'Diff overlay is off'}
        </span>
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        id={toggleId}
        role="switch"
        aria-checked={diffToggle}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          diffToggle ? 'bg-accent-500' : 'bg-neutral-300'
        }`}
      >
        <span className="sr-only">
          {diffToggle ? 'Disable diff highlighting' : 'Enable diff highlighting'}
        </span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
            diffToggle ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {/* Icon inside the toggle knob */}
          {diffToggle ? (
            <svg
              className="h-5 w-5 p-0.5 text-accent-600"
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
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 p-0.5 text-neutral-400"
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
          )}
        </span>
      </button>

      {/* Status badge */}
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
          diffToggle
            ? 'bg-accent-50 text-neutral-800'
            : 'bg-neutral-100 text-neutral-500'
        }`}
      >
        {diffToggle ? 'On' : 'Off'}
      </span>
    </div>
  );
}

DiffToggle.propTypes = {
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

DiffToggle.defaultProps = {
  disabled: false,
  className: undefined,
};

export default DiffToggle;