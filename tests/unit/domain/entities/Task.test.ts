import { Task } from "../../../../src/domain/entities/Task";
import { TaskId } from "../../../../src/domain/value-objects/TaskId";
import { Priority } from "../../../../src/domain/value-objects/Priority";
import { TaskStatus } from "../../../../src/domain/value-objects/TaskStatus";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";

describe("Task", () => {
  describe("create", () => {
    it("should create a task with valid parameters", () => {
      const result = Task.create({
        title: "Test Task",
        description: "A test task",
        priority: Priority.high(),
      });

      expect(result.isSuccess).toBe(true);
      const task = result.getValue();
      expect(task.getTitle()).toBe("Test Task");
      expect(task.getDescription()).toBe("A test task");
      expect(task.getPriority().toString()).toBe("high");
      expect(task.getStatus().toString()).toBe("todo");
    });

    it("should create task with default values", () => {
      const result = Task.create({
        title: "Minimal Task",
      });

      expect(result.isSuccess).toBe(true);
      const task = result.getValue();
      expect(task.getTitle()).toBe("Minimal Task");
      expect(task.getPriority().toString()).toBe("medium");
      expect(task.getStatus().toString()).toBe("todo");
      expect(task.getTags()).toEqual([]);
    });

    it("should reject empty title", () => {
      const result = Task.create({
        title: "",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Task title cannot be empty");
    });

    it("should reject title that is too long", () => {
      const longTitle = "a".repeat(201);
      const result = Task.create({
        title: longTitle,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Task title cannot exceed 200 characters");
    });

    it("should reject negative estimated hours", () => {
      const result = Task.create({
        title: "Test Task",
        estimatedHours: -1,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Estimated hours cannot be negative");
    });

    it("should trim title", () => {
      const result = Task.create({
        title: "  Test Task  ",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().getTitle()).toBe("Test Task");
    });
  });

  describe("business methods", () => {
    let task: Task;

    beforeEach(() => {
      task = Task.create({
        title: "Test Task",
        description: "A test task",
      }).getValue();
    });

    describe("updateTitle", () => {
      it("should update title successfully", () => {
        const result = task.updateTitle("Updated Title");

        expect(result.isSuccess).toBe(true);
        expect(task.getTitle()).toBe("Updated Title");
      });

      it("should reject empty title", () => {
        const result = task.updateTitle("");

        expect(result.isFailure).toBe(true);
        expect(result.error).toBe("Task title cannot be empty");
      });
    });

    describe("updateStatus", () => {
      it("should update status with valid transition", () => {
        const result = task.updateStatus(TaskStatus.inProgress());

        expect(result.isSuccess).toBe(true);
        expect(task.getStatus().toString()).toBe("in-progress");
      });

      it("should set completion date when task is completed", () => {
        const beforeCompletion = new Date();
        const result = task.updateStatus(TaskStatus.done());

        expect(result.isSuccess).toBe(true);
        expect(task.getStatus().isCompleted()).toBe(true);
        expect(task.getCompletedAt()).toBeDefined();
        expect(task.getCompletedAt()!.getTime()).toBeGreaterThanOrEqual(
          beforeCompletion.getTime(),
        );
      });

      it("should clear completion date when task is reopened", () => {
        task.updateStatus(TaskStatus.done());
        expect(task.getCompletedAt()).toBeDefined();

        task.updateStatus(TaskStatus.todo());
        expect(task.getCompletedAt()).toBeUndefined();
      });
    });

    describe("project assignment", () => {
      it("should assign task to project", () => {
        const projectId = AssetId.generate();

        task.assignToProject(projectId);

        expect(task.getProjectId()).toBeDefined();
        expect(task.getProjectId()!.equals(projectId)).toBe(true);
      });

      it("should remove task from project", () => {
        const projectId = AssetId.generate();
        task.assignToProject(projectId);

        task.removeFromProject();

        expect(task.getProjectId()).toBeUndefined();
      });
    });

    describe("tag management", () => {
      it("should add tags", () => {
        task.addTag("urgent");
        task.addTag("backend");

        expect(task.getTags()).toContain("urgent");
        expect(task.getTags()).toContain("backend");
      });

      it("should normalize tag case", () => {
        task.addTag("URGENT");

        expect(task.getTags()).toContain("urgent");
        expect(task.hasTag("urgent")).toBe(true);
      });

      it("should not add duplicate tags", () => {
        task.addTag("urgent");
        task.addTag("urgent");

        expect(task.getTags().filter((tag) => tag === "urgent")).toHaveLength(
          1,
        );
      });

      it("should remove tags", () => {
        task.addTag("urgent");
        task.removeTag("urgent");

        expect(task.getTags()).not.toContain("urgent");
      });
    });
  });

  describe("query methods", () => {
    it("should identify overdue tasks", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const task = Task.create({
        title: "Overdue Task",
        dueDate: pastDate,
      }).getValue();

      expect(task.isOverdue()).toBe(true);
    });

    it("should identify tasks due today", () => {
      const today = new Date();

      const task = Task.create({
        title: "Due Today",
        dueDate: today,
      }).getValue();

      expect(task.isDueToday()).toBe(true);
    });

    it("should identify high priority tasks", () => {
      const highPriorityTask = Task.create({
        title: "High Priority",
        priority: Priority.high(),
      }).getValue();

      const mediumPriorityTask = Task.create({
        title: "Medium Priority",
        priority: Priority.medium(),
      }).getValue();

      expect(highPriorityTask.isHighPriority()).toBe(true);
      expect(mediumPriorityTask.isHighPriority()).toBe(false);
    });
  });

  describe("frontmatter serialization", () => {
    it("should serialize to frontmatter", () => {
      const projectId = AssetId.generate();
      const task = Task.create({
        title: "Test Task",
        description: "A test task",
        priority: Priority.high(),
        projectId: projectId,
        estimatedHours: 4,
        tags: ["urgent", "backend"],
      }).getValue();

      const frontmatter = task.toFrontmatter();

      expect(frontmatter["exo__Task_title"]).toBe("Test Task");
      expect(frontmatter["exo__Task_description"]).toBe("A test task");
      expect(frontmatter["exo__Task_priority"]).toBe("high");
      expect(frontmatter["exo__Task_status"]).toBe("todo");
      expect(frontmatter["exo__Effort_parent"]).toBe(
        `[[${projectId.toString()}]]`,
      );
      expect(frontmatter["exo__Task_estimatedHours"]).toBe(4);
      expect(frontmatter["exo__Task_tags"]).toEqual(["urgent", "backend"]);
    });

    it("should deserialize from frontmatter", () => {
      const projectId = AssetId.generate();
      const frontmatter = {
        exo__Task_uid: TaskId.generate().toString(),
        exo__Task_title: "Test Task",
        exo__Task_description: "A test task",
        exo__Task_priority: "high",
        exo__Task_status: "in-progress",
        exo__Effort_parent: `[[${projectId.toString()}]]`,
        exo__Task_estimatedHours: 4,
        exo__Task_tags: ["urgent", "backend"],
      };

      const task = Task.fromFrontmatter(frontmatter, "test-task.md");

      expect(task).not.toBeNull();
      expect(task!.getTitle()).toBe("Test Task");
      expect(task!.getDescription()).toBe("A test task");
      expect(task!.getPriority().toString()).toBe("high");
      expect(task!.getStatus().toString()).toBe("in-progress");
      expect(task!.getProjectId()!.toString()).toBe(projectId.toString());
      expect(task!.getEstimatedHours()).toBe(4);
      expect(task!.getTags()).toEqual(["urgent", "backend"]);
    });
  });

  describe("markdown generation", () => {
    it("should generate markdown content", () => {
      const task = Task.create({
        title: "Test Task",
        description: "A test task",
        priority: Priority.high(),
        tags: ["urgent"],
      }).getValue();

      const markdown = task.toMarkdown();

      expect(markdown).toContain("# Test Task");
      expect(markdown).toContain("A test task");
      expect(markdown).toContain("**Priority**: high");
      expect(markdown).toContain("**Status**: todo");
      expect(markdown).toContain("#urgent");
      expect(markdown).toContain("- [ ]"); // Todo checkbox
    });
  });

  describe("equals", () => {
    it("should return true for tasks with same ID", () => {
      const taskId = TaskId.generate();
      const task1 = Task.create({ title: "Task 1" }).getValue();
      const task2 = Task.create({ title: "Task 2" }).getValue();

      // Set same ID for both tasks
      (task1 as any).props.id = taskId;
      (task2 as any).props.id = taskId;

      expect(task1.equals(task2)).toBe(true);
    });

    it("should return false for tasks with different IDs", () => {
      const task1 = Task.create({ title: "Task 1" }).getValue();
      const task2 = Task.create({ title: "Task 2" }).getValue();

      expect(task1.equals(task2)).toBe(false);
    });
  });
});
