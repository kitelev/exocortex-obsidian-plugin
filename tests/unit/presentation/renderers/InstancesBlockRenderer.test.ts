import { InstancesBlockRenderer } from '../../../../src/presentation/renderers/InstancesBlockRenderer';
import { InstancesBlockConfig } from '../../../../src/domain/entities/LayoutBlock';
import { App, TFile, CachedMetadata } from '../../../__mocks__/obsidian';

describe('InstancesBlockRenderer', () => {
    let renderer: InstancesBlockRenderer;
    let mockApp: any;
    let mockFile: TFile;
    let mockContainer: HTMLElement;
    let config: InstancesBlockConfig;

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
        mockFile = createMockTFile('TestClass.md');

        // Override methods with jest mocks for testing
        mockApp.vault.getFiles = jest.fn();
        mockApp.metadataCache.getFileCache = jest.fn();

        // Setup DOM
        document.body.innerHTML = '';
        mockContainer = document.createElement('div');
        document.body.appendChild(mockContainer);

        renderer = new InstancesBlockRenderer(mockApp);

        config = {
            type: 'instances',
            targetProperty: 'exo__Instance_class',
            displayAs: 'table',
            showInstanceInfo: true
        };
    });

    describe('render', () => {
        it('should display empty message when no instances found', async () => {
            // Setup: No files reference the current class
            mockApp.vault.getFiles.mockReturnValue([]);

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.querySelector('.exocortex-empty')).toBeTruthy();
            expect(mockContainer.textContent).toContain('No instances found');
        });

        it('should find and display instances that reference the class', async () => {
            // Setup: Create mock instance files
            const instanceFile1 = createMockTFile('Instance1.md');
            const instanceFile2 = createMockTFile('Instance2.md');

            mockApp.vault.getFiles.mockReturnValue([mockFile, instanceFile1, instanceFile2]);
            
            // Mock metadata for instances
            mockApp.metadataCache.getFileCache
                .mockReturnValueOnce(null) // TestClass file (current)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]',
                        'exo__Asset_label': 'Test Instance 1'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]',
                        'exo__Asset_label': 'Test Instance 2'
                    }
                } as CachedMetadata)
                // Additional calls for table rendering
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]',
                        'exo__Asset_label': 'Test Instance 1'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]',
                        'exo__Asset_label': 'Test Instance 2'
                    }
                } as CachedMetadata);

            await renderer.render(mockContainer, config, mockFile, null);

            // Should show count
            expect(mockContainer.textContent).toContain('2 instances');
            
            // Should create table
            const table = mockContainer.querySelector('.exocortex-instances-table');
            expect(table).toBeTruthy();
            
            // Should have links to instances
            const links = mockContainer.querySelectorAll('a.internal-link');
            expect(links.length).toBe(2);
            expect(links[0].textContent).toBe('Test Instance 1');
            expect(links[1].textContent).toBe('Test Instance 2');
        });

        it('should handle different reference formats', async () => {
            const instanceFile1 = createMockTFile('Instance1.md');

            mockApp.vault.getFiles.mockReturnValue([mockFile, instanceFile1]);
            
            // Test different reference formats
            mockApp.metadataCache.getFileCache
                .mockReturnValueOnce(null) // TestClass file
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': 'TestClass' // Direct name reference
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': 'TestClass'
                    }
                } as CachedMetadata);

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('1 instance');
        });

        it('should filter by class when filterByClass is specified', async () => {
            const instanceFile1 = createMockTFile('Instance1.md');
            const instanceFile2 = createMockTFile('Instance2.md');

            mockApp.vault.getFiles.mockReturnValue([mockFile, instanceFile1, instanceFile2]);

            const configWithFilter: InstancesBlockConfig = {
                ...config,
                filterByClass: 'SpecificClass'
            };
            
            mockApp.metadataCache.getFileCache
                .mockReturnValueOnce(null) // TestClass file
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]'
                    }
                } as CachedMetadata) // Instance1 - no class filter match
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]'
                    }
                } as CachedMetadata) // Instance2 - no class filter match
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[SpecificClass]]'
                    }
                } as CachedMetadata) // Instance1 - class filter check (no match)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[SpecificClass]]'
                    }
                } as CachedMetadata); // Instance2 - class filter check (no match)

            await renderer.render(mockContainer, configWithFilter, mockFile, null);

            expect(mockContainer.textContent).toContain('No instances found');
        });

        it('should limit results when maxResults is specified', async () => {
            // Create 5 mock instance files
            const instanceFiles = Array.from({ length: 5 }, (_, i) => 
                createMockTFile(`Instance${i + 1}.md`)
            );

            mockApp.vault.getFiles.mockReturnValue([mockFile, ...instanceFiles]);

            const configWithLimit: InstancesBlockConfig = {
                ...config,
                maxResults: 3
            };

            // Mock metadata for all instances
            const setupMockCalls = () => {
                mockApp.metadataCache.getFileCache.mockReturnValue(null); // TestClass
                for (let i = 0; i < 5; i++) {
                    mockApp.metadataCache.getFileCache.mockReturnValueOnce({
                        frontmatter: {
                            'exo__Instance_class': '[[TestClass]]',
                            'exo__Asset_label': `Test Instance ${i + 1}`
                        }
                    } as CachedMetadata);
                }
                // Additional calls for table rendering (only first 3)
                for (let i = 0; i < 3; i++) {
                    mockApp.metadataCache.getFileCache.mockReturnValueOnce({
                        frontmatter: {
                            'exo__Instance_class': '[[TestClass]]',
                            'exo__Asset_label': `Test Instance ${i + 1}`
                        }
                    } as CachedMetadata);
                }
            };

            setupMockCalls();

            await renderer.render(mockContainer, configWithLimit, mockFile, null);

            expect(mockContainer.textContent).toContain('5 instances, showing 3');
            
            const links = mockContainer.querySelectorAll('a.internal-link');
            expect(links.length).toBe(3);
        });

        it('should render as list when displayAs is "list"', async () => {
            const instanceFile = createMockTFile('Instance1.md');

            mockApp.vault.getFiles.mockReturnValue([mockFile, instanceFile]);

            const listConfig: InstancesBlockConfig = {
                ...config,
                displayAs: 'list'
            };
            
            mockApp.metadataCache.getFileCache
                .mockReturnValueOnce(null)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]',
                        'exo__Asset_label': 'Test Instance 1'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]',
                        'exo__Asset_label': 'Test Instance 1'
                    }
                } as CachedMetadata);

            await renderer.render(mockContainer, listConfig, mockFile, null);

            const list = mockContainer.querySelector('.exocortex-instances-list');
            expect(list).toBeTruthy();
            expect(list?.tagName).toBe('UL');
        });

        it('should render as cards when displayAs is "cards"', async () => {
            const instanceFile = createMockTFile('Instance1.md');

            mockApp.vault.getFiles.mockReturnValue([mockFile, instanceFile]);

            const cardsConfig: InstancesBlockConfig = {
                ...config,
                displayAs: 'cards'
            };
            
            mockApp.metadataCache.getFileCache
                .mockReturnValueOnce(null)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]',
                        'exo__Asset_label': 'Test Instance 1'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]',
                        'exo__Asset_label': 'Test Instance 1'
                    }
                } as CachedMetadata);

            await renderer.render(mockContainer, cardsConfig, mockFile, null);

            const cardsContainer = mockContainer.querySelector('.exocortex-instances-cards');
            expect(cardsContainer).toBeTruthy();
            
            const card = mockContainer.querySelector('.exocortex-instance-card');
            expect(card).toBeTruthy();
        });

        it('should group instances by class when groupByClass is true', async () => {
            const instanceFile1 = createMockTFile('Instance1.md');
            const instanceFile2 = createMockTFile('Instance2.md');

            mockApp.vault.getFiles.mockReturnValue([mockFile, instanceFile1, instanceFile2]);

            const groupedConfig: InstancesBlockConfig = {
                ...config,
                groupByClass: true
            };
            
            mockApp.metadataCache.getFileCache
                .mockReturnValueOnce(null)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]'
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': '[[TestClass]]'
                    }
                } as CachedMetadata);

            await renderer.render(mockContainer, groupedConfig, mockFile, null);

            const groupHeader = mockContainer.querySelector('.instances-group-header');
            expect(groupHeader).toBeTruthy();
            expect(groupHeader?.textContent).toContain('TestClass (2)');
        });

        it('should handle array format for instance class references', async () => {
            const instanceFile = createMockTFile('Instance1.md');

            mockApp.vault.getFiles.mockReturnValue([mockFile, instanceFile]);
            
            mockApp.metadataCache.getFileCache
                .mockReturnValueOnce(null)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': ['[[TestClass]]', '[[OtherClass]]'] // Array format
                    }
                } as CachedMetadata)
                .mockReturnValueOnce({
                    frontmatter: {
                        'exo__Instance_class': ['[[TestClass]]', '[[OtherClass]]']
                    }
                } as CachedMetadata);

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('1 instance');
        });
    });

    describe('isReferencingCurrentAsset', () => {
        it('should correctly identify references in various formats', () => {
            // Access private method for testing
            const isReferencing = (renderer as any).isReferencingCurrentAsset.bind(renderer);

            expect(isReferencing('[[TestClass]]', 'TestClass')).toBe(true);
            expect(isReferencing('TestClass', 'TestClass')).toBe(true);
            expect(isReferencing(['[[TestClass]]'], 'TestClass')).toBe(true);
            expect(isReferencing('[[OtherClass]]', 'TestClass')).toBe(false);
            expect(isReferencing(null, 'TestClass')).toBe(false);
            expect(isReferencing(undefined, 'TestClass')).toBe(false);
        });
    });

    describe('cleanClassName', () => {
        it('should clean class names by removing brackets', () => {
            const cleanClassName = (renderer as any).cleanClassName.bind(renderer);

            expect(cleanClassName('[[TestClass]]')).toBe('TestClass');
            expect(cleanClassName(['[[TestClass]]'])).toBe('TestClass');
            expect(cleanClassName('TestClass')).toBe('TestClass');
            expect(cleanClassName(null)).toBe('');
            expect(cleanClassName(undefined)).toBe('');
        });
    });
});