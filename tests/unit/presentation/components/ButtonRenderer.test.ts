import { ButtonRenderer } from "../../../../src/presentation/components/ButtonRenderer";
import { RenderClassButtonsUseCase, ButtonRenderData } from "../../../../src/application/use-cases/RenderClassButtonsUseCase";
import { ExecuteButtonCommandUseCase } from "../../../../src/application/use-cases/ExecuteButtonCommandUseCase";
import { Result } from "../../../../src/domain/core/Result";
import { App, ButtonComponent, Notice, Modal } from "obsidian";

// Mock Obsidian components
jest.mock("obsidian", () => ({
  ButtonComponent: jest.fn().mockImplementation(() => ({
    setButtonText: jest.fn().mockReturnThis(),
    onClick: jest.fn().mockReturnThis(),
    setTooltip: jest.fn().mockReturnThis(),
    setDisabled: jest.fn().mockReturnThis(),
    buttonEl: {
      addClass: jest.fn(),
      setAttribute: jest.fn(),
    },
  })),
  Notice: jest.fn(),
  Modal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    close: jest.fn(),
    contentEl: document.createElement("div"),
  })),
  Setting: jest.fn().mockImplementation(() => ({
    addButton: jest.fn().mockReturnThis(),
    addText: jest.fn().mockReturnThis(),
    addToggle: jest.fn().mockReturnThis(),
    addTextArea: jest.fn().mockReturnThis(),
    setName: jest.fn().mockReturnThis(),
    setDesc: jest.fn().mockReturnThis(),
    nameEl: document.createElement("div"),
  })),
}));

