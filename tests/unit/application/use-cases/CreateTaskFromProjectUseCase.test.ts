import { CreateTaskFromProjectUseCase } from '../../../../src/application/use-cases/CreateTaskFromProjectUseCase';
import { GetCurrentProjectUseCase } from '../../../../src/application/use-cases/GetCurrentProjectUseCase';
import { ITaskRepository } from '../../../../src/domain/repositories/ITaskRepository';
import { IAssetRepository } from '../../../../src/domain/repositories/IAssetRepository';
import { IndexedGraph } from '../../../../src/domain/semantic/core/IndexedGraph';
import { Task } from '../../../../src/domain/entities/Task';
import { Asset } from '../../../../src/domain/entities/Asset';
import { TaskId } from '../../../../src/domain/value-objects/TaskId';
import { AssetId } from '../../../../src/domain/value-objects/AssetId';
import { Priority } from '../../../../src/domain/value-objects/Priority';
import { TaskStatus } from '../../../../src/domain/value-objects/TaskStatus';
import { ClassName } from '../../../../src/domain/value-objects/ClassName';
import { OntologyPrefix } from '../../../../src/domain/value-objects/OntologyPrefix';
import { Result } from '../../../../src/domain/core/Result';
import { CreateTaskRequest, CreateTaskResponse } from '../../../../src/application/dtos/CreateTaskRequest';
import { Triple, IRI, Literal } from '../../../../src/domain/semantic/core/Triple';

// Mock repositories and services
const mockTaskRepository: jest.Mocked<ITaskRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  findByProject: jest.fn(),
  findByStatus: jest.fn(),
  findByPriority: jest.fn(),
  findByTags: jest.fn(),
  findByDateRange: jest.fn(),
  update: jest.fn(),
  exists: jest.fn()
};

const mockAssetRepository: jest.Mocked<IAssetRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  findByClass: jest.fn(),
  findByTitle: jest.fn(),
  findByFilename: jest.fn(),
  update: jest.fn(),
  exists: jest.fn(),
  search: jest.fn()
};

const mockGraph: jest.Mocked<IndexedGraph> = {
  add: jest.fn(),
  remove: jest.fn(),
  query: jest.fn(),
  getTriples: jest.fn(),
  size: jest.fn(),
  clear: jest.fn(),
  has: jest.fn(),
  getSubjects: jest.fn(),
  getPredicates: jest.fn(),
  getObjects: jest.fn(),
  serialize: jest.fn(),
  deserialize: jest.fn()
};

const mockGetCurrentProjectUseCase: jest.Mocked<GetCurrentProjectUseCase> = {
  execute: jest.fn()
} as any;

