import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getCatalog, resetCatalog } from '@/services/catalogLoader.js';
import { loadCohortSet, saveCohortSet, resetCohortSet } from '@/services/cohortIntakeService.js';
import { getIsFallbackMode } from '@/services/persistenceManager.js';
import { save, load } from '@/services/persistenceManager.js';
import { STORAGE_KEYS } from '@/constants/constants.js';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * @typedef {Object} AppState
 * @property {Array<*>} catalog - The product catalog items
 * @property {object|null} cohortSet - The current cohort set configuration
 * @property {Array<*>} variants - Generated variant objects
 * @property {Array<*>} manifests - Built manifest objects
 * @property {boolean} diffToggle - Whether diff highlighting is enabled
 * @property {boolean} isFallbackMode - Whether persistence is using sessionStorage fallback
 * @property {boolean} isLoading - Whether initial data loading is in progress
 * @property {string|null} error - Current error message, if any
 */

/**
 * @typedef {Object} AppActions
 * @property {function(Array<*>): void} setCatalog - Sets the catalog data
 * @property {function(object): void} setCohortSet - Sets and persists the cohort set
 * @property {function(Array<*>): void} setVariants - Sets the variants array
 * @property {function(Array<*>): void} setManifests - Sets the manifests array
 * @property {function(): void} toggleDiff - Toggles the diff highlight mode
 * @property {function(): Promise<void>} resetAll - Resets all state to defaults
 * @property {function(string|null): void} setError - Sets or clears the error message
 * @property {function(boolean): void} setIsLoading - Sets the loading state
 */

/**
 * @typedef {AppState & AppActions} AppContextValue
 */

/** @type {React.Context<AppContextValue|null>} */
const AppContext = createContext(null);

/**
 * Custom hook to access the AppContext.
 * Throws if used outside of AppProvider.
 *
 * @returns {AppContextValue}
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * AppProvider component that wraps children with global application state.
 * Initializes state from persistence on mount.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {React.ReactElement}
 */
export function AppProvider({ children }) {
  const [catalog, setCatalogState] = useState([]);
  const [cohortSet, setCohortSetState] = useState(null);
  const [variants, setVariantsState] = useState([]);
  const [manifests, setManifestsState] = useState([]);
  const [diffToggle, setDiffToggle] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setIsFallbackMode(getIsFallbackMode());

      const catalogResult = getCatalog();
      if (catalogResult.catalog && catalogResult.catalog.length > 0) {
        setCatalogState(catalogResult.catalog);
      }
      if (catalogResult.errors && catalogResult.errors.length > 0) {
        console.warn('[AppContext] Catalog load warnings:', catalogResult.errors);
      }

      const cohortResult = loadCohortSet();
      if (cohortResult.cohortSet) {
        setCohortSetState(cohortResult.cohortSet);
      }
      if (cohortResult.errors && cohortResult.errors.length > 0) {
        console.warn('[AppContext] Cohort set load warnings:', cohortResult.errors);
      }

      const variantsLoad = load(STORAGE_KEYS.VARIANTS_KEY);
      if (variantsLoad.data && Array.isArray(variantsLoad.data)) {
        setVariantsState(variantsLoad.data);
      }

      const manifestsLoad = load(STORAGE_KEYS.MANIFESTS_KEY);
      if (manifestsLoad.data && Array.isArray(manifestsLoad.data)) {
        setManifestsState(manifestsLoad.data);
      }

      emitEvent(EVENT_TYPES.PDP_LOAD, {
        action: 'AppContext:initialize',
        catalogCount: catalogResult.catalog ? catalogResult.catalog.length : 0,
        cohortCount: cohortResult.cohortSet && Array.isArray(cohortResult.cohortSet.cohorts)
          ? cohortResult.cohortSet.cohorts.length
          : 0,
        variantsCount: variantsLoad.data && Array.isArray(variantsLoad.data)
          ? variantsLoad.data.length
          : 0,
        manifestsCount: manifestsLoad.data && Array.isArray(manifestsLoad.data)
          ? manifestsLoad.data.length
          : 0,
        isFallbackMode: getIsFallbackMode(),
      });
    } catch (e) {
      console.error('[AppContext] Initialization error:', e.message);
      setError(`Failed to initialize application state: ${e.message}`);

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'AppContext:initialize',
        error: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setCatalog = useCallback((newCatalog) => {
    if (!Array.isArray(newCatalog)) {
      console.error('[AppContext] setCatalog: catalog must be an array');
      return;
    }
    setCatalogState(newCatalog);
    save(STORAGE_KEYS.CATALOG_KEY, newCatalog);
  }, []);

  const setCohortSet = useCallback((newCohortSet) => {
    if (!newCohortSet || typeof newCohortSet !== 'object') {
      console.error('[AppContext] setCohortSet: cohortSet must be a non-null object');
      return;
    }
    const saveResult = saveCohortSet(newCohortSet);
    if (saveResult.success && saveResult.cohortSet) {
      setCohortSetState(saveResult.cohortSet);
    } else {
      console.error('[AppContext] setCohortSet: save failed', saveResult.errors);
      setError(`Failed to save cohort set: ${saveResult.errors.join('; ')}`);
    }
  }, []);

  const setVariants = useCallback((newVariants) => {
    if (!Array.isArray(newVariants)) {
      console.error('[AppContext] setVariants: variants must be an array');
      return;
    }
    setVariantsState(newVariants);
    save(STORAGE_KEYS.VARIANTS_KEY, newVariants);
  }, []);

  const setManifests = useCallback((newManifests) => {
    if (!Array.isArray(newManifests)) {
      console.error('[AppContext] setManifests: manifests must be an array');
      return;
    }
    setManifestsState(newManifests);
    save(STORAGE_KEYS.MANIFESTS_KEY, newManifests);
  }, []);

  const toggleDiff = useCallback(() => {
    setDiffToggle((prev) => !prev);
  }, []);

  const resetAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const catalogResult = resetCatalog();
      setCatalogState(catalogResult.catalog || []);

      const cohortResult = resetCohortSet();
      setCohortSetState(cohortResult.cohortSet || null);

      setVariantsState([]);
      save(STORAGE_KEYS.VARIANTS_KEY, []);

      setManifestsState([]);
      save(STORAGE_KEYS.MANIFESTS_KEY, []);

      setDiffToggle(false);
      setIsFallbackMode(getIsFallbackMode());

      emitEvent(EVENT_TYPES.PDP_LOAD, {
        action: 'AppContext:resetAll',
        catalogCount: catalogResult.catalog ? catalogResult.catalog.length : 0,
        cohortCount: cohortResult.cohortSet && Array.isArray(cohortResult.cohortSet.cohorts)
          ? cohortResult.cohortSet.cohorts.length
          : 0,
      });
    } catch (e) {
      console.error('[AppContext] Reset error:', e.message);
      setError(`Failed to reset application state: ${e.message}`);

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'AppContext:resetAll',
        error: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      catalog,
      cohortSet,
      variants,
      manifests,
      diffToggle,
      isFallbackMode,
      isLoading,
      error,
      setCatalog,
      setCohortSet,
      setVariants,
      setManifests,
      toggleDiff,
      resetAll,
      setError,
      setIsLoading,
    }),
    [
      catalog,
      cohortSet,
      variants,
      manifests,
      diffToggle,
      isFallbackMode,
      isLoading,
      error,
      setCatalog,
      setCohortSet,
      setVariants,
      setManifests,
      toggleDiff,
      resetAll,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppContext;