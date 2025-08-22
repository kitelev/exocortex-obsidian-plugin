import { App, Modal, Plugin, TFile, Vault } from "obsidian";

describe("Obsidian API Contract Tests", () => {
  describe("Vault API Contract", () => {
    it("should have required Vault methods", () => {
      const vaultMethods = [
        "read",
        "modify",
        "create",
        "delete",
        "rename",
        "getAbstractFileByPath",
        "getFiles",
        "getAllLoadedFiles",
        "getMarkdownFiles",
        "createFolder",
      ];

      const app = new App();
      const vault = app.vault;
      vaultMethods.forEach((method) => {
        expect(typeof (vault as any)[method]).toBe("function");
      });
    });

    it("should have correct Vault method signatures", () => {
      const app = new App();
      const vault = app.vault;
      
      // Test read signature
      expect(vault.read).toBeInstanceOf(Function);
      expect(vault.read.length).toBe(1); // Takes 1 parameter (file)
      
      // Test modify signature
      expect(vault.modify).toBeInstanceOf(Function);
      expect(vault.modify.length).toBe(2); // Takes 2 parameters (file, data)
      
      // Test create signature
      expect(vault.create).toBeInstanceOf(Function);
      expect(vault.create.length).toBe(2); // Takes 2 parameters (path, data)
    });
  });

  describe("TFile API Contract", () => {
    it("should have required TFile properties", () => {
      const file = new TFile();
      const requiredProps = ["path", "name", "extension", "basename", "vault", "parent"];

      requiredProps.forEach((prop) => {
        expect(prop in file).toBe(true);
      });
    });

    it("should have correct TFile property types", () => {
      const file = {
        path: "test/file.md",
        name: "file.md",
        extension: "md",
        basename: "file",
        vault: {} as Vault,
        parent: null,
      } as TFile;

      expect(typeof file.path).toBe("string");
      expect(typeof file.name).toBe("string");
      expect(typeof file.extension).toBe("string");
      expect(typeof file.basename).toBe("string");
      expect(file.vault).toBeDefined();
    });
  });

  describe("App API Contract", () => {
    it("should have required App properties", () => {
      const app = new App();
      const requiredProps = ["vault", "metadataCache", "workspace", "fileManager"];

      requiredProps.forEach((prop) => {
        expect(prop in app).toBe(true);
      });
    });

    it("should have correct App method signatures", () => {
      const app = new App();
      
      expect(app.vault).toBeDefined();
      expect(app.metadataCache).toBeDefined();
      expect(app.workspace).toBeDefined();
    });
  });

  describe("Modal API Contract", () => {
    it("should have required Modal methods", () => {
      const app = new App();
      const modal = new Modal(app);
      const requiredMethods = ["open", "close", "onOpen", "onClose"];

      requiredMethods.forEach((method) => {
        expect(typeof (modal as any)[method]).toBe("function");
      });
    });

    it("should have required Modal properties", () => {
      const app = new App();
      const modal = new Modal(app);
      const requiredProps = ["app", "contentEl", "modalEl"];

      requiredProps.forEach((prop) => {
        expect(prop in modal).toBe(true);
      });
    });
  });

  describe("Plugin API Contract", () => {
    it("should have required Plugin lifecycle methods", () => {
      class TestPlugin extends Plugin {
        onload(): void {}
        onunload(): void {}
      }
      const app = new App();
      const manifest = { id: "test", name: "Test", version: "1.0.0", minAppVersion: "0.15.0", description: "Test", author: "Test", authorUrl: "", isDesktopOnly: false };
      const plugin = new TestPlugin(app, manifest);
      const lifecycleMethods = ["onload", "onunload"];

      lifecycleMethods.forEach((method) => {
        expect(typeof (plugin as any)[method]).toBe("function");
      });
    });

    it("should have required Plugin properties", () => {
      class TestPlugin extends Plugin {
        onload(): void {}
        onunload(): void {}
      }
      const app = new App();
      const manifest = { id: "test", name: "Test", version: "1.0.0", minAppVersion: "0.15.0", description: "Test", author: "Test", authorUrl: "", isDesktopOnly: false };
      const plugin = new TestPlugin(app, manifest);
      const requiredProps = ["app", "manifest"];

      requiredProps.forEach((prop) => {
        expect(prop in plugin).toBe(true);
      });
    });
  });

  describe("MetadataCache API Contract", () => {
    it("should have required MetadataCache methods", () => {
      const metadataCache = (new App()).metadataCache;
      const requiredMethods = [
        "getFileCache",
        "getCache",
        "fileToLinktext",
        "on",
        "off",
        "trigger",
      ];

      requiredMethods.forEach((method) => {
        expect(typeof (metadataCache as any)[method]).toBe("function");
      });
    });
  });

  describe("Workspace API Contract", () => {
    it("should have required Workspace methods", () => {
      const workspace = (new App()).workspace;
      const requiredMethods = [
        "getActiveFile",
        "getLeaf",
        "getActiveViewOfType",
        "on",
        "off",
        "trigger",
      ];

      requiredMethods.forEach((method) => {
        expect(typeof (workspace as any)[method]).toBe("function");
      });
    });
  });

  describe("Platform API Contract", () => {
    it("should have required Platform properties", () => {
      const Platform = require("obsidian").Platform;
      const requiredProps = [
        "isDesktop",
        "isDesktopApp",
        "isMobile",
        "isMobileApp",
        "isIosApp",
        "isAndroidApp",
      ];

      requiredProps.forEach((prop) => {
        expect(prop in Platform).toBe(true);
        expect(typeof Platform[prop]).toBe("boolean");
      });
    });
  });

  describe("DOM Extension Contract", () => {
    it("should have Obsidian DOM extensions", () => {
      const element = document.createElement("div");
      
      // Check for Obsidian-specific DOM methods
      expect(typeof (element as any).createEl).toBe("function");
      expect(typeof (element as any).createDiv).toBe("function");
      expect(typeof (element as any).createSpan).toBe("function");
      expect(typeof (element as any).empty).toBe("function");
      expect(typeof (element as any).addClass).toBe("function");
      expect(typeof (element as any).removeClass).toBe("function");
      expect(typeof (element as any).toggleClass).toBe("function");
      expect(typeof (element as any).hasClass).toBe("function");
    });
  });
});