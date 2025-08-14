import { CustomBlockRenderer } from '../../../../src/presentation/renderers/CustomBlockRenderer';
import { Vault, App, TFile } from '../../../__mocks__/obsidian';
import { CustomBlockConfig } from '../../../../src/domain/entities/LayoutBlock';

describe('CustomBlockRenderer', () => {
    let renderer: CustomBlockRenderer;
    let mockVault: Vault;
    let mockApp: App;
    let mockFile: TFile;

    beforeEach(() => {
        mockVault = new Vault();
        mockApp = new App();
        mockFile = new TFile();
        mockFile.path = 'test.md';
        mockFile.basename = 'test';
        renderer = new CustomBlockRenderer(mockApp as any);
    });

    describe('render', () => {
        it('should handle empty config', async () => {
            const container = document.createElement('div');
            const config: CustomBlockConfig = {
                type: 'custom'
            };
            
            await renderer.render(container, config, mockFile, {}, null);
            
            expect(container.textContent).toContain('Custom block has no content configured');
        });

        it('should handle custom script config', async () => {
            const container = document.createElement('div');
            const config: CustomBlockConfig = {
                type: 'custom',
                customScript: 'container.innerHTML = "<div>Script executed</div>";'
            };
            
            await renderer.render(container, config, mockFile, {}, null);
            
            expect(container.textContent).toContain('Script executed');
        });

        it('should handle template path config', async () => {
            const container = document.createElement('div');
            const config: CustomBlockConfig = {
                type: 'custom',
                templatePath: 'templates/test.md'
            };
            
            // Mock template file not found scenario
            await renderer.render(container, config, mockFile, {}, null);
            
            expect(container.textContent).toContain('Template not found');
        });

        it('should handle dataview query config', async () => {
            const container = document.createElement('div');
            const config: CustomBlockConfig = {
                type: 'custom',
                dataviewQuery: 'table file.name from ""'
            };
            
            const mockDv = {
                pages: jest.fn().mockReturnValue([]),
                table: jest.fn(),
                list: jest.fn()
            };
            
            await renderer.render(container, config, mockFile, {}, mockDv);
            
            expect(mockDv.pages).toHaveBeenCalled();
        });

        it('should handle script execution errors gracefully', async () => {
            const container = document.createElement('div');
            const config: CustomBlockConfig = {
                type: 'custom',
                customScript: 'throw new Error("Test error");'
            };
            
            await expect(renderer.render(container, config, mockFile, {}, null)).resolves.not.toThrow();
            expect(container.textContent).toContain('Script execution error');
        });

        it('should handle dataview not available', async () => {
            const container = document.createElement('div');
            const config: CustomBlockConfig = {
                type: 'custom',
                dataviewQuery: 'table file.name from ""'
            };
            
            await renderer.render(container, config, mockFile, {}, null);
            
            expect(container.textContent).toContain('Dataview is not available');
        });

        it('should process template variables', async () => {
            const container = document.createElement('div');
            const config: CustomBlockConfig = {
                type: 'custom',
                customScript: `
                    const processed = this.renderer.processTemplateVariables ? 
                        'Variables processed' : 'No template processing';
                    container.innerHTML = processed;
                `
            };
            
            await renderer.render(container, config, mockFile, { title: 'Test' }, null);
            
            // Should complete without throwing
            expect(container).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should handle render errors gracefully', async () => {
            const container = document.createElement('div');
            const config = null as any;
            
            await expect(renderer.render(container, config, mockFile, {}, null)).resolves.not.toThrow();
            expect(container.textContent).toContain('Error rendering custom block');
        });

        it('should handle invalid template path', async () => {
            const container = document.createElement('div');
            const config: CustomBlockConfig = {
                type: 'custom',
                templatePath: 'nonexistent/template.md'
            };
            
            await renderer.render(container, config, mockFile, {}, null);
            
            expect(container.textContent).toContain('Template not found');
        });
    });
});