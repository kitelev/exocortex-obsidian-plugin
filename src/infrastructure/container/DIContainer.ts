import { App } from 'obsidian';
import { Container } from '../../application/core/Container';

// Repositories
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IOntologyRepository } from '../../domain/repositories/IOntologyRepository';
import { IClassViewRepository } from '../../domain/repositories/IClassViewRepository';
import { IButtonRepository } from '../../domain/repositories/IButtonRepository';
import { IClassLayoutRepository } from '../../domain/repositories/IClassLayoutRepository';
import { ObsidianAssetRepository } from '../repositories/ObsidianAssetRepository';
import { ObsidianOntologyRepository } from '../repositories/ObsidianOntologyRepository';
import { ObsidianClassViewRepository } from '../repositories/ObsidianClassViewRepository';
import { ObsidianButtonRepository } from '../repositories/ObsidianButtonRepository';
import { ObsidianClassLayoutRepository } from '../repositories/ObsidianClassLayoutRepository';

// Use Cases
import { CreateAssetUseCase } from '../../application/use-cases/CreateAssetUseCase';
import { RenderClassButtonsUseCase } from '../../application/use-cases/RenderClassButtonsUseCase';
import { ExecuteButtonCommandUseCase } from '../../application/use-cases/ExecuteButtonCommandUseCase';
import { PropertyEditingUseCase } from '../../application/use-cases/PropertyEditingUseCase';

// Services
import { ICommandExecutor } from '../../application/services/ICommandExecutor';
import { ObsidianCommandExecutor } from '../services/ObsidianCommandExecutor';
import { ErrorHandlerService } from '../../application/services/ErrorHandlerService';

// Presentation
import { ButtonRenderer } from '../../presentation/components/ButtonRenderer';
import { PropertyRenderer } from '../../presentation/components/PropertyRenderer';
import { LayoutRenderer } from '../../presentation/renderers/LayoutRenderer';

/**
 * Dependency Injection Container Setup
 * Following Clean Architecture - wires up all dependencies
 */
export class DIContainer {
    private static instance: DIContainer;
    private container: Container;

    private plugin: any;

    private constructor(private app: App) {
        this.container = Container.getInstance();
        this.registerDependencies();
    }

