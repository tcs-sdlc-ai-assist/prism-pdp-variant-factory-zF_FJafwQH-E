import { Component } from 'react';
import PropTypes from 'prop-types';
import { emitEvent, EVENT_TYPES } from '@/services/observabilityEmitter.js';

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - Whether an error has been caught
 * @property {Error|null} error - The caught error object
 * @property {string|null} errorInfo - Component stack trace info
 */

/**
 * React Error Boundary component that catches rendering errors in the child
 * component tree. Displays a fallback UI with error message, stack trace
 * (development only), and a 'Reset to default demo data' button.
 * Logs errors to the observability emitter.
 *
 * Note: Error boundaries must be class components — React does not support
 * error boundaries as function components.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.handleReset = this.handleReset.bind(this);
    this.handleDismiss = this.handleDismiss.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    const componentStack = errorInfo && errorInfo.componentStack
      ? errorInfo.componentStack
      : '';

    this.setState({
      errorInfo: componentStack,
    });

    emitEvent(EVENT_TYPES.ERROR, {
      action: 'ErrorBoundary:componentDidCatch',
      error: error ? error.message : 'Unknown error',
      componentStack,
    });

    console.error('[ErrorBoundary] Caught rendering error:', error);
    if (componentStack) {
      console.error('[ErrorBoundary] Component stack:', componentStack);
    }
  }

  /**
   * Handles the reset action by calling the onReset prop (which should
   * invoke resetAll from AppContext) and clearing the error state.
   */
  async handleReset() {
    try {
      if (typeof this.props.onReset === 'function') {
        await this.props.onReset();
      }

      emitEvent(EVENT_TYPES.PDP_LOAD, {
        action: 'ErrorBoundary:handleReset',
        message: 'User triggered reset to default demo data from error boundary',
      });

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    } catch (resetError) {
      console.error('[ErrorBoundary] Reset failed:', resetError);

      emitEvent(EVENT_TYPES.ERROR, {
        action: 'ErrorBoundary:handleReset',
        error: resetError ? resetError.message : 'Reset failed',
      });
    }
  }

  /**
   * Dismisses the error and attempts to re-render children.
   */
  handleDismiss() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          onReset: this.handleReset,
          onDismiss: this.handleDismiss,
        });
      }

      const isDev = import.meta.env.DEV;
      const errorMessage = this.state.error
        ? this.state.error.message
        : 'An unexpected error occurred';

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center min-h-[300px] p-8 mx-auto max-w-2xl"
        >
          <div className="w-full rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
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
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-red-800">
                Something went wrong
              </h2>
            </div>

            <p className="text-sm text-red-700 mb-4">
              {errorMessage}
            </p>

            {isDev && this.state.error && this.state.error.stack && (
              <details className="mb-4">
                <summary className="text-xs font-medium text-red-600 cursor-pointer hover:text-red-800 transition-colors duration-200">
                  Stack Trace (Development Only)
                </summary>
                <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap break-words">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {isDev && this.state.errorInfo && (
              <details className="mb-4">
                <summary className="text-xs font-medium text-red-600 cursor-pointer hover:text-red-800 transition-colors duration-200">
                  Component Stack (Development Only)
                </summary>
                <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap break-words">
                  {this.state.errorInfo}
                </pre>
              </details>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors duration-200"
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
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                  />
                </svg>
                Reset to default demo data
              </button>

              <button
                type="button"
                onClick={this.handleDismiss}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors duration-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
  fallback: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  onReset: undefined,
  fallback: undefined,
};

export default ErrorBoundary;