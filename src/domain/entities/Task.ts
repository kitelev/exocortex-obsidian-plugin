import { TaskId } from "../value-objects/TaskId";
import { Priority } from "../value-objects/Priority";
import { TaskStatus } from "../value-objects/TaskStatus";
import { AssetId } from "../value-objects/AssetId";
import { Entity } from "../core/Entity";
import { Result } from "../core/Result";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";

interface TaskProps {
  id: TaskId;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  projectId?: AssetId;
  dueDate?: Date;
  estimatedHours?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Domain entity representing a Task in the Exocortex system
 * Follows domain-driven design principles with business rules
 */
export class Task extends Entity<TaskProps> {
  private static logger: ILogger = LoggerFactory.create("Task");

  private constructor(props: TaskProps) {
    super(props, props.id.toString());
  }

  protected generateId(): string {
    return this.props.id.toString();
  }

  protected validate(): void {
    if (!this.props.id) {
      throw new Error("Task must have a valid ID");
    }

    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new Error("Task must have a non-empty title");
    }

    if (!this.props.priority) {
      throw new Error("Task must have a valid priority");
    }

    if (!this.props.status) {
      throw new Error("Task must have a valid status");
    }
  }

  static create(params: {
    title: string;
    description?: string;
    priority?: Priority;
    status?: TaskStatus;
    projectId?: AssetId;
    dueDate?: Date;
    estimatedHours?: number;
    tags?: string[];
  }): Result<Task> {
    // Validate required fields
    if (!params.title || params.title.trim().length === 0) {
      return Result.fail<Task>("Task title cannot be empty");
    }

    if (params.title.length > 200) {
      return Result.fail<Task>("Task title cannot exceed 200 characters");
    }

    if (params.estimatedHours !== undefined && params.estimatedHours < 0) {
      return Result.fail<Task>("Estimated hours cannot be negative");
    }

    if (params.dueDate && params.dueDate < new Date()) {
      // Only warn for past due dates, don't fail creation
      Task.logger.warn("Task created with past due date", { dueDate: params.dueDate });
    }

    const props: TaskProps = {
      id: TaskId.generate(),
      title: params.title.trim(),
      description: params.description?.trim(),
      priority: params.priority || Priority.medium(),
      status: params.status || TaskStatus.todo(),
      projectId: params.projectId,
      dueDate: params.dueDate,
      estimatedHours: params.estimatedHours,
      tags: params.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Result.ok<Task>(new Task(props));
  }

  // Getters
  getId(): TaskId {
    return this.props.id;
  }

  getTitle(): string {
    return this.props.title;
  }

  getDescription(): string | undefined {
    return this.props.description;
  }

  getPriority(): Priority {
    return this.props.priority;
  }

  getStatus(): TaskStatus {
    return this.props.status;
  }

  getProjectId(): AssetId | undefined {
    return this.props.projectId;
  }

  getDueDate(): Date | undefined {
    return this.props.dueDate;
  }

  getEstimatedHours(): number | undefined {
    return this.props.estimatedHours;
  }

  getTags(): string[] {
    return [...this.props.tags];
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  getCompletedAt(): Date | undefined {
    return this.props.completedAt;
  }

  // Override equals to use TaskId comparison
  public equals(object?: Entity<TaskProps>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Task)) {
      return false;
    }

    return this.props.id.equals(object.props.id);
  }

  // Business methods
  updateTitle(title: string): Result<void> {
    if (!title || title.trim().length === 0) {
      return Result.fail<void>("Task title cannot be empty");
    }

    if (title.length > 200) {
      return Result.fail<void>("Task title cannot exceed 200 characters");
    }

    this.props.title = title.trim();
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.props.updatedAt = new Date();
  }

