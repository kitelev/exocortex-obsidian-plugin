import { DynamicBacklinksBlockRenderer } from '../../../../src/presentation/renderers/DynamicBacklinksBlockRenderer';
import { DynamicBacklinksBlockConfig } from '../../../../src/domain/entities/LayoutBlock';
import { DynamicBacklinksService } from '../../../../src/application/services/DynamicBacklinksService';
import { Result } from '../../../../src/domain/core/Result';
import { App, TFile } from '../../../__mocks__/obsidian';

// Mock the DynamicBacklinksService
jest.mock('../../../../src/application/services/DynamicBacklinksService');

describe('DynamicBacklinksBlockRenderer', () => {
    let renderer: DynamicBacklinksBlockRenderer;
    let mockApp: any;
    let mockFile: TFile;
    let mockContainer: HTMLElement;
    let mockService: jest.Mocked<DynamicBacklinksService>;

    const createMockFile = (path: string, label?: string, instanceClass?: string): TFile => {
        const file = new TFile();
        file.path = path;
        file.basename = path.split('/').pop()?.replace(/\.md$/, '') || '';
        return file;
    };

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';
        mockContainer = document.createElement('div');
        document.body.appendChild(mockContainer);

        // Setup mocks
        mockApp = new App();
        mockFile = createMockFile('test-file.md');
        
        // Mock the service
        mockService = new DynamicBacklinksService(mockApp) as jest.Mocked<DynamicBacklinksService>;
        
        renderer = new DynamicBacklinksBlockRenderer(mockApp);
        (renderer as any).dynamicBacklinksService = mockService;

        // Mock metadataCache for file info
        mockApp.metadataCache.getFileCache = jest.fn();
    });

    describe('render', () => {
        it('should display error message when service fails', async () => {
            const config: DynamicBacklinksBlockConfig = { type: 'dynamic-backlinks' };
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(
                Result.fail('Service error')
            );

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('Error discovering backlinks: Service error');
            expect(mockContainer.querySelector('.exocortex-error')).toBeTruthy();
        });

        it('should display empty message when no backlinks found', async () => {
            const config: DynamicBacklinksBlockConfig = { type: 'dynamic-backlinks' };
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(
                Result.ok([])
            );

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('No property-based backlinks found');
            expect(mockContainer.querySelector('.exocortex-empty')).toBeTruthy();
        });

        it('should render property groups with backlinks', async () => {
            const config: DynamicBacklinksBlockConfig = { type: 'dynamic-backlinks' };
            
            const file1 = createMockFile('child1.md');
            const file2 = createMockFile('child2.md');
            const file3 = createMockFile('related.md');
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(
                Result.ok([
                    {
                        propertyName: 'ems__Effort_parent',
                        referencingFiles: [file1, file2]
                    },
                    {
                        propertyName: 'related_to',
                        referencingFiles: [file3]
                    }
                ])
            );

            // Mock metadata for file labels
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => ({
                frontmatter: {
                    'exo__Asset_label': `Label for ${file.basename}`,
                    'exo__Instance_class': 'Task'
                }
            }));

            await renderer.render(mockContainer, config, mockFile, null);

            // Check headers are formatted correctly
            expect(mockContainer.textContent).toContain('Effort Parent (2)'); // ems__Effort_parent formatted
            expect(mockContainer.textContent).toContain('Related To (1)'); // related_to formatted

            // Check backlink items are rendered
            expect(mockContainer.textContent).toContain('Label for child1');
            expect(mockContainer.textContent).toContain('Label for child2');
            expect(mockContainer.textContent).toContain('Label for related');
            
            // Check CSS classes are applied
            expect(mockContainer.querySelector('.exocortex-dynamic-backlinks-group')).toBeTruthy();
            expect(mockContainer.querySelector('.exocortex-property-backlinks-header')).toBeTruthy();
            expect(mockContainer.querySelector('.exocortex-property-backlinks-list')).toBeTruthy();
        });

        it('should pass correct options to service', async () => {
            const config: DynamicBacklinksBlockConfig = {
                type: 'dynamic-backlinks',
                excludeProperties: ['system_prop'],
                maxResultsPerProperty: 5,
                filterByClass: 'Task'
            };
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(Result.ok([]));

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockService.discoverPropertyBasedBacklinks).toHaveBeenCalledWith(
                mockFile,
                {
                    excludeProperties: ['system_prop'],
                    maxResultsPerProperty: 5,
                    filterByClass: 'Task'
                }
            );
        });

        it('should use default exclusions when none specified', async () => {
            const config: DynamicBacklinksBlockConfig = { type: 'dynamic-backlinks' };
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(Result.ok([]));

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockService.discoverPropertyBasedBacklinks).toHaveBeenCalledWith(
                mockFile,
                {
                    excludeProperties: ['exo__Asset_id', 'exo__Instance_class'],
                    maxResultsPerProperty: undefined,
                    filterByClass: undefined
                }
            );
        });

        it('should skip empty property groups when showEmptyProperties is false', async () => {
            const config: DynamicBacklinksBlockConfig = {
                type: 'dynamic-backlinks',
                showEmptyProperties: false
            };
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(
                Result.ok([
                    {
                        propertyName: 'parent',
                        referencingFiles: []
                    },
                    {
                        propertyName: 'related',
                        referencingFiles: [createMockFile('file1.md')]
                    }
                ])
            );

            mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
                frontmatter: { 'exo__Asset_label': 'Test File' }
            });

            await renderer.render(mockContainer, config, mockFile, null);

            // Should not contain the empty 'parent' group
            expect(mockContainer.textContent).not.toContain('Parent (0)');
            // Should contain the non-empty 'related' group
            expect(mockContainer.textContent).toContain('Related (1)');
        });

        it('should show empty property groups when showEmptyProperties is true', async () => {
            const config: DynamicBacklinksBlockConfig = {
                type: 'dynamic-backlinks',
                showEmptyProperties: true
            };
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(
                Result.ok([
                    {
                        propertyName: 'parent',
                        referencingFiles: []
                    }
                ])
            );

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('Parent (0)');
            expect(mockContainer.textContent).toContain('No files reference this asset via this property');
        });

        it('should display class info for files', async () => {
            const config: DynamicBacklinksBlockConfig = { type: 'dynamic-backlinks' };
            
            const file1 = createMockFile('file1.md');
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(
                Result.ok([
                    {
                        propertyName: 'parent',
                        referencingFiles: [file1]
                    }
                ])
            );

            mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
                frontmatter: {
                    'exo__Asset_label': 'Test File',
                    'exo__Instance_class': '[[Task]]'
                }
            });

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('Test File (Task)');
            expect(mockContainer.querySelector('.exocortex-class-info')).toBeTruthy();
        });

        it('should show path info for disambiguation', async () => {
            const config: DynamicBacklinksBlockConfig = { type: 'dynamic-backlinks' };
            
            const file1 = createMockFile('folder/subfolder/file1.md');
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(
                Result.ok([
                    {
                        propertyName: 'parent',
                        referencingFiles: [file1]
                    }
                ])
            );

            mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
                frontmatter: { 'exo__Asset_label': 'Test File' }
            });

            await renderer.render(mockContainer, config, mockFile, null);

            expect(mockContainer.textContent).toContain('folder/subfolder/file1.md');
            expect(mockContainer.querySelector('.exocortex-path-info')).toBeTruthy();
        });

        it('should format property names correctly', async () => {
            const config: DynamicBacklinksBlockConfig = { 
                type: 'dynamic-backlinks',
                showEmptyProperties: true // Enable showing empty groups
            };
            
            mockService.discoverPropertyBasedBacklinks.mockResolvedValue(
                Result.ok([
                    {
                        propertyName: 'ems__Effort_parent',
                        referencingFiles: []
                    },
                    {
                        propertyName: 'exo__related_to_task',
                        referencingFiles: []
                    },
                    {
                        propertyName: 'simple_property',
                        referencingFiles: []
                    }
                ])
            );

            await renderer.render(mockContainer, config, mockFile, null);

            // Check property name formatting
            expect(mockContainer.textContent).toContain('Effort Parent (0)'); // ems__ removed, _ to space, capitalized
            expect(mockContainer.textContent).toContain('Related To Task (0)'); // exo__ removed, _ to space, capitalized  
            expect(mockContainer.textContent).toContain('Simple Property (0)'); // _ to space, capitalized
        });
    });
});