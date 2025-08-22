import { App, TFile, Notice } from "obsidian";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { Task } from "../../domain/entities/Task";
import { TaskId } from "../../domain/value-objects/TaskId";
import { AssetId } from "../../domain/value-objects/AssetId";
import {
  TaskStatus,
  TaskStatusType,
} from "../../domain/value-objects/TaskStatus";
import { Priority, PriorityLevel } from "../../domain/value-objects/Priority";
import { Result } from "../../domain/core/Result";

/**
 * Obsidian-specific implementation of ITaskRepository
 * Manages task persistence using Obsidian vault files
 */
export class ObsidianTaskRepository implements ITaskRepository {
  private readonly tasksFolder = "Tasks";
  private taskCache: Map<string, Task> = new Map();

  constructor(private readonly app: App) {}

  async findById(id: TaskId): Promise<Task | null> {
    // Check cache first
    const cached = this.taskCache.get(id.toString());
    if (cached) {
      return cached;
    }

    // Search for task file
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata?.frontmatter?.id === id.toString()) {
          const task = await this.loadTaskFromFile(file);
          if (task) {
            this.taskCache.set(id.toString(), task);
            return task;
          }
        }
      }
    }

    return null;
  }

  async findByProject(projectId: AssetId): Promise<Task[]> {
    const tasks: Task[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata?.frontmatter?.projectId === projectId.toString()) {
          const task = await this.loadTaskFromFile(file);
          if (task) {
            tasks.push(task);
          }
        }
      }
    }

    return tasks;
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const tasks: Task[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata?.frontmatter?.status === status.toString()) {
          const task = await this.loadTaskFromFile(file);
          if (task) {
            tasks.push(task);
          }
        }
      }
    }

    return tasks;
  }

  async findByPriority(priority: Priority): Promise<Task[]> {
    const tasks: Task[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata?.frontmatter?.priority === priority.toString()) {
          const task = await this.loadTaskFromFile(file);
          if (task) {
            tasks.push(task);
          }
        }
      }
    }

    return tasks;
  }

  async findByTag(tag: string): Promise<Task[]> {
    const tasks: Task[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const metadata = this.app.metadataCache.getFileCache(file);
        const tags = metadata?.frontmatter?.tags || [];
        if (Array.isArray(tags) && tags.includes(tag)) {
          const task = await this.loadTaskFromFile(file);
          if (task) {
            tasks.push(task);
          }
        }
      }
    }

    return tasks;
  }

  async findOverdue(): Promise<Task[]> {
    const now = new Date();
    const tasks: Task[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata?.frontmatter?.dueDate) {
          const dueDate = new Date(metadata.frontmatter.dueDate);
          if (dueDate < now && metadata.frontmatter.status !== "done") {
            const task = await this.loadTaskFromFile(file);
            if (task) {
              tasks.push(task);
            }
          }
        }
      }
    }

    return tasks;
  }

  async findDueToday(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.findDueBetween(today, tomorrow);
  }

  async findDueBetween(startDate: Date, endDate: Date): Promise<Task[]> {
    const tasks: Task[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata?.frontmatter?.dueDate) {
          const dueDate = new Date(metadata.frontmatter.dueDate);
          if (dueDate >= startDate && dueDate <= endDate) {
            const task = await this.loadTaskFromFile(file);
            if (task) {
              tasks.push(task);
            }
          }
        }
      }
    }

    return tasks;
  }

  async findAll(): Promise<Task[]> {
    const tasks: Task[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const task = await this.loadTaskFromFile(file);
        if (task) {
          tasks.push(task);
        }
      }
    }

    return tasks;
  }

  async findByCriteria(criteria: {
    status?: TaskStatus;
    priority?: Priority;
    projectId?: AssetId;
    tags?: string[];
  }): Promise<Task[]> {
    let tasks = await this.findAll();

    if (criteria.status) {
      tasks = tasks.filter((t) => t.getStatus().equals(criteria.status!));
    }

    if (criteria.priority) {
      tasks = tasks.filter((t) => t.getPriority().equals(criteria.priority!));
    }

    if (criteria.projectId) {
      tasks = tasks.filter((t) =>
        t.getProjectId()?.equals(criteria.projectId!),
      );
    }

    if (criteria.tags && criteria.tags.length > 0) {
      tasks = tasks.filter((t) => {
        const taskTags = t.getTags();
        return criteria.tags!.some((tag) => taskTags.includes(tag));
      });
    }

    return tasks;
  }

  async save(task: Task): Promise<void> {
    try {
      // Ensure tasks folder exists
      await this.ensureTasksFolder();

      // Generate file path
      const fileName = this.sanitizeFileName(task.getTitle());
      const filePath = `${this.tasksFolder}/${fileName}.md`;

      // Check if file already exists
      let file = this.app.vault.getAbstractFileByPath(filePath);

      if (!file) {
        // Create new file
        file = await this.app.vault.create(filePath, "");
      }

      if (!(file instanceof TFile)) {
        throw new Error("File path exists but is not a file");
      }

      // Generate content
      const content = this.generateTaskContent(task);

      // Save file
      await this.app.vault.modify(file, content);

      // Update cache
      this.taskCache.set(task.getId().toString(), task);

      // Show success notice
      new Notice(`Task "${task.getTitle()}" saved successfully`);
    } catch (error) {
      console.error("Failed to save task:", error);
      new Notice(`Failed to save task: ${error.message}`);
      throw error;
    }
  }

  async delete(id: TaskId): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.path.startsWith(this.tasksFolder)) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata?.frontmatter?.id === id.toString()) {
          await this.app.vault.delete(file);
          this.taskCache.delete(id.toString());
          new Notice("Task deleted successfully");
          return;
        }
      }
    }

    throw new Error(`Task with id ${id.toString()} not found`);
  }

  async exists(id: TaskId): Promise<boolean> {
    const task = await this.findById(id);
    return task !== null;
  }

  async findByFilename(filename: string): Promise<Task | null> {
    const file = this.app.vault.getAbstractFileByPath(
      `${this.tasksFolder}/${filename}`,
    );

    if (file instanceof TFile) {
      return await this.loadTaskFromFile(file);
    }

    return null;
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    completed: number;
    averageCompletionTime?: number;
  }> {
    const tasks = await this.findAll();
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const stats = {
      total: tasks.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 0,
      completed: 0,
      averageCompletionTime: undefined as number | undefined,
    };

    let completionTimes: number[] = [];

    for (const task of tasks) {
      // Status statistics
      const status = task.getStatus().toString();
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Count completed tasks
      if (status === "done") {
        stats.completed++;

        // Calculate completion time if we have both created and updated dates
        const createdAt = task.getCreatedAt();
        const updatedAt = task.getUpdatedAt();
        if (createdAt && updatedAt) {
          const completionTime = updatedAt.getTime() - createdAt.getTime();
          completionTimes.push(completionTime);
        }
      }

      // Priority statistics
      const priority = task.getPriority().toString();
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // Due date statistics
      const dueDate = task.getDueDate();
      if (dueDate) {
        if (dueDate < now && task.getStatus().toString() !== "done") {
          stats.overdue++;
        }
        if (dueDate >= today && dueDate < tomorrow) {
          stats.dueToday++;
        }
        if (dueDate >= today && dueDate < weekEnd) {
          stats.dueThisWeek++;
        }
      }
    }

    // Calculate average completion time
    if (completionTimes.length > 0) {
      const totalTime = completionTimes.reduce((sum, time) => sum + time, 0);
      stats.averageCompletionTime = totalTime / completionTimes.length;
    }

    return stats;
  }

  async search(query: string): Promise<Task[]> {
    const tasks = await this.findAll();
    const lowerQuery = query.toLowerCase();

    return tasks.filter((task) => {
      const title = task.getTitle().toLowerCase();
      const description = task.getDescription()?.toLowerCase() || "";
      const tags = task.getTags().join(" ").toLowerCase();

      return (
        title.includes(lowerQuery) ||
        description.includes(lowerQuery) ||
        tags.includes(lowerQuery)
      );
    });
  }

  async findRecentlyUpdated(limit: number = 10): Promise<Task[]> {
    const tasks = await this.findAll();

    return tasks
      .sort((a, b) => b.getUpdatedAt().getTime() - a.getUpdatedAt().getTime())
      .slice(0, limit);
  }

  async findRecentlyCreated(limit: number = 10): Promise<Task[]> {
    const tasks = await this.findAll();

    return tasks
      .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime())
      .slice(0, limit);
  }

  /**
   * Load task from Obsidian file
   */
  private async loadTaskFromFile(file: TFile): Promise<Task | null> {
    try {
      const content = await this.app.vault.read(file);
      const metadata = this.app.metadataCache.getFileCache(file);

      if (!metadata?.frontmatter?.id) {
        return null;
      }

      const fm = metadata.frontmatter;

      // Parse priority
      const priorityResult = Priority.create(fm.priority || "medium");
      if (priorityResult.isFailure) {
        console.warn(`Invalid priority in task ${fm.id}: ${fm.priority}`);
        return null;
      }

      // Parse status
      const statusResult = TaskStatus.create(fm.status || "todo");
      if (statusResult.isFailure) {
        console.warn(`Invalid status in task ${fm.id}: ${fm.status}`);
        return null;
      }

      // Parse project ID
      let projectId: AssetId | undefined;
      if (fm.projectId) {
        const projectIdResult = AssetId.create(fm.projectId);
        if (projectIdResult.isSuccess) {
          projectId = projectIdResult.getValue();
        }
      }

      // Parse dates
      const dueDate = fm.dueDate ? new Date(fm.dueDate) : undefined;
      const createdAt = fm.createdAt ? new Date(fm.createdAt) : file.stat.ctime;
      const updatedAt = fm.updatedAt ? new Date(fm.updatedAt) : file.stat.mtime;

      // Create task ID
      const taskIdResult = TaskId.create(fm.id);
      if (taskIdResult.isFailure) {
        console.warn(`Invalid task ID: ${fm.id}`);
        return null;
      }

      // Extract description from content (everything after frontmatter)
      const contentLines = content.split("\n");
      let inFrontmatter = false;
      let description = "";

      for (const line of contentLines) {
        if (line === "---") {
          inFrontmatter = !inFrontmatter;
          continue;
        }
        if (!inFrontmatter && line.trim() && !line.startsWith("#")) {
          description += line + "\n";
        }
      }

      // Create task
      const taskResult = Task.create({
        title: fm.title || file.basename,
        description: description.trim() || fm.description,
        priority: priorityResult.getValue(),
        status: statusResult.getValue(),
        projectId,
        dueDate,
        estimatedHours: fm.estimatedHours,
        tags: fm.tags || [],
      });

      if (taskResult.isFailure) {
        console.warn(
          `Failed to create task from file ${file.path}: ${taskResult.error}`,
        );
        return null;
      }

      return taskResult.getValue();
    } catch (error) {
      console.error(`Failed to load task from file ${file.path}:`, error);
      return null;
    }
  }

  /**
   * Generate markdown content for task
   */
  private generateTaskContent(task: Task): string {
    const frontmatter = task.toFrontmatter();
    const description = task.getDescription() || "";

    // Build frontmatter YAML
    let content = "---\n";
    for (const [key, value] of Object.entries(frontmatter)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            content += `${key}:\n`;
            for (const item of value) {
              content += `  - ${item}\n`;
            }
          }
        } else if (typeof value === "object") {
          content += `${key}: ${JSON.stringify(value)}\n`;
        } else {
          content += `${key}: ${value}\n`;
        }
      }
    }
    content += "---\n\n";

    // Add title
    content += `# ${task.getTitle()}\n\n`;

    // Add description
    if (description) {
      content += `${description}\n\n`;
    }

    // Add task details section
    content += "## Details\n\n";
    content += `- **Status**: ${task.getStatus().toString()}\n`;
    content += `- **Priority**: ${task.getPriority().toString()}\n`;

    if (task.getProjectId()) {
      content += `- **Project**: [[${task.getProjectId()?.toString()}]]\n`;
    }

    if (task.getDueDate()) {
      content += `- **Due Date**: ${task.getDueDate()?.toISOString().split("T")[0]}\n`;
    }

    if (task.getEstimatedHours()) {
      content += `- **Estimated Hours**: ${task.getEstimatedHours()}\n`;
    }

    // Add tags section
    const tags = task.getTags();
    if (tags.length > 0) {
      content += "\n## Tags\n\n";
      content += tags.map((tag) => `#${tag}`).join(" ") + "\n";
    }

    // Add notes section
    content += "\n## Notes\n\n";
    content += "_Add your notes here..._\n";

    return content;
  }

  /**
   * Ensure tasks folder exists
   */
  private async ensureTasksFolder(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(this.tasksFolder);
    if (!folder) {
      await this.app.vault.createFolder(this.tasksFolder);
    }
  }

  /**
   * Sanitize filename for safe file creation
   */
  private sanitizeFileName(title: string): string {
    return title
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 100); // Limit length
  }
}
