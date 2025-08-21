import '../../../__mocks__/obsidian';
import { App, TFile, CachedMetadata } from 'obsidian';
import { NarrowerBlockRenderer } from '../../../../src/presentation/renderers/NarrowerBlockRenderer';
import { NarrowerBlockConfig } from '../../../../src/domain/entities/LayoutBlock';

describe('NarrowerBlockRenderer', () => {
    let app: jest.Mocked<App>;
    let renderer: NarrowerBlockRenderer;
    let container: HTMLElement;
    let currentFile: TFile;
    let mockFiles: TFile[];

    beforeEach(() => {
        // Setup DOM environment
        container = document.createElement('div');
        
        // Create mock current file
        currentFile = {
            path: 'concepts/Animal.md',
            basename: 'Animal',
            name: 'Animal.md'
        } as TFile;

        // Create mock narrower concept files
        mockFiles = [
            {
                path: 'concepts/Mammal.md',
                basename: 'Mammal',
                name: 'Mammal.md'
            } as TFile,
            {
                path: 'concepts/Bird.md',
                basename: 'Bird',
                name: 'Bird.md'
            } as TFile,
            {
                path: 'concepts/Reptile.md',
                basename: 'Reptile',
                name: 'Reptile.md'
            } as TFile,
            {
                path: 'concepts/Other.md',
                basename: 'Other',
                name: 'Other.md'
            } as TFile
        ];

        // Setup mock app
        app = {
            vault: {
                getFiles: jest.fn(() => [currentFile, ...mockFiles])
            },
            metadataCache: {
                getFileCache: jest.fn((file: TFile) => {
                    const metadata: Partial<CachedMetadata> = {};
                    
                    if (file.basename === 'Mammal') {
                        metadata.frontmatter = {
                            'exo__Asset_label': 'Mammal',
                            'exo__Instance_class': 'ims__Concept',
                            'exo__Asset_description': 'Warm-blooded vertebrates',
                            'ims__Concept_broader': '[[Animal]]'
                        };
                    } else if (file.basename === 'Bird') {
                        metadata.frontmatter = {
                            'exo__Asset_label': 'Bird',
                            'exo__Instance_class': 'ims__Concept',
                            'exo__Asset_description': 'Feathered vertebrates',
                            'ims__Concept_broader': ['[[Animal]]']
                        };
                    } else if (file.basename === 'Reptile') {
                        metadata.frontmatter = {
                            'exo__Asset_label': 'Reptile',
                            'exo__Instance_class': 'ims__Concept',
                            'exo__Asset_description': 'Cold-blooded vertebrates',
                            'ims__Concept_broader': '[[concepts/Animal]]'
                        };
                    } else if (file.basename === 'Other') {
                        metadata.frontmatter = {
                            'exo__Asset_label': 'Other',
                            'exo__Instance_class': 'some__OtherClass',
                            'ims__Concept_broader': '[[Animal]]'
                        };
                    } else if (file.basename === 'Animal') {
                        metadata.frontmatter = {
                            'exo__Asset_label': 'Animal',
                            'exo__Instance_class': 'ims__Concept',
                            'exo__Asset_description': 'Living organism that feeds on organic matter'
                        };
                    }
                    
                    return metadata as CachedMetadata;
                })
            }
        } as any;

        renderer = new NarrowerBlockRenderer(app);
    });

    describe('render', () => {
        it('should display narrower concepts in list format by default', async () => {
            const config: NarrowerBlockConfig = {
                type: 'narrower'
            };

            await renderer.render(container, config, currentFile, null);

            // Check count display (should include all 4 concepts: Mammal, Bird, Reptile, Other)
            const info = container.querySelector('.exocortex-narrower-info');
            expect(info).toBeTruthy();
            expect(info?.textContent).toContain('4 narrower concepts');

            // Check list structure
            const list = container.querySelector('.exocortex-narrower-list');
            expect(list).toBeTruthy();
            
            const items = container.querySelectorAll('li');
            expect(items).toHaveLength(4);
            
            // Check that concepts are linked correctly
            const links = container.querySelectorAll('a.internal-link');
            expect(links).toHaveLength(4);
            
            const linkTexts = Array.from(links).map(link => link.textContent);
            expect(linkTexts).toContain('Mammal');
            expect(linkTexts).toContain('Bird');
            expect(linkTexts).toContain('Reptile');
            expect(linkTexts).toContain('Other');
        });

        it('should display narrower concepts in table format', async () => {
            const config: NarrowerBlockConfig = {
                type: 'narrower',
                displayAs: 'table'
            };

            await renderer.render(container, config, currentFile, null);

            // Check table structure
            const table = container.querySelector('.exocortex-narrower-table');
            expect(table).toBeTruthy();
            
            const headers = container.querySelectorAll('th');
            expect(headers).toHaveLength(3);
            expect(headers[0].textContent).toBe('Concept');
            expect(headers[1].textContent).toBe('Class');
            expect(headers[2].textContent).toBe('Description');
            
            const rows = container.querySelectorAll('tbody tr');
            expect(rows).toHaveLength(4);
        });

        it('should display narrower concepts in cards format', async () => {
            const config: NarrowerBlockConfig = {
                type: 'narrower',
                displayAs: 'cards'
            };

            await renderer.render(container, config, currentFile, null);

            // Check cards structure
            const cardsContainer = container.querySelector('.exocortex-narrower-cards');
            expect(cardsContainer).toBeTruthy();
            
            const cards = container.querySelectorAll('.exocortex-card');
            expect(cards).toHaveLength(4);
            
            // Check card content
            const headers = container.querySelectorAll('.exocortex-card-header a');
            expect(headers).toHaveLength(4);
        });

        it('should filter by class when specified', async () => {
            const config: NarrowerBlockConfig = {
                type: 'narrower',
                filterByClass: 'ims__Concept'
            };

            await renderer.render(container, config, currentFile, null);

            // Should show 3 concepts (excluding 'Other' which has different class)
            const info = container.querySelector('.exocortex-narrower-info');
            expect(info?.textContent).toContain('3 narrower concepts');
            
            const items = container.querySelectorAll('li');
            expect(items).toHaveLength(3);
        });

        it('should limit results when maxResults is specified', async () => {
            const config: NarrowerBlockConfig = {
                type: 'narrower',
                maxResults: 2
            };

            await renderer.render(container, config, currentFile, null);

            // Should show count info with limitation
            const info = container.querySelector('.exocortex-narrower-info');
            expect(info?.textContent).toContain('4 narrower concepts, showing 2');
            
            const items = container.querySelectorAll('li');
            expect(items).toHaveLength(2);
        });

        it('should show empty state when no narrower concepts found', async () => {
            // Mock a file with no narrower concepts
            const isolatedFile = {
                path: 'concepts/Isolated.md',
                basename: 'Isolated',
                name: 'Isolated.md'
            } as TFile;

            const config: NarrowerBlockConfig = {
                type: 'narrower'
            };

            await renderer.render(container, config, isolatedFile, null);

            // Check empty state
            const emptyMessage = container.querySelector('.exocortex-empty');
            expect(emptyMessage).toBeTruthy();
            expect(emptyMessage?.textContent).toBe('No narrower concepts found');
            
            const info = container.querySelector('.exocortex-narrower-info');
            expect(info?.textContent).toContain('0 narrower concepts');
        });

        it('should use custom broader property when specified', async () => {
            const config: NarrowerBlockConfig = {
                type: 'narrower',
                broaderProperty: 'custom__broader'
            };

            // Mock file cache to use custom property
            app.metadataCache.getFileCache = jest.fn((file: TFile) => {
                const metadata: Partial<CachedMetadata> = {};
                
                if (file.basename === 'Mammal') {
                    metadata.frontmatter = {
                        'exo__Asset_label': 'Mammal',
                        'custom__broader': '[[Animal]]'
                    };
                } else if (file.basename === 'Animal') {
                    metadata.frontmatter = {
                        'exo__Asset_label': 'Animal'
                    };
                }
                
                return metadata as CachedMetadata;
            });

            await renderer.render(container, config, currentFile, null);

            // Should find 1 concept using custom property
            const info = container.querySelector('.exocortex-narrower-info');
            expect(info?.textContent).toContain('1 narrower concept');
        });

        it('should handle different reference formats correctly', async () => {
            const config: NarrowerBlockConfig = {
                type: 'narrower'
            };

            await renderer.render(container, config, currentFile, null);

            // Should find concepts regardless of reference format:
            // '[[Animal]]', ['[[Animal]]'], '[[concepts/Animal]]'
            const items = container.querySelectorAll('li');
            expect(items).toHaveLength(4); // Mammal, Bird, Reptile, Other
            
            // This test verifies the renderer handles various wikilink formats
            expect(app.metadataCache.getFileCache).toHaveBeenCalled();
        });
    });
});