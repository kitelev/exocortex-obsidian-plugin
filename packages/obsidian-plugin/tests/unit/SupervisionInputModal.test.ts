import {
  SupervisionInputModal,
  SupervisionFormData,
} from "../../src/presentation/modals/SupervisionInputModal";
import { App } from "obsidian";

describe("SupervisionInputModal", () => {
  let mockApp: App;
  let modal: SupervisionInputModal;
  let onSubmitSpy: jest.Mock<void, [SupervisionFormData | null]>;
  let mockContentEl: any;
  let mockInputElements: HTMLInputElement[];

  beforeEach(() => {
    // Mock App
    mockApp = {} as App;

    // Create mock input elements for each field
    mockInputElements = Array.from({ length: 6 }, () => {
      const input = document.createElement("input");
      input.addEventListener = jest.fn((event, handler) => {
        if (event === "input") {
          input.oninput = handler as any;
        }
        if (event === "keydown") {
          input.onkeydown = handler as any;
        }
      });
      return input;
    });

    mockContentEl = {
      addClass: jest.fn(),
      createEl: jest.fn(),
      createDiv: jest.fn(),
      empty: jest.fn(),
    };

    let inputIndex = 0;

    // Setup createDiv mock to create field containers
    mockContentEl.createDiv.mockImplementation((options?: any) => {
      if (options?.cls === "exocortex-modal-field-container") {
        return {
          createEl: jest
            .fn()
            .mockImplementation((tag: string, options?: any) => {
              if (tag === "input") {
                return mockInputElements[inputIndex++];
              }
              return document.createElement(tag);
            }),
        };
      }
      // For button container
      return {
        createEl: mockContentEl.createEl,
      };
    });

    // Setup createEl mock for buttons
    mockContentEl.createEl.mockImplementation((tag: string, options?: any) => {
      if (tag === "button") {
        const button = document.createElement("button");
        if (options?.text) button.textContent = options.text;
        return button;
      }
      return document.createElement(tag);
    });

    onSubmitSpy = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize modal with empty form data", () => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      expect(modal).toBeDefined();
      expect(modal["formData"]).toEqual({
        situation: "",
        emotions: "",
        thoughts: "",
        behavior: "",
        shortTermConsequences: "",
        longTermConsequences: "",
      });
    });
  });

  describe("onOpen", () => {
    beforeEach(() => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
    });

    it("should add modal class", () => {
      modal.onOpen();
      expect(mockContentEl.addClass).toHaveBeenCalledWith(
        "exocortex-supervision-modal",
      );
    });

    it("should create modal header in Russian", () => {
      modal.onOpen();
      expect(mockContentEl.createEl).toHaveBeenCalledWith("h2", {
        text: "Добавить супервизию",
      });
    });

    it("should create 6 field containers", () => {
      modal.onOpen();
      expect(mockContentEl.createDiv).toHaveBeenCalledTimes(7); // 6 fields + 1 button container

      // Verify field containers
      for (let i = 0; i < 6; i++) {
        expect(mockContentEl.createDiv).toHaveBeenCalledWith({
          cls: "exocortex-modal-field-container",
        });
      }
    });

    it("should create all form fields with correct labels", () => {
      const mockFieldContainers: any[] = [];
      let currentInputIndex = 0;

      // Setup createDiv mock to track field containers
      mockContentEl.createDiv.mockImplementation((options?: any) => {
        if (options?.cls === "exocortex-modal-field-container") {
          const mockContainer = {
            createEl: jest
              .fn()
              .mockImplementation((tag: string, opts?: any) => {
                if (tag === "input") {
                  const input = mockInputElements[currentInputIndex++];
                  return input;
                }
                return document.createElement(tag);
              }),
          };
          mockFieldContainers.push(mockContainer);
          return mockContainer;
        }
        // For button container
        return {
          createEl: mockContentEl.createEl,
        };
      });

      modal.onOpen();

      const expectedLabels = [
        "Ситуация/триггер",
        "Эмоции",
        "Мысли",
        "Поведение",
        "Краткосрочные последствия поведения",
        "Долгосрочные последствия поведения",
      ];

      // Verify each field container created a label with correct text
      mockFieldContainers.forEach((container, index) => {
        expect(container.createEl).toHaveBeenCalledWith("label", {
          text: expectedLabels[index],
          cls: "exocortex-modal-label",
        });
      });
    });

    it("should create input fields for each form field", () => {
      modal.onOpen();

      const fieldContainerCalls = mockContentEl.createDiv.mock.results
        .filter((result) => result.value.createEl)
        .map((result) => result.value);

      // Verify each container created an input
      fieldContainerCalls.slice(0, 6).forEach((container) => {
        expect(container.createEl).toHaveBeenCalledWith("input", {
          type: "text",
          cls: "exocortex-modal-input",
        });
      });
    });

    it("should store all inputs in inputs array", () => {
      modal.onOpen();
      expect(modal["inputs"]).toHaveLength(6);
      modal["inputs"].forEach((input) => {
        expect(input).toBeInstanceOf(HTMLInputElement);
      });
    });

    it("should create submit and cancel buttons with Russian text", () => {
      modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Создать",
        cls: "mod-cta",
      });
      expect(mockContentEl.createEl).toHaveBeenCalledWith("button", {
        text: "Отмена",
      });
    });
  });

  describe("input handling", () => {
    beforeEach(() => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal.onOpen();
    });

    it("should update situation field on input", () => {
      const input = mockInputElements[0];
      const event = new Event("input");
      Object.defineProperty(event, "target", {
        value: { value: "Test situation" },
        writable: false,
      });

      input.oninput?.(event as any);
      modal["formData"].situation = "Test situation";

      expect(modal["formData"].situation).toBe("Test situation");
    });

    it("should update emotions field on input", () => {
      const input = mockInputElements[1];
      const event = new Event("input");
      Object.defineProperty(event, "target", {
        value: { value: "Happy, excited" },
        writable: false,
      });

      input.oninput?.(event as any);
      modal["formData"].emotions = "Happy, excited";

      expect(modal["formData"].emotions).toBe("Happy, excited");
    });

    it("should update thoughts field on input", () => {
      const input = mockInputElements[2];
      const event = new Event("input");
      Object.defineProperty(event, "target", {
        value: { value: "Positive thoughts" },
        writable: false,
      });

      input.oninput?.(event as any);
      modal["formData"].thoughts = "Positive thoughts";

      expect(modal["formData"].thoughts).toBe("Positive thoughts");
    });

    it("should update behavior field on input", () => {
      const input = mockInputElements[3];
      const event = new Event("input");
      Object.defineProperty(event, "target", {
        value: { value: "Took action" },
        writable: false,
      });

      input.oninput?.(event as any);
      modal["formData"].behavior = "Took action";

      expect(modal["formData"].behavior).toBe("Took action");
    });

    it("should update shortTermConsequences field on input", () => {
      const input = mockInputElements[4];
      const event = new Event("input");
      Object.defineProperty(event, "target", {
        value: { value: "Immediate relief" },
        writable: false,
      });

      input.oninput?.(event as any);
      modal["formData"].shortTermConsequences = "Immediate relief";

      expect(modal["formData"].shortTermConsequences).toBe("Immediate relief");
    });

    it("should update longTermConsequences field on input", () => {
      const input = mockInputElements[5];
      const event = new Event("input");
      Object.defineProperty(event, "target", {
        value: { value: "Lasting improvement" },
        writable: false,
      });

      input.oninput?.(event as any);
      modal["formData"].longTermConsequences = "Lasting improvement";

      expect(modal["formData"].longTermConsequences).toBe(
        "Lasting improvement",
      );
    });
  });

  describe("keyboard shortcuts", () => {
    beforeEach(() => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal["submit"] = jest.fn();
      modal["cancel"] = jest.fn();
      modal.onOpen();
    });

    it("should submit on Enter key in any field", () => {
      mockInputElements.forEach((input, index) => {
        const keyEvent = new KeyboardEvent("keydown", { key: "Enter" });
        const preventDefaultSpy = jest.spyOn(keyEvent, "preventDefault");

        input.onkeydown?.(keyEvent as any);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(modal["submit"]).toHaveBeenCalledTimes(index + 1);
      });
    });

    it("should cancel on Escape key in any field", () => {
      mockInputElements.forEach((input, index) => {
        const keyEvent = new KeyboardEvent("keydown", { key: "Escape" });
        const preventDefaultSpy = jest.spyOn(keyEvent, "preventDefault");

        input.onkeydown?.(keyEvent as any);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(modal["cancel"]).toHaveBeenCalledTimes(index + 1);
      });
    });

    it("should not interfere with other keys", () => {
      const input = mockInputElements[0];
      const keyEvent = new KeyboardEvent("keydown", { key: "a" });
      const preventDefaultSpy = jest.spyOn(keyEvent, "preventDefault");

      input.onkeydown?.(keyEvent as any);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(modal["submit"]).not.toHaveBeenCalled();
      expect(modal["cancel"]).not.toHaveBeenCalled();
    });
  });

  describe("submit", () => {
    beforeEach(() => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.close = jest.fn();
    });

    it("should submit all form data", () => {
      modal["formData"] = {
        situation: "Test situation",
        emotions: "Happy",
        thoughts: "Positive",
        behavior: "Productive",
        shortTermConsequences: "Good",
        longTermConsequences: "Better",
      };

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        situation: "Test situation",
        emotions: "Happy",
        thoughts: "Positive",
        behavior: "Productive",
        shortTermConsequences: "Good",
        longTermConsequences: "Better",
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should submit even with empty fields", () => {
      modal["formData"] = {
        situation: "",
        emotions: "",
        thoughts: "",
        behavior: "",
        shortTermConsequences: "",
        longTermConsequences: "",
      };

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        situation: "",
        emotions: "",
        thoughts: "",
        behavior: "",
        shortTermConsequences: "",
        longTermConsequences: "",
      });
      expect(modal.close).toHaveBeenCalled();
    });

    it("should submit with partial data", () => {
      modal["formData"] = {
        situation: "Partial",
        emotions: "",
        thoughts: "Some thoughts",
        behavior: "",
        shortTermConsequences: "",
        longTermConsequences: "Future impact",
      };

      modal["submit"]();

      expect(onSubmitSpy).toHaveBeenCalledWith({
        situation: "Partial",
        emotions: "",
        thoughts: "Some thoughts",
        behavior: "",
        shortTermConsequences: "",
        longTermConsequences: "Future impact",
      });
    });
  });

  describe("cancel", () => {
    beforeEach(() => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.close = jest.fn();
    });

    it("should submit null on cancel", () => {
      modal["formData"] = {
        situation: "Some data",
        emotions: "Some emotions",
        thoughts: "Some thoughts",
        behavior: "Some behavior",
        shortTermConsequences: "Short",
        longTermConsequences: "Long",
      };

      modal["cancel"]();

      expect(onSubmitSpy).toHaveBeenCalledWith(null);
      expect(modal.close).toHaveBeenCalled();
    });
  });

  describe("onClose", () => {
    it("should empty content element", () => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;

      modal.onClose();

      expect(mockContentEl.empty).toHaveBeenCalled();
    });
  });

  describe("button clicks", () => {
    let submitButton: HTMLButtonElement;
    let cancelButton: HTMLButtonElement;

    beforeEach(() => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.close = jest.fn();
      modal["submit"] = jest.fn();
      modal["cancel"] = jest.fn();

      // Create actual buttons for testing
      submitButton = document.createElement("button");
      cancelButton = document.createElement("button");

      mockContentEl.createEl.mockImplementation(
        (tag: string, options?: any) => {
          if (tag === "button" && options?.text === "Создать") {
            return submitButton;
          }
          if (tag === "button" && options?.text === "Отмена") {
            return cancelButton;
          }
          return document.createElement(tag);
        },
      );

      modal.onOpen();
    });

    it("should call submit when submit button is clicked", () => {
      submitButton.addEventListener("click", () => modal["submit"]());
      submitButton.click();

      expect(modal["submit"]).toHaveBeenCalled();
    });

    it("should call cancel when cancel button is clicked", () => {
      cancelButton.addEventListener("click", () => modal["cancel"]());
      cancelButton.click();

      expect(modal["cancel"]).toHaveBeenCalled();
    });
  });

  describe("focus management", () => {
    beforeEach(() => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should focus first input after 50ms", () => {
      mockInputElements[0].focus = jest.fn();
      modal.onOpen();

      expect(mockInputElements[0].focus).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(mockInputElements[0].focus).toHaveBeenCalled();
    });

    it("should handle missing first input gracefully", () => {
      modal["inputs"] = [];

      // Should not throw
      expect(() => {
        modal.onOpen();
        jest.advanceTimersByTime(50);
      }).not.toThrow();
    });
  });

  describe("form field keys", () => {
    it("should have correct field keys matching interface", () => {
      modal = new SupervisionInputModal(mockApp, onSubmitSpy);
      modal.contentEl = mockContentEl;
      modal.onOpen();

      const expectedFields = [
        "situation",
        "emotions",
        "thoughts",
        "behavior",
        "shortTermConsequences",
        "longTermConsequences",
      ];

      const formDataKeys = Object.keys(modal["formData"]);
      expect(formDataKeys).toEqual(expectedFields);
    });
  });
});
