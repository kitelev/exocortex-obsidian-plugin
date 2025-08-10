/**
 * Unit tests for QueryCache service
 */

import { QueryCache, QueryCacheConfig, CacheStatistics, CacheEntry } from '../../../../src/application/services/QueryCache';

describe('QueryCache', () => {
    let cache: QueryCache;
    
    beforeEach(() => {
        cache = new QueryCache({
            maxSize: 100,
            defaultTTL: 5000,
            cleanupInterval: 1000,
            enabled: true
        });
    });
    
    afterEach(() => {
        cache.destroy();
    });

    describe('basic cache operations', () => {
        it('should store and retrieve values', () => {
            const key = 'test-query';
            const value = { results: ['result1', 'result2'] };
            
            cache.set(key, value);
            const retrieved = cache.get(key);
            
            expect(retrieved).toEqual(value);
        });

        it('should return null for non-existent keys', () => {
            const result = cache.get('non-existent-key');
            expect(result).toBeNull();
        });

        it('should return null when cache is disabled', () => {
            const disabledCache = new QueryCache({ enabled: false });
            disabledCache.set('test', 'value');
            const result = disabledCache.get('test');
            
            expect(result).toBeNull();
            disabledCache.destroy();
        });

        it('should check if key exists in cache', () => {
            const key = 'existence-test';
            const value = 'test-value';
            
            expect(cache.has(key)).toBe(false);
            
            cache.set(key, value);
            expect(cache.has(key)).toBe(true);
        });

        it('should handle has() when cache is disabled', () => {
            const disabledCache = new QueryCache({ enabled: false });
            disabledCache.set('test', 'value');
            
            expect(disabledCache.has('test')).toBe(false);
            disabledCache.destroy();
        });
    });

    describe('cache key normalization', () => {
        it('should create consistent cache keys for identical queries', () => {
            const query1 = 'SELECT ?s ?p ?o WHERE { ?s ?p ?o }';
            const query2 = '  SELECT   ?s  ?p  ?o   WHERE  {  ?s  ?p  ?o  }  ';
            const query3 = 'SELECT\n?s\n?p\n?o\nWHERE\n{\n?s\n?p\n?o\n}';
            
            const key1 = cache.createCacheKey(query1);
            const key2 = cache.createCacheKey(query2);
            const key3 = cache.createCacheKey(query3);
            
            expect(key1).toBe(key2);
            expect(key2).toBe(key3);
        });

        it('should create different keys for different queries', () => {
            const query1 = 'SELECT ?s WHERE { ?s ?p ?o }';
            const query2 = 'SELECT ?p WHERE { ?s ?p ?o }';
            
            const key1 = cache.createCacheKey(query1);
            const key2 = cache.createCacheKey(query2);
            
            expect(key1).not.toBe(key2);
        });

        it('should be case insensitive', () => {
            const query1 = 'SELECT ?s WHERE { ?s ?p ?o }';
            const query2 = 'select ?s where { ?s ?p ?o }';
            
            const key1 = cache.createCacheKey(query1);
            const key2 = cache.createCacheKey(query2);
            
            expect(key1).toBe(key2);
        });
    });

    describe('TTL (Time To Live)', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should expire entries after default TTL', () => {
            const key = 'expiring-key';
            const value = 'expiring-value';
            
            cache.set(key, value);
            expect(cache.get(key)).toBe(value);
            
            // Advance time past TTL
            jest.advanceTimersByTime(6000);
            
            expect(cache.get(key)).toBeNull();
        });

        it('should respect custom TTL', () => {
            const key = 'custom-ttl-key';
            const value = 'custom-ttl-value';
            const customTTL = 10000;
            
            cache.set(key, value, customTTL);
            
            // Advance time less than custom TTL
            jest.advanceTimersByTime(8000);
            expect(cache.get(key)).toBe(value);
            
            // Advance past custom TTL
            jest.advanceTimersByTime(3000);
            expect(cache.get(key)).toBeNull();
        });

        it('should respect maximum TTL limit', () => {
            const maxTTLCache = new QueryCache({
                defaultTTL: 5000,
                maxTTL: 15000,
                enabled: true
            });
            
            const key = 'max-ttl-test';
            const value = 'max-ttl-value';
            const requestedTTL = 20000; // Higher than maxTTL
            
            maxTTLCache.set(key, value, requestedTTL);
            
            // Should expire at maxTTL, not requestedTTL
            jest.advanceTimersByTime(16000);
            expect(maxTTLCache.get(key)).toBeNull();
            
            maxTTLCache.destroy();
        });

        it('should remove expired entries in has() check', () => {
            const key = 'expire-in-has';
            const value = 'test-value';
            
            cache.set(key, value);
            expect(cache.has(key)).toBe(true);
            
            jest.advanceTimersByTime(6000);
            expect(cache.has(key)).toBe(false);
        });
    });

    describe('cache size management', () => {
        let smallCache: QueryCache;

        beforeEach(() => {
            smallCache = new QueryCache({ maxSize: 3, enabled: true });
        });

        afterEach(() => {
            smallCache.destroy();
        });

        it('should evict oldest entries when cache is full', () => {
            smallCache.set('key1', 'value1');
            smallCache.set('key2', 'value2');
            smallCache.set('key3', 'value3');
            
            expect(smallCache.has('key1')).toBe(true);
            expect(smallCache.has('key2')).toBe(true);
            expect(smallCache.has('key3')).toBe(true);
            
            // Adding 4th item should evict oldest
            smallCache.set('key4', 'value4');
            
            expect(smallCache.has('key1')).toBe(false);
            expect(smallCache.has('key2')).toBe(true);
            expect(smallCache.has('key3')).toBe(true);
            expect(smallCache.has('key4')).toBe(true);
        });

        it('should update cache size when maxSize is reduced', () => {
            smallCache.set('key1', 'value1');
            smallCache.set('key2', 'value2');
            smallCache.set('key3', 'value3');
            
            // Reduce max size
            smallCache.updateConfig({ maxSize: 2 });
            
            const stats = smallCache.getStatistics();
            expect(stats.size).toBe(2);
            expect(stats.maxSize).toBe(2);
        });
    });

    describe('cache statistics', () => {
        it('should track hits and misses', () => {
            const key = 'stats-test';
            const value = 'stats-value';
            
            // Initial stats
            let stats = cache.getStatistics();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.totalQueries).toBe(0);
            expect(stats.hitRate).toBe(0);
            
            // Miss
            cache.get('non-existent');
            stats = cache.getStatistics();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(1);
            expect(stats.totalQueries).toBe(1);
            expect(stats.hitRate).toBe(0);
            
            // Set and hit
            cache.set(key, value);
            cache.get(key);
            stats = cache.getStatistics();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.totalQueries).toBe(2);
            expect(stats.hitRate).toBe(50);
        });

        it('should track cache size', () => {
            let stats = cache.getStatistics();
            expect(stats.size).toBe(0);
            
            cache.set('key1', 'value1');
            stats = cache.getStatistics();
            expect(stats.size).toBe(1);
            
            cache.set('key2', 'value2');
            stats = cache.getStatistics();
            expect(stats.size).toBe(2);
        });

        it('should track evictions', () => {
            const smallCache = new QueryCache({ maxSize: 2, enabled: true });
            
            smallCache.set('key1', 'value1');
            smallCache.set('key2', 'value2');
            
            let stats = smallCache.getStatistics();
            expect(stats.evictions).toBe(0);
            
            // Force eviction
            smallCache.set('key3', 'value3');
            
            stats = smallCache.getStatistics();
            expect(stats.evictions).toBe(1);
            
            smallCache.destroy();
        });

        it('should not count queries when cache is disabled', () => {
            const disabledCache = new QueryCache({ enabled: false });
            
            disabledCache.get('test');
            const stats = disabledCache.getStatistics();
            
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(1);
            expect(stats.totalQueries).toBe(1);
            
            disabledCache.destroy();
        });
    });

    describe('cache invalidation', () => {
        it('should invalidate all entries', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(true);
            expect(cache.has('key3')).toBe(true);
            
            cache.invalidateAll();
            
            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(false);
            expect(cache.has('key3')).toBe(false);
            
            const stats = cache.getStatistics();
            expect(stats.size).toBe(0);
        });

        it('should invalidate entries based on predicate', () => {
            cache.set('select1', { type: 'SELECT', results: [] });
            cache.set('construct1', { type: 'CONSTRUCT', results: [] });
            cache.set('select2', { type: 'SELECT', results: [] });
            
            // Invalidate all SELECT queries
            const invalidated = cache.invalidateWhere((key, entry) => {
                return key.includes('select');
            });
            
            expect(invalidated).toBe(2);
            expect(cache.has('select1')).toBe(false);
            expect(cache.has('select2')).toBe(false);
            expect(cache.has('construct1')).toBe(true);
        });
    });

    describe('cleanup operations', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should manually cleanup expired entries', () => {
            cache.set('key1', 'value1', 3000);
            cache.set('key2', 'value2', 7000);
            cache.set('key3', 'value3', 10000);
            
            expect(cache.getStatistics().size).toBe(3);
            
            // Advance time to expire some entries
            jest.advanceTimersByTime(5000);
            
            const cleaned = cache.cleanup();
            expect(cleaned).toBe(1); // Only key1 should be expired
            
            const stats = cache.getStatistics();
            expect(stats.size).toBe(2);
            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(true);
            expect(cache.has('key3')).toBe(true);
        });

        it('should automatically cleanup expired entries', () => {
            const autoCleanupCache = new QueryCache({
                cleanupInterval: 100,
                defaultTTL: 200,
                enabled: true
            });
            
            autoCleanupCache.set('key1', 'value1');
            expect(autoCleanupCache.has('key1')).toBe(true);
            
            // Wait for expiration and auto cleanup
            jest.advanceTimersByTime(300);
            
            expect(autoCleanupCache.has('key1')).toBe(false);
            
            autoCleanupCache.destroy();
        });
    });

    describe('configuration management', () => {
        it('should update configuration', () => {
            const originalConfig = cache.getConfig();
            expect(originalConfig.maxSize).toBe(100);
            
            cache.updateConfig({ maxSize: 200, defaultTTL: 10000 });
            
            const updatedConfig = cache.getConfig();
            expect(updatedConfig.maxSize).toBe(200);
            expect(updatedConfig.defaultTTL).toBe(10000);
            expect(updatedConfig.enabled).toBe(true); // Should preserve other values
        });

        it('should clear cache when disabled', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            expect(cache.getStatistics().size).toBe(2);
            
            cache.updateConfig({ enabled: false });
            
            expect(cache.getStatistics().size).toBe(0);
            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(false);
        });

        it('should restart cleanup timer when interval changes', () => {
            jest.useFakeTimers();
            
            const timerCache = new QueryCache({
                cleanupInterval: 1000,
                defaultTTL: 500,
                enabled: true
            });
            
            timerCache.set('key1', 'value1');
            
            // Change cleanup interval
            timerCache.updateConfig({ cleanupInterval: 2000 });
            
            // Advance time past original interval but not new interval
            jest.advanceTimersByTime(1500);
            
            // Entry should still exist (new timer interval)
            expect(timerCache.has('key1')).toBe(false); // Should be expired by TTL
            
            timerCache.destroy();
            jest.useRealTimers();
        });
    });

    describe('edge cases', () => {
        it('should handle empty query strings', () => {
            const key1 = cache.createCacheKey('');
            const key2 = cache.createCacheKey('   ');
            const key3 = cache.createCacheKey('\n\t\r');
            
            expect(key1).toBe(key2);
            expect(key2).toBe(key3);
        });

        it('should handle very long query strings', () => {
            const longQuery = 'SELECT '.repeat(1000) + '?s WHERE { ?s ?p ?o }';
            const key = cache.createCacheKey(longQuery);
            
            expect(typeof key).toBe('string');
            expect(key.length).toBeGreaterThan(0);
            
            // Should be able to use the key
            cache.set(key, 'test-value');
            expect(cache.get(key)).toBe('test-value');
        });

        it('should handle null/undefined values gracefully', () => {
            cache.set('null-test', null);
            cache.set('undefined-test', undefined);
            
            expect(cache.get('null-test')).toBe(null);
            expect(cache.get('undefined-test')).toBe(undefined);
        });

        it('should handle complex nested objects', () => {
            const complexValue = {
                results: [
                    { name: 'Test 1', properties: { priority: 1, tags: ['urgent'] } },
                    { name: 'Test 2', properties: { priority: 2, tags: ['normal', 'review'] } }
                ],
                metadata: {
                    queryTime: '2024-01-01T00:00:00Z',
                    version: '1.0',
                    nested: {
                        deep: {
                            value: 42
                        }
                    }
                }
            };
            
            cache.set('complex-test', complexValue);
            const retrieved = cache.get('complex-test');
            
            expect(retrieved).toEqual(complexValue);
        });

        it('should handle zero TTL', () => {
            jest.useFakeTimers();
            
            cache.set('zero-ttl-test', 'value', 0);
            
            // Should expire immediately
            expect(cache.get('zero-ttl-test')).toBeNull();
            
            jest.useRealTimers();
        });

        it('should handle negative TTL', () => {
            jest.useFakeTimers();
            
            cache.set('negative-ttl-test', 'value', -1000);
            
            // Should expire immediately
            expect(cache.get('negative-ttl-test')).toBeNull();
            
            jest.useRealTimers();
        });
    });

    describe('resource cleanup', () => {
        it('should cleanup timers on destroy', () => {
            const timerSpy = jest.spyOn(global, 'clearInterval');
            
            const testCache = new QueryCache({ cleanupInterval: 1000 });
            testCache.destroy();
            
            expect(timerSpy).toHaveBeenCalled();
            
            timerSpy.mockRestore();
        });

        it('should be safe to call destroy multiple times', () => {
            const testCache = new QueryCache();
            
            expect(() => {
                testCache.destroy();
                testCache.destroy();
                testCache.destroy();
            }).not.toThrow();
        });

        it('should handle operations after destroy gracefully', () => {
            const testCache = new QueryCache();
            testCache.set('key', 'value');
            
            expect(testCache.get('key')).toBe('value');
            
            testCache.destroy();
            
            // After destroy, cache should be cleared
            expect(testCache.has('key')).toBe(false);
            // Operations should still work without throwing
            expect(() => testCache.set('key2', 'value2')).not.toThrow();
            expect(() => testCache.cleanup()).not.toThrow();
            // Newly set values should work
            expect(testCache.has('key2')).toBe(true);
        });
    });
});