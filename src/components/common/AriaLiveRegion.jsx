import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {'polite' | 'assertive' | 'off'} AriaPoliteness
 */

/**
 * @typedef {Object} AriaLiveRegionProps
 * @property {string} [message=''] - The message to announce to screen readers
 * @property {AriaPoliteness} [politeness='polite'] - The aria-live politeness level
 * @property {boolean} [atomic=true] - Whether the entire region should be read as a whole
 * @property {string} [role] - Optional ARIA role override ('status', 'alert', 'log', 'timer')
 * @property {boolean} [clearOnUnmount=true] - Whether to clear the message when the component unmounts
 * @property {number} [clearAfterMs=0] - Auto-clear the message after this many milliseconds (0 = no auto-clear)
 * @property {string} [className] - Additional CSS classes to apply to the container
 * @property {boolean} [visible=false] - Whether the region should be visually visible (default: visually hidden)
 * @property {React.ReactNode} [children] - Optional children to render inside the live region instead of message
 */

/**
 * Accessible aria-live region component for dynamic announcements to screen readers.
 * Provides polite and assertive announcement modes. Used by variant generation progress,
 * error messages, and navigation changes.
 *
 * By default, the region is visually hidden but accessible to screen readers.
 * Set `visible={true}` to make the region visible in the layout.
 *
 * The component clears and re-sets the message content using a brief empty-state
 * cycle to ensure screen readers detect the change even when the same message
 * is announced consecutively.
 *
 * @param {AriaLiveRegionProps} props
 * @returns {React.ReactElement}
 */
function AriaLiveRegion({
  message = '',
  politeness = 'polite',
  atomic = true,
  role,
  clearOnUnmount = true,
  clearAfterMs = 0,
  className,
  visible = false,
  children,
}) {
  const [currentMessage, setCurrentMessage] = useState('');
  const clearTimerRef = useRef(null);
  const announceTimerRef = useRef(null);

  const resolvedPoliteness =
    politeness === 'assertive' || politeness === 'off' ? politeness : 'polite';

  const resolvedRole = role || (resolvedPoliteness === 'assertive' ? 'alert' : 'status');

  useEffect(() => {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      setCurrentMessage('');
      return;
    }

    // Clear first to force screen readers to re-announce even if the same message is set
    setCurrentMessage('');

    announceTimerRef.current = requestAnimationFrame(() => {
      setCurrentMessage(message);
    });

    return () => {
      if (announceTimerRef.current) {
        cancelAnimationFrame(announceTimerRef.current);
        announceTimerRef.current = null;
      }
    };
  }, [message]);

  useEffect(() => {
    if (clearAfterMs > 0 && currentMessage.length > 0) {
      clearTimerRef.current = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfterMs);
    }

    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [clearAfterMs, currentMessage]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        setCurrentMessage('');
      }
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      if (announceTimerRef.current) {
        cancelAnimationFrame(announceTimerRef.current);
        announceTimerRef.current = null;
      }
    };
  }, [clearOnUnmount]);

  const hiddenStyles = visible
    ? undefined
    : {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      };

  const visibleClassName = visible
    ? `text-sm text-neutral-700${className ? ` ${className}` : ''}`
    : className || undefined;

  return (
    <div
      role={resolvedRole}
      aria-live={resolvedPoliteness}
      aria-atomic={atomic}
      style={hiddenStyles}
      className={visibleClassName}
    >
      {children || currentMessage}
    </div>
  );
}

AriaLiveRegion.propTypes = {
  message: PropTypes.string,
  politeness: PropTypes.oneOf(['polite', 'assertive', 'off']),
  atomic: PropTypes.bool,
  role: PropTypes.oneOf(['status', 'alert', 'log', 'timer']),
  clearOnUnmount: PropTypes.bool,
  clearAfterMs: PropTypes.number,
  className: PropTypes.string,
  visible: PropTypes.bool,
  children: PropTypes.node,
};

AriaLiveRegion.defaultProps = {
  message: '',
  politeness: 'polite',
  atomic: true,
  role: undefined,
  clearOnUnmount: true,
  clearAfterMs: 0,
  className: undefined,
  visible: false,
  children: undefined,
};

export default AriaLiveRegion;