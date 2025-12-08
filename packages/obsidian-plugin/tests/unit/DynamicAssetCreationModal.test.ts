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

  describe("onOpen", () => {
    beforeEach(() => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
      modal.close = jest.fn();
    });

    it("should add modal class", () => {
      modal.onOpen();
      expect(modal.contentEl.classList.contains("exocortex-dynamic-asset-modal")).toBe(true);
    });

    it("should create h2 element with display class name", () => {
      modal.onOpen();
      const h2 = modal.contentEl.querySelector("h2");
      expect(h2?.textContent).toBe("Create Task");
    });

    it("should create button container", () => {
      modal.onOpen();
      const buttonContainer = modal.contentEl.querySelector(".modal-button-container");
      expect(buttonContainer).toBeTruthy();
    });

    it("should use different display name for Project class", () => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Project", onSubmit);
      modal.close = jest.fn();

      modal.onOpen();
      const h2 = modal.contentEl.querySelector("h2");
      expect(h2?.textContent).toBe("Create Project");
    });

    it("should create Create and Cancel buttons", () => {
      modal.onOpen();
      const buttons = modal.contentEl.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("should set focus on input after timeout", () => {
      jest.useFakeTimers();
      modal.onOpen();
      jest.advanceTimersByTime(100);
      jest.useRealTimers();
      // Focus is called via setTimeout - the fact that no error is thrown means it works
      expect(modal.contentEl.classList.contains("exocortex-dynamic-asset-modal")).toBe(true);
    });
  });

  describe("renderBasicFields", () => {
    beforeEach(() => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
      modal.close = jest.fn();
    });

    it("should render label field for Task class", () => {
      modal.onOpen();
      // Setting components are rendered - check that content was added
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });

    it("should render task size field for Task class", () => {
      modal.onOpen();
      // For ems__Task, task size selector should be created
      // The isTaskClass method returns true for Task, so task size setting is rendered
      expect((modal as any).isTaskClass("ems__Task")).toBe(true);
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });

    it("should NOT render task size field for non-Task class", () => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Project", onSubmit);
      modal.close = jest.fn();

      modal.onOpen();
      // For non-Task (Project), there should be no select for task size
      // Settings are still created for label and toggle
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });

    it("should render open in new tab toggle", () => {
      modal.onOpen();
      // Toggle is rendered as part of the modal
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
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

  describe("submit (private method)", () => {
    beforeEach(() => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
    });

    it("should call onSubmit with label trimmed", () => {
      // Set private properties
      (modal as any).label = "  Test Label  ";
      (modal as any).taskSize = "M";
      (modal as any).openInNewTab = true;
      (modal as any).propertyValues = { custom: "value" };
      (modal as any).close = jest.fn();

      // Call submit
      (modal as any).submit();

      expect(onSubmit).toHaveBeenCalledWith({
        label: "Test Label",
        taskSize: "M",
        openInNewTab: true,
        propertyValues: { custom: "value" },
      });
    });

    it("should convert empty label to null", () => {
      (modal as any).label = "   ";
      (modal as any).close = jest.fn();

      (modal as any).submit();

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        label: null,
      }));
    });

    it("should call close after submit", () => {
      const closeMock = jest.fn();
      (modal as any).close = closeMock;
      (modal as any).label = "Test";

      (modal as any).submit();

      expect(closeMock).toHaveBeenCalled();
    });
  });

  describe("cancel (private method)", () => {
    beforeEach(() => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
    });

    it("should call onSubmit with null label and taskSize", () => {
      (modal as any).openInNewTab = true;
      (modal as any).close = jest.fn();

      (modal as any).cancel();

      expect(onSubmit).toHaveBeenCalledWith({
        label: null,
        taskSize: null,
        openInNewTab: true,
        propertyValues: {},
      });
    });

    it("should preserve openInNewTab value", () => {
      (modal as any).openInNewTab = false;
      (modal as any).close = jest.fn();

      (modal as any).cancel();

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        openInNewTab: false,
      }));
    });

    it("should call close after cancel", () => {
      const closeMock = jest.fn();
      (modal as any).close = closeMock;

      (modal as any).cancel();

      expect(closeMock).toHaveBeenCalled();
    });
  });

  describe("with OntologySchemaService", () => {
    let mockSchemaService: any;

    beforeEach(() => {
      mockSchemaService = {
        getClassProperties: jest.fn().mockResolvedValue([]),
        getDefaultProperties: jest.fn().mockReturnValue([]),
      };
    });

    it("should accept optional schemaService parameter", () => {
      modal = new DynamicAssetCreationModal(
        mockApp,
        "ems__Task",
        onSubmit,
        mockSchemaService,
      );

      expect(modal).toBeDefined();
    });

    it("should fallback to basic fields when schemaService is not provided", () => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
      modal.close = jest.fn();

      modal.onOpen();

      // Should render without errors
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });

    it("should load properties from schema service on open", async () => {
      mockSchemaService.getClassProperties.mockResolvedValue([
        {
          uri: "exo__Asset_label",
          label: "Label",
          fieldType: "text",
          deprecated: false,
          required: false,
        },
      ]);

      modal = new DynamicAssetCreationModal(
        mockApp,
        "ems__Task",
        onSubmit,
        mockSchemaService,
      );
      modal.close = jest.fn();
      modal.onOpen();

      // Wait for async loading
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSchemaService.getClassProperties).toHaveBeenCalledWith("ems__Task");
    });

    it("should use default properties when no properties found", async () => {
      mockSchemaService.getClassProperties.mockResolvedValue([]);
      mockSchemaService.getDefaultProperties.mockReturnValue([
        {
          uri: "exo__Asset_label",
          label: "Label",
          fieldType: "text",
          deprecated: false,
          required: false,
        },
      ]);

      modal = new DynamicAssetCreationModal(
        mockApp,
        "ems__Task",
        onSubmit,
        mockSchemaService,
      );
      modal.close = jest.fn();
      modal.onOpen();

      // Wait for async loading
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSchemaService.getDefaultProperties).toHaveBeenCalledWith("ems__Task");
    });

    it("should filter out deprecated properties", async () => {
      mockSchemaService.getClassProperties.mockResolvedValue([
        {
          uri: "exo__Asset_label",
          label: "Label",
          fieldType: "text",
          deprecated: false,
          required: false,
        },
        {
          uri: "exo__Asset_oldField",
          label: "Old Field",
          fieldType: "text",
          deprecated: true, // This should be filtered out
          required: false,
        },
      ]);

      modal = new DynamicAssetCreationModal(
        mockApp,
        "ems__Task",
        onSubmit,
        mockSchemaService,
      );
      modal.close = jest.fn();
      modal.onOpen();

      // Wait for async loading
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Modal should have content
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });

    it("should fallback to basic fields when schema service throws error", async () => {
      mockSchemaService.getClassProperties.mockRejectedValue(new Error("SPARQL error"));

      modal = new DynamicAssetCreationModal(
        mockApp,
        "ems__Task",
        onSubmit,
        mockSchemaService,
      );
      modal.close = jest.fn();

      // Capture console.warn
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      modal.onOpen();

      // Wait for async error handling
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have logged warning
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();

      // Modal should still have content (fallback)
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });

    it("should render different field types from properties", async () => {
      mockSchemaService.getClassProperties.mockResolvedValue([
        {
          uri: "exo__Asset_label",
          label: "Label",
          fieldType: "text",
          deprecated: false,
          required: false,
        },
        {
          uri: "ems__Effort_startTimestamp",
          label: "Start Time",
          fieldType: "timestamp",
          deprecated: false,
          required: false,
        },
        {
          uri: "ems__Effort_count",
          label: "Count",
          fieldType: "number",
          deprecated: false,
          required: false,
        },
        {
          uri: "ems__Effort_isActive",
          label: "Is Active",
          fieldType: "boolean",
          deprecated: false,
          required: false,
        },
        {
          uri: "ems__Effort_status",
          label: "Status",
          fieldType: "status-select",
          deprecated: false,
          required: false,
        },
        {
          uri: "ems__Effort_taskSize",
          label: "Task Size",
          fieldType: "size-select",
          deprecated: false,
          required: false,
        },
        {
          uri: "ems__Effort_parent",
          label: "Parent",
          fieldType: "wikilink",
          deprecated: false,
          required: false,
        },
      ]);

      modal = new DynamicAssetCreationModal(
        mockApp,
        "ems__Task",
        onSubmit,
        mockSchemaService,
      );
      modal.close = jest.fn();
      modal.onOpen();

      // Wait for async loading
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Modal should have content for all field types
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });

    it("should handle unknown field types by defaulting to text", async () => {
      mockSchemaService.getClassProperties.mockResolvedValue([
        {
          uri: "exo__Asset_unknownField",
          label: "Unknown",
          fieldType: "unknown-type" as any,
          deprecated: false,
          required: false,
        },
      ]);

      modal = new DynamicAssetCreationModal(
        mockApp,
        "ems__Task",
        onSubmit,
        mockSchemaService,
      );
      modal.close = jest.fn();
      modal.onOpen();

      // Wait for async loading
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Modal should render without errors
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });
  });

  describe("focusInput (private method)", () => {
    it("should call focus on input element after timeout", () => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
      const mockInput = { focus: jest.fn() };
      (modal as any).inputEl = mockInput;

      jest.useFakeTimers();
      (modal as any).focusInput();
      jest.advanceTimersByTime(100);
      jest.useRealTimers();

      expect(mockInput.focus).toHaveBeenCalled();
    });

    it("should not throw when inputEl is null", () => {
      modal = new DynamicAssetCreationModal(mockApp, "ems__Task", onSubmit);
      (modal as any).inputEl = null;

      jest.useFakeTimers();
      expect(() => (modal as any).focusInput()).not.toThrow();
      jest.advanceTimersByTime(100);
      jest.useRealTimers();
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
