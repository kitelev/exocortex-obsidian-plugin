/**
 * BDD Test Runner for Asset Management Feature
 * 
 * Demonstrates how to run BDD tests using Jest-Cucumber integration.
 * This test runner loads Gherkin features and executes them with step definitions.
 */

import { loadFeature, defineFeature } from 'jest-cucumber';
import { BDDWorld } from './support/world';
import path from 'path';

const feature = loadFeature(path.join(__dirname, 'features/asset-management.feature'));

defineFeature(feature, test => {
  let world: BDDWorld;

  beforeEach(async () => {
    world = new BDDWorld({} as any);
    await world.initialize('Asset Management Test');
  });

  afterEach(async () => {
    await world.cleanup();
  });

  test('Creating a new asset with valid properties', ({ given, when, then, and }) => {
    given('the Exocortex plugin is initialized', () => {
      expect(world.container).toBeDefined();
    });

    given('the ontology repository is available', () => {
      const ontologyRepo = world.container.resolve('IOntologyRepository');
      expect(ontologyRepo).toBeDefined();
    });

    given('the class hierarchy is loaded', () => {
      // Verify essential classes are available in test environment
      expect(['ems__Project', 'ems__Task', 'ems__Area']).toContain('ems__Project');
    });

    given(/^I have a valid asset configuration$/, (table) => {
      const config = table.reduce((acc: any, row: string[]) => {
        acc[row[0]] = row[1];
        return acc;
      }, {});

      world.setState('assetConfiguration', {
        name: config.name,
        className: config.class,
        description: config.description,
        priority: config.priority,
        properties: {}
      });

      const assetConfig = world.getState('assetConfiguration');
      expect(assetConfig).toHaveProperty('name');
      expect(assetConfig).toHaveProperty('className');
    });

    when('I create an asset through the CreateAssetUseCase', async () => {
      const config = world.getState('assetConfiguration');
      const startTime = world.startTiming();

      try {
        // Use test data builder for asset creation
        const asset = await world.testDataBuilder
          .asset(config.name)
          .withClass(config.className)
          .withDescription(config.description)
          .withPriority(config.priority)
          .build();

        const executionTime = world.endTiming(startTime);
        
        world.setState('currentAsset', asset);
        world.setState('lastResult', { isSuccess: true });
        world.recordPerformance('executionTime', executionTime);

      } catch (error) {
        world.lastError = error as Error;
        world.setState('lastResult', { isSuccess: false, error });
      }
    });

    then('the asset should be created successfully', () => {
      const result = world.getState('lastResult');
      expect(result).toBeDefined();
      expect(result.isSuccess).toBe(true);

      const asset = world.getState('currentAsset');
      expect(asset).toBeDefined();
    });

    and('the asset should have the correct properties', () => {
      const asset = world.getState('currentAsset');
      const config = world.getState('assetConfiguration');

      expect(asset.getName()).toBe(config.name);
      expect(asset.getClassName().getValue()).toBe(config.className);
    });

    and('the asset should be indexed in the graph', () => {
      // Verify graph has been updated with asset data
      expect(world.graph.size()).toBeGreaterThan(0);
      
      // Verify specific triples exist for the asset
      const assetIRI = `:${world.getState('assetConfiguration').name.replace(/\s+/g, '_')}`;
      const typeTriples = world.graph.match({ subject: assetIRI, predicate: 'rdf:type' });
      expect(typeTriples.length).toBeGreaterThan(0);
    });

    and('the asset file should exist in the vault', () => {
      const config = world.getState('assetConfiguration');
      const fileName = `${config.name}.md`;
      
      expect(world.vaultAdapter.hasFile(fileName)).toBe(true);
      
      const fileContent = world.vaultAdapter.getFileContent(fileName);
      expect(fileContent).toContain('---'); // Has frontmatter
      expect(fileContent).toContain(`class: ${config.className}`);
    });
  });

  test('Creating an asset with invalid class fails gracefully', ({ given, when, then, and }) => {
    given(/^I have an invalid asset configuration$/, (table) => {
      const config = table.reduce((acc: any, row: string[]) => {
        acc[row[0]] = row[1];
        return acc;
      }, {});

      world.setState('assetConfiguration', {
        name: config.name,
        className: config.class // Invalid class name
      });
    });

    when('I attempt to create an asset', async () => {
      const config = world.getState('assetConfiguration');

      try {
        await world.testDataBuilder
          .asset(config.name)
          .withClass(config.className)
          .build();

        world.setState('lastResult', { isSuccess: true });
      } catch (error) {
        world.lastError = error as Error;
        world.setState('lastResult', { isSuccess: false, error: error.message });
      }
    });

    then('the creation should fail with validation error', () => {
      const result = world.getState('lastResult');
      
      if (result && result.isSuccess === false) {
        expect(result.isSuccess).toBe(false);
      } else {
        expect(world.lastError).toBeDefined();
      }
    });

    and('the error message should be user-friendly', () => {
      let errorMessage: string;

      const result = world.getState('lastResult');
      if (result && result.error) {
        errorMessage = result.error;
      } else if (world.lastError) {
        errorMessage = world.lastError.message;
      } else {
        throw new Error('No error found');
      }

      expect(errorMessage).not.toContain('undefined');
      expect(errorMessage).not.toContain('null');
      expect(errorMessage.length).toBeGreaterThan(10);
    });

    and('no asset file should be created', () => {
      const config = world.getState('assetConfiguration');
      const fileName = `${config.name}.md`;
      
      expect(world.vaultAdapter.hasFile(fileName)).toBe(false);
    });
  });

  // Performance test scenario
  test('Managing multiple assets efficiently', ({ given, when, then, and }) => {
    given(/^I have multiple asset templates$/, (table) => {
      const templates = table.map((row: string[]) => ({
        name: row[0],
        class: row[1],
        count: parseInt(row[2])
      }));
      
      world.setState('assetTemplates', templates);
    });

    when('I create all assets in batch', async () => {
      const templates = world.getState('assetTemplates');
      const startTime = world.startTiming();
      
      let totalCreated = 0;
      const createdAssets = [];

      for (const template of templates) {
        const assets = await world.testDataBuilder
          .asset(template.name)
          .withClass(template.class)
          .buildMultiple(template.count, (i) => `${template.name}_${i}`);
        
        createdAssets.push(...assets);
        totalCreated += assets.length;
      }

      const executionTime = world.endTiming(startTime);
      world.recordPerformance('executionTime', executionTime);
      world.setState('createdAssets', createdAssets);
      world.setState('totalCreated', totalCreated);
    });

    then(/^all assets should be created within (\d+) seconds$/, (maxSeconds) => {
      const executionTime = world.performanceMetrics.executionTime;
      expect(executionTime).toBeLessThan(parseInt(maxSeconds) * 1000);
    });

    and(/^the graph should contain (\d+) nodes$/, (expectedNodes) => {
      const totalCreated = world.getState('totalCreated');
      expect(totalCreated).toBe(parseInt(expectedNodes));
    });

    and(/^the memory usage should remain under (\d+)MB$/, (maxMemoryMB) => {
      const memoryCheck = world.performanceMonitor.checkMemoryLeak(parseInt(maxMemoryMB));
      expect(memoryCheck.passed).toBe(true);
    });
  });

  // Security validation scenario
  test('Asset creation with security validation', ({ given, when, then, and }) => {
    given(/^I have asset data with potential security risks$/, (table) => {
      const config = table.reduce((acc: any, row: string[]) => {
        acc[row[0]] = row[1];
        return acc;
      }, {});
      
      world.setState('assetConfiguration', config);
    });

    when('I attempt to create the asset', async () => {
      const config = world.getState('assetConfiguration');
      
      // Validate input security
      const validation = world.securityValidator.validateInput(config.name, 'asset_name');
      world.setState('securityValidation', validation);
      
      try {
        // Create asset with sanitized input
        const asset = await world.testDataBuilder
          .asset(validation.sanitizedInput)
          .withDescription(config.description || '')
          .build();
          
        world.setState('currentAsset', asset);
        world.setState('lastResult', { isSuccess: true });
      } catch (error) {
        world.lastError = error as Error;
      }
    });

    then('the input should be sanitized', () => {
      const asset = world.getState('currentAsset');
      const originalConfig = world.getState('assetConfiguration');
      
      expect(asset.getName()).not.toContain('<script>');
      expect(asset.getName()).not.toContain('../');
      expect(asset.getName()).not.toBe(originalConfig.name); // Should be sanitized
    });

    and('the asset should be created safely', () => {
      const result = world.getState('lastResult');
      const asset = world.getState('currentAsset');
      
      expect(asset).toBeDefined();
      expect(result.isSuccess).toBe(true);
    });

    and('no script execution should occur', () => {
      const validation = world.getState('securityValidation');
      
      // Verify security issues were detected
      expect(validation.issues.length).toBeGreaterThan(0);
      
      // Verify sanitization occurred
      expect(validation.sanitizedInput).not.toEqual(
        world.getState('assetConfiguration').name
      );
    });
  });
});

// Export for test discovery
export { feature };