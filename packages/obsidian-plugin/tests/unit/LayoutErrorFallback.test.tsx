/**
 * Unit tests for LayoutErrorFallback component
 *
 * Tests the fallback UI displayed when layout rendering fails.
 */
import React from "react";
import {
  LayoutErrorFallback,
  LayoutErrorFallbackProps,
} from "../../src/presentation/components/LayoutErrorFallback";

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, "location", {
  value: { reload: mockReload },
  writable: true,
});

describe("LayoutErrorFallback", () => {
  const mockError = new Error("Test error message");
  mockError.stack = "Error: Test error message\n    at TestComponent";

  const mockErrorInfo = {
    componentStack: "\n    at TestComponent\n    at ErrorBoundary",
  };

  const mockOnRetry = jest.fn();

  const defaultProps: LayoutErrorFallbackProps = {
    error: mockError,
    errorInfo: mockErrorInfo,
    onRetry: mockOnRetry,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      const component = <LayoutErrorFallback {...defaultProps} />;
      expect(component).toBeDefined();
    });

    it("should create component with required props", () => {
      const element = LayoutErrorFallback(defaultProps);
      expect(element).not.toBeNull();
      expect(element?.type).toBe("div");
    });

    it("should have exocortex-layout-error class", () => {
      const element = LayoutErrorFallback(defaultProps);
      expect(element?.props.className).toBe("exocortex-layout-error");
    });

    it("should display error title", () => {
      const element = LayoutErrorFallback(defaultProps);

      // Find the h4 element in children
      const findHeading = (node: React.ReactElement): string | null => {
        if (node.type === "h4") {
          return String(node.props.children);
        }
        if (!node.props?.children) return null;

        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findHeading(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const heading = findHeading(element!);
      expect(heading).toBe("Layout rendering failed");
    });

    it("should display informative message", () => {
      const element = LayoutErrorFallback(defaultProps);

      const findParagraph = (node: React.ReactElement): string | null => {
        if (node.type === "p") {
          return String(node.props.children);
        }
        if (!node.props?.children) return null;

        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findParagraph(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const paragraph = findParagraph(element!);
      expect(paragraph).toContain("error occurred");
      expect(paragraph).toContain("rest of Obsidian");
    });
  });

  describe("buttons", () => {
    it("should have retry button", () => {
      const element = LayoutErrorFallback(defaultProps);

      const findButton = (node: React.ReactElement, text: string): React.ReactElement | null => {
        if (node.type === "button") {
          const buttonText = Array.isArray(node.props.children)
            ? node.props.children.join("")
            : String(node.props.children);
          if (buttonText.includes(text)) return node;
        }
        if (!node.props?.children) return null;

        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findButton(child as React.ReactElement, text);
            if (found) return found;
          }
        }
        return null;
      };

      const retryButton = findButton(element!, "Try again");
      expect(retryButton).not.toBeNull();
    });

    it("should call onRetry when retry button is clicked", () => {
      const element = LayoutErrorFallback(defaultProps);

      const findButton = (node: React.ReactElement, text: string): React.ReactElement | null => {
        if (node.type === "button") {
          const buttonText = Array.isArray(node.props.children)
            ? node.props.children.join("")
            : String(node.props.children);
          if (buttonText.includes(text)) return node;
        }
        if (!node.props?.children) return null;

        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findButton(child as React.ReactElement, text);
            if (found) return found;
          }
        }
        return null;
      };

      const retryButton = findButton(element!, "Try again");
      retryButton?.props.onClick();

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it("should have reload button", () => {
      const element = LayoutErrorFallback(defaultProps);

      const findButton = (node: React.ReactElement, text: string): React.ReactElement | null => {
        if (node.type === "button") {
          const buttonText = Array.isArray(node.props.children)
            ? node.props.children.join("")
            : String(node.props.children);
          if (buttonText.includes(text)) return node;
        }
        if (!node.props?.children) return null;

        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findButton(child as React.ReactElement, text);
            if (found) return found;
          }
        }
        return null;
      };

      const reloadButton = findButton(element!, "Reload");
      expect(reloadButton).not.toBeNull();
    });

    it("should reload page when reload button is clicked", () => {
      const element = LayoutErrorFallback(defaultProps);

      const findButton = (node: React.ReactElement, text: string): React.ReactElement | null => {
        if (node.type === "button") {
          const buttonText = Array.isArray(node.props.children)
            ? node.props.children.join("")
            : String(node.props.children);
          if (buttonText.includes(text)) return node;
        }
        if (!node.props?.children) return null;

        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findButton(child as React.ReactElement, text);
            if (found) return found;
          }
        }
        return null;
      };

      const reloadButton = findButton(element!, "Reload");
      reloadButton?.props.onClick();

      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  describe("error details", () => {
    it("should display error name and message", () => {
      const element = LayoutErrorFallback(defaultProps);

      // Serialize to check if error message is present
      const content = JSON.stringify(element);
      expect(content).toContain("Error");
      expect(content).toContain("Test error message");
    });

    it("should show component stack in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const element = LayoutErrorFallback(defaultProps);
      const content = JSON.stringify(element);

      expect(content).toContain("Component stack");

      process.env.NODE_ENV = originalEnv;
    });

    it("should show stack trace in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const element = LayoutErrorFallback(defaultProps);
      const content = JSON.stringify(element);

      expect(content).toContain("Stack trace");

      process.env.NODE_ENV = originalEnv;
    });

    it("should hide component stack in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const element = LayoutErrorFallback(defaultProps);
      const content = JSON.stringify(element);

      // In production, the details sections with component stack should not be rendered
      // The content should not contain the actual stack trace
      expect(content).not.toContain("at TestComponent");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("edge cases", () => {
    it("should handle error without stack trace", () => {
      const errorWithoutStack = new Error("No stack");
      delete errorWithoutStack.stack;

      const props: LayoutErrorFallbackProps = {
        ...defaultProps,
        error: errorWithoutStack,
      };

      expect(() => LayoutErrorFallback(props)).not.toThrow();
    });

    it("should handle empty error message", () => {
      const emptyError = new Error("");

      const props: LayoutErrorFallbackProps = {
        ...defaultProps,
        error: emptyError,
      };

      expect(() => LayoutErrorFallback(props)).not.toThrow();
    });

    it("should handle null component stack", () => {
      const props: LayoutErrorFallbackProps = {
        ...defaultProps,
        errorInfo: { componentStack: "" },
      };

      expect(() => LayoutErrorFallback(props)).not.toThrow();
    });

    it("should handle very long error messages", () => {
      const longMessage = "x".repeat(10000);
      const longError = new Error(longMessage);

      const props: LayoutErrorFallbackProps = {
        ...defaultProps,
        error: longError,
      };

      expect(() => LayoutErrorFallback(props)).not.toThrow();
    });

    it("should handle custom error types", () => {
      class CustomError extends Error {
        constructor(message: string, public code: number) {
          super(message);
          this.name = "CustomError";
        }
      }

      const customError = new CustomError("Custom error", 500);

      const props: LayoutErrorFallbackProps = {
        ...defaultProps,
        error: customError,
      };

      const element = LayoutErrorFallback(props);
      const content = JSON.stringify(element);

      expect(content).toContain("CustomError");
      expect(content).toContain("Custom error");
    });
  });

  describe("styling", () => {
    it("should have proper container styling", () => {
      const element = LayoutErrorFallback(defaultProps);

      expect(element?.props.style).toBeDefined();
      expect(element?.props.style.padding).toBe("16px");
      expect(element?.props.style.borderRadius).toBe("6px");
    });
  });
});
