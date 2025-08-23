/* eslint-env jest */
import { App, TFile } from "obsidian";

/**
 * Common test utilities to eliminate duplication in test files
 * Implements DRY principle for test setup and data creation
 */
export class TestUtils {
  /**
   * Create mock App instance for testing
   */
  static createMockApp(): jest.Mocked<App> {
    return {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        getAbstractFileByPath: jest.fn().mockReturnValue(null),
        getFiles: jest.fn().mockReturnValue([]),
        read: jest.fn().mockResolvedValue(""),
        modify: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(undefined),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue({ frontmatter: {} }),
        getBacklinksForFile: jest.fn().mockReturnValue({ data: new Map() }),
      },
    } as any;
  }

  /**
   * Create mock TFile instance for testing
   */
  static createMockFile(
    path: string,
    basename?: string,
    frontmatter?: Record<string, any>,
  ): jest.Mocked<TFile> {
    const mockFile = {
      path,
      basename: basename || path.replace(/\.md$/, ""),
      name: path.split("/").pop() || path,
    } as jest.Mocked<TFile>;

    return mockFile;
  }

  /**
   * Create mock file cache with frontmatter
   */
  static createMockFileCache(frontmatter: Record<string, any>) {
    return {
      frontmatter,
      headings: [],
      links: [],
      tags: [],
      sections: [],
    };
  }

  /**
   * Setup standard mock container for DOM tests
   */
  static createMockContainer(): HTMLElement {
    const container = document.createElement("div");

    // Mock common methods used in renderers
    container.createEl = jest
      .fn()
      .mockImplementation((tag: string, attrs?: any) => {
        const element = document.createElement(tag);
        if (attrs) {
          if (attrs.text) element.textContent = attrs.text;
          if (attrs.cls) element.className = attrs.cls;
          if (attrs.href) element.setAttribute("href", attrs.href);
        }
        container.appendChild(element);
        return element;
      });

    container.createDiv = jest.fn().mockImplementation((attrs?: any) => {
      return container.createEl("div", attrs);
    });

    container.empty = jest.fn().mockImplementation(() => {
      container.innerHTML = "";
    });

    return container;
  }

  /**
   * Create test data builders for common entities
   */
  static createAssetData(
    overrides?: Partial<Record<string, any>>,
  ): Record<string, any> {
    return {
      exo__Asset_uid: "test-uuid-123",
      exo__Asset_label: "Test Asset",
      exo__Asset_description: "Test description",
      exo__Instance_class: "[[exo__Asset]]",
      exo__Asset_isDefinedBy: "[[!exo]]",
      ...overrides,
    };
  }

  /**
   * Create ontology test data
   */
  static createOntologyData(
    overrides?: Partial<Record<string, any>>,
  ): Record<string, any> {
    return {
      exo__Ontology_prefix: "test",
      exo__Ontology_namespace: "http://example.com/test#",
      rdfs__label: "Test Ontology",
      rdfs__comment: "Test ontology description",
      ...overrides,
    };
  }

  /**
   * Create class layout test data
   */
  static createClassLayoutData(
    overrides?: Partial<Record<string, any>>,
  ): Record<string, any> {
    return {
      exo__Asset_uid: "layout-uuid-123",
      exo__Asset_label: "Test Layout",
      exo__Instance_class: "[[exo__ClassLayout]]",
      exo__ClassLayout_targetClass: "[[exo__Asset]]",
      exo__ClassLayout_blocks: [
        {
          type: "properties",
          config: { showAllProperties: true },
        },
      ],
      ...overrides,
    };
  }

  /**
   * Create backlinks test data
   */
  static createBacklinksData(filePaths: string[]): Map<string, any> {
    const backlinksMap = new Map();
    filePaths.forEach((path) => {
      backlinksMap.set(path, {});
    });
    return backlinksMap;
  }

  /**
   * Setup mock DIContainer for testing
   */
  static createMockDIContainer(): any {
    return {
      getInstance: jest.fn().mockReturnThis(),
      getCreateAssetUseCase: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue({ isSuccess: true }),
      }),
      resolve: jest.fn().mockImplementation((key: string) => {
        // Return appropriate mocks based on the key
        switch (key) {
          case "IOntologyRepository":
            return {
              findAll: jest.fn().mockResolvedValue([]),
              findByPrefix: jest.fn().mockResolvedValue(null),
            };
          case "IClassViewRepository":
            return {
              findByClass: jest.fn().mockResolvedValue(null),
            };
          default:
            return {};
        }
      }),
    };
  }

  /**
   * Setup standard beforeEach mock configuration
   */
  static setupStandardMocks(): {
    app: jest.Mocked<App>;
    container: HTMLElement;
    diContainer: any;
  } {
    const app = this.createMockApp();
    const container = this.createMockContainer();
    const diContainer = this.createMockDIContainer();

    // Setup global mocks
    jest.clearAllMocks();

    return { app, container, diContainer };
  }

  /**
   * Create test file with frontmatter
   */
  static createTestFileWithFrontmatter(
    path: string,
    frontmatter: Record<string, any>,
  ): jest.Mocked<TFile> {
    const file = this.createMockFile(path);

    // Setup the file cache mock to return the frontmatter
    const cache = this.createMockFileCache(frontmatter);

    return file;
  }

  /**
   * Assert that an element has specific class
   */
  static assertElementHasClass(element: HTMLElement, className: string): void {
    expect(element.className).toContain(className);
  }

  /**
   * Assert that a container has child elements
   */
  static assertContainerHasChildren(
    container: HTMLElement,
    count: number,
  ): void {
    expect(container.children.length).toBe(count);
  }

  /**
   * Assert that mock was called with specific parameters
   */
  static assertMockCalledWith<T extends (...args: any[]) => any>(
    mock: jest.MockedFunction<T>,
    ...expectedArgs: Parameters<T>
  ): void {
    expect(mock).toHaveBeenCalledWith(...expectedArgs);
  }

  /**
   * Create a promise that resolves after a delay (for async testing)
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate unique test ID
   */
  static generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create multiple test files for bulk testing
   */
  static createTestFiles(
    count: number,
    frontmatterGenerator?: (index: number) => Record<string, any>,
  ): jest.Mocked<TFile>[] {
    const files: jest.Mocked<TFile>[] = [];

    for (let i = 0; i < count; i++) {
      const frontmatter = frontmatterGenerator
        ? frontmatterGenerator(i)
        : this.createAssetData({
            exo__Asset_uid: `test-uuid-${i}`,
            exo__Asset_label: `Test Asset ${i}`,
          });

      const file = this.createTestFileWithFrontmatter(
        `test-file-${i}.md`,
        frontmatter,
      );
      files.push(file);
    }

    return files;
  }

  /**
   * Setup renderer test environment
   */
  static setupRendererTest(): {
    app: jest.Mocked<App>;
    container: HTMLElement;
    file: jest.Mocked<TFile>;
    dv: any;
  } {
    const { app, container } = this.setupStandardMocks();
    const file = this.createMockFile("test.md");
    const dv = {}; // Mock dataview object

    return { app, container, file, dv };
  }

  /**
   * Verify that error handling was triggered
   */
  static assertErrorHandled(
    consoleSpy: jest.SpyInstance,
    expectedMessage: string,
  ): void {
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(expectedMessage),
      expect.any(Error),
    );
  }
}
