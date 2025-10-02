# SPARQL Security Framework

This directory contains the comprehensive security framework for the Exocortex plugin's SPARQL query system. The implementation follows OWASP best practices and includes multiple layers of protection against various attack vectors.

## 🔒 Security Architecture

### Overview

The security framework implements a multi-layered defense strategy:

1. **Query Complexity Analysis** - Prevents resource exhaustion attacks
2. **Rate Limiting** - Protects against DoS and abuse
3. **Enhanced Validation** - Blocks injection and malicious patterns
4. **Timeout Management** - Prevents resource monopolization
5. **Security Monitoring** - Real-time threat detection and incident response

### Security Principles

- **Defense in Depth**: Multiple security layers working together
- **Fail Securely**: Safe failure modes that don't expose vulnerabilities
- **Least Privilege**: Minimal access rights and capabilities
- **Zero Trust**: Validate everything, trust nothing
- **Privacy by Design**: No data collection beyond security necessities

## 📊 Components

### 1. QueryComplexityAnalyzer

**Location**: `QueryComplexityAnalyzer.ts`

**Purpose**: Analyzes SPARQL queries to prevent DoS attacks through resource exhaustion.

**Key Features**:

- Cost estimation algorithms with O(n) complexity analysis
- Memory usage prediction and limits
- Time complexity classification
- Risk assessment scoring (0-100)
- Automatic query optimization recommendations

**Security Controls**:

```typescript
interface ComplexityThresholds {
  maxCost: number; // Default: 1000
  maxTriplePatterns: number; // Default: 50
  maxJoinComplexity: number; // Default: 25
  maxSubqueryDepth: number; // Default: 3
  maxEstimatedMemoryMB: number; // Default: 100
  maxExecutionTimeMs: number; // Default: 30000
  allowedTimeComplexity: string[]; // Default: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)']
}
```

**Usage Example**:

```typescript
const analyzer = new QueryComplexityAnalyzer();
const result = analyzer.analyzeQuery(query);

if (!result.getValue().allowed) {
  // Block dangerous query
  console.log("Violations:", result.getValue().violations);
  console.log("Recommendations:", result.getValue().recommendations);
}
```

### 2. QueryRateLimiter

**Location**: `QueryRateLimiter.ts`

**Purpose**: Implements sliding window rate limiting with circuit breaker patterns.

**Key Features**:

- Sliding window algorithm for accurate rate limiting
- Separate limits for simple vs complex queries
- Circuit breaker pattern for persistent violators
- Burst detection and prevention
- Cost-based rate limiting
- Adaptive limits based on user behavior

**Security Controls**:

```typescript
interface RateLimitConfig {
  windowSizeMs: number; // Default: 60000 (1 minute)
  maxRequests: number; // Default: 100
  maxComplexRequests: number; // Default: 10
  burstAllowance: number; // Default: 20
  circuitBreakerThreshold: number; // Default: 5
  circuitBreakerResetTimeMs: number; // Default: 300000 (5 minutes)
}
```

**Usage Example**:

```typescript
const rateLimiter = new QueryRateLimiter();
const result = rateLimiter.checkRateLimit(userId, isComplex, queryCost);

if (!result.getValue().allowed) {
  const retryAfter = result.getValue().retryAfterMs;
  throw new Error(`Rate limit exceeded. Retry after ${retryAfter}ms`);
}
```

### 3. EnhancedSPARQLValidator

**Location**: `EnhancedSPARQLValidator.ts`

**Purpose**: Advanced validation with injection prevention and threat detection.

**Key Features**:

- Multi-layer injection detection (SQL, SPARQL, Command)
- Path traversal prevention
- Resource enumeration detection
- Information disclosure protection
- Context-aware validation rules
- Security scoring (0-100 scale)
- Automatic query sanitization

**Threat Detection**:

- **Injection Attacks**: SQL injection, SPARQL injection, command injection
- **Path Traversal**: Directory traversal, file access attempts
- **Enumeration**: Resource scanning, metadata enumeration
- **DoS Patterns**: Excessive optionals, recursive queries
- **Information Disclosure**: System property access, sensitive data exposure

**Usage Example**:

```typescript
const validator = new EnhancedSPARQLValidator();
const result = validator.enhancedValidate(query);

if (result.getValue().securityScore < 70) {
  console.log("Security concerns detected:", result.getValue().detectedThreats);
}
```

### 4. QueryTimeoutManager

**Location**: `QueryTimeoutManager.ts`

**Purpose**: Manages query timeouts with resource monitoring and automatic cancellation.

**Key Features**:

- Configurable timeouts based on query complexity
- Real-time resource monitoring (memory, CPU)
- Automatic timeout adjustment based on system load
- Query cancellation mechanisms
- Performance metrics collection

**Security Controls**:

