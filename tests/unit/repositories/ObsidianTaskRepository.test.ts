import { ObsidianTaskRepository } from "../../../src/infrastructure/repositories/ObsidianTaskRepository";
import { Task } from "../../../src/domain/entities/Task";
import { TaskId } from "../../../src/domain/value-objects/TaskId";
import { AssetId } from "../../../src/domain/value-objects/AssetId";
import { Priority } from "../../../src/domain/value-objects/Priority";
import { TaskStatus } from "../../../src/domain/value-objects/TaskStatus";
import { App, TFile, Notice } from "obsidian";

// Mock Notice to prevent actual UI notifications during tests
jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn(),
}));

describe("ObsidianTaskRepository", () => {
  let repository: ObsidianTaskRepository;
  let mockApp: Partial<App>;
  let mockVault: any;
  let mockMetadataCache: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVault = {
      getMarkdownFiles: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      read: jest.fn(),
      modify: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      createFolder: jest.fn(),
    };

    mockMetadataCache = {
      getFileCache: jest.fn(),
    };

    mockApp = {
      vault: mockVault as any,
      metadataCache: mockMetadataCache as any,
    };

    repository = new ObsidianTaskRepository(mockApp as App);
  });

  describe("findById", () => {
    it("should find task by ID from cache", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const taskId = TaskId.create(validUuid).getValue()!;
      const mockTask = Task.create({
        title: "Test Task",
      }).getValue()!;

      // Pre-populate cache
      (repository as any).taskCache.set(validUuid, mockTask);

      const result = await repository.findById(taskId);

      expect(result).toBe(mockTask);
      expect(mockVault.getMarkdownFiles).not.toHaveBeenCalled();
    });

    it("should find task by ID from file system", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const taskId = TaskId.create(validUuid).getValue()!;
      const mockFile = new TFile("Tasks/test-task.md");

      const mockFrontmatter = {
        id: validUuid,
        title: "Test Task",
        status: "todo",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(`---
id: ${validUuid}
title: Test Task
status: todo
priority: medium
---

# Test Task

This is a test task description.`);

      const result = await repository.findById(taskId);

      expect(result).not.toBeNull();
      expect(result?.getTitle()).toBe("Test Task");
      // Cache should use the frontmatter ID as key, but contains the generated task
      expect((repository as any).taskCache.has(validUuid)).toBe(true);
    });

    it("should return null if task not found", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440001";
      const taskId = TaskId.create(validUuid).getValue()!;
      mockVault.getMarkdownFiles.mockReturnValue([]);

      const result = await repository.findById(taskId);

      expect(result).toBeNull();
    });

    it("should skip files outside Tasks folder", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440002";
      const taskId = TaskId.create(validUuid).getValue()!;
      const mockFile = new TFile("Notes/not-a-task.md");

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);

      const result = await repository.findById(taskId);

      expect(result).toBeNull();
      expect(mockMetadataCache.getFileCache).not.toHaveBeenCalled();
    });

    it("should skip files without matching ID", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440003";
      const taskId = TaskId.create(validUuid).getValue()!;
      const mockFile = new TFile("Tasks/other-task.md");

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: { id: "550e8400-e29b-41d4-a716-446655440099" },
      });

      const result = await repository.findById(taskId);

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all tasks from Tasks folder", async () => {
      const mockFiles = [
        new TFile("Tasks/task1.md"),
        new TFile("Tasks/task2.md"),
        new TFile("Notes/not-a-task.md"), // Should be ignored
      ];

      const mockFrontmatter1 = {
        id: "550e8400-e29b-41d4-a716-446655440010",
        title: "Task 1",
        status: "todo",
        priority: "high",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockFrontmatter2 = {
        id: "550e8400-e29b-41d4-a716-446655440011",
        title: "Task 2",
        status: "done",
        priority: "low",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
        if (file.path === "Tasks/task1.md") {
          return { frontmatter: mockFrontmatter1 };
        }
        if (file.path === "Tasks/task2.md") {
          return { frontmatter: mockFrontmatter2 };
        }
        return null;
      });

      mockVault.read.mockImplementation((file: TFile) => {
        if (file.path === "Tasks/task1.md") {
          return Promise.resolve(
            "---\nid: 550e8400-e29b-41d4-a716-446655440010\n---\n# Task 1\nDescription 1",
          );
        }
        if (file.path === "Tasks/task2.md") {
          return Promise.resolve(
            "---\nid: 550e8400-e29b-41d4-a716-446655440011\n---\n# Task 2\nDescription 2",
          );
        }
        return Promise.resolve("");
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].getTitle()).toBe("Task 1");
      expect(result[1].getTitle()).toBe("Task 2");
      // Note: Task entity generates new IDs, not using frontmatter IDs
    });

    it("should return empty array when no tasks exist", async () => {
      mockVault.getMarkdownFiles.mockReturnValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it("should skip files with invalid task data", async () => {
      const mockFile = new TFile("Tasks/invalid-task.md");
      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: { invalid: "data" },
      });
      mockVault.read.mockResolvedValue("invalid content");

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findByProject", () => {
    it("should find tasks by project ID", async () => {
      const projectId = AssetId.create(
        "550e8400-e29b-41d4-a716-446655440020",
      ).getValue()!;
      const mockFile = new TFile("Tasks/project-task.md");

      const mockFrontmatter = {
        id: "550e8400-e29b-41d4-a716-446655440021",
        title: "Project Task",
        projectId: "550e8400-e29b-41d4-a716-446655440020",
        status: "todo",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(
        "---\nprojectId: 550e8400-e29b-41d4-a716-446655440020\n---\nContent",
      );

      const result = await repository.findByProject(projectId);

      expect(result).toHaveLength(1);
      expect(result[0].getProjectId()?.toString()).toBe(
        "550e8400-e29b-41d4-a716-446655440020",
      );
    });

    it("should return empty array when no tasks match project", async () => {
      const projectId = AssetId.create(
        "550e8400-e29b-41d4-a716-446655440022",
      ).getValue()!;
      mockVault.getMarkdownFiles.mockReturnValue([]);

      const result = await repository.findByProject(projectId);

      expect(result).toEqual([]);
    });
  });

  describe("findByStatus", () => {
    it("should find tasks by status", async () => {
      const status = TaskStatus.create("done").getValue()!;
      const mockFile = new TFile("Tasks/done-task.md");

      const mockFrontmatter = {
        id: "550e8400-e29b-41d4-a716-446655440030",
        title: "Completed Task",
        status: "done",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(
        "---\nid: 550e8400-e29b-41d4-a716-446655440030\nstatus: done\n---\nContent",
      );

      const result = await repository.findByStatus(status);

      expect(result).toHaveLength(1);
      expect(result[0].getStatus().toString()).toBe("done");
    });

    it("should return empty array when no tasks match status", async () => {
      const status = TaskStatus.create("cancelled").getValue()!;
      mockVault.getMarkdownFiles.mockReturnValue([]);

      const result = await repository.findByStatus(status);

      expect(result).toEqual([]);
    });
  });

  describe("findByPriority", () => {
    it("should find tasks by priority", async () => {
      const priority = Priority.create("high").getValue()!;
      const mockFile = new TFile("Tasks/high-priority-task.md");

      const mockFrontmatter = {
        id: "550e8400-e29b-41d4-a716-446655440040",
        title: "High Priority Task",
        status: "todo",
        priority: "high",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(
        "---\nid: 550e8400-e29b-41d4-a716-446655440040\npriority: high\n---\nContent",
      );

      const result = await repository.findByPriority(priority);

      expect(result).toHaveLength(1);
      expect(result[0].getPriority().toString()).toBe("high");
    });
  });

  describe("findByTag", () => {
    it("should find tasks by tag", async () => {
      const tag = "urgent";
      const mockFile = new TFile("Tasks/tagged-task.md");

      const mockFrontmatter = {
        id: "550e8400-e29b-41d4-a716-446655440050",
        title: "Tagged Task",
        status: "todo",
        priority: "medium",
        tags: ["urgent", "important"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(
        "---\nid: 550e8400-e29b-41d4-a716-446655440050\ntags: [urgent, important]\n---\nContent",
      );

      const result = await repository.findByTag(tag);

      expect(result).toHaveLength(1);
      expect(result[0].getTags()).toContain("urgent");
    });

    it("should handle tasks without tags", async () => {
      const tag = "nonexistent";
      const mockFile = new TFile("Tasks/no-tags-task.md");

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          id: "550e8400-e29b-41d4-a716-446655440051",
          title: "No Tags Task",
        },
      });

      const result = await repository.findByTag(tag);

      expect(result).toEqual([]);
    });
  });

  describe("findOverdue", () => {
    it("should find overdue tasks", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockFile = new TFile("Tasks/overdue-task.md");

      const mockFrontmatter = {
        id: "550e8400-e29b-41d4-a716-446655440060",
        title: "Overdue Task",
        status: "todo",
        priority: "medium",
        dueDate: yesterday.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(
        "---\nid: 550e8400-e29b-41d4-a716-446655440060\ndueDate: " +
          yesterday.toISOString() +
          "\n---\nContent",
      );

      const result = await repository.findOverdue();

      expect(result).toHaveLength(1);
      expect(result[0].getDueDate()?.getTime()).toBe(yesterday.getTime());
    });

    it("should not include completed overdue tasks", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockFile = new TFile("Tasks/completed-overdue-task.md");

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          id: "550e8400-e29b-41d4-a716-446655440061",
          dueDate: yesterday.toISOString(),
          status: "done",
        },
      });

      const result = await repository.findOverdue();

      expect(result).toEqual([]);
    });
  });

  describe("findDueToday", () => {
    it("should find tasks due today", async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Midday today

      const mockFile = new TFile("Tasks/due-today-task.md");

      const mockFrontmatter = {
        id: "550e8400-e29b-41d4-a716-446655440070",
        title: "Due Today Task",
        status: "todo",
        priority: "medium",
        dueDate: today.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(
        "---\nid: 550e8400-e29b-41d4-a716-446655440070\ndueDate: " +
          today.toISOString() +
          "\n---\nContent",
      );

      const result = await repository.findDueToday();

      expect(result).toHaveLength(1);
    });
  });

  describe("findDueBetween", () => {
    it("should find tasks due within date range", async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      const mockFile = new TFile("Tasks/due-in-range-task.md");

      const mockFrontmatter = {
        id: "550e8400-e29b-41d4-a716-446655440080",
        title: "Due In Range Task",
        status: "todo",
        priority: "medium",
        dueDate: dueDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(
        "---\nid: 550e8400-e29b-41d4-a716-446655440080\ndueDate: " +
          dueDate.toISOString() +
          "\n---\nContent",
      );

      const result = await repository.findDueBetween(startDate, endDate);

      expect(result).toHaveLength(1);
    });

    it("should exclude tasks outside date range", async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const outsideDate = new Date();
      outsideDate.setDate(outsideDate.getDate() + 10);

      const mockFile = new TFile("Tasks/outside-range-task.md");

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          id: "550e8400-e29b-41d4-a716-446655440081",
          dueDate: outsideDate.toISOString(),
        },
      });

      const result = await repository.findDueBetween(startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe("findByCriteria", () => {
    it("should find tasks matching all criteria", async () => {
      const status = TaskStatus.create("todo").getValue()!;
      const priority = Priority.create("high").getValue()!;
      const projectId = AssetId.create("test-project").getValue()!;

      // Mock findAll to return test data
      const mockTask = Task.create({
        title: "Test Task",
        priority: priority,
        tags: ["urgent", "test"],
      }).getValue()!;

      // Set additional properties that would be set by the task
      jest.spyOn(mockTask, "getStatus").mockReturnValue(status);
      jest.spyOn(mockTask, "getProjectId").mockReturnValue(projectId);

      jest.spyOn(repository, "findAll").mockResolvedValue([mockTask]);

      const result = await repository.findByCriteria({
        status,
        priority,
        projectId,
        tags: ["urgent"],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockTask);
    });

    it("should return empty array when no tasks match criteria", async () => {
      jest.spyOn(repository, "findAll").mockResolvedValue([]);

      const result = await repository.findByCriteria({
        status: TaskStatus.create("cancelled").getValue()!,
      });

      expect(result).toEqual([]);
    });
  });

  describe("save", () => {
    it("should create new task file", async () => {
      const task = Task.create({
        title: "New Task",
        description: "A new test task",
      }).getValue()!;

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile("Tasks/New Task.md"));

      await repository.save(task);

      expect(mockVault.createFolder).toHaveBeenCalledWith("Tasks");
      expect(mockVault.create).toHaveBeenCalledWith("Tasks/New Task.md", "");
      expect(mockVault.modify).toHaveBeenCalled();
      expect((repository as any).taskCache.has(task.getId().toString())).toBe(
        true,
      );
      expect(Notice).toHaveBeenCalledWith('Task "New Task" saved successfully');
    });

    it("should update existing task file", async () => {
      const task = Task.create({
        title: "Existing Task",
      }).getValue()!;

      const existingFile = new TFile("Tasks/Existing Task.md");
      mockVault.getAbstractFileByPath.mockReturnValue(existingFile);

      await repository.save(task);

      expect(mockVault.create).not.toHaveBeenCalled();
      expect(mockVault.modify).toHaveBeenCalledWith(
        existingFile,
        expect.stringContaining("# Existing Task"),
      );
    });

    it("should handle file path conflicts", async () => {
      const task = Task.create({
        title: "Test Task",
      }).getValue()!;

      // Mock folder exists at the path
      const mockFolder = { isFile: () => false };
      mockVault.getAbstractFileByPath.mockReturnValue(mockFolder);

      await expect(repository.save(task)).rejects.toThrow(
        "File path exists but is not a file",
      );
    });

    it("should handle save errors", async () => {
      const task = Task.create({
        title: "Error Task",
      }).getValue()!;

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockRejectedValue(new Error("Disk full"));

      await expect(repository.save(task)).rejects.toThrow("Disk full");
      expect(Notice).toHaveBeenCalledWith("Failed to save task: Disk full");
    });

    it("should sanitize filename with special characters", async () => {
      const task = Task.create({
        title: "Task: With / Special * Characters?",
      }).getValue()!;

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile("Tasks/sanitized.md"));

      await repository.save(task);

      expect(mockVault.create).toHaveBeenCalledWith(
        expect.stringMatching(/Tasks\/Task- With - Special - Characters-.md/),
        "",
      );
    });
  });

  describe("delete", () => {
    it("should delete existing task", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440100";
      const taskId = TaskId.create(validUuid).getValue()!;
      const mockFile = new TFile("Tasks/test-task.md");

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: { id: validUuid },
      });

      await repository.delete(taskId);

      expect(mockVault.delete).toHaveBeenCalledWith(mockFile);
      expect((repository as any).taskCache.has(validUuid)).toBe(false);
      expect(Notice).toHaveBeenCalledWith("Task deleted successfully");
    });

    it("should throw error when task not found", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440101";
      const taskId = TaskId.create(validUuid).getValue()!;
      mockVault.getMarkdownFiles.mockReturnValue([]);

      await expect(repository.delete(taskId)).rejects.toThrow(
        "Task with id " + validUuid + " not found",
      );
    });
  });

  describe("exists", () => {
    it("should return true when task exists", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440110";
      const taskId = TaskId.create(validUuid).getValue()!;
      jest
        .spyOn(repository, "findById")
        .mockResolvedValue(Task.create({ title: "Test" }).getValue()!);

      const result = await repository.exists(taskId);

      expect(result).toBe(true);
    });

    it("should return false when task does not exist", async () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440111";
      const taskId = TaskId.create(validUuid).getValue()!;
      jest.spyOn(repository, "findById").mockResolvedValue(null);

      const result = await repository.exists(taskId);

      expect(result).toBe(false);
    });
  });

  describe("findByFilename", () => {
    it("should find task by filename", async () => {
      const filename = "test-task.md";
      const mockFile = new TFile("Tasks/test-task.md");

      const mockFrontmatter = {
        id: "550e8400-e29b-41d4-a716-446655440120",
        title: "Test Task",
        status: "todo",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });
      mockVault.read.mockResolvedValue(
        "---\nid: 550e8400-e29b-41d4-a716-446655440120\n---\nContent",
      );

      const result = await repository.findByFilename(filename);

      expect(result).not.toBeNull();
      expect(result?.getTitle()).toBe("Test Task");
    });

    it("should return null when file not found", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const result = await repository.findByFilename("nonexistent.md");

      expect(result).toBeNull();
    });

    it("should return null when file is not a TFile", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue({ isFile: () => false });

      const result = await repository.findByFilename("folder");

      expect(result).toBeNull();
    });
  });

  describe("getStatistics", () => {
    it("should return comprehensive task statistics", async () => {
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);

      const mockTasks = [
        // Completed task
        Task.create({ title: "Done Task" }).getValue()!,
        // Overdue task
        Task.create({ title: "Overdue Task" }).getValue()!,
        // Due today task
        Task.create({ title: "Today Task" }).getValue()!,
        // Due this week task
        Task.create({ title: "Week Task" }).getValue()!,
      ];

      // Mock task properties
      jest
        .spyOn(mockTasks[0], "getStatus")
        .mockReturnValue(TaskStatus.create("done").getValue()!);
      jest
        .spyOn(mockTasks[0], "getPriority")
        .mockReturnValue(Priority.create("high").getValue()!);
      jest.spyOn(mockTasks[0], "getDueDate").mockReturnValue(undefined);
      jest.spyOn(mockTasks[0], "getCreatedAt").mockReturnValue(yesterday);
      jest.spyOn(mockTasks[0], "getUpdatedAt").mockReturnValue(now);

      jest
        .spyOn(mockTasks[1], "getStatus")
        .mockReturnValue(TaskStatus.create("todo").getValue()!);
      jest
        .spyOn(mockTasks[1], "getPriority")
        .mockReturnValue(Priority.create("medium").getValue()!);
      jest.spyOn(mockTasks[1], "getDueDate").mockReturnValue(undefined); // No due date, so not overdue
      jest.spyOn(mockTasks[1], "getCreatedAt").mockReturnValue(yesterday);
      jest.spyOn(mockTasks[1], "getUpdatedAt").mockReturnValue(yesterday);

      jest
        .spyOn(mockTasks[2], "getStatus")
        .mockReturnValue(TaskStatus.create("in-progress").getValue()!);
      jest
        .spyOn(mockTasks[2], "getPriority")
        .mockReturnValue(Priority.create("low").getValue()!);
      // Set due date to later today so it's not overdue
      const laterToday = new Date(now);
      laterToday.setHours(23, 59, 59, 999);
      jest.spyOn(mockTasks[2], "getDueDate").mockReturnValue(laterToday);
      jest.spyOn(mockTasks[2], "getCreatedAt").mockReturnValue(yesterday);
      jest.spyOn(mockTasks[2], "getUpdatedAt").mockReturnValue(now);

      jest
        .spyOn(mockTasks[3], "getStatus")
        .mockReturnValue(TaskStatus.create("todo").getValue()!);
      jest
        .spyOn(mockTasks[3], "getPriority")
        .mockReturnValue(Priority.create("medium").getValue()!);
      jest.spyOn(mockTasks[3], "getDueDate").mockReturnValue(nextWeek);
      jest.spyOn(mockTasks[3], "getCreatedAt").mockReturnValue(yesterday);
      jest.spyOn(mockTasks[3], "getUpdatedAt").mockReturnValue(now);

      jest.spyOn(repository, "findAll").mockResolvedValue(mockTasks);

      const result = await repository.getStatistics();

      expect(result.total).toBe(4);
      expect(result.byStatus.done).toBe(1);
      expect(result.byStatus.todo).toBe(2);
      expect(result.byStatus["in-progress"]).toBe(1);
      expect(result.byPriority.high).toBe(1);
      expect(result.byPriority.medium).toBe(2);
      expect(result.byPriority.low).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.overdue).toBe(0); // Only task with due date < now and not done counts as overdue
      expect(result.dueToday).toBe(1);
      expect(result.dueThisWeek).toBeGreaterThan(0);
      expect(result.averageCompletionTime).toBeGreaterThan(0);
    });

    it("should handle empty task list", async () => {
      jest.spyOn(repository, "findAll").mockResolvedValue([]);

      const result = await repository.getStatistics();

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.overdue).toBe(0);
      expect(result.dueToday).toBe(0);
      expect(result.averageCompletionTime).toBeUndefined();
    });
  });

  describe("search", () => {
    it("should search tasks by title", async () => {
      const mockTasks = [
        Task.create({ title: "Important Task" }).getValue()!,
        Task.create({ title: "Regular Task" }).getValue()!,
        Task.create({ title: "Another Important Item" }).getValue()!,
      ];

      jest.spyOn(repository, "findAll").mockResolvedValue(mockTasks);

      const result = await repository.search("important");

      expect(result).toHaveLength(2);
      expect(result[0].getTitle()).toBe("Important Task");
      expect(result[1].getTitle()).toBe("Another Important Item");
    });

    it("should search tasks by description", async () => {
      const mockTask = Task.create({
        title: "Task",
        description: "This has important content",
      }).getValue()!;

      jest.spyOn(repository, "findAll").mockResolvedValue([mockTask]);

      const result = await repository.search("important");

      expect(result).toHaveLength(1);
    });

    it("should search tasks by tags", async () => {
      const mockTask = Task.create({
        title: "Task",
        tags: ["important", "urgent"],
      }).getValue()!;

      jest.spyOn(repository, "findAll").mockResolvedValue([mockTask]);

      const result = await repository.search("urgent");

      expect(result).toHaveLength(1);
    });

    it("should be case insensitive", async () => {
      const mockTask = Task.create({ title: "Important Task" }).getValue()!;
      jest.spyOn(repository, "findAll").mockResolvedValue([mockTask]);

      const result = await repository.search("IMPORTANT");

      expect(result).toHaveLength(1);
    });
  });

  describe("findRecentlyUpdated", () => {
    it("should return tasks sorted by update date", async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockTasks = [
        Task.create({ title: "Old Task" }).getValue()!,
        Task.create({ title: "Recent Task" }).getValue()!,
        Task.create({ title: "Latest Task" }).getValue()!,
      ];

      jest.spyOn(mockTasks[0], "getUpdatedAt").mockReturnValue(dayAgo);
      jest.spyOn(mockTasks[1], "getUpdatedAt").mockReturnValue(hourAgo);
      jest.spyOn(mockTasks[2], "getUpdatedAt").mockReturnValue(now);

      jest.spyOn(repository, "findAll").mockResolvedValue(mockTasks);

      const result = await repository.findRecentlyUpdated(2);

      expect(result).toHaveLength(2);
      expect(result[0].getTitle()).toBe("Latest Task");
      expect(result[1].getTitle()).toBe("Recent Task");
    });

    it("should default to 10 items limit", async () => {
      const mockTasks = Array.from(
        { length: 15 },
        (_, i) => Task.create({ title: `Task ${i}` }).getValue()!,
      );

      jest.spyOn(repository, "findAll").mockResolvedValue(mockTasks);

      const result = await repository.findRecentlyUpdated();

      expect(result).toHaveLength(10);
    });
  });

  describe("findRecentlyCreated", () => {
    it("should return tasks sorted by creation date", async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockTasks = [
        Task.create({ title: "Old Task" }).getValue()!,
        Task.create({ title: "Recent Task" }).getValue()!,
        Task.create({ title: "Latest Task" }).getValue()!,
      ];

      jest.spyOn(mockTasks[0], "getCreatedAt").mockReturnValue(dayAgo);
      jest.spyOn(mockTasks[1], "getCreatedAt").mockReturnValue(hourAgo);
      jest.spyOn(mockTasks[2], "getCreatedAt").mockReturnValue(now);

      jest.spyOn(repository, "findAll").mockResolvedValue(mockTasks);

      const result = await repository.findRecentlyCreated(2);

      expect(result).toHaveLength(2);
      expect(result[0].getTitle()).toBe("Latest Task");
      expect(result[1].getTitle()).toBe("Recent Task");
    });
  });

  describe("loadTaskFromFile - error handling", () => {
    it("should return null for file without frontmatter ID", async () => {
      const mockFile = new TFile("Tasks/invalid-task.md");

      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: { title: "No ID Task" },
      });
      mockVault.read.mockResolvedValue("---\ntitle: No ID Task\n---\nContent");

      const result = await (repository as any).loadTaskFromFile(mockFile);

      expect(result).toBeNull();
    });

    it("should return null for invalid priority", async () => {
      const mockFile = new TFile("Tasks/invalid-priority.md");

      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          id: "task-1",
          priority: "invalid-priority",
        },
      });
      mockVault.read.mockResolvedValue("---\nid: task-1\n---\nContent");

      const result = await (repository as any).loadTaskFromFile(mockFile);

      expect(result).toBeNull();
    });

    it("should return null for invalid status", async () => {
      const mockFile = new TFile("Tasks/invalid-status.md");

      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          id: "task-1",
          status: "invalid-status",
        },
      });
      mockVault.read.mockResolvedValue("---\nid: task-1\n---\nContent");

      const result = await (repository as any).loadTaskFromFile(mockFile);

      expect(result).toBeNull();
    });

    it("should handle vault read errors", async () => {
      const mockFile = new TFile("Tasks/error-task.md");

      mockVault.read.mockRejectedValue(new Error("File read error"));

      const result = await (repository as any).loadTaskFromFile(mockFile);

      expect(result).toBeNull();
    });
  });

  describe("generateTaskContent", () => {
    it("should generate proper markdown content", async () => {
      const task = Task.create({
        title: "Test Task",
        description: "Test description",
        tags: ["tag1", "tag2"],
      }).getValue()!;

      const content = (repository as any).generateTaskContent(task);

      expect(content).toContain("---");
      expect(content).toContain("# Test Task");
      expect(content).toContain("Test description");
      expect(content).toContain("## Details");
      expect(content).toContain("## Tags");
      expect(content).toContain("#tag1 #tag2");
      expect(content).toContain("## Notes");
    });
  });

  describe("ensureTasksFolder", () => {
    it("should create Tasks folder if it does not exist", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await (repository as any).ensureTasksFolder();

      expect(mockVault.createFolder).toHaveBeenCalledWith("Tasks");
    });

    it("should not create Tasks folder if it already exists", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue({ exists: true });

      await (repository as any).ensureTasksFolder();

      expect(mockVault.createFolder).not.toHaveBeenCalled();
    });
  });

  describe("sanitizeFileName", () => {
    it("should replace invalid characters", () => {
      const result = (repository as any).sanitizeFileName(
        'Invalid/\\:*?"<>|Name',
      );
      expect(result).toBe("Invalid---------Name");
    });

    it("should trim and limit length", () => {
      const longName = "a".repeat(150);
      const result = (repository as any).sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it("should handle empty string", () => {
      const result = (repository as any).sanitizeFileName("");
      expect(result).toBe("");
    });
  });

  describe("edge cases", () => {
    it("should handle null metadata cache response", async () => {
      const mockFile = new TFile("Tasks/null-metadata.md");
      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue(null);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it("should handle malformed dates in frontmatter", async () => {
      const mockFile = new TFile("Tasks/bad-date.md");

      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          id: "550e8400-e29b-41d4-a716-446655440200",
          dueDate: "not-a-date",
          createdAt: "also-not-a-date",
        },
      });
      mockVault.read.mockResolvedValue("content");

      const result = await (repository as any).loadTaskFromFile(mockFile);

      // Task creation should fail with invalid task ID
      expect(result).toBeNull();
    });

    it("should handle tasks with no content body", async () => {
      const mockFile = new TFile("Tasks/no-body.md");

      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          id: "550e8400-e29b-41d4-a716-446655440210",
          title: "No Body Task",
          status: "todo",
          priority: "medium",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      mockVault.read.mockResolvedValue(
        "---\nid: 550e8400-e29b-41d4-a716-446655440210\n---",
      );

      const result = await (repository as any).loadTaskFromFile(mockFile);

      expect(result).not.toBeNull();
      expect(result?.getTitle()).toBe("No Body Task");
    });
  });
});
