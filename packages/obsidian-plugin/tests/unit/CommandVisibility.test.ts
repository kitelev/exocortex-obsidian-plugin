import type { CommandVisibilityContext } from "@exocortex/core";
import {
  canCreateTask,
  canCreateProject,
  canCreateEvent,
  canCreateChildArea,
  canCreateInstance,
  canMoveToBacklog,
  canMoveToAnalysis,
  canMoveToToDo,
  canStartEffort,
  canPlanOnToday,
  canMarkDone,
  canTrashEffort,
  canArchiveTask,
  canCleanProperties,
  canRepairFolder,
  canRenameToUid,
  canVoteOnEffort,
  canRollbackStatus,
  canCreateRelatedTask,
  canCopyLabelToAliases,
  canConvertTaskToProject,
  canConvertProjectToTask,
  canCreateTaskForDailyNote,
  canCreateSubclass,
  AssetClass,
} from "@exocortex/core";

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

  describe("canCreateProject", () => {
    it("should return true for ems__Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateProject(context)).toBe(true);
    });

    it("should return true for ems__Initiative", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Initiative]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateProject(context)).toBe(true);
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
      expect(canCreateProject(context)).toBe(true);
    });

    it("should return true for Initiative without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "ems__Initiative",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateProject(context)).toBe(true);
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
      expect(canCreateProject(context)).toBe(false);
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
      expect(canCreateProject(context)).toBe(true);
    });

    it("should return true for Project without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "ems__Project",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateProject(context)).toBe(true);
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
      expect(canCreateProject(context)).toBe(false);
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
      expect(canCreateProject(context)).toBe(true);
    });

    it("should return true for array with ems__Initiative", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__Initiative]]", "[[SomeOtherClass]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateProject(context)).toBe(true);
    });
  });

  describe("canCreateChildArea", () => {
    it("should return true for ems__Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateChildArea(context)).toBe(true);
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
      expect(canCreateChildArea(context)).toBe(true);
    });

    it("should return false for ems__Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateChildArea(context)).toBe(false);
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
      expect(canCreateChildArea(context)).toBe(false);
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
      expect(canCreateChildArea(context)).toBe(false);
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
      expect(canCreateChildArea(context)).toBe(true);
    });
  });

  describe("canCreateEvent", () => {
    it("should return true for ems__Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateEvent(context)).toBe(true);
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
      expect(canCreateEvent(context)).toBe(true);
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
      expect(canCreateEvent(context)).toBe(true);
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
      expect(canCreateEvent(context)).toBe(false);
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
      expect(canCreateEvent(context)).toBe(false);
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
      expect(canCreateEvent(context)).toBe(true);
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

    it("should return false when ems__Effort_plannedStartTimestamp is set to today", () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;

      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_plannedStartTimestamp: `${todayString}T00:00:00`,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(false);
    });

    it("should return false when ems__Effort_plannedStartTimestamp is set to today with different time", () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;

      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_plannedStartTimestamp: `${todayString}T19:00:00`,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(false);
    });

    it("should return true when ems__Effort_plannedStartTimestamp is set to yesterday", () => {
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
          ems__Effort_plannedStartTimestamp: `${yesterdayString}T00:00:00`,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return true when ems__Effort_plannedStartTimestamp is set to tomorrow", () => {
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
          ems__Effort_plannedStartTimestamp: `${tomorrowString}T00:00:00`,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return false when ems__Effort_plannedStartTimestamp is array with today", () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;

      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_plannedStartTimestamp: [`${todayString}T00:00:00`],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(false);
    });

    it("should return true when ems__Effort_plannedStartTimestamp is empty string", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_plannedStartTimestamp: "",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });

    it("should return true when ems__Effort_plannedStartTimestamp is null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          ems__Effort_plannedStartTimestamp: null,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canPlanOnToday(context)).toBe(true);
    });
  });

  describe("canMoveToBacklog", () => {
    it("should return true for Task with Draft status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDraft]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToBacklog(context)).toBe(true);
    });

    it("should return true for Project with Draft status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusDraft]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToBacklog(context)).toBe(true);
    });

    it("should return false for Task with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToBacklog(context)).toBe(false);
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
      expect(canMoveToBacklog(context)).toBe(false);
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
      expect(canMoveToBacklog(context)).toBe(false);
    });

    it("should return false for Task without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToBacklog(context)).toBe(false);
    });

    it("should return false for Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: "[[ems__EffortStatusDraft]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToBacklog(context)).toBe(false);
    });
  });

  describe("canMoveToAnalysis", () => {
    it("should return true for Project with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToAnalysis(context)).toBe(true);
    });

    it("should return false for Project with Draft status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusDraft]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToAnalysis(context)).toBe(false);
    });

    it("should return false for Task with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToAnalysis(context)).toBe(false);
    });
  });

  describe("canMoveToToDo", () => {
    it("should return true for Project with Analysis status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusAnalysis]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToToDo(context)).toBe(true);
    });

    it("should return false for Project with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToToDo(context)).toBe(false);
    });

    it("should return false for Task with Analysis status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusAnalysis]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMoveToToDo(context)).toBe(false);
    });
  });

  describe("canStartEffort", () => {
    it("should return true for Task with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(true);
    });

    it("should return false for Project with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(false);
    });

    it("should return true for Project with ToDo status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusToDo]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(true);
    });

    it("should return false for Task with Draft status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDraft]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(false);
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

    it("should return false for Task without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(false);
    });

    it("should return false for Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canStartEffort(context)).toBe(false);
    });
  });

  describe("canMarkDone", () => {
    it("should return true for Task with Doing status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDoing]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(true);
    });

    it("should return true for Project with Doing status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusDoing]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(true);
    });

    it("should return false for Task with Draft status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDraft]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(false);
    });

    it("should return false for Task with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(false);
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

    it("should return false for Task without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(false);
    });

    it("should return false for Area", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: "[[ems__EffortStatusDoing]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canMarkDone(context)).toBe(false);
    });
  });

  describe("canArchiveTask", () => {
    it("should return true for any asset not archived", () => {
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

    it("should return false for already archived asset", () => {
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

    it("should return true for Task with any status not archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusActive]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(true);
    });

    it("should return true for Project not archived", () => {
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

    it("should return true for Area not archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(true);
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

    it("should return true for asset without instanceClass", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(true);
    });

    it("should return false for archived asset without instanceClass", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {},
        isArchived: true,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canArchiveTask(context)).toBe(false);
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

  describe("canVoteOnEffort", () => {
    it("should return true for Task with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
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
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should return true for Task with Done status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should return true for Task without status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should return true for Project with ToDo status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusToDo]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should return true for Project with Doing status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusDoing]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should return true for Project with Done status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should return false for archived Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: true,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(false);
    });

    it("should return false for archived Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusToDo]]",
        metadata: {},
        isArchived: true,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(false);
    });

    it("should return false for non-effort asset (Area)", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(false);
    });

    it("should return true for Meeting", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Meeting]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
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
      expect(canVoteOnEffort(context)).toBe(false);
    });

    it("should handle Task class without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "ems__Task",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should handle Project class without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "ems__Project",
        currentStatus: "[[ems__EffortStatusToDo]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should recognize archived as string 'true'", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: "true" as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(false);
    });

    it("should recognize archived as string 'yes'", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: "yes" as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(false);
    });

    it("should recognize archived as number 1", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: 1 as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(false);
    });

    it("should handle array of classes with Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__Task]]", "[[SomeOtherClass]]"],
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should handle array of classes with Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__Project]]", "[[SomeOtherClass]]"],
        currentStatus: "[[ems__EffortStatusToDo]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should return false for array of classes without Task or Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__Area]]", "[[SomeOtherClass]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(false);
    });

    it("should return true for Task with existing votes", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: { ems__Effort_votes: 5 },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });

    it("should return true for Project with existing votes", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusToDo]]",
        metadata: { ems__Effort_votes: 10 },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canVoteOnEffort(context)).toBe(true);
    });
  });

  describe("canRollbackStatus", () => {
    it("should return false for non-Effort assets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Area]]",
        currentStatus: "[[ems__EffortStatusDoing]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(false);
    });

    it("should return false for archived Efforts", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDoing]]",
        metadata: {},
        isArchived: true,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(false);
    });

    it("should return false when currentStatus is null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(false);
    });

    it("should return false when status is Trashed", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusTrashed]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(false);
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
      expect(canRollbackStatus(context)).toBe(true);
    });

    it("should return true for Task with Backlog status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(true);
    });

    it("should return true for Task with Draft status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDraft]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(true);
    });

    it("should return true for Task with Done status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(true);
    });

    it("should return true for Project with ToDo status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusToDo]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(true);
    });

    it("should return true for Project with Analysis status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusAnalysis]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(true);
    });

    it("should return true for Meeting with Done status", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Meeting]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(true);
    });

    it("should handle array currentStatus correctly", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: ["[[ems__EffortStatusDoing]]"],
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(true);
    });

    it("should return false for array currentStatus with Trashed", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: ["[[ems__EffortStatusTrashed]]"],
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canRollbackStatus(context)).toBe(false);
    });
  });

  describe("canCreateRelatedTask", () => {
    it("should return true for ems__Task not archived", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusBacklog]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(true);
    });

    it("should return true for ems__Task without brackets", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "ems__Task",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(true);
    });

    it("should return false for archived ems__Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: "[[ems__EffortStatusDone]]",
        metadata: {},
        isArchived: true,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(false);
    });

    it("should return false for ems__Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: "[[ems__EffortStatusToDo]]",
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(false);
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
      expect(canCreateRelatedTask(context)).toBe(false);
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
      expect(canCreateRelatedTask(context)).toBe(false);
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
      expect(canCreateRelatedTask(context)).toBe(true);
    });

    it("should return false for array without ems__Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: ["[[ems__Project]]", "[[ems__Area]]"],
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(false);
    });

    it("should recognize archived as string 'true'", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: "true" as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(false);
    });

    it("should recognize archived as string 'yes'", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: "yes" as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(false);
    });

    it("should recognize archived as number 1", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: 1 as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(false);
    });

    it("should show button when archived is false string", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: "false" as any,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateRelatedTask(context)).toBe(true);
    });
  });

  describe("canCopyLabelToAliases", () => {
    it("should return true when label exists and no aliases", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          exo__Asset_label: "My Label",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(true);
    });

    it("should return true when label exists and aliases is empty array", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          exo__Asset_label: "My Label",
          aliases: [],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(true);
    });

    it("should return true when label exists and aliases don't contain it", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          exo__Asset_label: "My Label",
          aliases: ["Other Alias", "Another Alias"],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(true);
    });

    it("should return false when label exists and aliases already contain it", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          exo__Asset_label: "My Label",
          aliases: ["Other Alias", "My Label"],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(false);
    });

    it("should return false when label is missing", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          aliases: ["Some Alias"],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(false);
    });

    it("should return false when label is empty string", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          exo__Asset_label: "",
          aliases: [],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(false);
    });

    it("should return false when label is whitespace only", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          exo__Asset_label: "   ",
          aliases: [],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(false);
    });

    it("should handle label with leading/trailing whitespace", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          exo__Asset_label: "  My Label  ",
          aliases: ["My Label"],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(false);
    });

    it("should return true when aliases is not an array", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {
          exo__Asset_label: "My Label",
          aliases: "not an array" as any,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCopyLabelToAliases(context)).toBe(true);
    });
  });

  describe("canConvertTaskToProject", () => {
    it("should return true for ems__Task", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Task]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canConvertTaskToProject(context)).toBe(true);
    });

    it("should return false for ems__Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canConvertTaskToProject(context)).toBe(false);
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
      expect(canConvertTaskToProject(context)).toBe(false);
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
      expect(canConvertTaskToProject(context)).toBe(false);
    });
  });

  describe("canConvertProjectToTask", () => {
    it("should return true for ems__Project", () => {
      const context: CommandVisibilityContext = {
        instanceClass: "[[ems__Project]]",
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canConvertProjectToTask(context)).toBe(true);
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
      expect(canConvertProjectToTask(context)).toBe(false);
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
      expect(canConvertProjectToTask(context)).toBe(false);
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
      expect(canConvertProjectToTask(context)).toBe(false);
    });
  });

  describe("canCreateTaskForDailyNote", () => {
    it("should return true for DailyNote with past date", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "2020-01-01",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should return true for DailyNote with today's date", () => {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: dateStr,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should return false for DailyNote with future date", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;

      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: futureStr,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
    });

    it("should return false for non-DailyNote asset", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.AREA,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "2025-11-11",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
    });

    it("should return false when pn__DailyNote_day is missing", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {},
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
    });

    it("should handle wiki-link format for day property", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "[[2025-11-11]]",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should handle quoted wiki-link format for day property", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: '"[[2025-11-11]]"',
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should handle array format for day property", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: ["[[2025-11-11]]"],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should handle array with plain string for day property", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: ["2025-11-11"],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should return false when instanceClass is null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: null,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "2025-11-11",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
    });

    it("should return false when day property is empty string", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
    });

    it("should return false when day property is empty array", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: [],
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
    });

    it("should handle instanceClass as array", () => {
      const context: CommandVisibilityContext = {
        instanceClass: [AssetClass.DAILY_NOTE],
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "2025-11-11",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should handle day property with extra whitespace", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "  2020-01-01  ",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should return false when day property is null", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: null,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
    });

    it("should return false when day property is undefined", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: undefined,
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
    });

    it("should handle mixed case instance class array", () => {
      const context: CommandVisibilityContext = {
        instanceClass: [AssetClass.AREA, AssetClass.DAILY_NOTE],
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "2020-01-01",
        },
        isArchived: false,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(true);
    });

    it("should return false for archived DailyNote", () => {
      const context: CommandVisibilityContext = {
        instanceClass: AssetClass.DAILY_NOTE,
        currentStatus: null,
        metadata: {
          pn__DailyNote_day: "2020-01-01",
        },
        isArchived: true,
        currentFolder: "",
        expectedFolder: null,
      };
      expect(canCreateTaskForDailyNote(context)).toBe(false);
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
