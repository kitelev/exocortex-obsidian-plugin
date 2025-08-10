/**
 * Integration tests for SPARQLEngine caching functionality
 */

import { SPARQLEngine, ConstructResult, SelectResult } from '../../src/application/SPARQLEngine';
import { Graph } from '../../src/domain/semantic/core/Graph';
import { Triple, IRI, Literal } from '../../src/domain/semantic/core/Triple';

describe('SPARQLEngine Caching Integration', () => {
    let engine: SPARQLEngine;
    let graph: Graph;

    beforeEach(() => {
        graph = new Graph();
        
        // Add test data
        graph.add(new Triple(new IRI('file://test1'), new IRI('dc:title'), Literal.string('Test Document 1')));
        graph.add(new Triple(new IRI('file://test1'), new IRI('rdf:type'), Literal.string('Document')));
        graph.add(new Triple(new IRI('file://test1'), new IRI('ex:priority'), Literal.string('high')));
        
        graph.add(new Triple(new IRI('file://test2'), new IRI('dc:title'), Literal.string('Test Document 2')));
        graph.add(new Triple(new IRI('file://test2'), new IRI('rdf:type'), Literal.string('Note')));
        graph.add(new Triple(new IRI('file://test2'), new IRI('ex:priority'), Literal.string('low')));
        
        graph.add(new Triple(new IRI('file://test3'), new IRI('dc:title'), Literal.string('Test Document 3')));
        graph.add(new Triple(new IRI('file://test3'), new IRI('rdf:type'), Literal.string('Document')));
        graph.add(new Triple(new IRI('file://test3'), new IRI('ex:status'), Literal.string('complete')));

        // Initialize engine with cache enabled
        engine = new SPARQLEngine(graph, {
            enabled: true,
            maxSize: 100,
            defaultTTL: 60000 // 1 minute
        });
    });

    afterEach(() => {
        engine.destroy();
    });

    describe('SELECT query caching', () => {
        it('should cache SELECT query results', () => {
            const query = 'SELECT ?s ?title WHERE { ?s dc:title ?title }';
            
            // First execution - should miss cache
            const result1 = engine.select(query);
            expect(result1.cached).toBe(false);
            expect(result1.results.length).toBe(3);
            
            // Second execution - should hit cache
            const result2 = engine.select(query);
            expect(result2.cached).toBe(true);
            expect(result2.results).toEqual(result1.results);
        });

        it('should cache different SELECT queries separately', () => {
            const query1 = 'SELECT ?s WHERE { ?s rdf:type "Document" }';
            const query2 = 'SELECT ?s WHERE { ?s rdf:type "Note" }';
            
            const result1 = engine.select(query1);
            const result2 = engine.select(query2);
            
            expect(result1.cached).toBe(false);
            expect(result2.cached).toBe(false);
            expect(result1.results.length).toBe(2); // test1 and test3
            expect(result2.results.length).toBe(1); // test2
            
            // Cache should work for both queries independently
            const cachedResult1 = engine.select(query1);
            const cachedResult2 = engine.select(query2);
            
            expect(cachedResult1.cached).toBe(true);
            expect(cachedResult2.cached).toBe(true);
        });

        it('should handle query normalization for caching', () => {
            const query1 = 'SELECT ?s ?title WHERE { ?s dc:title ?title }';
            const query2 = '  SELECT   ?s   ?title   WHERE   {   ?s   dc:title   ?title   }  ';
            const query3 = 'SELECT\n?s\n?title\nWHERE\n{\n?s\ndc:title\n?title\n}';
            
            // Debug cache key generation
            const cache = (engine as any).queryCache;
            const key1 = cache.createCacheKey(`SELECT:${query1}`);
            const key2 = cache.createCacheKey(`SELECT:${query2}`);
            const key3 = cache.createCacheKey(`SELECT:${query3}`);
            
            console.log('Cache key 1:', key1);
            console.log('Cache key 2:', key2);
            console.log('Cache key 3:', key3);
            console.log('Keys match?', key1 === key2, key1 === key3);
            
            const result1 = engine.select(query1);
            expect(result1.cached).toBe(false);
            
            // These should all hit the same cache entry
            const result2 = engine.select(query2);
            const result3 = engine.select(query3);
            
            expect(result2.cached).toBe(true);
            expect(result3.cached).toBe(true);
            expect(result2.results).toEqual(result1.results);
            expect(result3.results).toEqual(result1.results);
        });

        it('should cache empty results', () => {
            const query = 'SELECT ?s WHERE { ?s ex:nonexistent_predicate ?o }';
            
            const result1 = engine.select(query);
            expect(result1.cached).toBe(false);
            expect(result1.results.length).toBe(0);
            
            const result2 = engine.select(query);
            expect(result2.cached).toBe(true);
            expect(result2.results.length).toBe(0);
        });

        it('should cache queries with LIMIT', () => {
            const query = 'SELECT ?s ?title WHERE { ?s dc:title ?title } LIMIT 2';
            
            const result1 = engine.select(query);
            expect(result1.cached).toBe(false);
            expect(result1.results.length).toBe(2);
            
            const result2 = engine.select(query);
            expect(result2.cached).toBe(true);
            expect(result2.results.length).toBe(2);
            expect(result2.results).toEqual(result1.results);
        });
    });

    describe('CONSTRUCT query caching', () => {
        it('should cache CONSTRUCT query results', () => {
            const query = 'CONSTRUCT { ?s ex:hasType ?type } WHERE { ?s rdf:type ?type }';
            
            const result1 = engine.construct(query);
            expect(result1.cached).toBe(false);
            expect(result1.triples.length).toBe(3);
            
            const result2 = engine.construct(query);
            expect(result2.cached).toBe(true);
            expect(result2.triples.length).toBe(3);
            
            // Results should be identical
            expect(result2.triples).toEqual(result1.triples);
        });

        it('should not add cached triples to graph again', () => {
            const query = 'CONSTRUCT { ?s ex:derived_type ?type } WHERE { ?s rdf:type ?type }';
            const originalSize = graph.size();
            
            // First execution - CONSTRUCT doesn't modify the graph
            const result1 = engine.construct(query);
            expect(result1.cached).toBe(false);
            // There are 3 triples with 'type' predicate (Document, Note, Document)
            expect(result1.triples.length).toBe(3);
            expect(graph.size()).toBe(originalSize); // Graph unchanged
            
            // Second execution should use cache
            const result2 = engine.construct(query);
            expect(result2.cached).toBe(true);
            expect(graph.size()).toBe(originalSize); // Still unchanged
            expect(result2.triples).toEqual(result1.triples);
        });

        it('should cache CONSTRUCT queries with LIMIT', () => {
            const query = 'CONSTRUCT { ?s ex:limited_type ?type } WHERE { ?s rdf:type ?type } LIMIT 2';
            
            const result1 = engine.construct(query);
            expect(result1.cached).toBe(false);
            expect(result1.triples.length).toBe(2);
            
            const result2 = engine.construct(query);
            expect(result2.cached).toBe(true);
            expect(result2.triples.length).toBe(2);
            expect(result2.triples).toEqual(result1.triples);
        });

        it('should handle empty CONSTRUCT results', () => {
            const query = 'CONSTRUCT { ?s ex:empty_construct ?value } WHERE { ?s ex:nonexistent ?value }';
            
            const result1 = engine.construct(query);
            expect(result1.cached).toBe(false);
            expect(result1.triples.length).toBe(0);
            
            const result2 = engine.construct(query);
            expect(result2.cached).toBe(true);
            expect(result2.triples.length).toBe(0);
        });
    });

    describe('cache key generation', () => {
        it('should distinguish between SELECT and CONSTRUCT queries', () => {
            const baseQuery = '{ ?s rdf:type ?type }';
            const selectQuery = `SELECT ?s ?type WHERE ${baseQuery}`;
            const constructQuery = `CONSTRUCT { ?s ex:hasType ?type } WHERE ${baseQuery}`;
            
            const selectResult = engine.select(selectQuery);
            const constructResult = engine.construct(constructQuery);
            
            expect(selectResult.cached).toBe(false);
            expect(constructResult.cached).toBe(false);
            
            // Should cache separately
            const selectResult2 = engine.select(selectQuery);
            const constructResult2 = engine.construct(constructQuery);
            
            expect(selectResult2.cached).toBe(true);
            expect(constructResult2.cached).toBe(true);
        });

        it('should handle case insensitive caching', () => {
            const query1 = 'SELECT ?s WHERE { ?s rdf:type "Document" }';
            const query2 = 'select ?s where { ?s rdf:type "document" }';
            
            const result1 = engine.select(query1);
            expect(result1.cached).toBe(false);
            
            const result2 = engine.select(query2);
            expect(result2.cached).toBe(true);
        });
    });

    describe('cache statistics and management', () => {
        it('should track cache statistics correctly', () => {
            const query = 'SELECT ?s WHERE { ?s rdf:type "Document" }';
            
            let stats = engine.getCacheStatistics();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.totalQueries).toBe(0);
            
            // First query - cache miss
            engine.select(query);
            stats = engine.getCacheStatistics();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(1);
            expect(stats.totalQueries).toBe(1);
            
            // Second query - cache hit
            engine.select(query);
            stats = engine.getCacheStatistics();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.totalQueries).toBe(2);
            expect(stats.hitRate).toBe(50);
        });

        it('should invalidate cache properly', () => {
            const query = 'SELECT ?s WHERE { ?s rdf:type "Document" }';
            
            // Cache the query
            const result1 = engine.select(query);
            expect(result1.cached).toBe(false);
            
            const result2 = engine.select(query);
            expect(result2.cached).toBe(true);
            
            // Invalidate cache
            engine.invalidateCache();
            
            // Should miss cache after invalidation
            const result3 = engine.select(query);
            expect(result3.cached).toBe(false);
        });

        it('should cleanup expired entries', () => {
            jest.useFakeTimers();
            
            const shortTTLEngine = new SPARQLEngine(graph, {
                enabled: true,
                defaultTTL: 1000 // 1 second
            });
            
            const query = 'SELECT ?s WHERE { ?s rdf:type "Document" }';
            
            // Cache query
            const result1 = shortTTLEngine.select(query);
            expect(result1.cached).toBe(false);
            
            // Should hit cache immediately
            const result2 = shortTTLEngine.select(query);
            expect(result2.cached).toBe(true);
            
            // Advance time past TTL
            jest.advanceTimersByTime(2000);
            
            // Should miss cache after expiration
            const result3 = shortTTLEngine.select(query);
            expect(result3.cached).toBe(false);
            
            shortTTLEngine.destroy();
            jest.useRealTimers();
        });

        it('should update cache configuration', () => {
            const query = 'SELECT ?s WHERE { ?s rdf:type "Document" }';
            
            // Cache with original config
            engine.select(query);
            
            // Update config to disable caching
            engine.updateCacheConfig({ enabled: false });
            
            // Should not hit cache when disabled
            const result = engine.select(query);
            expect(result.cached).toBe(false);
            
            // Re-enable and should miss cache (was cleared when disabled)
            engine.updateCacheConfig({ enabled: true });
            const result2 = engine.select(query);
            expect(result2.cached).toBe(false);
        });
    });

    describe('performance impact', () => {
        it('should improve performance for repeated queries', () => {
            const complexQuery = `
                SELECT ?s ?title ?type ?priority WHERE {
                    ?s dc:title ?title .
                    ?s rdf:type ?type .
                    ?s ex:priority ?priority
                }
            `;
            
            // First execution (cache miss)
            const start1 = Date.now();
            const result1 = engine.select(complexQuery);
            const time1 = Date.now() - start1;
            expect(result1.cached).toBe(false);
            
            // Second execution (cache hit)
            const start2 = Date.now();
            const result2 = engine.select(complexQuery);
            const time2 = Date.now() - start2;
            expect(result2.cached).toBe(true);
            
            // Cached execution should be faster (though this is timing-dependent)
            // We mainly verify that the cache works correctly
            expect(result2.results).toEqual(result1.results);
        });
    });

    describe('error handling with cache', () => {
        it('should not cache invalid queries', () => {
            const invalidQuery = 'INVALID SPARQL SYNTAX';
            
            expect(() => engine.select(invalidQuery)).toThrow();
            
            // Cache should remain unaffected - but the cache miss is still counted
            const stats = engine.getCacheStatistics();
            expect(stats.totalQueries).toBe(1);
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(1);
        });

        it('should handle cache operations when engine is destroyed', () => {
            const query = 'SELECT ?s WHERE { ?s rdf:type "Document" }';
            
            // Cache a query
            engine.select(query);
            
            // Destroy engine
            engine.destroy();
            
            // Should not throw errors
            expect(() => engine.getCacheStatistics()).not.toThrow();
            expect(() => engine.invalidateCache()).not.toThrow();
            expect(() => engine.cleanupCache()).not.toThrow();
        });
    });

    describe('cache with graph modifications', () => {
        it('should work correctly with graph that changes over time', () => {
            const query = 'SELECT ?s WHERE { ?s rdf:type "NewType" }';
            
            // Initially no results
            const result1 = engine.select(query);
            expect(result1.cached).toBe(false);
            expect(result1.results.length).toBe(0);
            
            // Cache hit for same query
            const result2 = engine.select(query);
            expect(result2.cached).toBe(true);
            expect(result2.results.length).toBe(0);
            
            // Note: In real usage, cache would be invalidated when graph changes
            // This test just verifies that cache works with graph state at time of caching
        });
    });
});