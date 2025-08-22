import { Result } from "../../../domain/core/Result";
import {
  AgentSummary,
  TaskRequirements,
  CreateDecision,
  GRASPMetrics,
  SOLIDMetrics,
  AgentSpecification,
} from "../types/AgentTypes";

export class AgentNecessityAnalyzer {
  private readonly graspWeights = {
    informationExpert: 0.2,
    lowCoupling: 0.2,
    highCohesion: 0.2,
    creator: 0.15,
    controller: 0.1,
    polymorphism: 0.05,
    pureDesign: 0.05,
    indirection: 0.03,
    protectedVariations: 0.02,
  };

  private readonly solidThresholds = {
    singleResponsibility: 0.85,
    openClosed: 0.9,
    liskovSubstitution: 0.95,
    interfaceSegregation: 0.8,
    dependencyInversion: 0.75,
  };

  analyzeNeed(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): Result<CreateDecision> {
    try {
      // Step 1: Calculate GRASP metrics
      const graspMetrics = this.calculateGRASPMetrics(task, existingAgents);

      // Step 2: Calculate SOLID compliance
      const solidMetrics = this.calculateSOLIDMetrics(task, existingAgents);

      // Step 3: Determine decision based on weighted analysis
      const decision = this.makeDecision(
        task,
        existingAgents,
        graspMetrics,
        solidMetrics,
      );

      return Result.ok(decision);
    } catch (error) {
      return Result.fail(
        `Agent necessity analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private calculateGRASPMetrics(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): GRASPMetrics {
    const domainExperts = existingAgents.filter(
      (agent) =>
        agent.domain === task.domain ||
        agent.capabilities.some((cap) => task.capabilities.includes(cap)),
    );

    return {
      informationExpert: this.assessInformationExpert(task, domainExperts),
      creator: this.assessCreator(task, existingAgents),
      controller: this.assessController(task, existingAgents),
      lowCoupling: this.assessLowCoupling(task, existingAgents),
      highCohesion: this.assessHighCohesion(task, domainExperts),
      polymorphism: this.assessPolymorphism(task, existingAgents),
      pureDesign: this.assessPureDesign(task),
      indirection: this.assessIndirection(task, existingAgents),
      protectedVariations: this.assessProtectedVariations(task, existingAgents),
    };
  }

  private calculateSOLIDMetrics(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): SOLIDMetrics {
    return {
      singleResponsibility: this.assessSingleResponsibility(
        task,
        existingAgents,
      ),
      openClosed: this.assessOpenClosed(task, existingAgents),
      liskovSubstitution: this.assessLiskovSubstitution(task, existingAgents),
      interfaceSegregation: this.assessInterfaceSegregation(
        task,
        existingAgents,
      ),
      dependencyInversion: this.assessDependencyInversion(task, existingAgents),
    };
  }

  private makeDecision(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
    graspMetrics: GRASPMetrics,
    solidMetrics: SOLIDMetrics,
  ): CreateDecision {
    // Calculate weighted GRASP score
    const graspScore = Object.entries(graspMetrics).reduce(
      (total, [key, value]) => {
        const weight = this.graspWeights[key as keyof GRASPMetrics] || 0;
        return total + value * weight;
      },
      0,
    );

    // Check SOLID violations
    const solidViolations = this.checkSOLIDViolations(solidMetrics);

    // Decision logic
    if (graspScore < 0.6 || solidViolations.length > 0) {
      return {
        decision: "CREATE_NEW_AGENT",
        confidence: 1 - graspScore,
        rationale: this.generateRationale(
          graspMetrics,
          solidMetrics,
          solidViolations,
        ),
        specification: this.designAgent(task, graspMetrics),
      };
    }

    // Find best existing agent
    const bestAgent = this.selectBestFit(existingAgents, task);

    if (bestAgent && graspScore > 0.8) {
      return {
        decision: "USE_EXISTING",
        confidence: graspScore,
        rationale: `Existing agent "${bestAgent.name}" adequately handles the requirements`,
        selectedAgent: bestAgent.name,
      };
    }

    if (bestAgent && graspScore > 0.7) {
      return {
        decision: "EXTEND_AGENT",
        confidence: graspScore,
        rationale: `Agent "${bestAgent.name}" can be extended to meet requirements`,
        selectedAgent: bestAgent.name,
        adaptations: this.suggestAdaptations(task, bestAgent),
      };
    }

    return {
      decision: "ADAPT_EXISTING",
      confidence: graspScore,
      rationale: "Minor adaptation of existing agent would suffice",
      selectedAgent: bestAgent?.name,
      adaptations: this.suggestAdaptations(
        task,
        bestAgent || existingAgents[0],
      ),
    };
  }

  private assessInformationExpert(
    task: TaskRequirements,
    domainExperts: AgentSummary[],
  ): number {
    if (domainExperts.length === 0) return 0;

    const bestMatch = domainExperts.reduce((best, agent) => {
      const capabilityMatch =
        task.capabilities.filter((cap) => agent.capabilities.includes(cap))
          .length / task.capabilities.length;

      return capabilityMatch > best ? capabilityMatch : best;
    }, 0);

    return bestMatch;
  }

  private assessCreator(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const creatorAgents = existingAgents.filter(
      (agent) =>
        agent.capabilities.includes("creation") ||
        agent.capabilities.includes("factory") ||
        agent.name.toLowerCase().includes("creator"),
    );

    return creatorAgents.length > 0 ? 0.8 : 0.3;
  }

  private assessController(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const controllerAgents = existingAgents.filter(
      (agent) =>
        agent.capabilities.includes("orchestration") ||
        agent.capabilities.includes("coordination") ||
        agent.name.toLowerCase().includes("orchestrator"),
    );

    return controllerAgents.length > 0 ? 0.9 : 0.4;
  }

  private assessLowCoupling(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    // Higher score means lower coupling (good)
    const domainSpecificAgents = existingAgents.filter(
      (agent) => agent.domain === task.domain,
    );
    const couplingScore = domainSpecificAgents.length > 3 ? 0.3 : 0.8;

    return couplingScore;
  }

  private assessHighCohesion(
    task: TaskRequirements,
    domainExperts: AgentSummary[],
  ): number {
    if (domainExperts.length === 0) return 1.0; // New domain = high cohesion potential

    const avgCapabilities =
      domainExperts.reduce((sum, agent) => sum + agent.capabilities.length, 0) /
      domainExperts.length;

    // Lower number of capabilities per agent = higher cohesion
    return Math.max(0, 1 - avgCapabilities / 10);
  }

  private assessPolymorphism(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const polymorphicAgents = existingAgents.filter(
      (agent) =>
        agent.capabilities.includes("abstraction") ||
        agent.capabilities.includes("interface"),
    );

    return polymorphicAgents.length / Math.max(existingAgents.length, 1);
  }

  private assessPureDesign(task: TaskRequirements): number {
    // Simple heuristic: domain-specific tasks tend to be more pure
    const domainSpecificKeywords = ["query", "process", "analyze", "transform"];
    const hasPureElements = task.capabilities.some((cap) =>
      domainSpecificKeywords.some((keyword) =>
        cap.toLowerCase().includes(keyword),
      ),
    );

    return hasPureElements ? 0.8 : 0.5;
  }

  private assessIndirection(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const abstractionAgents = existingAgents.filter(
      (agent) =>
        agent.capabilities.includes("abstraction") ||
        agent.capabilities.includes("interface") ||
        agent.capabilities.includes("proxy"),
    );

    return abstractionAgents.length > 0 ? 0.7 : 0.4;
  }

  private assessProtectedVariations(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const stabilityAgents = existingAgents.filter(
      (agent) =>
        agent.capabilities.includes("stability") ||
        agent.capabilities.includes("versioning") ||
        agent.state === "production",
    );

    return stabilityAgents.length / Math.max(existingAgents.length, 1);
  }

  private assessSingleResponsibility(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const domainAgents = existingAgents.filter(
      (agent) => agent.domain === task.domain,
    );

    if (domainAgents.length === 0) return 1.0; // New domain

    const responsibilityOverlap =
      domainAgents.reduce((overlap, agent) => {
        const commonCaps = task.capabilities.filter((cap) =>
          agent.capabilities.includes(cap),
        );
        return overlap + commonCaps.length / task.capabilities.length;
      }, 0) / domainAgents.length;

    return 1 - responsibilityOverlap; // Lower overlap = better SRP
  }

  private assessOpenClosed(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const extensibleAgents = existingAgents.filter(
      (agent) =>
        agent.capabilities.includes("extensible") ||
        agent.capabilities.includes("configurable") ||
        agent.state === "production",
    );

    return extensibleAgents.length / Math.max(existingAgents.length, 1);
  }

  private assessLiskovSubstitution(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    // Assess behavioral compatibility
    const compatibleAgents = existingAgents.filter(
      (agent) =>
        agent.domain === task.domain &&
        task.capabilities.every(
          (cap) =>
            agent.capabilities.includes(cap) ||
            agent.capabilities.some((agentCap) => agentCap.includes(cap)),
        ),
    );

    return compatibleAgents.length > 0 ? 0.9 : 0.3;
  }

  private assessInterfaceSegregation(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const specificAgents = existingAgents.filter(
      (agent) =>
        agent.capabilities.length <= 5 && // Focused agents
        agent.capabilities.some((cap) => task.capabilities.includes(cap)),
    );

    return specificAgents.length / Math.max(existingAgents.length, 1);
  }

  private assessDependencyInversion(
    task: TaskRequirements,
    existingAgents: AgentSummary[],
  ): number {
    const abstractionAgents = existingAgents.filter(
      (agent) =>
        agent.capabilities.includes("abstraction") ||
        agent.capabilities.includes("interface") ||
        agent.name.toLowerCase().includes("manager"),
    );

    return abstractionAgents.length / Math.max(existingAgents.length, 1);
  }

  private checkSOLIDViolations(solidMetrics: SOLIDMetrics): string[] {
    const violations: string[] = [];

    Object.entries(solidMetrics).forEach(([principle, score]) => {
      const threshold = this.solidThresholds[principle as keyof SOLIDMetrics];
      if (score < threshold) {
        violations.push(`${principle}: ${score.toFixed(2)} < ${threshold}`);
      }
    });

    return violations;
  }

  private generateRationale(
    graspMetrics: GRASPMetrics,
    solidMetrics: SOLIDMetrics,
    violations: string[],
  ): string {
    const reasons: string[] = [];

    if (graspMetrics.informationExpert < 0.5) {
      reasons.push("No existing agent has sufficient domain expertise");
    }

    if (graspMetrics.highCohesion < 0.7) {
      reasons.push("Adding to existing agent would reduce cohesion");
    }

    if (graspMetrics.lowCoupling < 0.6) {
      reasons.push("High coupling detected in current domain");
    }

    if (violations.length > 0) {
      reasons.push(`SOLID principle violations: ${violations.join(", ")}`);
    }

    return reasons.length > 0
      ? reasons.join("; ")
      : "New agent creation recommended for optimal architecture";
  }

  private designAgent(
    task: TaskRequirements,
    graspMetrics: GRASPMetrics,
  ): AgentSpecification {
    const name = this.generateAgentName(task);

    return {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      displayName: name,
      description: `Specialized agent for ${task.domain} domain tasks`,
      purpose: `Handle ${task.capabilities.join(", ")} in ${task.domain}`,
      mission: `Deliver high-quality ${task.domain} solutions while maintaining system integrity`,
      domain: task.domain,
      color: this.selectAgentColor(task.domain),
      responsibilities: this.generateResponsibilities(task),
      standards: this.generateStandards(task),
      tools: this.generateTools(task),
      protocols: this.generateProtocols(),
      workflows: this.generateWorkflows(task),
      metrics: this.generateMetrics(task),
      bestPractices: this.generateBestPractices(task),
      requirements: {
        domain: task.domain,
        capabilities: task.capabilities,
        performanceTargets: [],
        qualityThresholds: [],
        constraints: task.constraints.map((c) => ({
          type: "technical" as const,
          description: c,
          impact: "medium",
        })),
        dependencies: [],
      },
    };
  }

  private selectBestFit(
    agents: AgentSummary[],
    task: TaskRequirements,
  ): AgentSummary | null {
    if (agents.length === 0) return null;

    return (
      agents
        .map((agent) => ({
          agent,
          score: this.calculateFitScore(agent, task),
        }))
        .sort((a, b) => b.score - a.score)[0]?.agent || null
    );
  }

  private calculateFitScore(
    agent: AgentSummary,
    task: TaskRequirements,
  ): number {
    const domainMatch = agent.domain === task.domain ? 0.4 : 0;
    const capabilityMatch =
      (task.capabilities.filter((cap) => agent.capabilities.includes(cap))
        .length /
        task.capabilities.length) *
      0.4;
    const performanceScore = agent.performance * 0.2;

    return domainMatch + capabilityMatch + performanceScore;
  }

  private suggestAdaptations(
    task: TaskRequirements,
    agent: AgentSummary,
  ): string[] {
    const adaptations: string[] = [];

    const missingCapabilities = task.capabilities.filter(
      (cap) => !agent.capabilities.includes(cap),
    );

    if (missingCapabilities.length > 0) {
      adaptations.push(`Add capabilities: ${missingCapabilities.join(", ")}`);
    }

    if (agent.domain !== task.domain) {
      adaptations.push(`Extend domain knowledge for ${task.domain}`);
    }

    if (task.complexity > 7) {
      adaptations.push("Add advanced complexity handling patterns");
    }

    return adaptations;
  }

  private generateAgentName(task: TaskRequirements): string {
    const domainPart =
      task.domain.charAt(0).toUpperCase() + task.domain.slice(1);
    const capabilityPart = task.capabilities[0] || "Specialist";
    return `${domainPart} ${capabilityPart} Agent`;
  }

  private selectAgentColor(domain: string): string {
    const colorMap: Record<string, string> = {
      engineering: "blue",
      quality: "green",
      product: "purple",
      operations: "orange",
      security: "red",
      data: "teal",
      design: "pink",
      research: "indigo",
    };

    return colorMap[domain.toLowerCase()] || "gray";
  }

  private generateResponsibilities(task: TaskRequirements): any[] {
    return task.capabilities.map((capability, index) => ({
      category: task.domain,
      description: `Handle ${capability} operations with high quality and efficiency`,
      priority: index + 1,
      patterns: [`${capability}-pattern`, `${task.domain}-${capability}`],
    }));
  }

  private generateStandards(task: TaskRequirements): any[] {
    const commonStandards = [
      {
        name: "ISO/IEC 25010",
        version: "2011",
        compliance: ["Quality"],
        validation: ["Metrics"],
      },
      {
        name: "IEEE SWEBOK",
        version: "v3",
        compliance: ["Engineering"],
        validation: ["Practices"],
      },
    ];

    return commonStandards;
  }

  private generateTools(task: TaskRequirements): any[] {
    return [
      {
        name: "Claude Code",
        type: "required",
        usage: "Primary interface",
        constraints: [],
      },
      {
        name: "TypeScript",
        type: "required",
        usage: "Development",
        constraints: ["Strict mode"],
      },
    ];
  }

  private generateProtocols(): any[] {
    return [
      {
        name: "Task Assignment",
        type: "input",
        format: "YAML",
        schema: { task: "string", priority: "string", deadline: "string" },
      },
    ];
  }

  private generateWorkflows(task: TaskRequirements): any[] {
    return [
      {
        name: "Standard Processing",
        steps: [
          {
            id: "1",
            name: "Analyze",
            action: "analyze-requirements",
            inputs: ["task"],
            outputs: ["analysis"],
          },
          {
            id: "2",
            name: "Execute",
            action: "execute-task",
            inputs: ["analysis"],
            outputs: ["result"],
          },
          {
            id: "3",
            name: "Validate",
            action: "validate-result",
            inputs: ["result"],
            outputs: ["validation"],
          },
        ],
        triggers: ["task-assigned"],
        outcomes: ["task-completed", "task-failed"],
      },
    ];
  }

  private generateMetrics(task: TaskRequirements): any[] {
    return [
      {
        name: "Success Rate",
        type: "quality",
        target: 0.95,
        unit: "percentage",
        measurement: "completed/total",
      },
      {
        name: "Response Time",
        type: "efficiency",
        target: 30,
        unit: "seconds",
        measurement: "end-to-end",
      },
    ];
  }

  private generateBestPractices(task: TaskRequirements): any[] {
    return [
      {
        category: "Quality",
        practice: "Validate inputs and outputs",
        rationale: "Ensure data integrity and prevent errors",
        implementation: "Use Result pattern for error handling",
      },
    ];
  }
}
