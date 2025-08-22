import { Result } from "../../domain/core/Result";
import { LayoutBlock, BlockConfig } from "../../domain/entities/LayoutBlock";
import {
  IBlockRenderStrategy,
  BlockRenderResult,
  RenderContext,
} from "../../domain/ports/IBlockRenderer";

export class BlockRenderingService {
  private strategies: Map<string, IBlockRenderStrategy> = new Map();

  constructor(strategies: IBlockRenderStrategy[] = []) {
    this.registerStrategies(strategies);
  }

  registerStrategy(strategy: IBlockRenderStrategy): void {
    // Find all block types this strategy can handle
    const blockTypes = [
      "query",
      "properties",
      "backlinks",
      "children-efforts",
      "narrower",
      "buttons",
      "custom",
    ];
    blockTypes.forEach((type) => {
      if (strategy.canHandle(type)) {
        this.strategies.set(type, strategy);
      }
    });
  }

  private registerStrategies(strategies: IBlockRenderStrategy[]): void {
    strategies.forEach((strategy) => this.registerStrategy(strategy));
  }

  async renderBlock(
    block: LayoutBlock,
    context: RenderContext,
  ): Promise<Result<BlockRenderResult>> {
    const startTime = performance.now();

    try {
      const strategy = this.strategies.get(block.type);

      if (!strategy) {
        return Result.fail(
          `No rendering strategy found for block type: ${block.type}`,
        );
      }

      const result = await strategy.render(context, block.config);

      if (result.isFailure) {
        return Result.fail(`Block rendering failed: ${result.error}`);
      }

      const blockResult = result.getValue();
      return Result.ok({
        ...blockResult,
        blockId: block.id,
        renderTime: performance.now() - startTime,
      });
    } catch (error) {
      return Result.fail(
        `Unexpected error rendering block ${block.id}: ${error}`,
      );
    }
  }

  getAvailableBlockTypes(): string[] {
    return Array.from(this.strategies.keys());
  }

  hasStrategyFor(blockType: string): boolean {
    return this.strategies.has(blockType);
  }
}
