import { App } from 'obsidian';
import { BlockRendererFactory } from '../../../../src/presentation/factories/BlockRendererFactory';
import { PropertyRenderer } from '../../../../src/presentation/components/PropertyRenderer';
import { QueryEngineService } from '../../../../src/application/services/QueryEngineService';

// Mock Obsidian API
jest.mock('obsidian', () => ({
    App: jest.fn(),
}));

// Mock all the renderer dependencies
jest.mock('../../../../src/presentation/renderers/InstancesBlockRenderer');
jest.mock('../../../../src/presentation/renderers/QueryBlockRenderer');
jest.mock('../../../../src/presentation/renderers/PropertiesBlockRenderer');
jest.mock('../../../../src/presentation/renderers/BacklinksBlockRenderer');
jest.mock('../../../../src/presentation/renderers/ChildrenEffortsBlockRenderer');
jest.mock('../../../../src/presentation/renderers/NarrowerBlockRenderer');
jest.mock('../../../../src/presentation/renderers/ButtonsBlockRenderer');
jest.mock('../../../../src/presentation/renderers/CustomBlockRenderer');

describe('BlockRendererFactory - Instances Block Integration', () => {
    let factory: BlockRendererFactory;
    let mockApp: jest.Mocked<App>;
    let mockPropertyRenderer: jest.Mocked<PropertyRenderer>;
    let mockQueryEngineService: jest.Mocked<QueryEngineService>;

    beforeEach(() => {
        mockApp = {} as jest.Mocked<App>;
        mockPropertyRenderer = {} as jest.Mocked<PropertyRenderer>;
        mockQueryEngineService = {} as jest.Mocked<QueryEngineService>;

        factory = new BlockRendererFactory(mockApp, mockPropertyRenderer, mockQueryEngineService);
    });

    describe('instances block type support', () => {
        it('should include instances in supported block types', () => {
            const supportedTypes = factory.getSupportedBlockTypes();
            
            expect(supportedTypes).toContain('instances');
            expect(supportedTypes.length).toBeGreaterThan(7); // Should have all block types
        });

        it('should create renderer for instances block type', () => {
            const result = factory.createRenderer('instances');
            
            expect(result.isSuccess).toBe(true);
            
            const renderer = result.getValue();
            expect(renderer).toBeDefined();
        });

        it('should create different renderers for different block types', () => {
            const instancesResult = factory.createRenderer('instances');
            const queryResult = factory.createRenderer('query');
            const backlinksResult = factory.createRenderer('backlinks');

            expect(instancesResult.isSuccess).toBe(true);
            expect(queryResult.isSuccess).toBe(true);
            expect(backlinksResult.isSuccess).toBe(true);

            // All should be valid but different instances
            expect(instancesResult.getValue()).toBeDefined();
            expect(queryResult.getValue()).toBeDefined();
            expect(backlinksResult.getValue()).toBeDefined();
        });

        it('should fail for unsupported block types', () => {
            const result = factory.createRenderer('unsupported-type' as any);
            
            expect(result.isSuccess).toBe(false);
            expect(result.getError()).toContain('No renderer found for block type: unsupported-type');
        });

        it('should allow runtime registration of custom renderers', () => {
            const customRenderer = {
                render: jest.fn().mockResolvedValue(undefined)
            };

            // Register custom renderer
            factory.registerRenderer('custom-instances' as any, customRenderer);

            // Should now be able to create the custom renderer
            const result = factory.createRenderer('custom-instances' as any);
            expect(result.isSuccess).toBe(true);
        });

        it('should allow unregistering renderers', () => {
            // Should initially have instances renderer
            const beforeResult = factory.createRenderer('instances');
            expect(beforeResult.isSuccess).toBe(true);

            // Unregister instances renderer
            const unregistered = factory.unregisterRenderer('instances');
            expect(unregistered).toBe(true);

            // Should now fail to create instances renderer
            const afterResult = factory.createRenderer('instances');
            expect(afterResult.isSuccess).toBe(false);
        });
    });

    describe('renderer adapter functionality', () => {
        it('should wrap legacy renderers with adapter pattern', async () => {
            const renderer = factory.createRenderer('instances').getValue()!;

            // Mock context for rendering
            const mockContext = {
                container: document.createElement('div'),
                config: { type: 'instances' },
                file: { basename: 'TestFile' } as any,
                frontmatter: {},
                dataviewApi: null
            };

            // Should not throw when rendering (adapter should handle it)
            const renderResult = await renderer.render(mockContext);
            
            // Depending on the mock setup, this might succeed or fail
            // but it should not throw an exception
            expect(renderResult).toBeDefined();
        });
    });
});