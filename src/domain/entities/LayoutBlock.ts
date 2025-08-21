import { Entity } from '../core/Entity';
import { Result } from '../core/Result';
import { QueryEngineType } from '../ports/IQueryEngine';

export type BlockType = 'query' | 'properties' | 'relations' | 'backlinks' | 'children-efforts' | 'buttons' | 'custom';

export interface QueryBlockConfig {
    type: 'query';
    query: string;
    className?: string;
    propertyFilters?: Array<{
        property: string;
        operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'notEquals';
        value: string;
    }>;
    relationProperty?: string;
    maxResults?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    displayAs?: 'list' | 'table' | 'cards';
}

export interface PropertiesBlockConfig {
    type: 'properties';
    includedProperties?: string[];
    excludedProperties?: string[];
    editableProperties?: string[];
    groupBy?: string;
}

export interface RelationsBlockConfig {
    type: 'relations';
    relationProperty: string;
    showBacklinks?: boolean;
    showForwardLinks?: boolean;
    maxDepth?: number;
}

export interface BacklinksBlockConfig {
    type: 'backlinks';
    filterByClass?: string;
    groupByClass?: boolean;
    maxResults?: number;
}

export interface ChildrenEffortsBlockConfig {
    type: 'children-efforts';
    filterByClass?: string;
    groupByClass?: boolean;
    maxResults?: number;
    showParentPath?: boolean;
}

export interface QueryEngineQuery {
    query: string;
    engineType?: QueryEngineType;
    enginePreference?: QueryEngineType[];
}

export interface ButtonsBlockConfig {
    type: 'buttons';
    buttons: Array<{
        id: string;
        label: string;
        commandType: string;
        tooltip?: string;
        style?: 'primary' | 'default' | 'danger';
        parameters?: Record<string, any>;
    }>;
    position?: 'top' | 'bottom' | 'inline';
    style?: string;
}

export interface CustomBlockConfig {
    type: 'custom';
    templatePath?: string;
    dataviewQuery?: string; // @deprecated - use queryEngineQuery instead
    queryEngineQuery?: QueryEngineQuery;
    customScript?: string;
}

export type BlockConfig = QueryBlockConfig | PropertiesBlockConfig | RelationsBlockConfig | BacklinksBlockConfig | ChildrenEffortsBlockConfig | ButtonsBlockConfig | CustomBlockConfig;

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

        switch (type) {
            case 'query':
                const queryConfig = config as QueryBlockConfig;
                return !!queryConfig.query || !!queryConfig.className;
            
            case 'properties':
                return true;
            
            case 'relations':
                const relConfig = config as RelationsBlockConfig;
                return !!relConfig.relationProperty;
            
            case 'backlinks':
                return true;
            
            case 'children-efforts':
                return true;
            
            case 'buttons':
                const buttonsConfig = config as ButtonsBlockConfig;
                return Array.isArray(buttonsConfig.buttons);
            
            case 'custom':
                const customConfig = config as CustomBlockConfig;
                return !!customConfig.templatePath || !!customConfig.dataviewQuery || !!customConfig.queryEngineQuery || !!customConfig.customScript;
            
            default:
                return false;
        }
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