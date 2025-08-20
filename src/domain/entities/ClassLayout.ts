import { Entity } from '../core/Entity';
import { AssetId } from '../value-objects/AssetId';
import { ClassName } from '../value-objects/ClassName';
import { Result } from '../core/Result';
import { BlockType } from './LayoutBlock';

export interface LayoutBlockConfig {
    id: string;
    type: BlockType;
    title: string;
    order: number;
    config: Record<string, any>;
    isVisible: boolean;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
}

export interface ClassLayoutProps {
    id: AssetId;
    targetClass: ClassName;
    blocks: LayoutBlockConfig[];
    isEnabled: boolean;
    priority: number;
}

export class ClassLayout extends Entity<ClassLayoutProps> {
    private static readonly MAX_BLOCKS = 20;

    private constructor(props: ClassLayoutProps) {
        super(props);
    }

    public static create(props: ClassLayoutProps): Result<ClassLayout> {
        if (!props.targetClass) {
            return Result.fail<ClassLayout>('Target class is required');
        }

        if (props.blocks.length > ClassLayout.MAX_BLOCKS) {
            return Result.fail<ClassLayout>(`Cannot have more than ${ClassLayout.MAX_BLOCKS} blocks`);
        }

        const orders = props.blocks.map(b => b.order);
        const uniqueOrders = new Set(orders);
        if (uniqueOrders.size !== orders.length) {
            return Result.fail<ClassLayout>('Blocks cannot have duplicate order values');
        }

        return Result.ok<ClassLayout>(new ClassLayout(props));
    }

    get id(): AssetId {
        return this.props.id;
    }

    get targetClass(): ClassName {
        return this.props.targetClass;
    }

    get blocks(): LayoutBlockConfig[] {
        return [...this.props.blocks].sort((a, b) => a.order - b.order);
    }

    get isEnabled(): boolean {
        return this.props.isEnabled;
    }

    get priority(): number {
        return this.props.priority;
    }

    public addBlock(block: LayoutBlockConfig): Result<void> {
        if (this.props.blocks.length >= ClassLayout.MAX_BLOCKS) {
            return Result.fail<void>(`Cannot add more blocks. Maximum of ${ClassLayout.MAX_BLOCKS} reached`);
        }

        if (this.props.blocks.some(b => b.id === block.id)) {
            return Result.fail<void>('Block with this ID already exists');
        }

        if (this.props.blocks.some(b => b.order === block.order)) {
            return Result.fail<void>(`Block with order ${block.order} already exists`);
        }

        this.props.blocks.push(block);
        return Result.ok<void>();
    }

    public removeBlock(blockId: string): Result<void> {
        const blockIndex = this.props.blocks.findIndex(b => b.id === blockId);
        
        if (blockIndex === -1) {
            return Result.fail<void>('Block not found');
        }

        this.props.blocks.splice(blockIndex, 1);
        return Result.ok<void>();
    }

    public updateBlock(blockId: string, updates: Partial<LayoutBlockConfig>): Result<void> {
        const block = this.props.blocks.find(b => b.id === blockId);
        
        if (!block) {
            return Result.fail<void>('Block not found');
        }

        if (updates.order !== undefined && updates.order !== block.order) {
            if (this.props.blocks.some(b => b.id !== blockId && b.order === updates.order)) {
                return Result.fail<void>(`Block with order ${updates.order} already exists`);
            }
        }

        Object.assign(block, updates);
        return Result.ok<void>();
    }

    public getVisibleBlocks(): LayoutBlockConfig[] {
        return this.blocks.filter(b => b.isVisible);
    }

    public enable(): void {
        this.props.isEnabled = true;
    }

    public disable(): void {
        this.props.isEnabled = false;
    }
}