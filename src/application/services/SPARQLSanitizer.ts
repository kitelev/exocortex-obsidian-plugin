/**
 * SPARQL Query Sanitizer
 * Implements security controls to prevent injection attacks
 */

import { Result } from "../../domain/core/Result";

export interface SanitizationResult {
  query: string;
  modified: boolean;
  warnings: string[];
}

export class SPARQLSanitizer {
  // Dangerous patterns that could lead to security issues
  private readonly dangerousPatterns = [
    // File system access attempts
    /FILE:/gi,
    /LOAD\s+<file:/gi,

    // Command injection patterns
    /;\s*DELETE/gi,
    /;\s*DROP/gi,
    /;\s*INSERT/gi,
    /;\s*CLEAR/gi,

    // Path traversal
    /\.\.[/\\]/g,

    // Null byte injection
    // eslint-disable-next-line no-control-regex
    /\x00/g,

    // Script injection
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  // Allowed SPARQL keywords
  private readonly allowedKeywords = new Set([
    "SELECT",
    "CONSTRUCT",
    "WHERE",
    "FILTER",
    "OPTIONAL",
    "UNION",
    "PREFIX",
    "BASE",
    "DISTINCT",
    "REDUCED",
    "ORDER",
    "BY",
    "ASC",
    "DESC",
    "LIMIT",
    "OFFSET",
    "GRAPH",
    "BIND",
    "VALUES",
    "GROUP",
    "HAVING",
    "SERVICE",
    "MINUS",
    "EXISTS",
    "NOT",
    "IN",
    "AS",
  ]);

  /**
   * Sanitize SPARQL query for safe execution
   */
  sanitize(query: string): Result<SanitizationResult> {
    if (!query || query.trim().length === 0) {
      return Result.fail("Empty query provided");
    }

    const warnings: string[] = [];
    let sanitized = query;
    let modified = false;

    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(sanitized)) {
        warnings.push(
          `Dangerous pattern detected and removed: ${pattern.source}`,
        );
        sanitized = sanitized.replace(pattern, "");
        modified = true;
      }
    }

    // Validate query structure
    const validation = this.validateQueryStructure(sanitized);
    if (validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }

    // Check for multiple statements
    if (this.hasMultipleStatements(sanitized)) {
      warnings.push(
        "Multiple statements detected - only first will be executed",
      );
      sanitized = this.extractFirstStatement(sanitized);
      modified = true;
    }

    // Validate IRI patterns
    const iriValidation = this.validateIRIs(sanitized);
    if (iriValidation.warnings.length > 0) {
      warnings.push(...iriValidation.warnings);
    }

    // Check query complexity
    const complexity = this.checkComplexity(sanitized);
    if (complexity.tooComplex) {
      return Result.fail(`Query too complex: ${complexity.reason}`);
    }

    return Result.ok({
      query: sanitized,
      modified,
      warnings,
    });
  }

  /**
   * Validate query structure
   */
  private validateQueryStructure(query: string): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const upperQuery = query.toUpperCase();

    // Check for required keywords
    if (!upperQuery.includes("SELECT") && !upperQuery.includes("CONSTRUCT")) {
      warnings.push("Query must be SELECT or CONSTRUCT");
    }

    // Check for balanced brackets
    const openBrackets = (query.match(/\{/g) || []).length;
    const closeBrackets = (query.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      warnings.push("Unbalanced brackets detected");
    }

    // Check for balanced parentheses
    const openParens = (query.match(/\(/g) || []).length;
    const closeParens = (query.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      warnings.push("Unbalanced parentheses detected");
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Check if query contains multiple statements
   */
  private hasMultipleStatements(query: string): boolean {
    // Look for multiple query keywords
    const queryKeywords = ["SELECT", "CONSTRUCT", "INSERT", "DELETE", "DROP"];
    let count = 0;

    for (const keyword of queryKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = query.match(regex);
      if (matches) {
        count += matches.length;
      }
    }

    return count > 1;
  }

  /**
   * Extract first statement from query
   */
  private extractFirstStatement(query: string): string {
    // Find the end of the first complete statement
    let depth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < query.length; i++) {
      const char = query[i];

      // Handle string literals
      if ((char === '"' || char === "'") && query[i - 1] !== "\\") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === "{") depth++;
        if (char === "}") depth--;

        // Check if we've completed a statement
        if (depth === 0 && i > 0) {
          // Look for next query keyword
          const remaining = query.substring(i + 1);
          if (/^\s*(SELECT|CONSTRUCT|INSERT|DELETE)/i.test(remaining)) {
            return query.substring(0, i + 1);
          }
        }
      }
    }

    return query;
  }

  /**
   * Validate IRI patterns in query
   */
  private validateIRIs(query: string): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Extract IRIs from query
    const iriPattern = /<([^>]+)>/g;
    let match;

    while ((match = iriPattern.exec(query)) !== null) {
      const iri = match[1];

      // Check for suspicious IRI patterns
      if (iri.includes("..") || iri.includes("\\")) {
        warnings.push(`Suspicious IRI detected: ${iri}`);
      }

      // Check for local file access
      if (iri.startsWith("file:")) {
        warnings.push(`File URI not allowed: ${iri}`);
      }

      // Check IRI length
      if (iri.length > 2048) {
        warnings.push(`IRI too long: ${iri.substring(0, 50)}...`);
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Check query complexity to prevent DoS
   */
  private checkComplexity(query: string): {
    tooComplex: boolean;
    reason?: string;
  } {
    // Check query length
    if (query.length > 10000) {
      return { tooComplex: true, reason: "Query exceeds maximum length" };
    }

    // Count triple patterns
    const triplePatterns = (query.match(/\.\s*\?/g) || []).length;
    if (triplePatterns > 100) {
      return { tooComplex: true, reason: "Too many triple patterns" };
    }

    // Count UNION operations
    const unions = (query.match(/\bUNION\b/gi) || []).length;
    if (unions > 10) {
      return { tooComplex: true, reason: "Too many UNION operations" };
    }

    // Count nested subqueries
    const subqueries = (query.match(/\{[^}]*SELECT/gi) || []).length;
    if (subqueries > 5) {
      return { tooComplex: true, reason: "Too many nested subqueries" };
    }

    // Count FILTER operations
    const filters = (query.match(/\bFILTER\b/gi) || []).length;
    if (filters > 20) {
      return { tooComplex: true, reason: "Too many FILTER operations" };
    }

    return { tooComplex: false };
  }

  /**
   * Escape special characters in literals
   */
  escapeStringLiteral(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }

  /**
   * Create safe IRI from user input
   */
  createSafeIRI(input: string): string {
    // Remove dangerous characters
    const safe = input
      .replace(/[<>'"`;]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w:/-]/g, "");

    // Ensure valid IRI format
    if (!safe.includes(":")) {
      return `ex:${safe}`;
    }

    return safe;
  }
}
