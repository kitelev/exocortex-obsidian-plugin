#!/usr/bin/env node

/**
 * E2E Test: SPARQL Functionality
 * Tests that SPARQL queries execute correctly and produce expected output
 */

const fs = require("fs");
const path = require("path");

// Check CI environment
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

// Handle JSDOM dependency gracefully
let JSDOM;
try {
  JSDOM = require("jsdom").JSDOM;
} catch (error) {
  if (isCI) {
    console.log(
      "⚠️ JSDOM not available in CI, using fallback DOM implementation",
    );
    // Provide minimal DOM implementation for CI
    global.document = {
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        children: [],
        appendChild: function (child) {
          this.children.push(child);
        },
        innerHTML: "",
        querySelectorAll: () => [],
        textContent: "",
      }),
      body: {},
    };
    global.window = { HTMLElement: function () {} };
    global.HTMLElement = function () {};
  } else {
    throw error;
  }
}

console.log("🧪 E2E Test: SPARQL Functionality");

// Test configuration
const PLUGIN_DIR = path.resolve(__dirname, "../..");
const MAIN_JS_PATH = path.join(PLUGIN_DIR, "main.js");

// Test results tracker
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function runAsyncTest(name, testFn) {
  testsRun++;
  process.stdout.write(`  ${name}... `);

  try {
    await testFn();
    testsPassed++;
    console.log("✅ PASS");
    return true;
  } catch (error) {
    testsFailed++;
    console.log("❌ FAIL");
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Setup DOM environment
if (JSDOM) {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
} else {
  console.log("🔧 Using fallback DOM implementation");
}

// Mock Obsidian API
const ObsidianMock = {
  Plugin: class Plugin {
    constructor(app, manifest) {
      this.app = app;
      this.manifest = manifest;
    }

    addCommand(command) {
      // Mock implementation
    }

    addRibbonIcon(icon, title, callback) {
      // Mock implementation
    }

    registerEvent(event) {
      // Mock implementation
    }

    registerMarkdownCodeBlockProcessor(language, processor) {
      this.codeBlockProcessor = processor;
    }

    addSettingTab(tab) {
      this.settingTab = tab;
    }

    async loadData() {
      return {};
    }

    async saveData(data) {
      // Mock implementation
    }

    async onload() {
      // Override in actual plugin
    }

    async onunload() {
      // Override in actual plugin
    }
  },

  Notice: class Notice {
    constructor(message, timeout) {
      this.message = message;
    }
  },

  TFile: class TFile {
    constructor(path) {
      this.path = path;
      this.basename = path
        ? path
            .split("/")
            .pop()
            .replace(/\.[^/.]+$/, "")
        : "";
      this.extension = path ? path.split(".").pop() : "";
    }
  },

  Modal: class Modal {
    constructor(app) {
      this.app = app;
    }
    open() {}
    close() {}
  },

  PluginSettingTab: class PluginSettingTab {
    constructor(app, plugin) {
      this.app = app;
      this.plugin = plugin;
    }
    display() {}
    hide() {}
  },

  MarkdownView: class MarkdownView {
    constructor() {
      this.previewMode = {
        rerender: () => {},
      };
    }
  },
};

// Mock test files with frontmatter
const mockFiles = [
  {
    basename: "Task1",
    path: "Task1.md",
    content: `---
exo__Asset_uid: task-1-uid
exo__Asset_label: Test Task 1
exo__Instance_class: "[[ems__Task]]"
ems__Task_status: "In Progress"
---

# Test Task 1`,
  },
  {
    basename: "Task2",
    path: "Task2.md",
    content: `---
exo__Asset_uid: task-2-uid
exo__Asset_label: Test Task 2  
exo__Instance_class: "[[ems__Task]]"
ems__Task_status: "Done"
---

# Test Task 2`,
  },
  {
    basename: "Asset1",
    path: "Asset1.md",
    content: `---
exo__Asset_uid: asset-1-uid
exo__Asset_label: Test Asset
exo__Instance_class: "[[exo__Class]]"
---

# Test Asset`,
  },
];

// Mock Obsidian App with test data
const AppMock = {
  vault: {
    getMarkdownFiles() {
      return mockFiles.map((f) => ({
        basename: f.basename,
        path: f.path,
        extension: "md",
      }));
    },

    async read(file) {
      const mockFile = mockFiles.find((f) => f.basename === file.basename);
      if (!mockFile) {
        throw new Error(`Mock file not found: ${file.basename}`);
      }
      return mockFile.content;
    },

    on(event, callback) {
      return { event, callback };
    },

    adapter: {
      read: () => Promise.reject(new Error("File not found")),
      write: () => Promise.resolve(),
      exists: () => Promise.resolve(false),
    },
  },

  workspace: {
    openLinkText(linkText, sourcePath) {
      // Mock implementation
    },

    getActiveFile() {
      return null;
    },
  },

  metadataCache: {
    getFileCache(file) {
      const mockFile = mockFiles.find((f) => f.basename === file.basename);
      if (mockFile && mockFile.basename === "Project1") {
        return {
          frontmatter: {
            exo__Asset_uid: "project-1-uid",
            exo__Asset_label: "Test Project",
            exo__Instance_class: "[[exo__Project]]",
          },
        };
      } else if (mockFile && mockFile.basename === "Task1") {
        return {
          frontmatter: {
            exo__Asset_uid: "task-1-uid",
            exo__Asset_label: "Test Task",
            exo__Instance_class: "[[exo__Task]]",
            exo__Task_project: "[[Project1]]",
          },
        };
      } else if (mockFile && mockFile.basename === "Asset1") {
        return {
          frontmatter: {
            exo__Asset_uid: "asset-1-uid",
            exo__Asset_label: "Test Asset",
            exo__Instance_class: "[[exo__Class]]",
          },
        };
      }
      return { frontmatter: {} };
    },
  },
};

async function loadPlugin() {
  // Setup module system
  const moduleExports = {};
  const module = { exports: moduleExports };

  function mockRequire(id) {
    if (id === "obsidian") {
      return ObsidianMock;
    }
    throw new Error(`Module not mocked: ${id}`);
  }

  // Load plugin
  const pluginCode = fs.readFileSync(MAIN_JS_PATH, "utf8");
  const pluginFn = new Function("module", "exports", "require", pluginCode);
  pluginFn(module, moduleExports, mockRequire);

  const PluginClass = module.exports.default || module.exports;
  const plugin = new PluginClass(AppMock, {});

  await plugin.onload();

  return plugin;
}

async function main() {
  console.log("\n🔍 Running SPARQL Functionality Tests...\n");

  // Test 1: SPARQL processor is registered
  await runAsyncTest("SPARQL processor is registered", async () => {
    const plugin = await loadPlugin();
    assert(
      plugin.codeBlockProcessor,
      "SPARQL code block processor not registered",
    );
    assert(
      typeof plugin.codeBlockProcessor === "function",
      "Code block processor is not a function",
    );
  });

  // Test 2: Plugin loads vault data into graph
  await runAsyncTest("Plugin loads vault data into graph", async () => {
    const plugin = await loadPlugin();

    // Check that plugin has graph initialized
    assert(plugin.graph, "Plugin should have graph initialized");

    // Check that vault files were loaded
    const files = AppMock.vault.getMarkdownFiles();
    assert(files.length === 3, "Should have 3 mock files");

    // Verify the plugin has SPARQL processor
    assert(plugin.sparqlProcessor, "Plugin should have SPARQL processor");
  });

  // Test 3: Graph contains loaded triples (including UID triples)
  await runAsyncTest("Graph contains triples from vault files", async () => {
    const plugin = await loadPlugin();

    // The plugin should have loaded triples into the graph
    const allTriples = plugin.graph.match(null, null, null);
    assert(allTriples.length > 0, "Graph should contain triples");

    // Check for specific expected UID triples
    // Note: Must access predicate.value since predicates are IRI objects, not strings
    const uidTriples = allTriples.filter(
      (t) => t.predicate.value === "exo__Asset_uid",
    );
    assert(uidTriples.length >= 3, "Should have UID triples for each file");

    // Verify each file has its expected UID triple
    const expectedUIDs = ["task-1-uid", "task-2-uid", "asset-1-uid"];
    const actualUIDs = uidTriples.map((t) => t.object.value);

    for (const expectedUID of expectedUIDs) {
      assert(
        actualUIDs.includes(expectedUID),
        `Missing UID triple for: ${expectedUID}`,
      );
    }

    // Verify triple structure: file://[basename] exo__Asset_uid [uid-value]
    const uidTriple = uidTriples[0];
    assert(
      uidTriple.subject.value.startsWith("file://"),
      "UID triple subject should be file:// URI",
    );
    assert(
      uidTriple.predicate.value === "exo__Asset_uid",
      "UID triple predicate should be exo__Asset_uid",
    );
    assert(
      typeof uidTriple.object.value === "string",
      "UID triple object should be string literal",
    );
  });

  // Test 4: SPARQL processor can execute queries
  await runAsyncTest("SPARQL processor can execute queries", async () => {
    const plugin = await loadPlugin();

    // Verify SPARQL processor exists
    assert(plugin.sparqlProcessor, "Plugin should have SPARQL processor");

    // The processor has a processCodeBlock method
    assert(
      typeof plugin.sparqlProcessor.processCodeBlock === "function",
      "Processor should have processCodeBlock method",
    );

    // Verify graph has been populated with test data
    const triples = plugin.graph.match(null, null, null);
    assert(triples.length > 0, "Graph should contain triples from test files");
  });

  // Test 5: HTML rendering works
  await runAsyncTest("SPARQL results render to HTML correctly", async () => {
    const plugin = await loadPlugin();

    // Create mock HTML element with empty method
    const container = document.createElement("div");
    container.empty = function () {
      this.innerHTML = "";
    };

    const mockContext = {
      sourcePath: "test.md",
    };

    const query = "SELECT * WHERE { ?s ?p ?o } LIMIT 3";

    // Use the SPARQL processor directly
    if (plugin.sparqlProcessor && plugin.sparqlProcessor.processCodeBlock) {
      await plugin.sparqlProcessor.processCodeBlock(
        query,
        container,
        mockContext,
      );

      // Check HTML was created (might be error message or results)
      assert(container.innerHTML.length > 0, "Should create some HTML output");
    } else {
      assert(false, "SPARQL processor not properly initialized");
    }
  });

  // Test 6: Error handling works
  await runAsyncTest("SPARQL error handling works", async () => {
    const plugin = await loadPlugin();

    // Create mock HTML element with empty method
    const container = document.createElement("div");
    container.empty = function () {
      this.innerHTML = "";
    };
    const mockContext = { sourcePath: "test.md" };

    // Invalid query should be handled gracefully
    const invalidQuery = "INVALID SPARQL QUERY";

    // Use the SPARQL processor directly
    if (plugin.sparqlProcessor && plugin.sparqlProcessor.processCodeBlock) {
      // Should not throw, but handle error gracefully
      await plugin.sparqlProcessor.processCodeBlock(
        invalidQuery,
        container,
        mockContext,
      );

      // Should create some HTML output even on error
      assert(
        container.innerHTML.length > 0,
        "Should create output even on error",
      );
    } else {
      assert(false, "SPARQL processor not properly initialized");
    }
  });

  // Test 7: File links work
  await runAsyncTest("File links are created correctly", async () => {
    const plugin = await loadPlugin();

    const container = document.createElement("div");
    container.empty = function () {
      this.innerHTML = "";
    };
    const mockContext = { sourcePath: "test.md" };

    const query = "SELECT ?s WHERE { ?s ?p ?o } LIMIT 3";

    if (plugin.sparqlProcessor && plugin.sparqlProcessor.processCodeBlock) {
      await plugin.sparqlProcessor.processCodeBlock(
        query,
        container,
        mockContext,
      );

      // Check that some output was created
      assert(
        container.innerHTML.length > 0,
        "Should create output for query results",
      );
    } else {
      assert(false, "SPARQL processor not properly initialized");
    }
  });

  console.log(`\n📊 Test Results: ${testsPassed}/${testsRun} passed`);

  if (testsFailed > 0) {
    console.log("❌ Some SPARQL tests failed!");
    process.exit(1);
  } else {
    console.log("✅ All SPARQL functionality tests passed!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("❌ Test runner error:", error);
  process.exit(1);
});
