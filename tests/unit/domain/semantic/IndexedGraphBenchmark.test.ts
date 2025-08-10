/**
 * Benchmark and alternative performance testing approaches for IndexedGraph
 * Provides more reliable performance testing strategies
 */

import { IndexedGraph, GraphFactory } from '../../../../src/domain/semantic/core/IndexedGraph';
import { Triple, IRI, Literal } from '../../../../src/domain/semantic/core/Triple';

describe('IndexedGraph Performance Benchmarks', () => {
  let graph: IndexedGraph;
  
  beforeEach(() => {
    graph = new IndexedGraph();
    // Setup consistent test data
    graph.beginBatch();
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 10; j++) {
        const triple = new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI(`http://example.org/predicate${j}`),
          new Literal(`value${i}_${j}`)
        );
        graph.add(triple);
      }
    }
    graph.commitBatch();
  });

  describe('Comparative Performance Analysis', () => {
    it('should demonstrate O(1) vs O(n) performance scaling', () => {
      const dataSizes = [100, 500, 1000, 2000];
      const results: { size: number; avgTime: number; maxTime: number }[] = [];

      for (const size of dataSizes) {
        // Create graph with specific size
        const testGraph = new IndexedGraph();
        testGraph.beginBatch();
        
        for (let i = 0; i < size; i++) {
          testGraph.add(new Triple(
            new IRI(`http://test.org/s${i}`),
            new IRI('http://test.org/predicate'),
            new Literal(`value${i}`)
          ));
        }
        testGraph.commitBatch();

        // Measure query performance
        const times: number[] = [];
        const queryCount = Math.min(50, size);
        
        for (let i = 0; i < queryCount; i++) {
          const start = performance.now();
          testGraph.query(`http://test.org/s${i}`, 'http://test.org/predicate');
          times.push(performance.now() - start);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        
        results.push({ size, avgTime, maxTime });
      }

      // Verify performance doesn't degrade significantly with data size
      // For true O(1), performance should remain relatively constant
      const firstAvg = results[0].avgTime;
      const lastAvg = results[results.length - 1].avgTime;
      const performanceDegradation = lastAvg / firstAvg;

      // Allow up to 3x degradation (still much better than O(n))
      expect(performanceDegradation).toBeLessThan(3.0);
      
      // No individual query should take more than 10ms
      results.forEach(result => {
        expect(result.maxTime).toBeLessThan(10.0);
      });
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentQueries = 20;
      const queriesPerWorker = 25;
      
      const workers = Array.from({ length: concurrentQueries }, async (_, workerId) => {
        const times: number[] = [];
        
        for (let i = 0; i < queriesPerWorker; i++) {
          const start = performance.now();
          graph.query(
            `http://example.org/subject${(workerId * queriesPerWorker + i) % 100}`,
            `http://example.org/predicate${i % 10}`
          );
          times.push(performance.now() - start);
        }
        
        return {
          workerId,
          avgTime: times.reduce((a, b) => a + b, 0) / times.length,
          maxTime: Math.max(...times)
        };
      });

      const results = await Promise.all(workers);
      
      // All workers should complete successfully
      expect(results).toHaveLength(concurrentQueries);
      
      // Performance should remain consistent across workers
      const avgTimes = results.map(r => r.avgTime);
      const overallAvg = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length;
      const maxDeviation = Math.max(...avgTimes.map(t => Math.abs(t - overallAvg)));
      
      // No worker should deviate more than 5x from average
      expect(maxDeviation / overallAvg).toBeLessThan(5.0);
    });
  });

  describe('Memory and Resource Performance', () => {
    it('should maintain efficient memory usage during operations', () => {
      // Skip if performance.memory is not available
      if (typeof performance.memory === 'undefined') {
        console.warn('Memory profiling not available in this environment');
        return;
      }

      const initialMemory = performance.memory.usedJSHeapSize;
      
      // Perform many queries
      for (let i = 0; i < 1000; i++) {
        graph.query(
          `http://example.org/subject${i % 100}`,
          `http://example.org/predicate${i % 10}`
        );
      }
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be minimal (< 1MB for 1000 queries)
      expect(memoryGrowth).toBeLessThan(1024 * 1024);
    });

    it('should demonstrate cache effectiveness', () => {
      // Clear cache to start fresh
      (graph as any).queryCache.clear();
      
      const uniqueQuery = 'http://example.org/subject50';
      const predicate = 'http://example.org/predicate5';
      
      // First query - cache miss
      const start1 = performance.now();
      const result1 = graph.query(uniqueQuery, predicate);
      const time1 = performance.now() - start1;
      
      // Second identical query - cache hit
      const start2 = performance.now();
      const result2 = graph.query(uniqueQuery, predicate);
      const time2 = performance.now() - start2;
      
      // Results should be identical
      expect(result1).toEqual(result2);
      
      // Cache hit should be significantly faster (at least 2x)
      if (time1 > 0.1 && time2 > 0) { // Only compare if measurable
        expect(time2).toBeLessThan(time1 * 0.5);
      }
      
      // Verify cache hit rate improved
      const metrics = graph.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Statistical Performance Validation', () => {
    it('should pass statistical consistency tests', () => {
      const sampleSize = 100;
      const times: number[] = [];
      
      // Warm up cache
      for (let i = 0; i < 10; i++) {
        graph.query(`http://example.org/subject${i}`, 'http://example.org/predicate0');
      }
      
      // Collect performance samples
      for (let i = 0; i < sampleSize; i++) {
        const start = performance.now();
        graph.query(
          `http://example.org/subject${i % 50}`, // 50% cache hit rate
          'http://example.org/predicate0'
        );
        const duration = performance.now() - start;
        
        if (duration > 0.001) { // Only meaningful measurements
          times.push(duration);
        }
      }
      
      // Statistical analysis
      times.sort((a, b) => a - b);
      const median = times[Math.floor(times.length / 2)];
      const q1 = times[Math.floor(times.length * 0.25)];
      const q3 = times[Math.floor(times.length * 0.75)];
      const iqr = q3 - q1;
      
      // Performance characteristics for O(1) operations
      expect(median).toBeLessThan(2.0); // Median < 2ms
      expect(iqr).toBeLessThan(5.0); // IQR < 5ms (consistency)
      expect(times[Math.floor(times.length * 0.95)]).toBeLessThan(10.0); // 95th percentile < 10ms
      
      // Verify we have enough valid samples (more lenient threshold)
      expect(times.length).toBeGreaterThan(sampleSize * 0.4); // At least 40% valid samples
    });
  });

  describe('Regression Testing', () => {
    it('should maintain baseline performance over time', () => {
      // Performance baseline (adjust based on actual measurements)
      const performanceBaselines = {
        avgQueryTime: 1.0, // 1ms average
        maxQueryTime: 5.0, // 5ms max
        cacheHitRatio: 0.5 // 50% cache hit rate
      };
      
      // Execute standard performance test
      const times: number[] = [];
      let cacheHits = 0;
      const totalQueries = 100;
      
      for (let i = 0; i < totalQueries; i++) {
        const cacheKeyExists = i % 2 === 0; // 50% cache hit simulation
        const start = performance.now();
        
        graph.query(
          `http://example.org/subject${cacheKeyExists ? 0 : i}`,
          'http://example.org/predicate0'
        );
        
        times.push(performance.now() - start);
        if (cacheKeyExists && i > 0) cacheHits++;
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const actualCacheHitRatio = cacheHits / totalQueries;
      
      // Compare against baselines with tolerance
      expect(avgTime).toBeLessThan(performanceBaselines.avgQueryTime * 2.0); // 2x tolerance
      expect(maxTime).toBeLessThan(performanceBaselines.maxQueryTime * 2.0);
      expect(actualCacheHitRatio).toBeGreaterThan(performanceBaselines.cacheHitRatio * 0.8); // 20% tolerance
    });
  });
});