  updatePriority(priority: Priority): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }

  updateStatus(status: TaskStatus): Result<void> {
    if (!this.props.status.canTransitionTo(status)) {
      return Result.fail<void>(
        `Cannot transition from ${this.props.status.toString()} to ${status.toString()}`,
      );
    }

    this.props.status = status;
    this.props.updatedAt = new Date();

    // Set completion date when task is completed
    if (status.isCompleted()) {
      this.props.completedAt = new Date();
    } else if (this.props.completedAt) {
      // Clear completion date if task is reopened
      this.props.completedAt = undefined;
    }

    return Result.ok<void>();
  }

  assignToProject(projectId: AssetId): void {
    this.props.projectId = projectId;
    this.props.updatedAt = new Date();
  }

  removeFromProject(): void {
    this.props.projectId = undefined;
    this.props.updatedAt = new Date();
  }

  setDueDate(dueDate: Date): void {
    this.props.dueDate = dueDate;
    this.props.updatedAt = new Date();
  }

  removeDueDate(): void {
    this.props.dueDate = undefined;
    this.props.updatedAt = new Date();
  }

  setEstimatedHours(hours: number): Result<void> {
    if (hours < 0) {
      return Result.fail<void>("Estimated hours cannot be negative");
    }

    this.props.estimatedHours = hours;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !this.props.tags.includes(normalizedTag)) {
      this.props.tags.push(normalizedTag);
      this.props.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this.props.tags.indexOf(normalizedTag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  hasTag(tag: string): boolean {
    return this.props.tags.includes(tag.trim().toLowerCase());
  }

  // Query methods
  isOverdue(): boolean {
    return (
      this.props.dueDate !== undefined &&
      this.props.dueDate < new Date() &&
      this.props.status.isActive()
    );
  }

  isDueToday(): boolean {
    if (!this.props.dueDate) return false;

    const today = new Date();
    const due = this.props.dueDate;

    return (
      today.getFullYear() === due.getFullYear() &&
      today.getMonth() === due.getMonth() &&
      today.getDate() === due.getDate()
    );
  }

  isHighPriority(): boolean {
    return this.props.priority.isHigherThan(Priority.medium());
  }

  // Serialization methods
  toFrontmatter(): Record<string, any> {
    const frontmatter: Record<string, any> = {
      exo__Task_uid: this.props.id.toString(),
      exo__Task_title: this.props.title,
      exo__Task_priority: this.props.priority.toString(),
      exo__Task_status: this.props.status.toString(),
      exo__Task_createdAt: this.props.createdAt.toISOString(),
      exo__Task_updatedAt: this.props.updatedAt.toISOString(),
    };

    if (this.props.description) {
      frontmatter["exo__Task_description"] = this.props.description;
    }

    if (this.props.projectId) {
      frontmatter["exo__Effort_parent"] =
        `[[${this.props.projectId.toString()}]]`;
    }

    if (this.props.dueDate) {
      frontmatter["exo__Task_dueDate"] = this.props.dueDate
        .toISOString()
        .split("T")[0];
    }

    if (this.props.estimatedHours !== undefined) {
      frontmatter["exo__Task_estimatedHours"] = this.props.estimatedHours;
    }

    if (this.props.tags.length > 0) {
      frontmatter["exo__Task_tags"] = this.props.tags;
    }

    if (this.props.completedAt) {
      frontmatter["exo__Task_completedAt"] =
        this.props.completedAt.toISOString();
    }

    return frontmatter;
  }

  static fromFrontmatter(
    frontmatter: Record<string, any>,
    fileName: string,
  ): Task | null {
    try {
      const idResult = TaskId.create(
        frontmatter["exo__Task_uid"] || TaskId.generate().toString(),
      );
      const id = idResult.isSuccess ? idResult.getValue() : TaskId.generate();

      const title =
        frontmatter["exo__Task_title"] || fileName.replace(".md", "");
      const description = frontmatter["exo__Task_description"];

      const priorityResult = Priority.create(
        frontmatter["exo__Task_priority"] || "medium",
      );
      const priority = priorityResult.isSuccess
        ? priorityResult.getValue()
        : Priority.medium();

      const statusResult = TaskStatus.create(
        frontmatter["exo__Task_status"] || "todo",
      );
      const status = statusResult.isSuccess
        ? statusResult.getValue()
        : TaskStatus.todo();

      let projectId: AssetId | undefined;
      const parentValue = frontmatter["exo__Effort_parent"];
      if (parentValue) {
        const cleanParent = parentValue.toString().replace(/\[\[|\]\]/g, "");
        const projectIdResult = AssetId.create(cleanParent);
        if (projectIdResult.isSuccess) {
          projectId = projectIdResult.getValue();
        }
      }

      const dueDate = frontmatter["exo__Task_dueDate"]
        ? new Date(frontmatter["exo__Task_dueDate"])
        : undefined;
      const estimatedHours = frontmatter["exo__Task_estimatedHours"];
      const tags = Array.isArray(frontmatter["exo__Task_tags"])
        ? frontmatter["exo__Task_tags"]
        : [];

      const createdAt = frontmatter["exo__Task_createdAt"]
        ? new Date(frontmatter["exo__Task_createdAt"])
        : new Date();

      const result = Task.create({
        title,
        description,
        priority,
        status,
        projectId,
        dueDate,
        estimatedHours,
        tags,
      });

      if (result.isSuccess) {
        const task = result.getValue()!;
        // Update timestamps and completion date
        (task as any).props.id = id;
        (task as any).props.createdAt = createdAt;

        if (frontmatter["exo__Task_completedAt"]) {
          (task as any).props.completedAt = new Date(
            frontmatter["exo__Task_completedAt"],
          );
        }

        return task;
      } else {
        Task.logger.warn("Failed to create task from frontmatter", { error: result.error });
      }

      return null;
    } catch (error) {
      Task.logger.warn("Failed to create task from frontmatter", { error });
      return null;
    }
  }

  /**
   * Generates markdown content for the task
   */
  toMarkdown(): string {
    let content = `# ${this.props.title}\n\n`;

    if (this.props.description) {
      content += `${this.props.description}\n\n`;
    }

    content += `## Task Details\n\n`;
    content += `${this.props.status.toMarkdownCheckbox()} **Status**: ${this.props.status.toString()}\n`;
    content += `- **Priority**: ${this.props.priority.toString()}\n`;

    if (this.props.dueDate) {
      content += `- **Due Date**: ${this.props.dueDate.toISOString().split("T")[0]}\n`;
    }

    if (this.props.estimatedHours) {
      content += `- **Estimated Hours**: ${this.props.estimatedHours}\n`;
    }

    if (this.props.projectId) {
      content += `- **Project**: [[${this.props.projectId.toString()}]]\n`;
    }

    if (this.props.tags.length > 0) {
      content += `- **Tags**: ${this.props.tags.map((tag) => `#${tag}`).join(" ")}\n`;
    }

    content += `\n---\n\n`;
    content += `*Created: ${this.props.createdAt.toISOString()}*\n`;
    content += `*Updated: ${this.props.updatedAt.toISOString()}*\n`;

    if (this.props.completedAt) {
      content += `*Completed: ${this.props.completedAt.toISOString()}*\n`;
    }

    return content;
  }
}
