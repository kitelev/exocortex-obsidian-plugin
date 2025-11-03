import type { MarkdownPostProcessorContext, App, Vault, MetadataCache } from "obsidian";
import { SPARQLCodeBlockProcessor } from "../../../../src/application/processors/SPARQLCodeBlockProcessor";
import type ExocortexPlugin from "../../../../src/ExocortexPlugin";

describe("SPARQLCodeBlockProcessor", () => {
  let processor: SPARQLCodeBlockProcessor;
  let mockPlugin: ExocortexPlugin;

  beforeEach(() => {
    mockPlugin = {
      app: {
        vault: {} as Vault,
        metadataCache: {} as MetadataCache,
      } as App,
    } as ExocortexPlugin;

    processor = new SPARQLCodeBlockProcessor(mockPlugin);
  });

  it("should be instantiable", () => {
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(SPARQLCodeBlockProcessor);
  });

  it("should have a process method", () => {
    expect(typeof processor.process).toBe("function");
  });
});
