import React, { ErrorInfo } from "react";
import {
  LayoutErrorFallback,
  LayoutErrorFallbackProps,
} from "../../src/presentation/components/LayoutErrorFallback";

describe("LayoutErrorFallback", () => {
  const createProps = (overrides: Partial<LayoutErrorFallbackProps> = {}): LayoutErrorFallbackProps => ({
    error: new Error("Test error message"),
    errorInfo: { componentStack: "\n    at TestComponent\n    at ErrorBoundary" },
    onRetry: jest.fn(),
    ...overrides,
  });

  describe("component structure", () => {
    it("should render without crashing", () => {
      const props = createProps();
      const element = LayoutErrorFallback(props);
      expect(element).not.toBeNull();
    });

    it("should render error fallback container with correct class", () => {
      const props = createProps();
      const element = LayoutErrorFallback(props);
      expect(element?.props.className).toBe("exocortex-layout-error");
    });

    it("should display error icon and title", () => {
      const props = createProps();
      const element = LayoutErrorFallback(props);

      // Check for h4 heading with error message
      const findHeading = (el: React.ReactElement): React.ReactElement | null => {
        if (el.type === "h4") return el;
        if (!el.props?.children) return null;

        const children = Array.isArray(el.props.children)
          ? el.props.children
          : [el.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findHeading(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const heading = findHeading(element as React.ReactElement);
      expect(heading).not.toBeNull();
      expect(heading?.props.children).toBe("Layout rendering failed");
    });

    it("should display informative message", () => {
      const props = createProps();
      const element = LayoutErrorFallback(props);

      // Check for paragraph with message
      const findParagraph = (el: React.ReactElement): React.ReactElement | null => {
        if (el.type === "p") return el;
        if (!el.props?.children) return null;

        const children = Array.isArray(el.props.children)
          ? el.props.children
          : [el.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findParagraph(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const paragraph = findParagraph(element as React.ReactElement);
      expect(paragraph).not.toBeNull();
      expect(paragraph?.props.children).toContain("An error occurred");
    });
  });

  describe("retry button", () => {
    it("should render retry button", () => {
      const props = createProps();
      const element = LayoutErrorFallback(props);

      const findButton = (el: React.ReactElement): React.ReactElement | null => {
        if (el.type === "button") return el;
        if (!el.props?.children) return null;

        const children = Array.isArray(el.props.children)
          ? el.props.children
          : [el.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findButton(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const button = findButton(element as React.ReactElement);
      expect(button).not.toBeNull();
      expect(button?.props.children).toBe("Retry");
    });

    it("should call onRetry when button is clicked", () => {
      const onRetry = jest.fn();
      const props = createProps({ onRetry });
      const element = LayoutErrorFallback(props);

      const findButton = (el: React.ReactElement): React.ReactElement | null => {
        if (el.type === "button") return el;
        if (!el.props?.children) return null;

        const children = Array.isArray(el.props.children)
          ? el.props.children
          : [el.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findButton(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const button = findButton(element as React.ReactElement);
      expect(button).not.toBeNull();
      expect(button?.props.onClick).toBe(onRetry);
    });
  });

  describe("technical details section", () => {
    it("should render details element for technical info", () => {
      const props = createProps();
      const element = LayoutErrorFallback(props);

      const findDetails = (el: React.ReactElement): React.ReactElement | null => {
        if (el.type === "details") return el;
        if (!el.props?.children) return null;

        const children = Array.isArray(el.props.children)
          ? el.props.children
          : [el.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findDetails(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const details = findDetails(element as React.ReactElement);
      expect(details).not.toBeNull();
    });

    it("should display error name and message", () => {
      const customError = new Error("Custom error message");
      customError.name = "CustomError";
      const props = createProps({ error: customError });
      const element = LayoutErrorFallback(props);

      // Convert to string to check content
      const elementString = JSON.stringify(element);
      expect(elementString).toContain("CustomError");
      expect(elementString).toContain("Custom error message");
    });

    it("should display component stack when available", () => {
      const errorInfo: ErrorInfo = {
        componentStack: "\n    at BrokenComponent\n    at Layout\n    at App",
      };
      const props = createProps({ errorInfo });
      const element = LayoutErrorFallback(props);

      // Convert to string to check content
      const elementString = JSON.stringify(element);
      expect(elementString).toContain("BrokenComponent");
      expect(elementString).toContain("Layout");
    });

    it("should handle empty component stack", () => {
      const errorInfo: ErrorInfo = { componentStack: "" };
      const props = createProps({ errorInfo });

      expect(() => LayoutErrorFallback(props)).not.toThrow();
    });
  });

  describe("error types", () => {
    it("should handle standard Error", () => {
      const error = new Error("Standard error");
      const props = createProps({ error });

      expect(() => LayoutErrorFallback(props)).not.toThrow();
      const element = LayoutErrorFallback(props);
      const elementString = JSON.stringify(element);
      expect(elementString).toContain("Standard error");
    });

    it("should handle TypeError", () => {
      const error = new TypeError("Type error occurred");
      const props = createProps({ error });

      expect(() => LayoutErrorFallback(props)).not.toThrow();
      const element = LayoutErrorFallback(props);
      const elementString = JSON.stringify(element);
      expect(elementString).toContain("TypeError");
    });

    it("should handle RangeError", () => {
      const error = new RangeError("Range error occurred");
      const props = createProps({ error });

      expect(() => LayoutErrorFallback(props)).not.toThrow();
      const element = LayoutErrorFallback(props);
      const elementString = JSON.stringify(element);
      expect(elementString).toContain("RangeError");
    });

    it("should handle error with empty message", () => {
      const error = new Error("");
      const props = createProps({ error });

      expect(() => LayoutErrorFallback(props)).not.toThrow();
    });

    it("should handle error with very long message", () => {
      const longMessage = "x".repeat(10000);
      const error = new Error(longMessage);
      const props = createProps({ error });

      expect(() => LayoutErrorFallback(props)).not.toThrow();
    });
  });

  describe("props validation", () => {
    it("should accept all required props", () => {
      const props: LayoutErrorFallbackProps = {
        error: new Error("Test"),
        errorInfo: { componentStack: "stack" },
        onRetry: jest.fn(),
      };

      expect(() => LayoutErrorFallback(props)).not.toThrow();
    });
  });

  describe("accessibility", () => {
    it("should have clickable retry button", () => {
      const onRetry = jest.fn();
      const props = createProps({ onRetry });
      const element = LayoutErrorFallback(props);

      const findButton = (el: React.ReactElement): React.ReactElement | null => {
        if (el.type === "button") return el;
        if (!el.props?.children) return null;

        const children = Array.isArray(el.props.children)
          ? el.props.children
          : [el.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findButton(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const button = findButton(element as React.ReactElement);
      expect(button?.props.style.cursor).toBe("pointer");
    });

    it("should have expandable details for technical info", () => {
      const props = createProps();
      const element = LayoutErrorFallback(props);

      const findDetails = (el: React.ReactElement): React.ReactElement | null => {
        if (el.type === "details") return el;
        if (!el.props?.children) return null;

        const children = Array.isArray(el.props.children)
          ? el.props.children
          : [el.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findDetails(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const details = findDetails(element as React.ReactElement);
      expect(details).not.toBeNull();

      // Check for summary element inside details
      const findSummary = (el: React.ReactElement): React.ReactElement | null => {
        if (el.type === "summary") return el;
        if (!el.props?.children) return null;

        const children = Array.isArray(el.props.children)
          ? el.props.children
          : [el.props.children];

        for (const child of children) {
          if (child && typeof child === "object" && "type" in child) {
            const found = findSummary(child as React.ReactElement);
            if (found) return found;
          }
        }
        return null;
      };

      const summary = findSummary(details as React.ReactElement);
      expect(summary).not.toBeNull();
      expect(summary?.props.children).toBe("Technical details");
    });
  });
});
