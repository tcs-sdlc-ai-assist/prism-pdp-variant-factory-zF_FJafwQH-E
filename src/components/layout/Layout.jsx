import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import SkipToContent from '@/components/common/SkipToContent.jsx';
import StorageBanner from '@/components/common/StorageBanner.jsx';
import AriaLiveRegion from '@/components/common/AriaLiveRegion.jsx';
import Header from '@/components/layout/Header.jsx';
import Footer from '@/components/layout/Footer.jsx';

/**
 * Main layout wrapper component for the Prism PDP Variant Factory.
 * Renders the full page structure including:
 * - SkipToContent link (WCAG 2.1 AA bypass block)
 * - StorageBanner (sessionStorage fallback warning)
 * - Header with primary navigation
 * - Main content area with Outlet for routed children
 * - AriaLiveRegion for dynamic screen reader announcements
 * - Footer with brand info and disclaimer
 *
 * @param {{ className?: string }} props
 * @returns {React.ReactElement}
 */
function Layout({ className }) {
  const [announcement, setAnnouncement] = useState('');

  return (
    <div className={`flex min-h-screen flex-col bg-neutral-50${className ? ` ${className}` : ''}`}>
      <SkipToContent targetId="main-content" label="Skip to main content" />

      <Header />

      <StorageBanner className="mx-auto mt-2 max-w-7xl px-4 sm:px-6 lg:px-8" />

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className="flex-1 w-full mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 focus:outline-none"
      >
        <Outlet />
      </main>

      <AriaLiveRegion
        message={announcement}
        politeness="polite"
        atomic={true}
        clearOnUnmount={true}
      />

      <Footer />
    </div>
  );
}

Layout.propTypes = {
  className: PropTypes.string,
};

Layout.defaultProps = {
  className: undefined,
};

export default Layout;