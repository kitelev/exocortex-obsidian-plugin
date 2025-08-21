import { Entity } from '../core/Entity';
import { Result } from '../core/Result';
import { QueryEngineType } from '../ports/IQueryEngine';

export type BlockType = 'dynamic-backlinks';


export interface DynamicBacklinksBlockConfig {
    type: 'dynamic-backlinks';
    excludeProperties?: string[];
    maxResultsPerProperty?: number;
    filterByClass?: string;
    showEmptyProperties?: boolean;
}


export type BlockConfig = DynamicBacklinksBlockConfig;

export interface LayoutBlockProps {
    id: string;
    type: BlockType;
    title: string;
    order: number;
    config: BlockConfig;
    isVisible: boolean;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
}

export class LayoutBlock extends Entity<LayoutBlockProps> {
    private constructor(props: LayoutBlockProps) {
        super(props);
    }

    public static create(props: LayoutBlockProps): Result<LayoutBlock> {
        if (!props.title || props.title.trim().length === 0) {
            return Result.fail<LayoutBlock>('Block title is required');
        }

        if (props.order < 0) {
            return Result.fail<LayoutBlock>('Block order must be non-negative');
        }

        if (!this.isValidConfig(props.type, props.config)) {
            return Result.fail<LayoutBlock>('Invalid configuration for block type');
        }

        return Result.ok<LayoutBlock>(new LayoutBlock(props));
    }

    private static isValidConfig(type: BlockType, config: BlockConfig): boolean {
        if (config.type !== type) {
            return false;
        }

        // Only dynamic-backlinks is supported
        return type === 'dynamic-backlinks';
    }

    get id(): string {
        return this.props.id;
    }

    get type(): BlockType {
        return this.props.type;
    }

    get title(): string {
        return this.props.title;
    }

    get order(): number {
        return this.props.order;
    }

    get config(): BlockConfig {
        return this.props.config;
    }

    get isVisible(): boolean {
        return this.props.isVisible;
    }

    get isCollapsible(): boolean {
        return this.props.isCollapsible ?? true;
    }

    get isCollapsed(): boolean {
        return this.props.isCollapsed ?? false;
    }

    public updateTitle(title: string): Result<void> {
        if (!title || title.trim().length === 0) {
            return Result.fail<void>('Title cannot be empty');
        }
        this.props.title = title;
        return Result.ok<void>();
    }

    public updateOrder(order: number): Result<void> {
        if (order < 0) {
            return Result.fail<void>('Order must be non-negative');
        }
        this.props.order = order;
        return Result.ok<void>();
    }

    public updateConfig(config: BlockConfig): Result<void> {
        if (!LayoutBlock.isValidConfig(this.props.type, config)) {
            return Result.fail<void>('Invalid configuration for block type');
        }
        this.props.config = config;
        return Result.ok<void>();
    }

    public toggleVisibility(): void {
        this.props.isVisible = !this.props.isVisible;
    }

    public toggleCollapse(): void {
        if (this.props.isCollapsible) {
            this.props.isCollapsed = !this.props.isCollapsed;
        }
    }

    public show(): void {
        this.props.isVisible = true;
    }

    public hide(): void {
        this.props.isVisible = false;
    }

    public collapse(): void {
        if (this.props.isCollapsible) {
            this.props.isCollapsed = true;
        }
    }

    public expand(): void {
        this.props.isCollapsed = false;
    }
}