describe('CreateTaskFromProjectUseCase', () => {
  let useCase: CreateTaskFromProjectUseCase;
  let mockTask: Task;
  let mockAsset: Asset;

  beforeEach(() => {
    jest.clearAllMocks();
    
    useCase = new CreateTaskFromProjectUseCase(
      mockTaskRepository,
      mockAssetRepository,
      mockGraph,
      mockGetCurrentProjectUseCase
    );

    // Create mock task
    const taskResult = Task.create({
      title: 'Test Task',
      description: 'Test Description',
      priority: Priority.medium(),
      status: TaskStatus.todo(),
      tags: ['test']
    });
    mockTask = taskResult.getValue();

    // Create mock asset
    const assetResult = Asset.create({
      id: AssetId.create('test-asset-id').getValue(),
      label: 'Test Asset',
      className: ClassName.create('ems__Project').getValue(),
      ontology: OntologyPrefix.create('ems').getValue(),
      properties: {
        status: 'active',
        priority: 'medium',
        description: 'Test project'
      }
    });
    mockAsset = assetResult.getValue();
  });

  describe('Request Validation', () => {
    it('should fail when title is missing', async () => {
      const request: CreateTaskRequest = {
        title: ''
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Task title is required');
      expect(result.errors?.request).toContain('Task title is required');
    });

    it('should fail when title is only whitespace', async () => {
      const request: CreateTaskRequest = {
        title: '   '
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Task title is required');
    });

    it('should fail when title exceeds 200 characters', async () => {
      const request: CreateTaskRequest = {
        title: 'a'.repeat(201)
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Task title cannot exceed 200 characters');
    });

    it('should fail when estimated hours is negative', async () => {
      const request: CreateTaskRequest = {
        title: 'Valid Title',
        estimatedHours: -5
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Estimated hours must be a non-negative number');
    });

    it('should fail when estimated hours is not a number', async () => {
      const request: CreateTaskRequest = {
        title: 'Valid Title',
        estimatedHours: 'not a number' as any
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Estimated hours must be a non-negative number');
    });

    it('should fail when due date is invalid', async () => {
      const request: CreateTaskRequest = {
        title: 'Valid Title',
        dueDate: 'invalid-date'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Due date must be a valid date');
    });

    it('should fail when priority is invalid', async () => {
      const request: CreateTaskRequest = {
        title: 'Valid Title',
        priority: 'invalid-priority' as any
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Priority must be one of: low, medium, high, urgent');
    });

    it('should fail when status is invalid', async () => {
      const request: CreateTaskRequest = {
        title: 'Valid Title',
        status: 'invalid-status' as any
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Status must be one of: todo, in-progress, done, cancelled');
    });

    it('should pass validation with valid request', async () => {
      const request: CreateTaskRequest = {
        title: 'Valid Task Title',
        description: 'Valid description',
        priority: 'high',
        status: 'todo',
        estimatedHours: 5,
        dueDate: '2024-12-31',
        tags: ['work', 'urgent']
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });

      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });
  });

  describe('Template Application', () => {
    it('should apply template when templateId is provided', async () => {
      const templateAsset = Asset.create({
        id: AssetId.create('template-id').getValue(),
        label: 'Task Template',
        className: ClassName.create('ems__TaskTemplate').getValue(),
        ontology: OntologyPrefix.create('ems').getValue(),
        properties: {
          description: 'Template description',
          priority: 'high',
          estimatedHours: 8,
          tags: ['template-tag']
        }
      }).getValue();

      const request: CreateTaskRequest = {
        title: 'Task from Template',
        templateId: 'template-id'
      };

      mockAssetRepository.findById.mockResolvedValue(templateAsset);
      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockAssetRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'template-id'
        })
      );
    });

    it('should handle template not found gracefully', async () => {
      const request: CreateTaskRequest = {
        title: 'Task with Missing Template',
        templateId: 'missing-template'
      };

      mockAssetRepository.findById.mockResolvedValue(undefined);
      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockAssetRepository.findById).toHaveBeenCalled();
    });

    it('should substitute template variables', async () => {
      const templateAsset = Asset.create({
        id: AssetId.create('template-id').getValue(),
        label: 'Task Template',
        className: ClassName.create('ems__TaskTemplate').getValue(),
        ontology: OntologyPrefix.create('ems').getValue(),
        properties: {
          description: 'Work on {{project}} for {{client}}'
        }
      }).getValue();

      const request: CreateTaskRequest = {
        title: 'Task for {{client}}',
        templateId: 'template-id',
        templateVariables: {
          project: 'Website',
          client: 'ACME Corp'
        }
      };

      mockAssetRepository.findById.mockResolvedValue(templateAsset);
      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.task?.title).toBe('Task for ACME Corp');
    });

    it('should handle invalid template ID gracefully', async () => {
      const request: CreateTaskRequest = {
        title: 'Valid Task',
        templateId: 'invalid-uuid'
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });
  });

  describe('Project Context Resolution', () => {
    it('should use provided project ID when valid', async () => {
      const request: CreateTaskRequest = {
        title: 'Task with Project',
        projectId: 'valid-project-id'
      };

      mockAssetRepository.findById.mockResolvedValue(mockAsset);
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockAssetRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'valid-project-id'
        })
      );
    });

    it('should fall back to context detection when project ID is invalid', async () => {
      const request: CreateTaskRequest = {
        title: 'Task with Invalid Project',
        projectId: 'invalid-project-id'
      };

      mockAssetRepository.findById.mockResolvedValue(undefined);
      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        currentProject: {
          id: 'context-project-id',
          title: 'Context Project',
          status: 'active',
          priority: 'medium'
        },
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.8, reasoning: 'from context' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockGetCurrentProjectUseCase.execute).toHaveBeenCalled();
    });

    it('should use context-based detection when no project ID provided', async () => {
      const request: CreateTaskRequest = {
        title: 'Task without Project',
        context: {
          activeFile: 'project-file.md',
          focusContext: 'project-context'
        }
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        currentProject: {
          id: 'detected-project',
          title: 'Detected Project',
          status: 'active',
          priority: 'medium'
        },
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.9, reasoning: 'detected from file' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockGetCurrentProjectUseCase.execute).toHaveBeenCalledWith({
        activeFile: 'project-file.md',
        preferences: {
          includeCompleted: false,
          maxResults: 5,
          selectionStrategy: 'context'
        }
      });
    });

    it('should handle missing context gracefully', async () => {
      const request: CreateTaskRequest = {
        title: 'Task without Context'
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.0, reasoning: 'no context' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });
  });

  describe('Task Creation', () => {
    it('should create task with default values', async () => {
      const request: CreateTaskRequest = {
        title: 'Simple Task'
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.task?.title).toBe('Simple Task');
      expect(result.task?.status).toBe('todo');
      expect(result.task?.priority).toBe('medium');
      expect(result.task?.tags).toEqual([]);
    });

    it('should create task with all properties', async () => {
      const request: CreateTaskRequest = {
        title: 'Complex Task',
        description: 'Detailed description',
        priority: 'urgent',
        status: 'in-progress',
        projectId: 'project-123',
        dueDate: '2024-12-31',
        estimatedHours: 10,
        tags: ['important', 'deadline']
      };

      mockAssetRepository.findById.mockResolvedValue(mockAsset);
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.task?.title).toBe('Complex Task');
      expect(result.task?.status).toBe('in-progress');
      expect(result.task?.priority).toBe('urgent');
      expect(result.task?.projectId).toBe('project-123');
      expect(result.task?.dueDate).toBe('2024-12-31');
      expect(result.task?.tags).toEqual(['important', 'deadline']);
    });

    it('should handle task creation failure', async () => {
      const request: CreateTaskRequest = {
        title: '', // This will cause validation to fail in the use case
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Task title is required');
    });

    it('should trim whitespace from title and description', async () => {
      const request: CreateTaskRequest = {
        title: '  Trimmed Title  ',
        description: '  Trimmed Description  '
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.task?.title).toBe('Trimmed Title');
    });
  });

  describe('Repository Operations', () => {
    it('should save task to task repository', async () => {
      const request: CreateTaskRequest = {
        title: 'Repository Test'
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTaskRepository.save).toHaveBeenCalledWith(
        expect.any(Task)
      );
    });

    it('should save task as asset for compatibility', async () => {
      const request: CreateTaskRequest = {
        title: 'Asset Compatibility Test',
        context: {
          activeFile: 'test.md',
          selection: 'selected text',
          focusContext: 'focus'
        }
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();
      mockAssetRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockAssetRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should continue when asset save fails', async () => {
      const request: CreateTaskRequest = {
        title: 'Asset Save Failure Test'
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();
      mockAssetRepository.save.mockRejectedValue(new Error('Asset save failed'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save task as asset:',
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('RDF Graph Updates', () => {
    it('should add basic task triples to graph', async () => {
      const request: CreateTaskRequest = {
        title: 'RDF Test Task',
        description: 'Test description',
        priority: 'high',
        status: 'todo',
        estimatedHours: 5,
        tags: ['rdf', 'test']
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.rdfTriples).toBeDefined();
      expect(result.rdfTriples!.length).toBeGreaterThan(0);
      expect(mockGraph.add).toHaveBeenCalled();
    });

    it('should add project relationship triples when project exists', async () => {
      const request: CreateTaskRequest = {
        title: 'Task with Project RDF',
        projectId: 'project-123'
      };

      mockAssetRepository.findById.mockResolvedValue(mockAsset);
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.rdfTriples).toBeDefined();
      
      const projectTriples = result.rdfTriples!.filter(triple => 
        triple.predicate === 'ems:belongsToProject' || triple.predicate === 'ems:hasTask'
      );
      expect(projectTriples.length).toBeGreaterThan(0);
    });

    it('should handle RDF graph errors gracefully', async () => {
      const request: CreateTaskRequest = {
        title: 'RDF Error Test'
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();
      mockGraph.add.mockImplementation(() => {
        throw new Error('Graph error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.rdfTriples).toBeDefined(); // Triples are created but graph.add fails
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create triple:', expect.any(Object), expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle invalid triple creation gracefully', async () => {
      const request: CreateTaskRequest = {
        title: 'Invalid Triple Test'
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Response Building', () => {
    it('should build success response with all fields', async () => {
      const request: CreateTaskRequest = {
        title: 'Response Test',
        description: 'Test description',
        priority: 'high',
        status: 'todo',
        projectId: 'project-123',
        dueDate: '2024-12-31',
        tags: ['test']
      };

      mockAssetRepository.findById.mockResolvedValue(mockAsset);
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result).toMatchObject({
        success: true,
        taskId: expect.any(String),
        message: expect.stringContaining('created successfully'),
        task: {
          id: expect.any(String),
          title: 'Response Test',
          status: 'todo',
          priority: 'high',
          projectId: 'project-123',
          dueDate: '2024-12-31',
          tags: ['test']
        },
        rdfTriples: expect.any(Array)
      });
    });

    it('should build error response for validation failures', async () => {
      const request: CreateTaskRequest = {
        title: '',
        priority: 'invalid' as any
      };

      const result = await useCase.execute(request);

      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining('Task title is required'),
        errors: {
          request: expect.arrayContaining([
            expect.stringContaining('Task title is required')
          ])
        }
      });
    });

    it('should build error response for system errors', async () => {
      const request: CreateTaskRequest = {
        title: 'System Error Test'
      };

      mockGetCurrentProjectUseCase.execute.mockRejectedValue(
        new Error('System failure')
      );

      const result = await useCase.execute(request);

      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining('Failed to create task'),
        errors: {
          system: expect.arrayContaining([
            expect.stringContaining('System failure')
          ])
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined values gracefully', async () => {
      const request: CreateTaskRequest = {
        title: 'Edge Case Test',
        description: undefined,
        priority: undefined,
        status: undefined,
        projectId: undefined,
        dueDate: undefined,
        estimatedHours: undefined,
        tags: undefined
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.task?.tags).toEqual([]);
    });

    it('should handle empty arrays and objects', async () => {
      const request: CreateTaskRequest = {
        title: 'Empty Values Test',
        tags: [],
        templateVariables: {},
        context: {}
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });

    it('should handle very long valid titles (up to 200 chars)', async () => {
      const request: CreateTaskRequest = {
        title: 'a'.repeat(200)
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.task?.title).toHaveLength(200);
    });

    it('should handle zero estimated hours', async () => {
      const request: CreateTaskRequest = {
        title: 'Zero Hours Task',
        estimatedHours: 0
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });

    it('should handle duplicate tags', async () => {
      const request: CreateTaskRequest = {
        title: 'Duplicate Tags Test',
        tags: ['tag1', 'tag2', 'tag1', 'tag2']
      };

      mockGetCurrentProjectUseCase.execute.mockResolvedValue({
        success: true,
        availableProjects: [],
        context: { strategy: 'context', confidence: 0.5, reasoning: 'test' }
      });
      mockTaskRepository.save.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.task?.tags).toEqual(['tag1', 'tag2', 'tag1', 'tag2']);
    });
  });
});