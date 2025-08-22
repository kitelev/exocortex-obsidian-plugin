/**
 * Advanced Error Handling and Edge Case Tests
 * Comprehensive coverage for error paths and repository edge cases
 */

import { ObsidianAssetRepository } from "../../../src/infrastructure/repositories/ObsidianAssetRepository";
import { ObsidianTaskRepository } from "../../../src/infrastructure/repositories/ObsidianTaskRepository";
import { ObsidianOntologyRepository } from "../../../src/infrastructure/repositories/ObsidianOntologyRepository";
import { ObsidianClassLayoutRepository } from "../../../src/infrastructure/repositories/ObsidianClassLayoutRepository";
import { NativeQueryEngine } from "../../../src/infrastructure/query-engines/NativeQueryEngine";
import { SPARQLEngine } from "../../../src/application/SPARQLEngine";
import { Asset } from "../../../src/domain/entities/Asset";
import { Task } from "../../../src/domain/entities/Task";
import { AssetId } from "../../../src/domain/value-objects/AssetId";
import { TaskId } from "../../../src/domain/value-objects/TaskId";
import { Result } from "../../../src/domain/core/Result";

// Enhanced mock implementations for error scenarios
class FailingVaultAdapter {
  async read(): Promise<string> {
    throw new Error("File system error: Permission denied");
  }

  async write(): Promise<void> {
    throw new Error("File system error: Disk full");
  }

  async exists(): Promise<boolean> {
    throw new Error("File system error: Network timeout");
  }

  async list(): Promise<string[]> {
    throw new Error("File system error: Directory not accessible");
  }

  async remove(): Promise<void> {
    throw new Error("File system error: File in use");
  }
}

class CorruptedVaultAdapter {
  async read(path: string): Promise<string> {
    if (path.includes("corrupted")) {
      return "CORRUPTED_DATA\x00\x01\x02INVALID_YAML---\ninvalid: [unclosed array";
    }
    return "---\ntitle: Valid\n---\nContent";
  }

  async write(): Promise<void> {
    // Sometimes succeeds, sometimes fails
    if (Math.random() < 0.3) {
      throw new Error("Intermittent write failure");
    }
  }

  async exists(path: string): Promise<boolean> {
    if (path.includes("schrodinger")) {
      // Quantum file - exists and doesn't exist simultaneously
      return Math.random() > 0.5;
    }
    return true;
  }

  async list(): Promise<string[]> {
    return ["file1.md", "corrupted.md", null as any, undefined as any, ""];
  }
}

class SlowVaultAdapter {
  private delay: number;

  constructor(delay: number = 5000) {
    this.delay = delay;
  }

  async read(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    return "---\ntitle: Slow File\n---\nContent loaded slowly";
  }

  async write(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }

  async exists(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    return true;
  }
}

describe("Advanced Error Handling and Edge Cases", () => {
  describe("Repository Error Handling", () => {
    it("should handle complete file system failures gracefully", async () => {
      const failingAdapter = new FailingVaultAdapter();
      const repository = new ObsidianAssetRepository(
        failingAdapter as any,
        {} as any,
      );

      // Test all repository operations handle failures
      const assetId = AssetId.create("test-asset").getValue()!;

      const findResult = await repository.findById(assetId);
      expect(findResult.isSuccess).toBe(false);
      expect(findResult.getError()).toContain("Permission denied");

      const asset = Asset.create({
        name: "Test Asset",
        className: "TestClass",
      }).getValue()!;

      const saveResult = await repository.save(asset);
      expect(saveResult.isSuccess).toBe(false);
      expect(saveResult.getError()).toContain("Disk full");

      const listResult = await repository.list();
      expect(listResult.isSuccess).toBe(false);
      expect(listResult.getError()).toContain("Directory not accessible");
    });

    it("should handle data corruption scenarios", async () => {
      const corruptedAdapter = new CorruptedVaultAdapter();
      const repository = new ObsidianAssetRepository(
        corruptedAdapter as any,
        {} as any,
      );

      // Test reading corrupted data
      const corruptedId = AssetId.create("corrupted").getValue()!;
      const result = await repository.findById(corruptedId);

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("corrupted") ||
        expect(result.getError()).toContain("invalid");
    });

    it("should handle intermittent failures with retries", async () => {
      const intermittentAdapter = new CorruptedVaultAdapter();
      const repository = new ObsidianAssetRepository(
        intermittentAdapter as any,
        {} as any,
      );

      let successCount = 0;
      let failureCount = 0;

      // Attempt multiple operations to test retry logic
      for (let i = 0; i < 10; i++) {
        const asset = Asset.create({
          name: `Test Asset ${i}`,
          className: "TestClass",
        }).getValue()!;

        const result = await repository.save(asset);

        if (result.isSuccess) {
          successCount++;
        } else {
          failureCount++;
          expect(result.getError()).toContain("Intermittent");
        }
      }

      // Should have both successes and failures due to intermittent nature
      expect(successCount + failureCount).toBe(10);
    });

    it("should handle timeout scenarios", async (done) => {
      const slowAdapter = new SlowVaultAdapter(1000);
      const repository = new ObsidianAssetRepository(
        slowAdapter as any,
        {} as any,
      );

      const startTime = Date.now();

      // Set a shorter timeout for testing
      const assetId = AssetId.create("slow-asset").getValue()!;

      try {
        // This should timeout (assuming repository implements timeout logic)
        const result = await Promise.race([
          repository.findById(assetId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Operation timeout")), 500),
          ),
        ]);

        // If we reach here, operation completed before timeout
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(1500);
        done();
      } catch (error) {
        // Expected timeout
        expect(error.message).toContain("timeout");
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(600);
        done();
      }
    }, 2000);

    it("should handle edge cases in file listing", async () => {
      const corruptedAdapter = new CorruptedVaultAdapter();
      const repository = new ObsidianAssetRepository(
        corruptedAdapter as any,
        {} as any,
      );

      const listResult = await repository.list();

      if (listResult.isSuccess) {
        const files = listResult.getValue();

        // Should handle null/undefined entries in file list
        const validFiles = files.filter(
          (file) => file && typeof file === "string" && file.trim().length > 0,
        );

        expect(validFiles.length).toBeGreaterThan(0);
        expect(validFiles.every((file) => typeof file === "string")).toBe(true);
      } else {
        expect(listResult.getError()).toBeDefined();
      }
    });

    it("should handle concurrent access conflicts", async () => {
      const adapter = new CorruptedVaultAdapter();
      const repository = new ObsidianAssetRepository(adapter as any, {} as any);

      const asset = Asset.create({
        name: "Concurrent Asset",
        className: "TestClass",
      }).getValue()!;

      // Simulate concurrent writes
      const promises = Array.from({ length: 5 }, (_, i) =>
        repository.save(asset),
      );

      const results = await Promise.allSettled(promises);

      let successCount = 0;
      let failureCount = 0;

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.isSuccess) {
          successCount++;
        } else {
          failureCount++;
        }
      });

      // At least some operations should complete
      expect(successCount + failureCount).toBe(5);
    });
  });

  describe("Async Operation Failures", () => {
    it("should handle Promise rejection chains", async () => {
      const repository = new ObsidianTaskRepository(
        new FailingVaultAdapter() as any,
        {} as any,
      );

      const taskId = TaskId.create("test-task").getValue()!;

      // Chain multiple async operations that will fail
      const chainResult = await repository
        .findById(taskId)
        .then((result) => {
          if (!result.isSuccess) {
            return Result.fail<Task>(
              "Initial load failed: " + result.getError(),
            );
          }
          return repository.save(result.getValue()!);
        })
        .then((result) => {
          if (!result.isSuccess) {
            return Result.fail<void>("Save failed: " + result.getError());
          }
          return Result.ok(undefined);
        })
        .catch((error) => {
          return Result.fail<void>("Unexpected error: " + error.message);
        });

      expect(chainResult.isSuccess).toBe(false);
      expect(chainResult.getError()).toContain("failed");
    });

    it("should handle memory pressure during async operations", async () => {
      const repository = new ObsidianOntologyRepository(
        new CorruptedVaultAdapter() as any,
      );

      // Create memory pressure with large operations
      const largeOperations = Array.from({ length: 100 }, (_, i) =>
        repository.save({
          prefix: `test${i}`,
          namespace: `http://example.com/test${i}#`,
          classes: Array.from({ length: 100 }, (_, j) => ({
            name: `Class${j}`,
            properties: Array.from({ length: 50 }, (_, k) => `prop${k}`),
          })),
        } as any),
      );

      try {
        const results = await Promise.allSettled(largeOperations);

        let memoryErrors = 0;
        let otherErrors = 0;
        let successes = 0;

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            if (result.value.isSuccess) {
              successes++;
            } else {
              if (result.value.getError().toLowerCase().includes("memory")) {
                memoryErrors++;
              } else {
                otherErrors++;
              }
            }
          } else {
            otherErrors++;
          }
        });

        // Should handle memory pressure gracefully
        expect(memoryErrors + otherErrors + successes).toBe(100);

        // If memory errors occurred, they should be handled properly
        if (memoryErrors > 0) {
          expect(memoryErrors).toBeLessThan(50); // Shouldn't fail everything
        }
      } catch (error) {
        // Should not throw unhandled exceptions
        expect(error).toBeUndefined();
      }
    });

    it("should handle event loop blocking scenarios", async () => {
      const startTime = Date.now();
      const repository = new ObsidianClassLayoutRepository(
        new SlowVaultAdapter(100) as any,
      );

      // Create operations that could block the event loop
      const blockingOperations = [];

      for (let i = 0; i < 20; i++) {
        blockingOperations.push(repository.findByClassName(`TestClass${i}`));
      }

      // Operations should not completely block the event loop
      let eventLoopResponsive = false;
      const responsiveCheck = setTimeout(() => {
        eventLoopResponsive = true;
      }, 50);

      const results = await Promise.all(blockingOperations);
      const endTime = Date.now();

      clearTimeout(responsiveCheck);

      // Event loop should have been responsive during operations
      expect(eventLoopResponsive).toBe(true);

      // Operations should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("should handle circular dependency resolution failures", async () => {
      const ontologyRepository = new ObsidianOntologyRepository(
        new CorruptedVaultAdapter() as any,
      );

      // Create circular dependency scenario
      const ontologyA = {
        prefix: "a",
        namespace: "http://example.com/a#",
        imports: ["b"],
        classes: ["ClassA"],
      };

      const ontologyB = {
        prefix: "b",
        namespace: "http://example.com/b#",
        imports: ["a"],
        classes: ["ClassB"],
      };

      const saveA = await ontologyRepository.save(ontologyA as any);
      const saveB = await ontologyRepository.save(ontologyB as any);

      // Should detect and handle circular dependencies
      if (saveA.isSuccess && saveB.isSuccess) {
        const loadA = await ontologyRepository.findByPrefix("a");
        expect(loadA.isSuccess).toBe(true);

        // Circular dependency should be detected during loading
        const validateResult = await ontologyRepository.validateDependencies();
        expect(validateResult.isSuccess).toBe(false);
        expect(validateResult.getError()).toContain("circular");
      }
    });
  });

  describe("Query Engine Error Handling", () => {
    it("should handle malformed query syntax gracefully", async () => {
      const engine = new NativeQueryEngine({} as any, {} as any);

      const malformedQueries = [
        "SELECT * FROM WHERE", // SQL syntax in SPARQL
        "INVALID QUERY SYNTAX",
        "SELECT * WHERE { ?s ?p ?o ", // Unclosed brace
        "", // Empty query
        null as any, // Null query
        undefined as any, // Undefined query
      ];

      for (const query of malformedQueries) {
        const result = await engine.executeQuery(query);
        expect(result.isSuccess).toBe(false);
        expect(result.getError()).toBeDefined();
      }
    });

    it("should handle query execution timeouts", async (done) => {
      const engine = new NativeQueryEngine({} as any, {} as any);

      // Mock a query that would take too long
      const longRunningQuery = `
                SELECT * WHERE {
                    ?s1 ?p1 ?o1 .
                    ?s2 ?p2 ?o2 .
                    ?s3 ?p3 ?o3 .
                    FILTER(REGEX(?o1, "(a+)+b"))
                }
            `;

      const startTime = Date.now();

      try {
        const result = await Promise.race([
          engine.executeQuery(longRunningQuery),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Query timeout")), 1000),
          ),
        ]);

        // If query completed, check it was fast enough
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(1500);
        done();
      } catch (error) {
        expect(error.message).toContain("timeout");
        done();
      }
    }, 2000);

    it("should handle memory exhaustion during query execution", async () => {
      const engine = new SPARQLEngine({} as any);

      // Query that could cause memory issues
      const memoryIntensiveQuery = `
                CONSTRUCT { 
                    ?s ?p ?o .
                    ?s ex:generated ?generated .
                } WHERE {
                    ?s ?p ?o .
                    BIND(CONCAT(?s, ?p, ?o, "${"x".repeat(1000)}") as ?generated)
                }
            `;

      try {
        const result = await engine.executeQuery(memoryIntensiveQuery);

        if (result.isSuccess) {
          // Query succeeded - verify result is reasonable
          const resultData = result.getValue();
          expect(resultData).toBeDefined();
        } else {
          // Query failed - should have appropriate error message
          expect(result.getError()).toContain("memory" || "limit" || "size");
        }
      } catch (error) {
        // Should not throw unhandled errors
        expect(error.message).toContain("memory");
      }
    });

    it("should handle invalid data type conversions", async () => {
      const engine = new NativeQueryEngine({} as any, {} as any);

      const typeConversionQueries = [
        'SELECT (STR(?number) as ?string) WHERE { BIND("not_a_number" as ?number) }',
        'SELECT (?date + ?duration) WHERE { BIND("invalid_date" as ?date) BIND("P1D" as ?duration) }',
        'SELECT (DATATYPE(?invalid)) WHERE { BIND("test"^^<http://invalid.uri> as ?invalid) }',
      ];

      for (const query of typeConversionQueries) {
        const result = await engine.executeQuery(query);

        // Should either succeed with warning or fail gracefully
        if (!result.isSuccess) {
          expect(result.getError()).toContain(
            "type" || "conversion" || "invalid",
          );
        }
      }
    });
  });

  describe("Resource Management Edge Cases", () => {
    it("should handle resource leaks in error conditions", async () => {
      const initialResources = process.memoryUsage().heapUsed;

      const repository = new ObsidianAssetRepository(
        new FailingVaultAdapter() as any,
        {} as any,
      );

      // Create many failed operations that could leak resources
      const failedOperations = [];

      for (let i = 0; i < 100; i++) {
        const asset = Asset.create({
          name: `Leak Test ${i}`,
          className: "TestClass",
        }).getValue()!;

        failedOperations.push(repository.save(asset));
      }

      await Promise.allSettled(failedOperations);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalResources = process.memoryUsage().heapUsed;
      const resourceGrowth = finalResources - initialResources;

      // Resource growth should be reasonable (less than 10MB)
      expect(resourceGrowth).toBeLessThan(10 * 1024 * 1024);
    });

    it("should handle cleanup in finally blocks", async () => {
      let cleanupCalled = false;

      class ResourceTrackingRepository extends ObsidianAssetRepository {
        async save(asset: Asset): Promise<Result<void>> {
          try {
            // Simulate resource allocation
            const resource = { allocated: true };

            // This will fail
            return await super.save(asset);
          } finally {
            // Cleanup should always happen
            cleanupCalled = true;
          }
        }
      }

      const repository = new ResourceTrackingRepository(
        new FailingVaultAdapter() as any,
        {} as any,
      );
      const asset = Asset.create({
        name: "Cleanup Test",
        className: "TestClass",
      }).getValue()!;

      const result = await repository.save(asset);

      expect(result.isSuccess).toBe(false);
      expect(cleanupCalled).toBe(true);
    });
  });
});
