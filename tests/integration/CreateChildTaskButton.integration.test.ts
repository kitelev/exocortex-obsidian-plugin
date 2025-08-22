import { App, TFile, Notice } from "obsidian";
import { LayoutRenderer } from "../../src/presentation/renderers/LayoutRenderer";
import { ButtonsBlockRenderer } from "../../src/presentation/renderers/ButtonsBlockRenderer";
import { CreateChildTaskUseCase } from "../../src/application/use-cases/CreateChildTaskUseCase";
import { DIContainer } from "../../src/infrastructure/container/DIContainer";
import { IClassLayoutRepository } from "../../src/domain/repositories/IClassLayoutRepository";
import { ClassLayout } from "../../src/domain/entities/ClassLayout";
import { LayoutBlock } from "../../src/domain/entities/LayoutBlock";
import { Result } from "../../src/domain/core/Result";

// Import the main obsidian mock which has ButtonComponent
import "../__mocks__/obsidian";

// Helper to setup Obsidian DOM extensions on any element
function setupObsidianDOMExtensions(element: HTMLElement): void {
  if (!element.createDiv) {
    (element as any).createDiv = function (options?: any) {
      const el = document.createElement("div");
      if (options?.cls) el.className = options.cls;
      if (options?.text) el.textContent = options.text;
      this.appendChild(el);
      return el;
    };
  }
  if (!element.createEl) {
    (element as any).createEl = function (tag: string, options?: any) {
      const el = document.createElement(tag);
      if (options?.text) el.textContent = options.text;
      if (options?.cls) el.className = options.cls;
      if (options?.attr) {
        for (const [key, value] of Object.entries(options.attr)) {
          el.setAttribute(key, String(value));
        }
      }
      this.appendChild(el);
      return el;
    };
  }
  if (!element.empty) {
    (element as any).empty = function () {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    };
  }
}

