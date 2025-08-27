import { loadFeature, defineFeature } from "jest-cucumber";
import { BDDWorld } from "./support/world";
import path from "path";

const feature = loadFeature(
  path.join(__dirname, "features/property-editing.feature"),
);

defineFeature(feature, (test) => {
  let world: BDDWorld;

  beforeEach(async () => {
    world = new BDDWorld({} as any);
    await world.initialize("Property Editing Test");
  });

  afterEach(async () => {
    await world.cleanup();
  });

  test("Inline editing of asset properties", ({ given, when, then, and }) => {
    given("the Exocortex plugin is loaded", () => {
      expect(world.container).toBeDefined();
      expect(world.propertyEditingUseCase).toBeDefined();
    });

    given(/^I have an existing asset "([^"]*)"$/, async (assetName) => {
      const asset = await world.testDataBuilder
        .asset(assetName)
        .withClass("ems__Project")
        .withProperty("priority", "medium")
        .withProperty("status", "active")
        .build();

      world.setState("currentAsset", asset);
      world.createdAssets.push(asset);

      // Create the file in vault
      await world.vaultAdapter.createFile(
        `${assetName}.md`,
        "---\nclass: ems__Project\npriority: medium\nstatus: active\n---\n",
      );
    });

    given("the asset has the following properties:", (table) => {
      const properties = table.reduce((acc: any, row: string[]) => {
        acc[row[0]] = row[1];
        return acc;
      }, {});

      const asset = world.getState("currentAsset");
      if (asset) {
        for (const [key, value] of Object.entries(properties)) {
          if (key !== "class") {
            asset.setProperty(key, value);
          }
        }
        world.setState("initialProperties", properties);
      }
    });

    given("I am viewing the asset page", () => {
      world.setState("viewingAsset", true);
      const asset = world.getState("currentAsset");
      expect(asset).toBeDefined();
    });

    given("the property renderer is active", () => {
      world.setState("propertyRenderer", true);
    });

    when(/^I click on the "([^"]*)" property$/, (propertyName) => {
      world.setState("clickedProperty", propertyName);
    });

    then("an inline editor should appear", () => {
      const clickedProperty = world.getState("clickedProperty");
      expect(clickedProperty).toBeDefined();
      world.setState("inlineEditor", true);
    });

    when(/^I change the value to "([^"]*)"$/, (newValue) => {
      world.setState("newValue", newValue);
    });

    when("I press Enter to confirm", async () => {
      const propertyName = world.getState("clickedProperty");
      const newValue = world.getState("newValue");
      const asset = world.getState("currentAsset");

      if (asset) {
        const result = asset.setProperty(propertyName, newValue);
        world.setState("lastResult", result);
      }
    });

    then(/^the property should be updated to "([^"]*)"$/, (expectedValue) => {
      const propertyName = world.getState("clickedProperty");
      const asset = world.getState("currentAsset");

      expect(asset.getPropertyValue(propertyName)).toBe(expectedValue);
    });

    and("the change should be persisted to frontmatter", () => {
      const assetName = world.getState("currentAsset").getTitle();
      const fileContent = world.vaultAdapter.getFileContent(`${assetName}.md`);

      if (fileContent) {
        expect(fileContent).toContain("---");
        const propertyName = world.getState("clickedProperty");
        const newValue = world.getState("newValue");
        expect(fileContent).toContain(`${propertyName}: ${newValue}`);
      }
    });
  });

  test("Batch property updates", ({ given, when, then, and }) => {
    given(/^I have (\d+) assets with similar properties$/, async (count) => {
      const assets = await world.testDataBuilder
        .asset("Batch Asset")
        .withClass("ems__Task")
        .withProperty("priority", "medium")
        .withProperty("status", "active")
        .buildMultiple(parseInt(count), (i) => `Batch Asset ${i + 1}`);

      world.setState("batchAssets", assets);
      world.createdAssets.push(...assets);
    });

    given("I select all assets", () => {
      const assets = world.getState("batchAssets");
      world.setState("selectedAssets", assets);
    });

    when("I update multiple properties:", async (table) => {
      const updates = table.reduce((acc: any, row: string[]) => {
        acc[row[0]] = row[1];
        return acc;
      }, {});

      world.setState("batchUpdates", updates);

      const assets = world.getState("selectedAssets");
      const results = [];

      for (const asset of assets) {
        const result = asset.updateProperties(updates);
        results.push(result);
      }

      world.setState("lastResult", { results, updatedCount: results.length });
    });

    then(/^all (\d+) assets should be updated$/, (expectedCount) => {
      const result = world.getState("lastResult");
      expect(result.updatedCount).toBe(parseInt(expectedCount));
    });

    and("the changes should be atomic across all assets", () => {
      const assets = world.getState("selectedAssets");
      if (assets.length > 1) {
        const firstTimestamp = assets[0].getUpdatedAt();
        assets.forEach((asset: any) => {
          expect(asset.getUpdatedAt().getTime()).toBeCloseTo(
            firstTimestamp.getTime(),
            -2,
          );
        });
      }
    });

    and("individual asset histories should be preserved", () => {
      const assets = world.getState("selectedAssets");
      assets.forEach((asset: any) => {
        const events = asset.domainEvents || [];
        expect(events.length).toBeGreaterThan(0);
      });
    });
  });

  test("Property validation with error handling", ({
    given,
    when,
    then,
    and,
  }) => {
    given(/^I am editing the "([^"]*)" property$/, (propertyName) => {
      world.setState("currentProperty", propertyName);
      world.setState("editingMode", true);
    });

    given(/^I have an existing asset "([^"]*)"$/, async (assetName) => {
      const asset = await world.testDataBuilder
        .asset(assetName)
        .withClass("ems__Task")
        .withProperty("priority", "medium")
        .build();

      world.setState("currentAsset", asset);
    });

    when(/^I enter an invalid value "([^"]*)"$/, (invalidValue) => {
      world.setState("invalidValue", invalidValue);
    });

    when("I attempt to save the change", async () => {
      const asset = world.getState("currentAsset");
      const propertyName = world.getState("currentProperty");
      const invalidValue = world.getState("invalidValue");

      const result = asset.setProperty(propertyName, invalidValue);
      world.setState("lastResult", result);
    });

    then("the system should reject the invalid value", () => {
      const result = world.getState("lastResult");
      expect(result).toBeDefined();
      expect(result.isSuccess).toBe(false);
    });

    and("a validation error should be displayed", () => {
      const result = world.getState("lastResult");
      const error = result.getError();

      expect(error).toBeTruthy();
      expect(error).toMatch(/invalid|required|format/i);
    });

    and("the original value should be preserved", () => {
      const asset = world.getState("currentAsset");
      const propertyName = world.getState("currentProperty");
      const invalidValue = world.getState("invalidValue");

      expect(asset.getPropertyValue(propertyName)).not.toBe(invalidValue);
    });

    and("no changes should be persisted", () => {
      const asset = world.getState("currentAsset");
      const assetName = asset.getTitle();
      const fileContent = world.vaultAdapter.getFileContent(`${assetName}.md`);
      const invalidValue = world.getState("invalidValue");

      if (fileContent) {
        expect(fileContent).not.toContain(invalidValue);
      }
    });
  });

  test("Performance validation for property editing", ({
    given,
    when,
    then,
  }) => {
    given("I have an asset with many properties", () => {
      const properties: Record<string, any> = {};
      for (let i = 0; i < 50; i++) {
        properties[`property_${i}`] = `value_${i}`;
      }
      world.setState("manyProperties", properties);
    });

    when("I initiate inline editing", () => {
      const startTime = world.startTiming();
      world.setState("editingMode", true);
      world.setState("editorStartTime", startTime);
    });

    then(/^the editor should appear within (\d+)ms$/, (maxTime) => {
      const startTime = world.getState("editorStartTime");
      const responseTime = world.endTiming(startTime);
      expect(responseTime).toBeLessThan(parseInt(maxTime));
    });
  });
});
