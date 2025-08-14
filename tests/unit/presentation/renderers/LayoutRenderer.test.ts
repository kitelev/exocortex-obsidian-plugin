import { LayoutRenderer } from '../../../../src/presentation/renderers/LayoutRenderer';
import { Vault, App } from '../../../__mocks__/obsidian';
import { ClassLayout } from '../../../../src/domain/entities/ClassLayout';
import { Result } from '../../../../src/domain/core/Result';

describe('LayoutRenderer', () => {
    let renderer: LayoutRenderer;
    let mockVault: Vault;
    let mockApp: App;

    beforeEach(() => {
        mockVault = new Vault();
        mockApp = new App();
        const mockLayoutRepository = {
            findByClassName: jest.fn().mockResolvedValue(Result.fail('No layout found')),
            save: jest.fn().mockResolvedValue(Result.ok(undefined)),
            findAll: jest.fn().mockResolvedValue(Result.ok([]))
        };
        const mockPropertyRenderer = {
            renderPropertiesBlock: jest.fn()
        };
        renderer = new LayoutRenderer(mockApp as any, mockLayoutRepository as any, mockPropertyRenderer as any);
    });

    describe('renderLayout', () => {
        it('should render empty layout for null input', () => {
            const container = document.createElement('div');
            
            renderer.renderLayout(null, container);
            
            expect(container.children.length).toBe(0);
        });

        it('should render basic layout structure', () => {
            const container = document.createElement('div');
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: {
                    blocks: [
                        {
                            id: 'block1',
                            type: 'properties',
                            title: 'Properties',
                            config: {}
                        }
                    ]
                }
            });

            if (layout.isSuccess) {
                renderer.renderLayout(layout.value, container);
                
                expect(container.children.length).toBeGreaterThan(0);
                expect(container.querySelector('[data-block-id="block1"]')).toBeTruthy();
            }
        });

        it('should handle blocks with different types', () => {
            const container = document.createElement('div');
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: {
                    blocks: [
                        {
                            id: 'props',
                            type: 'properties',
                            title: 'Properties',
                            config: {}
                        },
                        {
                            id: 'backlinks',
                            type: 'backlinks',
                            title: 'Backlinks',
                            config: {}
                        },
                        {
                            id: 'query',
                            type: 'query',
                            title: 'Query',
                            config: { query: 'SELECT * WHERE { ?s ?p ?o }' }
                        }
                    ]
                }
            });

            if (layout.isSuccess) {
                renderer.renderLayout(layout.value, container);
                
                expect(container.querySelector('[data-block-id="props"]')).toBeTruthy();
                expect(container.querySelector('[data-block-id="backlinks"]')).toBeTruthy();
                expect(container.querySelector('[data-block-id="query"]')).toBeTruthy();
            }
        });

        it('should handle block rendering errors gracefully', () => {
            const container = document.createElement('div');
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: {
                    blocks: [
                        {
                            id: 'invalid-block',
                            type: 'nonexistent-type' as any,
                            title: 'Invalid',
                            config: {}
                        }
                    ]
                }
            });

            if (layout.isSuccess) {
                expect(() => {
                    renderer.renderLayout(layout.value, container);
                }).not.toThrow();
                
                // Should still create container for the block even if rendering fails
                expect(container.children.length).toBeGreaterThan(0);
            }
        });

        it('should apply custom CSS classes', () => {
            const container = document.createElement('div');
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: {
                    cssClass: 'custom-layout-class',
                    blocks: []
                }
            });

            if (layout.isSuccess) {
                renderer.renderLayout(layout.value, container);
                
                expect(container.classList.contains('custom-layout-class')).toBe(true);
            }
        });

        it('should handle empty blocks array', () => {
            const container = document.createElement('div');
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: {
                    blocks: []
                }
            });

            if (layout.isSuccess) {
                renderer.renderLayout(layout.value, container);
                
                expect(container.children.length).toBe(0);
            }
        });
    });

    describe('block rendering', () => {
        it('should render properties block', () => {
            const container = document.createElement('div');
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: {
                    blocks: [
                        {
                            id: 'props',
                            type: 'properties',
                            title: 'Test Properties',
                            config: {
                                properties: ['name', 'description', 'type']
                            }
                        }
                    ]
                }
            });

            if (layout.isSuccess) {
                renderer.renderLayout(layout.value, container);
                
                const blockElement = container.querySelector('[data-block-id="props"]');
                expect(blockElement).toBeTruthy();
                expect(blockElement?.textContent).toContain('Test Properties');
            }
        });

        it('should render backlinks block', () => {
            const container = document.createElement('div');
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: {
                    blocks: [
                        {
                            id: 'backlinks',
                            type: 'backlinks',
                            title: 'Related Notes',
                            config: {}
                        }
                    ]
                }
            });

            if (layout.isSuccess) {
                renderer.renderLayout(layout.value, container);
                
                const blockElement = container.querySelector('[data-block-id="backlinks"]');
                expect(blockElement).toBeTruthy();
                expect(blockElement?.textContent).toContain('Related Notes');
            }
        });

        it('should render query block with SPARQL', () => {
            const container = document.createElement('div');
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: {
                    blocks: [
                        {
                            id: 'query',
                            type: 'query',
                            title: 'SPARQL Results',
                            config: {
                                query: 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10'
                            }
                        }
                    ]
                }
            });

            if (layout.isSuccess) {
                renderer.renderLayout(layout.value, container);
                
                const blockElement = container.querySelector('[data-block-id="query"]');
                expect(blockElement).toBeTruthy();
                expect(blockElement?.textContent).toContain('SPARQL Results');
            }
        });
    });

    describe('error handling', () => {
        it('should handle undefined container', () => {
            const layout = ClassLayout.create({
                id: 'test-layout',
                className: 'TestClass',
                config: { blocks: [] }
            });

            if (layout.isSuccess) {
                expect(() => {
                    renderer.renderLayout(layout.value, undefined as any);
                }).not.toThrow();
            }
        });

        it('should handle malformed layout config', () => {
            const container = document.createElement('div');
            
            expect(() => {
                renderer.renderLayout({} as any, container);
            }).not.toThrow();
        });
    });
});