    public static initialize(app: App, plugin?: any): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer(app);
        } else {
            // Always update app and plugin references
            DIContainer.instance.app = app;
            if (plugin) {
                DIContainer.instance.plugin = plugin;
            }
            // Re-register dependencies to ensure they use the new app instance
            DIContainer.instance.container.clear();
            DIContainer.instance.registerDependencies();
        }
        if (plugin && !DIContainer.instance.plugin) {
            DIContainer.instance.plugin = plugin;
        }
        return DIContainer.instance;
    }

    public static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            throw new Error('DIContainer not initialized. Call initialize(app) first.');
        }
        return DIContainer.instance;
    }

    /**
     * Async initialize method for backward compatibility
     */
    public async initialize(app: App): Promise<void> {
        // Already initialized in constructor, this is for backward compatibility
        return Promise.resolve();
    }
    
    /**
     * Reset the container instance (for testing purposes)
     */
    public static reset(): void {
        DIContainer.instance = null as any;
    }

    private registerDependencies(): void {
        // Register Obsidian App
        this.container.register('App', () => this.app);

        // Register Repositories
        this.container.register<IAssetRepository>(
            'IAssetRepository',
            () => new ObsidianAssetRepository(this.app)
        );

        this.container.register<IOntologyRepository>(
            'IOntologyRepository',
            () => new ObsidianOntologyRepository(this.app)
        );

        this.container.register<IClassViewRepository>(
            'IClassViewRepository',
            () => new ObsidianClassViewRepository(this.app)
        );

        this.container.register<IButtonRepository>(
            'IButtonRepository',
            () => new ObsidianButtonRepository(this.app)
        );

        this.container.register<IClassLayoutRepository>(
            'IClassLayoutRepository',
            () => new ObsidianClassLayoutRepository(
                this.app,
                this.plugin?.settings?.layoutsFolderPath || 'layouts'
            )
        );

        // Register Services
        this.container.register<ICommandExecutor>(
            'ICommandExecutor',
            () => new ObsidianCommandExecutor(
                this.app,
                this.container.resolve<IAssetRepository>('IAssetRepository')
            )
        );

        // Register Error Handler Service
        this.container.register<ErrorHandlerService>(
            'ErrorHandlerService',
            () => new ErrorHandlerService({
                showUserNotification: true,
                logToConsole: true,
                trackMetrics: true,
                autoRecover: false
            })
        );

        // Register Use Cases
        this.container.register<CreateAssetUseCase>(
            'CreateAssetUseCase',
            () => new CreateAssetUseCase(
                this.container.resolve<IAssetRepository>('IAssetRepository'),
                this.container.resolve<IOntologyRepository>('IOntologyRepository')
            )
        );

        this.container.register<RenderClassButtonsUseCase>(
            'RenderClassButtonsUseCase',
            () => new RenderClassButtonsUseCase(
                this.container.resolve<IClassViewRepository>('IClassViewRepository'),
                this.container.resolve<IButtonRepository>('IButtonRepository')
            )
        );

        this.container.register<ExecuteButtonCommandUseCase>(
            'ExecuteButtonCommandUseCase',
            () => new ExecuteButtonCommandUseCase(
                this.container.resolve<IButtonRepository>('IButtonRepository'),
                this.container.resolve<ICommandExecutor>('ICommandExecutor')
            )
        );

        this.container.register<PropertyEditingUseCase>(
            'PropertyEditingUseCase',
            () => new PropertyEditingUseCase(
                this.container.resolve<IAssetRepository>('IAssetRepository'),
                this.plugin || this.app // Use plugin if available, otherwise app
            )
        );

        // Register Presentation Components
        this.container.register<ButtonRenderer>(
            'ButtonRenderer',
            () => new ButtonRenderer(
                this.app,
                this.container.resolve<RenderClassButtonsUseCase>('RenderClassButtonsUseCase'),
                this.container.resolve<ExecuteButtonCommandUseCase>('ExecuteButtonCommandUseCase')
            )
        );

        this.container.register<PropertyRenderer>(
            'PropertyRenderer',
            () => new PropertyRenderer(
                this.app,
                this.container.resolve<PropertyEditingUseCase>('PropertyEditingUseCase')
            )
        );

        this.container.register<LayoutRenderer>(
            'LayoutRenderer',
            () => new LayoutRenderer(
                this.app,
                this.container.resolve<IClassLayoutRepository>('IClassLayoutRepository'),
                this.container.resolve<PropertyRenderer>('PropertyRenderer')
            )
        );
    }

    /**
     * Resolve a dependency from the container
     */
    public resolve<T>(token: string): T {
        return this.container.resolve<T>(token);
    }

    /**
     * Get specific use cases for common operations
     */
    public getCreateAssetUseCase(): CreateAssetUseCase {
        return this.resolve<CreateAssetUseCase>('CreateAssetUseCase');
    }

    public getRenderButtonsUseCase(): RenderClassButtonsUseCase {
        return this.resolve<RenderClassButtonsUseCase>('RenderClassButtonsUseCase');
    }

    public getExecuteButtonCommandUseCase(): ExecuteButtonCommandUseCase {
        return this.resolve<ExecuteButtonCommandUseCase>('ExecuteButtonCommandUseCase');
    }

    public getButtonRenderer(): ButtonRenderer {
        return this.resolve<ButtonRenderer>('ButtonRenderer');
    }

    public getPropertyRenderer(): PropertyRenderer {
        return this.resolve<PropertyRenderer>('PropertyRenderer');
    }

    public getLayoutRenderer(): LayoutRenderer {
        return this.resolve<LayoutRenderer>('LayoutRenderer');
    }

    public getPropertyEditingUseCase(): PropertyEditingUseCase {
        return this.resolve<PropertyEditingUseCase>('PropertyEditingUseCase');
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        // Clean up any resources if needed
        this.container.clear();
    }
}