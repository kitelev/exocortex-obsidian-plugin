import { CodeBlockProcessor, IViewRenderer } from "../../../../src/presentation/processors/CodeBlockProcessor";
import { ServiceProvider } from "../../../../src/infrastructure/providers/ServiceProvider";
import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { LoggerFactory } from "../../../../src/infrastructure/logging/LoggerFactory";

// Mock LoggerFactory
jest.mock("../../../../src/infrastructure/logging/LoggerFactory");

// Mock MarkdownRenderChild
jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    MarkdownRenderChild: class MockMarkdownRenderChild {
      containerEl: HTMLElement;
      constructor(containerEl: HTMLElement) {
        this.containerEl = containerEl;
      }
      onunload() {}
    }
  };
});

describe("CodeBlockProcessor", () => {
  let processor: CodeBlockProcessor;
  let mockServiceProvider: ServiceProvider;
  let mockContext: MarkdownPostProcessorContext;
  let mockElement: HTMLElement;
  let mockRenderer: IViewRenderer;

  beforeEach(() => {
    // Mock logger
    (LoggerFactory.createForClass as jest.Mock).mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    });

    // Mock service provider
    mockServiceProvider = {} as ServiceProvider;

    // Create processor
    processor = new CodeBlockProcessor(mockServiceProvider);

    // Mock DOM element
    mockElement = document.createElement("div");
    mockElement.empty = jest.fn();
    mockElement.createDiv = jest.fn((options) => {
      const div = document.createElement("div");
      if (options?.cls) {
        div.className = options.cls;
      }
      mockElement.appendChild(div);
      return div;
    }) as any;

    // Mock context
    mockContext = {
      sourcePath: "test.md",
      addChild: jest.fn()
    } as any;

    // Mock renderer
    mockRenderer = {
      render: jest.fn().mockResolvedValue(undefined),
      refresh: jest.fn().mockResolvedValue(undefined)
    };
  });

  describe("registerView", () => {
    it("should register a view renderer", () => {
      processor.registerView("TestView", mockRenderer);
      expect(LoggerFactory.createForClass).toHaveBeenCalledWith(CodeBlockProcessor);
    });
  });

  describe("processCodeBlock", () => {
    it("should process a simple UniversalLayout view", async () => {
      processor.registerView("UniversalLayout", mockRenderer);
      
      const source = "UniversalLayout";
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockElement.empty).toHaveBeenCalled();
      expect(mockElement.createDiv).toHaveBeenCalledWith({ cls: "exocortex-view-container" });
      expect(mockRenderer.render).toHaveBeenCalledWith(source, expect.any(HTMLElement), mockContext);
      expect(mockContext.addChild).toHaveBeenCalled();
    });

    it("should process a view with configuration", async () => {
      processor.registerView("AssetList", mockRenderer);
      
      const source = `AssetList
class: ems__Project
folder: Projects
limit: 10
showCreateButton: true`;
      
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockRenderer.render).toHaveBeenCalledWith(source, expect.any(HTMLElement), mockContext);
    });

    it("should handle unknown view types", async () => {
      const source = "UnknownView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockElement.empty).toHaveBeenCalled();
      expect(mockElement.createDiv).toHaveBeenCalledWith({ cls: "exocortex-error" });
    });

    it("should handle renderer errors gracefully", async () => {
      const error = new Error("Render failed");
      mockRenderer.render = jest.fn().mockRejectedValue(error);
      processor.registerView("TestView", mockRenderer);
      
      const source = "TestView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockElement.empty).toHaveBeenCalled();
      expect(mockElement.createDiv).toHaveBeenCalledWith({ cls: "exocortex-error" });
    });

    it("should parse configuration with various data types", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const source = `TestView
string: value
number: 42
boolean: true
array: ["item1", "item2"]`;
      
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockRenderer.render).toHaveBeenCalled();
    });

    it("should ignore comment lines in configuration", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const source = `TestView
# This is a comment
property: value
# Another comment
limit: 5`;
      
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockRenderer.render).toHaveBeenCalled();
    });

    it("should set data-view-type attribute on container", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const source = "TestView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      const container = mockElement.querySelector(".exocortex-view-container");
      expect(container).toBeTruthy();
    });
  });

  describe("refreshViews", () => {
    it("should refresh all active views with refresh method", async () => {
      const refreshableRenderer: IViewRenderer = {
        render: jest.fn().mockResolvedValue(undefined),
        refresh: jest.fn().mockResolvedValue(undefined)
      };

      processor.registerView("RefreshableView", refreshableRenderer);
      
      const source = "RefreshableView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      await processor.refreshViews();

      expect(refreshableRenderer.refresh).toHaveBeenCalled();
    });

    it("should skip views without refresh method", async () => {
      const nonRefreshableRenderer: IViewRenderer = {
        render: jest.fn().mockResolvedValue(undefined)
      };

      processor.registerView("NonRefreshableView", nonRefreshableRenderer);
      
      const source = "NonRefreshableView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      // Should not throw
      await processor.refreshViews();
    });

    it("should handle multiple active views", async () => {
      const renderer1: IViewRenderer = {
        render: jest.fn().mockResolvedValue(undefined),
        refresh: jest.fn().mockResolvedValue(undefined)
      };
      
      const renderer2: IViewRenderer = {
        render: jest.fn().mockResolvedValue(undefined),
        refresh: jest.fn().mockResolvedValue(undefined)
      };

      processor.registerView("View1", renderer1);
      processor.registerView("View2", renderer2);
      
      const element1 = document.createElement("div");
      element1.empty = jest.fn();
      element1.createDiv = mockElement.createDiv;
      
      const element2 = document.createElement("div");
      element2.empty = jest.fn();
      element2.createDiv = mockElement.createDiv;
      
      await processor.processCodeBlock("View1", element1, mockContext);
      await processor.processCodeBlock("View2", element2, mockContext);

      await processor.refreshViews();

      expect(renderer1.refresh).toHaveBeenCalled();
      expect(renderer2.refresh).toHaveBeenCalled();
    });
  });

  describe("configuration parsing", () => {
    it("should default to UniversalLayout if no type specified", async () => {
      processor.registerView("UniversalLayout", mockRenderer);
      
      const source = "";
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockRenderer.render).toHaveBeenCalled();
    });

    it("should handle JSON values in configuration", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const source = `TestView
object: {"key": "value"}
array: [1, 2, 3]`;
      
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockRenderer.render).toHaveBeenCalled();
    });

    it("should handle malformed JSON as strings", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const source = `TestView
malformed: {not valid json}`;
      
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockRenderer.render).toHaveBeenCalled();
    });

    it("should trim whitespace from configuration lines", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const source = `  TestView  
  property: value  
    limit: 10    `;
      
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockRenderer.render).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should register cleanup handler with context", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const source = "TestView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(mockContext.addChild).toHaveBeenCalledWith(expect.any(Object));
      
      // Verify the cleanup handler is a MarkdownRenderChild
      const cleanupHandler = (mockContext.addChild as jest.Mock).mock.calls[0][0];
      expect(cleanupHandler).toBeDefined();
      expect(cleanupHandler.onunload).toBeDefined();
    });

    it("should remove element from active elements on cleanup", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const source = "TestView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      // Get the cleanup handler
      const cleanupHandler = (mockContext.addChild as jest.Mock).mock.calls[0][0];
      
      // Initially the view should be refreshable
      await processor.refreshViews();
      expect(mockRenderer.refresh).toHaveBeenCalledTimes(1);

      // Trigger cleanup
      cleanupHandler.onunload();

      // After cleanup, refresh should not call the renderer
      mockRenderer.refresh = jest.fn();
      await processor.refreshViews();
      expect(mockRenderer.refresh).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should display error message for missing renderer", async () => {
      const source = "NonExistentView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      const errorDiv = mockElement.querySelector(".exocortex-error");
      expect(errorDiv).toBeTruthy();
    });

    it("should log errors during processing", async () => {
      const error = new Error("Processing failed");
      mockRenderer.render = jest.fn().mockRejectedValue(error);
      processor.registerView("TestView", mockRenderer);
      
      const logger = (LoggerFactory.createForClass as jest.Mock).mock.results[0].value;
      
      const source = "TestView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to process code block",
        expect.objectContaining({ error })
      );
    });

    it("should log successful renders", async () => {
      processor.registerView("TestView", mockRenderer);
      
      const logger = (LoggerFactory.createForClass as jest.Mock).mock.results[0].value;
      
      const source = "TestView";
      await processor.processCodeBlock(source, mockElement, mockContext);

      expect(logger.info).toHaveBeenCalledWith(
        "Rendered view TestView",
        expect.objectContaining({
          duration: expect.any(Number),
          sourcePath: "test.md"
        })
      );
    });
  });
});