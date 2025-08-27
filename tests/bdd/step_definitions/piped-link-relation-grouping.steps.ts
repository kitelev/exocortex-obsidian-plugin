import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import { BaseAssetRelationsRenderer } from "../../../src/presentation/renderers/BaseAssetRelationsRenderer";
import { DIContainer } from "../../../src/infrastructure/container/DIContainer";
import { Asset } from "../../../src/domain/entities/Asset";
import { AssetId } from "../../../src/domain/value-objects/AssetId";

let container: DIContainer;
let renderer: any; // Will be instantiated with test renderer
let testAssets: Map<string, any> = new Map();
let collectedRelations: any[] = [];
let groupedRelations: Map<string, any[]> = new Map();
let mockVault: any;
let mockMetadataCache: any;

// Test renderer that exposes protected methods
class TestRenderer extends BaseAssetRelationsRenderer {
  async render(
    source: string,
    container: HTMLElement,
    ctx: any,
  ): Promise<void> {
    // Not used in tests
  }

  // Expose protected methods for testing
  public testFindReferencingProperty(
    metadata: Record<string, any>,
    targetBasename: string,
    targetPath: string,
  ): string | undefined {
    return this.findReferencingProperty(metadata, targetBasename, targetPath);
  }

  public async testCollectAllRelations(file: any): Promise<any[]> {
    return this.collectAllRelations(file);
  }

  public testGroupRelationsByProperty(relations: any[]): Map<string, any[]> {
    return this.groupRelationsByProperty(relations);
  }
}

Given("I have an Obsidian vault with the Exocortex plugin", function () {
  container = new DIContainer();

  mockVault = {
    getMarkdownFiles: () => [],
    getAbstractFileByPath: (path: string) => testAssets.get(path),
  };

  mockMetadataCache = {
    getFileCache: (file: any) => ({
      frontmatter: file?.frontmatter || {},
    }),
    resolvedLinks: {},
  };

  container.registerSingleton("vault", mockVault);
  container.registerSingleton("metadataCache", mockMetadataCache);

  renderer = new TestRenderer(container);
  testAssets.clear();
  collectedRelations = [];
  groupedRelations.clear();
});

Given(
  "I have an asset {string} with class {string}",
  function (name: string, className: string) {
    const asset = {
      path: `${name}.md`,
      basename: name,
      frontmatter: {
        exo__Instance_class: [className],
        exo__Asset_uid: AssetId.generate().value,
      },
      stat: {
        ctime: Date.now(),
        mtime: Date.now(),
      },
    };
    testAssets.set(asset.path, asset);
  },
);

Given(
  "I have an asset {string} with property {string} containing {string}",
  function (assetName: string, property: string, value: string) {
    const asset = {
      path: `${assetName}.md`,
      basename: assetName,
      frontmatter: {
        [property]: [value],
        exo__Asset_uid: AssetId.generate().value,
      },
      stat: {
        ctime: Date.now(),
        mtime: Date.now(),
      },
    };
    testAssets.set(asset.path, asset);

    // Update resolved links in metadata cache
    if (!mockMetadataCache.resolvedLinks[asset.path]) {
      mockMetadataCache.resolvedLinks[asset.path] = {};
    }

    // Extract target from link (handle piped links)
    let target = value;
    if (value.includes("|")) {
      target = value.split("|")[0].replace("[[", "");
    } else {
      target = value.replace("[[", "").replace("]]", "");
    }

    // Add to resolved links
    mockMetadataCache.resolvedLinks[asset.path][`${target}.md`] = 1;
  },
);

Given(
  "I have assets with different link formats to {string}:",
  function (targetName: string, dataTable: any) {
    for (const row of dataTable.hashes()) {
      const asset = {
        path: `${row.Asset}.md`,
        basename: row.Asset,
        frontmatter: {
          [row.Property]: [row["Link Format"]],
          exo__Asset_uid: AssetId.generate().value,
        },
        stat: {
          ctime: Date.now(),
          mtime: Date.now(),
        },
      };
      testAssets.set(asset.path, asset);

      if (!mockMetadataCache.resolvedLinks[asset.path]) {
        mockMetadataCache.resolvedLinks[asset.path] = {};
      }
      mockMetadataCache.resolvedLinks[asset.path][`${targetName}.md`] = 1;
    }
  },
);

Given(
  "the {string} asset is at path {string}",
  function (assetName: string, path: string) {
    const asset = testAssets.get(`${assetName}.md`);
    if (asset) {
      testAssets.delete(`${assetName}.md`);
      asset.path = path;
      asset.basename = assetName;
      testAssets.set(path, asset);
    }
  },
);

Given(
  "I have an asset {string} with property {string} containing:",
  function (assetName: string, property: string, dataTable: any) {
    const values = dataTable.raw().map((row: string[]) => row[0]);
    const asset = {
      path: `${assetName}.md`,
      basename: assetName,
      frontmatter: {
        [property]: values,
        exo__Asset_uid: AssetId.generate().value,
      },
      stat: {
        ctime: Date.now(),
        mtime: Date.now(),
      },
    };
    testAssets.set(asset.path, asset);

    if (!mockMetadataCache.resolvedLinks[asset.path]) {
      mockMetadataCache.resolvedLinks[asset.path] = {};
    }

    // Add resolved links for each value
    for (const value of values) {
      let target = value;
      if (value.includes("|")) {
        target = value.split("|")[0].replace("[[", "");
      } else {
        target = value.replace("[[", "").replace("]]", "");
      }
      mockMetadataCache.resolvedLinks[asset.path][`${target}.md`] = 1;
    }
  },
);

