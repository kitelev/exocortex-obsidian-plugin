import { AliasIconWidget } from "../../src/presentation/editor-extensions/AliasIconWidget";

// Uses global obsidian mock from tests/__mocks__/obsidian.ts

describe("AliasIconWidget", () => {
  // Helper to create async mock that resolves to success/failure
  const createMockOnClick = (result: { success: boolean; error?: string }) => {
    return jest.fn().mockResolvedValue(result);
  };

  describe("constructor", () => {
    it("should create widget with provided properties", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      expect(widget).toBeInstanceOf(AliasIconWidget);
    });
  });

  describe("toDOM", () => {
    it("should create span element with correct class", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();

      expect(element.tagName).toBe("SPAN");
      expect(element.className).toBe("exocortex-alias-add-icon");
    });

    it("should set aria-label for accessibility", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();

      expect(element.getAttribute("aria-label")).toBe('Add "my alias" to aliases');
    });

    it("should set data attributes for target path and alias", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();

      expect(element.getAttribute("data-target-path")).toBe("path/to/file.md");
      expect(element.getAttribute("data-alias")).toBe("my alias");
    });

    it("should call setIcon to add icon", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();

      // Verify setIcon was called (our mock sets this attribute)
      expect(element.getAttribute("data-icon-set")).toBe("true");
    });

    it("should call onClick callback when clicked", async () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();
      element.click();

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(onClick).toHaveBeenCalledWith("path/to/file.md", "my alias");
    });

    it("should stop propagation on click", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      const clickEvent = new MouseEvent("click", { bubbles: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, "stopPropagation");

      element.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it("should prevent default on click", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      const clickEvent = new MouseEvent("click", { cancelable: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, "preventDefault");

      element.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should add is-hovered class on mouseenter", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      // Initial state - no hover class
      expect(element.classList.contains("is-hovered")).toBe(false);

      // Simulate mouseenter
      element.dispatchEvent(new MouseEvent("mouseenter"));

      expect(element.classList.contains("is-hovered")).toBe(true);
    });

    it("should remove is-hovered class on mouseleave", () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      // Set to hovered state
      element.dispatchEvent(new MouseEvent("mouseenter"));
      expect(element.classList.contains("is-hovered")).toBe(true);

      // Simulate mouseleave
      element.dispatchEvent(new MouseEvent("mouseleave"));

      expect(element.classList.contains("is-hovered")).toBe(false);
    });
  });

  describe("optimistic UI", () => {
    it("should hide icon immediately on click (optimistic UI)", async () => {
      const onClick = createMockOnClick({ success: true });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      // Click the icon
      element.click();

      // Icon should be hidden immediately (before async operation completes)
      expect(element.classList.contains("is-hidden")).toBe(true);

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should still be hidden on success
      expect(element.classList.contains("is-hidden")).toBe(true);
    });

    it("should reappear icon if onClick returns failure", async () => {
      const onClick = createMockOnClick({ success: false, error: "File locked" });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      // Click the icon
      element.click();

      // Icon hidden immediately
      expect(element.classList.contains("is-hidden")).toBe(true);

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should reappear on failure
      expect(element.classList.contains("is-hidden")).toBe(false);
    });

    it("should reappear icon if onClick throws an error", async () => {
      const onClick = jest.fn().mockRejectedValue(new Error("Network error"));
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      // Click the icon
      element.click();

      // Icon hidden immediately
      expect(element.classList.contains("is-hidden")).toBe(true);

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should reappear on error
      expect(element.classList.contains("is-hidden")).toBe(false);
    });

    it("should prevent double-clicks while processing", async () => {
      let resolvePromise: (value: { success: boolean }) => void;
      const onClick = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve;
        });
      });

      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      // First click
      element.click();

      // Second click while processing
      element.click();

      // Third click while processing
      element.click();

      // onClick should only be called once (double-click guard)
      expect(onClick).toHaveBeenCalledTimes(1);

      // Resolve the promise
      resolvePromise!({ success: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it("should allow new click after processing completes", async () => {
      const onClick = createMockOnClick({ success: false, error: "Temporary error" });
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      // First click
      element.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Icon reappeared after failure
      expect(element.classList.contains("is-hidden")).toBe(false);

      // Second click should work
      element.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // onClick should be called twice
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("eq", () => {
    it("should return true for widgets with same target and alias", () => {
      const widget1 = new AliasIconWidget("path/to/file.md", "alias", createMockOnClick({ success: true }));
      const widget2 = new AliasIconWidget("path/to/file.md", "alias", createMockOnClick({ success: true }));

      expect(widget1.eq(widget2)).toBe(true);
    });

    it("should return false for widgets with different target", () => {
      const widget1 = new AliasIconWidget("path/to/file1.md", "alias", createMockOnClick({ success: true }));
      const widget2 = new AliasIconWidget("path/to/file2.md", "alias", createMockOnClick({ success: true }));

      expect(widget1.eq(widget2)).toBe(false);
    });

    it("should return false for widgets with different alias", () => {
      const widget1 = new AliasIconWidget("path/to/file.md", "alias1", createMockOnClick({ success: true }));
      const widget2 = new AliasIconWidget("path/to/file.md", "alias2", createMockOnClick({ success: true }));

      expect(widget1.eq(widget2)).toBe(false);
    });

    it("should return false for non-AliasIconWidget", () => {
      const widget = new AliasIconWidget("path/to/file.md", "alias", createMockOnClick({ success: true }));
      const otherWidget = { toDOM: () => document.createElement("div") };

      // @ts-expect-error - Testing with non-AliasIconWidget
      expect(widget.eq(otherWidget)).toBe(false);
    });
  });

  describe("ignoreEvent", () => {
    it("should return false to allow event handling", () => {
      const widget = new AliasIconWidget("path/to/file.md", "alias", createMockOnClick({ success: true }));

      expect(widget.ignoreEvent()).toBe(false);
    });
  });
});
