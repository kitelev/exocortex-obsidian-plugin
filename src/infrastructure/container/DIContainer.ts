import { App } from 'obsidian';
import { Container } from '../../application/core/Container';

// Repositories
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IOntologyRepository } from '../../domain/repositories/IOntologyRepository';
import { IClassViewRepository } from '../../domain/repositories/IClassViewRepository';
import { IButtonRepository } from '../../domain/repositories/IButtonRepository';
import { ObsidianVaultAdapter } from '../adapters/ObsidianVaultAdapter';
import { ObsidianClassViewRepository } from '../repositories/ObsidianClassViewRepository';
import { ObsidianButtonRepository } from '../repositories/ObsidianButtonRepository';

// Use Cases
import { CreateAssetUseCase } from '../../application/use-cases/CreateAssetUseCase';
import { RenderClassButtonsUseCase } from '../../application/use-cases/RenderClassButtonsUseCase';
import { ExecuteButtonCommandUseCase } from '../../application/use-cases/ExecuteButtonCommandUseCase';

// Services
import { ICommandExecutor } from '../../application/services/ICommandExecutor';
import { ObsidianCommandExecutor } from '../services/ObsidianCommandExecutor';

// Presentation
import { ButtonRenderer } from '../../presentation/components/ButtonRenderer';

/**
 * Dependency Injection Container Setup
 * Following Clean Architecture - wires up all dependencies
 */
export class DIContainer {
    private static instance: DIContainer;
    private container: Container;

    private constructor(private app: App) {
        this.container = Container.getInstance();
        this.registerDependencies();
    }

    public static initialize(app: App): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer(app);
        }
        return DIContainer.instance;
    }

    public static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            throw new Error('DIContainer not initialized. Call initialize(app) first.');
        }
        return DIContainer.instance;
    }

    private registerDependencies(): void {
        // Register Obsidian App
        this.container.register('App', () => this.app);

        // Register Repositories
        this.container.register<IAssetRepository>(
            'IAssetRepository',
            () => new ObsidianVaultAdapter(this.app)
        );

        this.container.register<IOntologyRepository>(
            'IOntologyRepository',
            () => new ObsidianVaultAdapter(this.app)
        );

        this.container.register<IClassViewRepository>(
            'IClassViewRepository',
            () => new ObsidianClassViewRepository(this.app)
        );

        this.container.register<IButtonRepository>(
            'IButtonRepository',
            () => new ObsidianButtonRepository(this.app)
        );

        // Register Services
        this.container.register<ICommandExecutor>(
            'ICommandExecutor',
            () => new ObsidianCommandExecutor(
                this.app,
                this.container.resolve<IAssetRepository>('IAssetRepository')
            )
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

        // Register Presentation Components
        this.container.register<ButtonRenderer>(
            'ButtonRenderer',
            () => new ButtonRenderer(
                this.app,
                this.container.resolve<RenderClassButtonsUseCase>('RenderClassButtonsUseCase'),
                this.container.resolve<ExecuteButtonCommandUseCase>('ExecuteButtonCommandUseCase')
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

    /**
     * Clean up resources
     */
    public dispose(): void {
        // Clean up any resources if needed
        this.container.clear();
    }
}