/**
 * Memory usage benchmarking and testing framework
 * Tests import performance and memory efficiency
 */

import { IndexedGraph } from '../../domain/semantic/core/IndexedGraph';
import { Triple, IRI, Literal } from '../../domain/semantic/core/Triple';
import { MemoryOptimizedImporter, MemoryUsageReport } from './MemoryOptimizedImporter';
import { RDFParser } from '../../application/services/RDFParser';

export interface BenchmarkResult {
  testName: string;
  tripleCount: number;
  fileSize: number;
  memoryUsage: {
    baseline: number;
    peak: number;
    final: number;
    reduction: number;
    efficiency: number; // MB per 1000 triples
  };
  performance: {
    importTime: number;
    indexTime: number;
    queryTime: number;
    throughput: number; // triples per second
  };
  optimization: {
    chunksProcessed: number;
    gcTriggered: number;
    objectsPooled: number;
    cacheHitRate: number;
  };
}

export interface BenchmarkSuite {
  results: BenchmarkResult[];
  summary: {
    totalTriples: number;
    averageMemoryReduction: number;
    averageThroughput: number;
    recommendedSettings: {
      chunkSize: number;
      memoryLimit: number;
      enablePooling: boolean;
    };
  };
}

/**
 * Memory benchmark runner
 */
export class MemoryBenchmark {
  private importer: MemoryOptimizedImporter;
  private parser: RDFParser;
  
  constructor() {
    this.importer = new MemoryOptimizedImporter();
    this.parser = new RDFParser();
  }
  
  /**
   * Run comprehensive benchmark suite
   */
  async runBenchmarkSuite(): Promise<BenchmarkSuite> {
    const results: BenchmarkResult[] = [];
    
    console.log('Starting Memory Benchmark Suite...');
    
    // Test 1: Small file (1K triples)
    results.push(await this.benchmarkSmallFile());
    
    // Test 2: Medium file (10K triples)
    results.push(await this.benchmarkMediumFile());
    
    // Test 3: Large file (100K triples)
    results.push(await this.benchmarkLargeFile());
    
    // Test 4: Memory-optimized vs standard import
    results.push(await this.benchmarkOptimizedVsStandard());
    
    // Test 5: Streaming vs batch import
    results.push(await this.benchmarkStreamingVsBatch());
    
    const summary = this.generateSummary(results);
    
    return { results, summary };
  }
  
  /**
   * Benchmark small file import
   */
  async benchmarkSmallFile(): Promise<BenchmarkResult> {
    const testData = this.generateTestRDF(1000);
    const graph = new IndexedGraph();
    
    return await this.runBenchmark('Small File (1K triples)', testData, graph, {
      chunkSize: 1000,
      enableMemoryPooling: false
    });
  }
  
  /**
   * Benchmark medium file import
   */
  async benchmarkMediumFile(): Promise<BenchmarkResult> {
    const testData = this.generateTestRDF(10000);
    const graph = new IndexedGraph();
    
    return await this.runBenchmark('Medium File (10K triples)', testData, graph, {
      chunkSize: 1000,
      enableMemoryPooling: true
    });
  }
  
  /**
   * Benchmark large file import
   */
  async benchmarkLargeFile(): Promise<BenchmarkResult> {
    const testData = this.generateTestRDF(100000);
    const graph = new IndexedGraph();
    
    return await this.runBenchmark('Large File (100K triples)', testData, graph, {
      chunkSize: 500,
      enableMemoryPooling: true,
      enableGCHints: true
    });
  }
  
