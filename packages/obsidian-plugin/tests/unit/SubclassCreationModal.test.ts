import { SubclassCreationModal } from "../../src/presentation/modals/SubclassCreationModal";
import { App } from "obsidian";

jest.mock("obsidian", () => ({
  Modal: class MockModal {
    contentEl: any;
    close = jest.fn();
  },
  App: jest.fn(),
}));

describe("SubclassCreationModal", () => {
  let mockContentEl: any;
  let modal: SubclassCreationModal;
  let onSubmitSpy: jest.Mock;
  let mockApp: App;

  beforeEach(() => {
    mockApp = {} as App;

    mockContentEl = {
      addClass: jest.fn(),
      createEl: jest.fn().mockImplementation((tag, options) => {
        if (tag === "input") {
          const input = document.createElement("input");
          if (options?.type) input.type = options.type;
          if (options?.placeholder) input.placeholder = options.placeholder;
          if (options?.cls) input.className = options.cls;
          return input;
        }
        if (tag === "button") {
          const button = document.createElement("button");
          if (options?.text) button.textContent = options.text;
          if (options?.cls) button.className = options.cls;
          return button;
        }
        return document.createElement(tag);
      }),
      createDiv: jest.fn().mockImplementation((options) => ({
        createEl: mockContentEl.createEl,
        className: options?.cls || "",
        textContent: options?.text || "",
      })),
      querySelector: jest.fn().mockReturnValue(null),
      empty: jest.fn(),
    };

    onSubmitSpy = jest.fn();
    modal = new SubclassCreationModal(mockApp, onSubmitSpy);
    modal.contentEl = mockContentEl;
    modal.close = jest.fn();
  });

  describe("onOpen", () => {
    it("should render modal elements", () => {
      modal.onOpen();

      expect(mockContentEl.addClass).toHaveBeenCalledWith(
        "exocortex-subclass-creation-modal",
      );
      expect(mockContentEl.createEl).toHaveBeenCalledWith("h2", {
        text: "Create subclass",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("p", {
        text: "Subclass label (required):",
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
        placeholder: "enter subclass label...",
        cls: "exocortex-modal-input",
      });
    });

    it("should create buttons", () => {
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

  describe("submit", () => {
    it("should call onSubmit with trimmed label", () => {
      modal["label"] = "  Test Subclass  ";
      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({ label: "Test Subclass" });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should show error if label is empty", () => {
      modal["label"] = "";
      modal.onOpen();
      modal["submit"]();

      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        text: "Subclass label is required",
        cls: "exocortex-modal-error",
      });
      expect(onSubmitSpy).not.toHaveBeenCalled();
      expect(modal.close).not.toHaveBeenCalled();
    });

    it("should show error if label is only whitespace", () => {
      modal["label"] = "   ";
      modal.onOpen();
      modal["submit"]();

      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        text: "Subclass label is required",
        cls: "exocortex-modal-error",
      });
      expect(onSubmitSpy).not.toHaveBeenCalled();
    });

    it("should remove existing error before showing new one", () => {
      const mockExistingError = {
        remove: jest.fn(),
      };
      mockContentEl.querySelector.mockReturnValue(mockExistingError);

      modal["label"] = "";
      modal.onOpen();
      modal["submit"]();

      expect(mockContentEl.querySelector).toHaveBeenCalledWith(
        ".exocortex-modal-error",
      );
      expect(mockExistingError.remove).toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("should call onSubmit with null label", () => {
      modal["cancel"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({ label: null });
      expect(modal.close).toHaveBeenCalled();
    });
  });

  describe("onClose", () => {
    it("should empty contentEl", () => {
      modal.onClose();

      expect(mockContentEl.empty).toHaveBeenCalled();
    });
  });
});
