import {
  NarrowerConceptModal,
  NarrowerConceptModalResult,
} from "../../src/presentation/modals/NarrowerConceptModal";
import { App } from "obsidian";

describe("NarrowerConceptModal", () => {
  let mockApp: App;
  let modal: NarrowerConceptModal;
  let onSubmitSpy: jest.Mock<void, [NarrowerConceptModalResult]>;
  let mockContentEl: any;
  let mockFileNameInput: HTMLInputElement;
  let mockDefinitionTextarea: HTMLTextAreaElement;
  let mockAliasesContainer: any;

  beforeEach(() => {
    // Mock App
    mockApp = {} as App;

    // Mock content element and its methods
    mockFileNameInput = document.createElement("input");
    mockDefinitionTextarea = document.createElement("textarea");
    mockAliasesContainer = {
      empty: jest.fn(),
      createDiv: jest.fn(),
    };

    mockContentEl = {
      addClass: jest.fn(),
      createEl: jest.fn(),
      createDiv: jest.fn(),
      querySelector: jest.fn(),
      empty: jest.fn(),
    };

    // Setup createEl mock to return appropriate elements
    mockContentEl.createEl.mockImplementation((tag: string, options?: any) => {
      if (tag === "input") {
        if (options?.value !== undefined)
          mockFileNameInput.value = options.value;
        if (options?.placeholder === "concept-file-name") {
          return mockFileNameInput;
        }
        // Create new input for alias inputs
        const aliasInput = document.createElement("input");
        if (options?.value !== undefined) aliasInput.value = options.value;
        return aliasInput;
      }
      if (tag === "textarea") {
        return mockDefinitionTextarea;
      }
      if (tag === "button") {
        const button = document.createElement("button");
        if (options?.text) button.textContent = options.text;
        return button;
      }
      if (tag === "p" || tag === "h2") {
        return document.createElement(tag);
      }
      return document.createElement(tag);
    });

    // Setup createDiv mock
    mockContentEl.createDiv.mockImplementation((options?: any) => {
      if (options?.cls === "exocortex-modal-aliases-container") {
        return mockAliasesContainer;
      }
      // For alias rows
      if (options?.cls === "exocortex-modal-alias-row") {
        const mockRow = {
          createEl: mockContentEl.createEl,
        };
        return mockRow;
      }
      // For other divs
      return {
        createEl: mockContentEl.createEl,
      };
    });

    // Setup aliases container createDiv
    mockAliasesContainer.createDiv.mockImplementation((options?: any) => ({
      createEl: mockContentEl.createEl,
    }));

    onSubmitSpy = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize modal", () => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      expect(modal).toBeDefined();
    });
  });

  describe("onOpen", () => {
    beforeEach(() => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
    });

    it("should add modal class", () => {
      modal.onOpen();
      expect(mockContentEl.addClass).toHaveBeenCalledWith(
        "exocortex-narrower-concept-modal",
      );
    });

    it("should create modal header", () => {
      modal.onOpen();
      expect(mockContentEl.createEl).toHaveBeenCalledWith("h2", {
        text: "Create narrower concept",
      });
    });

    it("should create file name input field", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("p", {
        text: "File name (required):",
        cls: "exocortex-modal-description",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("input", {
        type: "text",
        placeholder: "concept-file-name",
        cls: "exocortex-modal-input",
      });
    });

    it("should create definition textarea", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("p", {
        text: "Definition (required):",
        cls: "exocortex-modal-description",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("textarea", {
        placeholder: "Enter concept definition...",
        cls: "exocortex-modal-textarea",
      });
    });

    it("should create aliases section", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("p", {
        text: "Aliases (optional):",
        cls: "exocortex-modal-description",
      });
      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        cls: "exocortex-modal-aliases-container",
      });
    });

    it("should create Add alias button", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Add alias",
        cls: "exocortex-modal-add-alias-button",
      });
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
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal.onOpen();
    });

    it("should update fileName on input change", () => {
      const inputEvent = new Event("input");
      Object.defineProperty(inputEvent, "target", {
        value: { value: "my-concept" },
        writable: false,
      });

      mockFileNameInput.dispatchEvent(inputEvent);
      mockFileNameInput.value = "my-concept";

      // Simulate the event handler
      modal["fileName"] = "my-concept";
      expect(modal["fileName"]).toBe("my-concept");
    });

    it("should update definition on textarea change", () => {
      const inputEvent = new Event("input");
      Object.defineProperty(inputEvent, "target", {
        value: { value: "This is the concept definition" },
        writable: false,
      });

      mockDefinitionTextarea.dispatchEvent(inputEvent);
      mockDefinitionTextarea.value = "This is the concept definition";

      // Simulate the event handler
      modal["definition"] = "This is the concept definition";
      expect(modal["definition"]).toBe("This is the concept definition");
    });
  });

  describe("alias management", () => {
    beforeEach(() => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal.onOpen();
    });

    it("should add empty alias when Add alias button is clicked", () => {
      modal["addAlias"]();

      expect(modal["aliases"]).toEqual([""]);
      expect(mockAliasesContainer.empty).toHaveBeenCalled();
    });

    it("should add multiple aliases", () => {
      modal["addAlias"]();
      modal["addAlias"]();
      modal["addAlias"]();

      expect(modal["aliases"]).toEqual(["", "", ""]);
    });

    it("should update alias value on input", () => {
      modal["aliases"] = ["alias1", "alias2"];
      const index = 0;
      const newValue = "updated-alias";

      // Simulate alias input change
      modal["aliases"][index] = newValue;

      expect(modal["aliases"][0]).toBe("updated-alias");
      expect(modal["aliases"][1]).toBe("alias2");
    });

    it("should remove alias at specific index", () => {
      modal["aliases"] = ["alias1", "alias2", "alias3"];

      // Simulate clicking remove button for middle alias
      modal["aliases"].splice(1, 1);
      modal["renderAliases"]();

      expect(modal["aliases"]).toEqual(["alias1", "alias3"]);
      expect(mockAliasesContainer.empty).toHaveBeenCalled();
    });

    it("should render aliases correctly", () => {
      modal["aliases"] = ["alias1", "alias2"];
      modal["renderAliases"]();

      expect(mockAliasesContainer.empty).toHaveBeenCalled();
      expect(mockAliasesContainer.createDiv).toHaveBeenCalledTimes(2);
      expect(mockAliasesContainer.createDiv).toHaveBeenCalledWith({
        cls: "exocortex-modal-alias-row",
      });
    });

    it("should render alias input with remove button for each alias", () => {
      modal["aliases"] = ["test-alias"];
      modal["renderAliases"]();

      // Verify input was created with the alias value
      expect(mockContentEl.createEl).toHaveBeenCalledWith("input", {
        type: "text",
        value: "test-alias",
        cls: "exocortex-modal-input",
      });

      // Verify remove button was created
      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "×",
        cls: "exocortex-modal-remove-alias-button",
      });
    });

    it("should handle empty aliases container gracefully", () => {
      modal["aliasesContainer"] = null;

      // Should not throw
      expect(() => modal["renderAliases"]()).not.toThrow();
    });
  });

  describe("validation", () => {
    beforeEach(() => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();

      // Mock showError method
      modal["showError"] = jest.fn();
    });

    it("should show error when fileName is empty", () => {
      modal["fileName"] = "";
      modal["definition"] = "Valid definition";

      modal["submit"]();

      expect(modal["showError"]).toHaveBeenCalledWith("File name is required");
      expect(onSubmitSpy).not.toHaveBeenCalled();
      expect(modal.close).not.toHaveBeenCalled();
    });

    it("should show error when fileName is only whitespace", () => {
      modal["fileName"] = "   ";
      modal["definition"] = "Valid definition";

      modal["submit"]();

      expect(modal["showError"]).toHaveBeenCalledWith("File name is required");
      expect(onSubmitSpy).not.toHaveBeenCalled();
      expect(modal.close).not.toHaveBeenCalled();
    });

    it("should show error when definition is empty", () => {
      modal["fileName"] = "valid-name";
      modal["definition"] = "";

      modal["submit"]();

      expect(modal["showError"]).toHaveBeenCalledWith("Definition is required");
      expect(onSubmitSpy).not.toHaveBeenCalled();
      expect(modal.close).not.toHaveBeenCalled();
    });

    it("should show error when definition is only whitespace", () => {
      modal["fileName"] = "valid-name";
      modal["definition"] = "   ";

      modal["submit"]();

      expect(modal["showError"]).toHaveBeenCalledWith("Definition is required");
      expect(onSubmitSpy).not.toHaveBeenCalled();
      expect(modal.close).not.toHaveBeenCalled();
    });
  });

  describe("submit", () => {
    beforeEach(() => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.close = jest.fn();
    });

    it("should submit with valid data and no aliases", () => {
      modal["fileName"] = "  concept-name  ";
      modal["definition"] = "  The definition of the concept  ";
      modal["aliases"] = [];

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        fileName: "concept-name",
        definition: "The definition of the concept",
        aliases: [],
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should submit with valid data and aliases", () => {
      modal["fileName"] = "concept-name";
      modal["definition"] = "Definition text";
      modal["aliases"] = ["  alias1  ", "alias2", "  ", "alias3  "];

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        fileName: "concept-name",
        definition: "Definition text",
        aliases: ["alias1", "alias2", "alias3"], // Empty aliases filtered out
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should filter out empty and whitespace-only aliases", () => {
      modal["fileName"] = "concept";
      modal["definition"] = "Definition";
      modal["aliases"] = ["valid", "", "  ", "another-valid", "   "];

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        fileName: "concept",
        definition: "Definition",
        aliases: ["valid", "another-valid"],
      });
    });
  });

  describe("cancel", () => {
    beforeEach(() => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.close = jest.fn();
    });

    it("should submit with null values on cancel", () => {
      modal["fileName"] = "some-name";
      modal["definition"] = "some definition";
      modal["aliases"] = ["alias1", "alias2"];

      modal["cancel"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        fileName: null,
        definition: null,
        aliases: [],
      });
      expect(modal.close).toHaveBeenCalled();
    });
  });

  describe("showError", () => {
    beforeEach(() => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;

      // Mock timer functions
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should create error element with message", () => {
      const errorDiv = { remove: jest.fn() };
      mockContentEl.createDiv.mockReturnValueOnce(errorDiv);
      mockContentEl.querySelector.mockReturnValue(null);

      modal["showError"]("Test error message");

      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        text: "Test error message",
        cls: "exocortex-modal-error",
      });
    });

    it("should remove existing error before showing new one", () => {
      const existingError = { remove: jest.fn() };
      const newError = { remove: jest.fn() };
      mockContentEl.querySelector.mockReturnValue(existingError);
      mockContentEl.createDiv.mockReturnValueOnce(newError);

      modal["showError"]("New error");

      expect(existingError.remove).toHaveBeenCalled();
      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        text: "New error",
        cls: "exocortex-modal-error",
      });
    });

    it("should auto-remove error after 3 seconds", () => {
      const errorDiv = { remove: jest.fn() };
      mockContentEl.createDiv.mockReturnValueOnce(errorDiv);
      mockContentEl.querySelector.mockReturnValue(null);

      modal["showError"]("Temporary error");

      expect(errorDiv.remove).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(3000);

      expect(errorDiv.remove).toHaveBeenCalled();
    });
  });

  describe("onClose", () => {
    it("should empty content element", () => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;

      modal.onClose();

      expect(mockContentEl.empty).toHaveBeenCalled();
    });
  });

  describe("button clicks", () => {
    let createButton: HTMLButtonElement;
    let cancelButton: HTMLButtonElement;
    let addAliasButton: HTMLButtonElement;

    beforeEach(() => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal["submit"] = jest.fn();
      modal["cancel"] = jest.fn();
      modal["addAlias"] = jest.fn();

      // Create actual buttons for testing
      createButton = document.createElement("button");
      cancelButton = document.createElement("button");
      addAliasButton = document.createElement("button");

      mockContentEl.createEl.mockImplementation(
        (tag: string, options?: any) => {
          if (tag === "button" && options?.text === "Create") {
            return createButton;
          }
          if (tag === "button" && options?.text === "Cancel") {
            return cancelButton;
          }
          if (tag === "button" && options?.text === "Add alias") {
            return addAliasButton;
          }
          return document.createElement(tag);
        },
      );

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

    it("should call addAlias when Add alias button is clicked", () => {
      addAliasButton.addEventListener("click", () => modal["addAlias"]());
      addAliasButton.click();

      expect(modal["addAlias"]).toHaveBeenCalled();
    });
  });

  describe("focus management", () => {
    beforeEach(() => {
      modal = new NarrowerConceptModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should focus fileName input after 50ms", () => {
      mockFileNameInput.focus = jest.fn();
      modal.onOpen();

      expect(mockFileNameInput.focus).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(mockFileNameInput.focus).toHaveBeenCalled();
    });
  });
});