```typescript
interface TimeoutConfig {
  defaultTimeoutMs: number; // Default: 30000
  maxTimeoutMs: number; // Default: 300000
  complexQueryTimeoutMs: number; // Default: 60000
  resourceCheckIntervalMs: number; // Default: 1000
  memoryThresholdMB: number; // Default: 100
  cpuThresholdPercent: number; // Default: 80
  adaptiveTimeouts: boolean; // Default: true
}
```

**Usage Example**:

```typescript
const timeoutManager = new QueryTimeoutManager();
const execution = timeoutManager.startExecution(queryId, query, "complex");

// Query execution with automatic timeout and resource monitoring
try {
  const result = await executeQueryWithTimeout(
    query,
    execution.getValue().abortController.signal,
  );
  timeoutManager.completeExecution(queryId);
} catch (error) {
  timeoutManager.cancelExecution(queryId, "error");
}
```

### 5. SecurityMonitor

**Location**: `SecurityMonitor.ts`

**Purpose**: Real-time security monitoring with incident logging and alerting.

**Key Features**:

- Comprehensive security event logging
- Real-time threat detection and correlation
- Automated incident response
- Security metrics and reporting
- Alert management system
- Forensic data export

**Event Types**:

- `query_blocked` - Malicious queries blocked
- `rate_limit_exceeded` - Rate limiting violations
- `injection_attempt` - Injection attack attempts
- `resource_violation` - Resource threshold breaches
- `timeout_exceeded` - Query timeouts
- `suspicious_pattern` - Anomaly detection
- `circuit_breaker_triggered` - Circuit breaker activations

**Usage Example**:

```typescript
const monitor = new SecurityMonitor();

// Log security events
monitor.logQueryBlocked(query, "injection_attempt", threatDetails, userId);
monitor.logRateLimitExceeded(userId, "complex_queries", 15, 10);

// Set up real-time monitoring
monitor.addEventListener("injection_attempt", (event) => {
  // Immediate response to critical threats
  alertSecurityTeam(event);
});

// Generate security reports
const report = monitor.generateSecurityReport();
```

## 🛡️ Security Threat Model

### Identified Threats

#### 1. DoS Attacks (STRIDE: Denial of Service)

- **Threat**: Resource exhaustion through complex queries
- **Impact**: Service unavailability, system overload
- **Mitigations**:
  - Query complexity analysis
  - Resource monitoring and limits
  - Automatic query cancellation
  - Rate limiting

#### 2. Injection Attacks (STRIDE: Tampering)

- **Threat**: SQL/SPARQL/Command injection
- **Impact**: Data corruption, unauthorized access, system compromise
- **Mitigations**:
  - Multi-layer validation
  - Pattern detection
  - Input sanitization
  - Context-aware filtering

#### 3. Information Disclosure (STRIDE: Information Disclosure)

- **Threat**: Unauthorized data access through queries
- **Impact**: Sensitive data exposure, privacy violations
- **Mitigations**:
  - Query scope validation
  - Metadata enumeration prevention
  - Result filtering
  - Access logging

#### 4. Resource Enumeration (STRIDE: Information Disclosure)

- **Threat**: System reconnaissance through queries
- **Impact**: Architecture exposure, attack surface mapping
- **Mitigations**:
  - Broad query detection
  - Pattern analysis
  - Rate limiting
  - Behavioral monitoring

#### 5. Privilege Escalation (STRIDE: Elevation of Privilege)

- **Threat**: Bypassing security controls
- **Impact**: Unauthorized system access
- **Mitigations**:
  - Input validation
  - Query sanitization
  - Security monitoring
  - Incident response

### Attack Vectors

1. **Complex Query DoS**

   ```sparql
   # Cartesian product attack
   SELECT * WHERE {
       ?s1 ?p1 ?o1 .
       ?s2 ?p2 ?o2 .
       ?s3 ?p3 ?o3 .
       # ... many unconnected patterns
   }
   ```

2. **SPARQL Injection**

   ```sparql
   # Injection attempt
   SELECT * WHERE {
       ?s ?p "'; DROP ALL; --"
   }
   ```

3. **Path Traversal**

   ```sparql
   # File system access
   SELECT * WHERE {
       <file:///etc/passwd> ?p ?o
   }
   ```

4. **Resource Enumeration**
   ```sparql
   # Broad scanning
   SELECT * WHERE {
       ?s ?p ?o
   }
   ```

## 🔧 Configuration

### Environment-Specific Settings

**Development**:

```typescript
const devConfig = {
  complexity: {
    maxCost: 500,
    maxTriplePatterns: 20,
  },
  rateLimiting: {
    maxRequests: 50,
    windowSizeMs: 30000,
  },
  monitoring: {
    enableRealTimeAlerts: false,
  },
};
```

**Production**:

