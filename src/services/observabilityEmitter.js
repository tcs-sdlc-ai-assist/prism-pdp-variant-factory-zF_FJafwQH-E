/**
 * Simulated Dynatrace/Splunk-style observability event emitter.
 * Provides emitEvent(eventType, payload) that logs to console and pushes
 * to an in-memory event buffer. No real external network calls.
 *
 * @module observabilityEmitter
 */

/**
 * Valid event types for the observability emitter
 * @readonly
 * @enum {string}
 */
export const EVENT_TYPES = {
  PDP_LOAD: 'PDP_LOAD',
  COHORT_CONFIG: 'COHORT_CONFIG',
  VARIANT_GENERATED: 'VARIANT_GENERATED',
  EXPORT_ACTION: 'EXPORT_ACTION',
  ERROR: 'ERROR',
};

/**
 * Maximum number of events to retain in the in-memory buffer
 * @type {number}
 */
const MAX_BUFFER_SIZE = 500;

/**
 * In-memory event buffer
 * @type {Array<{ id: string, eventType: string, payload: *, timestamp: string, sequence: number }>}
 */
let eventBuffer = [];

/**
 * Monotonically increasing sequence counter for event ordering
 * @type {number}
 */
let sequenceCounter = 0;

/**
 * Registered listener callbacks
 * @type {Array<function>}
 */
let listeners = [];

/**
 * Generates a simple unique identifier for each event
 * @returns {string}
 */
function generateEventId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `evt_${timestamp}_${random}`;
}

/**
 * Validates that the provided event type is a known EVENT_TYPE
 * @param {string} eventType - The event type to validate
 * @returns {boolean}
 */
function isValidEventType(eventType) {
  return Object.values(EVENT_TYPES).includes(eventType);
}

/**
 * Emits a simulated observability event. Logs to console and pushes
 * to the in-memory event buffer. Notifies all registered listeners.
 *
 * @param {string} eventType - One of EVENT_TYPES (PDP_LOAD, COHORT_CONFIG, VARIANT_GENERATED, EXPORT_ACTION, ERROR)
 * @param {*} [payload={}] - Arbitrary payload data associated with the event
 * @returns {{ success: boolean, event: object|null, error: string|null }}
 */
export function emitEvent(eventType, payload = {}) {
  if (!eventType || typeof eventType !== 'string') {
    console.error('[ObservabilityEmitter] eventType must be a non-empty string');
    return {
      success: false,
      event: null,
      error: 'eventType must be a non-empty string',
    };
  }

  if (!isValidEventType(eventType)) {
    console.error(
      `[ObservabilityEmitter] Unknown eventType "${eventType}". Valid types: ${Object.values(EVENT_TYPES).join(', ')}`,
    );
    return {
      success: false,
      event: null,
      error: `Unknown eventType "${eventType}". Valid types: ${Object.values(EVENT_TYPES).join(', ')}`,
    };
  }

  sequenceCounter += 1;

  const event = {
    id: generateEventId(),
    eventType,
    payload,
    timestamp: new Date().toISOString(),
    sequence: sequenceCounter,
  };

  // Log to console in a structured format (simulating Dynatrace/Splunk ingestion)
  if (eventType === EVENT_TYPES.ERROR) {
    console.error(`[ObservabilityEmitter] [${event.eventType}] seq=${event.sequence}`, event);
  } else {
    console.warn(`[ObservabilityEmitter] [${event.eventType}] seq=${event.sequence}`, event);
  }

  // Push to in-memory buffer, evicting oldest events if over capacity
  eventBuffer.push(event);
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer = eventBuffer.slice(eventBuffer.length - MAX_BUFFER_SIZE);
  }

  // Notify listeners
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (e) {
      console.error('[ObservabilityEmitter] Listener error:', e.message);
    }
  }

  return { success: true, event, error: null };
}

/**
 * Returns a shallow copy of the current event buffer
 * @returns {Array<{ id: string, eventType: string, payload: *, timestamp: string, sequence: number }>}
 */
export function getEventBuffer() {
  return [...eventBuffer];
}

/**
 * Returns events filtered by a specific event type
 * @param {string} eventType - The event type to filter by
 * @returns {Array<{ id: string, eventType: string, payload: *, timestamp: string, sequence: number }>}
 */
export function getEventsByType(eventType) {
  if (!eventType || typeof eventType !== 'string') {
    return [];
  }
  return eventBuffer.filter((event) => event.eventType === eventType);
}

/**
 * Returns the total number of events in the buffer
 * @returns {number}
 */
export function getEventCount() {
  return eventBuffer.length;
}

/**
 * Clears the in-memory event buffer and resets the sequence counter
 * @returns {{ success: boolean, eventsCleared: number }}
 */
export function clearEventBuffer() {
  const eventsCleared = eventBuffer.length;
  eventBuffer = [];
  sequenceCounter = 0;
  return { success: true, eventsCleared };
}

/**
 * Registers a listener callback that will be invoked on each emitted event
 * @param {function} callback - The listener function, receives the event object
 * @returns {{ success: boolean, error: string|null }}
 */
export function subscribe(callback) {
  if (typeof callback !== 'function') {
    return { success: false, error: 'Callback must be a function' };
  }
  listeners.push(callback);
  return { success: true, error: null };
}

/**
 * Unregisters a previously registered listener callback
 * @param {function} callback - The listener function to remove
 * @returns {{ success: boolean, error: string|null }}
 */
export function unsubscribe(callback) {
  if (typeof callback !== 'function') {
    return { success: false, error: 'Callback must be a function' };
  }
  const index = listeners.indexOf(callback);
  if (index === -1) {
    return { success: false, error: 'Callback not found in listeners' };
  }
  listeners.splice(index, 1);
  return { success: true, error: null };
}

/**
 * Removes all registered listeners
 * @returns {{ success: boolean, listenersRemoved: number }}
 */
export function clearListeners() {
  const listenersRemoved = listeners.length;
  listeners = [];
  return { success: true, listenersRemoved };
}

/**
 * Resets the entire observability emitter state (buffer, sequence, listeners)
 * @returns {{ success: boolean, eventsCleared: number, listenersRemoved: number }}
 */
export function resetEmitter() {
  const eventsCleared = eventBuffer.length;
  const listenersRemoved = listeners.length;
  eventBuffer = [];
  sequenceCounter = 0;
  listeners = [];
  return { success: true, eventsCleared, listenersRemoved };
}

const observabilityEmitter = {
  EVENT_TYPES,
  emitEvent,
  getEventBuffer,
  getEventsByType,
  getEventCount,
  clearEventBuffer,
  subscribe,
  unsubscribe,
  clearListeners,
  resetEmitter,
};

export default observabilityEmitter;