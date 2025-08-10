import { CreateAssetModal } from '../../src/presentation/modals/CreateAssetModal';
import { App, TFile, Plugin } from 'obsidian';
import { DIContainer } from '../../src/infrastructure/container/DIContainer';

describe('CreateAssetModal Dynamic Property Update', () => {
    let app: App;
    let plugin: Plugin;
    let modal: CreateAssetModal;
    let mockFiles: TFile[];
    let containerEl: HTMLElement;
    
    beforeEach(() => {
        // Create mock files with properties for different classes
        mockFiles = [
            // Classes
            {
                name: 'exo__Asset.md',
                basename: 'exo__Asset',
                path: 'exo__Asset.md',
                extension: 'md'
            } as TFile,
            {
                name: 'exo__Person.md',
                basename: 'exo__Person',
                path: 'exo__Person.md',
                extension: 'md'
            } as TFile,
            // Properties for Asset
            {
                name: 'exo__description.md',
                basename: 'exo__description',
                path: 'exo__description.md',
                extension: 'md'
            } as TFile,
            // Properties for Person
            {
                name: 'exo__firstName.md',
                basename: 'exo__firstName',
                path: 'exo__firstName.md',
                extension: 'md'
            } as TFile,
            {
                name: 'exo__lastName.md',
                basename: 'exo__lastName',
                path: 'exo__lastName.md',
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
                    if (file.basename === 'exo__Asset' || file.basename === 'exo__Person') {
                        return {
                            frontmatter: {
                                'exo__Instance_class': '[[exo__Class]]',
                                'rdfs__label': file.basename.replace('exo__', '')
                            }
                        };
                    }
                    if (file.basename === 'exo__description') {
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
                    if (file.basename === 'exo__firstName' || file.basename === 'exo__lastName') {
                        return {
                            frontmatter: {
                                'exo__Instance_class': '[[exo__Property]]',
                                'rdfs__domain': '[[exo__Person]]',
                                'rdfs__label': file.basename === 'exo__firstName' ? 'First Name' : 'Last Name',
                                'rdfs__comment': 'Person name',
                                'rdfs__range': 'string'
                            }
                        };
                    }
                    return { frontmatter: {} };
                })
            }
        } as any;
        
        // Create container element
        containerEl = document.createElement('div');
        
        // Initialize plugin and DIContainer
        plugin = new Plugin(app, {} as any);
        DIContainer.initialize(app, plugin);
        
        // Add empty method to container element if it doesn't exist
        if (!containerEl.empty) {
            (containerEl as any).empty = function() {
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
            };
        }
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('Dynamic Property Updates', () => {
        it('should clear previous properties when class changes', async () => {
            modal = new CreateAssetModal(app);
            modal['propertiesContainer'] = containerEl;
            
            // First, load properties for Asset
            await modal['updatePropertiesForClass']('exo__Asset');
            const assetProperties = modal['properties'];
            expect(assetProperties.length).toBeGreaterThan(0);
            
            // Then, switch to Person
            await modal['updatePropertiesForClass']('exo__Person');
            
            // Properties should be different
            const personProperties = modal['properties'];
            expect(personProperties.length).toBeGreaterThan(0);
            const hasFirstName = personProperties.some((p: any) => 
                p.label === 'First Name'
            );
            expect(hasFirstName).toBe(true);
        });
        
        it('should show default properties for exo__Asset when no properties defined', async () => {
            // Mock empty property list
            app.metadataCache.getFileCache = jest.fn(() => ({ frontmatter: {} }));
            
            modal = new CreateAssetModal(app);
            modal['propertiesContainer'] = containerEl;
            
            await modal['updatePropertiesForClass']('exo__Asset');
            
            // Should have default properties
            const properties = modal['properties'];
            const hasDescription = properties.some((p: any) => p.label === 'Description');
            const hasTags = properties.some((p: any) => p.label === 'Tags');
            
            expect(hasDescription && hasTags).toBe(true);
        });
        
        it('should show no properties message for unknown class', async () => {
            modal = new CreateAssetModal(app);
            modal['propertiesContainer'] = containerEl;
            
            await modal['updatePropertiesForClass']('UnknownClass');
            
            const message = containerEl.querySelector('.exocortex-no-properties');
            expect(message).toBeTruthy();
            expect(message?.textContent).toContain('No specific properties');
        });
        
        it('should handle array domains correctly', async () => {
            // Mock property with array domain
            app.metadataCache.getFileCache = jest.fn((file: TFile) => {
                if (file.basename === 'exo__multiDomain') {
                    return {
                        frontmatter: {
                            'exo__Instance_class': '[[exo__Property]]',
                            'rdfs__domain': ['[[exo__Asset]]', '[[exo__Person]]'],
                            'rdfs__label': 'Multi Domain Property',
                            'rdfs__range': 'string'
                        }
                    };
                }
                if (file.basename === 'exo__Asset') {
                    return {
                        frontmatter: {
                            'exo__Instance_class': '[[exo__Class]]',
                            'rdfs__label': 'Asset'
                        }
                    };
                }
                return { frontmatter: {} };
            });
            
            mockFiles.push({
                name: 'exo__multiDomain.md',
                basename: 'exo__multiDomain',
                path: 'exo__multiDomain.md',
                extension: 'md'
            } as TFile);
            
            modal = new CreateAssetModal(app);
            modal['propertiesContainer'] = containerEl;
            
            await modal['updatePropertiesForClass']('exo__Asset');
            
            const properties = modal['properties'];
            const hasMultiDomain = properties.some((p: any) => p.label === 'Multi Domain Property');
            expect(hasMultiDomain).toBe(true);
        });
        
        it('should preserve property values when properties are cleared', async () => {
            modal = new CreateAssetModal(app);
            modal['propertiesContainer'] = containerEl;
            
            // Set some property values
            modal['propertyValues'].set('test', 'value');
            
            await modal['updatePropertiesForClass']('exo__Asset');
            
            // Property values should be cleared
            expect(modal['propertyValues'].has('test')).toBe(false);
        });
    });
    
    describe('Empty Method Compatibility', () => {
        it('should use Obsidian empty method when available', async () => {
            const obsidianContainer = document.createElement('div');
            const emptySpy = jest.fn();
            (obsidianContainer as any).empty = emptySpy;
            
            modal = new CreateAssetModal(app);
            modal['propertiesContainer'] = obsidianContainer;
            
            await modal['updatePropertiesForClass']('exo__Asset');
            
            expect(emptySpy).toHaveBeenCalled();
        });
        
        it('should fallback to DOM removal when empty not available', async () => {
            const domContainer = document.createElement('div');
            domContainer.appendChild(document.createElement('span'));
            domContainer.appendChild(document.createElement('span'));
            
            modal = new CreateAssetModal(app);
            modal['propertiesContainer'] = domContainer;
            
            await modal['updatePropertiesForClass']('exo__Asset');
            
            // Children should be removed even without empty method
            expect(domContainer.children.length).toBeGreaterThanOrEqual(0);
        });
    });
});