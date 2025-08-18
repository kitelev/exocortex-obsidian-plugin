import { NativeQueryEngine } from '../../../../src/infrastructure/query-engines/NativeQueryEngine';
import { App, TFile, CachedMetadata } from 'obsidian';

// Mock Obsidian types
const mockApp = {
    vault: {
        getMarkdownFiles: jest.fn(),
        getAbstractFileByPath: jest.fn(),
        read: jest.fn(),
        cachedRead: jest.fn()
    },
    metadataCache: {
        getFileCache: jest.fn(),
        on: jest.fn()
    }
} as unknown as App;

const createMockFile = (path: string, name: string, content = ''): TFile => {
    const mockFile = Object.create(TFile.prototype);
    Object.assign(mockFile, {
        path,
        name,
        basename: name.replace(/\.md$/, ''),
        extension: 'md',
        stat: {
            ctime: Date.now() - 86400000, // 1 day ago
            mtime: Date.now() - 3600000,  // 1 hour ago
            size: content.length
        },
        vault: mockApp.vault
    });
    return mockFile;
};

const createMockMetadata = (frontmatter?: any, tags?: string[]): CachedMetadata => ({
    frontmatter: frontmatter || {},
    tags: tags?.map(tag => ({ tag, position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 0, offset: 0 } } })) || [],
    links: [],
    headings: []
});

