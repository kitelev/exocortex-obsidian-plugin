import { Result } from "../../src/domain/core/Result";
import { LayoutBlock } from "../../src/domain/entities/LayoutBlock";
import {
  RenderContext,
  BlockRenderResult,
  IBlockRenderStrategy,
} from "../../src/domain/ports/IBlockRenderer";
import { BlockRenderingService } from "../../src/application/services/BlockRenderingService";

export class FakeBlockRenderStrategy implements IBlockRenderStrategy {
  private supportedTypes: Set<string> = new Set();
  private shouldFail: boolean = false;
  private customResult: BlockRenderResult | null = null;

  constructor(supportedTypes: string[] = []) {
    this.supportedTypes = new Set(supportedTypes);
  }

  // Configuration methods
  setSupportedTypes(types: string[]): void {
    this.supportedTypes = new Set(types);
  }

  setRenderingFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setCustomResult(result: BlockRenderResult): void {
    this.customResult = result;
  }

  // IBlockRenderStrategy implementation
  canHandle(blockType: string): boolean {
    return this.supportedTypes.has(blockType);
  }

  async render(
    context: RenderContext,
    config: any,
  ): Promise<Result<BlockRenderResult>> {
    if (this.shouldFail) {
      return Result.fail("Fake block rendering failure");
    }

    if (this.customResult) {
      return Result.ok(this.customResult);
    }

    return Result.ok({
      blockId: `fake-${config.type}`,
      renderTime: 5,
      success: true,
    });
  }
}

export class FakeBlockRenderingService extends BlockRenderingService {
  private renderedBlocks: Array<{
    block: LayoutBlock;
    context: RenderContext;
  }> = [];
  private shouldFailForBlockType: Set<string> = new Set();
  private customResults: Map<string, BlockRenderResult> = new Map();

  constructor() {
    super([]);
    // Register fake strategies for all block types
    this.registerFakeStrategies();
  }

  private registerFakeStrategies(): void {
    const allBlockTypes = [
      "query",
      "properties",
      "backlinks",
      "children-efforts",
      "narrower",
      "buttons",
      "custom",
    ];
    allBlockTypes.forEach((type) => {
      const strategy = new FakeBlockRenderStrategy([type]);
      this.registerStrategy(strategy);
    });
  }

  // Override to track calls
  async renderBlock(
    block: LayoutBlock,
    context: RenderContext,
  ): Promise<Result<BlockRenderResult>> {
    this.renderedBlocks.push({ block, context });

    if (this.shouldFailForBlockType.has(block.type)) {
      return Result.fail(`Fake failure for block type: ${block.type}`);
    }

    const customResult = this.customResults.get(block.id);
    if (customResult) {
      return Result.ok(customResult);
    }

    return Result.ok({
      blockId: block.id,
      renderTime: 10,
      success: true,
    });
  }

  // Test configuration methods
  setFailureForBlockType(blockType: string, shouldFail: boolean = true): void {
    if (shouldFail) {
      this.shouldFailForBlockType.add(blockType);
    } else {
      this.shouldFailForBlockType.delete(blockType);
    }
  }

  setCustomResultForBlock(blockId: string, result: BlockRenderResult): void {
    this.customResults.set(blockId, result);
  }

  // Test inspection methods
  getRenderedBlocks(): Array<{ block: LayoutBlock; context: RenderContext }> {
    return [...this.renderedBlocks];
  }

  wasBlockRendered(blockId: string): boolean {
    return this.renderedBlocks.some((r) => r.block.id === blockId);
  }

  getBlockRenderCount(blockId: string): number {
    return this.renderedBlocks.filter((r) => r.block.id === blockId).length;
  }

  clear(): void {
    this.renderedBlocks = [];
    this.shouldFailForBlockType.clear();
    this.customResults.clear();
  }
}
