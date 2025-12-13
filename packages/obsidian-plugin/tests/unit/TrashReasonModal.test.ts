import { App } from "obsidian";
import { TrashReasonModal, TrashReasonModalResult } from "../../src/presentation/modals/TrashReasonModal";

describe("TrashReasonModal", () => {
  let mockApp: App;
  let modal: TrashReasonModal;
  let onSubmitSpy: jest.Mock<void, [TrashReasonModalResult]>;
  let mockContentEl: any;
  let mockTextarea: HTMLTextAreaElement;

  beforeEach(() => {
    jest.useFakeTimers();
    mockApp = {} as App;
    onSubmitSpy = jest.fn();

    mockTextarea = document.createElement("textarea");
    mockTextarea.rows = 3;

    mockContentEl = {
      addClass: jest.fn(),
      createEl: jest.fn(),
      createDiv: jest.fn(),
      empty: jest.fn(),
    };

    // Setup createEl mock to return appropriate elements
    mockContentEl.createEl.mockImplementation((tag: string, options?: any) => {
      if (tag === "textarea") {
        if (options?.placeholder) {
          mockTextarea.placeholder = options.placeholder;
        }
        return mockTextarea;
      }
      if (tag === "button") {
        const button = document.createElement("button");
        if (options?.text) button.textContent = options.text;
        if (options?.cls) button.className = options.cls;
        return button;
      }
      if (tag === "p" || tag === "h2") {
        const el = document.createElement(tag);
        if (options?.text) el.textContent = options.text;
        return el;
      }
      return document.createElement(tag);
    });

    // Setup createDiv mock
    mockContentEl.createDiv.mockImplementation((options?: any) => {
      return {
        createEl: mockContentEl.createEl,
      };
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("UI elements", () => {
    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
    });

    it("renders with correct header", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("h2", { text: "Trash effort" });
    });

    it("renders textarea for reason input", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("textarea", {
        placeholder: "Reason for trashing...",
        cls: "exocortex-modal-input exocortex-modal-textarea",
      });
    });

    it("renders Confirm and Cancel buttons", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Confirm",
        cls: "mod-cta",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Cancel",
      });
    });

    it("focuses the textarea after 50ms", () => {
      mockTextarea.focus = jest.fn();
      modal.onOpen();

      expect(mockTextarea.focus).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(mockTextarea.focus).toHaveBeenCalled();
    });
  });

  describe("confirm action", () => {
    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
    });

    it("returns confirmed: true and trimmed reason when Confirm is clicked", () => {
      modal.onOpen();
      modal["reason"] = "  No longer needed  ";
      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: "No longer needed",
        confirmed: true,
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("returns null reason when confirmed with empty input", () => {
      modal.onOpen();
      modal["reason"] = "";
      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: null,
        confirmed: true,
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("returns null reason when confirmed with whitespace-only input", () => {
      modal.onOpen();
      modal["reason"] = "   \n  \t  ";
      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: null,
        confirmed: true,
      });
    });

    it("submits when pressing Ctrl+Enter", () => {
      modal.onOpen();
      modal["reason"] = "Keyboard submit";

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: "Keyboard submit",
        confirmed: true,
      });
    });

    it("submits when pressing Cmd+Enter (Mac)", () => {
      modal.onOpen();
      modal["reason"] = "Mac keyboard submit";

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: "Mac keyboard submit",
        confirmed: true,
      });
    });
  });

  describe("cancel action", () => {
    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
    });

    it("returns confirmed: false when Cancel is clicked", () => {
      modal.onOpen();
      modal["cancel"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: null,
        confirmed: false,
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("returns confirmed: false when Escape is pressed", () => {
      modal.onOpen();
      modal["cancel"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: null,
        confirmed: false,
      });
    });

    it("discards entered reason when cancelled", () => {
      modal.onOpen();
      modal["reason"] = "Some reason that should be discarded";
      modal["cancel"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: null,
        confirmed: false,
      });
    });
  });

  describe("multiline input", () => {
    beforeEach(() => {
      modal = new TrashReasonModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
    });

    it("preserves multiline reason text", () => {
      modal.onOpen();
      modal["reason"] = "Line 1\nLine 2\nLine 3";
      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        reason: "Line 1\nLine 2\nLine 3",
        confirmed: true,
      });
    });
  });

  describe("onClose", () => {
    it("empties content element", () => {
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
      confirmButton.className = "mod-cta";
      cancelButton = document.createElement("button");

      mockContentEl.createEl.mockImplementation((tag: string, options?: any) => {
        if (tag === "button" && options?.cls === "mod-cta") {
          return confirmButton;
        }
        if (tag === "button" && !options?.cls) {
          return cancelButton;
        }
        if (tag === "textarea") {
          return mockTextarea;
        }
        return document.createElement(tag);
      });

      modal.onOpen();
    });

    it("calls submit when Confirm button is clicked", () => {
      confirmButton.addEventListener("click", () => modal["submit"]());
      confirmButton.click();

      expect(modal["submit"]).toHaveBeenCalled();
    });

    it("calls cancel when Cancel button is clicked", () => {
      cancelButton.addEventListener("click", () => modal["cancel"]());
      cancelButton.click();

      expect(modal["cancel"]).toHaveBeenCalled();
    });
  });
});
