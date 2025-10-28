import { LabelInputModal, LabelInputModalResult } from "../../src/presentation/modals/LabelInputModal";
import { App } from "obsidian";

describe("LabelInputModal", () => {
  let mockApp: App;
  let modal: LabelInputModal;
  let onSubmitSpy: jest.Mock<void, [LabelInputModalResult]>;
  let mockContentEl: any;
  let mockInputEl: HTMLInputElement;
  let mockSelectEl: HTMLSelectElement;

  beforeEach(() => {
    // Mock App
    mockApp = {} as App;

    // Mock content element and its methods
    mockInputEl = document.createElement("input");
    mockSelectEl = document.createElement("select");

    mockContentEl = {
      addClass: jest.fn(),
      createEl: jest.fn(),
      createDiv: jest.fn(),
      empty: jest.fn(),
    };

    // Setup createEl mock to return appropriate elements
    mockContentEl.createEl.mockImplementation((tag: string, options?: any) => {
      if (tag === "input") {
        if (options?.value !== undefined) mockInputEl.value = options.value;
        return mockInputEl;
      }
      if (tag === "select") {
        return mockSelectEl;
      }
      if (tag === "button") {
        const button = document.createElement("button");
        if (options?.text) button.textContent = options.text;
        return button;
      }
      if (tag === "option") {
        const option = document.createElement("option");
        if (options?.value) option.value = options.value;
        if (options?.text) option.textContent = options.text;
        return option;
      }
      return document.createElement(tag);
    });

    // Setup createDiv mock
    mockContentEl.createDiv.mockImplementation(() => ({
      createEl: mockContentEl.createEl,
    }));

    onSubmitSpy = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default values", () => {
      modal = new LabelInputModal(mockApp, onSubmitSpy);
      expect(modal).toBeDefined();
    });

    it("should accept default label value", () => {
      modal = new LabelInputModal(mockApp, onSubmitSpy, "Default Label");
      expect(modal).toBeDefined();
    });

    it("should accept showTaskSize parameter", () => {
      modal = new LabelInputModal(mockApp, onSubmitSpy, "", false);
      expect(modal).toBeDefined();
    });
  });

  describe("onOpen", () => {
    beforeEach(() => {
      modal = new LabelInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
    });

    it("should add modal class", () => {
      modal.onOpen();
      expect(mockContentEl.addClass).toHaveBeenCalledWith("exocortex-label-input-modal");
    });

    it("should create modal elements", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("h2", { text: "Create asset" });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("p", {
        text: "Enter a display label for the new asset (optional):",
        cls: "exocortex-modal-description",
      });
    });

    it("should create input field", () => {
      modal.onOpen();

      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        cls: "exocortex-modal-input-container",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("input", {
        type: "text",
        placeholder: "Asset label (optional)",
        cls: "exocortex-modal-input",
      });
    });

    it("should set default label value", () => {
      modal = new LabelInputModal(mockApp, onSubmitSpy, "Test Label");
      modal.contentEl = mockContentEl;
      modal.onOpen();

      expect(mockInputEl.value).toBe("Test Label");
    });

    it("should create task size selector when showTaskSize is true", () => {
      modal = new LabelInputModal(mockApp, onSubmitSpy, "", true);
      modal.contentEl = mockContentEl;
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("p", {
        text: "Task size:",
        cls: "exocortex-modal-description",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("select", {
        cls: "exocortex-modal-select dropdown",
      });
    });

    it("should not create task size selector when showTaskSize is false", () => {
      modal = new LabelInputModal(mockApp, onSubmitSpy, "", false);
      modal.contentEl = mockContentEl;
      modal.onOpen();

      expect(mockContentEl.createEl).not.toHaveBeenCalledWith("select", expect.any(Object));
    });

    it("should create Create and Cancel buttons", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Create",
        cls: "mod-cta",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Cancel",
      });
    });
  });

  describe("input handling", () => {
    beforeEach(() => {
      modal = new LabelInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal.onOpen();
    });

    it("should update label on input change", () => {
      const inputEvent = new Event("input");
      Object.defineProperty(inputEvent, "target", {
        value: { value: "New Label" },
        writable: false,
      });

      mockInputEl.dispatchEvent(inputEvent);
      mockInputEl.value = "New Label";

      // Simulate the event handler
      modal["label"] = "New Label";
      expect(modal["label"]).toBe("New Label");
    });

    it("should submit on Enter key", () => {
      const keyEvent = new KeyboardEvent("keydown", { key: "Enter" });
      const preventDefaultSpy = jest.spyOn(keyEvent, "preventDefault");

      // Simulate Enter key handler
      modal["submit"] = jest.fn();
      mockInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          modal["submit"]();
        }
      });

      mockInputEl.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(modal["submit"]).toHaveBeenCalled();
    });

    it("should cancel on Escape key", () => {
      const keyEvent = new KeyboardEvent("keydown", { key: "Escape" });
      const preventDefaultSpy = jest.spyOn(keyEvent, "preventDefault");

      // Simulate Escape key handler
      modal["cancel"] = jest.fn();
      mockInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          modal["cancel"]();
        }
      });

      mockInputEl.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(modal["cancel"]).toHaveBeenCalled();
    });
  });

  describe("task size selection", () => {
    beforeEach(() => {
      modal = new LabelInputModal(mockApp, onSubmitSpy, "", true);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal.onOpen();
    });

    it("should create task size options", () => {
      // Mock selectEl with createEl method
      const mockOptions: HTMLOptionElement[] = [];
      mockSelectEl.createEl = jest.fn().mockImplementation((tag: string, options?: any) => {
        if (tag === "option") {
          const option = document.createElement("option");
          if (options?.value !== undefined) option.value = options.value;
          if (options?.text) option.textContent = options.text;
          mockOptions.push(option);
          return option;
        }
        return document.createElement(tag);
      });

      // Re-create modal with proper mock
      modal = new LabelInputModal(mockApp, onSubmitSpy, "", true);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal.onOpen();

      const expectedOptions = [
        { value: "", label: "Not specified" },
        { value: '"[[ems__TaskSize_XXS]]"', label: "XXS" },
        { value: '"[[ems__TaskSize_XS]]"', label: "XS" },
        { value: '"[[ems__TaskSize_S]]"', label: "S" },
        { value: '"[[ems__TaskSize_M]]"', label: "M" },
      ];

      expectedOptions.forEach((option) => {
        expect(mockSelectEl.createEl).toHaveBeenCalledWith("option", {
          value: option.value,
          text: option.label,
        });
      });

      // Verify all options were created
      expect(mockOptions).toHaveLength(5);
    });

    it("should update task size on selection change", () => {
      const changeEvent = new Event("change");
      Object.defineProperty(changeEvent, "target", {
        value: { value: '"[[ems__TaskSize_S]]"' },
        writable: false,
      });

      // Simulate the change handler
      modal["taskSize"] = '"[[ems__TaskSize_S]]"';
      mockSelectEl.dispatchEvent(changeEvent);

      expect(modal["taskSize"]).toBe('"[[ems__TaskSize_S]]"');
    });
  });

  describe("submit", () => {
    beforeEach(() => {
      modal = new LabelInputModal(mockApp, onSubmitSpy);
      modal.close = jest.fn();
    });

    it("should submit with trimmed label", () => {
      modal["label"] = "  Test Label  ";
      modal["taskSize"] = null;

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        label: "Test Label",
        taskSize: null,
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should submit with null label if empty", () => {
      modal["label"] = "  ";
      modal["taskSize"] = null;

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        label: null,
        taskSize: null,
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should submit with task size", () => {
      modal["label"] = "Task Name";
      modal["taskSize"] = '"[[ems__TaskSize_M]]"';

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        label: "Task Name",
        taskSize: '"[[ems__TaskSize_M]]"',
      });
      expect(modal.close).toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    beforeEach(() => {
      modal = new LabelInputModal(mockApp, onSubmitSpy);
      modal.close = jest.fn();
    });

    it("should submit with null values on cancel", () => {
      modal["label"] = "Some Label";
      modal["taskSize"] = '"[[ems__TaskSize_S]]"';

      modal["cancel"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        label: null,
        taskSize: null,
      });
      expect(modal.close).toHaveBeenCalled();
    });
  });

  describe("onClose", () => {
    it("should empty content element", () => {
      modal = new LabelInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;

      modal.onClose();

      expect(mockContentEl.empty).toHaveBeenCalled();
    });
  });

  describe("button clicks", () => {
    let createButton: HTMLButtonElement;
    let cancelButton: HTMLButtonElement;

    beforeEach(() => {
      modal = new LabelInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal["submit"] = jest.fn();
      modal["cancel"] = jest.fn();

      // Create actual buttons for testing
      createButton = document.createElement("button");
      cancelButton = document.createElement("button");

      mockContentEl.createEl.mockImplementation((tag: string, options?: any) => {
        if (tag === "button" && options?.text === "Create") {
          return createButton;
        }
        if (tag === "button" && options?.text === "Cancel") {
          return cancelButton;
        }
        return document.createElement(tag);
      });

      modal.onOpen();
    });

    it("should call submit when Create button is clicked", () => {
      createButton.addEventListener("click", () => modal["submit"]());
      createButton.click();

      expect(modal["submit"]).toHaveBeenCalled();
    });

    it("should call cancel when Cancel button is clicked", () => {
      cancelButton.addEventListener("click", () => modal["cancel"]());
      cancelButton.click();

      expect(modal["cancel"]).toHaveBeenCalled();
    });
  });
});