```typescript
const prodConfig = {
  complexity: {
    maxCost: 1000,
    maxTriplePatterns: 50,
  },
  rateLimiting: {
    maxRequests: 100,
    windowSizeMs: 60000,
  },
  monitoring: {
    enableRealTimeAlerts: true,
    enableForensicLogging: true,
  },
};
```

### Security Levels

**Strict Mode** (High Security):

- Low complexity thresholds
- Aggressive rate limiting
- Comprehensive validation
- Real-time monitoring

**Normal Mode** (Balanced):

- Standard thresholds
- Moderate rate limiting
- Enhanced validation
- Periodic monitoring

**Permissive Mode** (Development):

- High thresholds
- Lenient rate limiting
- Basic validation
- Minimal monitoring

## 📈 Monitoring and Metrics

### Key Performance Indicators (KPIs)

1. **Security Score**: Overall security posture (0-100)
2. **Threat Detection Rate**: Percentage of threats detected
3. **False Positive Rate**: Percentage of false alarms
4. **Response Time**: Time to detect and respond to threats
5. **Query Block Rate**: Percentage of queries blocked
6. **Resource Utilization**: System resource usage patterns

### Dashboards and Reporting

The SecurityMonitor provides comprehensive reporting capabilities:

```typescript
// Real-time metrics
const metrics = monitor.getSecurityMetrics();
console.log("Security Score:", metrics.securityScore);
console.log("Threats Detected:", metrics.totalThreats);

// Historical analysis
const report = monitor.generateSecurityReport(24 * 60 * 60 * 1000); // 24 hours
console.log("Critical Incidents:", report.criticalEvents.length);
console.log("Recommendations:", report.recommendations);

// Forensic export
const events = monitor.exportEvents(startTime, endTime, {
  severity: "critical",
  type: "injection_attempt",
});
```

## 🚨 Incident Response

### Automated Response Levels

1. **Level 1 - Low Severity**
   - Log event
   - Continue processing
   - Monitor patterns

2. **Level 2 - Medium Severity**
   - Block query
   - Apply rate limiting
   - Generate warning

3. **Level 3 - High Severity**
   - Block query
   - Increase monitoring
   - Trigger circuit breaker

4. **Level 4 - Critical Severity**
   - Block query immediately
   - Activate emergency mode
   - Alert security team
   - Preserve forensic evidence

### Manual Response Procedures

1. **Investigation**
   - Review security events
   - Analyze attack patterns
   - Assess impact scope

2. **Containment**
   - Block malicious users
   - Adjust security thresholds
   - Update validation rules

3. **Recovery**
   - Restore normal operations
   - Update security policies
   - Conduct post-incident review

## 🧪 Testing Strategy

### Security Test Categories

1. **Input Validation Tests**
   - Injection attack vectors
   - Malformed queries
   - Edge cases and boundary conditions

2. **DoS Prevention Tests**
   - Resource exhaustion scenarios
   - Complex query patterns
   - Rate limiting verification

3. **Performance Tests**
   - Security overhead measurement
   - Concurrent access scenarios
   - Large-scale attack simulations

4. **Integration Tests**
   - Component interaction verification
   - End-to-end security flows
   - Real-world attack scenarios

### Test Execution

```bash
# Run security test suite
npm run test:security

# Run specific security test categories
npm run test:security -- --testNamePattern="injection"
npm run test:security -- --testNamePattern="DoS"
npm run test:security -- --testNamePattern="rate"
```

## 🔄 Maintenance and Updates

### Regular Security Tasks

1. **Weekly**
   - Review security metrics
   - Analyze false positives
   - Update threat patterns

2. **Monthly**
   - Security configuration review
   - Performance optimization
   - Vulnerability assessment

3. **Quarterly**
   - Security architecture review
   - Penetration testing
   - Compliance audit

### Version Management

Security components follow semantic versioning:

- **Major**: Breaking changes to security interfaces
- **Minor**: New security features or enhancements
- **Patch**: Bug fixes and security patches

## 📚 References

### Standards and Guidelines

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html)
- [SPARQL 1.1 Specification](https://www.w3.org/TR/sparql11-query/)

### Security Resources

- [OWASP Query Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html)
- [NIST Guide to Application Security](https://csrc.nist.gov/publications/detail/sp/800-163/rev-1/final)
- [W3C RDF Security Considerations](https://www.w3.org/TR/rdf11-concepts/#section-security)

## 🤝 Contributing

### Security Review Process

1. **Code Review**: All security-related changes require review
2. **Threat Modeling**: New features must include threat analysis
3. **Testing**: Comprehensive security tests required
4. **Documentation**: Security implications must be documented

### Reporting Security Issues

Please report security vulnerabilities through the appropriate channels:

- Critical issues: Immediate escalation
- Standard issues: GitHub security advisory
- Enhancement requests: Standard issue process

---

**Note**: This security framework is designed to be comprehensive but should be regularly reviewed and updated based on emerging threats and security best practices.
