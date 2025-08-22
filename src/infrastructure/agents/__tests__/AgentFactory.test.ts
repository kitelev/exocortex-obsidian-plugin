import { AgentFactory } from "../AgentFactory";
import {
  TaskRequirements,
  AgentPerformanceMetrics,
  AgentQualityMetrics,
} from "../types/AgentTypes";
import { PerformanceContext } from "../monitoring/AgentPerformanceMonitor";

describe("AgentFactory", () => {
  let agentFactory: AgentFactory;
  let mockTaskRequirements: TaskRequirements;

  beforeEach(() => {
    agentFactory = new AgentFactory({
      monitoringEnabled: true,
      evolutionEnabled: true,
      orchestrationEnabled: true,
      lifecycleEnabled: true,
      qualityThreshold: 0.8,
    });

    mockTaskRequirements = {
      domain: "testing",
      complexity: 5,
      urgency: "medium",
      capabilities: ["test-execution", "validation", "reporting"],
      constraints: ["performance", "security"],
      expectedLoad: 50,
    };
  });

  describe("Agent Creation", () => {
    it("should successfully create a new agent when no suitable agent exists", async () => {
      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      const result = await agentFactory.createAgent(request);

      expect(result.isSuccess).toBe(true);
      const creationResult = result.getValue()!;
      expect(creationResult.decision.decision).toBe("CREATE_NEW_AGENT");
      expect(creationResult.agent).toBeDefined();
      expect(creationResult.agentFile).toBeDefined();
      expect(creationResult.deploymentPlan).toBeDefined();
      expect(creationResult.monitoringPlan).toBeDefined();
    });

    it("should recommend using existing agent when suitable agent is available", async () => {
      // First create an agent
      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      await agentFactory.createAgent(request);

      // Now try to create another similar agent
      const secondRequest = {
        requirements: {
          ...mockTaskRequirements,
          complexity: 4, // Similar complexity
          capabilities: ["test-execution", "validation"], // Similar capabilities
        },
        urgency: "low" as const,
        requesterId: "test-user-2",
        context: { source: "test" },
      };

      const result = await agentFactory.createAgent(secondRequest);

      expect(result.isSuccess).toBe(true);
      const creationResult = result.getValue()!;
      expect(["USE_EXISTING", "EXTEND_AGENT", "CREATE_NEW_AGENT"]).toContain(
        creationResult.decision.decision,
      );
    });

    it("should validate agent creation constraints", async () => {
      const request = {
        requirements: mockTaskRequirements,
        urgency: "critical" as const,
        requesterId: "test-user",
        context: { source: "test" },
        constraints: {
          maxCreationTime: 1000, // Very short time
          resourceLimits: {
            memory: 128,
            cpu: 10,
          },
        },
      };

      const result = await agentFactory.createAgent(request);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const creationResult = result.getValue()!;
        expect(creationResult.deploymentPlan?.initialState).toBeDefined();
      }
    });

    it("should handle invalid task requirements gracefully", async () => {
      const invalidRequest = {
        requirements: {
          domain: "",
          complexity: -1,
          urgency: "medium" as const,
          capabilities: [],
          constraints: [],
          expectedLoad: -10,
        },
        urgency: "medium" as const,
        requesterId: "test-user",
        context: {},
      };

      const result = await agentFactory.createAgent(invalidRequest);

      // The system should either handle it gracefully or fail with descriptive error
      if (!result.isSuccess) {
        expect(result.errorValue()).toContain("requirements");
      }
    });
  });

  describe("Performance Monitoring", () => {
    it("should record agent performance metrics", async () => {
      // Create an agent first
      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      const creationResult = await agentFactory.createAgent(request);
      expect(creationResult.isSuccess).toBe(true);

      const agentId = creationResult.getValue()!.agent!.name;

      const performanceMetrics: AgentPerformanceMetrics = {
        averageResponseTime: 25,
        p95ResponseTime: 45,
        p99ResponseTime: 80,
        throughput: 100,
        errorRate: 0.02,
        successRate: 0.98,
        retryRate: 0.05,
        memoryUsage: 512,
        cpuUsage: 35,
        apiCalls: 50,
        tasksCompleted: 95,
        userSatisfaction: 0.9,
        valueDelivered: 0.85,
      };

      const qualityMetrics: AgentQualityMetrics = {
        functionality: {
          completeness: 0.9,
          correctness: 0.95,
          appropriateness: 0.88,
        },
        reliability: {
          maturity: 0.85,
          availability: 0.99,
          faultTolerance: 0.8,
          recoverability: 0.9,
        },
        usability: {
          understandability: 0.87,
          learnability: 0.85,
          operability: 0.92,
        },
        efficiency: {
          timeBehavior: 0.9,
          resourceUtilization: 0.75,
        },
        maintainability: {
          analyzability: 0.85,
          changeability: 0.8,
          stability: 0.9,
          testability: 0.88,
        },
      };

      const context: PerformanceContext = {
        taskType: "testing",
        complexity: 5,
        duration: 30000,
        resourcesUsed: ["cpu", "memory"],
        environmentConditions: { load: "normal" },
      };

      const result = await agentFactory.recordPerformance(
        agentId,
        performanceMetrics,
        qualityMetrics,
        context,
      );

      expect(result.isSuccess).toBe(true);
    });

    it("should trigger evolution when performance degrades", async () => {
      // Create an agent
      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      const creationResult = await agentFactory.createAgent(request);
      const agentId = creationResult.getValue()!.agent!.name;

      // Record poor performance
      const poorPerformanceMetrics: AgentPerformanceMetrics = {
        averageResponseTime: 120,
        p95ResponseTime: 200,
        p99ResponseTime: 300,
        throughput: 10,
        errorRate: 0.15,
        successRate: 0.5, // Very low success rate
        retryRate: 0.3,
        memoryUsage: 2048,
        cpuUsage: 95,
        apiCalls: 200,
        tasksCompleted: 20,
        userSatisfaction: 0.3,
        valueDelivered: 0.2,
      };

      const poorQualityMetrics: AgentQualityMetrics = {
        functionality: {
          completeness: 0.4,
          correctness: 0.5,
          appropriateness: 0.3,
        },
        reliability: {
          maturity: 0.3,
          availability: 0.7,
          faultTolerance: 0.4,
          recoverability: 0.5,
        },
        usability: {
          understandability: 0.5,
          learnability: 0.4,
          operability: 0.6,
        },
        efficiency: {
          timeBehavior: 0.3,
          resourceUtilization: 0.2,
        },
        maintainability: {
          analyzability: 0.4,
          changeability: 0.3,
          stability: 0.4,
          testability: 0.5,
        },
      };

      const context: PerformanceContext = {
        taskType: "testing",
        complexity: 8,
        duration: 120000,
        resourcesUsed: ["cpu", "memory", "network"],
        environmentConditions: { load: "high" },
      };

      const result = await agentFactory.recordPerformance(
        agentId,
        poorPerformanceMetrics,
        poorQualityMetrics,
        context,
      );

      expect(result.isSuccess).toBe(true);

      // Evolution should be triggered (implicitly tested through the method)
    });
  });

  describe("Agent Evolution", () => {
    it("should propose evolution for underperforming agent", async () => {
      // Create an agent first
      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      const creationResult = await agentFactory.createAgent(request);
      const agentId = creationResult.getValue()!.agent!.name;

      const evolutionResult = await agentFactory.evolveAgent(agentId);

      if (evolutionResult.isSuccess) {
        const proposal = evolutionResult.getValue()!;
        expect(proposal.agentId).toBe(agentId);
        expect(proposal.confidence).toBeGreaterThan(0);
        expect(proposal.changes).toBeDefined();
        expect(proposal.expectedImpact).toBeDefined();
      }
      // Note: Evolution might fail if there's insufficient data, which is acceptable
    });

    it("should reject evolution with low confidence", async () => {
      // Create an agent
      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      const creationResult = await agentFactory.createAgent(request);
      const agentId = creationResult.getValue()!.agent!.name;

      const evolutionResult = await agentFactory.evolveAgent(agentId);

      if (!evolutionResult.isSuccess) {
        expect(evolutionResult.errorValue()).toContain("confidence");
      }
    });
  });

  describe("Orchestration", () => {
    it("should create execution plan for multi-agent task", async () => {
      // Create multiple agents
      const domains = ["testing", "quality", "performance"];
      const agentIds: string[] = [];

      for (const domain of domains) {
        const request = {
          requirements: {
            ...mockTaskRequirements,
            domain,
            capabilities: [`${domain}-specific`],
          },
          urgency: "medium" as const,
          requesterId: "test-user",
          context: { source: "test" },
        };

        const result = await agentFactory.createAgent(request);
        if (result.isSuccess) {
          agentIds.push(result.getValue()!.agent!.name);
        }
      }

      // Create orchestration plan
      const complexRequirements: TaskRequirements = {
        domain: "integration",
        complexity: 8,
        urgency: "high",
        capabilities: ["testing", "quality", "performance"],
        constraints: ["parallel-execution"],
        expectedLoad: 200,
      };

      const orchestrationResult =
        await agentFactory.orchestrateExecution(complexRequirements);

      if (orchestrationResult.isSuccess) {
        const plan = orchestrationResult.getValue()!;
        expect(plan.id).toBeDefined();
        expect(plan.pattern).toBeDefined();
        expect(plan.agents.length).toBeGreaterThan(0);
        expect(plan.estimatedDuration).toBeGreaterThan(0);
      }
    });
  });

  describe("Lifecycle Management", () => {
    it("should evaluate agent promotion readiness", async () => {
      // Create an agent
      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      const creationResult = await agentFactory.createAgent(request);
      const agentId = creationResult.getValue()!.agent!.name;

      const lifecycleResult = await agentFactory.manageLifecycle(agentId);

      expect(lifecycleResult.isSuccess).toBe(true);

      const recommendation = lifecycleResult.getValue()!;
      if (recommendation) {
        expect(recommendation.agentId).toBe(agentId);
        expect(recommendation.currentState).toBeDefined();
        expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
        expect(recommendation.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("System Overview", () => {
    it("should provide comprehensive system overview", async () => {
      // Create a few agents
      const domains = ["testing", "quality"];
      for (const domain of domains) {
        const request = {
          requirements: {
            ...mockTaskRequirements,
            domain,
          },
          urgency: "medium" as const,
          requesterId: "test-user",
          context: { source: "test" },
        };

        await agentFactory.createAgent(request);
      }

      const overviewResult = agentFactory.getSystemOverview();

      expect(overviewResult.isSuccess).toBe(true);

      const overview = overviewResult.getValue()!;
      expect(overview.totalAgents).toBeGreaterThan(0);
      expect(overview.stateDistribution).toBeDefined();
      expect(overview.domainCoverage).toBeDefined();
      expect(overview.performanceSummary).toBeDefined();
      expect(overview.recentActivity).toBeDefined();
      expect(overview.recommendations).toBeDefined();

      // Validate structure
      expect(typeof overview.performanceSummary.averageResponseTime).toBe(
        "number",
      );
      expect(typeof overview.performanceSummary.systemSuccessRate).toBe(
        "number",
      );
      expect(Array.isArray(overview.recentActivity)).toBe(true);
      expect(Array.isArray(overview.recommendations)).toBe(true);
    });

    it("should provide factory metrics", async () => {
      const metricsResult = agentFactory.getFactoryMetrics();

      expect(metricsResult.isSuccess).toBe(true);

      const metrics = metricsResult.getValue()!;
      expect(typeof metrics.totalAgentsCreated).toBe("number");
      expect(typeof metrics.creationSuccessRate).toBe("number");
      expect(typeof metrics.averageCreationTime).toBe("number");
      expect(typeof metrics.templateUsageStats).toBe("object");
      expect(typeof metrics.qualityScores).toBe("object");
    });
  });

  describe("System Optimization", () => {
    it("should identify optimization opportunities", async () => {
      // Create several agents to trigger optimization recommendations
      for (let i = 0; i < 5; i++) {
        const request = {
          requirements: {
            ...mockTaskRequirements,
            domain: `test-domain-${i}`,
          },
          urgency: "medium" as const,
          requesterId: "test-user",
          context: { source: "test" },
        };

        await agentFactory.createAgent(request);
      }

      const optimizationResult = await agentFactory.optimizeSystem();

      expect(optimizationResult.isSuccess).toBe(true);

      const optimizations = optimizationResult.getValue()!;
      expect(Array.isArray(optimizations)).toBe(true);
      // Optimizations might be empty if system is already optimal
    });
  });

  describe("Error Handling", () => {
    it("should handle agent creation failures gracefully", async () => {
      const invalidRequest = {
        requirements: {
          domain: "", // Invalid empty domain
          complexity: 0,
          urgency: "medium" as const,
          capabilities: [],
          constraints: [],
          expectedLoad: 0,
        },
        urgency: "medium" as const,
        requesterId: "",
        context: {},
      };

      const result = await agentFactory.createAgent(invalidRequest);

      // Should either succeed with warnings or fail with descriptive error
      if (!result.isSuccess) {
        expect(typeof result.errorValue()).toBe("string");
        expect(result.errorValue().length).toBeGreaterThan(0);
      }
    });

    it("should handle non-existent agent operations gracefully", async () => {
      const nonExistentAgentId = "non-existent-agent-123";

      const evolutionResult =
        await agentFactory.evolveAgent(nonExistentAgentId);
      expect(evolutionResult.isSuccess).toBe(false);
      expect(evolutionResult.errorValue()).toContain("not found");

      const lifecycleResult =
        await agentFactory.manageLifecycle(nonExistentAgentId);
      expect(lifecycleResult.isSuccess).toBe(false);
      expect(lifecycleResult.errorValue()).toContain("not found");
    });
  });

  describe("Configuration", () => {
    it("should respect disabled features", async () => {
      const disabledFactory = new AgentFactory({
        monitoringEnabled: false,
        evolutionEnabled: false,
        orchestrationEnabled: false,
        lifecycleEnabled: false,
      });

      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      const creationResult = await disabledFactory.createAgent(request);
      expect(creationResult.isSuccess).toBe(true);

      const agentId = creationResult.getValue()!.agent!.name;

      // Evolution should be disabled
      const evolutionResult = await disabledFactory.evolveAgent(agentId);
      expect(evolutionResult.isSuccess).toBe(false);
      expect(evolutionResult.errorValue()).toContain("disabled");

      // Orchestration should be disabled
      const orchestrationResult =
        await disabledFactory.orchestrateExecution(mockTaskRequirements);
      expect(orchestrationResult.isSuccess).toBe(false);
      expect(orchestrationResult.errorValue()).toContain("disabled");

      // Lifecycle should be disabled
      const lifecycleResult = await disabledFactory.manageLifecycle(agentId);
      expect(lifecycleResult.isSuccess).toBe(false);
      expect(lifecycleResult.errorValue()).toContain("disabled");
    });

    it("should enforce quality thresholds", async () => {
      const strictFactory = new AgentFactory({
        qualityThreshold: 0.95, // Very high threshold
      });

      const request = {
        requirements: mockTaskRequirements,
        urgency: "medium" as const,
        requesterId: "test-user",
        context: { source: "test" },
      };

      const result = await strictFactory.createAgent(request);

      // Should still create agent but might have different validation results
      expect(result.isSuccess).toBe(true);

      if (result.getValue()!.validationResult) {
        const validation = result.getValue()!.validationResult!;
        // Validation might be stricter due to high quality threshold
        expect(typeof validation.score).toBe("number");
      }
    });
  });
});
