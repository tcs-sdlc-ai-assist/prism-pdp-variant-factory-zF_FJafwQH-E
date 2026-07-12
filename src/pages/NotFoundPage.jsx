import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAccessibility } from '@/hooks/useAccessibility.js';
import { ROUTE_PATHS } from '@/constants/constants.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * 404 Not Found page component.
 * Displays a 'Page not found' message with CTA buttons linking back to
 * Cohort Intake (/cohorts) and other key routes. Accessible with proper
 * heading hierarchy and focus management.
 *
 * @returns {React.ReactElement}
 */
function NotFoundPage() {
  const { announceToScreenReader } = useAccessibility();
  const headingRef = useRef(null);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }

    announceToScreenReader('Page not found. Use the links below to navigate back.', 'polite');

    emitEvent(EVENT_TYPES.ERROR, {
      action: 'NotFoundPage:render',
      message: 'User navigated to a non-existent route',
      path: window.location.pathname,
    });
  }, [announceToScreenReader]);

  return (
    <section
      role="region"
      aria-label="Page not found"
      className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in"
    >
      <div className="flex flex-col items-center justify-center max-w-lg text-center px-4">
        {/* 404 Icon */}
        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary-50 mb-6">
          <svg
            className="h-10 w-10 text-primary-500"
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
              d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* 404 Badge */}
        <span className="inline-flex items-center rounded-md bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-600 mb-4">
          404
        </span>

        {/* Heading */}
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold text-neutral-900 mb-2 focus:outline-none"
        >
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Navigate back to configure cohort targets and generate tailored PDP variants.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={ROUTE_PATHS.COHORTS}
            className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 no-underline"
          >
            <svg
              className="h-4 w-4"
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
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
              />
            </svg>
            Go to Cohort Intake
          </Link>

          <Link
            to={ROUTE_PATHS.CATALOG}
            className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 no-underline"
          >
            <svg
              className="h-4 w-4"
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
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
            View Catalog
          </Link>

          <Link
            to={ROUTE_PATHS.VARIANTS}
            className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 no-underline"
          >
            <svg
              className="h-4 w-4"
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
            View Gallery
          </Link>
        </div>

        {/* Home link */}
        <div className="mt-6">
          <Link
            to={ROUTE_PATHS.HOME}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors duration-200 no-underline"
          >
            <svg
              className="h-3.5 w-3.5"
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
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-12 border-t border-neutral-200 pt-4 w-full max-w-lg">
        <svg
          className="h-4 w-4 text-neutral-400"
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
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
        <p className="text-xs text-neutral-400">
          The requested page could not be found. Use the navigation above or the links on this page to continue.
        </p>
      </div>
    </section>
  );
}

export default NotFoundPage;