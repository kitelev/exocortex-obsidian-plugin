import { CreateAssetModal } from '../../src/presentation/modals/CreateAssetModal';
import { App, TFile } from 'obsidian';

describe('CreateAssetModal Data Loading', () => {
    let app: App;
    let modal: CreateAssetModal;
    let mockFiles: TFile[];
    
    beforeEach(() => {
        // Create mock files with proper metadata
        mockFiles = [
            // Ontology files
            {
                name: '!exo.md',
                basename: '!exo',
                path: '!exo.md',
                extension: 'md'
            } as TFile,
            {
                name: '!ui.md',
                basename: '!ui',
                path: '!ui.md',
                extension: 'md'
            } as TFile,
            // Class files
            {
                name: 'exo__Asset.md',
                basename: 'exo__Asset',
                path: 'exo__Asset.md',
                extension: 'md'
            } as TFile,
            {
                name: 'exo__Class.md',
                basename: 'exo__Class',
                path: 'exo__Class.md',
                extension: 'md'
            } as TFile,
            {
                name: 'ui__Component.md',
                basename: 'ui__Component',
                path: 'ui__Component.md',
                extension: 'md'
            } as TFile,
            // Property files
            {
                name: 'exo__Property_description.md',
                basename: 'exo__Property_description',
                path: 'exo__Property_description.md',
                extension: 'md'
            } as TFile
        ];
        
        // Mock app with proper vault and metadata
        app = {
            vault: {
                getMarkdownFiles: jest.fn().mockReturnValue(mockFiles),
                getAbstractFileByPath: jest.fn((path) => 
                    mockFiles.find(f => f.path === path) || null
                )
            },
            metadataCache: {
                getFileCache: jest.fn((file: TFile) => {
                    // Return appropriate metadata based on file
                    if (file.name.startsWith('!')) {
                        return {
                            frontmatter: {
                                'exo__Ontology_prefix': file.basename.substring(1),
                                'rdfs__label': file.basename.substring(1) === 'exo' ? 
                                    'Exocortex Core' : 'User Interface'
                            }
                        };
                    }
                    if (file.basename === 'exo__Asset' || file.basename === 'exo__Class') {
                        return {
                            frontmatter: {
                                'exo__Instance_class': '[[exo__Class]]',
                                'rdfs__label': file.basename.replace('exo__', '')
                            }
                        };
                    }
                    if (file.basename === 'ui__Component') {
                        return {
                            frontmatter: {
                                'exo__Instance_class': '[[exo__Class]]',
                                'rdfs__label': 'Component'
                            }
                        };
                    }
                    if (file.basename.includes('Property')) {
                        return {
                            frontmatter: {
                                'exo__Instance_class': '[[exo__Property]]',
                                'rdfs__domain': '[[exo__Asset]]',
                                'rdfs__label': 'Description',
                                'rdfs__comment': 'Asset description',
                                'rdfs__range': 'text'
                            }
                        };
                    }
                    return { frontmatter: {} };
                })
            }
        } as any;
        
        // Mock DIContainer to return itself
        const mockContainer = {
            getCreateAssetUseCase: jest.fn().mockReturnValue({
                execute: jest.fn().mockResolvedValue({
                    success: true,
                    message: 'Asset created'
                })
            }),
            resolve: jest.fn().mockImplementation((token: string) => {
                if (token === 'IOntologyRepository') {
                    return {
                        findAll: jest.fn().mockResolvedValue([])
                    };
                }
                if (token === 'IClassViewRepository') {
                    return {
                        findAll: jest.fn().mockResolvedValue([])
                    };
                }
                return {};
            })
        };
        
        // Mock DIContainer.getInstance
        jest.mock('../../src/infrastructure/container/DIContainer', () => ({
            DIContainer: {
                getInstance: jest.fn().mockReturnValue(mockContainer)
            }
        }));
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('Dropdown Population', () => {
        it('should load ontologies into dropdown', async () => {
            modal = new CreateAssetModal(app);
            const contentEl = document.createElement('div');
            modal['contentEl'] = contentEl;
            
            await modal['setupOntologyField'](contentEl);
            
            // Check that dropdown was created with options
            const dropdowns = contentEl.querySelectorAll('select');
            expect(dropdowns.length).toBeGreaterThan(0);
            
            const dropdown = dropdowns[0];
            expect(dropdown.children.length).toBeGreaterThan(0);
            
            // Should have exo and ui ontologies
            const options = Array.from(dropdown.children).map((opt: any) => opt.value);
            expect(options).toContain('exo');
            expect(options).toContain('ui');
        });
        
        it('should load classes into dropdown', async () => {
            modal = new CreateAssetModal(app);
            const contentEl = document.createElement('div');
            modal['contentEl'] = contentEl;
            
            await modal['setupClassField'](contentEl);
            
            const dropdowns = contentEl.querySelectorAll('select');
            expect(dropdowns.length).toBeGreaterThan(0);
            
            const dropdown = dropdowns[0];
            const options = Array.from(dropdown.children).map((opt: any) => opt.value);
            
            // Should have the class options
            expect(options).toContain('exo__Asset');
            expect(options).toContain('exo__Class');
            expect(options).toContain('ui__Component');
        });
        
        it('should load properties for selected class', async () => {
            modal = new CreateAssetModal(app);
            const containerEl = document.createElement('div');
            modal['propertiesContainer'] = containerEl;
            
            await modal['updatePropertiesForClass']('exo__Asset');
            
            // Should have created property fields
            const settings = containerEl.querySelectorAll('.setting-item');
            expect(settings.length).toBeGreaterThan(0);
        });
        
        it('should use default values when no data found', async () => {
            // Mock empty vault
            app.vault.getMarkdownFiles = jest.fn().mockReturnValue([]);
            
            modal = new CreateAssetModal(app);
            const contentEl = document.createElement('div');
            modal['contentEl'] = contentEl;
            
            await modal['setupOntologyField'](contentEl);
            
            const dropdowns = contentEl.querySelectorAll('select');
            const dropdown = dropdowns[0];
            const options = Array.from(dropdown.children).map((opt: any) => opt.value);
            
            // Should have default ontologies
            expect(options).toContain('exo');
            expect(options).toContain('ui');
            expect(options).toContain('rdfs');
        });
    });
    
    describe('Property Type Mapping', () => {
        it('should map RDF ranges to correct input types', () => {
            modal = new CreateAssetModal(app);
            
            expect(modal['mapRangeToType']('boolean')).toBe('boolean');
            expect(modal['mapRangeToType']('xsd:boolean')).toBe('boolean');
            expect(modal['mapRangeToType']('date')).toBe('date');
            expect(modal['mapRangeToType']('xsd:dateTime')).toBe('date');
            expect(modal['mapRangeToType']('integer')).toBe('number');
            expect(modal['mapRangeToType']('decimal')).toBe('number');
            expect(modal['mapRangeToType']('string[]')).toBe('array');
            expect(modal['mapRangeToType']('text')).toBe('text');
            expect(modal['mapRangeToType']('string')).toBe('string');
            expect(modal['mapRangeToType']('unknown')).toBe('string');
        });
    });
});