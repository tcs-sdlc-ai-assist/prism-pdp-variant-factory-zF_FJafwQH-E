import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext.jsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import router from '@/router.jsx';

/**
 * Root application component.
 * Wraps RouterProvider with ErrorBoundary and AppContext provider.
 * Initializes application state (catalog seeding, storage check) on mount
 * via AppProvider's internal useEffect.
 *
 * @returns {React.ReactElement}
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;