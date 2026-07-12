import { STORAGE_KEYS } from '@/constants/constants.js';

/**
 * Namespace prefix for all persistence keys
 * @type {string}
 */
const NAMESPACE = 'prism_';

/**
 * Flag indicating whether the persistence manager is operating in fallback mode
 * (sessionStorage instead of localStorage)
 * @type {boolean}
 */
let isFallbackMode = false;

/**
 * Checks whether localStorage is available and functional
 * @returns {boolean} True if localStorage is available and writable
 */
export function isLocalStorageAvailable() {
  const testKey = '__prism_storage_test__';
  try {
    localStorage.setItem(testKey, 'test');
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return retrieved === 'test';
  } catch (_e) {
    return false;
  }
}

/**
 * Checks whether sessionStorage is available and functional
 * @returns {boolean} True if sessionStorage is available and writable
 */
function isSessionStorageAvailable() {
  const testKey = '__prism_storage_test__';
  try {
    sessionStorage.setItem(testKey, 'test');
    const retrieved = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    return retrieved === 'test';
  } catch (_e) {
    return false;
  }
}

/**
 * Returns the active storage backend (localStorage or sessionStorage)
 * Updates the isFallbackMode flag accordingly
 * @returns {Storage|null} The available storage object, or null if none available
 */
function getStorage() {
  if (isLocalStorageAvailable()) {
    isFallbackMode = false;
    return localStorage;
  }
  if (isSessionStorageAvailable()) {
    isFallbackMode = true;
    return sessionStorage;
  }
  isFallbackMode = true;
  return null;
}

/**
 * Serializes data to a JSON string
 * @param {*} data - The data to serialize
 * @returns {{ value: string|null, error: string|null }}
 */
function serialize(data) {
  try {
    const value = JSON.stringify(data);
    return { value, error: null };
  } catch (e) {
    return { value: null, error: `Serialization error: ${e.message}` };
  }
}

/**
 * Deserializes a JSON string to data
 * @param {string} raw - The raw JSON string
 * @returns {{ value: *, error: string|null }}
 */
function deserialize(raw) {
  try {
    const value = JSON.parse(raw);
    return { value, error: null };
  } catch (e) {
    return { value: null, error: `Deserialization error: ${e.message}` };
  }
}

/**
 * Saves data to browser storage under the given key
 * Tries localStorage first, falls back to sessionStorage
 * Handles quota exceeded and serialization errors gracefully
 * @param {string} key - The storage key
 * @param {*} data - The data to persist (must be JSON-serializable)
 * @returns {{ success: boolean, error: string|null, fallback: boolean }}
 */
export function save(key, data) {
  if (!key || typeof key !== 'string') {
    return { success: false, error: 'Storage key must be a non-empty string', fallback: isFallbackMode };
  }

  const { value: serialized, error: serializeError } = serialize(data);
  if (serializeError) {
    console.error(`[PersistenceManager] ${serializeError}`);
    return { success: false, error: serializeError, fallback: isFallbackMode };
  }

  const storage = getStorage();
  if (!storage) {
    console.error('[PersistenceManager] No storage backend available');
    return { success: false, error: 'No storage backend available', fallback: true };
  }

  try {
    storage.setItem(key, serialized);
    return { success: true, error: null, fallback: isFallbackMode };
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      console.error(`[PersistenceManager] Storage quota exceeded for key "${key}"`);

      if (!isFallbackMode && isSessionStorageAvailable()) {
        try {
          isFallbackMode = true;
          sessionStorage.setItem(key, serialized);
          console.warn('[PersistenceManager] Fell back to sessionStorage due to quota exceeded');
          return { success: true, error: null, fallback: true };
        } catch (fallbackError) {
          console.error('[PersistenceManager] Fallback sessionStorage also failed', fallbackError.message);
          return { success: false, error: `Quota exceeded in both storage backends: ${fallbackError.message}`, fallback: true };
        }
      }

      return { success: false, error: `Storage quota exceeded: ${e.message}`, fallback: isFallbackMode };
    }

    console.error(`[PersistenceManager] Failed to save key "${key}": ${e.message}`);
    return { success: false, error: `Storage write error: ${e.message}`, fallback: isFallbackMode };
  }
}

/**
 * Loads data from browser storage for the given key
 * Tries localStorage first, falls back to sessionStorage
 * Handles corrupted (non-parseable) data gracefully
 * @param {string} key - The storage key
 * @returns {{ data: *|null, error: string|null, fallback: boolean }}
 */
