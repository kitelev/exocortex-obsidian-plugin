import { DynamicBacklinksService } from '../../src/application/services/DynamicBacklinksService';
import { App, TFile } from '../__mocks__/obsidian';

describe('DynamicBacklinksService - Real World Scenarios', () => {
    let service: DynamicBacklinksService;
    let mockApp: any;

    const createMockFile = (path: string, frontmatter: Record<string, any> = {}): TFile => {
        const file = new TFile();
        file.path = path;
        file.basename = path.split('/').pop()?.replace(/\.md$/, '') || '';
        return file;
    };

    beforeEach(() => {
        mockApp = new App();
        service = new DynamicBacklinksService(mockApp);
        
        // Setup default mocks
        mockApp.vault.getMarkdownFiles = jest.fn();
        mockApp.metadataCache.getFileCache = jest.fn();
        mockApp.metadataCache.getFirstLinkpathDest = jest.fn();
    });

    describe('User Reported Issues', () => {
        it('should discover backlinks from Projects and Tasks to Area in real vault structure', async () => {
            // This replicates the exact user scenario where dynamic backlinks weren't working
            
            const areaFile = createMockFile('02 Ontology/2 Custom/ems/ems__Area.md', {
                'exo__Asset_uid': '82c74542-1b14-4217-b852-d84730484b25',
                'exo__Asset_label': 'Area',
                'exo__Instance_class': '[[exo__Class]]',
                'exo__Asset_isDefinedBy': '[[!ems]]',
                'exo__Class_description': 'Area of responsibility or focus',
                'exo__Class_superClass': '[[exo__Asset]]'
            });
            
            const businessTripProject = createMockFile('03 Knowledge/toos/Project - Командировка с 7 по 11 в Питер.md', {
                'exo__Asset_isDefinedBy': '[[Ontology - kitelev]]',
                'exo__Asset_uid': 'e7a3b9b9-8eb6-4fdf-a0d3-3055e91d96f0',
                'exo__Asset_createdAt': '2025-06-27T16:47:02',
                'exo__Instance_class': ['[[ems__Project]]'],
                'ems__Effort_area': '[[Area - My]]',
                'ems__Effort_status': '[[ems__EffortStatusDone]]',
                'exo__Asset_relates': ['[[OrgUnit - Sales Tech]]', '[[Concept - Business Trip]]']
            });

            const reviewTask = createMockFile('03 Knowledge/kitelev/Task - Провести ревью PDR по обмену опытом.md', {
                'exo__Asset_isDefinedBy': '[[Ontology - kitelev]]',
                'exo__Asset_uid': 'task-review-pdr-123',
                'exo__Instance_class': ['[[ems__Task]]'],
                'ems__Effort_area': '[[Area - My]]',
                'ems__Effort_status': '[[ems__EffortStatusTodo]]'
            });

            const pluginProject = createMockFile('03 Knowledge/kitelev/Project - Динамические лейауты.md', {
                'exo__Asset_isDefinedBy': '[[Ontology - kitelev]]',
                'exo__Asset_uid': 'plugin-project-456',
                'exo__Instance_class': ['[[ems__Project]]'],
                'ems__Effort_area': '[[Area - My]]',
                'ems__Effort_status': '[[ems__EffortStatusDoing]]'
            });

            mockApp.vault.getMarkdownFiles.mockReturnValue([
                areaFile, 
                businessTripProject, 
                reviewTask, 
                pluginProject
            ]);
            
            // Mock link resolution to simulate Obsidian's behavior
            // [[Area - My]] should resolve to the area file
            mockApp.metadataCache.getFirstLinkpathDest = jest.fn().mockImplementation((linkText: string, sourcePath: string) => {
                if (linkText === 'Area - My') {
                    return areaFile;
                }
                return null;
            });
            
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                switch (file.path) {
                    case '02 Ontology/2 Custom/ems/ems__Area.md':
                        return { 
                            frontmatter: { 
                                'exo__Asset_uid': '82c74542-1b14-4217-b852-d84730484b25',
                                'exo__Asset_label': 'Area',
                                'exo__Instance_class': '[[exo__Class]]',
                                'exo__Asset_isDefinedBy': '[[!ems]]',
                                'exo__Class_description': 'Area of responsibility or focus',
                                'exo__Class_superClass': '[[exo__Asset]]'
                            } 
                        };
                    case '03 Knowledge/toos/Project - Командировка с 7 по 11 в Питер.md':
                        return { 
                            frontmatter: { 
                                'exo__Asset_isDefinedBy': '[[Ontology - kitelev]]',
                                'exo__Asset_uid': 'e7a3b9b9-8eb6-4fdf-a0d3-3055e91d96f0',
                                'exo__Asset_createdAt': '2025-06-27T16:47:02',
                                'exo__Instance_class': ['[[ems__Project]]'],
                                'ems__Effort_area': '[[Area - My]]',
                                'ems__Effort_status': '[[ems__EffortStatusDone]]',
                                'exo__Asset_relates': ['[[OrgUnit - Sales Tech]]', '[[Concept - Business Trip]]']
                            } 
                        };
                    case '03 Knowledge/kitelev/Task - Провести ревью PDR по обмену опытом.md':
                        return { 
                            frontmatter: { 
                                'exo__Asset_isDefinedBy': '[[Ontology - kitelev]]',
                                'exo__Asset_uid': 'task-review-pdr-123',
                                'exo__Instance_class': ['[[ems__Task]]'],
                                'ems__Effort_area': '[[Area - My]]',
                                'ems__Effort_status': '[[ems__EffortStatusTodo]]'
                            } 
                        };
                    case '03 Knowledge/kitelev/Project - Динамические лейауты.md':
                        return { 
                            frontmatter: { 
                                'exo__Asset_isDefinedBy': '[[Ontology - kitelev]]',
                                'exo__Asset_uid': 'plugin-project-456',
                                'exo__Instance_class': ['[[ems__Project]]'],
                                'ems__Effort_area': '[[Area - My]]',
                                'ems__Effort_status': '[[ems__EffortStatusDoing]]'
                            } 
                        };
                    default:
                        return { frontmatter: {} };
                }
            });

            // This is the exact configuration used in the default layout
            const result = await service.discoverPropertyBasedBacklinks(areaFile, {
                excludeProperties: ['exo__Asset_id', 'exo__Instance_class'],
                showEmptyProperties: false
            });

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            // Should find the ems__Effort_area property with 3 referencing files
            expect(backlinks).toHaveLength(1);
            expect(backlinks[0].propertyName).toBe('ems__Effort_area');
            expect(backlinks[0].referencingFiles).toHaveLength(3);
            
            const referencingPaths = backlinks[0].referencingFiles.map(f => f.path);
            expect(referencingPaths).toContain('03 Knowledge/toos/Project - Командировка с 7 по 11 в Питер.md');
            expect(referencingPaths).toContain('03 Knowledge/kitelev/Task - Провести ревью PDR по обмену опытом.md');
            expect(referencingPaths).toContain('03 Knowledge/kitelev/Project - Динамические лейауты.md');
        });

        it('should handle mixed reference formats in the same vault', async () => {
            const areaFile = createMockFile('02 Ontology/2 Custom/ems/ems__Area.md', {
                'exo__Asset_uid': '82c74542-1b14-4217-b852-d84730484b25',
                'exo__Asset_label': 'Area'
            });
            
            // File using link text reference
            const file1 = createMockFile('file1.md', {
                'ems__Effort_area': '[[Area - My]]'
            });
            
            // File using UUID reference (less common but should work)
            const file2 = createMockFile('file2.md', {
                'ems__Effort_area': '[[82c74542-1b14-4217-b852-d84730484b25]]'
            });
            
            // File using exact filename reference
            const file3 = createMockFile('file3.md', {
                'ems__Effort_area': '[[ems__Area]]'
            });

            mockApp.vault.getMarkdownFiles.mockReturnValue([areaFile, file1, file2, file3]);
            
            // Mock link resolution for various link formats
            mockApp.metadataCache.getFirstLinkpathDest = jest.fn().mockImplementation((linkText: string) => {
                if (linkText === 'Area - My' || linkText === 'ems__Area') {
                    return areaFile;
                }
                return null;
            });
            
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                switch (file.path) {
                    case '02 Ontology/2 Custom/ems/ems__Area.md':
                        return { frontmatter: { 'exo__Asset_uid': '82c74542-1b14-4217-b852-d84730484b25', 'exo__Asset_label': 'Area' } };
                    case 'file1.md':
                        return { frontmatter: { 'ems__Effort_area': '[[Area - My]]' } };
                    case 'file2.md':
                        return { frontmatter: { 'ems__Effort_area': '[[82c74542-1b14-4217-b852-d84730484b25]]' } };
                    case 'file3.md':
                        return { frontmatter: { 'ems__Effort_area': '[[ems__Area]]' } };
                    default:
                        return { frontmatter: {} };
                }
            });

            const result = await service.discoverPropertyBasedBacklinks(areaFile);

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            expect(backlinks).toHaveLength(1);
            expect(backlinks[0].propertyName).toBe('ems__Effort_area');
            expect(backlinks[0].referencingFiles).toHaveLength(3); // All three should match
        });
    });
});