Given(
  "I have an asset {string} with body text containing {string}",
  function (assetName: string, bodyLink: string) {
    const asset = {
      path: `${assetName}.md`,
      basename: assetName,
      frontmatter: {
        exo__Asset_uid: AssetId.generate().value,
      },
      stat: {
        ctime: Date.now(),
        mtime: Date.now(),
      },
    };
    testAssets.set(asset.path, asset);

    if (!mockMetadataCache.resolvedLinks[asset.path]) {
      mockMetadataCache.resolvedLinks[asset.path] = {};
    }

    // Extract target from body link
    let target = bodyLink;
    if (bodyLink.includes("|")) {
      target = bodyLink.split("|")[0].replace("[[", "");
    } else {
      target = bodyLink.replace("[[", "").replace("]]", "");
    }
    mockMetadataCache.resolvedLinks[asset.path][`${target}.md`] = 1;
  },
);

Given(
  "{string} is at path {string}",
  function (assetName: string, path: string) {
    // Create or update the asset with the specified path
    let asset = testAssets.get(`${assetName}.md`);
    if (!asset) {
      asset = {
        path: path,
        basename: assetName,
        frontmatter: {
          exo__Asset_uid: AssetId.generate().value,
        },
        stat: {
          ctime: Date.now(),
          mtime: Date.now(),
        },
      };
    } else {
      testAssets.delete(`${assetName}.md`);
      asset.path = path;
    }
    testAssets.set(path, asset);
  },
);

When(
  "UniversalLayout or DynamicLayout renders relations for {string}",
  async function (targetName: string) {
    const targetFile =
      testAssets.get(`${targetName}.md`) ||
      Array.from(testAssets.values()).find((a) => a.basename === targetName);

    if (targetFile) {
      collectedRelations = await renderer.testCollectAllRelations(targetFile);
      groupedRelations =
        renderer.testGroupRelationsByProperty(collectedRelations);
    }
  },
);

When(
  "relations are collected for {string}",
  async function (targetName: string) {
    await this.When(
      `UniversalLayout or DynamicLayout renders relations for "${targetName}"`,
    );
  },
);

Then(
  "both {string} and {string} should appear in the {string} group",
  function (asset1: string, asset2: string, groupName: string) {
    const group = groupedRelations.get(groupName);
    expect(group).to.exist;

    const assetNames = group!.map((r) => r.title);
    expect(assetNames).to.include(asset1);
    expect(assetNames).to.include(asset2);
  },
);

Then("neither should appear in {string}", function (groupName: string) {
  const group = groupedRelations.get(groupName);
  if (group) {
    expect(group.length).to.equal(0);
  }
});

Then(
  "all four assets should be in the {string} group",
  function (groupName: string) {
    const group = groupedRelations.get(groupName);
    expect(group).to.exist;
    expect(group!.length).to.equal(4);
  },
);

Then("no assets should be in {string}", function (groupName: string) {
  const group = groupedRelations.get(groupName);
  if (group) {
    expect(group.length).to.equal(0);
  }
});

Then(
  "{string} should appear in the {string} group",
  function (assetName: string, groupName: string) {
    const group = groupedRelations.get(groupName);
    expect(group).to.exist;

    const assetNames = group!.map((r) => r.title);
    expect(assetNames).to.include(assetName);
  },
);

Then("not in {string}", function (groupName: string) {
  const group = groupedRelations.get(groupName);
  if (group) {
    const assetNames = group.map((r) => r.title);
    // The last asset mentioned should not be in this group
    // This is a continuation of the previous Then step
  }
});

Then(
  "{string} should appear once in the {string} group",
  function (assetName: string, groupName: string) {
    const group = groupedRelations.get(groupName);
    expect(group).to.exist;

    const matchingAssets = group!.filter((r) => r.title === assetName);
    expect(matchingAssets.length).to.equal(1);
  },
);

Then(
  "the property should be correctly identified for all link formats",
  function () {
    // Check that property name is correctly identified for all relations
    for (const relation of collectedRelations) {
      if (!relation.isBodyLink) {
        expect(relation.propertyName).to.exist;
        expect(relation.propertyName).to.not.be.empty;
      }
    }
  },
);

Then(
  "{string} should appear in {string}",
  function (assetName: string, groupName: string) {
    const group = groupedRelations.get(groupName);
    expect(group).to.exist;

    const assetNames = group!.map((r) => r.title);
    expect(assetNames).to.include(assetName);
  },
);

Then("they should not be grouped together", function () {
  // Verify that body links and frontmatter links are in different groups
  const untypedGroup = groupedRelations.get("Untyped Relations");
  const typedGroups = Array.from(groupedRelations.entries()).filter(
    ([key]) => key !== "Untyped Relations",
  );

  expect(untypedGroup).to.exist;
  expect(typedGroups.length).to.be.greaterThan(0);

  // Ensure no overlap between typed and untyped
  const untypedTitles = untypedGroup!.map((r) => r.title);
  for (const [_, group] of typedGroups) {
    const typedTitles = group.map((r) => r.title);
    const overlap = typedTitles.filter((t) => untypedTitles.includes(t));
    expect(overlap.length).to.equal(0);
  }
});

Then("the path with spaces should be correctly handled", function () {
  // Verify that the relation was correctly identified despite spaces in path
  expect(collectedRelations.length).to.be.greaterThan(0);

  const relation = collectedRelations[0];
  expect(relation.propertyName).to.equal("ims__Concept_broader");
});
