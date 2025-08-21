import { BacklinksBlockRenderer } from '../../../../src/presentation/renderers/BacklinksBlockRenderer';
import { BacklinksBlockConfig } from '../../../../src/domain/entities/LayoutBlock';
import { App, TFile } from '../../../__mocks__/obsidian';

describe('BacklinksBlockRenderer', () => {
    let renderer: BacklinksBlockRenderer;
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

        renderer = new BacklinksBlockRenderer(mockApp);
    });

    describe('render', () => {
        it('should display empty message when no backlinks exist', async () => {
            const config: BacklinksBlockConfig = { type: 'backlinks' };

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: new Map()
            });

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('No backlinks found');
            expect(mockContainer.querySelector('.exocortex-empty')).toBeTruthy();
        });

        it('should include all backlinks without filtering by relationship type', async () => {
            const config: BacklinksBlockConfig = { type: 'backlinks' };

            const backlinkPaths = new Map([
                ['child-effort.md', {}],
                ['regular-backlink.md', {}],
                ['another-regular.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const childEffortFile = createMockTFile('child-effort.md');
            const regularFile1 = createMockTFile('regular-backlink.md');
            const regularFile2 = createMockTFile('another-regular.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(childEffortFile)
                .mockReturnValueOnce(regularFile1)
                .mockReturnValueOnce(regularFile2);

            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => {
                    if (file.path === 'child-effort.md') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file'],
                                'exo__Asset_label': 'Child Effort',
                                'exo__Instance_class': 'Task'
                            }
                        };
                    }
                    if (file.path === 'regular-backlink.md') {
                        return {
                            frontmatter: {
                                'exo__Asset_label': 'Regular Reference',
                                'exo__Instance_class': 'Note'
                            }
                        };
                    }
                    if (file.path === 'another-regular.md') {
                        return {
                            frontmatter: {
                                'exo__Asset_label': 'Another Reference',
                                'exo__Instance_class': 'Document'
                            }
                        };
                    }
                    return { frontmatter: {} };
                });

            await renderer.render(mockContainer, config, mockFile, null);

            // Should show all backlinks now (no filtering)
            expect(mockContainer.textContent).toContain('3 backlinks');
            
            // Should display all backlinks including child effort
            expect(mockContainer.textContent).toContain('Child Effort');
            expect(mockContainer.textContent).toContain('Regular Reference');
            expect(mockContainer.textContent).toContain('Another Reference');
        });

        it('should show all backlinks when no ems__Effort_parent relationships exist', async () => {
            const config: BacklinksBlockConfig = { type: 'backlinks' };

            const backlinkPaths = new Map([
                ['backlink1.md', {}],
                ['backlink2.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const backlink1 = createMockTFile('backlink1.md');
            const backlink2 = createMockTFile('backlink2.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(backlink1)
                .mockReturnValueOnce(backlink2);

            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => ({
                    frontmatter: {
                        'exo__Asset_label': `Reference ${file.basename}`,
                        'exo__Instance_class': 'Note'
                    }
                }));

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('2 backlinks');
            expect(mockContainer.textContent).toContain('Reference backlink1');
            expect(mockContainer.textContent).toContain('Reference backlink2');
        });

        it('should handle all backlinks including those with array properties', async () => {
            const config: BacklinksBlockConfig = { type: 'backlinks' };

            const backlinkPaths = new Map([
                ['multi-parent-child.md', {}],
                ['regular-backlink.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const multiParentChild = createMockTFile('multi-parent-child.md');
            const regularFile = createMockTFile('regular-backlink.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(multiParentChild)
                .mockReturnValueOnce(regularFile);

            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => {
                    if (file.path === 'multi-parent-child.md') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file', 'other-parent'],
                                'exo__Asset_label': 'Multi Parent Child'
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

            expect(mockContainer.textContent).toContain('2 backlinks');
            expect(mockContainer.textContent).toContain('Regular Reference');
            expect(mockContainer.textContent).toContain('Multi Parent Child');
        });

        it('should filter by class while including all relationship types', async () => {
            const config: BacklinksBlockConfig = { 
                type: 'backlinks',
                filterByClass: 'Note'
            };

            const backlinkPaths = new Map([
                ['note-child.md', {}],
                ['note-regular.md', {}],
                ['task-regular.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const noteChild = createMockTFile('note-child.md');
            const noteRegular = createMockTFile('note-regular.md');
            const taskRegular = createMockTFile('task-regular.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(noteChild)
                .mockReturnValueOnce(noteRegular)
                .mockReturnValueOnce(taskRegular);

            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => {
                    if (file.path === 'note-child.md') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file'],
                                'exo__Asset_label': 'Note Child',
                                'exo__Instance_class': 'Note'
                            }
                        };
                    }
                    if (file.path === 'note-regular.md') {
                        return {
                            frontmatter: {
                                'exo__Asset_label': 'Note Regular',
                                'exo__Instance_class': 'Note'
                            }
                        };
                    }
                    if (file.path === 'task-regular.md') {
                        return {
                            frontmatter: {
                                'exo__Asset_label': 'Task Regular',
                                'exo__Instance_class': 'Task'
                            }
                        };
                    }
                    return { frontmatter: {} };
                });

            await renderer.render(mockContainer, config, mockFile, null);

            // Should show all Note class files (including child)
            expect(mockContainer.textContent).toContain('2 backlinks');
            expect(mockContainer.textContent).toContain('Note Regular');
            expect(mockContainer.textContent).toContain('Note Child');
            expect(mockContainer.textContent).not.toContain('Task Regular');
        });

        it('should group by class including all relationship types', async () => {
            const config: BacklinksBlockConfig = { 
                type: 'backlinks',
                groupByClass: true
            };

            const backlinkPaths = new Map([
                ['note1.md', {}],
                ['note2.md', {}],
                ['task-child.md', {}],
                ['task-regular.md', {}]
            ]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const note1 = createMockTFile('note1.md');
            const note2 = createMockTFile('note2.md');
            const taskChild = createMockTFile('task-child.md');
            const taskRegular = createMockTFile('task-regular.md');

            mockApp.vault.getAbstractFileByPath
                .mockReturnValueOnce(note1)
                .mockReturnValueOnce(note2)
                .mockReturnValueOnce(taskChild)
                .mockReturnValueOnce(taskRegular);

            mockApp.metadataCache.getFileCache
                .mockImplementation((file: TFile) => {
                    const basename = file.path.split('.')[0];
                    if (basename.startsWith('note')) {
                        return {
                            frontmatter: {
                                'exo__Asset_label': `Note ${basename}`,
                                'exo__Instance_class': 'Note'
                            }
                        };
                    }
                    if (basename === 'task-child') {
                        return {
                            frontmatter: {
                                'ems__Effort_parent': ['test-file'],
                                'exo__Asset_label': 'Task Child',
                                'exo__Instance_class': 'Task'
                            }
                        };
                    }
                    if (basename === 'task-regular') {
                        return {
                            frontmatter: {
                                'exo__Asset_label': 'Task Regular',
                                'exo__Instance_class': 'Task'
                            }
                        };
                    }
                    return { frontmatter: {} };
                });

            await renderer.render(mockContainer, config, mockFile, null);

            // Should show Note (2) and Task (2) - including all tasks
            expect(mockContainer.textContent).toContain('Note (2)');
            expect(mockContainer.textContent).toContain('Task (2)');
            expect(mockContainer.textContent).toContain('Task Regular');
            expect(mockContainer.textContent).toContain('Task Child');
        });

        it('should handle missing frontmatter gracefully', async () => {
            const config: BacklinksBlockConfig = { type: 'backlinks' };

            const backlinkPaths = new Map([['file.md', {}]]);

            mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
                data: backlinkPaths
            });

            const file = createMockTFile('file.md');
            mockApp.vault.getAbstractFileByPath.mockReturnValueOnce(file);

            mockApp.metadataCache.getFileCache.mockReturnValue(null);

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('1 backlink');
            expect(mockContainer.textContent).toContain('file');
        });
    });

});