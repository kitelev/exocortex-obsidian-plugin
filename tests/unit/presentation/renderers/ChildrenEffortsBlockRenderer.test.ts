import { ChildrenEffortsBlockRenderer } from '../../../../src/presentation/renderers/ChildrenEffortsBlockRenderer';
import { ChildrenEffortsBlockConfig } from '../../../../src/domain/entities/LayoutBlock';
import { App, TFile } from '../../../__mocks__/obsidian';

describe('ChildrenEffortsBlockRenderer', () => {
    let renderer: ChildrenEffortsBlockRenderer;
    let mockApp: any;
    let mockFile: TFile;
    let mockContainer: HTMLElement;

    // Helper function to create mock TFile instances
    const createMockTFile = (path: string): TFile => {
        const file = new TFile();
        file.path = path;
        file.basename = path.split('/').pop()?.replace(/\.md$/, '') || '';
        return file;
    };

    beforeEach(() => {
        // Setup mock app using the proper mock
        mockApp = new App();

        // Setup mock file using the proper mock
        mockFile = createMockTFile('test-file.md');

        // Override methods with jest mocks for testing
        mockApp.metadataCache.getBacklinksForFile = jest.fn();
        mockApp.metadataCache.getFileCache = jest.fn();
        mockApp.vault.getAbstractFileByPath = jest.fn();

        // Setup DOM
        document.body.innerHTML = '';
        mockContainer = document.createElement('div');
        document.body.appendChild(mockContainer);

        renderer = new ChildrenEffortsBlockRenderer(mockApp);
    });

    describe('render', () => {
        it('should display empty message when no backlinks exist', async () => {
            const config: ChildrenEffortsBlockConfig = { type: 'children-efforts' };

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: new Map()
            });

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('No children efforts found');
            expect(mockContainer.querySelector('.exocortex-empty')).toBeTruthy();
        });

        it('should filter backlinks to only show ems__Effort_parent relationships', async () => {
            const config: ChildrenEffortsBlockConfig = { type: 'children-efforts' };

            // Mock backlinks
            const backlinkPaths = new Map([
                ['child1.md', {}],
                ['child2.md', {}],
                ['regular-backlink.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            // Mock files
            const childFile1 = createMockTFile('child1.md');
            const childFile2 = createMockTFile('child2.md');
            const regularFile = createMockTFile('regular-backlink.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(childFile1)
                .mockReturnValueOnce(childFile2)
                .mockReturnValueOnce(regularFile);

            // Mock metadata - only child files have ems__Effort_parent
            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => {
                    if (file.path === 'child1.md') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file'],
                                'exo__Asset_label': 'Child Task 1',
                                'exo__Instance_class': 'Task'
                            }
                        };
                    }
                    if (file.path === 'child2.md') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': 'test-file',
                                'exo__Asset_label': 'Child Task 2',
                                'exo__Instance_class': 'Task'
                            }
                        };
                    }
                    if (file.path === 'regular-backlink.md') {
                        return {
                            frontmatter: {
                                'exo__Asset_label': 'Regular Reference'
                            }
                        };
                    }
                    return { frontmatter: {} };
                });

            await renderer.render(mockContainer, config, mockFile, null);

            // Should show count of only child efforts
            expect(mockContainer.textContent).toContain('2 child efforts');
            
            // Should display child tasks
            expect(mockContainer.textContent).toContain('Child Task 1');
            expect(mockContainer.textContent).toContain('Child Task 2');
            
            // Should not display regular backlink
            expect(mockContainer.textContent).not.toContain('Regular Reference');
        });

        it('should respect maxResults configuration', async () => {
            const config: ChildrenEffortsBlockConfig = { 
                type: 'children-efforts',
                maxResults: 1
            };

            // Mock multiple child files
            const backlinkPaths = new Map([
                ['child1.md', {}],
                ['child2.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const childFile1 = createMockTFile('child1.md');
            const childFile2 = createMockTFile('child2.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(childFile1)
                .mockReturnValueOnce(childFile2);

            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => ({
                    frontmatter: {
                        'ems__Effort_parent': ['test-file'],
                        'exo__Asset_label': `Child Task ${file.basename}`,
                        'exo__Instance_class': 'Task'
                    }
                }));

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('2 child efforts, showing 1');
            
            // Should only display one item
            const listItems = mockContainer.querySelectorAll('li');
            expect(listItems.length).toBe(1);
        });

        it('should filter by class when filterByClass is specified', async () => {
            const config: ChildrenEffortsBlockConfig = { 
                type: 'children-efforts',
                filterByClass: 'Task'
            };

            const backlinkPaths = new Map([
                ['task.md', {}],
                ['milestone.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const taskFile = createMockTFile('task.md');
            const milestoneFile = createMockTFile('milestone.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(taskFile)
                .mockReturnValueOnce(milestoneFile);

            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => {
                    if (file.path === 'task.md') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file'],
                                'exo__Asset_label': 'Task Item',
                                'exo__Instance_class': 'Task'
                            }
                        };
                    }
                    if (file.path === 'milestone.md') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file'],
                                'exo__Asset_label': 'Milestone Item',
                                'exo__Instance_class': 'Milestone'
                            }
                        };
                    }
                    return { frontmatter: {} };
                });

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('Task Item');
            expect(mockContainer.textContent).not.toContain('Milestone Item');
            expect(mockContainer.textContent).toContain('1 child effort');
        });

        it('should group by class when groupByClass is enabled', async () => {
            const config: ChildrenEffortsBlockConfig = { 
                type: 'children-efforts',
                groupByClass: true
            };

            const backlinkPaths = new Map([
                ['task1.md', {}],
                ['task2.md', {}],
                ['milestone.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const taskFile1 = createMockTFile('task1.md');
            const taskFile2 = createMockTFile('task2.md');
            const milestoneFile = createMockTFile('milestone.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(taskFile1)
                .mockReturnValueOnce(taskFile2)
                .mockReturnValueOnce(milestoneFile);

            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => {
                    const basename = file.path.split('.')[0];
                    if (basename.startsWith('task')) {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file'],
                                'exo__Asset_label': `Task ${basename}`,
                                'exo__Instance_class': 'Task'
                            }
                        };
                    }
                    if (basename === 'milestone') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file'],
                                'exo__Asset_label': 'Milestone Item',
                                'exo__Instance_class': 'Milestone'
                            }
                        };
                    }
                    return { frontmatter: {} };
                });

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('Task (2)');
            expect(mockContainer.textContent).toContain('Milestone (1)');
            
            const groupHeaders = mockContainer.querySelectorAll('.children-efforts-group-header');
            expect(groupHeaders.length).toBe(2);
        });

        it('should show parent path when showParentPath is enabled', async () => {
            const config: ChildrenEffortsBlockConfig = { 
                type: 'children-efforts',
                showParentPath: true
            };

            const backlinkPaths = new Map([['child.md', {}]]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const childFile = createMockTFile('child.md');
            mockApp.vault.getAbstractFileByPath.mockReturnValueOnce(childFile);

            mockApp.metadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    'ems__Effort_parent': ['test-file'],  // Changed to match test-file
                    'exo__Asset_label': 'Child Task',
                    'exo__Instance_class': 'Task'
                }
            });

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('→ test-file');
            expect(mockContainer.querySelector('.exocortex-parent-path')).toBeTruthy();
        });

        it('should handle array format for ems__Effort_parent', async () => {
            const config: ChildrenEffortsBlockConfig = { type: 'children-efforts' };

            const backlinkPaths = new Map([['child.md', {}]]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const childFile = createMockTFile('child.md');
            mockApp.vault.getAbstractFileByPath.mockReturnValueOnce(childFile);

            mockApp.metadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    'ems__Effort_parent': ['test-file', 'other-parent'],
                    'exo__Asset_label': 'Child Task'
                }
            });

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('Child Task');
            expect(mockContainer.textContent).toContain('1 child effort');
        });

        it('should handle missing frontmatter gracefully', async () => {
            const config: ChildrenEffortsBlockConfig = { type: 'children-efforts' };

            const backlinkPaths = new Map([['child.md', {}]]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const childFile = createMockTFile('child.md');
            mockApp.vault.getAbstractFileByPath.mockReturnValueOnce(childFile);

            mockApp.metadataCache.getFileCache.mockReturnValue(null);

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('No matching child efforts found');
        });
    });

    describe('isChildEffort', () => {
        it('should identify child effort relationships correctly', async () => {
            const config: ChildrenEffortsBlockConfig = { type: 'children-efforts' };
            const childFile = createMockTFile('child.md');
            const parentFile = createMockTFile('parent.md');

            // Test with direct basename match
            mockApp.metadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    'ems__Effort_parent': ['parent']
                }
            });

            const backlinkPaths = new Map([['child.md', {}]]);
            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });
            mockApp.vault.getAbstractFileByPath.mockReturnValueOnce(childFile);

            await renderer.render(mockContainer, config, parentFile, null);

            expect(mockContainer.textContent).toContain('1 child effort');
        });
    });
});