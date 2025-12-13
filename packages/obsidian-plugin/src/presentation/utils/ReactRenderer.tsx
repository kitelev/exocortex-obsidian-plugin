import React, { ErrorInfo } from "react";
import { createRoot, Root } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { LayoutErrorFallback } from "../components/LayoutErrorFallback";

/**
 * Options for rendering with error boundary
 */
export interface RenderWithErrorBoundaryOptions {
  /**
   * Callback when an error occurs
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Configuration options for ReactRenderer
 */
export interface ReactRendererConfig {
  /**
   * When true, all render() calls are automatically wrapped with ErrorBoundary.
   * This provides graceful error handling for all React components rendered
   * through this instance.
   *
   * @default false
   */
  useErrorBoundary?: boolean;

  /**
   * Callback when an error occurs (only used when useErrorBoundary is true).
   * Use this to log errors or send telemetry.
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Utility for rendering React components in Obsidian plugin containers.
 *
 * Supports automatic ErrorBoundary wrapping for graceful error handling.
 *
 * @example
 * ```ts
 * // Basic usage
 * const renderer = new ReactRenderer();
 * renderer.render(element, <MyComponent />);
 *
 * // With automatic error boundary
 * const safeRenderer = new ReactRenderer({
 *   useErrorBoundary: true,
 *   onError: (error, info) => logger.error('Render error', { error, info }),
 * });
 * safeRenderer.render(element, <MyComponent />);
 * ```
 */
export class ReactRenderer {
  private roots: Map<HTMLElement, Root> = new Map();
  private config: ReactRendererConfig;

  constructor(config: ReactRendererConfig = {}) {
    this.config = config;
  }

  /**
   * Render a React component into an HTMLElement.
   *
   * If useErrorBoundary was enabled in the constructor, the component
   * will be automatically wrapped with ErrorBoundary for graceful error handling.
   */
  render(element: HTMLElement, component: React.ReactElement): void {
    // Clean up existing root if any
    this.unmount(element);

    // Wrap with error boundary if configured
    const finalComponent = this.config.useErrorBoundary
      ? this.wrapWithErrorBoundary(component)
      : component;

    // Create new root and render
    const root = createRoot(element);
    root.render(finalComponent);
    this.roots.set(element, root);
  }

  /**
   * Wrap a component with ErrorBoundary
   */
  private wrapWithErrorBoundary(component: React.ReactElement): React.ReactElement {
    return React.createElement(ErrorBoundary, {
      children: component,
      fallback: (error: Error, errorInfo: ErrorInfo, retry: () => void) =>
        React.createElement(LayoutErrorFallback, {
          error,
          errorInfo,
          onRetry: retry,
        }),
      onError: this.config.onError,
    });
  }

  /**
   * Render a React component wrapped in ErrorBoundary for graceful error handling.
   *
   * Use this method for critical UI components where errors should not crash
   * the entire plugin UI. The ErrorBoundary will catch errors, display a
   * fallback UI with retry option, and call the onError callback for logging.
   *
   * @param element - The HTML element to render into
   * @param component - The React component to render
   * @param options - Error handling options
   */
  renderWithErrorBoundary(
    element: HTMLElement,
    component: React.ReactElement,
    options: RenderWithErrorBoundaryOptions = {},
  ): void {
    // Clean up existing root if any
    this.unmount(element);

    const wrappedComponent = React.createElement(ErrorBoundary, {
      children: component,
      fallback: (error: Error, errorInfo: ErrorInfo, retry: () => void) =>
        React.createElement(LayoutErrorFallback, {
          error,
          errorInfo,
          onRetry: retry,
        }),
      onError: options.onError,
    });

    // Create new root and render
    const root = createRoot(element);
    root.render(wrappedComponent);
    this.roots.set(element, root);
  }

  /**
   * Unmount a React component from an HTMLElement
   */
  unmount(element: HTMLElement): void {
    const root = this.roots.get(element);
    if (root) {
      root.unmount();
      this.roots.delete(element);
    }
  }

  /**
   * Clean up all roots
   */
  cleanup(): void {
    this.roots.forEach((root) => root.unmount());
    this.roots.clear();
  }
}