  /**
   * Compare optimized vs standard import
   */
  async benchmarkOptimizedVsStandard(): Promise<BenchmarkResult> {
    const testData = this.generateTestRDF(50000);
    const graph1 = new IndexedGraph();
    const graph2 = new IndexedGraph();
    
    // Standard import
    const startTime1 = performance.now();
    const startMemory1 = this.getMemoryUsage();
    
    const parseResult = this.parser.parse(testData);
    if (parseResult.isSuccess) {
      graph1.beginBatch();
      for (const triple of parseResult.getValue().graph.toArray()) {
        graph1.add(triple);
      }
      graph1.commitBatch();
    }
    
    const standardTime = performance.now() - startTime1;
    const standardMemory = this.getMemoryUsage() - startMemory1;
    
    // Optimized import
    const startTime2 = performance.now();
    const startMemory2 = this.getMemoryUsage();
    
    const optimizedResult = await this.importer.importRDF(testData, graph2, {
      chunkSize: 1000,
      enableMemoryPooling: true,
      enableGCHints: true
    });
    
    const optimizedTime = performance.now() - startTime2;
    const optimizedMemory = this.getMemoryUsage() - startMemory2;
    
    const memoryReport = optimizedResult.isSuccess ? optimizedResult.getValue() : null;
    
    return {
      testName: 'Optimized vs Standard',
      tripleCount: 50000,
      fileSize: testData.length,
      memoryUsage: {
        baseline: standardMemory,
        peak: memoryReport?.peakMemory || 0,
        final: optimizedMemory,
        reduction: ((standardMemory - optimizedMemory) / standardMemory) * 100,
        efficiency: optimizedMemory / 50 // MB per 1000 triples
      },
      performance: {
        importTime: optimizedTime,
        indexTime: 0,
        queryTime: 0,
        throughput: 50000 / (optimizedTime / 1000)
      },
      optimization: {
        chunksProcessed: memoryReport?.chunksProcessed || 0,
        gcTriggered: memoryReport?.gcTriggered || 0,
        objectsPooled: memoryReport?.objectsPooled || 0,
        cacheHitRate: 0
      }
    };
  }
  
  /**
   * Compare streaming vs batch import
   */
  async benchmarkStreamingVsBatch(): Promise<BenchmarkResult> {
    const testData = this.generateTestRDF(30000);
    const graph = new IndexedGraph();
    
    return await this.runBenchmark('Streaming vs Batch', testData, graph, {
      chunkSize: 500,
      enableMemoryPooling: true,
      enableGCHints: true
    });
  }
  
  /**
   * Run individual benchmark
   */
  private async runBenchmark(
    testName: string,
    testData: string,
    graph: IndexedGraph,
    options: any
  ): Promise<BenchmarkResult> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    // Import data
    const importResult = await this.importer.importRDF(testData, graph, options);
    
    const importTime = performance.now() - startTime;
    const finalMemory = this.getMemoryUsage();
    
    // Test query performance
    const queryStartTime = performance.now();
    const queryResults = graph.query();
    const queryTime = performance.now() - queryStartTime;
    
    const memoryReport = importResult.isSuccess ? importResult.getValue() : null;
    const tripleCount = graph.size();
    
