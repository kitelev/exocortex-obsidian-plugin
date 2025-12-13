import React, { ErrorInfo } from "react";

/**
 * Props for LayoutErrorFallback component
 */
export interface LayoutErrorFallbackProps {
  /**
   * The error that was caught
   */
  error: Error;

  /**
   * React error info with component stack
   */
  errorInfo: ErrorInfo;

  /**
   * Callback to retry rendering
   */
  onRetry: () => void;
}

/**
 * Fallback UI component displayed when UniversalLayoutRenderer encounters an error.
 *
 * Provides:
 * - User-friendly error message
 * - Retry button to attempt re-rendering
 * - Technical details for debugging (collapsed by default)
 *
 * Styled to match Obsidian's design system using CSS variables.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, errorInfo, retry) => (
 *     <LayoutErrorFallback error={error} errorInfo={errorInfo} onRetry={retry} />
 *   )}
 * >
 *   <UniversalLayoutRenderer {...props} />
 * </ErrorBoundary>
 * ```
 */
export const LayoutErrorFallback: React.FC<LayoutErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
}) => {
  return (
    <div
      className="exocortex-layout-error"
      style={{
        padding: "16px",
        margin: "8px 0",
        border: "1px solid var(--background-modifier-error)",
        borderRadius: "8px",
        backgroundColor: "var(--background-secondary)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "20px" }}>⚠️</span>
        <h4
          style={{
            margin: 0,
            color: "var(--text-error)",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Layout rendering failed
        </h4>
      </div>

      <p
        style={{
          margin: "0 0 12px 0",
          color: "var(--text-muted)",
          fontSize: "13px",
        }}
      >
        An error occurred while rendering the layout. The rest of Obsidian
        continues to work normally.
      </p>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={onRetry}
          style={{
            padding: "6px 12px",
            backgroundColor: "var(--interactive-accent)",
            color: "var(--text-on-accent)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Retry
        </button>
      </div>

      <details
        style={{
          marginTop: "8px",
          padding: "8px",
          backgroundColor: "var(--background-primary)",
          borderRadius: "4px",
          fontSize: "12px",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          Technical details
        </summary>
        <div style={{ marginTop: "8px" }}>
          <div
            style={{
              fontFamily: "var(--font-monospace)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "var(--text-error)",
              padding: "8px",
              backgroundColor: "var(--background-secondary)",
              borderRadius: "4px",
              marginBottom: "8px",
            }}
          >
            {error.name}: {error.message}
          </div>
          {errorInfo.componentStack && (
            <pre
              style={{
                margin: 0,
                fontFamily: "var(--font-monospace)",
                fontSize: "11px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "var(--text-muted)",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              {errorInfo.componentStack}
            </pre>
          )}
        </div>
      </details>
    </div>
  );
};