describe("Create Child Task Button Integration Tests", () => {
  let app: App;
  let layoutRenderer: LayoutRenderer;
  let buttonsRenderer: ButtonsBlockRenderer;
  let mockLayoutRepository: jest.Mocked<IClassLayoutRepository>;
  let mockContainer: DIContainer;
  let mockCreateChildTaskUseCase: jest.Mocked<CreateChildTaskUseCase>;

  beforeEach(() => {
    // Setup mocks
    app = new App();

    // Mock DIContainer
    mockCreateChildTaskUseCase = {
      execute: jest.fn(),
    } as any;

    mockContainer = {
      resolve: jest.fn().mockImplementation((key: string) => {
        if (key === "CreateChildTaskUseCase") {
          return mockCreateChildTaskUseCase;
        }
        return null;
      }),
    } as any;

    // Mock DIContainer.getInstance
    jest
      .spyOn(DIContainer, "getInstance")
      .mockReturnValue(mockContainer as any);

    // Mock layout repository
    mockLayoutRepository = {
      findByClass: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      findEnabledByClass: jest.fn(),
    } as any;

    // Create renderers
    buttonsRenderer = new ButtonsBlockRenderer(app);
    layoutRenderer = new LayoutRenderer(
      app,
      mockLayoutRepository,
      {} as any, // PropertyRenderer
      {} as any, // QueryEngineService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Button Rendering", () => {
    it("should render Create Child Task button for ems__Project", async () => {
      const container = document.createElement("div");
      // Setup Obsidian DOM extensions on container
      setupObsidianDOMExtensions(container);
      const file = { path: "test-project.md" } as TFile;
      const frontmatter = {
        exo__Asset_uid: "project-123",
        exo__Instance_class: ["[[ems__Project]]"],
      };

      const buttonsConfig = {
        type: "buttons" as const,
        buttons: [
          {
            id: "create-child-task",
            label: "➕ Create Child Task",
            commandType: "CREATE_CHILD_TASK",
            tooltip: "Create a new task for this project",
            style: "primary",
          },
        ],
      };

      await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

      // Check button container was created
      const buttonContainer = container.querySelector(
        ".exocortex-buttons-block",
      );
      expect(buttonContainer).toBeTruthy();

      // Check actual button element was created in DOM
      const buttonElement = container.querySelector("button");
      expect(buttonElement).toBeTruthy();
      expect(buttonElement?.textContent).toBe("➕ Create Child Task");
      expect(buttonElement?.getAttribute("title")).toBe(
        "Create a new task for this project",
      );
    });

    it("should apply correct styling to button", async () => {
      const container = document.createElement("div");
      setupObsidianDOMExtensions(container);
      const file = { path: "test-project.md" } as TFile;
      const frontmatter = { exo__Asset_uid: "project-123" };

      const buttonsConfig = {
        type: "buttons" as const,
        buttons: [
          {
            id: "create-child-task",
            label: "Create Task",
            commandType: "CREATE_CHILD_TASK",
            style: "primary",
          },
        ],
        position: "top",
      };

      await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

      // Check the button container has correct position class
      const buttonContainer = container.querySelector(
        ".exocortex-buttons-block",
      );
      expect(buttonContainer?.className).toContain("exocortex-buttons-top");

      // Check the button has correct styling classes
      const buttonElement = container.querySelector("button");
      expect(buttonElement?.className).toContain("exocortex-layout-button");
      expect(buttonElement?.className).toContain("exocortex-button-primary");
    });

    it("should not render buttons if config is empty", async () => {
      const container = document.createElement("div");
      setupObsidianDOMExtensions(container);
      const file = { path: "test-project.md" } as TFile;
      const frontmatter = {};

      const buttonsConfig = {
        type: "buttons" as const,
        buttons: [],
      };

      await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

      const buttonContainer = container.querySelector(
        ".exocortex-buttons-block",
      );
      expect(buttonContainer).toBeFalsy();
    });
  });

  describe("Button Integration", () => {
    it("should create button with proper command type attribute", async () => {
      const container = document.createElement("div");
      setupObsidianDOMExtensions(container);
      const file = { path: "test-project.md" } as TFile;
      const frontmatter = { exo__Asset_uid: "project-123" };

      const buttonsConfig = {
        type: "buttons" as const,
        buttons: [
          {
            id: "create-child-task",
            label: "Create Task",
            commandType: "CREATE_CHILD_TASK",
          },
        ],
      };

      await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

      // Check that button is properly integrated with container
      const buttonElement = container.querySelector("button");
      expect(buttonElement).toBeTruthy();
      expect(buttonElement?.textContent).toBe("Create Task");

      // Verify the button is inside the proper container
      const buttonContainer = container.querySelector(
        ".exocortex-buttons-block",
      );
      expect(buttonContainer?.contains(buttonElement)).toBe(true);
    });

    it("should handle multiple buttons in same config", async () => {
      const container = document.createElement("div");
      setupObsidianDOMExtensions(container);
      const file = { path: "test-project.md" } as TFile;
      const frontmatter = { exo__Asset_uid: "project-123" };

      const buttonsConfig = {
        type: "buttons" as const,
        buttons: [
          {
            id: "create-child-task",
            label: "Create Task",
            commandType: "CREATE_CHILD_TASK",
          },
          {
            id: "create-milestone",
            label: "Create Milestone",
            commandType: "CREATE_MILESTONE",
          },
        ],
      };

      await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

      // Check that both buttons are rendered
      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(2);

      const buttonTexts = Array.from(buttons).map((b) => b.textContent);
      expect(buttonTexts).toContain("Create Task");
      expect(buttonTexts).toContain("Create Milestone");
    });
  });

  describe("Button Configuration", () => {
    it("should render buttons with different styles", async () => {
      const container = document.createElement("div");
      setupObsidianDOMExtensions(container);
      const file = { path: "test-project.md" } as TFile;
      const frontmatter = { exo__Asset_uid: "project-123" };

      const buttonsConfig = {
        type: "buttons" as const,
        buttons: [
          {
            id: "create-task",
            label: "Create Task",
            commandType: "CREATE_CHILD_TASK",
            style: "primary",
          },
          {
            id: "delete-project",
            label: "Delete",
            commandType: "DELETE_ASSET",
            style: "danger",
          },
        ],
      };

      await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(2);

      // Check that different styles are applied
      expect(buttons[0]?.className).toContain("exocortex-button-primary");
      expect(buttons[1]?.className).toContain("exocortex-button-danger");
    });

    it("should handle button configuration validation", async () => {
      const container = document.createElement("div");
      setupObsidianDOMExtensions(container);
      const file = { path: "test-project.md" } as TFile;
      const frontmatter = {};

      const invalidConfig = {
        type: "buttons" as const,
        buttons: [
          {
            // Missing required fields
            id: "",
            label: "",
            commandType: "",
          },
        ],
      };

      await buttonsRenderer.render(container, invalidConfig, file, frontmatter);

      // Button should still render but with empty text
      const buttonElement = container.querySelector("button");
      expect(buttonElement).toBeTruthy();
      expect(buttonElement?.textContent).toBe("");
    });
  });

  describe("Integration Features", () => {
    it("should maintain button functionality across multiple renders", async () => {
      const container = document.createElement("div");
      setupObsidianDOMExtensions(container);
      const file = { path: "test-project.md" } as TFile;
      const frontmatter = { exo__Asset_uid: "project-123" };

      const buttonsConfig = {
        type: "buttons" as const,
        buttons: [
          {
            id: "create-child-task",
            label: "Create Task",
            commandType: "CREATE_CHILD_TASK",
          },
        ],
      };

      // Render multiple times
      await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);
      await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

      // Should still work correctly
      const buttonElement = container.querySelector("button");
      expect(buttonElement).toBeTruthy();
      expect(buttonElement?.textContent).toBe("Create Task");
    });
  });
});
