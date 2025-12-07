import type { CommandVisibilityContext } from "@exocortex/core";
import {
  canCreateInstance,
  canCreateSubclass,
  inheritsFromPrototype,
  isPrototypeClass,
} from "@exocortex/core";

describe("CommandVisibility - Instance/Subclass Commands", () => {
  describe("canCreateInstance", () => {
    it("should return true for ems__TaskPrototype", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__TaskPrototype]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(true);
    });

    it("should return true for TaskPrototype without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "ems__TaskPrototype",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(true);
    });

    it("should return false for ems__Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(false);
    });

    it("should return false for ems__Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(false);
    });

    it("should return false when instanceClass is null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(false);
    });

    it("should return true for array with ems__TaskPrototype", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__TaskPrototype]]", "[[SomeOtherClass]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(true);
    });

    it("should return true for ems__MeetingPrototype", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__MeetingPrototype]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(true);
    });

    it("should return true for exo__EventPrototype", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[exo__EventPrototype]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(true);
    });

    it("should return true for EventPrototype without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "exo__EventPrototype",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(true);
    });

    it("should return true for array with exo__EventPrototype", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[exo__EventPrototype]]", "[[SomeOtherClass]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateInstance(context)).toBe(true);
    });

    // New tests for exo__Prototype inheritance
    describe("prototype inheritance via exo__Class_superClass", () => {
      it("should return true for class with exo__Class_superClass pointing to exo__Prototype", () => {
        const context: CommandVisibilityContext = {
          instanceClass: "[[exo__Class]]",
          currentStatus: null,
          metadata: {
            exo__Class_superClass: "[[exo__Prototype]]",
          },
          isArchived: false,
          currentFolder: "",
          expectedFolder: null,
        };
        expect(canCreateInstance(context)).toBe(true);
      });

      it("should return true for class with exo__Class_superClass without brackets", () => {
        const context: CommandVisibilityContext = {
          instanceClass: "exo__Class",
          currentStatus: null,
          metadata: {
            exo__Class_superClass: "exo__Prototype",
          },
          isArchived: false,
          currentFolder: "",
          expectedFolder: null,
        };
        expect(canCreateInstance(context)).toBe(true);
      });

      it("should return true for class with exo__Class_superClass as array containing exo__Prototype", () => {
        const context: CommandVisibilityContext = {
          instanceClass: "[[exo__Class]]",
          currentStatus: null,
          metadata: {
            exo__Class_superClass: ["[[exo__Prototype]]", "[[exo__Asset]]"],
          },
          isArchived: false,
          currentFolder: "",
          expectedFolder: null,
        };
        expect(canCreateInstance(context)).toBe(true);
      });

      it("should return false for class without exo__Prototype in superclass chain", () => {
        const context: CommandVisibilityContext = {
          instanceClass: "[[exo__Class]]",
          currentStatus: null,
          metadata: {
            exo__Class_superClass: "[[exo__Asset]]",
          },
          isArchived: false,
          currentFolder: "",
          expectedFolder: null,
        };
        expect(canCreateInstance(context)).toBe(false);
      });

      it("should return false for class without exo__Class_superClass property", () => {
        const context: CommandVisibilityContext = {
          instanceClass: "[[exo__Class]]",
          currentStatus: null,
          metadata: {},
          isArchived: false,
          currentFolder: "",
          expectedFolder: null,
        };
        expect(canCreateInstance(context)).toBe(false);
      });

      it("should return false for non-class asset even with exo__Prototype in metadata", () => {
        const context: CommandVisibilityContext = {
          instanceClass: "[[ems__Task]]",
          currentStatus: null,
          metadata: {
            exo__Class_superClass: "[[exo__Prototype]]",
          },
          isArchived: false,
          currentFolder: "",
          expectedFolder: null,
        };
        expect(canCreateInstance(context)).toBe(false);
      });

    });
  });

  describe("canCreateSubclass", () => {
    it("should return true for exo__Class", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[exo__Class]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateSubclass(context)).toBe(true);
    });

    it("should return true for exo__Class without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "exo__Class",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateSubclass(context)).toBe(true);
    });

    it("should return false for ems__Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateSubclass(context)).toBe(false);
    });

    it("should return false when instanceClass is null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateSubclass(context)).toBe(false);
    });

    it("should return true for array with exo__Class", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[exo__Class]]", "[[SomeOtherClass]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateSubclass(context)).toBe(true);
    });

    it("should return false for array without exo__Class", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__Task]]", "[[ems__Project]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateSubclass(context)).toBe(false);
    });
  });

  describe("inheritsFromPrototype helper", () => {
    it("should return true when exo__Class_superClass contains exo__Prototype", () => {
      const metadata = {
        exo__Class_superClass: "[[exo__Prototype]]",
      };
      expect(inheritsFromPrototype(metadata)).toBe(true);
    });

    it("should return true for exo__Prototype without brackets", () => {
      const metadata = {
        exo__Class_superClass: "exo__Prototype",
      };
      expect(inheritsFromPrototype(metadata)).toBe(true);
    });

    it("should return true when exo__Class_superClass array contains exo__Prototype", () => {
      const metadata = {
        exo__Class_superClass: ["[[exo__Asset]]", "[[exo__Prototype]]"],
      };
      expect(inheritsFromPrototype(metadata)).toBe(true);
    });

    it("should return false when exo__Class_superClass does not contain exo__Prototype", () => {
      const metadata = {
        exo__Class_superClass: "[[exo__Asset]]",
      };
      expect(inheritsFromPrototype(metadata)).toBe(false);
    });

    it("should return false when exo__Class_superClass is missing", () => {
      const metadata = {};
      expect(inheritsFromPrototype(metadata)).toBe(false);
    });

    it("should return false when exo__Class_superClass is null", () => {
      const metadata = {
        exo__Class_superClass: null,
      };
      expect(inheritsFromPrototype(metadata)).toBe(false);
    });

    it("should handle quoted wiki-link format", () => {
      const metadata = {
        exo__Class_superClass: '"[[exo__Prototype]]"',
      };
      expect(inheritsFromPrototype(metadata)).toBe(true);
    });
  });

  describe("isPrototypeClass helper", () => {
    it("should return true for exo__Class with exo__Prototype superclass", () => {
      const instanceClass = "[[exo__Class]]";
      const metadata = {
        exo__Class_superClass: "[[exo__Prototype]]",
      };
      expect(isPrototypeClass(instanceClass, metadata)).toBe(true);
    });

    it("should return false for non-class asset", () => {
      const instanceClass = "[[ems__Task]]";
      const metadata = {
        exo__Class_superClass: "[[exo__Prototype]]",
      };
      expect(isPrototypeClass(instanceClass, metadata)).toBe(false);
    });

    it("should return false for class without prototype inheritance", () => {
      const instanceClass = "[[exo__Class]]";
      const metadata = {
        exo__Class_superClass: "[[exo__Asset]]",
      };
      expect(isPrototypeClass(instanceClass, metadata)).toBe(false);
    });

    it("should return false for class without superclass", () => {
      const instanceClass = "[[exo__Class]]";
      const metadata = {};
      expect(isPrototypeClass(instanceClass, metadata)).toBe(false);
    });

    it("should return false when instanceClass is null", () => {
      const instanceClass = null;
      const metadata = {
        exo__Class_superClass: "[[exo__Prototype]]",
      };
      expect(isPrototypeClass(instanceClass, metadata)).toBe(false);
    });

    it("should handle array instanceClass with exo__Class", () => {
      const instanceClass = ["[[exo__Class]]", "[[SomeOther]]"];
      const metadata = {
        exo__Class_superClass: "[[exo__Prototype]]",
      };
      expect(isPrototypeClass(instanceClass, metadata)).toBe(true);
    });
  });
});
