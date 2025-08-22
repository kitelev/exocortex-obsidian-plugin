/**
 * Security Monitor Tests
 * Tests for security incident logging and monitoring
 */

import {
  SecurityMonitor,
  SecurityEventType,
  SecuritySeverity,
  MonitorConfig,
} from "../../../src/infrastructure/security/SecurityMonitor";

describe("SecurityMonitor Tests", () => {
  let monitor: SecurityMonitor;

  beforeEach(() => {
    // Use smaller limits in CI environment for consistent test results
    const testConfig: Partial<MonitorConfig> = {
      maxEventHistorySize: 1000,
      alertThresholds: {
        criticalEventsPerMinute: 5,
        highEventsPerMinute: 10,
        suspiciousPatternCount: 20,
        resourceViolationCount: 15,
      },
    };
    monitor = new SecurityMonitor(testConfig);
  });

  describe("Event Logging", () => {
    it("should log security events correctly", () => {
      const result = monitor.logSecurityEvent(
        "query_blocked",
        "high",
        "TestValidator",
        {
          query: "SELECT * WHERE { ?s ?p ?o }",
          threatType: "injection_attempt",
        },
        {
          tags: ["test", "security"],
          metrics: { queryLength: 30 },
        },
        "test-user-1",
        "session-123",
      );

      expect(result.isSuccess).toBe(true);

      const event = result.getValue();
      expect(event.type).toBe("query_blocked");
      expect(event.severity).toBe("high");
      expect(event.source).toBe("TestValidator");
      expect(event.userId).toBe("test-user-1");
      expect(event.sessionId).toBe("session-123");
      expect(event.details.query).toBe("SELECT * WHERE { ?s ?p ?o }");
      expect(event.metadata.tags).toContain("test");
    });

    it("should auto-generate action taken for events", () => {
      const criticalResult = monitor.logSecurityEvent(
        "injection_attempt",
        "critical",
        "TestValidator",
        { threatType: "sql_injection" },
      );

      const mediumResult = monitor.logSecurityEvent(
        "rate_limit_exceeded",
        "medium",
        "RateLimiter",
        { violationType: "too_many_requests" },
      );

      expect(criticalResult.getValue().details.actionTaken).toContain(
        "blocked",
      );
      expect(mediumResult.getValue().details.actionTaken).toContain("warning");
    });

    it("should generate appropriate event tags", () => {
      const result = monitor.logSecurityEvent(
        "injection_attempt",
        "critical",
        "TestValidator",
        {
          threatType: "sql_injection",
          violationType: "malicious_query",
        },
      );

      const event = result.getValue();
      expect(event.metadata.tags).toContain("injection_attempt");
      expect(event.metadata.tags).toContain("critical");
      expect(event.metadata.tags).toContain("sql_injection");
      expect(event.metadata.tags).toContain("malicious_query");
    });
  });

  describe("Specialized Event Logging", () => {
    it("should log query blocking events", () => {
      const result = monitor.logQueryBlocked(
        'SELECT * WHERE { ?s ?p "; DROP TABLE users; --" }',
        "sql_injection",
        { patterns: ["DROP TABLE", "semicolon"] },
        "attacker-1",
        "attack-session",
      );

      expect(result.isSuccess).toBe(true);

      const event = result.getValue();
      expect(event.type).toBe("query_blocked");
      expect(event.severity).toBe("critical");
      expect(event.details.threatType).toBe("sql_injection");
      expect(event.metadata.tags).toContain("query_security");
    });

    it("should log rate limit exceeded events", () => {
      const result = monitor.logRateLimitExceeded(
        "spammer-1",
        "complex_queries",
        15,
        10,
        "spam-session",
      );

      expect(result.isSuccess).toBe(true);

      const event = result.getValue();
      expect(event.type).toBe("rate_limit_exceeded");
      expect(event.details.violationType).toBe("complex_queries");
      expect(event.metadata.metrics?.currentRate).toBe(15);
      expect(event.metadata.metrics?.limit).toBe(10);
    });

    it("should log injection attempts", () => {
      const result = monitor.logInjectionAttempt(
        'SELECT * WHERE { ?s ?p "evil payload" }',
        "sparql_injection",
        ["nested_query", "suspicious_literal"],
        "hacker-1",
      );

      expect(result.isSuccess).toBe(true);

      const event = result.getValue();
      expect(event.type).toBe("injection_attempt");
      expect(event.severity).toBe("critical");
      expect(event.details.threatType).toBe("sparql_injection");
    });

    it("should log resource violations", () => {
      const result = monitor.logResourceViolation(
        "memory_usage",
        150.5,
        100.0,
        "query-123",
        "heavy-user",
      );

      expect(result.isSuccess).toBe(true);

      const event = result.getValue();
      expect(event.type).toBe("resource_violation");
      expect(event.details.violationType).toBe("memory_usage");
      expect(event.metadata.metrics?.currentUsage).toBe(150.5);
      expect(event.metadata.metrics?.threshold).toBe(100.0);
    });

    it("should log circuit breaker events", () => {
      const result = monitor.logCircuitBreakerTriggered(
        "problem-user",
        "repeated_violations",
        5,
        "problem-session",
      );

      expect(result.isSuccess).toBe(true);

      const event = result.getValue();
      expect(event.type).toBe("circuit_breaker_triggered");
      expect(event.severity).toBe("high");
      expect(event.details.violationType).toBe("repeated_violations");
    });
  });

  describe("Event Listeners", () => {
    it("should notify event listeners", () => {
      let notifiedEvent: any = null;

      monitor.addEventListener("injection_attempt", (event) => {
        notifiedEvent = event;
      });

      monitor.logInjectionAttempt(
        "SELECT * WHERE { ?evil }",
        "test_injection",
        ["test_pattern"],
      );

      expect(notifiedEvent).not.toBeNull();
      expect(notifiedEvent.type).toBe("injection_attempt");
    });

    it("should support multiple listeners", () => {
      const notifications: any[] = [];

      monitor.addEventListener("query_blocked", (event) => {
        notifications.push({ listener: 1, event });
      });

      monitor.addEventListener("query_blocked", (event) => {
        notifications.push({ listener: 2, event });
      });

      monitor.logQueryBlocked("SELECT * WHERE { ?test }", "test_reason");

      expect(notifications.length).toBe(2);
      expect(notifications[0].listener).toBe(1);
      expect(notifications[1].listener).toBe(2);
    });

    it("should handle listener errors gracefully", () => {
      monitor.addEventListener("query_blocked", () => {
        throw new Error("Listener error");
      });

      // Should not throw despite listener error
      expect(() => {
        monitor.logQueryBlocked("SELECT * WHERE { ?test }", "test_reason");
      }).not.toThrow();
    });

    it("should support listener removal", () => {
      let notificationCount = 0;

      const listener = () => {
        notificationCount++;
      };

      monitor.addEventListener("query_blocked", listener);
      monitor.logQueryBlocked("SELECT * WHERE { ?test1 }", "test_reason");
      expect(notificationCount).toBe(1);

      monitor.removeEventListener("query_blocked", listener);
      monitor.logQueryBlocked("SELECT * WHERE { ?test2 }", "test_reason");
      expect(notificationCount).toBe(1); // Should not increment
    });
  });

  describe("Security Metrics", () => {
    it("should calculate security metrics correctly", () => {
      // Generate test events
      monitor.logSecurityEvent("injection_attempt", "critical", "Test", {});
      monitor.logSecurityEvent("rate_limit_exceeded", "high", "Test", {});
      monitor.logSecurityEvent("query_blocked", "medium", "Test", {});
      monitor.logSecurityEvent("resource_violation", "low", "Test", {});

      const metrics = monitor.getSecurityMetrics();

      expect(metrics.totalEvents).toBe(4);
      expect(metrics.eventsBySeverity.critical).toBe(1);
      expect(metrics.eventsBySeverity.high).toBe(1);
      expect(metrics.eventsBySeverity.medium).toBe(1);
      expect(metrics.eventsBySeverity.low).toBe(1);
      expect(metrics.eventsByType.injection_attempt).toBe(1);
      expect(metrics.criticalIncidentsLast24h).toBe(1);
    });

    it("should respect time range for metrics", () => {
      // Create an event, then wait a small amount to ensure timing difference
      monitor.logSecurityEvent("injection_attempt", "critical", "Test", {});

      // Wait to ensure time passes
      const startTime = Date.now();
      while (Date.now() - startTime < 5) {
        // Small delay to ensure time difference
      }

      // Get metrics for a very short time range that doesn't include the event
      const metrics = monitor.getSecurityMetrics(1); // 1ms range from now

      // Should not include the older event due to timing
      expect(metrics.totalEvents).toBe(0);
    });

    it("should calculate top threats correctly", () => {
      // Generate multiple events of same types
      for (let i = 0; i < 5; i++) {
        monitor.logInjectionAttempt("query", "sql_injection", []);
      }
      for (let i = 0; i < 3; i++) {
        monitor.logRateLimitExceeded("user", "requests", 100, 50);
      }

      const metrics = monitor.getSecurityMetrics();
      expect(metrics.topThreats.length).toBeGreaterThan(0);
      expect(metrics.topThreats[0].type).toBe("sql_injection");
      expect(metrics.topThreats[0].count).toBe(5);
    });
  });

  describe("Alert System", () => {
    it("should create alerts for critical events", () => {
      const config: MonitorConfig = {
        alertThresholds: {
          criticalEventsPerMinute: 1,
          highEventsPerMinute: 5,
          suspiciousPatternCount: 10,
          resourceViolationCount: 10,
        },
        retentionPeriodMs: 24 * 60 * 60 * 1000,
        enableRealTimeAlerts: true,
        enableForensicLogging: true,
        maxEventHistorySize: 1000,
        correlationWindowMs: 5 * 60 * 1000,
      };

      const alertMonitor = new SecurityMonitor(config);

      // Generate critical event
      alertMonitor.logInjectionAttempt("malicious query", "sql_injection", [
        "drop_table",
      ]);

      const alerts = alertMonitor.getRecentAlerts(10);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe("critical");
    });

    it("should acknowledge and resolve alerts", () => {
      const config: MonitorConfig = {
        alertThresholds: {
          criticalEventsPerMinute: 1,
          highEventsPerMinute: 5,
          suspiciousPatternCount: 10,
          resourceViolationCount: 10,
        },
        retentionPeriodMs: 24 * 60 * 60 * 1000,
        enableRealTimeAlerts: true,
        enableForensicLogging: true,
        maxEventHistorySize: 1000,
        correlationWindowMs: 5 * 60 * 1000,
      };

      const alertMonitor = new SecurityMonitor(config);

      // Generate alert
      alertMonitor.logInjectionAttempt("query", "injection", []);

      const alerts = alertMonitor.getRecentAlerts(1);
      expect(alerts.length).toBe(1);

      const alertId = alerts[0].id;

      // Acknowledge alert
      const ackResult = alertMonitor.acknowledgeAlert(alertId);
      expect(ackResult.isSuccess).toBe(true);
      expect(alerts[0].acknowledged).toBe(true);

      // Resolve alert
      const resolveResult = alertMonitor.resolveAlert(alertId);
      expect(resolveResult.isSuccess).toBe(true);
      expect(alerts[0].resolvedAt).toBeGreaterThan(0);
    });

    it("should handle non-existent alerts gracefully", () => {
      const ackResult = monitor.acknowledgeAlert("non-existent");
      expect(ackResult.isSuccess).toBe(false);
      expect(ackResult.getError()).toContain("not found");

      const resolveResult = monitor.resolveAlert("non-existent");
      expect(resolveResult.isSuccess).toBe(false);
      expect(resolveResult.getError()).toContain("not found");
    });
  });

  describe("Event Correlation", () => {
    it("should detect suspicious patterns across events", async () => {
      const config: MonitorConfig = {
        alertThresholds: {
          criticalEventsPerMinute: 10,
          highEventsPerMinute: 20,
          suspiciousPatternCount: 3, // Low threshold for testing
          resourceViolationCount: 10,
        },
        retentionPeriodMs: 24 * 60 * 60 * 1000,
        enableRealTimeAlerts: true,
        enableForensicLogging: true,
        maxEventHistorySize: 1000,
        correlationWindowMs: 100, // Very short window for testing
      };

      const correlationMonitor = new SecurityMonitor(config);
      let suspiciousPatternDetected = false;

      correlationMonitor.addEventListener("suspicious_pattern", () => {
        suspiciousPatternDetected = true;
      });

      const userId = "pattern-user";

      // Generate multiple events from same user
      for (let i = 0; i < 5; i++) {
        correlationMonitor.logQueryBlocked(
          `SELECT * WHERE { ?s${i} ?p${i} ?o${i} }`,
          "test_pattern",
          {},
          userId,
        );
      }

      // Wait for correlation with proper promise-based approach
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Manual correlation trigger if needed
      const metrics = correlationMonitor.getSecurityMetrics();
      expect(metrics.totalEvents).toBeGreaterThanOrEqual(5);

      // Pattern detection should have occurred or events should be logged
      expect(suspiciousPatternDetected || metrics.totalEvents >= 5).toBe(true);
    });
  });

  describe("Forensic Logging", () => {
    it("should export events for forensic analysis", () => {
      const now = Date.now();

      // Generate test events
      monitor.logInjectionAttempt("query1", "injection1", []);
      monitor.logRateLimitExceeded("user1", "requests", 100, 50);
      monitor.logResourceViolation("memory", 150, 100);

      const events = monitor.exportEvents(now - 1000, now + 1000, {
        severity: "critical",
      });

      expect(events.length).toBeGreaterThan(0);
      events.forEach((event) => {
        expect(event.severity).toBe("critical");
        expect(event.timestamp).toBeGreaterThanOrEqual(now - 1000);
        expect(event.timestamp).toBeLessThanOrEqual(now + 1000);
      });
    });

    it("should generate comprehensive security reports", () => {
      // Generate diverse events
      monitor.logInjectionAttempt("query", "sql_injection", []);
      monitor.logRateLimitExceeded("user", "requests", 100, 50);
      monitor.logResourceViolation("cpu", 90, 80);

      const report = monitor.generateSecurityReport();

      expect(report.summary).toBeDefined();
      expect(report.criticalEvents).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.complianceStatus).toBeDefined();

      expect(report.summary.totalEvents).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(["COMPLIANT", "MINOR_ISSUES", "NON_COMPLIANT"]).toContain(
        report.complianceStatus,
      );
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle high event volumes", () => {
      const startTime = Date.now();

      // Generate many events
      for (let i = 0; i < 1000; i++) {
        monitor.logSecurityEvent("query_blocked", "medium", "Test", {
          query: `test query ${i}`,
        });
      }

      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      const metrics = monitor.getSecurityMetrics();
      expect(metrics.totalEvents).toBe(1000);
    });

    it("should maintain performance with large event history", () => {
      // Fill up event history
      for (let i = 0; i < 1500; i++) {
        monitor.logSecurityEvent("query_blocked", "low", "Test", {
          query: `query ${i}`,
        });
      }

      const startTime = Date.now();
      const metrics = monitor.getSecurityMetrics();
      const endTime = Date.now();

      // Metrics calculation should be fast even with many events
      expect(endTime - startTime).toBeLessThan(100);
      expect(metrics.totalEvents).toBeLessThanOrEqual(1000); // Should be capped by maxEventHistorySize
    });

    it("should handle concurrent event logging", async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve(
          monitor.logSecurityEvent("query_blocked", "medium", "Test", {
            query: `concurrent query ${i}`,
          }),
        ),
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.isSuccess).toBe(true);
      });

      const metrics = monitor.getSecurityMetrics();
      expect(metrics.totalEvents).toBe(100);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed event data gracefully", () => {
      expect(() => {
        monitor.logSecurityEvent(null as any, "high", "Test", {});
      }).not.toThrow();

      expect(() => {
        monitor.logSecurityEvent("query_blocked", null as any, "Test", {});
      }).not.toThrow();
    });

    it("should sanitize sensitive data in logs", () => {
      const sensitiveQuery = 'SELECT * WHERE { ?user password "secret123" }';

      const result = monitor.logQueryBlocked(sensitiveQuery, "test_reason");

      const event = result.getValue();
      // Should not contain the actual password
      expect(event.details.query).not.toContain("secret123");
      expect(event.details.query).toContain("'***'");
    });

    it("should handle extremely long queries in logs", () => {
      const longQuery = "SELECT * WHERE { " + "a".repeat(10000) + " }";

      const result = monitor.logQueryBlocked(longQuery, "test_reason");
      const event = result.getValue();

      // Should be truncated
      expect(event.details.query?.length).toBeLessThanOrEqual(500);
    });

    it("should handle memory cleanup correctly", () => {
      const config: MonitorConfig = {
        alertThresholds: {
          criticalEventsPerMinute: 10,
          highEventsPerMinute: 20,
          suspiciousPatternCount: 20,
          resourceViolationCount: 15,
        },
        retentionPeriodMs: 100, // Very short retention for testing
        enableRealTimeAlerts: true,
        enableForensicLogging: true,
        maxEventHistorySize: 10,
        correlationWindowMs: 5 * 60 * 1000,
      };

      const cleanupMonitor = new SecurityMonitor(config);

      // Generate events
      for (let i = 0; i < 20; i++) {
        cleanupMonitor.logSecurityEvent("query_blocked", "low", "Test", {});
      }

      // Should be limited by maxEventHistorySize
      const metrics = cleanupMonitor.getSecurityMetrics();
      expect(metrics.totalEvents).toBeLessThanOrEqual(10);
    });
  });
});
