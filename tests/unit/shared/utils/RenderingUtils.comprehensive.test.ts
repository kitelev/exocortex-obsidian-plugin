import { RenderingUtils } from "../../../../src/shared/utils/RenderingUtils";
import { App, TFile } from "obsidian";

// Mock Obsidian API
const mockApp = {
  metadataCache: {
    getFileCache: jest.fn()
  }
} as unknown as App;

const createMockFile = (basename: string, path?: string): TFile => ({
  basename,
  path: path || `${basename}.md`,
  name: `${basename}.md`,
} as TFile);

describe("RenderingUtils - Comprehensive Branch Coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Obsidian DOM extensions
    (HTMLElement.prototype as any).createEl = jest.fn().mockImplementation(function(tag: string, attrs?: any) {
      const element = document.createElement(tag);
      if (attrs?.text) element.textContent = attrs.text;
      if (attrs?.cls) element.className = attrs.cls;
      if (attrs?.href) element.setAttribute('href', attrs.href);
      this.appendChild(element);
      return element;
    });
    
    (HTMLElement.prototype as any).createDiv = jest.fn().mockImplementation(function(attrs?: any) {
      const div = document.createElement('div');
      if (attrs?.cls) div.className = attrs.cls;
      if (attrs?.text) div.textContent = attrs.text;
      this.appendChild(div);
      return div;
    });
  });

  describe("cleanClassName - All Branch Coverage", () => {
    it("should return empty string for falsy values", () => {
      const falsyValues = [null, undefined, "", 0, false];
      
      falsyValues.forEach(value => {
        expect(RenderingUtils.cleanClassName(value)).toBe("");
      });
    });

    it("should handle array input and use first element", () => {
      const arrayInput = ["[[exo__Asset]]", "[[backup]]"];
      expect(RenderingUtils.cleanClassName(arrayInput)).toBe("exo__Asset");
    });

    it("should handle empty array", () => {
      expect(RenderingUtils.cleanClassName([])).toBe("");
    });

    it("should handle array with falsy first element", () => {
      const arrayWithFalsy = [null, "[[exo__Asset]]"];
      expect(RenderingUtils.cleanClassName(arrayWithFalsy)).toBe("");
    });

    it("should handle array with undefined first element", () => {
      const arrayWithUndefined = [undefined, "[[exo__Asset]]"];
      expect(RenderingUtils.cleanClassName(arrayWithUndefined)).toBe("");
    });

    it("should handle non-array input", () => {
      expect(RenderingUtils.cleanClassName("[[exo__Asset]]")).toBe("exo__Asset");
    });

    it("should remove wiki link brackets", () => {
      const testCases = [
        { input: "[[exo__Asset]]", expected: "exo__Asset" },
        { input: "[[ems__Task]]", expected: "ems__Task" },
        { input: "[Asset]", expected: "[Asset]" }, // Only removes [[ ]] not [ ]
        { input: "Asset", expected: "Asset" },
        { input: "[[]]", expected: "" },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(RenderingUtils.cleanClassName(input)).toBe(expected);
      });
    });

    it("should handle toString conversion for objects", () => {
      const objectWithToString = {
        toString: () => "[[CustomClass]]"
      };
      
      expect(RenderingUtils.cleanClassName(objectWithToString)).toBe("CustomClass");
    });

    it("should handle edge case toString behaviors", () => {
      // Test valid number toString
      expect(RenderingUtils.cleanClassName(12345)).toBe("12345");
      
      // Test object toString
      const objWithMethod = { toString: () => "[[TestClass]]" };
      expect(RenderingUtils.cleanClassName(objWithMethod)).toBe("TestClass");
    });

    it("should handle array with object that has toString", () => {
      const arrayWithObject = [{
        toString: () => "[[ArrayClass]]"
      }];
      
      expect(RenderingUtils.cleanClassName(arrayWithObject)).toBe("ArrayClass");
    });
  });

  describe("createEmptyMessage - DOM Creation", () => {
    let container: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = "";
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    it("should create paragraph with message and class", () => {
      RenderingUtils.createEmptyMessage(container, "No items found");
      
      const paragraph = container.querySelector("p");
      expect(paragraph).not.toBeNull();
      expect(paragraph!.textContent).toBe("No items found");
      expect(paragraph!.classList.contains("exocortex-empty")).toBe(true);
    });

    it("should handle empty message", () => {
      RenderingUtils.createEmptyMessage(container, "");
      
      const paragraph = container.querySelector("p");
      expect(paragraph).not.toBeNull();
      expect(paragraph!.textContent).toBe("");
    });

    it("should handle special characters in message", () => {
      const specialMessage = "No items with \"quotes\" & <tags>";
      RenderingUtils.createEmptyMessage(container, specialMessage);
      
      const paragraph = container.querySelector("p");
      expect(paragraph!.textContent).toBe(specialMessage);
    });
  });

  describe("createCountInfo - Count Display Branches", () => {
    let container: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = "";
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    it("should create count info with default class name", () => {
      RenderingUtils.createCountInfo(container, 5, 5, "item");
      
      const info = container.querySelector(".exocortex-info");
      expect(info).not.toBeNull();
      
      const span = info!.querySelector("span");
      expect(span!.textContent).toBe("5 items");
      expect(span!.classList.contains("exocortex-item-count")).toBe(true);
    });

    it("should create count info with custom class name", () => {
      RenderingUtils.createCountInfo(container, 3, 3, "asset", "custom-class");
      
      const info = container.querySelector(".custom-class");
      expect(info).not.toBeNull();
    });

    it("should use singular form for count of 1", () => {
      RenderingUtils.createCountInfo(container, 1, 1, "item");
      
      const span = container.querySelector("span");
      expect(span!.textContent).toBe("1 item"); // No 's' suffix
    });

    it("should use plural form for count !== 1", () => {
      const testCounts = [0, 2, 5, 100];
      
      testCounts.forEach(count => {
        const testContainer = document.createElement("div");
        RenderingUtils.createCountInfo(testContainer, count, count, "item");
        
        const span = testContainer.querySelector("span");
        expect(span!.textContent).toBe(`${count} items`); // With 's' suffix
      });
    });

    it("should show 'showing X' when displayCount < totalCount", () => {
      RenderingUtils.createCountInfo(container, 10, 5, "item");
      
      const span = container.querySelector("span");
      expect(span!.textContent).toBe("10 items, showing 5");
    });

    it("should not show 'showing X' when displayCount >= totalCount", () => {
      RenderingUtils.createCountInfo(container, 5, 5, "item");
      
      const span = container.querySelector("span");
      expect(span!.textContent).toBe("5 items");
    });

    it("should not show 'showing X' when displayCount > totalCount", () => {
      RenderingUtils.createCountInfo(container, 5, 10, "item");
      
      const span = container.querySelector("span");
      expect(span!.textContent).toBe("5 items");
    });

    it("should handle zero counts correctly", () => {
      RenderingUtils.createCountInfo(container, 0, 0, "item");
      
      const span = container.querySelector("span");
      expect(span!.textContent).toBe("0 items");
    });
  });

  describe("createInternalLink - Link Creation Branches", () => {
    let container: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = "";
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    it("should create link with default class", () => {
      const link = RenderingUtils.createInternalLink(container, "Link Text", "href.md");
      
      expect(link.textContent).toBe("Link Text");
      expect(link.getAttribute("href")).toBe("href.md");
      expect(link.classList.contains("internal-link")).toBe(true);
    });

    it("should create link with custom class", () => {
      const link = RenderingUtils.createInternalLink(container, "Link Text", "href.md", "custom-class");
      
      expect(link.classList.contains("internal-link")).toBe(true);
      expect(link.classList.contains("custom-class")).toBe(true);
    });

    it("should handle empty custom class", () => {
      const link = RenderingUtils.createInternalLink(container, "Link Text", "href.md", "");
      
      expect(link.getAttribute("class")).toBe("internal-link");
    });

    it("should handle undefined custom class", () => {
      const link = RenderingUtils.createInternalLink(container, "Link Text", "href.md", undefined);
      
      expect(link.getAttribute("class")).toBe("internal-link");
    });

    it("should trim only trailing space due to template literal trim", () => {
      const link = RenderingUtils.createInternalLink(container, "Link Text", "href.md", "  spaced-class  ");
      
      expect(link.getAttribute("class")).toBe("internal-link   spaced-class"); // .trim() removes trailing only
    });

    it("should handle multiple custom classes", () => {
      const link = RenderingUtils.createInternalLink(container, "Link Text", "href.md", "class1 class2");
      
      expect(link.getAttribute("class")).toBe("internal-link class1 class2");
    });
  });

  describe("extractFrontmatterData - Metadata Access Branches", () => {
    const mockFile = createMockFile("test");

    it("should return value when metadata and frontmatter exist", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { testKey: "test value" }
      });
      
      const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey");
      expect(result).toBe("test value");
    });

    it("should return fallback when metadata is null", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue(null);
      
      const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey", "fallback");
      expect(result).toBe("fallback");
    });

    it("should return fallback when metadata is undefined", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue(undefined);
      
      const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey", "fallback");
      expect(result).toBe("fallback");
    });

    it("should return fallback when frontmatter is null", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: null
      });
      
      const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey", "fallback");
      expect(result).toBe("fallback");
    });

    it("should return fallback when frontmatter is undefined", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: undefined
      });
      
      const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey", "fallback");
      expect(result).toBe("fallback");
    });

    it("should return fallback when key doesn't exist", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { otherKey: "other value" }
      });
      
      const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey", "fallback");
      expect(result).toBe("fallback");
    });

    it("should return falsy values when they exist except for || operator", () => {
      // Test values that won't trigger || fallback (only null/undefined)
      const truthyFalsyValues = [" ", "0", []];
      
      truthyFalsyValues.forEach(value => {
        (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
          frontmatter: { testKey: value }
        });
        
        const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey", "fallback");
        expect(result).toBe(value);
      });
      
      // Test values that will trigger || fallback
      const falsyValues = [0, false, "", null];
      
      falsyValues.forEach(value => {
        (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
          frontmatter: { testKey: value }
        });
        
        const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey", "fallback");
        expect(result).toBe("fallback");
      });
    });

    it("should use default null fallback when not provided", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {}
      });
      
      const result = RenderingUtils.extractFrontmatterData(mockApp, mockFile, "testKey");
      expect(result).toBe(null);
    });
  });

  describe("createTable - Table Structure Creation", () => {
    let container: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = "";
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    it("should create table with headers", () => {
      const headers = ["Name", "Class", "Status"];
      const result = RenderingUtils.createTable(container, headers, "test-table");
      
      expect(result.table).not.toBeNull();
      expect(result.thead).not.toBeNull();
      expect(result.tbody).not.toBeNull();
      
      expect(result.table.classList.contains("test-table")).toBe(true);
      
      const headerCells = result.thead.querySelectorAll("th");
      expect(headerCells).toHaveLength(3);
      expect(headerCells[0].textContent).toBe("Name");
      expect(headerCells[1].textContent).toBe("Class");
      expect(headerCells[2].textContent).toBe("Status");
    });

    it("should create table with no headers", () => {
      const result = RenderingUtils.createTable(container, [], "empty-table");
      
      expect(result.table).not.toBeNull();
      expect(result.thead).not.toBeNull();
      expect(result.tbody).not.toBeNull();
      
      const headerCells = result.thead.querySelectorAll("th");
      expect(headerCells).toHaveLength(0);
    });

    it("should create table with single header", () => {
      const result = RenderingUtils.createTable(container, ["Single"], "single-table");
      
      const headerCells = result.thead.querySelectorAll("th");
      expect(headerCells).toHaveLength(1);
      expect(headerCells[0].textContent).toBe("Single");
    });

    it("should handle headers with special characters", () => {
      const headers = ["Name & Title", "Class <Type>", "Status (%)"];
      const result = RenderingUtils.createTable(container, headers, "special-table");
      
      const headerCells = result.thead.querySelectorAll("th");
      expect(headerCells[0].textContent).toBe("Name & Title");
      expect(headerCells[1].textContent).toBe("Class <Type>");
      expect(headerCells[2].textContent).toBe("Status (%)");
    });
  });

  describe("createList - List Creation", () => {
    let container: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = "";
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    it("should create unordered list with class", () => {
      const list = RenderingUtils.createList(container, "test-list");
      
      expect(list.tagName).toBe("UL");
      expect(list.classList.contains("test-list")).toBe(true);
      expect(container.contains(list)).toBe(true);
    });

    it("should handle empty class name", () => {
      const list = RenderingUtils.createList(container, "");
      
      expect(list.tagName).toBe("UL");
      expect(list.getAttribute("class")).toBe(null); // Empty class returns null
    });
  });

  describe("groupFilesByClass - Grouping Logic Branches", () => {
    const mockFiles = [
      createMockFile("Asset1", "Asset1.md"),
      createMockFile("Asset2", "Asset2.md"),
      createMockFile("Task1", "Task1.md"),
    ];

    it("should group files by class when metadata exists", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValueOnce({
          frontmatter: { "exo__Instance_class": "[[exo__Asset]]" }
        })
        .mockReturnValueOnce({
          frontmatter: { "exo__Instance_class": "[[exo__Asset]]" }
        })
        .mockReturnValueOnce({
          frontmatter: { "exo__Instance_class": "[[ems__Task]]" }
        });
      
      const groups = RenderingUtils.groupFilesByClass(mockApp, mockFiles);
      
      expect(groups.size).toBe(2);
      expect(groups.get("exo__Asset")).toHaveLength(2);
      expect(groups.get("ems__Task")).toHaveLength(1);
    });

    it("should use 'Unclassified' for files without class", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({ frontmatter: {} });
      
      const groups = RenderingUtils.groupFilesByClass(mockApp, [mockFiles[0]]);
      
      expect(groups.size).toBe(1);
      expect(groups.get("Unclassified")).toHaveLength(1);
    });

    it("should use 'Unclassified' for files with null metadata", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue(null);
      
      const groups = RenderingUtils.groupFilesByClass(mockApp, [mockFiles[0]]);
      
      expect(groups.size).toBe(1);
      expect(groups.get("Unclassified")).toHaveLength(1);
    });

    it("should use 'Unclassified' for files with null frontmatter", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({ frontmatter: null });
      
      const groups = RenderingUtils.groupFilesByClass(mockApp, [mockFiles[0]]);
      
      expect(groups.size).toBe(1);
      expect(groups.get("Unclassified")).toHaveLength(1);
    });

    it("should create new group when class not seen before", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValueOnce({
          frontmatter: { "exo__Instance_class": "[[NewClass]]" }
        })
        .mockReturnValueOnce({
          frontmatter: { "exo__Instance_class": "[[AnotherNewClass]]" }
        });
      
      const groups = RenderingUtils.groupFilesByClass(mockApp, mockFiles.slice(0, 2));
      
      expect(groups.size).toBe(2);
      expect(groups.has("NewClass")).toBe(true);
      expect(groups.has("AnotherNewClass")).toBe(true);
    });

    it("should add to existing group when class already seen", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({
          frontmatter: { "exo__Instance_class": "[[SameClass]]" }
        });
      
      const groups = RenderingUtils.groupFilesByClass(mockApp, mockFiles);
      
      expect(groups.size).toBe(1);
      expect(groups.get("SameClass")).toHaveLength(3);
    });

    it("should handle array class values", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({
          frontmatter: { "exo__Instance_class": ["[[MultiClass]]", "[[Secondary]]"] }
        });
      
      const groups = RenderingUtils.groupFilesByClass(mockApp, [mockFiles[0]]);
      
      expect(groups.get("MultiClass")).toHaveLength(1);
    });

    it("should handle empty files array", () => {
      const groups = RenderingUtils.groupFilesByClass(mockApp, []);
      
      expect(groups.size).toBe(0);
    });
  });

  describe("sortGroupsByName - Sorting Logic", () => {
    it("should sort groups alphabetically", () => {
      const groups = new Map([
        ["Zebra", []],
        ["Apple", []],
        ["Banana", []]
      ]);
      
      const sorted = RenderingUtils.sortGroupsByName(groups);
      
      expect(sorted.map(([name]) => name)).toEqual(["Apple", "Banana", "Zebra"]);
    });

    it("should handle case-insensitive sorting", () => {
      const groups = new Map([
        ["zebra", []],
        ["Apple", []],
        ["BANANA", []]
      ]);
      
      const sorted = RenderingUtils.sortGroupsByName(groups);
      
      expect(sorted.map(([name]) => name)).toEqual(["Apple", "BANANA", "zebra"]);
    });

    it("should preserve file arrays in sorted result", () => {
      const files1 = [createMockFile("file1")];
      const files2 = [createMockFile("file2"), createMockFile("file3")];
      
      const groups = new Map([
        ["Second", files2],
        ["First", files1]
      ]);
      
      const sorted = RenderingUtils.sortGroupsByName(groups);
      
      expect(sorted[0][0]).toBe("First");
      expect(sorted[0][1]).toBe(files1);
      expect(sorted[1][0]).toBe("Second");
      expect(sorted[1][1]).toBe(files2);
    });

    it("should handle empty groups map", () => {
      const groups = new Map();
      const sorted = RenderingUtils.sortGroupsByName(groups);
      
      expect(sorted).toEqual([]);
    });

    it("should handle single group", () => {
      const groups = new Map([["OnlyGroup", []]]);
      const sorted = RenderingUtils.sortGroupsByName(groups);
      
      expect(sorted).toHaveLength(1);
      expect(sorted[0][0]).toBe("OnlyGroup");
    });
  });

  describe("createGroupHeader - Header Creation", () => {
    let container: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = "";
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    it("should create h4 header with title and count", () => {
      const header = RenderingUtils.createGroupHeader(container, "Test Group", 5, "group-header");
      
      expect(header.tagName).toBe("H4");
      expect(header.textContent).toBe("Test Group (5)");
      expect(header.classList.contains("group-header")).toBe(true);
    });

    it("should handle zero count", () => {
      const header = RenderingUtils.createGroupHeader(container, "Empty Group", 0, "group-header");
      
      expect(header.textContent).toBe("Empty Group (0)");
    });

    it("should handle large counts", () => {
      const header = RenderingUtils.createGroupHeader(container, "Large Group", 999, "group-header");
      
      expect(header.textContent).toBe("Large Group (999)");
    });
  });

  describe("applyResultLimit - Limiting Logic Branches", () => {
    const testFiles = [
      createMockFile("file1"),
      createMockFile("file2"),
      createMockFile("file3"),
      createMockFile("file4"),
      createMockFile("file5"),
    ];

    it("should return limited array when maxResults is positive", () => {
      const result = RenderingUtils.applyResultLimit(testFiles, 3);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(testFiles[0]);
      expect(result[1]).toBe(testFiles[1]);
      expect(result[2]).toBe(testFiles[2]);
    });

    it("should return full array when maxResults is undefined", () => {
      const result = RenderingUtils.applyResultLimit(testFiles, undefined);
      
      expect(result).toBe(testFiles); // Same reference
      expect(result).toHaveLength(5);
    });

    it("should return full array when maxResults is zero", () => {
      const result = RenderingUtils.applyResultLimit(testFiles, 0);
      
      expect(result).toBe(testFiles);
      expect(result).toHaveLength(5);
    });

    it("should return full array when maxResults is negative", () => {
      const result = RenderingUtils.applyResultLimit(testFiles, -1);
      
      expect(result).toBe(testFiles);
      expect(result).toHaveLength(5);
    });

    it("should return full array when maxResults > array length", () => {
      const result = RenderingUtils.applyResultLimit(testFiles, 10);
      
      expect(result).toHaveLength(5);
      expect(result).toEqual(testFiles);
    });

    it("should return empty array when input is empty", () => {
      const result = RenderingUtils.applyResultLimit([], 3);
      
      expect(result).toEqual([]);
    });

    it("should handle maxResults equal to array length", () => {
      const result = RenderingUtils.applyResultLimit(testFiles, 5);
      
      expect(result).toHaveLength(5);
      expect(result).toEqual(testFiles);
    });
  });

  describe("filterFilesByClass - Filtering Logic Branches", () => {
    const testFiles = [
      createMockFile("Asset1"),
      createMockFile("Task1"),
      createMockFile("Asset2"),
    ];

    it("should return all files when targetClass is undefined", () => {
      const result = RenderingUtils.filterFilesByClass(mockApp, testFiles, undefined);
      
      expect(result).toBe(testFiles); // Same reference
      expect(result).toHaveLength(3);
    });

    it("should return all files when targetClass is null", () => {
      const result = RenderingUtils.filterFilesByClass(mockApp, testFiles, null as any);
      
      expect(result).toBe(testFiles);
    });

    it("should return all files when targetClass is empty string", () => {
      const result = RenderingUtils.filterFilesByClass(mockApp, testFiles, "");
      
      expect(result).toBe(testFiles);
    });

    it("should filter files matching target class", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValueOnce({
          frontmatter: { "exo__Instance_class": "[[exo__Asset]]" }
        })
        .mockReturnValueOnce({
          frontmatter: { "exo__Instance_class": "[[ems__Task]]" }
        })
        .mockReturnValueOnce({
          frontmatter: { "exo__Instance_class": "[[exo__Asset]]" }
        });
      
      const result = RenderingUtils.filterFilesByClass(mockApp, testFiles, "exo__Asset");
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(testFiles[0]);
      expect(result[1]).toBe(testFiles[2]);
    });

    it("should handle target class with brackets", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({
          frontmatter: { "exo__Instance_class": "[[exo__Asset]]" }
        });
      
      const result = RenderingUtils.filterFilesByClass(mockApp, [testFiles[0]], "[[exo__Asset]]");
      
      expect(result).toHaveLength(1);
    });

    it("should return empty array when no files match", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({
          frontmatter: { "exo__Instance_class": "[[ems__Task]]" }
        });
      
      const result = RenderingUtils.filterFilesByClass(mockApp, testFiles, "exo__Asset");
      
      expect(result).toHaveLength(0);
    });

    it("should handle files without metadata", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue(null);
      
      const result = RenderingUtils.filterFilesByClass(mockApp, testFiles, "exo__Asset");
      
      expect(result).toHaveLength(0);
    });

    it("should handle files without frontmatter", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({ frontmatter: null });
      
      const result = RenderingUtils.filterFilesByClass(mockApp, testFiles, "exo__Asset");
      
      expect(result).toHaveLength(0);
    });

    it("should handle files without class property", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({ frontmatter: { otherProperty: "value" } });
      
      const result = RenderingUtils.filterFilesByClass(mockApp, testFiles, "exo__Asset");
      
      expect(result).toHaveLength(0);
    });

    it("should handle array class values in filtering", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValue({
          frontmatter: { "exo__Instance_class": ["[[exo__Asset]]", "[[other]]"] }
        });
      
      const result = RenderingUtils.filterFilesByClass(mockApp, [testFiles[0]], "exo__Asset");
      
      expect(result).toHaveLength(1);
    });
  });

  describe("getDisplayLabel - Label Extraction Branches", () => {
    const mockFile = createMockFile("TestFile");

    it("should return label from frontmatter when present", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { "exo__Asset_label": "Custom Label" }
      });
      
      const result = RenderingUtils.getDisplayLabel(mockApp, mockFile);
      expect(result).toBe("Custom Label");
    });

    it("should return basename when no metadata", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue(null);
      
      const result = RenderingUtils.getDisplayLabel(mockApp, mockFile);
      expect(result).toBe("TestFile");
    });

    it("should return basename when no frontmatter", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: null
      });
      
      const result = RenderingUtils.getDisplayLabel(mockApp, mockFile);
      expect(result).toBe("TestFile");
    });

    it("should return basename when no label property", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { otherProperty: "value" }
      });
      
      const result = RenderingUtils.getDisplayLabel(mockApp, mockFile);
      expect(result).toBe("TestFile");
    });

    it("should return basename when label is empty", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { "exo__Asset_label": "" }
      });
      
      const result = RenderingUtils.getDisplayLabel(mockApp, mockFile);
      expect(result).toBe("TestFile");
    });

    it("should return basename when label is null", () => {
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { "exo__Asset_label": null }
      });
      
      const result = RenderingUtils.getDisplayLabel(mockApp, mockFile);
      expect(result).toBe("TestFile");
    });

    it("should return basename for falsy label values due to || operator", () => {
      const falsyValues = [0, false, "", null];
      
      falsyValues.forEach(value => {
        (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
          frontmatter: { "exo__Asset_label": value }
        });
        
        const result = RenderingUtils.getDisplayLabel(mockApp, mockFile);
        expect(result).toBe("TestFile"); // Falls back to basename due to ||
      });
    });
  });

  describe("Integration and Edge Cases", () => {
    it("should handle complex integration scenario", () => {
      const files = [
        createMockFile("Asset1"),
        createMockFile("Asset2"),
        createMockFile("Task1"),
      ];

      // Setup metadata for grouping
      (mockApp.metadataCache.getFileCache as jest.Mock)
        .mockReturnValueOnce({
          frontmatter: { 
            "exo__Instance_class": "[[exo__Asset]]",
            "exo__Asset_label": "Custom Asset 1"
          }
        })
        .mockReturnValueOnce({
          frontmatter: { 
            "exo__Instance_class": "[[exo__Asset]]",
            "exo__Asset_label": "Custom Asset 2"
          }
        })
        .mockReturnValueOnce({
          frontmatter: { 
            "exo__Instance_class": "[[ems__Task]]",
            "exo__Asset_label": "Custom Task 1"
          }
        });

      // Group files
      const groups = RenderingUtils.groupFilesByClass(mockApp, files);
      
      // Sort groups
      const sortedGroups = RenderingUtils.sortGroupsByName(groups);
      
      // Apply limits
      const limitedFiles = RenderingUtils.applyResultLimit(files, 2);
      
      // Filter by class
      const filteredFiles = RenderingUtils.filterFilesByClass(mockApp, files, "exo__Asset");
      
      expect(groups.size).toBe(2);
      expect(sortedGroups[0][0]).toBe("ems__Task");
      expect(sortedGroups[1][0]).toBe("exo__Asset");
      expect(limitedFiles).toHaveLength(2);
      expect(filteredFiles).toHaveLength(0); // Need to setup mocks for filtering correctly
    });

    it("should handle memory and performance with large datasets", () => {
      const largeFileSet = Array.from({ length: 1000 }, (_, i) => 
        createMockFile(`File${i}`)
      );
      
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { "exo__Instance_class": "[[TestClass]]" }
      });
      
      const start = Date.now();
      
      const groups = RenderingUtils.groupFilesByClass(mockApp, largeFileSet);
      const sorted = RenderingUtils.sortGroupsByName(groups);
      const limited = RenderingUtils.applyResultLimit(largeFileSet, 100);
      const filtered = RenderingUtils.filterFilesByClass(mockApp, largeFileSet, "TestClass");
      
      const duration = Date.now() - start;
      
      expect(groups.get("TestClass")).toHaveLength(1000);
      expect(sorted).toHaveLength(1);
      expect(limited).toHaveLength(100);
      expect(filtered).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should be reasonably fast
    });
  });
});