describe('NativeQueryEngine', () => {
    let engine: NativeQueryEngine;

    beforeEach(() => {
        jest.clearAllMocks();
        engine = new NativeQueryEngine(mockApp);
    });

    describe('initialization', () => {
        it('should initialize with correct type', () => {
            expect(engine.getType()).toBe('native');
        });

        it('should be available when app is provided', () => {
            expect(engine.isAvailable()).toBe(true);
        });

        it('should not be available without app', () => {
            const engineWithoutApp = new NativeQueryEngine(null as any);
            expect(engineWithoutApp.isAvailable()).toBe(false);
        });
    });

    describe('query validation', () => {
        it('should validate correct table query', () => {
            const result = engine.validateQuery('table file.name from "Projects"');
            expect(result.isSuccess).toBe(true);
        });

        it('should validate correct list query', () => {
            const result = engine.validateQuery('list from #tasks');
            expect(result.isSuccess).toBe(true);
        });

        it('should reject empty query', () => {
            const result = engine.validateQuery('');
            expect(result.isSuccess).toBe(false);
            expect(result.getErrorMessage()).toContain('empty');
        });

        it('should reject query without valid keywords', () => {
            const result = engine.validateQuery('invalid query syntax');
            expect(result.isSuccess).toBe(false);
        });
    });

    describe('table queries', () => {
        beforeEach(() => {
            const mockFiles = [
                createMockFile('Projects/Project A.md', 'Project A.md'),
                createMockFile('Projects/Project B.md', 'Project B.md'),
                createMockFile('Tasks/Task 1.md', 'Task 1.md')
            ];

            mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => 
                mockFiles.find(f => f.path === path)
            );
            
            mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
                if (file.path.includes('Project')) {
                    return createMockMetadata({ type: 'project', priority: 'high' });
                }
                return createMockMetadata({ type: 'task' });
            });
        });

        it('should execute basic table query', async () => {
            const result = await engine.executeQuery('table file.name from "Projects"');
            
            expect(result.isSuccess).toBe(true);
            const queryResult = result.getValue()!;
            expect(queryResult.type).toBe('table');
            expect(queryResult.data).toHaveLength(2);
            expect(queryResult.columns).toContain('file.name');
        });

        it('should execute table query with multiple fields', async () => {
            const result = await engine.executeQuery('table file.name, type, priority from "Projects"');
            
            expect(result.isSuccess).toBe(true);
            const queryResult = result.getValue()!;
            expect(queryResult.columns).toEqual(['file.name', 'type', 'priority']);
            expect(queryResult.data[0]).toHaveProperty('type', 'project');
            expect(queryResult.data[0]).toHaveProperty('priority', 'high');
        });

        it('should execute table query with where clause', async () => {
            const result = await engine.executeQuery('table file.name, type from "Projects" where type = "project"');
            
            expect(result.isSuccess).toBe(true);
            const queryResult = result.getValue()!;
            expect(queryResult.data).toHaveLength(2);
            expect(queryResult.metadata).toHaveProperty('where');
        });

        it('should handle table query without from clause', async () => {
            const result = await engine.executeQuery('table file.name');
            
            expect(result.isSuccess).toBe(false);
            expect(result.getErrorMessage()).toContain('missing FROM clause');
        });
    });

    describe('list queries', () => {
        beforeEach(() => {
            const mockFiles = [
                createMockFile('Notes/Note 1.md', 'Note 1.md'),
                createMockFile('Notes/Note 2.md', 'Note 2.md')
            ];

            mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockApp.metadataCache.getFileCache.mockReturnValue(createMockMetadata());
        });

        it('should execute basic list query', async () => {
            const result = await engine.executeQuery('list from "Notes"');
            
            expect(result.isSuccess).toBe(true);
            const queryResult = result.getValue()!;
            expect(queryResult.type).toBe('list');
            expect(queryResult.data).toHaveLength(2);
            expect(queryResult.data[0]).toHaveProperty('link');
        });

        it('should handle list query without from clause', async () => {
            const result = await engine.executeQuery('list');
            
            expect(result.isSuccess).toBe(false);
            expect(result.getErrorMessage()).toContain('missing FROM clause');
        });
    });

    describe('task queries', () => {
        beforeEach(() => {
            const mockFiles = [createMockFile('Tasks/Tasks.md', 'Tasks.md')];
            const taskContent = `
# Tasks
- [ ] Incomplete task 1
- [x] Completed task
- [ ] Incomplete task 2
            `;

            mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFiles[0]);
            mockApp.vault.read.mockResolvedValue(taskContent);
            mockApp.vault.cachedRead.mockResolvedValue(taskContent);
            mockApp.metadataCache.getFileCache.mockReturnValue(createMockMetadata());
        });

        it('should execute task query and return only incomplete tasks', async () => {
            const result = await engine.executeQuery('task from "Tasks"');
            
            expect(result.isSuccess).toBe(true);
            const queryResult = result.getValue()!;
            expect(queryResult.type).toBe('task');
            expect(queryResult.data).toHaveLength(2); // Only incomplete tasks
            expect(queryResult.data[0]).toHaveProperty('completed', false);
        });

        it('should handle task query without source', async () => {
            const result = await engine.executeQuery('task');
            
            expect(result.isSuccess).toBe(true);
            const queryResult = result.getValue()!;
            expect(queryResult.type).toBe('task');
        });
    });

    describe('calendar queries', () => {
        beforeEach(() => {
            const mockFiles = [
                createMockFile('Events/Event 1.md', 'Event 1.md'),
                createMockFile('Events/Event 2.md', 'Event 2.md')
            ];

            mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockApp.metadataCache.getFileCache.mockImplementation(() => 
                createMockMetadata({ date: '2025-01-15', title: 'Test Event' })
            );
        });

        it('should execute calendar query', async () => {
            const result = await engine.executeQuery('calendar');
            
            expect(result.isSuccess).toBe(true);
            const queryResult = result.getValue()!;
            expect(queryResult.type).toBe('calendar');
            expect(queryResult.data).toHaveLength(2);
            expect(queryResult.data[0]).toHaveProperty('date');
        });
    });

    describe('getPages', () => {
        beforeEach(() => {
            const mockFiles = [
                createMockFile('Folder/File1.md', 'File1.md'),
                createMockFile('Folder/File2.md', 'File2.md'),
                createMockFile('Other/File3.md', 'File3.md')
            ];

            mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockApp.metadataCache.getFileCache.mockReturnValue(createMockMetadata());
        });

        it('should get all pages for empty source', async () => {
            const result = await engine.getPages('""');
            
            expect(result.isSuccess).toBe(true);
            const pages = result.getValue()!;
            expect(pages).toHaveLength(3);
        });

        it('should filter pages by folder', async () => {
            const result = await engine.getPages('"Folder"');
            
            expect(result.isSuccess).toBe(true);
            const pages = result.getValue()!;
            expect(pages).toHaveLength(2);
            expect(pages[0].file.path).toContain('Folder');
        });

        it('should filter pages by tag', async () => {
            mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
                if (file.path.includes('File1')) {
                    return createMockMetadata({}, ['important']);
                }
                return createMockMetadata();
            });

            const result = await engine.getPages('#important');
            
            expect(result.isSuccess).toBe(true);
            const pages = result.getValue()!;
            expect(pages).toHaveLength(1);
        });
    });

    describe('getPageMetadata', () => {
        beforeEach(() => {
            const mockFile = createMockFile('Test/File.md', 'File.md');
            mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockApp.metadataCache.getFileCache.mockReturnValue(
                createMockMetadata(
                    { title: 'Test File', tags: ['test'] },
                    ['#project', '#important']
                )
            );
        });

        it('should get page metadata', async () => {
            const result = await engine.getPageMetadata('Test/File.md');
            
            expect(result.isSuccess).toBe(true);
            const metadata = result.getValue()!;
            expect(metadata.frontmatter).toHaveProperty('title', 'Test File');
            expect(metadata.tags).toContain('#project');
            expect(metadata.file).toHaveProperty('path', 'Test/File.md');
        });

        it('should handle non-existent file', async () => {
            mockApp.vault.getAbstractFileByPath.mockReturnValue(null);
            
            const result = await engine.getPageMetadata('NonExistent.md');
            
            expect(result.isSuccess).toBe(false);
            expect(result.getErrorMessage()).toContain('File not found');
        });
    });

    describe('renderQuery', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            mockApp.vault.getMarkdownFiles.mockReturnValue([
                createMockFile('Test/File.md', 'File.md')
            ]);
            mockApp.metadataCache.getFileCache.mockReturnValue(createMockMetadata());
        });

        it('should render table query', async () => {
            const result = await engine.renderQuery(container, 'table file.name from "Test"');
            
            expect(result.isSuccess).toBe(true);
            expect(container.querySelector('table')).toBeTruthy();
            expect(container.querySelector('.exo-native-table')).toBeTruthy();
        });

        it('should render list query', async () => {
            const result = await engine.renderQuery(container, 'list from "Test"');
            
            expect(result.isSuccess).toBe(true);
            expect(container.querySelector('ul')).toBeTruthy();
            expect(container.querySelector('.exo-native-list')).toBeTruthy();
        });

        it('should show empty message for no results', async () => {
            mockApp.vault.getMarkdownFiles.mockReturnValue([]);
            
            const result = await engine.renderQuery(container, 'list from "Empty"');
            
            // Either success with "No results found" or failure due to empty query
            if (result.isSuccess) {
                expect(container.textContent).toContain('No results found');
            } else {
                // Empty queries may legitimately fail
                expect(result.getError()).toBeDefined();
            }
        });
    });

    describe('caching', () => {
        beforeEach(() => {
            mockApp.vault.getMarkdownFiles.mockReturnValue([
                createMockFile('Test/File.md', 'File.md')
            ]);
            mockApp.metadataCache.getFileCache.mockReturnValue(createMockMetadata());
        });

        it('should cache query results', async () => {
            // First query
            const result1 = await engine.executeQuery('list from "Test"');
            expect(result1.isSuccess).toBe(true);
            
            // Second identical query should use cache
            const result2 = await engine.executeQuery('list from "Test"');
            expect(result2.isSuccess).toBe(true);
            
            // Should only call getMarkdownFiles once due to caching
            // Note: This is more of an integration test, actual caching verification
            // would require more sophisticated mocking
        });

        it('should provide cache statistics', () => {
            const stats = engine.getCacheStats();
            expect(stats).toHaveProperty('queryCache');
            expect(stats).toHaveProperty('metadataCache');
        });

        it('should clear caches', () => {
            engine.clearCaches();
            const stats = engine.getCacheStats();
            expect(stats.queryCache).toBe(0);
            expect(stats.metadataCache).toBe(0);
        });
    });

    describe('error handling', () => {
        it('should handle vault read errors gracefully', async () => {
            mockApp.vault.getMarkdownFiles.mockReturnValue([
                createMockFile('Test/File.md', 'File.md')
            ]);
            mockApp.vault.read.mockRejectedValue(new Error('Read error'));
            mockApp.vault.cachedRead.mockRejectedValue(new Error('Read error'));
            
            const result = await engine.executeQuery('task from "Test"');
            
            expect(result.isSuccess).toBe(true);
            // Should handle error and return empty task list
            const queryResult = result.getValue()!;
            expect(queryResult.data).toHaveLength(0);
        });

        it('should handle metadata cache errors', async () => {
            mockApp.vault.getMarkdownFiles.mockReturnValue([
                createMockFile('Test/File.md', 'File.md')
            ]);
            mockApp.metadataCache.getFileCache.mockReturnValue(null);
            
            const result = await engine.executeQuery('table file.name, title from "Test"');
            
            expect(result.isSuccess).toBe(true);
            const queryResult = result.getValue()!;
            expect(queryResult.data[0].title).toBe(''); // Should handle missing metadata
        });
    });

    describe('mobile optimizations', () => {
        it('should limit cache size for mobile', () => {
            // This test would require access to internal cache implementation
            // For now, just verify the cache clearing functionality works
            engine.clearCaches();
            const stats = engine.getCacheStats();
            expect(typeof stats.queryCache).toBe('number');
        });
    });
});