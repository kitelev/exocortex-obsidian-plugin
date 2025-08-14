import { ExecuteQueryBlockUseCase, ExecuteQueryBlockRequest, ExecuteQueryBlockResponse } from '../../../../src/application/use-cases/ExecuteQueryBlockUseCase';
import { QueryBlockConfig } from '../../../../src/domain/entities/LayoutBlock';
import { Result } from '../../../../src/domain/core/Result';
import { App, TFile, Vault, MetadataCache } from 'obsidian';

// Mock Obsidian components
const mockFiles: TFile[] = [];

const mockVault: jest.Mocked<Vault> = {
  getFiles: jest.fn().mockReturnValue(mockFiles),
  getMarkdownFiles: jest.fn().mockReturnValue(mockFiles.filter(f => f.extension === 'md')),
  getAbstractFileByPath: jest.fn(),
  create: jest.fn(),
  read: jest.fn(),
  modify: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  adapter: {} as any
} as any;

const mockMetadataCache: jest.Mocked<MetadataCache> = {
  getFileCache: jest.fn(),
  getBacklinksForFile: jest.fn(),
  getFrontmatterPropertyValue: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
} as any;

const mockApp: jest.Mocked<App> = {
  vault: mockVault,
  metadataCache: mockMetadataCache,
  workspace: {} as any
} as any;