    return {
      testName,
      tripleCount,
      fileSize: testData.length,
      memoryUsage: {
        baseline: startMemory,
        peak: memoryReport?.peakMemory || finalMemory,
        final: finalMemory,
        reduction: memoryReport?.memoryReduction || 0,
        efficiency: (finalMemory - startMemory) / (tripleCount / 1000)
      },
      performance: {
        importTime,
        indexTime: 0,
        queryTime,
        throughput: tripleCount / (importTime / 1000)
      },
      optimization: {
        chunksProcessed: memoryReport?.chunksProcessed || 0,
        gcTriggered: memoryReport?.gcTriggered || 0,
        objectsPooled: memoryReport?.objectsPooled || 0,
        cacheHitRate: graph.getMetrics().cacheHitRate
      }
    };
  }
  
  /**
   * Generate test RDF data
   */
  private generateTestRDF(tripleCount: number): string {
    const prefixes = `
@prefix ex: <http://example.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

`;
    
    let triples = '';
    
    for (let i = 0; i < tripleCount; i++) {
      const subjectId = Math.floor(i / 10); // 10 triples per subject
      const predicateType = i % 5;
      
      let triple = '';
      switch (predicateType) {
        case 0:
          triple = `ex:person${subjectId} foaf:name "Person ${subjectId}" .`;
          break;
        case 1:
          triple = `ex:person${subjectId} foaf:age "${20 + (i % 50)}"^^xsd:integer .`;
          break;
        case 2:
          triple = `ex:person${subjectId} ex:hasDocument ex:doc${i} .`;
          break;
        case 3:
          triple = `ex:doc${i} rdfs:label "Document ${i}" .`;
          break;
        case 4:
          triple = `ex:doc${i} ex:created "${new Date(2020 + (i % 4), (i % 12), (i % 28) + 1).toISOString()}"^^xsd:dateTime .`;
          break;
      }
      
      triples += triple + '\n';
    }
    
    return prefixes + triples;
  }
  
  /**
   * Generate summary statistics
   */
  private generateSummary(results: BenchmarkResult[]): BenchmarkSuite['summary'] {
    const totalTriples = results.reduce((sum, r) => sum + r.tripleCount, 0);
    const avgMemoryReduction = results.reduce((sum, r) => sum + r.memoryUsage.reduction, 0) / results.length;
    const avgThroughput = results.reduce((sum, r) => sum + r.performance.throughput, 0) / results.length;
    
    // Determine optimal settings based on results
    const largeFileResult = results.find(r => r.testName.includes('Large'));
    const recommendedSettings = {
      chunkSize: largeFileResult ? 500 : 1000,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      enablePooling: totalTriples > 10000
    };
    
    return {
      totalTriples,
      averageMemoryReduction: avgMemoryReduction,
      averageThroughput: avgThroughput,
      recommendedSettings
    };
  }
  
  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 
        'memory' in performance && 
        (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
  
  /**
   * Format benchmark results for display
   */
  formatResults(suite: BenchmarkSuite): string {
    let output = '=== Memory Benchmark Results ===\n\n';
    
    for (const result of suite.results) {
      output += `${result.testName}:\n`;
      output += `  Triples: ${result.tripleCount.toLocaleString()}\n`;
      output += `  File Size: ${this.formatBytes(result.fileSize)}\n`;
      output += `  Memory Reduction: ${result.memoryUsage.reduction.toFixed(1)}%\n`;
      output += `  Import Time: ${result.performance.importTime.toFixed(1)}ms\n`;
      output += `  Throughput: ${result.performance.throughput.toFixed(0)} triples/sec\n`;
      output += `  Memory Efficiency: ${result.memoryUsage.efficiency.toFixed(2)} MB/1K triples\n`;
      output += `  Chunks Processed: ${result.optimization.chunksProcessed}\n`;
      output += `  GC Triggered: ${result.optimization.gcTriggered}\n`;
      output += '\n';
    }
    
    output += 'Summary:\n';
    output += `  Total Triples: ${suite.summary.totalTriples.toLocaleString()}\n`;
    output += `  Average Memory Reduction: ${suite.summary.averageMemoryReduction.toFixed(1)}%\n`;
    output += `  Average Throughput: ${suite.summary.averageThroughput.toFixed(0)} triples/sec\n`;
    output += '\n';
    
    output += 'Recommended Settings:\n';
    output += `  Chunk Size: ${suite.summary.recommendedSettings.chunkSize}\n`;
    output += `  Memory Limit: ${this.formatBytes(suite.summary.recommendedSettings.memoryLimit)}\n`;
    output += `  Enable Pooling: ${suite.summary.recommendedSettings.enablePooling}\n`;
    
    return output;
  }
  
  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }
}

/**
 * Memory benchmark test suite
 */
export class MemoryBenchmarkRunner {
  static async runQuickTest(): Promise<void> {
    const benchmark = new MemoryBenchmark();
    
    console.log('Running quick memory benchmark...');
    
    const testData = `
@prefix ex: <http://example.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

ex:person1 foaf:name "Alice" .
ex:person1 foaf:age "25"^^<http://www.w3.org/2001/XMLSchema#integer> .
ex:person2 foaf:name "Bob" .
ex:person2 foaf:age "30"^^<http://www.w3.org/2001/XMLSchema#integer> .
`;
    
    const graph = new IndexedGraph();
    const importer = new MemoryOptimizedImporter();
    
    const startMemory = (typeof performance !== 'undefined' && 
                        'memory' in performance && 
                        (performance as any).memory) ? 
                        (performance as any).memory.usedJSHeapSize : 0;
    const startTime = performance.now();
    
    const result = await importer.importRDF(testData, graph, {
      chunkSize: 100,
      enableMemoryPooling: true
    });
    
    const endTime = performance.now();
    const endMemory = (typeof performance !== 'undefined' && 
                      'memory' in performance && 
                      (performance as any).memory) ? 
                      (performance as any).memory.usedJSHeapSize : 0;
    
    console.log('Quick Test Results:');
    console.log(`  Triples imported: ${graph.size()}`);
    console.log(`  Time: ${(endTime - startTime).toFixed(1)}ms`);
    console.log(`  Memory used: ${Math.round((endMemory - startMemory) / 1024)} KB`);
    
    if (result.isSuccess) {
      const report = result.getValue();
      console.log(`  Chunks processed: ${report.chunksProcessed}`);
      console.log(`  Objects pooled: ${report.objectsPooled}`);
    }
  }
  
  static async runFullSuite(): Promise<BenchmarkSuite> {
    const benchmark = new MemoryBenchmark();
    return await benchmark.runBenchmarkSuite();
  }
}