describe("ButtonRenderer", () => {
  let renderer: ButtonRenderer;
  let mockApp: App;
  let mockRenderButtonsUseCase: jest.Mocked<RenderClassButtonsUseCase>;
  let mockExecuteCommandUseCase: jest.Mocked<ExecuteButtonCommandUseCase>;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockApp = {} as App;
    
    mockRenderButtonsUseCase = {
      execute: jest.fn(),
    } as any;

    mockExecuteCommandUseCase = {
      execute: jest.fn(),
    } as any;

    renderer = new ButtonRenderer(
      mockApp,
      mockRenderButtonsUseCase,
      mockExecuteCommandUseCase
    );

    mockContainer = document.createElement("div");
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  describe("Button Rendering", () => {
    const mockButtonData: ButtonRenderData = {
      buttonId: "test-button-1",
      label: "Test Button",
      tooltip: "Test tooltip",
      isEnabled: true,
      order: 1,
      command: {
        id: "test-command",
        type: "CREATE_ASSET" as any,
        name: "Test Command",
        description: "Test command description",
        icon: "plus",
        template: "test-template",
        script: "test-script",
        targetClass: "TestClass",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
    };

    it("should render buttons successfully when use case succeeds", async () => {
      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [mockButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "TestClass", "asset-123", {});

      expect(mockRenderButtonsUseCase.execute).toHaveBeenCalledWith({
        className: "TestClass",
        assetId: "asset-123",
        context: {},
      });

      expect(mockContainer.querySelector(".exocortex-button-container")).toBeTruthy();
      expect(ButtonComponent).toHaveBeenCalled();
    });

    it("should handle use case failure gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.fail("Failed to get buttons")
      );

      await renderer.render(mockContainer, "TestClass");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to render buttons: Failed to get buttons"
      );
      expect(mockContainer.children.length).toBe(0);

      consoleSpy.mockRestore();
    });

    it("should not render when showButtons is false", async () => {
      const mockResponse = {
        displayOptions: {
          showButtons: false,
          position: "top" as const,
        },
        buttons: [mockButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "TestClass");

      expect(mockContainer.children.length).toBe(0);
    });

    it("should not render when no buttons available", async () => {
      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "TestClass");

      expect(mockContainer.children.length).toBe(0);
    });

    it("should create button container with correct CSS classes", async () => {
      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "bottom" as const,
        },
        buttons: [mockButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "TestClass");

      const buttonContainer = mockContainer.querySelector(".exocortex-button-container");
      expect(buttonContainer).toBeTruthy();
      expect(buttonContainer?.classList.contains("exocortex-buttons-bottom")).toBe(true);
    });

    it("should render multiple buttons", async () => {
      const secondButtonData: ButtonRenderData = {
        ...mockButtonData,
        buttonId: "test-button-2",
        label: "Second Button",
        order: 2,
      };

      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [mockButtonData, secondButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "TestClass");

      expect(ButtonComponent).toHaveBeenCalledTimes(2);
    });
  });

  describe("Individual Button Rendering", () => {
    const mockButtonData: ButtonRenderData = {
      buttonId: "test-button-1",
      label: "Test Button",
      tooltip: "Test tooltip",
      isEnabled: true,
      order: 1,
      command: {
        id: "test-command",
        type: "CREATE_ASSET" as any,
        name: "Test Command",
        description: "Test command description",
        icon: "plus",
        template: "test-template",
        script: "test-script",
        targetClass: "TestClass",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
    };

    beforeEach(async () => {
      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [mockButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "TestClass");
    });

    it("should configure button component correctly", () => {
      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];

      expect(buttonComponentMock.setButtonText).toHaveBeenCalledWith("Test Button");
      expect(buttonComponentMock.setTooltip).toHaveBeenCalledWith("Test tooltip");
      expect(buttonComponentMock.onClick).toHaveBeenCalled();
    });

    it("should set correct CSS classes and attributes", () => {
      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];

      expect(buttonComponentMock.buttonEl.addClass).toHaveBeenCalledWith("exocortex-ui-button");
      expect(buttonComponentMock.buttonEl.setAttribute).toHaveBeenCalledWith("data-button-id", "test-button-1");
      expect(buttonComponentMock.buttonEl.setAttribute).toHaveBeenCalledWith("data-order", "1");
    });

    it("should disable button when isEnabled is false", async () => {
      const disabledButtonData = {
        ...mockButtonData,
        isEnabled: false,
      };

      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [disabledButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      // Clear container and re-render
      mockContainer.innerHTML = "";
      await renderer.render(mockContainer, "TestClass");

      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[1];
      expect(buttonComponentMock.setDisabled).toHaveBeenCalledWith(true);
    });

    it("should handle missing tooltip gracefully", async () => {
      const noTooltipButtonData = {
        ...mockButtonData,
        tooltip: undefined,
      };

      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [noTooltipButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      // Clear container and re-render
      mockContainer.innerHTML = "";
      await renderer.render(mockContainer, "TestClass");

      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[1];
      expect(buttonComponentMock.setTooltip).not.toHaveBeenCalled();
    });
  });

  describe("Button Click Handling", () => {
    const mockButtonData: ButtonRenderData = {
      buttonId: "test-button-1",
      label: "Test Button",
      tooltip: "Test tooltip",
      isEnabled: true,
      order: 1,
      command: {
        id: "test-command",
        type: "CREATE_ASSET" as any,
        name: "Test Command",
        description: "Test command description",
        icon: "plus",
        template: "test-template",
        script: "test-script",
        targetClass: "TestClass",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
    };

    beforeEach(async () => {
      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [mockButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "TestClass", "asset-123");
    });

    it("should execute command on button click", async () => {
      const mockExecuteResponse = {
        success: true,
        message: "Command executed successfully",
        requiresInput: false,
      };

      mockExecuteCommandUseCase.execute.mockResolvedValue(
        Result.ok(mockExecuteResponse)
      );

      // Get the onClick handler
      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];
      const onClickHandler = buttonComponentMock.onClick.mock.calls[0][0];

      // Execute the click handler
      await onClickHandler();

      expect(mockExecuteCommandUseCase.execute).toHaveBeenCalledWith({
        buttonId: "test-button-1",
        assetId: "asset-123",
        context: undefined,
      });

      expect(Notice).toHaveBeenCalledWith("Command executed successfully", 3000);
    });

    it("should handle command execution failure", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockExecuteCommandUseCase.execute.mockResolvedValue(
        Result.fail("Command failed")
      );

      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];
      const onClickHandler = buttonComponentMock.onClick.mock.calls[0][0];

      await onClickHandler();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Button execution failed: Command failed"
      );
      expect(Notice).toHaveBeenCalledWith("Error: Command failed", 5000);

      consoleSpy.mockRestore();
    });

    it("should open input modal when command requires input", async () => {
      const mockExecuteResponse = {
        success: false,
        requiresInput: true,
        inputSchema: {
          title: "Enter Parameters",
          description: "Please provide the required parameters",
          parameters: [
            {
              name: "name",
              label: "Name",
              type: "string",
              required: true,
            },
          ],
        },
      };

      mockExecuteCommandUseCase.execute.mockResolvedValue(
        Result.ok(mockExecuteResponse)
      );

      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];
      const onClickHandler = buttonComponentMock.onClick.mock.calls[0][0];

      await onClickHandler();

      expect(Modal).toHaveBeenCalled();
    });

    it("should handle successful command execution with default message", async () => {
      const mockExecuteResponse = {
        success: true,
        // No custom message
        requiresInput: false,
      };

      mockExecuteCommandUseCase.execute.mockResolvedValue(
        Result.ok(mockExecuteResponse)
      );

      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];
      const onClickHandler = buttonComponentMock.onClick.mock.calls[0][0];

      await onClickHandler();

      expect(Notice).toHaveBeenCalledWith("Command executed successfully", 3000);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid button data gracefully", async () => {
      const invalidButtonData = {
        buttonId: "",
        label: "",
        tooltip: null,
        isEnabled: undefined,
        order: NaN,
        command: null,
      } as any;

      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [invalidButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await expect(renderer.render(mockContainer, "TestClass")).resolves.not.toThrow();
    });

    it("should handle missing context parameter", async () => {
      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "TestClass", "asset-123");

      expect(mockRenderButtonsUseCase.execute).toHaveBeenCalledWith({
        className: "TestClass",
        assetId: "asset-123",
        context: undefined,
      });
    });

    it("should handle empty className", async () => {
      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      await renderer.render(mockContainer, "");

      expect(mockRenderButtonsUseCase.execute).toHaveBeenCalledWith({
        className: "",
        assetId: undefined,
        context: undefined,
      });
    });

    it("should handle multiple rapid clicks gracefully", async () => {
      const mockButtonData: ButtonRenderData = {
        buttonId: "test-button-1",
        label: "Test Button",
        tooltip: "Test tooltip",
        isEnabled: true,
        order: 1,
        command: {} as any,
      };

      const mockResponse = {
        displayOptions: {
          showButtons: true,
          position: "top" as const,
        },
        buttons: [mockButtonData],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(
        Result.ok(mockResponse)
      );

      // Mock a slow command execution
      mockExecuteCommandUseCase.execute.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(Result.ok({ success: true, requiresInput: false })), 100)
        )
      );

      await renderer.render(mockContainer, "TestClass");

      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];
      const onClickHandler = buttonComponentMock.onClick.mock.calls[0][0];

      // Trigger multiple rapid clicks
      const clickPromises = [
        onClickHandler(),
        onClickHandler(),
        onClickHandler(),
      ];

      await Promise.all(clickPromises);

      // Should not cause errors
      expect(mockExecuteCommandUseCase.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe("Notification Handling", () => {
    it("should show error notifications with correct duration", async () => {
      const mockResponse = {
        displayOptions: { showButtons: true, position: "top" as const },
        buttons: [{
          buttonId: "test-button-1",
          label: "Test Button",
          tooltip: "Test tooltip",
          isEnabled: true,
          order: 1,
          command: {} as any,
        }],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(Result.ok(mockResponse));
      mockExecuteCommandUseCase.execute.mockResolvedValue(Result.fail("Test error"));

      await renderer.render(mockContainer, "TestClass");

      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];
      const onClickHandler = buttonComponentMock.onClick.mock.calls[0][0];

      await onClickHandler();

      expect(Notice).toHaveBeenCalledWith("Error: Test error", 5000);
    });

    it("should show success notifications with correct duration", async () => {
      const mockResponse = {
        displayOptions: { showButtons: true, position: "top" as const },
        buttons: [{
          buttonId: "test-button-1",
          label: "Test Button",
          tooltip: "Test tooltip",
          isEnabled: true,
          order: 1,
          command: {} as any,
        }],
      };

      mockRenderButtonsUseCase.execute.mockResolvedValue(Result.ok(mockResponse));
      mockExecuteCommandUseCase.execute.mockResolvedValue(
        Result.ok({ success: true, message: "Success!", requiresInput: false })
      );

      await renderer.render(mockContainer, "TestClass");

      const buttonComponentMock = (ButtonComponent as jest.Mock).mock.instances[0];
      const onClickHandler = buttonComponentMock.onClick.mock.calls[0][0];

      await onClickHandler();

      expect(Notice).toHaveBeenCalledWith("Success!", 3000);
    });
  });
});