describe('ExecuteQueryBlockUseCase', () => {
  let useCase: ExecuteQueryBlockUseCase;
  let testFiles: TFile[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    useCase = new ExecuteQueryBlockUseCase(mockApp);
    
    // Create test files
    testFiles = [
      // Project files
      { path: 'project1.md', basename: 'project1', extension: 'md' } as TFile,
      { path: 'project2.md', basename: 'project2', extension: 'md' } as TFile,
      { path: 'completed-project.md', basename: 'completed-project', extension: 'md' } as TFile,
      
      // Task files
      { path: 'task1.md', basename: 'task1', extension: 'md' } as TFile,
      { path: 'task2.md', basename: 'task2', extension: 'md' } as TFile,
      { path: 'high-priority-task.md', basename: 'high-priority-task', extension: 'md' } as TFile,
      
      // Note files
      { path: 'note1.md', basename: 'note1', extension: 'md' } as TFile,
      { path: 'note2.md', basename: 'note2', extension: 'md' } as TFile,
      
      // Non-markdown files
      { path: 'image.png', basename: 'image', extension: 'png' } as TFile,
      { path: 'document.pdf', basename: 'document', extension: 'pdf' } as TFile
    ];
    
    mockVault.getFiles.mockReturnValue(testFiles);
    
    // Setup metadata cache responses
    mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
      const cacheMap = new Map([
        ['project1.md', {
          frontmatter: {
            exo__Instance_class: '[[ems__Project]]',
            status: 'active',
            priority: 'high',
            title: 'Project 1',
            updatedAt: '2024-01-15T10:00:00Z'
          }
        }],
        ['project2.md', {
          frontmatter: {
            exo__Instance_class: 'ems__Project',
            status: 'active',
            priority: 'medium',
            title: 'Project 2',
            updatedAt: '2024-01-14T10:00:00Z'
          }
        }],
        ['completed-project.md', {
          frontmatter: {
            exo__Instance_class: 'ems__Project',
            status: 'completed',
            priority: 'low',
            title: 'Completed Project',
            updatedAt: '2024-01-10T10:00:00Z'
          }
        }],
        ['task1.md', {
          frontmatter: {
            exo__Instance_class: 'ems__Task',
            status: 'todo',
            priority: 'medium',
            project: '[[project1]]',
            assignee: 'John Doe'
          }
        }],
        ['task2.md', {
          frontmatter: {
            exo__Instance_class: 'ems__Task',
            status: 'done',
            priority: 'low',
            project: '[[project2]]',
            assignee: 'Jane Smith'
          }
        }],
        ['high-priority-task.md', {
          frontmatter: {
            exo__Instance_class: 'ems__Task',
            status: 'in-progress',
            priority: 'high',
            project: '[[project1]]',
            assignee: 'Bob Johnson'
          }
        }],
        ['note1.md', {
          frontmatter: {
            exo__Instance_class: 'ems__Note',
            tags: ['research', 'important'],
            related_to: ['[[project1]]']
          }
        }],
        ['note2.md', {
          frontmatter: {
            exo__Instance_class: 'ems__Note',
            tags: ['meeting'],
            related_to: ['[[project2]]']
          }
        }],
        ['image.png', null],
        ['document.pdf', { frontmatter: null }]
      ]);
      
      return cacheMap.get(file.path) || { frontmatter: null };
    });
  });

  describe('Basic Query Execution', () => {
    it('should execute query and return all files when no filters are applied', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'SELECT * WHERE { ?s ?p ?o }'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(testFiles.length);
      expect(response.totalCount).toBe(testFiles.length);
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should measure execution time accurately', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list all'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const startTime = Date.now();
      const result = await useCase.execute(request);
      const endTime = Date.now();

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
      expect(response.executionTime).toBeLessThanOrEqual(endTime - startTime + 10); // Allow for small timing differences
    });

    it('should handle empty vault gracefully', async () => {
      mockVault.getFiles.mockReturnValue([]);

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list all'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(0);
      expect(response.totalCount).toBe(0);
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Class-based Filtering', () => {
    it('should filter by exact class name', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list projects',
          className: 'ems__Project'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3); // All project files
      expect(response.results.every(file => 
        ['project1.md', 'project2.md', 'completed-project.md'].includes(file.path)
      )).toBe(true);
    });

    it('should handle class names with wikilinks', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list projects',
          className: '[[ems__Project]]'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3);
    });

    it('should handle missing class gracefully', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list unknown',
          className: 'unknown__Class'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(0);
      expect(response.totalCount).toBe(0);
    });

    it('should filter tasks by class', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list tasks',
          className: 'ems__Task'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3); // All task files
      expect(response.results.every(file => 
        ['task1.md', 'task2.md', 'high-priority-task.md'].includes(file.path)
      )).toBe(true);
    });
  });

  describe('Property Filtering', () => {
    it('should filter by equals operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list active projects',
          className: 'ems__Project',
          propertyFilters: [{
            property: 'status',
            operator: 'equals',
            value: 'active'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(2); // project1 and project2
      expect(response.results.every(file => 
        ['project1.md', 'project2.md'].includes(file.path)
      )).toBe(true);
    });

    it('should filter by notEquals operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list non-completed projects',
          className: 'ems__Project',
          propertyFilters: [{
            property: 'status',
            operator: 'notEquals',
            value: 'completed'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(2); // project1 and project2
    });

    it('should filter by contains operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list tasks assigned to John',
          className: 'ems__Task',
          propertyFilters: [{
            property: 'assignee',
            operator: 'contains',
            value: 'John'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(2); // task1 (John Doe) and high-priority-task (Bob Johnson)
    });

    it('should filter by startsWith operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list tasks assigned to John',
          className: 'ems__Task',
          propertyFilters: [{
            property: 'assignee',
            operator: 'startsWith',
            value: 'John'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // task1 (John Doe)
      expect(response.results[0].path).toBe('task1.md');
    });

    it('should filter by endsWith operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list tasks assigned to people named Johnson',
          className: 'ems__Task',
          propertyFilters: [{
            property: 'assignee',
            operator: 'endsWith',
            value: 'Johnson'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // high-priority-task (Bob Johnson)
      expect(response.results[0].path).toBe('high-priority-task.md');
    });

    it('should filter by exists operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list items with assignee',
          propertyFilters: [{
            property: 'assignee',
            operator: 'exists',
            value: 'true'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3); // All tasks have assignee
    });

    it('should filter by notExists operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list items without assignee',
          propertyFilters: [{
            property: 'assignee',
            operator: 'notExists',
            value: 'true'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(5); // All non-task files (excluding non-MD files)
    });

    it('should handle multiple property filters with AND logic', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list high priority active projects',
          className: 'ems__Project',
          propertyFilters: [
            {
              property: 'status',
              operator: 'equals',
              value: 'active'
            },
            {
              property: 'priority',
              operator: 'equals',
              value: 'high'
            }
          ]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // Only project1
      expect(response.results[0].path).toBe('project1.md');
    });

    it('should handle array property values', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list research notes',
          className: 'ems__Note',
          propertyFilters: [{
            property: 'tags',
            operator: 'contains',
            value: 'research'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1);
      expect(response.results[0].path).toBe('note1.md');
    });

    it('should handle array values with equals operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list notes with specific tag',
          className: 'ems__Note',
          propertyFilters: [{
            property: 'tags',
            operator: 'equals',
            value: 'important'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1);
      expect(response.results[0].path).toBe('note1.md');
    });

    it('should handle array values with startsWith operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list notes with tags starting with research',
          className: 'ems__Note', 
          propertyFilters: [{
            property: 'tags',
            operator: 'startsWith',
            value: 'research'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1);
      expect(response.results[0].path).toBe('note1.md');
    });

    it('should handle array values with endsWith operator', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list notes with tags ending with ing',
          className: 'ems__Note',
          propertyFilters: [{
            property: 'tags',
            operator: 'endsWith', 
            value: 'ing'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1);
      expect(response.results[0].path).toBe('note2.md'); // 'meeting' ends with 'ing'
    });

    it('should handle unknown operators gracefully', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list with unknown operator',
          propertyFilters: [{
            property: 'status',
            operator: 'unknown' as any,
            value: 'active'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(0); // No matches for unknown operator
    });
  });

  describe('Template Variable Replacement', () => {
    it('should replace {{current_asset}} template variable', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list related to current',
          className: 'ems__Task',
          propertyFilters: [{
            property: 'project',
            operator: 'equals',
            value: '{{current_asset}}'
          }]
        },
        currentAssetPath: 'project1',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(2); // task1 and high-priority-task
    });

    it('should replace {{current_file}} template variable', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list related to current file',
          className: 'ems__Task',
          propertyFilters: [{
            property: 'project',
            operator: 'equals',
            value: '{{current_file}}'
          }]
        },
        currentAssetPath: 'project2',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // task2
      expect(response.results[0].path).toBe('task2.md');
    });

    it('should replace {{fm.property}} frontmatter variables', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list tasks with same priority as current',
          className: 'ems__Task',
          propertyFilters: [{
            property: 'priority',
            operator: 'equals',
            value: '{{fm.priority}}'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {
          priority: 'high'
        }
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // high-priority-task
      expect(response.results[0].path).toBe('high-priority-task.md');
    });

    it('should handle multiple template variables', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'complex query with templates',
          propertyFilters: [
            {
              property: 'project',
              operator: 'equals',
              value: '{{current_asset}}'
            },
            {
              property: 'priority',
              operator: 'equals',
              value: '{{fm.priority}}'
            }
          ]
        },
        currentAssetPath: 'project1',
        currentAssetFrontmatter: {
          priority: 'medium'
        }
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // task1
      expect(response.results[0].path).toBe('task1.md');
    });

    it('should handle missing frontmatter variables gracefully', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test missing frontmatter',
          propertyFilters: [{
            property: 'priority',
            operator: 'equals',
            value: '{{fm.nonexistent}}'
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(0); // No matches since template wasn't replaced
    });
  });

  describe('Relation Filtering', () => {
    it('should filter by relation property', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list items related to current',
          relationProperty: 'project'
        },
        currentAssetPath: 'project1',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(2); // task1 and high-priority-task
    });

    it('should handle array relation values', async () => {
      // Mock note with array related_to property
      mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
        if (file.path === 'note1.md') {
          return {
            frontmatter: {
              exo__Instance_class: 'ems__Note',
              tags: ['research', 'important'],
              related_to: ['[[project1]]', '[[project2]]']
            }
          };
        }
        // Use original cache for other files
        const originalImplementations = new Map([
          ['project1.md', {
            frontmatter: {
              exo__Instance_class: '[[ems__Project]]',
              status: 'active',
              priority: 'high',
              title: 'Project 1',
              updatedAt: '2024-01-15T10:00:00Z'
            }
          }],
          ['project2.md', {
            frontmatter: {
              exo__Instance_class: 'ems__Project',
              status: 'active',
              priority: 'medium',
              title: 'Project 2',
              updatedAt: '2024-01-14T10:00:00Z'
            }
          }],
          ['completed-project.md', {
            frontmatter: {
              exo__Instance_class: 'ems__Project',
              status: 'completed',
              priority: 'low',
              title: 'Completed Project',
              updatedAt: '2024-01-10T10:00:00Z'
            }
          }],
          ['task1.md', {
            frontmatter: {
              exo__Instance_class: 'ems__Task',
              status: 'todo',
              priority: 'medium',
              project: '[[project1]]',
              assignee: 'John Doe'
            }
          }],
          ['task2.md', {
            frontmatter: {
              exo__Instance_class: 'ems__Task',
              status: 'done',
              priority: 'low',
              project: '[[project2]]',
              assignee: 'Jane Smith'
            }
          }],
          ['high-priority-task.md', {
            frontmatter: {
              exo__Instance_class: 'ems__Task',
              status: 'in-progress',
              priority: 'high',
              project: '[[project1]]',
              assignee: 'Bob Johnson'
            }
          }],
          ['note2.md', {
            frontmatter: {
              exo__Instance_class: 'ems__Note',
              tags: ['meeting'],
              related_to: ['[[project2]]']
            }
          }],
          ['image.png', null],
          ['document.pdf', { frontmatter: null }]
        ]);
        
        return originalImplementations.get(file.path) || { frontmatter: null };
      });

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list notes related to current project',
          relationProperty: 'related_to'
        },
        currentAssetPath: 'project1',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // note1
      expect(response.results[0].path).toBe('note1.md');
    });

    it('should handle missing relation property gracefully', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list items with missing relation',
          relationProperty: 'nonexistent_relation'
        },
        currentAssetPath: 'project1',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(0);
    });
  });

  describe('Sorting', () => {
    it('should sort by property in ascending order', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list projects sorted by priority',
          className: 'ems__Project',
          sortBy: 'priority',
          sortOrder: 'asc'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3);
      
      // Check order: high, low, medium (alphabetical for string comparison)
      const priorities = response.results.map(file => {
        const cache = mockMetadataCache.getFileCache(file);
        return cache?.frontmatter?.priority || '';
      });
      expect(priorities[0]).toBe('high');
      expect(priorities[1]).toBe('low');
      expect(priorities[2]).toBe('medium');
    });

    it('should sort by property in descending order', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list projects sorted by priority desc',
          className: 'ems__Project',
          sortBy: 'priority',
          sortOrder: 'desc'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3);
      
      // Check reversed order
      const priorities = response.results.map(file => {
        const cache = mockMetadataCache.getFileCache(file);
        return cache?.frontmatter?.priority || '';
      });
      expect(priorities[0]).toBe('medium');
      expect(priorities[1]).toBe('low');
      expect(priorities[2]).toBe('high');
    });

    it('should handle missing sort property gracefully', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list sorted by nonexistent property',
          sortBy: 'nonexistent',
          sortOrder: 'asc'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(testFiles.length);
      // Should not crash and return results in some order
    });

    it('should default to ascending when sortOrder is not specified', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list projects with default sort order',
          className: 'ems__Project',
          sortBy: 'title'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3);
    });
  });

  describe('Result Limiting', () => {
    it('should limit results when maxResults is specified', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list limited projects',
          className: 'ems__Project',
          maxResults: 2
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(2);
      expect(response.totalCount).toBe(3); // Total before limiting
    });

    it('should handle maxResults larger than available results', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list with large limit',
          className: 'ems__Project',
          maxResults: 100
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3); // All available projects
      expect(response.totalCount).toBe(3);
    });

    it('should handle maxResults of zero', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list with zero limit',
          className: 'ems__Project',
          maxResults: 0
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3); // Ignores zero limit
      expect(response.totalCount).toBe(3);
    });

    it('should handle negative maxResults', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'list with negative limit',
          className: 'ems__Project',
          maxResults: -5
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3); // Ignores negative limit
      expect(response.totalCount).toBe(3);
    });
  });

  describe('Complex Query Combinations', () => {
    it('should combine class filter, property filters, sorting, and limiting', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'complex query',
          className: 'ems__Task',
          propertyFilters: [{
            property: 'status',
            operator: 'notEquals',
            value: 'done'
          }],
          sortBy: 'priority',
          sortOrder: 'desc',
          maxResults: 1
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1);
      expect(response.totalCount).toBe(2); // task1 and high-priority-task (not done)
    });

    it('should combine relation filter with class filter', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'tasks related to current project',
          className: 'ems__Task',
          relationProperty: 'project'
        },
        currentAssetPath: 'project1',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(2); // task1 and high-priority-task
      expect(response.results.every(file => 
        ['task1.md', 'high-priority-task.md'].includes(file.path)
      )).toBe(true);
    });

    it('should combine all filter types', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'comprehensive filter test',
          className: 'ems__Task',
          propertyFilters: [{
            property: 'status',
            operator: 'equals',
            value: 'in-progress'
          }],
          relationProperty: 'project',
          sortBy: 'priority',
          sortOrder: 'desc',
          maxResults: 10
        },
        currentAssetPath: 'project1',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // Only high-priority-task
      expect(response.results[0].path).toBe('high-priority-task.md');
    });
  });

  describe('Error Handling', () => {
    it('should handle vault.getFiles() throwing an error', async () => {
      mockVault.getFiles.mockImplementation(() => {
        throw new Error('Vault access error');
      });

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test error handling'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to execute query block');
      expect(result.error).toContain('Vault access error');
    });

    it('should handle metadataCache.getFileCache() throwing an error', async () => {
      mockMetadataCache.getFileCache.mockImplementation(() => {
        throw new Error('Metadata cache error');
      });

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test metadata error',
          className: 'ems__Project'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to execute query block');
      expect(result.error).toContain('Metadata cache error');
    });

    it('should handle null metadata gracefully', async () => {
      mockMetadataCache.getFileCache.mockReturnValue(null);

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test null metadata',
          className: 'ems__Project'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(0); // No files match without metadata
    });

    it('should handle undefined frontmatter gracefully', async () => {
      mockMetadataCache.getFileCache.mockReturnValue({ frontmatter: undefined });

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test undefined frontmatter',
          className: 'ems__Project'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty property filters array', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test empty filters',
          className: 'ems__Project',
          propertyFilters: []
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3); // All projects
    });

    it('should handle null/undefined filter values', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test null filter values',
          propertyFilters: [{
            property: 'status',
            operator: 'equals',
            value: null as any
          }]
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      // Should handle gracefully without crashing
    });

    it('should handle empty string values', async () => {
      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test empty string values',
          className: '',
          propertyFilters: [{
            property: 'status',
            operator: 'equals',
            value: ''
          }]
        },
        currentAssetPath: '',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      // Should handle gracefully
    });

    it('should handle circular wikilink references', async () => {
      mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
        if (file.path === 'circular1.md') {
          return {
            frontmatter: {
              exo__Instance_class: 'ems__Test',
              references: '[[circular2]]'
            }
          };
        }
        if (file.path === 'circular2.md') {
          return {
            frontmatter: {
              exo__Instance_class: 'ems__Test',
              references: '[[circular1]]'
            }
          };
        }
        return { frontmatter: null };
      });

      const circularFiles = [
        { path: 'circular1.md', basename: 'circular1', extension: 'md' } as TFile,
        { path: 'circular2.md', basename: 'circular2', extension: 'md' } as TFile
      ];
      mockVault.getFiles.mockReturnValue(circularFiles);

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test circular references',
          relationProperty: 'references'
        },
        currentAssetPath: 'circular1',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(1); // circular2
    });

    it('should handle files with special characters in path', async () => {
      const specialFiles = [
        { path: 'file with spaces.md', basename: 'file with spaces', extension: 'md' } as TFile,
        { path: 'file-with-dashes.md', basename: 'file-with-dashes', extension: 'md' } as TFile,
        { path: 'file_with_underscores.md', basename: 'file_with_underscores', extension: 'md' } as TFile
      ];
      mockVault.getFiles.mockReturnValue(specialFiles);
      mockMetadataCache.getFileCache.mockReturnValue({ frontmatter: { status: 'test' } });

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'test special characters'
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(3);
    });
  });

  describe('Performance and Timing', () => {
    it('should complete execution within reasonable time', async () => {
      // Create a larger dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        path: `file${i}.md`,
        basename: `file${i}`,
        extension: 'md'
      })) as TFile[];
      
      mockVault.getFiles.mockReturnValue(largeDataset);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: 'ems__Test',
          status: 'active',
          priority: 'medium'
        }
      });

      const request: ExecuteQueryBlockRequest = {
        blockConfig: {
          type: 'query',
          query: 'performance test',
          className: 'ems__Test',
          propertyFilters: [{
            property: 'status',
            operator: 'equals',
            value: 'active'
          }],
          sortBy: 'priority',
          maxResults: 10
        },
        currentAssetPath: 'current.md',
        currentAssetFrontmatter: {}
      };

      const startTime = Date.now();
      const result = await useCase.execute(request);
      const endTime = Date.now();

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
      expect(response.executionTime).toBeLessThanOrEqual(endTime - startTime + 10);
    });

    it('should track execution time accurately for different operations', async () => {
      const operations = [
        { 
          name: 'simple query',
          config: { type: 'query' as const, query: 'simple' }
        },
        {
          name: 'filtered query',
          config: {
            type: 'query' as const,
            query: 'filtered',
            className: 'ems__Project',
            propertyFilters: [{ property: 'status', operator: 'equals' as const, value: 'active' }]
          }
        },
        {
          name: 'sorted query',
          config: {
            type: 'query' as const,
            query: 'sorted',
            className: 'ems__Project',
            sortBy: 'priority'
          }
        }
      ];

      const timings: number[] = [];

      for (const operation of operations) {
        const request: ExecuteQueryBlockRequest = {
          blockConfig: operation.config,
          currentAssetPath: 'current.md',
          currentAssetFrontmatter: {}
        };

        const result = await useCase.execute(request);
        expect(result.isSuccess).toBe(true);
        
        const response = result.getValue();
        timings.push(response.executionTime);
        expect(response.executionTime).toBeGreaterThanOrEqual(0);
      }

      // All operations should have measurable execution times
      timings.forEach(time => {
        expect(time).toBeGreaterThanOrEqual(0);
        expect(time).toBeLessThan(1000); // Reasonable upper bound
      });
    });
  });
});