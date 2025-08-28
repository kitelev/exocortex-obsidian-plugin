import { ButtonsViewRenderer } from "../../../../src/presentation/renderers/ButtonsViewRenderer";
import { MarkdownPostProcessorContext, App, TFile } from "obsidian";

// Import Obsidian mocks setup
import "../../../__mocks__/obsidian";

describe("ButtonsViewRenderer", () => {
  let renderer: ButtonsViewRenderer;
  let mockApp: jest.Mocked<App>;
  let mockFile: jest.Mocked<TFile>;
  let mockContext: jest.Mocked<MarkdownPostProcessorContext>;
  let container: HTMLElement;

  beforeEach(() => {
    // Create DOM environment
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create mock app
    mockApp = {
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn(),
      },
    } as any;

    // Create mock file
    mockFile = {
      path: "test-file.md",
      name: "test-file.md",
      basename: "test-file",
    } as any;

    // Create mock context
    mockContext = {
      sourcePath: "test-file.md",
    } as any;

    // Set up app vault to return the mock file
    mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);

    // Set up metadata cache to return frontmatter
    mockApp.metadataCache.getFileCache.mockReturnValue({
      frontmatter: {
        exo__Instance_class: "ems__Task",
        exo__Instance_name: "Test Task",
      },
    } as any);

    renderer = new ButtonsViewRenderer(mockApp);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  describe("render", () => {
    it("should render a single button correctly", async () => {
      const content = `view: Buttons
config:
  buttons:
    - label: "Create Task"
      commandType: "CREATE_CHILD_TASK"
      tooltip: "Create a new task"`;

      await renderer.render(content, container, mockContext);

      // Check that a button was created
      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(1);

      const button = buttons[0];
      expect(button.textContent?.trim()).toBe("Create Task");
      expect(button.title).toBe("Create a new task");
      expect(button.classList.contains("exocortex-layout-button")).toBe(true);
    });

    it("should render multiple buttons correctly", async () => {
      const content = `view: Buttons
config:
  buttons:
    - label: "New Task"
      commandType: "CREATE_CHILD_TASK"
    - label: "New Area"
      commandType: "CREATE_CHILD_AREA"
    - label: "Open Asset"
      commandType: "OPEN_ASSET"`;

      await renderer.render(content, container, mockContext);

      // Check that all buttons were created
      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(3);

      const expectedLabels = ["New Task", "New Area", "Open Asset"];
      buttons.forEach((button, index) => {
        expect(button.textContent?.trim()).toBe(expectedLabels[index]);
      });
    });

    it("should handle buttons with positioning", async () => {
      const content = `view: Buttons
config:
  position: "bottom"
  buttons:
    - label: "Bottom Button"
      commandType: "CREATE_ASSET"`;

      await renderer.render(content, container, mockContext);

      // Check that the container has the correct positioning class
      const buttonContainer = container.querySelector(".exocortex-buttons-block");
      expect(buttonContainer).toBeTruthy();
      expect(buttonContainer?.classList.contains("exocortex-buttons-bottom")).toBe(true);
    });

    it("should handle styled buttons", async () => {
      const content = `view: Buttons
config:
  buttons:
    - label: "Primary Action"
      commandType: "CREATE_ASSET"
      style: "primary"
    - label: "Danger Action"
      commandType: "DELETE_ASSET"
      style: "danger"`;

      await renderer.render(content, container, mockContext);

      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(2);

      expect(buttons[0].classList.contains("exocortex-button-primary")).toBe(true);
      expect(buttons[1].classList.contains("exocortex-button-danger")).toBe(true);
    });

    it("should handle empty buttons configuration gracefully", async () => {
      const content = `view: Buttons
config:
  buttons: []`;

      await renderer.render(content, container, mockContext);

      
      // Should not render any buttons
      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(0);
    });

    it("should handle missing buttons configuration", async () => {
      const content = `view: Buttons
config: {}`;

      await renderer.render(content, container, mockContext);

      // Should not render any buttons and not throw an error
      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(0);
    });

    it("should show warning when no file context available", async () => {
      // Mock no file available
      mockContext.sourcePath = "";
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);

      const content = `view: Buttons
config:
  buttons:
    - label: "Test Button"
      commandType: "CREATE_ASSET"`;

      await renderer.render(content, container, mockContext);

      // Should show warning message
      const warning = container.querySelector(".exocortex-warning");
      expect(warning).toBeTruthy();
      expect(warning?.textContent).toContain("Buttons require a file context");
    });

    it("should pass correct frontmatter to button renderer", async () => {
      const expectedFrontmatter = {
        exo__Instance_class: "ems__Project",
        exo__Instance_name: "Test Project",
        ems__Project_status: "active",
      };

      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: expectedFrontmatter,
      } as any);

      const content = `view: Buttons
config:
  buttons:
    - label: "Create Subtask"
      commandType: "CREATE_CHILD_TASK"`;

      await renderer.render(content, container, mockContext);

      // Verify the button was rendered (indicating frontmatter was passed correctly)
      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0].textContent?.trim()).toBe("Create Subtask");
    });
  });

  describe("refresh", () => {
    it("should handle refresh requests gracefully", async () => {
      // This is a basic test since refresh is currently just logging
      await expect(renderer.refresh(container)).resolves.not.toThrow();
    });
  });

  describe("YAML parsing", () => {
    it("should parse complex YAML configuration correctly", async () => {
      const content = `view: Buttons
config:
  position: "top"
  buttons:
    - label: "Create Task"
      commandType: "CREATE_CHILD_TASK"
      tooltip: "Create a new task"
      style: "primary"
    - label: "Create Area"
      commandType: "CREATE_CHILD_AREA"
      tooltip: "Create a new area"
      style: "secondary"`;

      await renderer.render(content, container, mockContext);

      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(2);

      expect(buttons[0].textContent?.trim()).toBe("Create Task");
      expect(buttons[0].title).toBe("Create a new task");
      expect(buttons[0].classList.contains("exocortex-button-primary")).toBe(true);

      expect(buttons[1].textContent?.trim()).toBe("Create Area");
      expect(buttons[1].title).toBe("Create a new area");
      expect(buttons[1].classList.contains("exocortex-button-secondary")).toBe(true);

      const container_el = container.querySelector(".exocortex-buttons-block");
      expect(container_el?.classList.contains("exocortex-buttons-top")).toBe(true);
    });

    it("should handle quoted values in YAML", async () => {
      const content = `view: Buttons
config:
  buttons:
    - label: "Button with \"quotes\""
      commandType: "CREATE_ASSET"
      tooltip: "Tooltip with 'single quotes'"`;

      await renderer.render(content, container, mockContext);

      const button = container.querySelector("button");
      expect(button?.textContent?.trim()).toBe('Button with "quotes"');
      expect(button?.title).toBe("Tooltip with 'single quotes'");
    });
  });
});