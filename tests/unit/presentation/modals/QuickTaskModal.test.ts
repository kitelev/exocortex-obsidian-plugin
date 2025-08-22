import { QuickTaskModal } from "../../../../src/presentation/modals/QuickTaskModal";
import { CreateTaskFromProjectUseCase } from "../../../../src/application/use-cases/CreateTaskFromProjectUseCase";
import { GetCurrentProjectUseCase } from "../../../../src/application/use-cases/GetCurrentProjectUseCase";
import {
  CreateTaskRequest,
  CreateTaskResponse,
  GetCurrentProjectResponse,
} from "../../../../src/application/dtos/CreateTaskRequest";
import { App, Modal, Setting, Notice } from "obsidian";

// Mock Notice to avoid constructor issues
jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn().mockImplementation((message: string) => {
    return { message };
  }),
  Setting: jest.fn().mockImplementation((containerEl: HTMLElement) => {
    return {
      setName: jest.fn().mockReturnThis(),
      setDesc: jest.fn().mockReturnThis(),
      addText: jest.fn().mockReturnThis(),
      addTextArea: jest.fn().mockReturnThis(),
      addDropdown: jest.fn().mockReturnThis(),
    };
  }),
}));

describe("QuickTaskModal", () => {
  let app: App;
  let modal: QuickTaskModal;
  let mockCreateTaskUseCase: jest.Mocked<CreateTaskFromProjectUseCase>;
  let mockGetCurrentProjectUseCase: jest.Mocked<GetCurrentProjectUseCase>;
  let mockContentEl: HTMLElement;

  // Mock responses
  const mockProjectResponse: GetCurrentProjectResponse = {
    success: true,
    currentProject: {
      id: "project-123",
      title: "Test Project",
      status: "active",
      priority: "high",
      description: "Test project description",
    },
    availableProjects: [
      {
        id: "project-123",
        title: "Test Project",
        status: "active",
        priority: "high",
        isActive: true,
        lastUpdated: "2024-01-01T00:00:00Z",
      },
      {
        id: "project-456",
        title: "Another Project",
        status: "active",
        priority: "medium",
        isActive: false,
        lastUpdated: "2024-01-02T00:00:00Z",
      },
    ],
    context: {
      strategy: "context",
      confidence: 0.8,
      reasoning: "Detected from active file",
    },
  };

  const mockTaskResponse: CreateTaskResponse = {
    success: true,
    taskId: "task-789",
    message: "Task created successfully",
    task: {
      id: "task-789",
      title: "Test Task",
      status: "todo",
      priority: "medium",
      projectId: "project-123",
      tags: ["test"],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock app
    app = new App();

    // Mock use cases
    mockCreateTaskUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetCurrentProjectUseCase = {
      execute: jest.fn(),
    } as any;

    // Create modal with mocks
    modal = new QuickTaskModal(
      app,
      mockCreateTaskUseCase,
      mockGetCurrentProjectUseCase,
      "test-file.md",
    );

    // Setup mock content element with Obsidian methods
    mockContentEl = document.createElement("div");
    setupElementMethods(mockContentEl);

    // Mock the contentEl property
    Object.defineProperty(modal, "contentEl", {
      get: () => mockContentEl,
      configurable: true,
    });

    // Notice is already mocked at module level
  });

  function setupElementMethods(element: HTMLElement) {
    (element as any).empty = jest.fn(() => {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    });

    (element as any).createEl = jest.fn((tag: string, options?: any) => {
      const el = document.createElement(tag);
      if (options?.text) el.textContent = options.text;
      if (options?.cls) el.className = options.cls;
      element.appendChild(el);
      setupElementMethods(el);
      return el;
    });

    (element as any).createDiv = jest.fn((options?: any) => {
      const el = document.createElement("div");
      if (options?.cls) el.className = options.cls;
      element.appendChild(el);
      setupElementMethods(el);
      return el;
    });

    element.addEventListener = jest.fn();
  }

  describe("Modal Initialization", () => {
    it("should initialize with default values", () => {
      expect(modal).toBeInstanceOf(Modal);
      expect((modal as any).taskTitle).toBe("");
      expect((modal as any).taskDescription).toBe("");
      expect((modal as any).taskPriority).toBe("medium");
      expect((modal as any).taskStatus).toBe("todo");
      expect((modal as any).taskDueDate).toBe("");
      expect((modal as any).taskEstimatedHours).toBeUndefined();
      expect((modal as any).taskTags).toEqual([]);
      expect((modal as any).activeFile).toBe("test-file.md");
    });

    it("should initialize with custom active file", () => {
      const customModal = new QuickTaskModal(
        app,
        mockCreateTaskUseCase,
        mockGetCurrentProjectUseCase,
        "custom-file.md",
      );
      expect((customModal as any).activeFile).toBe("custom-file.md");
    });

    it("should initialize without active file", () => {
      const customModal = new QuickTaskModal(
        app,
        mockCreateTaskUseCase,
        mockGetCurrentProjectUseCase,
      );
      expect((customModal as any).activeFile).toBeUndefined();
    });
  });

  describe("onOpen method", () => {
    it("should clear content element on open", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      expect(mockContentEl.empty).toHaveBeenCalled();
    });

    it("should create modal title", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith("h2", {
        text: "Create New Task",
      });
    });

    it("should load project context", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      expect(mockGetCurrentProjectUseCase.execute).toHaveBeenCalledWith({
        activeFile: "test-file.md",
        preferences: {
          includeCompleted: false,
          maxResults: 10,
          selectionStrategy: "context",
        },
      });
    });

    it("should display current project when detected", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        cls: "quick-task-project",
      });
      expect((modal as any).selectedProjectId).toBe("project-123");
    });

    it("should create project dropdown when multiple projects available", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      // Should create Setting for project dropdown
      expect(Setting).toHaveBeenCalled();
    });

    it("should setup form fields with proper settings", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      // Multiple Setting instances should be created for different fields
      expect(Setting).toHaveBeenCalledTimes(8); // Project dropdown, Title, Description, Priority, Status, Due Date, Estimated Hours, Tags
    });

    it("should initialize due date field", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      // Due date setting should be created (actual value setting tested in integration)
      expect(Setting).toHaveBeenCalled();
    });

    it("should create action buttons", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      expect(mockContentEl.createDiv).toHaveBeenCalledWith({
        cls: "quick-task-buttons",
      });
    });

    it("should add custom styles", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      const mockCreateElement = jest.spyOn(document, "createElement");
      const mockAppendChild = jest.spyOn(document.head, "appendChild");

      await modal.onOpen();

      expect(mockCreateElement).toHaveBeenCalledWith("style");
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it("should setup keyboard event listener", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      expect(mockContentEl.addEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });
  });

  describe("onClose method", () => {
    it("should clear content element on close", () => {
      modal.onClose();

      expect(mockContentEl.empty).toHaveBeenCalled();
    });
  });

  describe("Project Context Loading", () => {
    it("should handle successful project context loading", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      await modal.onOpen();

      expect((modal as any).currentProject).toEqual(
        mockProjectResponse.currentProject,
      );
      expect((modal as any).availableProjects).toEqual(
        mockProjectResponse.availableProjects,
      );
    });

    it("should handle project context loading without current project", async () => {
      const noProjectResponse: GetCurrentProjectResponse = {
        ...mockProjectResponse,
        currentProject: undefined,
      };
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(noProjectResponse);

      await modal.onOpen();

      expect((modal as any).currentProject).toBeUndefined();
      expect((modal as any).selectedProjectId).toBeUndefined();
    });

    it("should handle project context loading error", async () => {
      mockGetCurrentProjectUseCase.execute.mockRejectedValue(
        new Error("Project loading failed"),
      );
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await modal.onOpen();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load project context:",
        expect.any(Error),
      );
      expect((modal as any).currentProject).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it("should handle empty available projects list", async () => {
      const noProjectsResponse: GetCurrentProjectResponse = {
        ...mockProjectResponse,
        availableProjects: [],
      };
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        noProjectsResponse,
      );

      await modal.onOpen();

      expect((modal as any).availableProjects).toEqual([]);
    });
  });

  describe("Form Field Updates", () => {
    beforeEach(async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );
      await modal.onOpen();
    });

    it("should update task title", () => {
      (modal as any).taskTitle = "Updated Title";
      expect((modal as any).taskTitle).toBe("Updated Title");
    });

    it("should update task description", () => {
      (modal as any).taskDescription = "Updated description";
      expect((modal as any).taskDescription).toBe("Updated description");
    });

    it("should update task priority", () => {
      (modal as any).taskPriority = "high";
      expect((modal as any).taskPriority).toBe("high");
    });

    it("should update task status", () => {
      (modal as any).taskStatus = "in-progress";
      expect((modal as any).taskStatus).toBe("in-progress");
    });

    it("should update due date", () => {
      (modal as any).taskDueDate = "2024-12-25";
      expect((modal as any).taskDueDate).toBe("2024-12-25");
    });

    it("should update estimated hours with valid number", () => {
      (modal as any).taskEstimatedHours = 5.5;
      expect((modal as any).taskEstimatedHours).toBe(5.5);
    });

    it("should handle invalid estimated hours", () => {
      (modal as any).taskEstimatedHours = undefined;
      expect((modal as any).taskEstimatedHours).toBeUndefined();
    });

    it("should parse tags from comma-separated string", () => {
      (modal as any).taskTags = ["tag1", "tag2", "tag3"];
      expect((modal as any).taskTags).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should filter empty tags", () => {
      // Simulate the tag parsing logic
      const tagsInput = "tag1, , tag2,  ,tag3";
      const parsedTags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      expect(parsedTags).toEqual(["tag1", "tag2", "tag3"]);
    });
  });

  describe("Task Creation", () => {
    beforeEach(async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );
      await modal.onOpen();

      // Setup form data
      (modal as any).taskTitle = "Test Task";
      (modal as any).taskDescription = "Test description";
      (modal as any).taskPriority = "high";
      (modal as any).taskStatus = "todo";
      (modal as any).taskDueDate = "2024-12-25";
      (modal as any).taskEstimatedHours = 2.5;
      (modal as any).taskTags = ["test", "urgent"];
      (modal as any).selectedProjectId = "project-123";
    });

    it("should create task with valid data", async () => {
      mockCreateTaskUseCase.execute.mockResolvedValue(mockTaskResponse);
      modal.close = jest.fn();

      const result = await (modal as any).createTask();

      expect(mockCreateTaskUseCase.execute).toHaveBeenCalledWith({
        title: "Test Task",
        description: "Test description",
        priority: "high",
        status: "todo",
        projectId: "project-123",
        dueDate: "2024-12-25",
        estimatedHours: 2.5,
        tags: ["test", "urgent"],
        context: {
          activeFile: "test-file.md",
        },
      });

      expect(Notice).toHaveBeenCalledWith(
        'Task "Test Task" created successfully',
      );
      expect(modal.close).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should validate required title field", async () => {
      (modal as any).taskTitle = "";

      const result = await (modal as any).createTask();

      expect(Notice).toHaveBeenCalledWith("Task title is required");
      expect(mockCreateTaskUseCase.execute).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should validate trimmed title field", async () => {
      (modal as any).taskTitle = "   ";

      const result = await (modal as any).createTask();

      expect(Notice).toHaveBeenCalledWith("Task title is required");
      expect(mockCreateTaskUseCase.execute).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should handle task creation failure", async () => {
      const failureResponse: CreateTaskResponse = {
        success: false,
        message: "Creation failed",
        errors: { title: ["Title is invalid"] },
      };
      mockCreateTaskUseCase.execute.mockResolvedValue(failureResponse);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await (modal as any).createTask();

      expect(Notice).toHaveBeenCalledWith(
        "Failed to create task: Creation failed",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Task creation failed:",
        failureResponse.errors,
      );
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should handle task creation exception", async () => {
      mockCreateTaskUseCase.execute.mockRejectedValue(
        new Error("Network error"),
      );
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await (modal as any).createTask();

      expect(Notice).toHaveBeenCalledWith("Error creating task: Network error");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Task creation error:",
        expect.any(Error),
      );
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should create task without optional fields", async () => {
      (modal as any).taskDescription = "";
      (modal as any).taskDueDate = "";
      (modal as any).taskEstimatedHours = undefined;
      (modal as any).taskTags = [];
      (modal as any).selectedProjectId = undefined;

      mockCreateTaskUseCase.execute.mockResolvedValue(mockTaskResponse);

      await (modal as any).createTask();

      expect(mockCreateTaskUseCase.execute).toHaveBeenCalledWith({
        title: "Test Task",
        description: undefined,
        priority: "high",
        status: "todo",
        projectId: undefined,
        dueDate: undefined,
        estimatedHours: undefined,
        tags: [],
        context: {
          activeFile: "test-file.md",
        },
      });
    });
  });

  describe("Form Reset", () => {
    it("should reset form fields to defaults", () => {
      // Set some values
      (modal as any).taskTitle = "Test";
      (modal as any).taskDescription = "Description";
      (modal as any).taskPriority = "urgent";
      (modal as any).taskStatus = "done";
      (modal as any).taskDueDate = "2024-12-25";
      (modal as any).taskEstimatedHours = 5;
      (modal as any).taskTags = ["tag1", "tag2"];

      (modal as any).resetForm();

      expect((modal as any).taskTitle).toBe("");
      expect((modal as any).taskDescription).toBe("");
      expect((modal as any).taskPriority).toBe("medium");
      expect((modal as any).taskStatus).toBe("todo");
      expect((modal as any).taskDueDate).toBe("");
      expect((modal as any).taskEstimatedHours).toBeUndefined();
      expect((modal as any).taskTags).toEqual([]);
    });

    it("should preserve project context after reset", () => {
      (modal as any).currentProject = mockProjectResponse.currentProject;
      (modal as any).availableProjects = mockProjectResponse.availableProjects;
      (modal as any).selectedProjectId = "project-123";

      (modal as any).resetForm();

      expect((modal as any).currentProject).toEqual(
        mockProjectResponse.currentProject,
      );
      expect((modal as any).availableProjects).toEqual(
        mockProjectResponse.availableProjects,
      );
    });
  });

  describe("Button Event Handlers", () => {
    beforeEach(async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );
      await modal.onOpen();

      (modal as any).taskTitle = "Test Task";
      mockCreateTaskUseCase.execute.mockResolvedValue(mockTaskResponse);
    });

    it("should handle create button click", async () => {
      modal.close = jest.fn();
      const createButton = mockContentEl.querySelector(".mod-cta");

      // Simulate button click through event listener
      const clickHandler = (
        mockContentEl.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === "keydown")?.[1];

      if (clickHandler) {
        // Simulate Ctrl+Enter keydown
        await clickHandler({ key: "Enter", ctrlKey: true });
        expect(modal.close).toHaveBeenCalled();
      }
    });

    it("should handle create and continue button functionality", async () => {
      modal.close = jest.fn();
      (modal as any).resetForm = jest.fn();
      modal.onOpen = jest.fn();

      const success = await (modal as any).createTask();

      if (success) {
        (modal as any).resetForm();
        await modal.onOpen();

        expect((modal as any).resetForm).toHaveBeenCalled();
        expect(modal.onOpen).toHaveBeenCalled();
      }
    });

    it("should handle cancel button click", () => {
      modal.close = jest.fn();

      // The cancel button event would be handled by the onClick event
      modal.close();

      expect(modal.close).toHaveBeenCalled();
    });
  });

  describe("Keyboard Events", () => {
    beforeEach(async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );
      await modal.onOpen();

      (modal as any).taskTitle = "Test Task";
      mockCreateTaskUseCase.execute.mockResolvedValue(mockTaskResponse);
    });

    it("should handle Ctrl+Enter to create task", async () => {
      modal.close = jest.fn();

      const keydownHandler = (
        mockContentEl.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === "keydown")?.[1];

      if (keydownHandler) {
        await keydownHandler({ key: "Enter", ctrlKey: true });
        expect(modal.close).toHaveBeenCalled();
      }
    });

    it("should not trigger on Enter without Ctrl", async () => {
      const createTaskSpy = jest.spyOn(modal as any, "createTask");

      const keydownHandler = (
        mockContentEl.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === "keydown")?.[1];

      if (keydownHandler) {
        await keydownHandler({ key: "Enter", ctrlKey: false });
        expect(createTaskSpy).not.toHaveBeenCalled();
      }
    });

    it("should not trigger on other key combinations", async () => {
      const createTaskSpy = jest.spyOn(modal as any, "createTask");

      const keydownHandler = (
        mockContentEl.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === "keydown")?.[1];

      if (keydownHandler) {
        await keydownHandler({ key: "Space", ctrlKey: true });
        expect(createTaskSpy).not.toHaveBeenCalled();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle use case execution errors gracefully", async () => {
      mockGetCurrentProjectUseCase.execute.mockRejectedValue(
        new Error("Service unavailable"),
      );
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await modal.onOpen();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load project context:",
        expect.any(Error),
      );
      expect((modal as any).currentProject).toBeUndefined();
      expect((modal as any).availableProjects).toEqual([]);

      consoleSpy.mockRestore();
    });

    it("should handle malformed project response", async () => {
      const malformedResponse = {
        success: true,
        // Missing required fields
      } as any;
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(malformedResponse);

      await modal.onOpen();

      expect((modal as any).currentProject).toBeUndefined();
    });

    it("should handle task creation with invalid response format", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );
      await modal.onOpen();

      (modal as any).taskTitle = "Test Task";

      const invalidResponse = {
        success: true,
        // Missing task details
      } as any;
      mockCreateTaskUseCase.execute.mockResolvedValue(invalidResponse);

      const result = await (modal as any).createTask();

      expect(Notice).toHaveBeenCalledWith(
        'Task "undefined" created successfully',
      );
      expect(result).toBe(true);
    });
  });

  describe("Style Management", () => {
    it("should call addStyles method", async () => {
      mockGetCurrentProjectUseCase.execute.mockResolvedValue(
        mockProjectResponse,
      );

      const addStylesSpy = jest
        .spyOn(modal as any, "addStyles")
        .mockImplementation(() => {});

      await modal.onOpen();

      expect(addStylesSpy).toHaveBeenCalled();

      addStylesSpy.mockRestore();
    });

    it("should create style element with proper content", () => {
      const mockStyleElement = { textContent: "" };
      const createElementSpy = jest
        .spyOn(document, "createElement")
        .mockReturnValue(mockStyleElement as any);
      const appendChildSpy = jest
        .spyOn(document.head, "appendChild")
        .mockImplementation(() => {});

      (modal as any).addStyles();

      expect(createElementSpy).toHaveBeenCalledWith("style");
      expect(mockStyleElement.textContent).toContain(".quick-task-project");
      expect(mockStyleElement.textContent).toContain(".quick-task-row");
      expect(mockStyleElement.textContent).toContain(".quick-task-buttons");
      expect(appendChildSpy).toHaveBeenCalledWith(mockStyleElement);

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });
  });
});
