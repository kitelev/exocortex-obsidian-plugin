import { TaskId } from '../../../../src/domain/value-objects/TaskId';

describe('TaskId', () => {
  describe('create', () => {
    it('should create a valid TaskId with UUID', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      
      const result = TaskId.create(validUuid);
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().toString()).toBe(validUuid);
    });

    it('should reject empty string', () => {
      const result = TaskId.create('');
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('TaskId cannot be empty');
    });

    it('should reject invalid UUID format', () => {
      const result = TaskId.create('invalid-uuid');
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('TaskId must be a valid UUID');
    });
  });

  describe('generate', () => {
    it('should generate valid UUID', () => {
      const taskId = TaskId.generate();
      
      expect(taskId.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const taskId1 = TaskId.generate();
      const taskId2 = TaskId.generate();
      
      expect(taskId1.equals(taskId2)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal TaskIds', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const taskId1 = TaskId.create(uuid).getValue();
      const taskId2 = TaskId.create(uuid).getValue();
      
      expect(taskId1.equals(taskId2)).toBe(true);
    });

    it('should return false for different TaskIds', () => {
      const taskId1 = TaskId.generate();
      const taskId2 = TaskId.generate();
      
      expect(taskId1.equals(taskId2)).toBe(false);
    });
  });
});