import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { ROUTE_PATHS } from '@/constants/constants.js';

/**
 * @typedef {Object} NavLink
 * @property {string} label - Display label for the navigation link
 * @property {string} to - Route path for the link
 */

/** @type {NavLink[]} */
const NAV_LINKS = [
  { label: 'Catalog', to: ROUTE_PATHS.CATALOG },
  { label: 'Cohorts', to: ROUTE_PATHS.COHORTS },
  { label: 'Gallery', to: ROUTE_PATHS.VARIANTS },
];

/**
 * Application header component with Best Buy-style brand bar.
 * Features Prism logo text, primary navigation links (Catalog, Cohorts, Gallery),
 * and brand colors. Responsive with mobile hamburger menu.
 * Includes ARIA navigation landmark for accessibility.
 *
 * @param {{ className?: string }} props
 * @returns {React.ReactElement}
 */
function Header({ className }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { announceToScreenReader, trapFocus, restoreFocus } = useAccessibility();
  const mobileMenuRef = useRef(null);
  const hamburgerButtonRef = useRef(null);
  const trapHandleRef = useRef(null);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        announceToScreenReader('Navigation menu opened', 'polite');
      } else {
        announceToScreenReader('Navigation menu closed', 'polite');
      }
      return next;
    });
  }, [announceToScreenReader]);

  const closeMobileMenu = useCallback(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      announceToScreenReader('Navigation menu closed', 'polite');
    }
  }, [isMobileMenuOpen, announceToScreenReader]);

  useEffect(() => {
    closeMobileMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      trapHandleRef.current = trapFocus(mobileMenuRef.current);
      trapHandleRef.current.activate();
    } else {
      if (trapHandleRef.current) {
        trapHandleRef.current.deactivate();
        trapHandleRef.current = null;
      }
      if (hamburgerButtonRef.current) {
        hamburgerButtonRef.current.focus();
      }
    }

    return () => {
      if (trapHandleRef.current) {
        trapHandleRef.current.deactivate();
        trapHandleRef.current = null;
      }
    };
  }, [isMobileMenuOpen, trapFocus]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
        if (hamburgerButtonRef.current) {
          hamburgerButtonRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  /**
   * Determines if a nav link is currently active based on the current route.
   *
   * @param {string} to - The route path to check
   * @returns {boolean} True if the link matches the current route
   */
  const isActiveLink = useCallback(
    (to) => {
      if (to === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(to);
    },
    [location.pathname],
  );

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-primary-500 shadow-md${className ? ` ${className}` : ''}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand / Logo */}
          <div className="flex items-center gap-2">
            <Link
              to={ROUTE_PATHS.HOME}
              className="flex items-center gap-2 text-white no-underline hover:text-accent-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors duration-200"
              aria-label="Prism PDP Variant Factory — Home"
            >
              <svg
                className="h-7 w-7 text-accent-500"
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
              <span className="text-lg font-bold tracking-tight">
                Prism
              </span>
              <span className="hidden text-sm font-medium text-primary-200 sm:inline">
                PDP Variant Factory
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex md:items-center md:gap-1"
          >
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    active
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              ref={hamburgerButtonRef}
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex items-center justify-center rounded-md p-2 text-primary-100 hover:bg-primary-600 hover:text-white focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
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
              ) : (
                <svg
                  className="h-6 w-6"
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
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <nav
          id="mobile-navigation-menu"
          ref={mobileMenuRef}
          aria-label="Mobile navigation"
          className="border-t border-primary-600 bg-primary-500 md:hidden animate-slide-down"
        >
          <div className="space-y-1 px-4 pb-3 pt-2">
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={`block rounded-md px-3 py-2 text-base font-medium transition-colors duration-200 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    active
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

Header.propTypes = {
  className: PropTypes.string,
};

Header.defaultProps = {
  className: undefined,
};

export default Header;