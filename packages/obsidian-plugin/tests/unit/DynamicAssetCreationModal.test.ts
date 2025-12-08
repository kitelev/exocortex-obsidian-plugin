import { App } from "obsidian";
import { DynamicAssetCreationModal, DynamicAssetCreationResult } from "../../src/presentation/modals/DynamicAssetCreationModal";

describe("DynamicAssetCreationModal", () => {
  let mockApp: App;
  let onSubmit: jest.Mock<void, [DynamicAssetCreationResult]>;
  let modal: DynamicAssetCreationModal;
  let mockContentEl: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApp = {} as App;
    onSubmit = jest.fn();

    // Mock content element to avoid actual DOM rendering
    mockContentEl = {
      addClass: jest.fn(),
      createEl: jest.fn().mockReturnValue({
        addEventListener: jest.fn(),
        createEl: jest.fn().mockReturnThis(),
      }),
      createDiv: jest.fn().mockReturnValue({
        createEl: jest.fn().mockReturnThis(),
      }),
      empty: jest.fn(),
    };
  });

  describe("constructor", () => {
    it("should create modal with className and onSubmit callback", () => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
      expect(modal).toBeDefined();
    });

    it("should accept different class names", () => {
      const taskModal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
      const projectModal = new DynamicAssetCreationModal(mockApp, "ems__Project", onSubmit);

      expect(taskModal).toBeDefined();
      expect(projectModal).toBeDefined();
    });
  });

  describe("onClose", () => {
    it("should empty content element", () => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
      // Override contentEl with mock
      (modal as any).contentEl = mockContentEl;

      modal.onClose();

      expect(mockContentEl.empty).toHaveBeenCalled();
    });
  });

  describe("isTaskClass (private method)", () => {
    beforeEach(() => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
    });

    it("should return true for ems__Task", () => {
      expect((modal as any).isTaskClass("ems__Task")).toBe(true);
    });

    it("should return true for task subclasses with underscore", () => {
      expect((modal as any).isTaskClass("ems__Task_Custom")).toBe(true);
    });

    it("should return false for ems__Project", () => {
      expect((modal as any).isTaskClass("ems__Project")).toBe(false);
    });

    it("should return false for ems__Area", () => {
      expect((modal as any).isTaskClass("ems__Area")).toBe(false);
    });

    it("should return false for TaskPrototype (not a prefix match)", () => {
      expect((modal as any).isTaskClass("ems__TaskPrototype")).toBe(false);
    });
  });

  describe("getDisplayClassName (private method)", () => {
    beforeEach(() => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
    });

    it("should format ems__Task to Task", () => {
      expect((modal as any).getDisplayClassName("ems__Task")).toBe("Task");
    });

    it("should format ems__Project to Project", () => {
      expect((modal as any).getDisplayClassName("ems__Project")).toBe("Project");
    });

    it("should format exo__Asset to Asset", () => {
      expect((modal as any).getDisplayClassName("exo__Asset")).toBe("Asset");
    });

    it("should handle underscores in class names by converting to spaces", () => {
      expect((modal as any).getDisplayClassName("ems__Task_Custom_Type")).toBe("Task Custom Type");
    });

    it("should handle camelCase in class names by adding spaces", () => {
      expect((modal as any).getDisplayClassName("ems__TaskPrototype")).toBe("Task Prototype");
    });

    it("should handle complex class names with both underscores and camelCase", () => {
      expect((modal as any).getDisplayClassName("ems__MyCustom_TaskType")).toBe("My Custom Task Type");
    });
  });

  describe("DynamicAssetCreationResult interface", () => {
    it("should extend LabelInputModalResult with propertyValues", () => {
      const result: DynamicAssetCreationResult = {
        label: "Test Label",
        taskSize: "S",
        openInNewTab: true,
        propertyValues: {
          customField: "value",
        },
      };

      expect(result.label).toBe("Test Label");
      expect(result.taskSize).toBe("S");
      expect(result.openInNewTab).toBe(true);
      expect(result.propertyValues).toEqual({ customField: "value" });
    });

    it("should allow null label", () => {
      const result: DynamicAssetCreationResult = {
        label: null,
        taskSize: null,
        openInNewTab: false,
        propertyValues: {},
      };

      expect(result.label).toBeNull();
      expect(result.taskSize).toBeNull();
    });

    it("should allow complex propertyValues", () => {
      const result: DynamicAssetCreationResult = {
        label: "Test",
        taskSize: null,
        openInNewTab: false,
        propertyValues: {
          stringField: "text",
          numberField: 42,
          booleanField: true,
          arrayField: [1, 2, 3],
          objectField: { nested: "value" },
        },
      };

      expect(result.propertyValues.stringField).toBe("text");
      expect(result.propertyValues.numberField).toBe(42);
      expect(result.propertyValues.booleanField).toBe(true);
      expect(result.propertyValues.arrayField).toEqual([1, 2, 3]);
      expect(result.propertyValues.objectField).toEqual({ nested: "value" });
    });
  });
});
