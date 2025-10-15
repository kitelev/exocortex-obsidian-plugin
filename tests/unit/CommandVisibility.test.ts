import {
  canCreateTask,
  canCreateInstance,
  canStartEffort,
  canPlanOnToday,
  canMarkDone,
  canTrashEffort,
  canArchiveTask,
  canCleanProperties,
  canRepairFolder,
  CommandVisibilityContext,
} from "../../src/domain/commands/CommandVisibility";

describe("CommandVisibility", () => {
  describe("canCreateTask", () => {
    it("should return true for ems__Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTask(context)).toBe(true);
    });

    it("should return true for ems__Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTask(context)).toBe(true);
    });

    it("should return true for Area without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "ems__Area",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTask(context)).toBe(true);
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
      expect(canCreateTask(context)).toBe(false);
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
      expect(canCreateTask(context)).toBe(false);
    });

    it("should return true for array with ems__Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__Area]]", "[[SomeOtherClass]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTask(context)).toBe(true);
    });
  });

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
  });

  describe("canPlanOnToday", () => {
    it("should return true for ems__Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return true for ems__Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return true for Task without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "ems__Task",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
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
      expect(canPlanOnToday(context)).toBe(false);
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
      expect(canPlanOnToday(context)).toBe(false);
    });

    it("should return true for array with ems__Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__Task]]", "[[SomeOtherClass]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return false when ems__Effort_day is set to today", () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;

      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_day: `"[[${todayString}]]"`,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(false);
    });

    it("should return false when ems__Effort_day is set to today without quotes", () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;

      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_day: `[[${todayString}]]`,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(false);
    });

    it("should return true when ems__Effort_day is set to yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, "0");
      const day = String(yesterday.getDate()).padStart(2, "0");
      const yesterdayString = `${year}-${month}-${day}`;

      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_day: `"[[${yesterdayString}]]"`,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return true when ems__Effort_day is set to tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const day = String(tomorrow.getDate()).padStart(2, "0");
      const tomorrowString = `${year}-${month}-${day}`;

      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_day: `"[[${tomorrowString}]]"`,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return false when ems__Effort_day is array with today", () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;

      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_day: [`"[[${todayString}]]"`],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(false);
    });

    it("should return true when ems__Effort_day is empty string", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_day: "",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return true when ems__Effort_day is null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_day: null,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });
  });

  describe("canStartEffort", () => {
    it("should return true for Task without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(true);
    });

    it("should return true for Task with Active status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusActive]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(true);
    });

    it("should return false for Task with Doing status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDoing]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(false);
    });

    it("should return false for Task with Done status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(false);
    });

    it("should return true for Project without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(true);
    });

    it("should return false for Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(false);
    });

    it("should return false for array with Doing status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: ["[[ems__EffortStatusActive]]", "[[ems__EffortStatusDoing]]"],
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(false);
    });
  });

  describe("canMarkDone", () => {
    it("should return true for Task without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(true);
    });

    it("should return true for Task with Active status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusActive]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(true);
    });

    it("should return false for Task with Done status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(false);
    });

    it("should return true for Project without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(true);
    });

    it("should return false for Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(false);
    });
  });

  describe("canArchiveTask", () => {
    it("should return true for Done Task not archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(true);
    });

    it("should return false for Done Task already archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: true,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(false);
    });

    it("should return false for Task without Done status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusActive]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(false);
    });

    it("should return true for Done Project not archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(true);
    });

    it("should return false for Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(false);
    });

    it("should recognize archived as string 'true'", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: "true" as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(false);
    });

    it("should recognize archived as string 'yes'", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: "yes" as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(false);
    });

    it("should recognize archived as number 1", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: 1 as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(false);
    });

    it("should return true for Trashed Task not archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusTrashed]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(true);
    });

    it("should return false for Trashed Task already archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusTrashed]]",
        metadata: {},
        isArchived: true,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(false);
    });

    it("should return true for Trashed Project not archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusTrashed]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(true);
    });
  });

  describe("canCleanProperties", () => {
    it("should return true when metadata has empty string", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: { prop1: "", prop2: "value" },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCleanProperties(context)).toBe(true);
    });

    it("should return true when metadata has null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: { prop1: null, prop2: "value" },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCleanProperties(context)).toBe(true);
    });

    it("should return true when metadata has undefined", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: { prop1: undefined, prop2: "value" },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCleanProperties(context)).toBe(true);
    });

    it("should return true when metadata has empty array", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: { prop1: [], prop2: "value" },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCleanProperties(context)).toBe(true);
    });

    it("should return true when metadata has empty object", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: { prop1: {}, prop2: "value" },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCleanProperties(context)).toBe(true);
    });

    it("should return false when metadata has no empty properties", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: { prop1: "value1", prop2: "value2" },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCleanProperties(context)).toBe(false);
    });

    it("should return false when metadata is empty", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCleanProperties(context)).toBe(false);
    });

    it("should return true for whitespace-only string", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: { prop1: "   ", prop2: "value" },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCleanProperties(context)).toBe(true);
    });
  });

  describe("canRepairFolder", () => {
    it("should return true when folders don't match", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "folder1",
        expectedFolder: "folder2",
      };
      expect(canRepairFolder(context)).toBe(true);
    });

    it("should return false when folders match", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "folder1",
        expectedFolder: "folder1",
      };
      expect(canRepairFolder(context)).toBe(false);
    });

    it("should return false when expectedFolder is null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "folder1",
        expectedFolder: null,
      };
      expect(canRepairFolder(context)).toBe(false);
    });

    it("should normalize paths with trailing slashes", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "folder1/",
        expectedFolder: "folder1",
      };
      expect(canRepairFolder(context)).toBe(false);
    });

    it("should detect mismatch when current has trailing slash", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "folder1/",
        expectedFolder: "folder2",
      };
      expect(canRepairFolder(context)).toBe(true);
    });

    it("should detect mismatch when expected has trailing slash", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "folder1",
        expectedFolder: "folder2/",
      };
      expect(canRepairFolder(context)).toBe(true);
    });
  });

  describe("canTrashEffort", () => {
    it("should return true for Task without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(true);
    });

    it("should return true for Task with Doing status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDoing]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(true);
    });

    it("should return false for Task with Done status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(false);
    });

    it("should return false for Task with Trashed status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusTrashed]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(false);
    });

    it("should return true for Project without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(true);
    });

    it("should return false for Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(false);
    });

    it("should return false for null instanceClass", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(false);
    });

    it("should handle array of statuses with Trashed", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: ["[[ems__EffortStatusTrashed]]"],
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(false);
    });

    it("should handle array of statuses with Done", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: ["[[ems__EffortStatusDone]]"],
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canTrashEffort(context)).toBe(false);
    });
  });
});
