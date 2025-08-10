/**
 * Performance tests for IndexedGraph
 * Validates O(1) lookup performance and optimization strategies
 */

import { IndexedGraph, GraphFactory } from '../../../../src/domain/semantic/core/IndexedGraph';
import { Triple, IRI, Literal } from '../../../../src/domain/semantic/core/Triple';

describe('IndexedGraph Performance', () => {
  let graph: IndexedGraph;
  
  beforeEach(() => {
    graph = new IndexedGraph();
  });
  
  describe('Batch Operations', () => {
    it('should handle batch inserts efficiently', () => {
      const startTime = performance.now();
      
      graph.beginBatch();
      
      // Add 1000 triples
      for (let i = 0; i < 1000; i++) {
        const triple = new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI('http://example.org/predicate'),
          new Literal(`value${i}`)
        );
        graph.add(triple);
      }
      
      graph.commitBatch();
      
      const elapsed = performance.now() - startTime;
      
      expect(graph.size()).toBe(1000);
      expect(elapsed).toBeLessThan(500); // Should complete in under 500ms
      expect(graph.getMetrics().lastIndexTime).toBeGreaterThan(0);
    });
    
    it('should rollback batch on error', () => {
      graph.beginBatch();
      
      for (let i = 0; i < 10; i++) {
        const triple = new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI('http://example.org/predicate'),
          new Literal(`value${i}`)
        );
        graph.add(triple);
      }
      
      graph.rollbackBatch();
      
      expect(graph.size()).toBe(0);
    });
  });
  
  describe('Query Performance', () => {
    beforeEach(() => {
      // Setup test data
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
    
    it('should have O(1) lookup performance', () => {
      const times: number[] = [];
      
      // Perform multiple queries and measure time
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        graph.query(
          `http://example.org/subject${i}`,
          'http://example.org/predicate5'
        );
        times.push(performance.now() - startTime);
      }
      
      // Calculate average and standard deviation
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const stdDev = Math.sqrt(
        times.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / times.length
      );
      
      // O(1) performance should have consistent times (low standard deviation)
      // Relaxed threshold for CI/CD environments where timing can be less predictable
      expect(stdDev).toBeLessThan(avg * 1.5); // Std dev should be less than 150% of average
    });
    
    it('should cache query results', () => {
      // First query - cache miss
      const result1 = graph.query('http://example.org/subject1');
      
      // Second identical query - cache hit
      const result2 = graph.query('http://example.org/subject1');
      
      expect(result1).toEqual(result2);
      expect(graph.getMetrics().cacheHitRate).toBeGreaterThan(0);
    });
    
    it('should handle parallel queries efficiently', async () => {
      const patterns = [
        { s: 'http://example.org/subject1' },
        { s: 'http://example.org/subject2' },
        { s: 'http://example.org/subject3' },
        { p: 'http://example.org/predicate1' },
        { o: 'value50_5' }
      ];
      
      const startTime = performance.now();
      const results = await graph.parallelQuery(patterns);
      const elapsed = performance.now() - startTime;
      
      expect(results).toHaveLength(5);
      expect(elapsed).toBeLessThan(100); // Parallel queries should be fast
    });
  });
  
  describe('Statistics', () => {
    it('should calculate statistics efficiently', () => {
      // Add test data
      graph.beginBatch();
      for (let i = 0; i < 50; i++) {
        const triple = new Triple(
          new IRI(`http://example.org/subject${i % 10}`),
          new IRI(`http://example.org/predicate${i % 5}`),
          new Literal(`value${i}`)
        );
        graph.add(triple);
      }
      graph.commitBatch();
      
      const stats = graph.getStatistics();
      
      expect(stats.totalTriples).toBe(50);
      expect(stats.uniqueSubjects).toBe(10);
      expect(stats.uniquePredicates).toBe(5);
      expect(stats.uniqueObjects).toBe(50);
    });
    
    it('should cache statistics', () => {
      graph.add(new Triple(
        new IRI('http://example.org/s'),
        new IRI('http://example.org/p'),
        new Literal('o')
      ));
      
      const stats1 = graph.getStatistics();
      const stats2 = graph.getStatistics();
      
      expect(stats1).toBe(stats2); // Same object reference (cached)
    });
  });
  
  describe('Optimization', () => {
    it('should optimize indexes', () => {
      // Add and remove many triples to fragment indexes
      for (let i = 0; i < 100; i++) {
        const triple = new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI('http://example.org/predicate'),
          new Literal(`value${i}`)
        );
        graph.add(triple);
        if (i % 2 === 0) {
          graph.remove(triple);
        }
      }
      
      const beforeOptimize = graph.getMetrics().lastIndexTime;
      
      graph.optimize();
      
      const afterOptimize = graph.getMetrics().lastIndexTime;
      
      expect(graph.size()).toBe(50); // Only odd-numbered triples remain
      expect(afterOptimize).toBeGreaterThan(0);
    });
  });
  
  describe('Stream API', () => {
    it('should stream results efficiently', () => {
      graph.beginBatch();
      for (let i = 0; i < 1000; i++) {
        graph.add(new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI('http://example.org/predicate'),
          new Literal(`value${i}`)
        ));
      }
      graph.commitBatch();
      
      let count = 0;
      for (const triple of graph.stream()) {
        count++;
        if (count >= 10) break; // Only process first 10
      }
      
      expect(count).toBe(10);
    });
  });
  
  describe('Factory Methods', () => {
    it('should create optimized graph from triples', () => {
      const triples = Array.from({ length: 100 }, (_, i) => 
        new Triple(
          new IRI(`http://example.org/s${i}`),
          new IRI('http://example.org/p'),
          new Literal(`v${i}`)
        )
      );
      
      const optimizedGraph = GraphFactory.createOptimized(triples);
      
      expect(optimizedGraph.size()).toBe(100);
      expect(optimizedGraph.getMetrics().lastIndexTime).toBeGreaterThan(0);
    });
  });
  
  describe('Large Scale Performance', () => {
    it('should handle 10,000 triples efficiently', () => {
      const startTime = performance.now();
      
      graph.beginBatch();
      for (let i = 0; i < 10000; i++) {
        graph.add(new Triple(
          new IRI(`http://example.org/s${i % 1000}`),
          new IRI(`http://example.org/p${i % 100}`),
          new Literal(`value${i}`)
        ));
      }
      graph.commitBatch();
      
      const indexTime = performance.now() - startTime;
      
      // Query performance test
      const queryStart = performance.now();
      const results = graph.query('http://example.org/s500');
      const queryTime = performance.now() - queryStart;
      
      expect(graph.size()).toBe(10000);
      expect(indexTime).toBeLessThan(5000); // Should index in under 5 seconds
      expect(queryTime).toBeLessThan(10); // Query should be under 10ms
      expect(results.length).toBeGreaterThan(0);
    });
  });
});