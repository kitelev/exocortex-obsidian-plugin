import { Task } from "../entities/Task";
import { TaskId } from "../value-objects/TaskId";
import { AssetId } from "../value-objects/AssetId";
import { TaskStatus } from "../value-objects/TaskStatus";
import { Priority } from "../value-objects/Priority";

/**
 * Repository interface for Task persistence
 * Domain layer interface - implementation in infrastructure
 * Following Clean Architecture principles
 */
export interface ITaskRepository {
  /**
   * Find a task by its unique identifier
   */
  findById(id: TaskId): Promise<Task | null>;

  /**
   * Find all tasks associated with a project
   */
  findByProject(projectId: AssetId): Promise<Task[]>;

  /**
   * Find tasks by status
   */
  findByStatus(status: TaskStatus): Promise<Task[]>;

  /**
   * Find tasks by priority
   */
  findByPriority(priority: Priority): Promise<Task[]>;

  /**
   * Find tasks by tag
   */
  findByTag(tag: string): Promise<Task[]>;

  /**
   * Find overdue tasks
   */
  findOverdue(): Promise<Task[]>;

  /**
   * Find tasks due today
   */
  findDueToday(): Promise<Task[]>;

  /**
   * Find tasks due within a date range
   */
  findDueBetween(startDate: Date, endDate: Date): Promise<Task[]>;

  /**
   * Find all tasks
   */
  findAll(): Promise<Task[]>;

  /**
   * Find tasks matching multiple criteria
   */
  findByCriteria(criteria: {
    projectId?: AssetId;
    status?: TaskStatus;
    priority?: Priority;
    tags?: string[];
    dueBefore?: Date;
    dueAfter?: Date;
    createdAfter?: Date;
    createdBefore?: Date;
  }): Promise<Task[]>;

  /**
   * Save or update a task
   */
  save(task: Task): Promise<void>;

  /**
   * Delete a task
   */
  delete(id: TaskId): Promise<void>;

  /**
   * Check if a task exists
   */
  exists(id: TaskId): Promise<boolean>;

  /**
   * Find task by filename/path
   */
  findByFilename(filename: string): Promise<Task | null>;

  /**
   * Get task statistics for analytics
   */
  getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    completed: number;
    averageCompletionTime?: number;
  }>;

  /**
   * Search tasks by text content
   */
  search(query: string): Promise<Task[]>;

  /**
   * Find recently updated tasks
   */
  findRecentlyUpdated(limit?: number): Promise<Task[]>;

  /**
   * Find tasks created in the last N days
   */
  findRecentlyCreated(days: number): Promise<Task[]>;
}
