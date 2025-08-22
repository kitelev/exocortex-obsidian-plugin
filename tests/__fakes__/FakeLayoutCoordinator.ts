import { Result } from "../../src/domain/core/Result";
import { ClassLayout } from "../../src/domain/entities/ClassLayout";
import {
  ILayoutCoordinator,
  LayoutRenderResult,
} from "../../src/domain/ports/ILayoutCoordinator";
import {
  RenderContext,
  BlockRenderResult,
} from "../../src/domain/ports/IBlockRenderer";

export class FakeLayoutCoordinator implements ILayoutCoordinator {
  private rendered: Array<{
    layout: ClassLayout | null;
    context: RenderContext;
  }> = [];
  private shouldFailLayout: boolean = false;
  private shouldFailDefault: boolean = false;
  private customResult: LayoutRenderResult | null = null;

  // Configuration methods for test setup
  public setLayoutRenderingFailure(shouldFail: boolean): void {
    this.shouldFailLayout = shouldFail;
  }

  public setDefaultRenderingFailure(shouldFail: boolean): void {
    this.shouldFailDefault = shouldFail;
  }

  public setCustomResult(result: LayoutRenderResult): void {
    this.customResult = result;
  }

  // Test inspection methods
  public getRenderedLayouts(): Array<{
    layout: ClassLayout | null;
    context: RenderContext;
  }> {
    return [...this.rendered];
  }

  public getLastRenderContext(): RenderContext | null {
    return this.rendered.length > 0
      ? this.rendered[this.rendered.length - 1].context
      : null;
  }

  public wasLayoutRendered(layoutId: string): boolean {
    return this.rendered.some((r) => r.layout?.id.toString() === layoutId);
  }

  public wasDefaultLayoutRendered(): boolean {
    return this.rendered.some((r) => r.layout === null);
  }

  public clear(): void {
    this.rendered = [];
    this.shouldFailLayout = false;
    this.shouldFailDefault = false;
    this.customResult = null;
  }

  // ILayoutCoordinator implementation
  async coordinateLayout(
    layout: ClassLayout,
    context: RenderContext,
  ): Promise<Result<LayoutRenderResult>> {
    this.rendered.push({ layout, context });

    if (this.shouldFailLayout) {
      return Result.fail("Fake layout rendering failure");
    }

    if (this.customResult) {
      return Result.ok(this.customResult);
    }

    // Create a successful result
    const blockResults: BlockRenderResult[] = layout
      .getVisibleBlocks()
      .map((block) => ({
        blockId: block.id,
        renderTime: 10,
        success: true,
      }));

    const result: LayoutRenderResult = {
      layoutId: layout.id.toString(),
      blocksRendered: blockResults,
      totalRenderTime: blockResults.length * 10,
      fallbackUsed: false,
    };

    return Result.ok(result);
  }

  async coordinateDefaultLayout(
    context: RenderContext,
  ): Promise<Result<LayoutRenderResult>> {
    this.rendered.push({ layout: null, context });

    if (this.shouldFailDefault) {
      return Result.fail("Fake default layout rendering failure");
    }

    if (this.customResult) {
      return Result.ok(this.customResult);
    }

    // Create a successful default result
    const blockResults: BlockRenderResult[] = [
      { blockId: "default-properties", renderTime: 5, success: true },
      { blockId: "default-children-efforts", renderTime: 8, success: true },
      { blockId: "default-backlinks", renderTime: 12, success: true },
    ];

    const result: LayoutRenderResult = {
      layoutId: "default",
      blocksRendered: blockResults,
      totalRenderTime: 25,
      fallbackUsed: true,
    };

    return Result.ok(result);
  }
}
