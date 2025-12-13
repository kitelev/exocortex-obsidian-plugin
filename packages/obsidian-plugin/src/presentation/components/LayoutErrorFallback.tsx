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
   * Callback to retry rendering the component
   */
  onRetry: () => void;
}

/**
 * Fallback UI component displayed when a layout renderer encounters an error.
 *
 * Features:
 * - User-friendly error message
 * - Retry button to attempt re-render
 * - Expandable technical details for debugging
 * - Styled to match Obsidian theme
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
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div
      className="exocortex-layout-error"
      style={{
        padding: "16px",
        margin: "8px 0",
        border: "1px solid var(--background-modifier-error)",
        borderRadius: "6px",
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
            color: "var(--text-error)",
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Layout rendering failed
        </h4>
      </div>

      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "13px",
          margin: "0 0 12px 0",
          lineHeight: "1.5",
        }}
      >
        An error occurred while rendering this layout section. The rest of Obsidian
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
          🔄 Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "6px 12px",
            backgroundColor: "var(--background-modifier-border)",
            color: "var(--text-normal)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Reload page
        </button>
      </div>

      {/* Error details - always visible but less prominent */}
      <details
        style={{
          marginTop: "8px",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: "12px",
            userSelect: "none",
          }}
        >
          Error details
        </summary>
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "var(--background-primary)",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "var(--font-monospace)",
          }}
        >
          <div
            style={{
              color: "var(--text-error)",
              marginBottom: "8px",
              wordBreak: "break-word",
            }}
          >
            {error.name}: {error.message}
          </div>

          {isDevelopment && errorInfo.componentStack && (
            <details style={{ marginTop: "8px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: "11px",
                }}
              >
                Component stack
              </summary>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflow: "auto",
                }}
              >
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          {isDevelopment && error.stack && (
            <details style={{ marginTop: "8px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: "11px",
                }}
              >
                Stack trace
              </summary>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflow: "auto",
                }}
              >
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </details>
    </div>
  );
};
