import { TaskStatus, TaskStatusType } from '../../../../src/domain/value-objects/TaskStatus';

describe('TaskStatus', () => {
  describe('create', () => {
    it('should create status with valid string', () => {
      const result = TaskStatus.create('done');
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().toString()).toBe('done');
    });

    it('should create status with enum value', () => {
      const result = TaskStatus.create(TaskStatusType.IN_PROGRESS);
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().getStatus()).toBe(TaskStatusType.IN_PROGRESS);
    });

    it('should handle underscore to dash conversion', () => {
      const result = TaskStatus.create('in_progress');
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().toString()).toBe('in-progress');
    });

    it('should reject invalid status', () => {
      const result = TaskStatus.create('invalid');
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('TaskStatus must be one of: todo, in-progress, waiting, done, cancelled');
    });
  });

  describe('static factory methods', () => {
    it('should create all status types', () => {
      expect(TaskStatus.todo().getStatus()).toBe(TaskStatusType.TODO);
      expect(TaskStatus.inProgress().getStatus()).toBe(TaskStatusType.IN_PROGRESS);
      expect(TaskStatus.waiting().getStatus()).toBe(TaskStatusType.WAITING);
      expect(TaskStatus.done().getStatus()).toBe(TaskStatusType.DONE);
      expect(TaskStatus.cancelled().getStatus()).toBe(TaskStatusType.CANCELLED);
    });
  });

  describe('state queries', () => {
    it('should identify active statuses', () => {
      expect(TaskStatus.todo().isActive()).toBe(true);
      expect(TaskStatus.inProgress().isActive()).toBe(true);
      expect(TaskStatus.waiting().isActive()).toBe(true);
      expect(TaskStatus.done().isActive()).toBe(false);
      expect(TaskStatus.cancelled().isActive()).toBe(false);
    });

    it('should identify completed status', () => {
      expect(TaskStatus.done().isCompleted()).toBe(true);
      expect(TaskStatus.todo().isCompleted()).toBe(false);
    });

    it('should identify cancelled status', () => {
      expect(TaskStatus.cancelled().isCancelled()).toBe(true);
      expect(TaskStatus.done().isCancelled()).toBe(false);
    });

    it('should identify in-progress status', () => {
      expect(TaskStatus.inProgress().isInProgress()).toBe(true);
      expect(TaskStatus.todo().isInProgress()).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('should allow valid transitions from todo', () => {
      const todo = TaskStatus.todo();
      
      expect(todo.canTransitionTo(TaskStatus.inProgress())).toBe(true);
      expect(todo.canTransitionTo(TaskStatus.waiting())).toBe(true);
      expect(todo.canTransitionTo(TaskStatus.done())).toBe(true);
      expect(todo.canTransitionTo(TaskStatus.cancelled())).toBe(true);
    });

    it('should allow reopening completed tasks', () => {
      const done = TaskStatus.done();
      
      expect(done.canTransitionTo(TaskStatus.todo())).toBe(true);
    });

    it('should allow reactivating cancelled tasks', () => {
      const cancelled = TaskStatus.cancelled();
      
      expect(cancelled.canTransitionTo(TaskStatus.todo())).toBe(true);
    });
  });

  describe('markdown checkbox conversion', () => {
    it('should convert to markdown checkboxes', () => {
      expect(TaskStatus.todo().toMarkdownCheckbox()).toBe('- [ ]');
      expect(TaskStatus.inProgress().toMarkdownCheckbox()).toBe('- [/]');
      expect(TaskStatus.waiting().toMarkdownCheckbox()).toBe('- [-]');
      expect(TaskStatus.done().toMarkdownCheckbox()).toBe('- [x]');
      expect(TaskStatus.cancelled().toMarkdownCheckbox()).toBe('- [~]');
    });

    it('should parse from markdown checkboxes', () => {
      expect(TaskStatus.fromMarkdownCheckbox('- [ ]').getValue().getStatus()).toBe(TaskStatusType.TODO);
      expect(TaskStatus.fromMarkdownCheckbox('- [/]').getValue().getStatus()).toBe(TaskStatusType.IN_PROGRESS);
      expect(TaskStatus.fromMarkdownCheckbox('- [-]').getValue().getStatus()).toBe(TaskStatusType.WAITING);
      expect(TaskStatus.fromMarkdownCheckbox('- [x]').getValue().getStatus()).toBe(TaskStatusType.DONE);
      expect(TaskStatus.fromMarkdownCheckbox('- [X]').getValue().getStatus()).toBe(TaskStatusType.DONE);
      expect(TaskStatus.fromMarkdownCheckbox('- [~]').getValue().getStatus()).toBe(TaskStatusType.CANCELLED);
    });

    it('should reject invalid markdown checkbox', () => {
      const result = TaskStatus.fromMarkdownCheckbox('- [invalid]');
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid markdown checkbox format');
    });
  });
});