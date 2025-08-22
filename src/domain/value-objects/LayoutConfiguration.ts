import { Result } from "../core/Result";

/**
 * Layout block types supported by the system
 */
export enum LayoutBlockType {
  PROPERTIES = "properties",
  CHILDREN_EFFORTS = "children_efforts",
  CUSTOM_QUERY = "custom_query",
  BACKLINKS = "backlinks",
  NARROWER = "narrower",
  BUTTONS = "buttons",
  MARKDOWN = "markdown",
}

/**
 * Layout display modes
 */
export enum LayoutDisplayMode {
  TABLE = "table",
  LIST = "list",
  CARDS = "cards",
  TREE = "tree",
}

/**
 * Layout orientation options
 */
export enum LayoutOrientation {
  VERTICAL = "vertical",
  HORIZONTAL = "horizontal",
}

/**
 * Individual block configuration
 */
export interface BlockConfiguration {
  readonly type: LayoutBlockType;
  readonly title?: string;
  readonly displayMode?: LayoutDisplayMode;
  readonly visible: boolean;
  readonly order: number;
  readonly customQuery?: string;
  readonly properties?: ReadonlyArray<string>;
  readonly maxItems?: number;
  readonly groupBy?: string;
  readonly sortBy?: string;
  readonly sortDirection?: "asc" | "desc";
  readonly cssClasses?: ReadonlyArray<string>;
}

/**
 * Complete layout configuration for a class or asset
 */
export interface LayoutConfigurationProps {
  readonly name: string;
  readonly description?: string;
  readonly orientation: LayoutOrientation;
  readonly blocks: ReadonlyArray<BlockConfiguration>;
  readonly responsive: boolean;
  readonly theme?: string;
  readonly customCss?: string;
}

/**
 * Value object representing layout configuration
 * Immutable and validates configuration consistency
 */
export class LayoutConfiguration {
  private readonly props: LayoutConfigurationProps;

  private constructor(props: LayoutConfigurationProps) {
    this.props = props;
  }

  /**
   * Create a new layout configuration with validation
   */
  static create(props: {
    name: string;
    description?: string;
    orientation?: LayoutOrientation;
    blocks: BlockConfiguration[] | ReadonlyArray<BlockConfiguration>;
    responsive?: boolean;
    theme?: string;
    customCss?: string;
  }): Result<LayoutConfiguration> {
    // Validate name
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<LayoutConfiguration>("Layout name cannot be empty");
    }

    if (props.name.length > 100) {
      return Result.fail<LayoutConfiguration>(
        "Layout name cannot exceed 100 characters",
      );
    }

    // Validate blocks
    if (!props.blocks || props.blocks.length === 0) {
      return Result.fail<LayoutConfiguration>(
        "Layout must have at least one block",
      );
    }

    // Validate block order uniqueness
    const orders = props.blocks.map((b) => b.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      return Result.fail<LayoutConfiguration>("Block orders must be unique");
    }

    // Validate custom queries
    for (const block of props.blocks) {
      if (block.type === LayoutBlockType.CUSTOM_QUERY) {
        if (!block.customQuery || block.customQuery.trim().length === 0) {
          return Result.fail<LayoutConfiguration>(
            "Custom query blocks must have a query",
          );
        }
      }
    }

    // Validate CSS if provided
    if (props.customCss && props.customCss.length > 10000) {
      return Result.fail<LayoutConfiguration>(
        "Custom CSS cannot exceed 10000 characters",
      );
    }

    const configProps: LayoutConfigurationProps = {
      name: props.name.trim(),
      description: props.description?.trim(),
      orientation: props.orientation ?? LayoutOrientation.VERTICAL,
      blocks: props.blocks.map((block) => ({ ...block })), // Deep copy
      responsive: props.responsive ?? true,
      theme: props.theme?.trim(),
      customCss: props.customCss?.trim(),
    };

