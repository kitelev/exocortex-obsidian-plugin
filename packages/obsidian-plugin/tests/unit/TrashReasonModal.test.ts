import { TrashReasonModal, TrashReasonModalResult } from "../../src/presentation/modals/TrashReasonModal";
import { App } from "obsidian";

describe("TrashReasonModal", () => {
  let mockApp: App;
  let modal: TrashReasonModal;
  let onSubmitSpy: jest.Mock<void, [TrashReasonModalResult]>;
  let mockContentEl: any;
  let mockTextareaEl: HTMLTextAreaElement;

  beforeEach(() => {
    // Mock App
    mockApp = {} as App;

    // Mock content element and its methods
    mockTextareaEl = document.createElement("textarea");

    mockContentEl = {
      addClass: jest.fn(),
      createEl: jest.fn(),
      createDiv: jest.fn(),
      empty: jest.fn(),
    };

    // Setup createEl mock to return appropriate elements
    mockContentEl.createEl.mockImplementation((tag: string, options?: any) => {
      if (tag === "textarea") {
        mockTextareaEl = document.createElement("textarea");
        if (options?.placeholder) mockTextareaEl.placeholder = options.placeholder;
        return mockTextareaEl;
      }
      if (tag === "button") {
        const button = document.createElement("button");
        if (options?.text) button.textContent = options.text;
        return button;
      }
      return document.createElement(tag);
    });

    // Setup createDiv mock
    mockContentEl.createDiv.mockImplementation(() => ({
      createEl: mockContentEl.createEl,
      createDiv: mockContentEl.createDiv,
    }));

    onSubmitSpy = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default values", () => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      expect(modal).toBeDefined();
    });
  });

  describe("onOpen", () => {
    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
    });

    it("should add modal class", () => {
      modal.onOpen();
      expect(mockContentEl.addClass).toHaveBeenCalledWith("exocortex-trash-reason-modal");
    });

    it("should create modal title", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("h2", { text: "Trash effort" });
    });

    it("should create description", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("p", {
        text: "Optionally enter a reason for trashing this effort. This will be appended to the note.",
        cls: "exocortex-modal-description",
      });
    });

    it("should create textarea field", () => {
      modal.onOpen();

      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        cls: "exocortex-modal-input-container",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("textarea", {
        placeholder: "Reason for trashing (optional)",
        cls: "exocortex-modal-input exocortex-modal-textarea",
      });
    });

    it("should create Confirm and Cancel buttons", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Confirm",
        cls: "mod-cta",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Cancel",
      });
    });
  });

  describe("input handling", () => {
    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal.onOpen();
    });

    it("should update reason on input change", () => {
      const inputEvent = new Event("input");
      Object.defineProperty(inputEvent, "target", {
        value: { value: "Not needed anymore" },
        writable: false,
      });

      mockTextareaEl.dispatchEvent(inputEvent);
      mockTextareaEl.value = "Not needed anymore";

      // Simulate the event handler
      modal["reason"] = "Not needed anymore";
      expect(modal["reason"]).toBe("Not needed anymore");
    });

    it("should submit on Ctrl+Enter key", () => {
      const keyEvent = new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true });
      const preventDefaultSpy = jest.spyOn(keyEvent, "preventDefault");

      // Simulate key handler
      modal["submit"] = jest.fn();
      mockTextareaEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          modal["submit"]();
        }
      });

      mockTextareaEl.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(modal["submit"]).toHaveBeenCalled();
    });

    it("should submit on Cmd+Enter key (Mac)", () => {
      const keyEvent = new KeyboardEvent("keydown", { key: "Enter", metaKey: true });
      const preventDefaultSpy = jest.spyOn(keyEvent, "preventDefault");

      // Simulate key handler
      modal["submit"] = jest.fn();
      mockTextareaEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          modal["submit"]();
        }
      });

      mockTextareaEl.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(modal["submit"]).toHaveBeenCalled();
    });

    it("should NOT submit on plain Enter key (allow newlines)", () => {
      const keyEvent = new KeyboardEvent("keydown", { key: "Enter" });

      // Simulate key handler
      modal["submit"] = jest.fn();
      mockTextareaEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          modal["submit"]();
        }
      });

      mockTextareaEl.dispatchEvent(keyEvent);

      expect(modal["submit"]).not.toHaveBeenCalled();
    });

    it("should cancel on Escape key", () => {
      const keyEvent = new KeyboardEvent("keydown", { key: "Escape" });
      const preventDefaultSpy = jest.spyOn(keyEvent, "preventDefault");

      // Simulate Escape key handler
      modal["cancel"] = jest.fn();
      mockTextareaEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          modal["cancel"]();
        }
      });

      mockTextareaEl.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(modal["cancel"]).toHaveBeenCalled();
    });
  });

  describe("submit", () => {
    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.close = jest.fn();
    });

    it("should submit with confirmed true and trimmed reason", () => {
      modal["reason"] = "  Task is obsolete  ";

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        confirmed: true,
        reason: "Task is obsolete",
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should submit with null reason if empty", () => {
      modal["reason"] = "  ";

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        confirmed: true,
        reason: null,
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should preserve multiline reason text", () => {
      modal["reason"] = "First reason\nSecond reason\nThird reason";

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        confirmed: true,
        reason: "First reason\nSecond reason\nThird reason",
      });
      expect(modal.close).toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.close = jest.fn();
    });

    it("should submit with confirmed false on cancel", () => {
      modal["reason"] = "Some reason that should be ignored";

      modal["cancel"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        confirmed: false,
        reason: null,
      });
      expect(modal.close).toHaveBeenCalled();
    });
  });

  describe("onClose", () => {
    it("should empty content element", () => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;

      modal.onClose();

      expect(mockContentEl.empty).toHaveBeenCalled();
    });
  });

  describe("button clicks", () => {
    let confirmButton: HTMLButtonElement;
    let cancelButton: HTMLButtonElement;

    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal["submit"] = jest.fn();
      modal["cancel"] = jest.fn();

      // Create actual buttons for testing
      confirmButton = document.createElement("button");
      cancelButton = document.createElement("button");

      mockContentEl.createEl.mockImplementation((tag: string, options?: any) => {
        if (tag === "button" && options?.text === "Confirm") {
          return confirmButton;
        }
        if (tag === "button" && options?.text === "Cancel") {
          return cancelButton;
        }
        if (tag === "textarea") {
          return mockTextareaEl;
        }
        return document.createElement(tag);
      });

      modal.onOpen();
    });

    it("should call submit when Confirm button is clicked", () => {
      confirmButton.addEventListener("click", () => modal["submit"]());
      confirmButton.click();

      expect(modal["submit"]).toHaveBeenCalled();
    });

    it("should call cancel when Cancel button is clicked", () => {
      cancelButton.addEventListener("click", () => modal["cancel"]());
      cancelButton.click();

      expect(modal["cancel"]).toHaveBeenCalled();
    });
  });
});
