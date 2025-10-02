import { Entity } from "../core/Entity";
import { Result } from "../core/Result";

export type BlockType = "dynamic-backlinks" | "relation-properties" | "Buttons";

export interface PropertyDisplayConfig {
  propertyName: string;
  displayLabel?: string;
  formatType?: "raw" | "status-badge" | "date" | "link" | "custom";
  customFormatter?: string;
  isVisible: boolean;
  columnWidth?: string;
  alignment?: "left" | "center" | "right";
}

export interface DynamicBacklinksBlockConfig {
  type: "dynamic-backlinks";
  propertyFilter?: string;
  maxResults?: number;
  maxResultsPerProperty?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  excludeProperties?: string[];
  showEmptyProperties?: boolean;
  filterByClass?: string;
}

export interface RelationPropertiesBlockConfig {
  type: "relation-properties";
  targetClass?: string;
  displayProperties: PropertyDisplayConfig[];
  groupByProperty?: string;
  sortBy?: {
    property: string;
    direction: "asc" | "desc";
  };
  maxResults?: number;
  showEmptyProperties?: boolean;
  showAssetName?: boolean;
  showAssetClass?: boolean;
  tableFormat?: boolean;
}

export type BlockConfig =
  | DynamicBacklinksBlockConfig
  | RelationPropertiesBlockConfig;

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  order: number;
  isVisible: boolean;
  isCollapsible: boolean;
  isCollapsed: boolean;
  config: BlockConfig;
}

export interface LayoutBlockProps {
  targetClass: string;
  blocks: Block[];
  priority: number;
  enabled: boolean;
}

export class LayoutBlock extends Entity<LayoutBlockProps> {
  get targetClass(): string {
    return this.props.targetClass;
  }

  get blocks(): Block[] {
    return this.props.blocks;
  }

  get priority(): number {
    return this.props.priority;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  public static create(
    props: LayoutBlockProps,
    id?: string,
  ): Result<LayoutBlock> {
    if (!props.targetClass || props.targetClass.trim().length === 0) {
      return Result.fail<LayoutBlock>("Target class is required");
    }

    if (!props.blocks || props.blocks.length === 0) {
      return Result.fail<LayoutBlock>("At least one block is required");
    }

    for (const block of props.blocks) {
      const validationResult = this.validateBlock(block);
      if (!validationResult.isSuccess) {
        return Result.fail<LayoutBlock>(validationResult.getError());
      }
    }

    const layoutBlock = new LayoutBlock(props, id);
    return Result.ok<LayoutBlock>(layoutBlock);
  }

  private static validateBlock(block: Block): Result<void> {
    if (!block.id || block.id.trim().length === 0) {
      return Result.fail<void>("Block ID is required");
    }

    if (!block.type) {
      return Result.fail<void>("Block type is required");
    }

    if (!block.title || block.title.trim().length === 0) {
      return Result.fail<void>("Block title is required");
    }

    if (typeof block.order !== "number") {
      return Result.fail<void>("Block order must be a number");
    }

    if (typeof block.isVisible !== "boolean") {
      return Result.fail<void>("Block isVisible must be a boolean");
    }

    if (!this.isValidConfig(block.type, block.config)) {
      return Result.fail<void>(
        `Invalid configuration for block type ${block.type}`,
      );
    }

    return Result.ok<void>();
  }

  private static isValidConfig(type: BlockType, config: BlockConfig): boolean {
    if (!config || config.type !== type) {
      return false;
    }

    switch (type) {
      case "dynamic-backlinks":
        return this.validateDynamicBacklinksConfig(
          config as DynamicBacklinksBlockConfig,
        );
      case "relation-properties":
        return this.validateRelationPropertiesConfig(
          config as RelationPropertiesBlockConfig,
        );
      default:
        return false;
    }
  }

  private static validateDynamicBacklinksConfig(
    config: DynamicBacklinksBlockConfig,
  ): boolean {
    if (config.maxResults !== undefined && config.maxResults <= 0) {
      return false;
    }

    if (config.sortOrder && !["asc", "desc"].includes(config.sortOrder)) {
      return false;
    }

    return true;
  }

  private static validateRelationPropertiesConfig(
    config: RelationPropertiesBlockConfig,
  ): boolean {
    if (!config.displayProperties || config.displayProperties.length === 0) {
      return false;
    }

    for (const prop of config.displayProperties) {
      if (!prop.propertyName || prop.propertyName.trim().length === 0) {
        return false;
      }

      if (typeof prop.isVisible !== "boolean") {
        return false;
      }

      if (
        prop.formatType &&
        !["raw", "status-badge", "date", "link", "custom"].includes(
          prop.formatType,
        )
      ) {
        return false;
      }

      if (
        prop.alignment &&
        !["left", "center", "right"].includes(prop.alignment)
      ) {
        return false;
      }
    }

    if (config.maxResults !== undefined && config.maxResults <= 0) {
      return false;
    }

    if (
      config.sortBy &&
      (!config.sortBy.property ||
        !["asc", "desc"].includes(config.sortBy.direction))
    ) {
      return false;
    }

    return true;
  }

  public findBlockById(blockId: string): Block | undefined {
    return this.blocks.find((block) => block.id === blockId);
  }

  public getVisibleBlocks(): Block[] {
    return this.blocks
      .filter((block) => block.isVisible)
      .sort((a, b) => a.order - b.order);
  }

  public getRelationPropertiesBlocks(): Block[] {
    return this.blocks.filter((block) => block.type === "relation-properties");
  }

  public updateBlock(blockId: string, updates: Partial<Block>): Result<void> {
    const blockIndex = this.blocks.findIndex((block) => block.id === blockId);

    if (blockIndex === -1) {
      return Result.fail<void>("Block not found");
    }

    const updatedBlock = { ...this.blocks[blockIndex], ...updates };
    const validationResult = LayoutBlock.validateBlock(updatedBlock);

    if (!validationResult.isSuccess) {
      return validationResult;
    }

    this.props.blocks[blockIndex] = updatedBlock;
    return Result.ok<void>();
  }

  public addBlock(block: Block): Result<void> {
    const validationResult = LayoutBlock.validateBlock(block);

    if (!validationResult.isSuccess) {
      return validationResult;
    }

    if (this.findBlockById(block.id)) {
      return Result.fail<void>("Block with this ID already exists");
    }

    this.props.blocks.push(block);
    return Result.ok<void>();
  }

  public removeBlock(blockId: string): Result<void> {
    const blockIndex = this.blocks.findIndex((block) => block.id === blockId);

    if (blockIndex === -1) {
      return Result.fail<void>("Block not found");
    }

    this.props.blocks.splice(blockIndex, 1);
    return Result.ok<void>();
  }

  public setPriority(priority: number): Result<void> {
    if (priority < 0) {
      return Result.fail<void>("Priority must be non-negative");
    }

    this.props.priority = priority;
    return Result.ok<void>();
  }

  public setEnabled(enabled: boolean): void {
    this.props.enabled = enabled;
  }
}
