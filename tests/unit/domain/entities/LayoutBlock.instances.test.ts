import {
  LayoutBlock,
  DynamicBacklinksBlockConfig,
} from "../../../../src/domain/entities/LayoutBlock";

describe("LayoutBlock - Dynamic Backlinks Block", () => {
  describe("create with dynamic-backlinks block type", () => {
    it("should create a valid dynamic-backlinks block", () => {
      const config: DynamicBacklinksBlockConfig = {
        type: "dynamic-backlinks",
        excludeProperties: ["exo__Asset_id", "exo__Instance_class"],
        maxResultsPerProperty: 100,
        showEmptyProperties: false,
      };

      const result = LayoutBlock.create({
        id: "dynamic-backlinks-block-001",
        type: "dynamic-backlinks",
        title: "Dynamic Property Backlinks",
        order: 1,
        config: config,
        isVisible: true,
        isCollapsible: true,
      });

      expect(result.isSuccess).toBe(true);

      const block = result.getValue();
      expect(block).toBeDefined();
      expect(block?.type).toBe("dynamic-backlinks");
      expect(block?.config.type).toBe("dynamic-backlinks");

      const dynamicConfig = block?.config as DynamicBacklinksBlockConfig;
      expect(dynamicConfig.excludeProperties).toEqual([
        "exo__Asset_id",
        "exo__Instance_class",
      ]);
      expect(dynamicConfig.maxResultsPerProperty).toBe(100);
      expect(dynamicConfig.showEmptyProperties).toBe(false);
    });

    it("should create dynamic-backlinks block with minimal config", () => {
      const config: DynamicBacklinksBlockConfig = {
        type: "dynamic-backlinks",
      };

      const result = LayoutBlock.create({
        id: "dynamic-backlinks-block-002",
        type: "dynamic-backlinks",
        title: "Simple Dynamic Backlinks",
        order: 2,
        config: config,
        isVisible: true,
      });

      expect(result.isSuccess).toBe(true);

      const block = result.getValue();
      const dynamicConfig = block?.config as DynamicBacklinksBlockConfig;
      expect(dynamicConfig.excludeProperties).toBeUndefined();
      expect(dynamicConfig.maxResultsPerProperty).toBeUndefined();
      expect(dynamicConfig.showEmptyProperties).toBeUndefined();
    });

    it("should create dynamic-backlinks block with all optional properties", () => {
      const config: DynamicBacklinksBlockConfig = {
        type: "dynamic-backlinks",
        excludeProperties: ["custom__Property"],
        maxResultsPerProperty: 50,
        filterByClass: "CustomClass",
        showEmptyProperties: true,
      };

      const result = LayoutBlock.create({
        id: "dynamic-backlinks-block-003",
        type: "dynamic-backlinks",
        title: "Custom Dynamic Backlinks",
        order: 3,
        config: config,
        isVisible: true,
        isCollapsible: false,
      });

      expect(result.isSuccess).toBe(true);

      const block = result.getValue();
      const dynamicConfig = block?.config as DynamicBacklinksBlockConfig;
      expect(dynamicConfig.excludeProperties).toEqual(["custom__Property"]);
      expect(dynamicConfig.maxResultsPerProperty).toBe(50);
      expect(dynamicConfig.filterByClass).toBe("CustomClass");
      expect(dynamicConfig.showEmptyProperties).toBe(true);
    });

    it("should fail with unsupported block type", () => {
      const config: DynamicBacklinksBlockConfig = {
        type: "dynamic-backlinks",
      };

      const result = LayoutBlock.create({
        id: "unsupported-block-004",
        type: "dynamic-backlinks",
        title: "Valid Block",
        order: 4,
        config: { type: "query" } as any, // Wrong config type
        isVisible: true,
      });

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain(
        "Invalid configuration for block type",
      );
    });

    it("should update dynamic-backlinks block config", () => {
      const initialConfig: DynamicBacklinksBlockConfig = {
        type: "dynamic-backlinks",
        showEmptyProperties: false,
      };

      const blockResult = LayoutBlock.create({
        id: "dynamic-backlinks-block-005",
        type: "dynamic-backlinks",
        title: "Updateable Dynamic Backlinks",
        order: 5,
        config: initialConfig,
        isVisible: true,
      });

      expect(blockResult.isSuccess).toBe(true);

      const block = blockResult.getValue()!;

      const newConfig: DynamicBacklinksBlockConfig = {
        type: "dynamic-backlinks",
        excludeProperties: ["test__Property"],
        maxResultsPerProperty: 25,
        showEmptyProperties: true,
      };

      const updateResult = block.updateConfig(newConfig);
      expect(updateResult.isSuccess).toBe(true);

      const updatedConfig = block.config as DynamicBacklinksBlockConfig;
      expect(updatedConfig.excludeProperties).toEqual(["test__Property"]);
      expect(updatedConfig.maxResultsPerProperty).toBe(25);
      expect(updatedConfig.showEmptyProperties).toBe(true);
    });

    it("should validate config options", () => {
      const validConfigs = [
        { excludeProperties: ["prop1"] },
        { maxResultsPerProperty: 10 },
        { filterByClass: "TestClass" },
        { showEmptyProperties: true },
      ];

      validConfigs.forEach((configProps, index) => {
        const config: DynamicBacklinksBlockConfig = {
          type: "dynamic-backlinks",
          ...configProps,
        };

        const result = LayoutBlock.create({
          id: `dynamic-backlinks-block-${index}`,
          type: "dynamic-backlinks",
          title: `Config Test ${index}`,
          order: 1,
          config: config,
          isVisible: true,
        });

        expect(result.isSuccess).toBe(true);
      });
    });

    it("should handle block visibility and collapsibility", () => {
      const config: DynamicBacklinksBlockConfig = {
        type: "dynamic-backlinks",
        showEmptyProperties: false,
      };

      const result = LayoutBlock.create({
        id: "dynamic-backlinks-block-visibility",
        type: "dynamic-backlinks",
        title: "Collapsible Dynamic Backlinks",
        order: 1,
        config: config,
        isVisible: false,
        isCollapsible: true,
        isCollapsed: true,
      });

      expect(result.isSuccess).toBe(true);

      const block = result.getValue()!;
      expect(block.isVisible).toBe(false);
      expect(block.isCollapsible).toBe(true);
      expect(block.isCollapsed).toBe(true);

      // Test toggle methods
      block.show();
      expect(block.isVisible).toBe(true);

      block.expand();
      expect(block.isCollapsed).toBe(false);

      block.collapse();
      expect(block.isCollapsed).toBe(true);
    });
  });
});
