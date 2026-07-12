import { useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { buildManifest } from '@/services/manifestBuilder.js';

/**
 * @typedef {Object} ManifestViewerProps
 * @property {object} [manifest] - Pre-built manifest object to display
 * @property {object} [variant] - Variant object to build manifest from (used if manifest not provided)
 * @property {boolean} [collapsed=false] - Whether the viewer starts collapsed
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Applies basic syntax highlighting to a JSON string.
 * Returns an array of React elements with appropriate color classes.
 *
 * @param {string} jsonString - The formatted JSON string to highlight
 * @returns {React.ReactElement[]} Array of styled spans
 */
function highlightJson(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return [];
  }

  const tokenRegex = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;

  const elements = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = tokenRegex.exec(jsonString)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <span key={`ws-${keyIndex++}`} className="text-neutral-400">
          {jsonString.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const token = match[0];

    if (match[1]) {
      // Key (string followed by colon)
      const colonIndex = token.lastIndexOf(':');
      const keyPart = token.slice(0, colonIndex);
      const colonPart = token.slice(colonIndex);
      elements.push(
        <span key={`k-${keyIndex++}`}>
          <span className="text-primary-400">{keyPart}</span>
          <span className="text-neutral-400">{colonPart}</span>
        </span>,
      );
    } else if (match[2]) {
      // String value
      elements.push(
        <span key={`s-${keyIndex++}`} className="text-green-400">
          {token}
        </span>,
      );
    } else if (match[3]) {
      // Boolean
      elements.push(
        <span key={`b-${keyIndex++}`} className="text-amber-400">
          {token}
        </span>,
      );
    } else if (match[4]) {
      // Null
      elements.push(
        <span key={`n-${keyIndex++}`} className="text-red-400">
          {token}
        </span>,
      );
    } else if (match[5]) {
      // Number
      elements.push(
        <span key={`num-${keyIndex++}`} className="text-cyan-400">
          {token}
        </span>,
      );
    } else if (match[6]) {
      // Punctuation
      elements.push(
        <span key={`p-${keyIndex++}`} className="text-neutral-500">
          {token}
        </span>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < jsonString.length) {
    elements.push(
      <span key={`end-${keyIndex++}`} className="text-neutral-400">
        {jsonString.slice(lastIndex)}
      </span>,
    );
  }

  return elements;
}

/**
 * Manifest JSON viewer component: renders variant-manifest.json in a formatted,
 * syntax-highlighted code block using JetBrains Mono font. Includes copy-to-clipboard
 * button. Scrollable container for long manifests.
 *
 * @param {ManifestViewerProps} props
 * @returns {React.ReactElement}
 */
function ManifestViewer({ manifest, variant, collapsed = false, className }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [copyState, setCopyState] = useState('idle');
  const copyTimeoutRef = useRef(null);

  const resolvedManifest = useMemo(() => {
    if (manifest && typeof manifest === 'object') {
      return manifest;
    }

    if (variant && typeof variant === 'object') {
      const result = buildManifest(variant);
      if (result.manifest) {
        return result.manifest;
      }
    }

    return null;
  }, [manifest, variant]);

  const formattedJson = useMemo(() => {
    if (!resolvedManifest) {
      return '';
    }
    try {
      return JSON.stringify(resolvedManifest, null, 2);
    } catch (_e) {
      return '';
    }
  }, [resolvedManifest]);

  const highlightedElements = useMemo(() => {
    return highlightJson(formattedJson);
  }, [formattedJson]);

  const lineCount = useMemo(() => {
    if (!formattedJson) {
      return 0;
    }
    return formattedJson.split('\n').length;
  }, [formattedJson]);

  const lineNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 1; i <= lineCount; i++) {
      numbers.push(i);
    }
    return numbers;
  }, [lineCount]);

  const handleCopy = useCallback(async () => {
    if (!formattedJson || copyState === 'copying') {
      return;
    }

    setCopyState('copying');

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(formattedJson);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = formattedJson;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (_e) {
          // ignore
        }
        document.body.removeChild(textArea);
      }

      setCopyState('copied');

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopyState('idle');
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (_e) {
      setCopyState('error');

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopyState('idle');
        copyTimeoutRef.current = null;
      }, 2000);
    }
  }, [formattedJson, copyState]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const appliedTailoringCount = useMemo(() => {
    if (
      resolvedManifest &&
      Array.isArray(resolvedManifest.appliedTailoring)
    ) {
      return resolvedManifest.appliedTailoring.length;
    }
    return 0;
  }, [resolvedManifest]);

  if (!resolvedManifest) {
    return (
      <aside
        role="complementary"
        aria-label="Manifest viewer"
        className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm${className ? ` ${className}` : ''}`}
      >
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <svg
            className="h-8 w-8 text-neutral-300"
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
              d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
            />
          </svg>
          <p className="text-sm text-neutral-500">No manifest data available.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      role="complementary"
      aria-label="Manifest JSON viewer"
      className={`flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-primary-500"
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
              d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Variant Manifest
            </h3>
            <p className="text-xs text-neutral-500">
              {resolvedManifest.version ? `v${resolvedManifest.version}` : 'JSON'}
              {appliedTailoringCount > 0 && ` · ${appliedTailoringCount} transformation${appliedTailoringCount === 1 ? '' : 's'}`}
              {lineCount > 0 && ` · ${lineCount} line${lineCount === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={copyState === 'copying'}
            aria-label={
              copyState === 'copied'
                ? 'Copied to clipboard'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy manifest JSON to clipboard'
            }
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium shadow-sm ring-1 ring-inset transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              copyState === 'copied'
                ? 'bg-green-50 text-green-700 ring-green-300'
                : copyState === 'error'
                  ? 'bg-red-50 text-red-700 ring-red-300'
                  : 'bg-white text-neutral-700 ring-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {copyState === 'copied' ? (
              <>
                <svg
                  className="h-3.5 w-3.5"
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                Copied
              </>
            ) : copyState === 'error' ? (
              <>
                <svg
                  className="h-3.5 w-3.5"
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
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
                Failed
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
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
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                  />
                </svg>
                Copy
              </>
            )}
          </button>

          {/* Collapse/expand toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand manifest viewer' : 'Collapse manifest viewer'}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
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
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Code block */}
      {!isCollapsed && (
        <div className="relative overflow-auto max-h-[500px] bg-neutral-900">
          <div className="flex min-w-0">
            {/* Line numbers */}
            <div
              className="flex-shrink-0 select-none border-r border-neutral-700 bg-neutral-800 px-3 py-4 text-right"
              aria-hidden="true"
            >
              {lineNumbers.map((num) => (
                <div
                  key={num}
                  className="font-mono text-xs leading-5 text-neutral-600"
                >
                  {num}
                </div>
              ))}
            </div>

            {/* Code content */}
            <pre className="flex-1 overflow-x-auto px-4 py-4">
              <code
                className="font-mono text-xs leading-5 text-neutral-300 whitespace-pre"
                aria-label="Manifest JSON content"
              >
                {highlightedElements}
              </code>
            </pre>
          </div>
        </div>
      )}

      {/* Collapsed summary */}
      {isCollapsed && (
        <div className="px-4 py-3 bg-neutral-50">
          <div className="flex items-center gap-2">
            <svg
              className="h-3.5 w-3.5 text-neutral-400"
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
            <p className="text-xs text-neutral-500">
              Manifest collapsed — click expand to view {lineCount} line{lineCount === 1 ? '' : 's'} of JSON
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-neutral-200 px-4 py-2.5">
        <svg
          className="h-3 w-3 text-neutral-400"
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
          {resolvedManifest.variantId && (
            <span className="font-mono">{resolvedManifest.variantId}</span>
          )}
          {resolvedManifest.cohort && ` · ${resolvedManifest.cohort}`}
          {resolvedManifest.behavioralOverlay && ` · ${resolvedManifest.behavioralOverlay}`}
          {resolvedManifest.controlFlag && ' · Control'}
        </p>
      </div>
    </aside>
  );
}

ManifestViewer.propTypes = {
  manifest: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    version: PropTypes.string,
    variantId: PropTypes.string,
    variantIds: PropTypes.arrayOf(PropTypes.string),
    cohort: PropTypes.string,
    behavioralOverlay: PropTypes.string,
    baseSku: PropTypes.string,
    label: PropTypes.string,
    priority: PropTypes.number,
    appliedTailoring: PropTypes.arrayOf(
      PropTypes.shape({
        dimension: PropTypes.string,
        change: PropTypes.string,
        rationale: PropTypes.string,
        weight: PropTypes.number,
      }),
    ),
    diffSummary: PropTypes.object,
    created: PropTypes.string,
    createdAt: PropTypes.string,
    controlFlag: PropTypes.bool,
    status: PropTypes.string,
    description: PropTypes.string,
  }),
  variant: PropTypes.shape({
    id: PropTypes.string,
    variantId: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.string,
    productId: PropTypes.string,
    sku: PropTypes.string,
    cohortId: PropTypes.string,
    cohortType: PropTypes.string,
    behavioralOverlay: PropTypes.string,
    baseSku: PropTypes.string,
    priority: PropTypes.number,
    controlFlag: PropTypes.bool,
    isActive: PropTypes.bool,
    weight: PropTypes.number,
    tailoring: PropTypes.object,
    variantPdp: PropTypes.object,
    diff: PropTypes.object,
    manifest: PropTypes.object,
    description: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }),
  collapsed: PropTypes.bool,
  className: PropTypes.string,
};

ManifestViewer.defaultProps = {
  manifest: undefined,
  variant: undefined,
  collapsed: false,
  className: undefined,
};

export default ManifestViewer;