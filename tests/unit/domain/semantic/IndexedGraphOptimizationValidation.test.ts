/**
 * Performance optimization validation tests for IndexedGraph
 * Tests ISO/IEC 25010 standards compliance and optimization effectiveness
 */

import { IndexedGraph } from "../../../../src/domain/semantic/core/IndexedGraph";
import { Triple, IRI, Literal } from "../../../../src/domain/semantic/core/Triple";

describe("IndexedGraph Performance Optimization Validation", () => {
  let graph: IndexedGraph;

  beforeEach(() => {
    graph = new IndexedGraph();
  });

  afterEach(() => {
    if (graph) {
      graph.clear();
      graph = null as any;
    }
  });

  describe("ISO/IEC 25010 Time Behavior Compliance", () => {
    it("should achieve sub-100ms query response for 10k+ triples", () => {
      // Load 10,000 triples with property relationships
      graph.beginBatch();
      
      for (let i = 0; i < 10000; i++) {
        const subjectId = `http://example.org/property${i}`;
        
        // Create property instance
        graph.add(new Triple(
          new IRI(subjectId),
          new IRI("rdf:type"),
          new IRI("exo__Property")
        ));
        
        // Add domain/range
        graph.add(new Triple(
          new IRI(subjectId),
          new IRI("rdfs:domain"),
          new IRI(`http://example.org/class${i % 100}`)
        ));
        
        // Add hierarchy relationships
        if (i > 0) {
          graph.add(new Triple(
            new IRI(subjectId),
            new IRI("rdfs:subPropertyOf"),
            new IRI(`http://example.org/property${Math.floor(i / 10)}`)
          ));
        }
      }
      
      graph.commitBatch();
      
      console.log(`Graph loaded: ${graph.size()} triples`);
      
      // Test query performance
      const queryPatterns = [
        { s: "http://example.org/property5000", p: "rdf:type" },
        { p: "rdfs:domain", o: "http://example.org/class50" },
        { p: "rdfs:subPropertyOf" },
        { s: "http://example.org/property1000" },
      ];
      
      const startTime = performance.now();
      const results = queryPatterns.map(pattern => 
        graph.query(pattern.s, pattern.p, pattern.o)
      );
      const queryTime = performance.now() - startTime;
      
      console.log(`Query performance: ${queryTime.toFixed(2)}ms for ${queryPatterns.length} patterns`);
      console.log(`Average per query: ${(queryTime / queryPatterns.length).toFixed(2)}ms`);
      
      // Validate results
      expect(results[0]).toHaveLength(1); // Exact match
      expect(results[1].length).toBeGreaterThan(0); // Domain queries
      expect(results[2].length).toBeGreaterThan(0); // Hierarchy queries
      expect(results[3].length).toBeGreaterThan(0); // Subject queries
      
      // Performance target: sub-100ms for complex queries
      expect(queryTime).toBeLessThan(100);
      expect(queryTime / queryPatterns.length).toBeLessThan(25); // 25ms per query average
    });

    it("should demonstrate optimized property hierarchy traversal", () => {
      // Create a property hierarchy: 5 levels deep, 10 properties per level
      graph.beginBatch();
      
      for (let level = 0; level < 5; level++) {
        for (let prop = 0; prop < 10; prop++) {
          const propId = `http://example.org/property_${level}_${prop}`;
          
          graph.add(new Triple(
            new IRI(propId),
            new IRI("rdf:type"),
            new IRI("exo__Property")
          ));
          
          // Create hierarchy
          if (level > 0) {
            const parentId = `http://example.org/property_${level - 1}_${prop % 5}`;
            graph.add(new Triple(
              new IRI(propId),
              new IRI("rdfs:subPropertyOf"),
              new IRI(parentId)
            ));
          }
        }
      }
      
      graph.commitBatch();
      
      // Test hierarchy traversal performance
      const startTime = performance.now();
      const hierarchyResults = graph.queryPropertyHierarchy("http://example.org/property_4_5", "broader");
      const traversalTime = performance.now() - startTime;
      
      console.log(`Hierarchy traversal: ${traversalTime.toFixed(2)}ms, found ${hierarchyResults.length} related properties`);
      
      // Should find all parent properties (4 levels up)
      expect(hierarchyResults.length).toBeGreaterThanOrEqual(4);
      expect(traversalTime).toBeLessThan(10); // Very fast hierarchy traversal
      
      // Test caching effectiveness
      const cachedStartTime = performance.now();
      const cachedResults = graph.queryPropertyHierarchy("http://example.org/property_4_5", "broader");
      const cachedTime = performance.now() - cachedStartTime;
      
      expect(cachedResults).toEqual(hierarchyResults);
      expect(cachedTime).toBeLessThan(1); // Cache hit should be nearly instant
    });
  });

  describe("Resource Utilization Optimization", () => {
    it("should maintain efficient memory usage during bulk operations", () => {
      const initialMemory = graph.getMemoryUsage();
      
      // Load large dataset in batches
      const TOTAL_TRIPLES = 5000;
      const BATCH_SIZE = 1000;
      
      graph.beginBatch();
      
      for (let i = 0; i < TOTAL_TRIPLES; i++) {
        graph.add(new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI(`http://example.org/predicate${i % 100}`),
          new Literal(`value${i}`)
        ));
        
        // Commit every BATCH_SIZE triples
        if ((i + 1) % BATCH_SIZE === 0) {
          graph.commitBatch();
          graph.beginBatch();
        }
      }
      
      graph.commitBatch();
      
      const finalMemory = graph.getMemoryUsage();
      const memoryGrowth = finalMemory - initialMemory;
      const stats = graph.getStatistics();
      
      console.log(`Memory usage: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB for ${TOTAL_TRIPLES} triples`);
      console.log(`Memory per triple: ${(memoryGrowth / TOTAL_TRIPLES).toFixed(0)} bytes`);
      console.log(`Index sizes: SPO=${stats.indexSizes.spo}, POS=${stats.indexSizes.pos}, OSP=${stats.indexSizes.osp}`);
      
      // Memory efficiency targets
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // < 50MB for 5k triples
      expect(memoryGrowth / TOTAL_TRIPLES).toBeLessThan(10000); // < 10KB per triple
    });

    it("should demonstrate cache effectiveness and hit rates", () => {
      // Load test data
      graph.beginBatch();
      for (let i = 0; i < 1000; i++) {
        graph.add(new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI(`http://example.org/predicate${i % 20}`),
          new Literal(`value${i}`)
        ));
      }
      graph.commitBatch();
      
      // Test queries to build cache
      const queries = [
        { p: "http://example.org/predicate5" },
        { p: "http://example.org/predicate10" },
        { s: "http://example.org/subject100" },
        { s: "http://example.org/subject200" },
      ];
      
      // First pass - cache misses
      queries.forEach(q => graph.query(q.s, q.p, q.o));
      
      // Second pass - should hit cache
      const startTime = performance.now();
      const cachedResults = queries.map(q => graph.query(q.s, q.p, q.o));
      const cachedQueryTime = performance.now() - startTime;
      
      const metrics = graph.getMetrics();
      
      console.log(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`Cached query time: ${cachedQueryTime.toFixed(2)}ms for ${queries.length} queries`);
      
      // Cache effectiveness targets
      expect(metrics.cacheHitRate).toBeGreaterThan(0.5); // > 50% hit rate
      expect(cachedQueryTime / queries.length).toBeLessThan(1); // < 1ms per cached query
      expect(cachedResults.every(r => Array.isArray(r))).toBe(true);
    });
  });

  describe("Capacity and Scalability", () => {
    it("should handle concurrent query load efficiently", async () => {
      // Load test dataset
      graph.beginBatch();
      for (let i = 0; i < 2000; i++) {
        graph.add(new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI(`http://example.org/predicate${i % 50}`),
          new Literal(`value${i}`)
        ));
      }
      graph.commitBatch();
      
      // Generate concurrent query patterns
      const patterns = Array.from({ length: 100 }, (_, i) => ({
        s: Math.random() < 0.3 ? `http://example.org/subject${i * 20}` : undefined,
        p: Math.random() < 0.7 ? `http://example.org/predicate${i % 50}` : undefined,
        o: undefined,
      }));
      
      // Test parallel query performance
      const startTime = performance.now();
      const results = await graph.parallelQuery(patterns);
      const parallelTime = performance.now() - startTime;
      
      console.log(`Parallel queries: ${patterns.length} patterns in ${parallelTime.toFixed(2)}ms`);
      console.log(`Throughput: ${(patterns.length / (parallelTime / 1000)).toFixed(0)} queries/sec`);
      
      // Validate results
      expect(results).toHaveLength(patterns.length);
      expect(results.every(r => Array.isArray(r))).toBe(true);
      
      // Performance targets
      expect(parallelTime).toBeLessThan(500); // < 500ms for 100 parallel queries
      expect(patterns.length / (parallelTime / 1000)).toBeGreaterThan(200); // > 200 queries/sec
    });

    it("should pass ISO/IEC 25010 performance compliance validation", () => {
      // Load representative dataset
      graph.beginBatch();
      for (let i = 0; i < 5000; i++) {
        // Property instances
        graph.add(new Triple(
          new IRI(`http://example.org/property${i}`),
          new IRI("rdf:type"),
          new IRI("exo__Property")
        ));
        
        // Property metadata
        graph.add(new Triple(
          new IRI(`http://example.org/property${i}`),
          new IRI("exo__Property_isRequired"),
          new Literal((i % 3 === 0).toString())
        ));
        
        // Hierarchical relationships
        if (i > 0 && i % 10 !== 0) {
          graph.add(new Triple(
            new IRI(`http://example.org/property${i}`),
            new IRI("rdfs:subPropertyOf"),
            new IRI(`http://example.org/property${Math.floor(i / 10) * 10}`)
          ));
        }
      }
      graph.commitBatch();
      
      // Run compliance validation
      const compliance = graph.validatePerformanceStandards();
      
      console.log("ISO/IEC 25010 Performance Compliance:");
      console.log(`Time Behavior: ${compliance.timeBehavior.compliant ? "✓" : "✗"} (${compliance.timeBehavior.responseTime.toFixed(2)}ms avg)`);
      console.log(`Resource Utilization: ${compliance.resourceUtilization.compliant ? "✓" : "✗"} (${compliance.resourceUtilization.memoryUsage.toFixed(1)}% memory, ${compliance.resourceUtilization.cpuEfficiency.toFixed(0)} ops/sec)`);
      console.log(`Capacity: ${compliance.capacity.compliant ? "✓" : "✗"} (${compliance.capacity.currentTriples}/${compliance.capacity.maxTriples} triples)`);
      
      // All compliance checks should pass
      expect(compliance.timeBehavior.compliant).toBe(true);
      expect(compliance.resourceUtilization.compliant).toBe(true);
      expect(compliance.capacity.compliant).toBe(true);
      
      // Specific performance targets
      expect(compliance.timeBehavior.responseTime).toBeLessThan(100); // Sub-100ms
      expect(compliance.resourceUtilization.memoryUsage).toBeLessThan(80); // < 80% memory
      expect(compliance.resourceUtilization.cpuEfficiency).toBeGreaterThan(100); // > 100 ops/sec
    });
  });

  describe("Semantic Query Optimization", () => {
    it("should optimize exo__Property semantic searches", () => {
      // Create property dataset with semantic relationships
      graph.beginBatch();
      
      for (let i = 0; i < 1000; i++) {
        const propId = `http://example.org/property${i}`;
        
        graph.add(new Triple(
          new IRI(propId),
          new IRI("rdf:type"),
          new IRI("exo__Property")
        ));
        
        graph.add(new Triple(
          new IRI(propId),
          new IRI("rdfs:domain"),
          new IRI(`http://example.org/class${i % 20}`)
        ));
        
        graph.add(new Triple(
          new IRI(propId),
          new IRI("rdfs:range"),
          new IRI(`http://example.org/datatype${i % 10}`)
        ));
        
        graph.add(new Triple(
          new IRI(propId),
          new IRI("exo__Property_isRequired"),
          new Literal((i % 3 === 0).toString())
        ));
      }
      
      graph.commitBatch();
      
      // Test semantic query performance
      const semanticPatterns = [
        { domain: "http://example.org/class5" },
        { range: "http://example.org/datatype3" },
        { required: true },
        { domain: "http://example.org/class10", required: false },
      ];
      
      const startTime = performance.now();
      const semanticResults = semanticPatterns.map(pattern => 
        graph.semanticQuery(pattern)
      );
      const semanticTime = performance.now() - startTime;
      
      console.log(`Semantic query performance: ${semanticTime.toFixed(2)}ms for ${semanticPatterns.length} patterns`);
      console.log(`Results: ${semanticResults.map(r => r.length).join(", ")} matches`);
      
      // Validate semantic query results
      expect(semanticResults.every(r => Array.isArray(r))).toBe(true);
      expect(semanticResults.every(r => r.length > 0)).toBe(true);
      
      // Performance target for semantic queries
      expect(semanticTime).toBeLessThan(50); // < 50ms for semantic queries
      expect(semanticTime / semanticPatterns.length).toBeLessThan(15); // < 15ms per semantic query
    });

    it("should demonstrate batch semantic processing efficiency", () => {
      // Load semantic dataset
      graph.beginBatch();
      for (let i = 0; i < 500; i++) {
        const propId = `http://example.org/property${i}`;
        
        graph.add(new Triple(new IRI(propId), new IRI("rdf:type"), new IRI("exo__Property")));
        graph.add(new Triple(new IRI(propId), new IRI("rdfs:domain"), new IRI(`http://example.org/class${i % 15}`)));
        graph.add(new Triple(new IRI(propId), new IRI("exo__Property_isRequired"), new Literal((i % 4 === 0).toString())));
      }
      graph.commitBatch();
      
      // Generate batch semantic queries
      const batchPatterns = Array.from({ length: 50 }, (_, i) => ({
        domain: `http://example.org/class${i % 15}`,
        required: i % 2 === 0,
      }));
      
      const startTime = performance.now();
      const batchResults = graph.batchSemanticQuery(batchPatterns);
      const batchTime = performance.now() - startTime;
      
      const metrics = graph.getMetrics();
      
      console.log(`Batch semantic processing: ${batchPatterns.length} patterns in ${batchTime.toFixed(2)}ms`);
      console.log(`Processing rate: ${metrics.batchProcessingRate.toFixed(0)} patterns/sec`);
      
      // Validate batch results
      expect(batchResults).toHaveLength(batchPatterns.length);
      expect(batchResults.every(r => Array.isArray(r))).toBe(true);
      
      // Batch processing efficiency targets
      expect(batchTime).toBeLessThan(200); // < 200ms for 50 batch queries
      expect(metrics.batchProcessingRate).toBeGreaterThan(250); // > 250 patterns/sec
    });
  });

  describe("Memory Management and Optimization", () => {
    it("should demonstrate automatic performance optimization", () => {
      // Load dataset that will trigger auto-optimization
      graph.beginBatch();
      for (let i = 0; i < 3000; i++) {
        graph.add(new Triple(
          new IRI(`http://example.org/subject${i}`),
          new IRI(`http://example.org/predicate${i % 100}`),
          new Literal(`value${i}`)
        ));
      }
      graph.commitBatch();
      
      // Perform many queries to build up metrics
      for (let i = 0; i < 100; i++) {
        graph.query(`http://example.org/subject${i * 30}`, `http://example.org/predicate${i % 100}`);
      }
      
      const metrics = graph.getMetrics();
      
      console.log(`Performance metrics:`);
      console.log(`- Average query time: ${metrics.averageQueryTime.toFixed(3)}ms`);
      console.log(`- Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`- Memory efficiency: ${(metrics.memoryEfficiency * 100).toFixed(1)}%`);
      console.log(`- Index fragmentation: ${(metrics.indexFragmentation * 100).toFixed(1)}%`);
      
      // Performance should be within acceptable ranges
      expect(metrics.averageQueryTime).toBeLessThan(5); // < 5ms average
      expect(metrics.cacheHitRate).toBeGreaterThan(0.3); // > 30% hit rate
      expect(metrics.indexFragmentation).toBeLessThan(0.5); // < 50% fragmentation
    });
  });
});