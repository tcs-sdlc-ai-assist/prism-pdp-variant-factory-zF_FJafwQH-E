import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility.js';

/**
 * Accessible skip-to-content link component.
 * Renders a visually hidden link that becomes visible on focus, allowing
 * keyboard users to skip navigation and jump to main content.
 * WCAG 2.1 AA requirement (Success Criterion 2.4.1 — Bypass Blocks).
 *
 * @param {{ targetId?: string, label?: string, className?: string }} props
 * @returns {React.ReactElement}
 */
function SkipToContent({ targetId, label, className }) {
  const { skipToContent, announceToScreenReader } = useAccessibility();

  const resolvedTargetId = targetId || 'main-content';
  const resolvedLabel = label || 'Skip to main content';

  const handleClick = useCallback(
    (event) => {
      event.preventDefault();
      skipToContent(`#${resolvedTargetId}`);
      announceToScreenReader('Skipped to main content', 'polite');
    },
    [resolvedTargetId, skipToContent, announceToScreenReader],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        skipToContent(`#${resolvedTargetId}`);
        announceToScreenReader('Skipped to main content', 'polite');
      }
    },
    [resolvedTargetId, skipToContent, announceToScreenReader],
  );

  return (
    <a
      href={`#${resolvedTargetId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`absolute left-0 top-0 z-50 -translate-y-full bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-200 focus:translate-y-0 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500${className ? ` ${className}` : ''}`}
    >
      {resolvedLabel}
    </a>
  );
}

SkipToContent.propTypes = {
  targetId: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
};

SkipToContent.defaultProps = {
  targetId: 'main-content',
  label: 'Skip to main content',
  className: undefined,
};

export default SkipToContent;