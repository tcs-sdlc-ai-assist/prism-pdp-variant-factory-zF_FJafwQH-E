import { useCallback, useEffect, useRef } from 'react';

/**
 * @typedef {Object} FocusTrapHandle
 * @property {function(): void} activate - Activates the focus trap
 * @property {function(): void} deactivate - Deactivates the focus trap
 * @property {boolean} isActive - Whether the focus trap is currently active
 */

/**
 * @typedef {Object} UseAccessibilityReturn
 * @property {function(HTMLElement): FocusTrapHandle} trapFocus - Creates a focus trap within the given container element
 * @property {function(): void} restoreFocus - Restores focus to the element that was focused before the last trapFocus call
 * @property {function(string, string=): void} announceToScreenReader - Announces a message to screen readers via aria-live region
 * @property {function(string): void} skipToContent - Programmatically moves focus to the element matching the given selector or ID
 * @property {function(KeyboardEvent, Object.<string, function>): void} handleKeyboardNav - Delegates keyboard events to handler functions by key name
 * @property {function(HTMLElement): string[]} getFocusableElements - Returns a list of focusable element selectors within a container
 */

/**
 * Selector string for all focusable elements
 * @type {string}
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * ID for the aria-live announcer element
 * @type {string}
 */
const ANNOUNCER_ID = 'prism-a11y-announcer';

/**
 * Ensures the aria-live announcer element exists in the DOM.
 * Creates it if it does not already exist.
 *
 * @returns {HTMLElement} The announcer element
 */
function ensureAnnouncer() {
  let announcer = document.getElementById(ANNOUNCER_ID);
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = ANNOUNCER_ID;
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.margin = '-1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';
    document.body.appendChild(announcer);
  }
  return announcer;
}

/**
 * Custom hook: useAccessibility().
 * Provides keyboard navigation helpers, focus management utilities (trapFocus, restoreFocus),
 * announceToScreenReader function using aria-live region, and skip-to-content link management.
 *
 * @returns {UseAccessibilityReturn}
 */
