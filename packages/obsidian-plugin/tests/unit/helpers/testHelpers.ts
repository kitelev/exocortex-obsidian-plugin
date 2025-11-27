import { TFile } from "obsidian";

export * from "./TestFixtureBuilder";

export function createMockTFile(
  path: string,
  metadata: Record<string, any> = {},
  content = ""
): TFile {
  const basename = path.split("/").pop()?.replace(/\.md$/, "") || "";
  return {
    path,
    name: basename + ".md",
    basename,
    extension: "md",
    parent: null,
    vault: null,
    stat: {
      ctime: Date.now(),
      mtime: Date.now(),
      size: content.length,
    },
  } as TFile;
}

export function createMockElement(): any {
  const el: any = document.createElement("div");

  // Make createDiv a jest mock that also creates real DOM elements
  el.createDiv = jest.fn((opts?: any) => {
    const div: any = document.createElement("div");
    if (opts?.cls) div.className = opts.cls;
    if (opts?.text) div.textContent = opts.text;
    el.appendChild(div);

    // Add nested createDiv and createEl methods (also as mocks)
    div.createDiv = jest.fn(el.createDiv);
    div.createEl = jest.fn((tag: string, options?: any) => {
      const element = document.createElement(tag);
      if (options?.cls) element.className = options.cls;
      if (options?.text) element.textContent = options.text;
      if (options?.attr) {
        Object.entries(options.attr).forEach(([key, value]) => {
          element.setAttribute(key, String(value));
        });
      }
      div.appendChild(element);
      return element;
    });

    return div;
  });

  el.createEl = jest.fn((tag: string, options?: any) => {
    const element = document.createElement(tag);
    if (options?.cls) element.className = options.cls;
    if (options?.text) element.textContent = options.text;
    if (options?.attr) {
      Object.entries(options.attr).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
      });
    }
    el.appendChild(element);
    return element;
  });

  el.empty = jest.fn(() => {
    el.innerHTML = "";
  });

  return el;
}

export function createMockApp(overrides?: any): any {
  return {
    vault: {
      getMarkdownFiles: jest.fn().mockReturnValue([]),
      getAbstractFileByPath: jest.fn(),
      read: jest.fn(),
      modify: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      rename: jest.fn(),
      getFiles: jest.fn().mockReturnValue([]),
      getName: jest.fn().mockReturnValue("Test Vault"),
    },
    metadataCache: {
      getFileCache: jest.fn().mockReturnValue({ frontmatter: {} }),
      getFirstLinkpathDest: jest.fn(),
      getBacklinksForFile: jest.fn().mockReturnValue({
        data: new Map(),
      }),
      on: jest.fn(),
      off: jest.fn(),
      resolvedLinks: {},
      unresolvedLinks: {},
    },
    workspace: {
      getLeaf: jest.fn().mockReturnValue({
        openLinkText: jest.fn(),
        openFile: jest.fn(),
      }),
      openLinkText: jest.fn(),
      setActiveLeaf: jest.fn(),
      getActiveFile: jest.fn(),
    },
    fileManager: {
      processFrontMatter: jest.fn(),
    },
    ...overrides,
  };
}

export function createMockPlugin(overrides?: any): any {
  return {
    settings: {
      currentOntology: null,
      showLayoutSection: true,
      showPropertiesSection: true,
      showArchivedAssets: false,
      votesColumnVisible: true,
    },
    saveSettings: jest.fn().mockResolvedValue(undefined),
    refreshLayout: jest.fn(),
    app: createMockApp(),
    ...overrides,
  };
}

export function createMockMetadata(overrides?: Record<string, any>): Record<string, any> {
  return {
    exo__Asset_label: "Test Asset",
    exo__Instance_class: "ems__Task",
    created: "2024-01-01",
    modified: "2024-01-01",
    ...overrides,
  };
}

export function createMockAssetRelation(overrides?: any): any {
  const file = createMockTFile(overrides?.path || "test/file.md");
  return {
    file,
    path: file.path,
    title: overrides?.title || "Test Title",
    metadata: createMockMetadata(overrides?.metadata),
    propertyName: overrides?.propertyName || "ems__Effort_parent",
    isBodyLink: overrides?.isBodyLink || false,
    isArchived: overrides?.isArchived || false,
    isBlocked: overrides?.isBlocked || false,
    created: overrides?.created || Date.now(),
    modified: overrides?.modified || Date.now(),
    ...overrides,
  };
}

export function createMockBacklinksCacheManager(overrides?: any): any {
  return {
    getBacklinks: jest.fn().mockReturnValue([]),
    ...overrides,
  };
}

export function createMockMetadataService(overrides?: any): any {
  return {
    getAssetLabel: jest.fn().mockReturnValue("Test Label"),
    extractMetadata: jest.fn().mockReturnValue(createMockMetadata()),
    ...overrides,
  };
}

export function createMockReactRenderer(): any {
  return {
    render: jest.fn(),
    unmount: jest.fn(),
  };
}

export function createMockMetadataExtractor(metadata?: Record<string, any>): any {
  return {
    extractMetadata: jest.fn().mockReturnValue(
      createMockMetadata(metadata)
    ),
  };
}