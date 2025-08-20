import { ChildrenEffortsBlockRenderer } from '../../../../src/presentation/renderers/ChildrenEffortsBlockRenderer';
import { App, TFile, CachedMetadata } from 'obsidian';

describe('ChildrenEffortsBlockRenderer - Matching Logic', () => {
    let renderer: ChildrenEffortsBlockRenderer;
    let mockApp: App;
    let parentFile: TFile;
    let childFile: TFile;

    beforeEach(() => {
        // Mock Obsidian App
        mockApp = {
            metadataCache: {
                getBacklinksForFile: jest.fn(),
                getFileCache: jest.fn()
            },
            vault: {
                getAbstractFileByPath: jest.fn()
            }
        } as any;

        renderer = new ChildrenEffortsBlockRenderer(mockApp);
    });

    describe('isChildEffort matching', () => {
        it('should match when ems__Effort_parent contains exact parent name with brackets', () => {
            parentFile = {
                path: '01 Inbox/Project - Антифрод-триггеры.md',
                basename: 'Project - Антифрод-триггеры.md',
                name: 'Project - Антифрод-триггеры'
            } as TFile;

            childFile = {
                path: '01 Inbox/Project - Взять в работу эпик по антифрод-триггерам.md',
                basename: 'Project - Взять в работу эпик по антифрод-триггерам.md'
            } as TFile;

            // Mock metadata for child file with parent reference
            mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
                frontmatter: {
                    'ems__Effort_parent': '[[Project - Антифрод-триггеры]]'
                }
            });

            // Access private method through any type casting
            const result = (renderer as any).isChildEffort(childFile, parentFile);
            expect(result).toBe(true);
        });

        it('should match when ems__Effort_parent contains parent name without brackets', () => {
            parentFile = {
                path: '01 Inbox/Project - Антифрод-триггеры.md',
                basename: 'Project - Антифрод-триггеры.md',
                name: 'Project - Антифрод-триггеры'
            } as TFile;

            childFile = {
                path: '01 Inbox/Task - Child Task.md',
                basename: 'Task - Child Task.md'
            } as TFile;

            mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
                frontmatter: {
                    'ems__Effort_parent': 'Project - Антифрод-триггеры'
                }
            });

            const result = (renderer as any).isChildEffort(childFile, parentFile);
            expect(result).toBe(true);
        });

        it('should match when ems__Effort_parent is an array containing parent reference', () => {
            parentFile = {
                path: '01 Inbox/Project - Антифрод-триггеры.md',
                basename: 'Project - Антифрод-триггеры.md',
                name: 'Project - Антифрод-триггеры'
            } as TFile;

            childFile = {
                path: '01 Inbox/Task - Multi-parent Task.md',
                basename: 'Task - Multi-parent Task.md'
            } as TFile;

            mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
                frontmatter: {
                    'ems__Effort_parent': ['[[Some Other Project]]', '[[Project - Антифрод-триггеры]]']
                }
            });

            const result = (renderer as any).isChildEffort(childFile, parentFile);
            expect(result).toBe(true);
        });

        it('should not match when ems__Effort_parent references different file', () => {
            parentFile = {
                path: '01 Inbox/Project - Антифрод-триггеры.md',
                basename: 'Project - Антифрод-триггеры.md',
                name: 'Project - Антифрод-триггеры'
            } as TFile;

            childFile = {
                path: '01 Inbox/Task - Unrelated Task.md',
                basename: 'Task - Unrelated Task.md'
            } as TFile;

            mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
                frontmatter: {
                    'ems__Effort_parent': '[[Project - Something Else]]'
                }
            });

            const result = (renderer as any).isChildEffort(childFile, parentFile);
            expect(result).toBe(false);
        });

        it('should match with partial name matching', () => {
            parentFile = {
                path: 'Projects/My Complex Project Name.md',
                basename: 'My Complex Project Name.md',
                name: 'My Complex Project Name'
            } as TFile;

            childFile = {
                path: 'Tasks/Sub Task.md',
                basename: 'Sub Task.md'
            } as TFile;

            mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
                frontmatter: {
                    'ems__Effort_parent': 'Link to My Complex Project Name here'
                }
            });

            const result = (renderer as any).isChildEffort(childFile, parentFile);
            expect(result).toBe(true);
        });
    });

    describe('Full rendering with real-world data', () => {
        it('should show children efforts for Антифрод-триггеры project', async () => {
            const container = document.createElement('div');
            
            // Add Obsidian-specific DOM methods
            const addObsidianMethods = (element: HTMLElement) => {
                (element as any).createDiv = function(config: any) {
                    const div = document.createElement('div');
                    if (config?.cls) div.className = config.cls;
                    this.appendChild(div);
                    addObsidianMethods(div);
                    return div;
                };
                (element as any).createEl = function(tag: string, config: any) {
                    const el = document.createElement(tag);
                    if (config?.text) el.textContent = config.text;
                    if (config?.cls) el.className = config.cls;
                    if (config?.href) (el as HTMLAnchorElement).href = config.href;
                    this.appendChild(el);
                    addObsidianMethods(el);
                    return el;
                };
            };
            addObsidianMethods(container);
            const parentFile = {
                path: '01 Inbox/Project - Антифрод-триггеры.md',
                basename: 'Project - Антифрод-триггеры.md',
                name: 'Project - Антифрод-триггеры'
            } as TFile;

            const childFile = {
                path: '01 Inbox/Project - Взять в работу эпик по антифрод-триггерам.md',
                basename: 'Project - Взять в работу эпик по антифрод-триггерам.md'
            } as TFile;

            // Mock backlinks
            (mockApp.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
                data: new Map([
                    ['01 Inbox/Project - Взять в работу эпик по антифрод-триггерам.md', 1]
                ])
            });

            // Mock file retrieval
            mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue(childFile);

            // Mock metadata for child
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                if (file.path === childFile.path) {
                    return {
                        frontmatter: {
                            'exo__Asset_label': 'Взять в работу эпик по антифрод-триггерам',
                            'exo__Instance_class': '[[ems__Project]]',
                            'ems__Effort_parent': '[[Project - Антифрод-триггеры]]',
                            'ems__Effort_status': '[[ems__EffortStatusDoing]]'
                        }
                    };
                }
                return null;
            });

            await renderer.render(container, {}, parentFile, {});

            // Check that child effort is shown
            expect(container.innerHTML).toContain('1 child effort');
            expect(container.innerHTML).toContain('Взять в работу эпик по антифрод-триггерам');
            expect(container.querySelector('.exocortex-empty')).toBeNull();
        });
    });
});