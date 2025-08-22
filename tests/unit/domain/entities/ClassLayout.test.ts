import {
  ClassLayout,
  LayoutBlockConfig,
} from "../../../../src/domain/entities/ClassLayout";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";
import { ClassName } from "../../../../src/domain/value-objects/ClassName";
import { Result } from "../../../../src/domain/core/Result";

describe("ClassLayout", () => {
  let assetId: AssetId;
  let className: ClassName;
  let validBlockConfig: LayoutBlockConfig;

  beforeEach(() => {
    assetId = AssetId.generate();
    className = ClassName.create("TestClass").getValue();
    validBlockConfig = {
      id: "test-block-1",
      type: "query",
      title: "Test Block",
      order: 1,
      config: { query: "SELECT * WHERE { ?s ?p ?o }" },
      isVisible: true,
      isCollapsible: true,
      isCollapsed: false,
    };
  });

  describe("create", () => {
    it("should create ClassLayout with valid properties", () => {
      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [validBlockConfig],
        isEnabled: true,
        priority: 50,
      });

      expect(result.isSuccess).toBe(true);
      const layout = result.getValue();
      expect(layout.id).toBe(assetId);
      expect(layout.targetClass).toBe(className);
      expect(layout.blocks).toHaveLength(1);
      expect(layout.isEnabled).toBe(true);
      expect(layout.priority).toBe(50);
    });

    it("should fail when target class is null", () => {
      const result = ClassLayout.create({
        id: assetId,
        targetClass: null as any,
        blocks: [],
        isEnabled: true,
        priority: 50,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Target class is required");
    });

    it("should fail when target class is undefined", () => {
      const result = ClassLayout.create({
        id: assetId,
        targetClass: undefined as any,
        blocks: [],
        isEnabled: true,
        priority: 50,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Target class is required");
    });

    it("should fail when exceeding maximum block limit", () => {
      const blocks = Array.from({ length: 21 }, (_, i) => ({
        ...validBlockConfig,
        id: `block-${i}`,
        order: i,
      }));

      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Cannot have more than 20 blocks");
    });

    it("should accept maximum allowed blocks", () => {
      const blocks = Array.from({ length: 20 }, (_, i) => ({
        ...validBlockConfig,
        id: `block-${i}`,
        order: i,
      }));

      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().blocks).toHaveLength(20);
    });

    it("should fail when blocks have duplicate order values", () => {
      const blocks = [
        { ...validBlockConfig, id: "block-1", order: 1 },
        { ...validBlockConfig, id: "block-2", order: 1 },
      ];

      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Blocks cannot have duplicate order values");
    });

    it("should create with empty blocks array", () => {
      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [],
        isEnabled: true,
        priority: 50,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().blocks).toHaveLength(0);
    });

    it("should create with disabled layout", () => {
      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [validBlockConfig],
        isEnabled: false,
        priority: 0,
      });

      expect(result.isSuccess).toBe(true);
      const layout = result.getValue();
      expect(layout.isEnabled).toBe(false);
      expect(layout.priority).toBe(0);
    });
  });

  describe("addBlock", () => {
    let layout: ClassLayout;

    beforeEach(() => {
      layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [validBlockConfig],
        isEnabled: true,
        priority: 50,
      }).getValue();
    });

    it("should add valid block successfully", () => {
      const newBlock: LayoutBlockConfig = {
        id: "new-block",
        type: "properties",
        title: "Properties Block",
        order: 2,
        config: {},
        isVisible: true,
      };

      const result = layout.addBlock(newBlock);

      expect(result.isSuccess).toBe(true);
      expect(layout.blocks).toHaveLength(2);
      expect(layout.blocks.find((b) => b.id === "new-block")).toBeDefined();
    });

    it("should fail when adding block with duplicate ID", () => {
      const duplicateBlock: LayoutBlockConfig = {
        ...validBlockConfig,
        order: 2,
      };

      const result = layout.addBlock(duplicateBlock);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Block with this ID already exists");
    });

    it("should fail when adding block with duplicate order", () => {
      const duplicateOrderBlock: LayoutBlockConfig = {
        id: "new-block",
        type: "relations",
        title: "Relations Block",
        order: 1,
        config: {},
        isVisible: true,
      };

      const result = layout.addBlock(duplicateOrderBlock);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Block with order 1 already exists");
    });

    it("should fail when at maximum block capacity", () => {
      // Add 19 more blocks to reach the limit
      for (let i = 2; i <= 20; i++) {
        const block: LayoutBlockConfig = {
          id: `block-${i}`,
          type: "custom",
          title: `Block ${i}`,
          order: i,
          config: {},
          isVisible: true,
        };
        layout.addBlock(block);
      }

      const newBlock: LayoutBlockConfig = {
        id: "overflow-block",
        type: "backlinks",
        title: "Overflow Block",
        order: 21,
        config: {},
        isVisible: true,
      };

      const result = layout.addBlock(newBlock);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Cannot add more blocks. Maximum of 20 reached",
      );
    });

    it("should add blocks of all supported types", () => {
      const blockTypes: LayoutBlockConfig["type"][] = [
        "query",
        "properties",
        "relations",
        "backlinks",
        "custom",
      ];

      for (let i = 0; i < blockTypes.length; i++) {
        const block: LayoutBlockConfig = {
          id: `block-${blockTypes[i]}`,
          type: blockTypes[i],
          title: `${blockTypes[i]} Block`,
          order: i + 10,
          config: {},
          isVisible: true,
        };

        const result = layout.addBlock(block);
        expect(result.isSuccess).toBe(true);
      }

      expect(layout.blocks).toHaveLength(6); // original + 5 new
    });
  });

  describe("removeBlock", () => {
    let layout: ClassLayout;

    beforeEach(() => {
      const blocks = [
        { ...validBlockConfig, id: "block-1", order: 1 },
        { ...validBlockConfig, id: "block-2", order: 2 },
        { ...validBlockConfig, id: "block-3", order: 3 },
      ];

      layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      }).getValue();
    });

    it("should remove existing block successfully", () => {
      const result = layout.removeBlock("block-2");

      expect(result.isSuccess).toBe(true);
      expect(layout.blocks).toHaveLength(2);
      expect(layout.blocks.find((b) => b.id === "block-2")).toBeUndefined();
    });

    it("should fail when removing non-existent block", () => {
      const result = layout.removeBlock("non-existent");

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Block not found");
    });

    it("should remove first block", () => {
      const result = layout.removeBlock("block-1");

      expect(result.isSuccess).toBe(true);
      expect(layout.blocks).toHaveLength(2);
      expect(layout.blocks[0].id).toBe("block-2");
    });

    it("should remove last block", () => {
      const result = layout.removeBlock("block-3");

      expect(result.isSuccess).toBe(true);
      expect(layout.blocks).toHaveLength(2);
      expect(layout.blocks.find((b) => b.id === "block-3")).toBeUndefined();
    });

    it("should handle empty string block ID", () => {
      const result = layout.removeBlock("");

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Block not found");
    });
  });

  describe("updateBlock", () => {
    let layout: ClassLayout;

    beforeEach(() => {
      const blocks = [
        { ...validBlockConfig, id: "block-1", order: 1 },
        { ...validBlockConfig, id: "block-2", order: 2 },
      ];

      layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      }).getValue();
    });

    it("should update block properties successfully", () => {
      const updates = {
        title: "Updated Title",
        isVisible: false,
        config: { newProperty: "newValue" },
      };

      const result = layout.updateBlock("block-1", updates);

      expect(result.isSuccess).toBe(true);
      const updatedBlock = layout.blocks.find((b) => b.id === "block-1");
      expect(updatedBlock?.title).toBe("Updated Title");
      expect(updatedBlock?.isVisible).toBe(false);
      expect(updatedBlock?.config.newProperty).toBe("newValue");
    });

    it("should fail when updating non-existent block", () => {
      const result = layout.updateBlock("non-existent", { title: "New Title" });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Block not found");
    });

    it("should update block order when valid", () => {
      const result = layout.updateBlock("block-1", { order: 5 });

      expect(result.isSuccess).toBe(true);
      const updatedBlock = layout.blocks.find((b) => b.id === "block-1");
      expect(updatedBlock?.order).toBe(5);
    });

    it("should fail when updating to duplicate order", () => {
      const result = layout.updateBlock("block-1", { order: 2 });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Block with order 2 already exists");
    });

    it("should allow updating order to same value", () => {
      const result = layout.updateBlock("block-1", { order: 1 });

      expect(result.isSuccess).toBe(true);
      const updatedBlock = layout.blocks.find((b) => b.id === "block-1");
      expect(updatedBlock?.order).toBe(1);
    });

    it("should update multiple properties at once", () => {
      const updates = {
        title: "Multi Update",
        type: "relations" as const,
        isVisible: false,
        isCollapsible: false,
        order: 10,
      };

      const result = layout.updateBlock("block-2", updates);

      expect(result.isSuccess).toBe(true);
      const updatedBlock = layout.blocks.find((b) => b.id === "block-2");
      expect(updatedBlock?.title).toBe("Multi Update");
      expect(updatedBlock?.type).toBe("relations");
      expect(updatedBlock?.isVisible).toBe(false);
      expect(updatedBlock?.isCollapsible).toBe(false);
      expect(updatedBlock?.order).toBe(10);
    });
  });

  describe("getVisibleBlocks", () => {
    it("should return only visible blocks", () => {
      const blocks = [
        { ...validBlockConfig, id: "visible-1", order: 1, isVisible: true },
        { ...validBlockConfig, id: "hidden-1", order: 2, isVisible: false },
        { ...validBlockConfig, id: "visible-2", order: 3, isVisible: true },
      ];

      const layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      }).getValue();

      const visibleBlocks = layout.getVisibleBlocks();

      expect(visibleBlocks).toHaveLength(2);
      expect(visibleBlocks.map((b) => b.id)).toEqual([
        "visible-1",
        "visible-2",
      ]);
    });

    it("should return empty array when no visible blocks", () => {
      const blocks = [
        { ...validBlockConfig, id: "hidden-1", order: 1, isVisible: false },
        { ...validBlockConfig, id: "hidden-2", order: 2, isVisible: false },
      ];

      const layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      }).getValue();

      const visibleBlocks = layout.getVisibleBlocks();

      expect(visibleBlocks).toHaveLength(0);
    });

    it("should return blocks in correct order", () => {
      const blocks = [
        { ...validBlockConfig, id: "block-3", order: 3, isVisible: true },
        { ...validBlockConfig, id: "block-1", order: 1, isVisible: true },
        { ...validBlockConfig, id: "block-2", order: 2, isVisible: true },
      ];

      const layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      }).getValue();

      const visibleBlocks = layout.getVisibleBlocks();

      expect(visibleBlocks.map((b) => b.id)).toEqual([
        "block-1",
        "block-2",
        "block-3",
      ]);
    });
  });

  describe("blocks getter", () => {
    it("should return blocks sorted by order", () => {
      const blocks = [
        { ...validBlockConfig, id: "block-5", order: 5 },
        { ...validBlockConfig, id: "block-1", order: 1 },
        { ...validBlockConfig, id: "block-3", order: 3 },
      ];

      const layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks,
        isEnabled: true,
        priority: 50,
      }).getValue();

      const sortedBlocks = layout.blocks;

      expect(sortedBlocks.map((b) => b.id)).toEqual([
        "block-1",
        "block-3",
        "block-5",
      ]);
    });

    it("should return a copy of blocks array", () => {
      const layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [validBlockConfig],
        isEnabled: true,
        priority: 50,
      }).getValue();

      const blocks1 = layout.blocks;
      const blocks2 = layout.blocks;

      expect(blocks1).not.toBe(blocks2);
      expect(blocks1).toEqual(blocks2);
    });
  });

  describe("enable and disable", () => {
    let layout: ClassLayout;

    beforeEach(() => {
      layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [validBlockConfig],
        isEnabled: false,
        priority: 50,
      }).getValue();
    });

    it("should enable disabled layout", () => {
      expect(layout.isEnabled).toBe(false);

      layout.enable();

      expect(layout.isEnabled).toBe(true);
    });

    it("should disable enabled layout", () => {
      layout.enable();
      expect(layout.isEnabled).toBe(true);

      layout.disable();

      expect(layout.isEnabled).toBe(false);
    });

    it("should handle multiple enable calls", () => {
      layout.enable();
      layout.enable();

      expect(layout.isEnabled).toBe(true);
    });

    it("should handle multiple disable calls", () => {
      layout.enable();
      layout.disable();
      layout.disable();

      expect(layout.isEnabled).toBe(false);
    });
  });

  describe("property getters", () => {
    let layout: ClassLayout;

    beforeEach(() => {
      layout = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [validBlockConfig],
        isEnabled: true,
        priority: 75,
      }).getValue();
    });

    it("should return correct id", () => {
      expect(layout.id).toBe(assetId);
    });

    it("should return correct targetClass", () => {
      expect(layout.targetClass).toBe(className);
    });

    it("should return correct priority", () => {
      expect(layout.priority).toBe(75);
    });

    it("should return correct enabled state", () => {
      expect(layout.isEnabled).toBe(true);
    });
  });

  describe("edge cases and boundary conditions", () => {
    it("should handle zero priority", () => {
      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [],
        isEnabled: true,
        priority: 0,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().priority).toBe(0);
    });

    it("should handle negative order values", () => {
      const blockWithNegativeOrder: LayoutBlockConfig = {
        id: "negative-order",
        type: "query",
        title: "Negative Order Block",
        order: -1,
        config: {},
        isVisible: true,
      };

      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [blockWithNegativeOrder],
        isEnabled: true,
        priority: 50,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().blocks[0].order).toBe(-1);
    });

    it("should handle blocks with complex config objects", () => {
      const complexBlock: LayoutBlockConfig = {
        id: "complex-block",
        type: "custom",
        title: "Complex Block",
        order: 1,
        config: {
          nested: {
            property: "value",
            array: [1, 2, 3],
            boolean: true,
          },
          query: "SELECT ?s WHERE { ?s ?p ?o }",
          filters: ["filter1", "filter2"],
        },
        isVisible: true,
        isCollapsible: true,
        isCollapsed: false,
      };

      const result = ClassLayout.create({
        id: assetId,
        targetClass: className,
        blocks: [complexBlock],
        isEnabled: true,
        priority: 50,
      });

      expect(result.isSuccess).toBe(true);
      const layout = result.getValue();
      expect(layout.blocks[0].config).toEqual(complexBlock.config);
    });
  });
});
