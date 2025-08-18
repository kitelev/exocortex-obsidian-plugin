/**
 * Enhanced SPARQL Validator with Advanced Security Controls
 * Extends the existing SPARQLSanitizer with additional security measures
 * 
 * Security Features:
 * - Advanced IRI validation patterns
 * - Multi-layer injection prevention
 * - Semantic attack detection
 * - Resource URI validation
 * - Query structure integrity checks
 * - Context-aware validation rules
 */

import { Result } from '../../domain/core/Result';
import { SPARQLSanitizer, SanitizationResult } from '../../application/services/SPARQLSanitizer';

export interface ValidationRule {
    name: string;
    pattern: RegExp | ((query: string) => boolean);
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    recommendation?: string;
}

export interface EnhancedValidationResult extends SanitizationResult {
    allowed: boolean; // Whether the query is allowed to execute
    securityScore: number; // 0-100, higher is more secure
    detectedThreats: ThreatDetection[];
    contextualWarnings: string[];
    structuralIssues: string[];
}

export interface ThreatDetection {
    type: 'injection' | 'traversal' | 'enumeration' | 'dos' | 'information_disclosure';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence: string;
    mitigation: string;
}

export class EnhancedSPARQLValidator extends SPARQLSanitizer {
    private readonly enhancedValidationRules: ValidationRule[] = [
        // Advanced injection patterns
        {
            name: 'SQL_INJECTION_ATTEMPT',
            pattern: (query: string) => {
                // Only flag actual SQL injection patterns, not legitimate SPARQL
                // SPARQL uses different keywords and syntax than SQL
                const sqlPatterns = [
                    /['"];\s*(DROP|DELETE|INSERT|UPDATE|ALTER)\s+/gi,
                    /UNION\s+SELECT.*FROM/gi, // SQL UNION pattern
                    /--\s*[^\r\n]*?(DROP|DELETE|INSERT)/gi, // SQL comments with dangerous commands
                    /\/\*.*?(DROP|DELETE|INSERT).*?\*\//gi  // SQL block comments with dangerous commands
                ];
                return sqlPatterns.some(pattern => pattern.test(query));
            },
            severity: 'critical',
            message: 'SQL injection pattern detected',
            recommendation: 'Use parameterized queries and proper escaping'
        },
        {
            name: 'SPARQL_INJECTION_NESTED',
            pattern: /\{\s*(SELECT|CONSTRUCT|ASK|DESCRIBE)\s+.*\{\s*(SELECT|CONSTRUCT|ASK|DESCRIBE)/gi,
            severity: 'critical',
            message: 'Potentially malicious nested query structure',
            recommendation: 'Validate subquery legitimacy'
        },
        {
            name: 'COMMAND_INJECTION',
            pattern: (query: string) => {
                // Only flag command injection if we see shell-like patterns
                // Allow normal SPARQL syntax that might contain semicolons, braces, etc.
                const suspiciousPatterns = [
                    /&&\s*[a-zA-Z_]/,  // Shell AND
                    /\|\|\s*[a-zA-Z_]/, // Shell OR  
                    /`[^`]*`/,         // Backticks (command substitution)
                    /\$\([^)]*\)/,     // Command substitution
                    /;\s*(rm|cat|ls|echo|curl|wget|bash|sh)\s/i // Shell commands after semicolon
                ];
                return suspiciousPatterns.some(pattern => pattern.test(query));
            },
            severity: 'critical',
            message: 'Command injection patterns detected',
            recommendation: 'Remove or escape special shell characters'
        },
        
        // Advanced path traversal patterns
        {
            name: 'PATH_TRAVERSAL_ENCODED',
            pattern: /%2e%2e[%2f%5c]|\.\.[\/%5c]|%252e%252e/gi,
            severity: 'critical',
            message: 'Encoded path traversal attempt detected',
            recommendation: 'Validate and sanitize all URI components'
        },
        {
            name: 'WINDOWS_PATH_TRAVERSAL',
            pattern: /\.\.[\\\/]|[A-Za-z]:[\\\/]/g,
            severity: 'critical',
            message: 'Windows path traversal pattern detected'
        },
        {
            name: 'UNIX_PATH_TRAVERSAL',
            pattern: /\/\.\.|\.\.\/|~\/|\/etc\/|\/var\/|\/tmp\//g,
            severity: 'critical',
            message: 'Unix path traversal pattern detected'
        },
        
        // Resource enumeration attempts (reduced severity)
        {
            name: 'RESOURCE_ENUMERATION',
            pattern: (query: string) => {
                // Only flag if there are many enumeration patterns without any LIMIT
                const enumerationPatterns = query.match(/\?\w+\s+(rdf:type|rdfs:label|owl:sameAs)\s+\?\w+/gi);
                const hasLimit = /LIMIT\s+\d+/i.test(query);
                return enumerationPatterns && enumerationPatterns.length > 3 && !hasLimit;
            },
            severity: 'info',
            message: 'Multiple resource enumeration patterns without LIMIT',
            recommendation: 'Consider adding LIMIT clause for better performance'
        },
        {
            name: 'BROAD_PROPERTY_SCAN',
            pattern: (query: string) => {
                // Only flag very broad scans without any specificity and without LIMIT
                const broadPatterns = query.match(/\?\w+\s+\?\w+\s+\?\w+/g);
                const hasSpecificConstraints = /\.\s*\?\w+\s+(\w+:|<[^>]+>)/i.test(query);
                const hasLimit = /LIMIT\s+\d+/i.test(query);
                return broadPatterns && broadPatterns.length > 1 && !hasSpecificConstraints && !hasLimit;
            },
            severity: 'info',
            message: 'Very broad triple patterns without constraints or LIMIT'
        },
        
        // Information disclosure patterns
        {
            name: 'SYSTEM_PROPERTY_ACCESS',
            pattern: /(system|config|admin|internal|private|secret|password|key|token):/gi,
            severity: 'critical',
            message: 'Attempt to access system properties detected'
        },
        {
            name: 'METADATA_ENUMERATION',
            pattern: /(owl:Ontology|rdf:Property|rdfs:Class|void:Dataset)/gi,
            severity: 'warning',
            message: 'Metadata enumeration pattern detected'
        },
        
        // Protocol abuse patterns
        {
            name: 'EXTERNAL_RESOURCE_ACCESS',
            pattern: /(http:\/\/|https:\/\/|ftp:\/\/|file:\/\/|ldap:\/\/)/gi,
            severity: 'warning',
            message: 'External resource reference detected',
            recommendation: 'Restrict to allowed domains only'
        },
        {
            name: 'LOCAL_FILE_ACCESS',
            pattern: /file:\/\/\/|C:\\|\/etc\/|\/var\/|\/tmp\//gi,
            severity: 'critical',
            message: 'Local file system access attempt'
        },
        
        // Query structure attacks
        {
            name: 'EXCESSIVE_OPTIONALS',
            pattern: /OPTIONAL\s*\{[^}]*\}\s*OPTIONAL/gi,
            severity: 'warning',
            message: 'Excessive OPTIONAL clauses may indicate DoS attempt'
        },
        {
            name: 'RECURSIVE_PATTERN',
            pattern: /\?\w+\s+[^?]*\s+\?\w+.*\?\w+\s+[^?]*\s+\?\w+/gi,
            severity: 'warning',
            message: 'Potentially recursive pattern detected'
        }
    ];

    /**
     * Enhanced validation with security scoring and threat detection
     */
    enhancedValidate(query: string): Result<EnhancedValidationResult> {
        // First run basic sanitization
        const basicResult = this.sanitize(query);
        if (!basicResult.isSuccess) {
            return Result.fail(basicResult.getError());
        }

        const basicValidation = basicResult.getValue();
        
        try {
            // Run enhanced security checks
            const threats = this.detectThreats(query);
            const contextualWarnings = this.analyzeContext(query);
            const structuralIssues = this.validateStructuralIntegrity(query);
            const securityScore = this.calculateSecurityScore(query, threats);

            // Determine if query should be allowed (more permissive)
            const criticalThreats = threats.filter(t => t.severity === 'critical');
            const allowed = criticalThreats.length === 0 && securityScore >= 30;

            const enhancedResult: EnhancedValidationResult = {
                ...basicValidation,
                allowed,
                securityScore,
                detectedThreats: threats,
                contextualWarnings,
                structuralIssues
            };

            // Always return success with threat analysis
            // The calling code can decide whether to block based on threats
            return Result.ok(enhancedResult);
        } catch (error) {
            return Result.fail(`Enhanced validation failed: ${error.message}`);
        }
    }

    /**
     * Detect security threats in the query
     */
    private detectThreats(query: string): ThreatDetection[] {
        const threats: ThreatDetection[] = [];

        for (const rule of this.enhancedValidationRules) {
            let matches: boolean | RegExpMatchArray | null = false;
            
            if (rule.pattern instanceof RegExp) {
                matches = query.match(rule.pattern);
            } else if (typeof rule.pattern === 'function') {
                matches = rule.pattern(query);
            }

            if (matches) {
                const evidence = Array.isArray(matches) ? matches[0] : 'Pattern detected';
                threats.push({
                    type: this.categorizeRule(rule.name),
                    severity: rule.severity as ThreatDetection['severity'],
                    description: rule.message,
                    evidence,
                    mitigation: rule.recommendation || 'Review and sanitize query'
                });
            }
        }

        return threats;
    }

    /**
     * Categorize validation rule into threat type
     */
    private categorizeRule(ruleName: string): ThreatDetection['type'] {
        if (ruleName.includes('INJECTION')) return 'injection';
        if (ruleName.includes('TRAVERSAL')) return 'traversal';
        if (ruleName.includes('ENUMERATION')) return 'enumeration';
        if (ruleName.includes('DOS') || ruleName.includes('EXCESSIVE')) return 'dos';
        if (ruleName.includes('DISCLOSURE') || ruleName.includes('SYSTEM')) return 'information_disclosure';
        return 'injection'; // Default
    }

    /**
     * Analyze query context for suspicious patterns
     */
    private analyzeContext(query: string): string[] {
        const warnings: string[] = [];
        const normalizedQuery = query.toLowerCase();

        // Check for unusual namespace usage
        if (normalizedQuery.includes('file:') && !normalizedQuery.includes('prefix')) {
            warnings.push('Direct file URI usage without prefix declaration');
        }

        // Check for suspicious variable naming
        const suspiciousVarPatterns = [
            /\?(admin|root|system|config|secret|password|key|token|private)/g,
            /\?(hack|exploit|inject|attack|malware|virus)/g
        ];

        for (const pattern of suspiciousVarPatterns) {
            if (pattern.test(normalizedQuery)) {
                warnings.push('Suspicious variable naming detected');
                break;
            }
        }

        // Check for data exfiltration patterns
        if (normalizedQuery.includes('construct') && normalizedQuery.includes('*')) {
            warnings.push('CONSTRUCT with wildcard may expose sensitive data');
        }

        // Check for timing attack patterns
        if (normalizedQuery.includes('regex') && normalizedQuery.includes('filter')) {
            warnings.push('Complex REGEX in FILTER may be vulnerable to timing attacks');
        }

        return warnings;
    }

    /**
     * Validate structural integrity of the query
     */
    private validateStructuralIntegrity(query: string): string[] {
        const issues: string[] = [];

        // Check for balanced delimiters
        const delimiters = [
            { open: '{', close: '}', name: 'braces' },
            { open: '(', close: ')', name: 'parentheses' },
            { open: '<', close: '>', name: 'angle brackets' },
            { open: '"', close: '"', name: 'double quotes' }
        ];

        for (const delimiter of delimiters) {
            const openCount = (query.match(new RegExp(`\\${delimiter.open}`, 'g')) || []).length;
            const closeCount = (query.match(new RegExp(`\\${delimiter.close}`, 'g')) || []).length;
            
            if (openCount !== closeCount) {
                issues.push(`Unbalanced ${delimiter.name}: ${openCount} open, ${closeCount} close`);
            }
        }

        // Check for proper query structure
        if (!this.hasValidQueryStructure(query)) {
            issues.push('Invalid SPARQL query structure');
        }

        // Check for malformed IRIs
        const iriPattern = /<[^>]*>/g;
        const iris = query.match(iriPattern) || [];
        
        for (const iri of iris) {
            if (!this.isValidIRI(iri.slice(1, -1))) {
                issues.push(`Malformed IRI: ${iri}`);
            }
        }

        return issues;
    }

    /**
     * Check if query has valid SPARQL structure
     */
    private hasValidQueryStructure(query: string): boolean {
        const normalizedQuery = query.toUpperCase().trim();
        
        // Must start with a valid query type
        const validStarts = ['SELECT', 'CONSTRUCT', 'ASK', 'DESCRIBE', 'PREFIX'];
        const startsWithValid = validStarts.some(start => normalizedQuery.startsWith(start));
        
        if (!startsWithValid) {
            return false;
        }

        // Must have WHERE clause for most query types
        if ((normalizedQuery.includes('SELECT') || normalizedQuery.includes('CONSTRUCT')) && 
            !normalizedQuery.includes('WHERE')) {
            return false;
        }

        return true;
    }

    /**
     * Enhanced IRI validation
     */
    private isValidIRI(iri: string): boolean {
        // Check length
        if (iri.length === 0 || iri.length > 2048) {
            return false;
        }

        // Check for dangerous protocols
        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
        const lowerIri = iri.toLowerCase();
        
        if (dangerousProtocols.some(protocol => lowerIri.startsWith(protocol))) {
            return false;
        }

        // Check for path traversal
        if (iri.includes('..') || iri.includes('//') || iri.includes('\\\\')) {
            return false;
        }

        // Check for suspicious characters
        const suspiciousChars = /[<>"'`\x00-\x1f\x7f-\x9f]/;
        if (suspiciousChars.test(iri)) {
            return false;
        }

        // Basic URI structure validation
        try {
            const url = new URL(iri);
            return url.protocol === 'http:' || url.protocol === 'https:' || 
                   url.protocol === 'urn:' || iri.includes(':');
        } catch {
            // If not a valid URL, check if it's a valid URN or namespace
            return /^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z0-9_\-\.]*$/.test(iri);
        }
    }

    /**
     * Calculate security score (0-100, higher is more secure)
     */
    private calculateSecurityScore(query: string, threats: ThreatDetection[]): number {
        let score = 100;

        // Deduct points for threats
        for (const threat of threats) {
            switch (threat.severity) {
                case 'critical':
                    score -= 30;
                    break;
                case 'high':
                    score -= 20;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        }

        // Additional deductions for risky patterns (more lenient)
        const normalizedQuery = query.toLowerCase();
        
        // Only penalize CONSTRUCT * if it's broad without constraints
        if (normalizedQuery.includes('construct') && normalizedQuery.includes('*') && 
            !normalizedQuery.includes('limit') && !normalizedQuery.includes('filter')) {
            score -= 10; // Data exposure risk (reduced penalty)
        }
        
        // Only penalize complex regex patterns
        if (normalizedQuery.match(/regex\s*\(\s*\?\w+\s*,\s*["'][^"']{50,}["']\s*\)/)) {
            score -= 10; // Complex regex performance risk
        }
        
        if (normalizedQuery.length > 5000) {
            score -= 10; // Complexity risk
        }

        // Bonus points for good practices
        if (normalizedQuery.includes('limit')) {
            score += 5; // Result size limiting
        }
        
        if (normalizedQuery.includes('prefix')) {
            score += 5; // Proper namespace usage
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate security recommendations based on validation results
     */
    generateSecurityRecommendations(result: EnhancedValidationResult): string[] {
        const recommendations: string[] = [];

        if (result.securityScore < 50) {
            recommendations.push('Query has significant security concerns - consider major revisions');
        } else if (result.securityScore < 70) {
            recommendations.push('Query has moderate security issues - review and improve');
        }

        if (result.detectedThreats.length > 0) {
            recommendations.push('Address detected security threats before execution');
            
            // Add specific recommendations from threats
            const uniqueRecommendations = new Set(
                result.detectedThreats
                    .map(t => t.mitigation)
                    .filter(m => m !== 'Review and sanitize query')
            );
            
            recommendations.push(...Array.from(uniqueRecommendations));
        }

        if (result.structuralIssues.length > 0) {
            recommendations.push('Fix structural issues in query syntax');
        }

        if (result.contextualWarnings.length > 0) {
            recommendations.push('Review contextual warnings for potential security implications');
        }

        if (recommendations.length === 0) {
            recommendations.push('Query appears secure - no significant security concerns detected');
        }

        return recommendations;
    }

    /**
     * Create a safe version of the query with security issues mitigated
     */
    createSafeQuery(query: string): Result<string> {
        const validationResult = this.enhancedValidate(query);
        if (!validationResult.isSuccess) {
            return Result.fail(validationResult.getError());
        }

        let safeQuery = query;
        const validation = validationResult.getValue();

        // Apply automatic fixes for common issues
        for (const threat of validation.detectedThreats) {
            if (threat.type === 'injection') {
                // Remove or escape dangerous characters
                safeQuery = safeQuery.replace(/[;&|`$(){}[\]<>]/g, '');
            }
            
            if (threat.type === 'traversal') {
                // Remove path traversal patterns
                safeQuery = safeQuery.replace(/\.\.[\/\\]/g, '');
                safeQuery = safeQuery.replace(/file:\/\/\//g, '');
            }
        }

        // Add safety constraints
        if (!safeQuery.toLowerCase().includes('limit')) {
            safeQuery += ' LIMIT 1000'; // Add default limit
        }

        return Result.ok(safeQuery);
    }
}