    return Result.ok<LayoutConfiguration>(new LayoutConfiguration(configProps));
  }

  /**
   * Create default layout configuration
   */
  static createDefault(name: string): LayoutConfiguration {
    const defaultBlocks: BlockConfiguration[] = [
      {
        type: LayoutBlockType.PROPERTIES,
        title: "Properties",
        displayMode: LayoutDisplayMode.TABLE,
        visible: true,
        order: 1,
      },
      {
        type: LayoutBlockType.CHILDREN_EFFORTS,
        title: "Children Efforts",
        displayMode: LayoutDisplayMode.TABLE,
        visible: true,
        order: 2,
      },
      {
        type: LayoutBlockType.BACKLINKS,
        title: "Backlinks",
        displayMode: LayoutDisplayMode.LIST,
        visible: true,
        order: 3,
      },
    ];

    return new LayoutConfiguration({
      name,
      orientation: LayoutOrientation.VERTICAL,
      blocks: defaultBlocks,
      responsive: true,
    });
  }

  /**
   * Get layout name
   */
  getName(): string {
    return this.props.name;
  }

  /**
   * Get layout description
   */
  getDescription(): string | undefined {
    return this.props.description;
  }

  /**
   * Get layout orientation
   */
  getOrientation(): LayoutOrientation {
    return this.props.orientation;
  }

  /**
   * Get all blocks in order
   */
  getBlocks(): ReadonlyArray<BlockConfiguration> {
    return [...this.props.blocks].sort((a, b) => a.order - b.order);
  }

  /**
   * Get visible blocks only
   */
  getVisibleBlocks(): ReadonlyArray<BlockConfiguration> {
    return this.getBlocks().filter((block) => block.visible);
  }

  /**
   * Get block by type
   */
  getBlockByType(type: LayoutBlockType): BlockConfiguration | undefined {
    return this.props.blocks.find((block) => block.type === type);
  }

  /**
   * Check if responsive layout is enabled
   */
  isResponsive(): boolean {
    return this.props.responsive;
  }

  /**
   * Get theme name
   */
  getTheme(): string | undefined {
    return this.props.theme;
  }

  /**
   * Get custom CSS
   */
  getCustomCss(): string | undefined {
    return this.props.customCss;
  }

  /**
   * Create a new configuration with additional block
   */
  withBlock(block: BlockConfiguration): Result<LayoutConfiguration> {
    const existingBlock = this.props.blocks.find((b) => b.type === block.type);
    if (existingBlock) {
      return Result.fail<LayoutConfiguration>(
        `Block of type ${block.type} already exists`,
      );
    }

    const newBlocks = [...this.props.blocks, block];
    return LayoutConfiguration.create({
      ...this.props,
      blocks: newBlocks,
    });
  }

  /**
   * Create a new configuration with updated block
   */
  withUpdatedBlock(
    type: LayoutBlockType,
    updates: Partial<BlockConfiguration>,
  ): Result<LayoutConfiguration> {
    const blockIndex = this.props.blocks.findIndex((b) => b.type === type);
    if (blockIndex === -1) {
      return Result.fail<LayoutConfiguration>(
        `Block of type ${type} not found`,
      );
    }

    const newBlocks = [...this.props.blocks];
    newBlocks[blockIndex] = { ...newBlocks[blockIndex], ...updates };

    return LayoutConfiguration.create({
      ...this.props,
      blocks: newBlocks,
    });
  }

  /**
   * Create a new configuration without a specific block
   */
  withoutBlock(type: LayoutBlockType): Result<LayoutConfiguration> {
    const newBlocks = this.props.blocks.filter((b) => b.type !== type);

    if (newBlocks.length === 0) {
      return Result.fail<LayoutConfiguration>(
        "Cannot remove all blocks from layout",
      );
    }

    return LayoutConfiguration.create({
      ...this.props,
      blocks: newBlocks,
    });
  }

  /**
   * Create a new configuration with reordered blocks
   */
  withReorderedBlocks(
    typeOrderMap: Record<LayoutBlockType, number>,
  ): Result<LayoutConfiguration> {
    const newBlocks = this.props.blocks.map((block) => ({
      ...block,
      order: typeOrderMap[block.type] ?? block.order,
    }));

    return LayoutConfiguration.create({
      ...this.props,
      blocks: newBlocks,
    });
  }

  /**
   * Convert to serializable object
   */
  toObject(): LayoutConfigurationProps {
    return {
      name: this.props.name,
      description: this.props.description,
      orientation: this.props.orientation,
      blocks: this.props.blocks.map((block) => ({ ...block })),
      responsive: this.props.responsive,
      theme: this.props.theme,
      customCss: this.props.customCss,
    };
  }

  /**
   * Create from serialized object
   */
  static fromObject(obj: any): Result<LayoutConfiguration> {
    try {
      return LayoutConfiguration.create({
        name: obj.name,
        description: obj.description,
        orientation: obj.orientation,
        blocks: obj.blocks || [],
        responsive: obj.responsive,
        theme: obj.theme,
        customCss: obj.customCss,
      });
    } catch (error) {
      return Result.fail<LayoutConfiguration>(
        `Invalid layout configuration: ${error}`,
      );
    }
  }

  /**
   * Equality comparison
   */
  equals(other: LayoutConfiguration): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  /**
   * Create a copy with new properties
   */
  withProperties(
    updates: Partial<LayoutConfigurationProps>,
  ): Result<LayoutConfiguration> {
    return LayoutConfiguration.create({
      ...this.props,
      ...updates,
      blocks: [...(updates.blocks || this.props.blocks)], // Convert to mutable array
    });
  }

  /**
   * Validate configuration against business rules
   */
  validate(): string[] {
    const errors: string[] = [];

    // Ensure at least one visible block
    const visibleBlocks = this.props.blocks.filter((b) => b.visible);
    if (visibleBlocks.length === 0) {
      errors.push("Layout must have at least one visible block");
    }

    // Validate block-specific rules
    for (const block of this.props.blocks) {
      if (block.type === LayoutBlockType.PROPERTIES && block.properties) {
        if (block.properties.length === 0) {
          errors.push("Properties block must specify at least one property");
        }
      }

      if (block.maxItems !== undefined && block.maxItems < 1) {
        errors.push("Block maxItems must be at least 1");
      }
    }

    return errors;
  }

  /**
   * Check if configuration is valid
   */
  isValid(): boolean {
    return this.validate().length === 0;
  }
}
