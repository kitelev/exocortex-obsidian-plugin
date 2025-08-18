/**
 * SPARQL Query Complexity Analyzer
 * Implements security controls to prevent DoS attacks through resource exhaustion
 * 
 * Security Features:
 * - Query cost estimation algorithms
 * - Complexity thresholds for different query types
 * - Memory and time complexity analysis
 * - Resource exhaustion prevention
 */

import { Result } from '../../domain/core/Result';

export interface ComplexityMetrics {
    estimatedCost: number;
    timeComplexity: 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2^n)';
    memoryComplexity: 'low' | 'medium' | 'high' | 'extreme';
    triplePatterns: number;
    joinComplexity: number;
    filterComplexity: number;
    unionComplexity: number;
    subqueryDepth: number;
    estimatedMemoryMB: number;
    estimatedExecutionTimeMs: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplexityThresholds {
    maxCost: number;
    maxTriplePatterns: number;
    maxJoinComplexity: number;
    maxSubqueryDepth: number;
    maxEstimatedMemoryMB: number;
    maxExecutionTimeMs: number;
    allowedTimeComplexity: string[];
}

export interface QueryAnalysisResult {
    allowed: boolean;
    metrics: ComplexityMetrics;
    violations: string[];
    recommendations: string[];
}

export class QueryComplexityAnalyzer {
    private readonly defaultThresholds: ComplexityThresholds = {
        maxCost: 1000,
        maxTriplePatterns: 50,
        maxJoinComplexity: 25,
        maxSubqueryDepth: 3,
        maxEstimatedMemoryMB: 100,
        maxExecutionTimeMs: 30000, // 30 seconds
        allowedTimeComplexity: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)']
    };

    private mergedThresholds: ComplexityThresholds;

    constructor(thresholds: Partial<ComplexityThresholds> = {}) {
        this.mergedThresholds = { ...this.defaultThresholds, ...thresholds };
    }

    /**
     * Analyze query complexity and determine if execution should be allowed
     */
    analyzeQuery(query: string): Result<QueryAnalysisResult> {
        try {
            const metrics = this.calculateComplexityMetrics(query);
            const violations = this.checkViolations(metrics);
            const recommendations = this.generateRecommendations(metrics, violations);

            return Result.ok({
                allowed: violations.length === 0,
                metrics,
                violations,
                recommendations
            });
        } catch (error) {
            return Result.fail(`Query analysis failed: ${error.message}`);
        }
    }

    /**
     * Calculate comprehensive complexity metrics for a SPARQL query
     */
    private calculateComplexityMetrics(query: string): ComplexityMetrics {
        const normalizedQuery = query.toUpperCase();
        
        // Basic pattern counting
        const triplePatterns = this.countTriplePatterns(query);
        const unions = this.countUnions(normalizedQuery);
        const subqueryDepth = this.calculateSubqueryDepth(query);
        const filters = this.countFilters(normalizedQuery);
        
        // Advanced complexity metrics
        const joinComplexity = this.calculateJoinComplexity(query);
        const filterComplexity = this.calculateFilterComplexity(query);
        const unionComplexity = this.calculateUnionComplexity(unions);
        
        // Cost estimation using weighted factors
        const baseCost = triplePatterns * 10;
        const joinCost = joinComplexity * 20;
        const filterCost = filterComplexity * 15;
        const unionCost = unionComplexity * 30;
        const subqueryCost = Math.pow(2, subqueryDepth) * 50;
        
        const estimatedCost = baseCost + joinCost + filterCost + unionCost + subqueryCost;
        
        // Time complexity estimation
        const timeComplexity = this.estimateTimeComplexity(triplePatterns, joinComplexity, subqueryDepth);
        
        // Memory estimation based on expected result size and intermediate tables
        const estimatedMemoryMB = this.estimateMemoryUsage(triplePatterns, joinComplexity, unions);
        
        // Execution time estimation (heuristic)
        const estimatedExecutionTimeMs = this.estimateExecutionTime(estimatedCost, joinComplexity);
        
        // Memory complexity classification
        const memoryComplexity = this.classifyMemoryComplexity(estimatedMemoryMB);
        
        // Overall risk assessment
        const riskLevel = this.assessRiskLevel(estimatedCost, timeComplexity, estimatedMemoryMB);

        return {
            estimatedCost,
            timeComplexity,
            memoryComplexity,
            triplePatterns,
            joinComplexity,
            filterComplexity,
            unionComplexity,
            subqueryDepth,
            estimatedMemoryMB,
            estimatedExecutionTimeMs,
            riskLevel
        };
    }

    /**
     * Count triple patterns in the query
     */
    private countTriplePatterns(query: string): number {
        // Remove string literals to avoid false positives
        const withoutStrings = query.replace(/"[^"]*"/g, '""');
        
        // Count patterns by looking for subject predicate object sequences
        // This is a simplified heuristic - real implementation would use proper parsing
        const patterns = withoutStrings.match(/\?[a-zA-Z0-9_]+\s+[^\s]+\s+[^\s]+[\s]*[\.;]/g) || [];
        const explicitPatterns = withoutStrings.match(/[<>a-zA-Z0-9_:]+\s+[<>a-zA-Z0-9_:]+\s+[<>a-zA-Z0-9_:?"]+[\s]*[\.;]/g) || [];
        
        return patterns.length + explicitPatterns.length;
    }

    /**
     * Count UNION operations
     */
    private countUnions(normalizedQuery: string): number {
        return (normalizedQuery.match(/\bUNION\b/g) || []).length;
    }

    /**
     * Calculate maximum subquery depth
     */
    private calculateSubqueryDepth(query: string): number {
        let maxDepth = 0;
        let currentDepth = 0;
        let inSubquery = false;

        for (let i = 0; i < query.length; i++) {
            const remaining = query.substring(i).toUpperCase();
            
            if (remaining.startsWith('SELECT') || remaining.startsWith('CONSTRUCT')) {
                if (currentDepth > 0) {
                    inSubquery = true;
                }
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (query[i] === '{') {
                if (inSubquery) {
                    currentDepth++;
                    maxDepth = Math.max(maxDepth, currentDepth);
                }
            } else if (query[i] === '}') {
                if (inSubquery && currentDepth > 0) {
                    currentDepth--;
                }
            }
        }

        return Math.max(0, maxDepth - 1); // Subtract 1 for the main query
    }

    /**
     * Count FILTER operations
     */
    private countFilters(normalizedQuery: string): number {
        return (normalizedQuery.match(/\bFILTER\b/g) || []).length;
    }

    /**
     * Calculate join complexity based on variable sharing between patterns
     */
    private calculateJoinComplexity(query: string): number {
        const variables = new Set<string>();
        const variableMatches = query.matchAll(/\?([a-zA-Z0-9_]+)/g);
        
        for (const match of variableMatches) {
            variables.add(match[1]);
        }
        
        // Estimate join complexity based on number of shared variables
        // This is a simplified heuristic
        const triplePatterns = this.countTriplePatterns(query);
        const variableCount = variables.size;
        
        if (triplePatterns <= 1) return 0;
        
        // More variables relative to patterns suggests more joins
        return Math.min(triplePatterns * variableCount / 3, 100);
    }

    /**
     * Calculate filter complexity based on filter expressions
     */
    private calculateFilterComplexity(query: string): number {
        const filters = query.match(/FILTER\s*\([^)]+\)/gi) || [];
        let complexity = 0;
        
        for (const filter of filters) {
            // Check for expensive operations
            if (filter.includes('REGEX')) complexity += 10;
            if (filter.includes('STR') || filter.includes('STRLEN')) complexity += 5;
            if (filter.includes('&&') || filter.includes('||')) complexity += 3;
            if (filter.includes('>') || filter.includes('<')) complexity += 2;
            complexity += 1; // Base complexity for each filter
        }
        
        return complexity;
    }

    /**
     * Calculate union complexity
     */
    private calculateUnionComplexity(unionCount: number): number {
        // Union complexity grows exponentially with nested unions
        return unionCount > 0 ? Math.pow(2, Math.min(unionCount, 5)) : 0;
    }

    /**
     * Estimate time complexity category
     */
    private estimateTimeComplexity(
        triplePatterns: number, 
        joinComplexity: number, 
        subqueryDepth: number
    ): ComplexityMetrics['timeComplexity'] {
        if (subqueryDepth > 2) return 'O(2^n)';
        if (joinComplexity > 50 || triplePatterns > 20) return 'O(n²)';
        if (joinComplexity > 10 || triplePatterns > 10) return 'O(n log n)';
        if (triplePatterns > 3) return 'O(n)';
        if (triplePatterns > 1) return 'O(log n)';
        return 'O(1)';
    }

    /**
     * Estimate memory usage in MB
     */
    private estimateMemoryUsage(triplePatterns: number, joinComplexity: number, unions: number): number {
        // Base memory for query execution
        let memory = 1;
        
        // Memory for triple pattern results (estimated 1KB per result, 100 results per pattern)
        memory += triplePatterns * 0.1;
        
        // Memory for join operations (intermediate tables)
        memory += joinComplexity * 0.5;
        
        // Memory for union operations
        memory += unions * 2;
        
        return Math.round(memory * 100) / 100;
    }

    /**
     * Estimate execution time in milliseconds
     */
    private estimateExecutionTime(cost: number, joinComplexity: number): number {
        // Base time + cost-based scaling + join penalty
        const baseTime = 10; // 10ms base
        const costTime = cost * 0.5; // 0.5ms per cost unit
        const joinTime = joinComplexity * 50; // 50ms per join complexity unit
        
        return Math.round(baseTime + costTime + joinTime);
    }

    /**
     * Classify memory complexity
     */
    private classifyMemoryComplexity(memoryMB: number): ComplexityMetrics['memoryComplexity'] {
        if (memoryMB > 50) return 'extreme';
        if (memoryMB > 20) return 'high';
        if (memoryMB > 5) return 'medium';
        return 'low';
    }

    /**
     * Assess overall risk level
     */
    private assessRiskLevel(
        cost: number, 
        timeComplexity: string, 
        memoryMB: number
    ): ComplexityMetrics['riskLevel'] {
        if (cost > 800 || timeComplexity === 'O(2^n)' || memoryMB > 50) return 'critical';
        if (cost > 500 || timeComplexity === 'O(n²)' || memoryMB > 20) return 'high';
        if (cost > 200 || timeComplexity === 'O(n log n)' || memoryMB > 5) return 'medium';
        return 'low';
    }

    /**
     * Check for threshold violations
     */
    private checkViolations(metrics: ComplexityMetrics): string[] {
        const violations: string[] = [];

        if (metrics.estimatedCost > this.mergedThresholds.maxCost) {
            violations.push(`Estimated cost (${metrics.estimatedCost}) exceeds maximum (${this.mergedThresholds.maxCost})`);
        }

        if (metrics.triplePatterns > this.mergedThresholds.maxTriplePatterns) {
            violations.push(`Triple patterns (${metrics.triplePatterns}) exceed maximum (${this.mergedThresholds.maxTriplePatterns})`);
        }

        if (metrics.joinComplexity > this.mergedThresholds.maxJoinComplexity) {
            violations.push(`Join complexity (${metrics.joinComplexity}) exceeds maximum (${this.mergedThresholds.maxJoinComplexity})`);
        }

        if (metrics.subqueryDepth > this.mergedThresholds.maxSubqueryDepth) {
            violations.push(`Subquery depth (${metrics.subqueryDepth}) exceeds maximum (${this.mergedThresholds.maxSubqueryDepth})`);
        }

        if (metrics.estimatedMemoryMB > this.mergedThresholds.maxEstimatedMemoryMB) {
            violations.push(`Estimated memory (${metrics.estimatedMemoryMB}MB) exceeds maximum (${this.mergedThresholds.maxEstimatedMemoryMB}MB)`);
        }

        if (metrics.estimatedExecutionTimeMs > this.mergedThresholds.maxExecutionTimeMs) {
            violations.push(`Estimated execution time (${metrics.estimatedExecutionTimeMs}ms) exceeds maximum (${this.mergedThresholds.maxExecutionTimeMs}ms)`);
        }

        if (!this.mergedThresholds.allowedTimeComplexity.includes(metrics.timeComplexity)) {
            violations.push(`Time complexity (${metrics.timeComplexity}) not allowed`);
        }

        return violations;
    }

    /**
     * Generate optimization recommendations
     */
    private generateRecommendations(metrics: ComplexityMetrics, violations: string[]): string[] {
        const recommendations: string[] = [];

        if (violations.length === 0) {
            return ['Query complexity is within acceptable limits'];
        }

        if (metrics.triplePatterns > 20) {
            recommendations.push('Consider reducing the number of triple patterns');
            recommendations.push('Use LIMIT clause to restrict result size');
        }

        if (metrics.joinComplexity > 15) {
            recommendations.push('Simplify joins by reducing shared variables');
            recommendations.push('Break complex query into smaller parts');
        }

        if (metrics.subqueryDepth > 2) {
            recommendations.push('Reduce subquery nesting depth');
            recommendations.push('Consider rewriting as multiple simpler queries');
        }

        if (metrics.filterComplexity > 10) {
            recommendations.push('Simplify FILTER expressions');
            recommendations.push('Move filters closer to data sources');
        }

        if (metrics.unionComplexity > 8) {
            recommendations.push('Reduce number of UNION operations');
            recommendations.push('Consider alternative query patterns');
        }

        if (metrics.riskLevel === 'critical' || metrics.riskLevel === 'high') {
            recommendations.push('This query poses security risks - consider major restructuring');
        }

        return recommendations;
    }

    /**
     * Update complexity thresholds
     */
    updateThresholds(newThresholds: Partial<ComplexityThresholds>): void {
        this.mergedThresholds = { ...this.mergedThresholds, ...newThresholds };
    }

    /**
     * Get current thresholds
     */
    getThresholds(): ComplexityThresholds {
        return { ...this.mergedThresholds };
    }
}