export function load(key) {
  if (!key || typeof key !== 'string') {
    return { data: null, error: 'Storage key must be a non-empty string', fallback: isFallbackMode };
  }

  const storage = getStorage();
  if (!storage) {
    console.error('[PersistenceManager] No storage backend available');
    return { data: null, error: 'No storage backend available', fallback: true };
  }

  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return { data: null, error: null, fallback: isFallbackMode };
    }

    const { value, error: deserializeError } = deserialize(raw);
    if (deserializeError) {
      console.error(`[PersistenceManager] Corrupted data for key "${key}": ${deserializeError}`);
      try {
        storage.removeItem(key);
      } catch (_removeErr) {
        // silently ignore removal failure
      }
      return { data: null, error: `Corrupted data removed for key "${key}": ${deserializeError}`, fallback: isFallbackMode };
    }

    return { data: value, error: null, fallback: isFallbackMode };
  } catch (e) {
    console.error(`[PersistenceManager] Failed to load key "${key}": ${e.message}`);
    return { data: null, error: `Storage read error: ${e.message}`, fallback: isFallbackMode };
  }
}

/**
 * Removes a specific key from browser storage
 * Removes from both localStorage and sessionStorage to ensure cleanup
 * @param {string} key - The storage key to remove
 * @returns {{ success: boolean, error: string|null }}
 */
export function remove(key) {
  if (!key || typeof key !== 'string') {
    return { success: false, error: 'Storage key must be a non-empty string' };
  }

  let removed = false;
  let lastError = null;

  try {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(key);
      removed = true;
    }
  } catch (e) {
    lastError = e.message;
    console.error(`[PersistenceManager] Failed to remove key "${key}" from localStorage: ${e.message}`);
  }

  try {
    if (isSessionStorageAvailable()) {
      sessionStorage.removeItem(key);
      removed = true;
    }
  } catch (e) {
    lastError = e.message;
    console.error(`[PersistenceManager] Failed to remove key "${key}" from sessionStorage: ${e.message}`);
  }

  if (!removed && lastError) {
    return { success: false, error: `Failed to remove key "${key}": ${lastError}` };
  }

  return { success: true, error: null };
}

/**
 * Resets all Prism-related data from both localStorage and sessionStorage
 * Clears all known storage keys defined in STORAGE_KEYS
 * @returns {{ success: boolean, error: string|null, keysCleared: string[] }}
 */
export function reset() {
  const keysCleared = [];
  const errors = [];

  const allKeys = Object.values(STORAGE_KEYS);

  for (const key of allKeys) {
    const { success, error } = remove(key);
    if (success) {
      keysCleared.push(key);
    }
    if (error) {
      errors.push(error);
    }
  }

  // Also clear any keys with the prism namespace prefix that may not be in STORAGE_KEYS
  const storages = [];
  try {
    if (isLocalStorageAvailable()) {
      storages.push(localStorage);
    }
  } catch (_e) {
    // ignore
  }
  try {
    if (isSessionStorageAvailable()) {
      storages.push(sessionStorage);
    }
  } catch (_e) {
    // ignore
  }

  for (const storage of storages) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < storage.length; i++) {
        const storageKey = storage.key(i);
        if (storageKey && storageKey.startsWith(NAMESPACE) && !allKeys.includes(storageKey)) {
          keysToRemove.push(storageKey);
        }
      }
      for (const storageKey of keysToRemove) {
        try {
          storage.removeItem(storageKey);
          keysCleared.push(storageKey);
        } catch (e) {
          errors.push(`Failed to remove "${storageKey}": ${e.message}`);
        }
      }
    } catch (e) {
      errors.push(`Failed to enumerate storage keys: ${e.message}`);
    }
  }

  isFallbackMode = !isLocalStorageAvailable();

  if (errors.length > 0) {
    console.warn(`[PersistenceManager] Reset completed with errors: ${errors.join('; ')}`);
    return { success: true, error: errors.join('; '), keysCleared };
  }

  return { success: true, error: null, keysCleared };
}

/**
 * Returns whether the persistence manager is currently operating in fallback mode
 * @returns {boolean}
 */
export function getIsFallbackMode() {
  getStorage();
  return isFallbackMode;
}

/**
 * Convenience method to save data and return only success/failure
 * @param {string} key - The storage key
 * @param {*} data - The data to persist
 * @returns {boolean} True if save was successful
 */
export function saveSync(key, data) {
  const { success } = save(key, data);
  return success;
}

/**
 * Convenience method to load data and return only the data (or null)
 * @param {string} key - The storage key
 * @returns {*|null} The loaded data, or null if not found or error
 */
export function loadSync(key) {
  const { data } = load(key);
  return data;
}

const persistenceManager = {
  isLocalStorageAvailable,
  save,
  load,
  remove,
  reset,
  getIsFallbackMode,
  saveSync,
  loadSync,
};

export default persistenceManager;