export function useAccessibility() {
  /** @type {React.MutableRefObject<HTMLElement|null>} */
  const previousFocusRef = useRef(null);

  /** @type {React.MutableRefObject<function|null>} */
  const trapHandlerRef = useRef(null);

  /** @type {React.MutableRefObject<HTMLElement|null>} */
  const trapContainerRef = useRef(null);

  /** @type {React.MutableRefObject<boolean>} */
  const trapActiveRef = useRef(false);

  useEffect(() => {
    return () => {
      if (trapHandlerRef.current && trapContainerRef.current) {
        trapContainerRef.current.removeEventListener('keydown', trapHandlerRef.current);
      }
      trapHandlerRef.current = null;
      trapContainerRef.current = null;
      trapActiveRef.current = false;
    };
  }, []);

  /**
   * Returns all focusable elements within a container.
   *
   * @param {HTMLElement} container - The container element to search within
   * @returns {HTMLElement[]} Array of focusable elements
   */
  const getFocusableElements = useCallback((container) => {
    if (!container || typeof container.querySelectorAll !== 'function') {
      return [];
    }
    const elements = container.querySelectorAll(FOCUSABLE_SELECTOR);
    return Array.from(elements).filter((el) => {
      return el.offsetParent !== null || el.getClientRects().length > 0;
    });
  }, []);

  /**
   * Creates a focus trap within the given container element.
   * Tab and Shift+Tab cycle through focusable elements within the container.
   * Stores the previously focused element for later restoration.
   *
   * @param {HTMLElement} container - The container element to trap focus within
   * @returns {FocusTrapHandle} Handle with activate/deactivate methods
   */
  const trapFocus = useCallback((container) => {
    if (!container || typeof container.addEventListener !== 'function') {
      return {
        activate: () => {},
        deactivate: () => {},
        isActive: false,
      };
    }

    const keydownHandler = (event) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const activate = () => {
      if (trapActiveRef.current && trapContainerRef.current && trapHandlerRef.current) {
        trapContainerRef.current.removeEventListener('keydown', trapHandlerRef.current);
      }

      previousFocusRef.current = document.activeElement;
      trapContainerRef.current = container;
      trapHandlerRef.current = keydownHandler;
      trapActiveRef.current = true;

      container.addEventListener('keydown', keydownHandler);

      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    };

    const deactivate = () => {
      if (trapContainerRef.current && trapHandlerRef.current) {
        trapContainerRef.current.removeEventListener('keydown', trapHandlerRef.current);
      }
      trapActiveRef.current = false;
      trapContainerRef.current = null;
      trapHandlerRef.current = null;
    };

    return {
      activate,
      deactivate,
      get isActive() {
        return trapActiveRef.current;
      },
    };
  }, [getFocusableElements]);

  /**
   * Restores focus to the element that was focused before the last trapFocus call.
   * Also deactivates any active focus trap.
   */
  const restoreFocus = useCallback(() => {
    if (trapActiveRef.current && trapContainerRef.current && trapHandlerRef.current) {
      trapContainerRef.current.removeEventListener('keydown', trapHandlerRef.current);
      trapActiveRef.current = false;
      trapContainerRef.current = null;
      trapHandlerRef.current = null;
    }

    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  /**
   * Announces a message to screen readers via an aria-live region.
   * Supports 'polite' (default) and 'assertive' politeness levels.
   *
   * @param {string} message - The message to announce
   * @param {string} [politeness='polite'] - The aria-live politeness level ('polite' or 'assertive')
   */
  const announceToScreenReader = useCallback((message, politeness = 'polite') => {
    if (!message || typeof message !== 'string') {
      return;
    }

    const validPoliteness = politeness === 'assertive' ? 'assertive' : 'polite';
    const announcer = ensureAnnouncer();

    announcer.setAttribute('aria-live', validPoliteness);

    // Clear and re-set to ensure screen readers pick up the change
    announcer.textContent = '';

    requestAnimationFrame(() => {
      announcer.textContent = message;
    });
  }, []);

  /**
   * Programmatically moves focus to the element matching the given selector or ID.
   * If the target is not natively focusable, sets tabindex="-1" before focusing.
   *
   * @param {string} selectorOrId - A CSS selector or element ID (with or without '#' prefix)
   */
  const skipToContent = useCallback((selectorOrId) => {
    if (!selectorOrId || typeof selectorOrId !== 'string') {
      return;
    }

    let target = null;

    try {
      target = document.querySelector(selectorOrId);
    } catch (_e) {
      // If the selector is invalid, try as an ID
    }

    if (!target) {
      const id = selectorOrId.startsWith('#') ? selectorOrId.slice(1) : selectorOrId;
      target = document.getElementById(id);
    }

    if (!target) {
      return;
    }

    if (!target.hasAttribute('tabindex') && !target.matches(FOCUSABLE_SELECTOR)) {
      target.setAttribute('tabindex', '-1');
    }

    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /**
   * Delegates keyboard events to handler functions by key name.
   * Handlers are provided as an object mapping key names to callback functions.
   *
   * @param {KeyboardEvent} event - The keyboard event
   * @param {Object.<string, function(KeyboardEvent): void>} handlers - Map of key names to handler functions
   */
  const handleKeyboardNav = useCallback((event, handlers) => {
    if (!event || typeof event !== 'object') {
      return;
    }

    if (!handlers || typeof handlers !== 'object' || Array.isArray(handlers)) {
      return;
    }

    const key = event.key;

    if (!key || typeof key !== 'string') {
      return;
    }

    const handler = handlers[key];

    if (typeof handler === 'function') {
      handler(event);
    }
  }, []);

  return {
    trapFocus,
    restoreFocus,
    announceToScreenReader,
    skipToContent,
    handleKeyboardNav,
    getFocusableElements,
  };
}

export default useAccessibility;