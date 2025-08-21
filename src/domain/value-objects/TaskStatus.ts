import { Result } from '../core/Result';

export enum TaskStatusType {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  WAITING = 'waiting',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

/**
 * Value object representing task status
 * Immutable and self-validating with state transition rules
 */
export class TaskStatus {
  private readonly status: TaskStatusType;

  private constructor(status: TaskStatusType) {
    this.status = status;
  }

  static create(value: string | TaskStatusType): Result<TaskStatus> {
    if (!value) {
      return Result.fail<TaskStatus>('TaskStatus cannot be empty');
    }

    const normalizedValue = typeof value === 'string' ? value.toLowerCase().replace('_', '-') : value;
    
    if (!Object.values(TaskStatusType).includes(normalizedValue as TaskStatusType)) {
      return Result.fail<TaskStatus>('TaskStatus must be one of: todo, in-progress, waiting, done, cancelled');
    }

    return Result.ok<TaskStatus>(new TaskStatus(normalizedValue as TaskStatusType));
  }

  static todo(): TaskStatus {
    return new TaskStatus(TaskStatusType.TODO);
  }

  static inProgress(): TaskStatus {
    return new TaskStatus(TaskStatusType.IN_PROGRESS);
  }

  static waiting(): TaskStatus {
    return new TaskStatus(TaskStatusType.WAITING);
  }

  static done(): TaskStatus {
    return new TaskStatus(TaskStatusType.DONE);
  }

  static cancelled(): TaskStatus {
    return new TaskStatus(TaskStatusType.CANCELLED);
  }

  getStatus(): TaskStatusType {
    return this.status;
  }

  toString(): string {
    return this.status;
  }

  equals(other: TaskStatus): boolean {
    return this.status === other.status;
  }

  /**
   * Checks if transition to another status is valid
   */
  canTransitionTo(newStatus: TaskStatus): boolean {
    const validTransitions: Record<TaskStatusType, TaskStatusType[]> = {
      [TaskStatusType.TODO]: [TaskStatusType.IN_PROGRESS, TaskStatusType.WAITING, TaskStatusType.DONE, TaskStatusType.CANCELLED],
      [TaskStatusType.IN_PROGRESS]: [TaskStatusType.TODO, TaskStatusType.WAITING, TaskStatusType.DONE, TaskStatusType.CANCELLED],
      [TaskStatusType.WAITING]: [TaskStatusType.TODO, TaskStatusType.IN_PROGRESS, TaskStatusType.DONE, TaskStatusType.CANCELLED],
      [TaskStatusType.DONE]: [TaskStatusType.TODO], // Can reopen completed tasks
      [TaskStatusType.CANCELLED]: [TaskStatusType.TODO] // Can reactivate cancelled tasks
    };

    return validTransitions[this.status].includes(newStatus.status);
  }

  /**
   * Returns if the task is in an active state (not done or cancelled)
   */
  isActive(): boolean {
    return this.status === TaskStatusType.TODO || 
           this.status === TaskStatusType.IN_PROGRESS || 
           this.status === TaskStatusType.WAITING;
  }

  /**
   * Returns if the task is completed
   */
  isCompleted(): boolean {
    return this.status === TaskStatusType.DONE;
  }

  /**
   * Returns if the task is cancelled
   */
  isCancelled(): boolean {
    return this.status === TaskStatusType.CANCELLED;
  }

  /**
   * Returns if the task is in progress
   */
  isInProgress(): boolean {
    return this.status === TaskStatusType.IN_PROGRESS;
  }

  /**
   * Returns markdown checkbox representation
   */
  toMarkdownCheckbox(): string {
    switch (this.status) {
      case TaskStatusType.TODO: return '- [ ]';
      case TaskStatusType.IN_PROGRESS: return '- [/]';
      case TaskStatusType.WAITING: return '- [-]';
      case TaskStatusType.DONE: return '- [x]';
      case TaskStatusType.CANCELLED: return '- [~]';
    }
  }

  /**
   * Creates TaskStatus from markdown checkbox
   */
  static fromMarkdownCheckbox(checkbox: string): Result<TaskStatus> {
    const trimmed = checkbox.trim();
    
    if (trimmed === '- [ ]') return Result.ok(TaskStatus.todo());
    if (trimmed === '- [/]') return Result.ok(TaskStatus.inProgress());
    if (trimmed === '- [-]') return Result.ok(TaskStatus.waiting());
    if (trimmed === '- [x]' || trimmed === '- [X]') return Result.ok(TaskStatus.done());
    if (trimmed === '- [~]') return Result.ok(TaskStatus.cancelled());
    
    return Result.fail<TaskStatus>('Invalid markdown checkbox format');
  }

}