/**
 * Security Validator for BDD Tests
 *
 * Provides security validation capabilities for BDD test scenarios.
 * Implements OWASP security testing guidelines.
 */
export class SecurityValidator {
  private securityWarnings: SecurityWarning[] = [];
  private securityChecks: SecurityCheck[] = [];

  constructor() {
    this.initializeSecurityChecks();
  }

  /**
   * Validate input for potential security issues
   */
  validateInput(
    input: string,
    context: string = "general",
  ): SecurityValidationResult {
    const issues: SecurityIssue[] = [];

    // Check for XSS patterns
    const xssIssues = this.checkXSS(input);
    issues.push(...xssIssues);

    // Check for path traversal
    const pathIssues = this.checkPathTraversal(input);
    issues.push(...pathIssues);

    // Check for SQL injection patterns
    const sqlIssues = this.checkSQLInjection(input);
    issues.push(...sqlIssues);

    // Check for SPARQL injection patterns
    const sparqlIssues = this.checkSPARQLInjection(input);
    issues.push(...sparqlIssues);

    // Check for command injection
    const commandIssues = this.checkCommandInjection(input);
    issues.push(...commandIssues);

    // Check for excessive length (DoS)
    const lengthIssues = this.checkExcessiveLength(input);
    issues.push(...lengthIssues);

    const severity = this.calculateSeverity(issues);
    const sanitizedInput = this.sanitizeInput(input, issues);

    if (issues.length > 0) {
      this.recordSecurityWarning({
        type: "input_validation",
        severity,
        message: `Security issues detected in ${context}`,
        details: issues.map((issue) => issue.description),
        context,
        timestamp: new Date(),
      });
    }

    return {
      isValid: severity !== "critical",
      issues,
      severity,
      sanitizedInput,
      recommendations: this.generateRecommendations(issues),
    };
  }

  /**
   * Validate SPARQL query for injection attempts
   */
  validateSPARQLQuery(query: string): SPARQLSecurityResult {
    const issues: SecurityIssue[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    // Check for dangerous operations
    const dangerousOperations = [
      "delete",
      "insert",
      "drop",
      "clear",
      "create",
      "load",
      "copy",
      "move",
      "add",
    ];

    dangerousOperations.forEach((operation) => {
      if (normalizedQuery.includes(operation)) {
        issues.push({
          type: "sparql_injection",
          severity: "high",
          description: `Dangerous SPARQL operation detected: ${operation.toUpperCase()}`,
          pattern: operation,
          recommendation: "Use read-only SELECT, CONSTRUCT, or ASK queries",
        });
      }
    });

    // Check for multiple query separators
    if (normalizedQuery.includes(";") || normalizedQuery.match(/}\s*\w+\s*{/)) {
      issues.push({
        type: "sparql_injection",
        severity: "high",
        description: "Multiple SPARQL queries detected",
        pattern: "multiple_queries",
        recommendation: "Execute only single queries at a time",
      });
    }

    // Check for comment injection
    if (normalizedQuery.includes("#") || normalizedQuery.includes("--")) {
      issues.push({
        type: "sparql_injection",
        severity: "medium",
        description: "Comment characters detected in query",
        pattern: "comments",
        recommendation: "Remove comment characters from user input",
      });
    }

    const sanitizedQuery = this.sanitizeSPARQLQuery(query, issues);
    const severity = this.calculateSeverity(issues);

    return {
      isValid: severity !== "critical",
      originalQuery: query,
      sanitizedQuery,
      issues,
      severity,
      allowedOperations: ["select", "construct", "ask", "describe"],
      recommendations: this.generateRecommendations(issues),
    };
  }

  /**
   * Validate file path for security issues
   */
  validateFilePath(path: string): FilePathSecurityResult {
    const issues: SecurityIssue[] = [];

    // Check for path traversal
    if (path.includes("../") || path.includes("..\\")) {
      issues.push({
        type: "path_traversal",
        severity: "high",
        description: "Path traversal attempt detected",
        pattern: "../",
        recommendation: "Use absolute paths or validate path components",
      });
    }

    // Check for null bytes
    if (path.includes("\0")) {
      issues.push({
        type: "null_byte_injection",
        severity: "high",
        description: "Null byte injection detected",
        pattern: "\\0",
        recommendation: "Remove null bytes from file paths",
      });
    }

    // Check for dangerous paths
    const dangerousPaths = [
      "/etc/passwd",
      "/etc/shadow",
      "C:\\Windows\\System32",
      "/proc/",
      "/sys/",
      "C:\\Program Files",
    ];

    dangerousPaths.forEach((dangerousPath) => {
      if (path.toLowerCase().includes(dangerousPath.toLowerCase())) {
        issues.push({
          type: "dangerous_path",
          severity: "critical",
          description: `Access to dangerous system path: ${dangerousPath}`,
          pattern: dangerousPath,
          recommendation:
            "Restrict file access to application directories only",
        });
      }
    });

    const sanitizedPath = this.sanitizeFilePath(path);
    const severity = this.calculateSeverity(issues);

    return {
      isValid: severity !== "critical",
      originalPath: path,
      sanitizedPath,
      issues,
      severity,
      recommendations: this.generateRecommendations(issues),
    };
  }

  /**
   * Check for XSS patterns
   */
  private checkXSS(input: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const xssPatterns = [
      { pattern: /<script/i, description: "Script tag detected" },
      { pattern: /javascript:/i, description: "JavaScript protocol detected" },
      {
        pattern: /on\w+\s*=/i,
        description: "Event handler attribute detected",
      },
      { pattern: /<iframe/i, description: "Iframe tag detected" },
      { pattern: /vbscript:/i, description: "VBScript protocol detected" },
      { pattern: /expression\s*\(/i, description: "CSS expression detected" },
    ];

    xssPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(input)) {
        issues.push({
          type: "xss",
          severity: "high",
          description,
          pattern: pattern.source,
          recommendation: "Sanitize HTML content and escape special characters",
        });
      }
    });

