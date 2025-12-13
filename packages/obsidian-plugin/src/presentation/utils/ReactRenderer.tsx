import React, { ErrorInfo } from "react";
import { createRoot, Root } from "react-dom/client";
import { ErrorBoundary } from '@plugin/presentation/components/ErrorBoundary';
import { LayoutErrorFallback } from '@plugin/presentation/components/LayoutErrorFallback';
import { ILogger } from '@plugin/adapters/logging/ILogger';
import { LoggerFactory } from '@plugin/adapters/logging/LoggerFactory';

/**
 * Configuration options for ReactRenderer
 */
export interface ReactRendererOptions {
  /**
   * Enable error boundary wrapping for all rendered components
   * @default true
   */
  enableErrorBoundary?: boolean;
}

/**
 * Utility for rendering React components in Obsidian plugin containers
 * All rendered components are wrapped in ErrorBoundary for graceful error handling
 */
export class ReactRenderer {
  private roots: Map<HTMLElement, Root> = new Map();
  private logger: ILogger;
  private options: Required<ReactRendererOptions>;

  constructor(options: ReactRendererOptions = {}) {
    this.logger = LoggerFactory.create("ReactRenderer");
    this.options = {
      enableErrorBoundary: options.enableErrorBoundary ?? true,
    };
  }

  /**
   * Handle errors caught by ErrorBoundary
   */
  private handleError = (error: Error, errorInfo: ErrorInfo): void => {
    this.logger.error("React component error caught by ErrorBoundary", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  };

  /**
   * Render a React component into an HTMLElement
   * Components are automatically wrapped in ErrorBoundary for graceful error handling
   */
  render(element: HTMLElement, component: React.ReactElement): void {
    // Clean up existing root if any
    this.unmount(element);

    // Create new root and render
    const root = createRoot(element);

    // Wrap component in ErrorBoundary if enabled
    const wrappedComponent = this.options.enableErrorBoundary
      ? React.createElement(
          ErrorBoundary,
          {
            children: component,
            fallback: (error: Error, errorInfo: ErrorInfo, retry: () => void) =>
              React.createElement(LayoutErrorFallback, {
                error,
                errorInfo,
                onRetry: retry,
              }),
            onError: this.handleError,
          }
        )
      : component;

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
