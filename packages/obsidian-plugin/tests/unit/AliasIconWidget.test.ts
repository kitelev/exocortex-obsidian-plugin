import { AliasIconWidget } from "../../src/presentation/editor-extensions/AliasIconWidget";

// Uses global obsidian mock from tests/__mocks__/obsidian.ts

describe("AliasIconWidget", () => {
  describe("constructor", () => {
    it("should create widget with provided properties", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      expect(widget).toBeInstanceOf(AliasIconWidget);
    });
  });

  describe("toDOM", () => {
    it("should create span element with correct class", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();

      expect(element.tagName).toBe("SPAN");
      expect(element.className).toBe("exocortex-alias-add-icon");
    });

    it("should set aria-label for accessibility", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();

      expect(element.getAttribute("aria-label")).toBe('Add "my alias" to aliases');
    });

    it("should set data attributes for target path and alias", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();

      expect(element.getAttribute("data-target-path")).toBe("path/to/file.md");
      expect(element.getAttribute("data-alias")).toBe("my alias");
    });

    it("should call setIcon to add icon", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();

      // Verify setIcon was called (our mock sets this attribute)
      expect(element.getAttribute("data-icon-set")).toBe("true");
    });

    it("should call onClick callback when clicked", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);

      const element = widget.toDOM();
      element.click();

      expect(onClick).toHaveBeenCalledWith("path/to/file.md", "my alias");
    });

    it("should stop propagation on click", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      const clickEvent = new MouseEvent("click", { bubbles: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, "stopPropagation");

      element.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it("should prevent default on click", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      const clickEvent = new MouseEvent("click", { cancelable: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, "preventDefault");

      element.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should add is-hovered class on mouseenter", () => {
      const onClick = jest.fn();
      const widget = new AliasIconWidget("path/to/file.md", "my alias", onClick);
      const element = widget.toDOM();

      // Initial state - no hover class
      expect(element.classList.contains("is-hovered")).toBe(false);

      // Simulate mouseenter
      element.dispatchEvent(new MouseEvent("mouseenter"));

      expect(element.classList.contains("is-hovered")).toBe(true);
    });

    it("should remove is-hovered class on mouseleave", () => {
      const onClick = jest.fn();
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

  describe("eq", () => {
    it("should return true for widgets with same target and alias", () => {
      const widget1 = new AliasIconWidget("path/to/file.md", "alias", jest.fn());
      const widget2 = new AliasIconWidget("path/to/file.md", "alias", jest.fn());

      expect(widget1.eq(widget2)).toBe(true);
    });

    it("should return false for widgets with different target", () => {
      const widget1 = new AliasIconWidget("path/to/file1.md", "alias", jest.fn());
      const widget2 = new AliasIconWidget("path/to/file2.md", "alias", jest.fn());

      expect(widget1.eq(widget2)).toBe(false);
    });

    it("should return false for widgets with different alias", () => {
      const widget1 = new AliasIconWidget("path/to/file.md", "alias1", jest.fn());
      const widget2 = new AliasIconWidget("path/to/file.md", "alias2", jest.fn());

      expect(widget1.eq(widget2)).toBe(false);
    });

    it("should return false for non-AliasIconWidget", () => {
      const widget = new AliasIconWidget("path/to/file.md", "alias", jest.fn());
      const otherWidget = { toDOM: () => document.createElement("div") };

      // @ts-expect-error - Testing with non-AliasIconWidget
      expect(widget.eq(otherWidget)).toBe(false);
    });
  });

  describe("ignoreEvent", () => {
    it("should return false to allow event handling", () => {
      const widget = new AliasIconWidget("path/to/file.md", "alias", jest.fn());

      expect(widget.ignoreEvent()).toBe(false);
    });
  });
});