    return issues;
  }

  /**
   * Check for path traversal patterns
   */
  private checkPathTraversal(input: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const patterns = ["../", "..\\", "%2e%2e%2f", "%2e%2e%5c"];

    patterns.forEach((pattern) => {
      if (input.toLowerCase().includes(pattern)) {
        issues.push({
          type: "path_traversal",
          severity: "high",
          description: "Path traversal pattern detected",
          pattern,
          recommendation: "Validate and sanitize file paths",
        });
      }
    });

    return issues;
  }

  /**
   * Check for SQL injection patterns
   */
  private checkSQLInjection(input: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const sqlPatterns = [
      /union\s+select/i,
      /'\s*or\s*'1'\s*=\s*'1/i,
      /'\s*or\s*1\s*=\s*1/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+\w+\s+set/i,
    ];

    sqlPatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        issues.push({
          type: "sql_injection",
          severity: "high",
          description: "SQL injection pattern detected",
          pattern: pattern.source,
          recommendation: "Use parameterized queries and input validation",
        });
      }
    });

    return issues;
  }

  /**
   * Check for SPARQL injection patterns
   */
  private checkSPARQLInjection(input: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const sparqlPatterns = [
      /delete\s+where/i,
      /insert\s+data/i,
      /drop\s+graph/i,
      /clear\s+graph/i,
      /}\s*;\s*delete/i,
      /}\s*;\s*insert/i,
    ];

    sparqlPatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        issues.push({
          type: "sparql_injection",
          severity: "high",
          description: "SPARQL injection pattern detected",
          pattern: pattern.source,
          recommendation: "Use read-only queries and validate SPARQL syntax",
        });
      }
    });

    return issues;
  }

  /**
   * Check for command injection patterns
   */
  private checkCommandInjection(input: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const commandPatterns = [
      /[;&|`$()]/,
      /rm\s+-rf/,
      /cat\s+\/etc\/passwd/,
      /wget\s+http/,
      /curl\s+http/,
      /powershell/i,
      /cmd\.exe/i,
    ];

    commandPatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        issues.push({
          type: "command_injection",
          severity: "critical",
          description: "Command injection pattern detected",
          pattern: pattern.source,
          recommendation: "Sanitize input and avoid system command execution",
        });
      }
    });

    return issues;
  }

  /**
   * Check for excessive length (potential DoS)
   */
  private checkExcessiveLength(input: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const maxLength = 10000; // 10KB limit

    if (input.length > maxLength) {
      issues.push({
        type: "excessive_length",
        severity: "medium",
        description: `Input length exceeds maximum allowed (${input.length} > ${maxLength})`,
        pattern: "length_check",
        recommendation: "Implement input length limits",
      });
    }

    return issues;
  }

  /**
   * Calculate overall severity from issues
   */
  private calculateSeverity(issues: SecurityIssue[]): SecuritySeverity {
    if (issues.some((issue) => issue.severity === "critical"))
      return "critical";
    if (issues.some((issue) => issue.severity === "high")) return "high";
    if (issues.some((issue) => issue.severity === "medium")) return "medium";
    if (issues.length > 0) return "low";
    return "none";
  }

  /**
   * Sanitize input based on detected issues
   */
  private sanitizeInput(input: string, issues: SecurityIssue[]): string {
    let sanitized = input;

    // Remove script tags and dangerous HTML
    sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");
    sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/vbscript:/gi, "");

    // Remove path traversal patterns
    sanitized = sanitized.replace(/\.\.\//g, "");
    sanitized = sanitized.replace(/\.\.\\/g, "");

    // Remove command injection characters
    sanitized = sanitized.replace(/[;&|`$()]/g, "");

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, "");

    return sanitized;
  }

  /**
   * Sanitize SPARQL query
   */
  private sanitizeSPARQLQuery(query: string, issues: SecurityIssue[]): string {
    let sanitized = query;

    // Remove dangerous operations
    sanitized = sanitized.replace(
      /delete\s+where/gi,
      "# REMOVED: DELETE WHERE",
    );
    sanitized = sanitized.replace(/insert\s+data/gi, "# REMOVED: INSERT DATA");
    sanitized = sanitized.replace(/drop\s+graph/gi, "# REMOVED: DROP GRAPH");
    sanitized = sanitized.replace(/clear\s+graph/gi, "# REMOVED: CLEAR GRAPH");

    // Remove multiple query separators
    sanitized = sanitized.replace(/;\s*\w/g, "# REMOVED: Multiple queries");

    return sanitized;
  }

  /**
   * Sanitize file path
   */
  private sanitizeFilePath(path: string): string {
    let sanitized = path;

    // Remove path traversal
    sanitized = sanitized.replace(/\.\.\//g, "");
    sanitized = sanitized.replace(/\.\.\\/g, "");

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, "");

    // Normalize path separators
    sanitized = sanitized.replace(/\\/g, "/");

    return sanitized;
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations = new Set<string>();

    issues.forEach((issue) => {
      if (issue.recommendation) {
        recommendations.add(issue.recommendation);
      }
    });

    return Array.from(recommendations);
  }

  /**
   * Record a security warning
   */
  private recordSecurityWarning(warning: SecurityWarning): void {
    this.securityWarnings.push(warning);
  }

  /**
   * Initialize security checks
   */
  private initializeSecurityChecks(): void {
    this.securityChecks = [
      {
        name: "Input Validation",
        description: "Validate all user inputs for security issues",
        category: "input_validation",
        severity: "high",
      },
      {
        name: "SPARQL Injection Prevention",
        description: "Prevent SPARQL injection attacks",
        category: "sparql_security",
        severity: "high",
      },
      {
        name: "Path Traversal Prevention",
        description: "Prevent unauthorized file system access",
        category: "file_security",
        severity: "high",
      },
      {
        name: "XSS Prevention",
        description: "Prevent cross-site scripting attacks",
        category: "web_security",
        severity: "medium",
      },
    ];
  }

  /**
   * Get all security warnings
   */
  getSecurityWarnings(): SecurityWarning[] {
    return [...this.securityWarnings];
  }

  /**
   * Clear security warnings
   */
  clearWarnings(): void {
    this.securityWarnings = [];
  }

  /**
   * Generate security report
   */
  generateSecurityReport(): SecurityReport {
    return {
      warnings: this.securityWarnings,
      checks: this.securityChecks,
      summary: {
        totalWarnings: this.securityWarnings.length,
        criticalIssues: this.securityWarnings.filter(
          (w) => w.severity === "critical",
        ).length,
        highIssues: this.securityWarnings.filter((w) => w.severity === "high")
          .length,
        mediumIssues: this.securityWarnings.filter(
          (w) => w.severity === "medium",
        ).length,
        lowIssues: this.securityWarnings.filter((w) => w.severity === "low")
          .length,
      },
      timestamp: new Date(),
    };
  }
}

// Type definitions
export type SecuritySeverity = "critical" | "high" | "medium" | "low" | "none";

export interface SecurityIssue {
  type: string;
  severity: SecuritySeverity;
  description: string;
  pattern: string;
  recommendation?: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  issues: SecurityIssue[];
  severity: SecuritySeverity;
  sanitizedInput: string;
  recommendations: string[];
}

export interface SPARQLSecurityResult {
  isValid: boolean;
  originalQuery: string;
  sanitizedQuery: string;
  issues: SecurityIssue[];
  severity: SecuritySeverity;
  allowedOperations: string[];
  recommendations: string[];
}

export interface FilePathSecurityResult {
  isValid: boolean;
  originalPath: string;
  sanitizedPath: string;
  issues: SecurityIssue[];
  severity: SecuritySeverity;
  recommendations: string[];
}

export interface SecurityWarning {
  type: string;
  severity: SecuritySeverity;
  message: string;
  details: string[];
  context: string;
  timestamp: Date;
}

export interface SecurityCheck {
  name: string;
  description: string;
  category: string;
  severity: SecuritySeverity;
}

export interface SecurityReport {
  warnings: SecurityWarning[];
  checks: SecurityCheck[];
  summary: {
    totalWarnings: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  timestamp: Date;
}
