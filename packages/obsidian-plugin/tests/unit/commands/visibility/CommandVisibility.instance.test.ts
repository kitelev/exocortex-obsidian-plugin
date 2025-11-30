import type { CommandVisibilityContext } from "@exocortex/core";
import { canCreateInstance, canCreateSubclass } from "@exocortex/core";

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
});
