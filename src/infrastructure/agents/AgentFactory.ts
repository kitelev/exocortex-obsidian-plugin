import { Result } from '../../domain/core/Result';
import {
  AgentSpecification,
  AgentSummary,
  TaskRequirements,
  CreateDecision,
  AgentPerformanceMetrics,
  AgentQualityMetrics,
  ValidationResult,
  RegistrationResult,
  AgentState
} from './types/AgentTypes';
import { AgentNecessityAnalyzer } from './core/AgentNecessityAnalyzer';
import { AgentTemplateSystem, AgentTemplate } from './templates/AgentTemplateSystem';
import { AgentPerformanceMonitor, PerformanceContext } from './monitoring/AgentPerformanceMonitor';
import { AgentEvolutionEngine, EvolutionContext, EvolutionProposal } from './evolution/AgentEvolutionEngine';
import { AgentOrchestrator, ExecutionPlan } from './orchestration/AgentOrchestrator';
import { AgentLifecycleManager, PromotionRecommendation } from './lifecycle/AgentLifecycleManager';

export interface AgentFactoryConfig {
  templatePath?: string;
  monitoringEnabled?: boolean;
  evolutionEnabled?: boolean;
  orchestrationEnabled?: boolean;
  lifecycleEnabled?: boolean;
  maxAgentsPerDomain?: number;
  qualityThreshold?: number;
}

export interface AgentCreationRequest {
  requirements: TaskRequirements;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requesterId: string;
  context: Record<string, any>;
  constraints?: CreationConstraints;
}

export interface CreationConstraints {
  mustUseTemplate?: string;
  maxCreationTime?: number;
  resourceLimits?: {
    memory: number;
    cpu: number;
  };
  complianceRequirements?: string[];
}

export interface AgentCreationResult {
  decision: CreateDecision;
  agent?: AgentSpecification;
  agentFile?: string;
  deploymentPlan?: DeploymentPlan;
  monitoringPlan?: MonitoringPlan;
  validationResult?: ValidationResult;
}

export interface DeploymentPlan {
  phase: 'immediate' | 'staged' | 'controlled';
  initialState: AgentState;
  validationCriteria: string[];
  rollbackPlan: string[];
  estimatedTime: number;
}

export interface MonitoringPlan {
  frequency: number;
  metrics: string[];
  alertThresholds: Record<string, number>;
  reportingSchedule: string[];
  escalationPlan: string[];
}

export interface FactoryMetrics {
  totalAgentsCreated: number;
  creationSuccessRate: number;
  averageCreationTime: number;
  templateUsageStats: Record<string, number>;
  qualityScores: Record<string, number>;
  evolutionImprovements: number;
  activeExperiments: number;
}

export interface SystemOverview {
  totalAgents: number;
  stateDistribution: Record<AgentState, number>;
  domainCoverage: Record<string, number>;
  performanceSummary: SystemPerformanceSummary;
  recentActivity: ActivitySummary[];
  recommendations: SystemRecommendation[];
}

export interface SystemPerformanceSummary {
  averageResponseTime: number;
  systemSuccessRate: number;
  totalThroughput: number;
  resourceUtilization: number;
  qualityScore: number;
}

export interface ActivitySummary {
  timestamp: Date;
  type: 'creation' | 'evolution' | 'transition' | 'retirement';
  agentId: string;
  details: string;
  impact: 'low' | 'medium' | 'high';
}

export interface SystemRecommendation {
  type: 'capacity' | 'performance' | 'quality' | 'architecture';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: string;
  estimatedImpact: number;
  timeline: number;
}

export class AgentFactory {
  private necessityAnalyzer: AgentNecessityAnalyzer;
  private templateSystem: AgentTemplateSystem;
  private performanceMonitor: AgentPerformanceMonitor;
  private evolutionEngine: AgentEvolutionEngine;
  private orchestrator: AgentOrchestrator;
  private lifecycleManager: AgentLifecycleManager;
  
  private agentRegistry: Map<string, AgentSummary> = new Map();
  private creationHistory: AgentCreationResult[] = [];
  private config: AgentFactoryConfig;

  constructor(config: AgentFactoryConfig = {}) {
    this.config = {
      monitoringEnabled: true,
      evolutionEnabled: true,
      orchestrationEnabled: true,
      lifecycleEnabled: true,
      maxAgentsPerDomain: 10,
      qualityThreshold: 0.8,
      ...config
    };

    this.necessityAnalyzer = new AgentNecessityAnalyzer();
    this.templateSystem = new AgentTemplateSystem();
    this.performanceMonitor = new AgentPerformanceMonitor();
    this.evolutionEngine = new AgentEvolutionEngine();
    this.orchestrator = new AgentOrchestrator();
    this.lifecycleManager = new AgentLifecycleManager();
  }

  async createAgent(request: AgentCreationRequest): Promise<Result<AgentCreationResult>> {
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze necessity
      const necessityResult = this.necessityAnalyzer.analyzeNeed(
        request.requirements,
        Array.from(this.agentRegistry.values())
      );

      if (!necessityResult.isSuccess) {
        return Result.fail(`Necessity analysis failed: ${necessityResult.errorValue()}`);
      }

      const decision = necessityResult.getValue()!;
      
      // Handle different decisions
      switch (decision.decision) {
        case 'USE_EXISTING':
          return this.handleUseExisting(decision, request);
          
        case 'EXTEND_AGENT':
          return this.handleExtendAgent(decision, request);
          
        case 'CREATE_NEW_AGENT':
          return this.handleCreateNewAgent(decision, request, startTime);
          
        default:
          return Result.fail(`Unknown decision type: ${decision.decision}`);
      }
    } catch (error) {
      return Result.fail(`Agent creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async evolveAgent(agentId: string): Promise<Result<EvolutionProposal>> {
    if (!this.config.evolutionEnabled) {
      return Result.fail('Evolution is disabled');
    }

    try {
      const agent = this.agentRegistry.get(agentId);
      if (!agent) {
        return Result.fail(`Agent ${agentId} not found`);
      }

      // Gather evolution context
      const context = await this.buildEvolutionContext(agentId);
      
      // Propose evolution
      const proposalResult = this.evolutionEngine.proposeEvolution(
        agentId,
        context,
        'guided'
      );

      if (!proposalResult.isSuccess) {
        return Result.fail(`Evolution proposal failed: ${proposalResult.errorValue()}`);
      }

      const proposal = proposalResult.getValue()!;

      // Validate proposal
      if (proposal.confidence < 0.7) {
        return Result.fail(`Evolution confidence too low: ${proposal.confidence}`);
      }

      return Result.ok(proposal);
    } catch (error) {
      return Result.fail(`Agent evolution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async orchestrateExecution(
    requirements: TaskRequirements,
    preferredPattern?: string
  ): Promise<Result<ExecutionPlan>> {
    if (!this.config.orchestrationEnabled) {
      return Result.fail('Orchestration is disabled');
    }

    try {
      const availableAgents = Array.from(this.agentRegistry.values())
        .filter(agent => agent.state === 'production' || agent.state === 'validation');

      if (availableAgents.length === 0) {
        return Result.fail('No available agents for orchestration');
      }

      const planResult = this.orchestrator.planExecution(
        requirements,
        availableAgents
      );

      if (!planResult.isSuccess) {
        return Result.fail(`Execution planning failed: ${planResult.errorValue()}`);
      }

      const plan = planResult.getValue()!;
      return Result.ok(plan);
    } catch (error) {
      return Result.fail(`Orchestration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async manageLifecycle(agentId: string): Promise<Result<PromotionRecommendation | null>> {
    if (!this.config.lifecycleEnabled) {
      return Result.fail('Lifecycle management is disabled');
    }

    try {
      const recommendationResult = this.lifecycleManager.evaluatePromotion(agentId);
      
      if (!recommendationResult.isSuccess) {
        return Result.fail(`Lifecycle evaluation failed: ${recommendationResult.errorValue()}`);
      }

      const recommendation = recommendationResult.getValue();
      
      if (recommendation) {
        // Start monitoring if recommended for promotion
        this.lifecycleManager.startMonitoring(agentId);
      }

      return Result.ok(recommendation);
    } catch (error) {
      return Result.fail(`Lifecycle management failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async recordPerformance(
    agentId: string,
    metrics: AgentPerformanceMetrics,
    quality: AgentQualityMetrics,
    context: PerformanceContext
  ): Promise<Result<void>> {
    if (!this.config.monitoringEnabled) {
      return Result.ok(undefined);
    }

    try {
      const recordResult = this.performanceMonitor.recordPerformance(
        agentId,
        metrics,
        quality,
        context
      );

      if (!recordResult.isSuccess) {
        return Result.fail(`Performance recording failed: ${recordResult.errorValue()}`);
      }

      // Check if evolution is needed
      if (this.config.evolutionEnabled) {
        const healthScore = this.performanceMonitor.getAgentHealthScore(agentId);
        if (healthScore.isSuccess && healthScore.getValue()! < 0.6) {
          // Trigger evolution analysis
          await this.evolveAgent(agentId);
        }
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Performance recording failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getSystemOverview(): Result<SystemOverview> {
    try {
      const agents = Array.from(this.agentRegistry.values());
      
      const stateDistribution = agents.reduce((acc, agent) => {
        acc[agent.state] = (acc[agent.state] || 0) + 1;
        return acc;
      }, {} as Record<AgentState, number>);

      const domainCoverage = agents.reduce((acc, agent) => {
        acc[agent.domain] = (acc[agent.domain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const performanceSummary: SystemPerformanceSummary = {
        averageResponseTime: this.calculateSystemAverageResponseTime(agents),
        systemSuccessRate: this.calculateSystemSuccessRate(agents),
        totalThroughput: this.calculateSystemThroughput(agents),
        resourceUtilization: this.calculateSystemResourceUtilization(agents),
        qualityScore: this.calculateSystemQualityScore(agents)
      };

      const recentActivity = this.getRecentActivity();
      const recommendations = this.generateSystemRecommendations(agents);

      const overview: SystemOverview = {
        totalAgents: agents.length,
        stateDistribution,
        domainCoverage,
        performanceSummary,
        recentActivity,
        recommendations
      };

      return Result.ok(overview);
    } catch (error) {
      return Result.fail(`System overview failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getFactoryMetrics(): Result<FactoryMetrics> {
    try {
      const createdAgents = this.creationHistory.filter(h => h.decision.decision === 'CREATE_NEW_AGENT');
      const successfulCreations = createdAgents.filter(h => h.validationResult?.valid !== false);
      
      const templateUsage = createdAgents.reduce((acc, creation) => {
        const templateId = creation.agent?.name || 'unknown';
        acc[templateId] = (acc[templateId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const qualityScores = createdAgents.reduce((acc, creation, index) => {
        acc[`agent-${index}`] = Math.random() * 0.4 + 0.6; // Placeholder: 0.6-1.0
        return acc;
      }, {} as Record<string, number>);

      const metrics: FactoryMetrics = {
        totalAgentsCreated: createdAgents.length,
        creationSuccessRate: createdAgents.length > 0 ? successfulCreations.length / createdAgents.length : 0,
        averageCreationTime: this.calculateAverageCreationTime(),
        templateUsageStats: templateUsage,
        qualityScores,
        evolutionImprovements: 5, // Placeholder
        activeExperiments: 2 // Placeholder
      };

      return Result.ok(metrics);
    } catch (error) {
      return Result.fail(`Factory metrics failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async optimizeSystem(): Promise<Result<string[]>> {
    try {
      const optimizations: string[] = [];

      // Analyze system performance
      const overview = this.getSystemOverview();
      if (!overview.isSuccess) {
        return Result.fail(`System analysis failed: ${overview.errorValue()}`);
      }

      const system = overview.getValue()!;

      // Performance optimizations
      if (system.performanceSummary.averageResponseTime > 30) {
        optimizations.push('Implement response time optimization patterns');
      }

      if (system.performanceSummary.systemSuccessRate < 0.9) {
        optimizations.push('Enhance error handling and recovery mechanisms');
      }

      // Capacity optimizations
      const experimentalAgents = system.stateDistribution.experimental || 0;
      const productionAgents = system.stateDistribution.production || 0;
      
      if (experimentalAgents > productionAgents * 0.5) {
        optimizations.push('Accelerate agent promotion pipeline');
      }

      // Domain coverage optimizations
      const uncoveredDomains = this.identifyUncoveredDomains(system.domainCoverage);
      if (uncoveredDomains.length > 0) {
        optimizations.push(`Create agents for uncovered domains: ${uncoveredDomains.join(', ')}`);
      }

      // Resource utilization optimizations
      if (system.performanceSummary.resourceUtilization > 0.8) {
        optimizations.push('Implement resource pooling and optimization');
      }

      return Result.ok(optimizations);
    } catch (error) {
      return Result.fail(`System optimization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleUseExisting(
    decision: CreateDecision,
    request: AgentCreationRequest
  ): Promise<Result<AgentCreationResult>> {
    const result: AgentCreationResult = {
      decision,
      deploymentPlan: {
        phase: 'immediate',
        initialState: 'production',
        validationCriteria: ['Agent already validated'],
        rollbackPlan: ['No rollback needed'],
        estimatedTime: 0
      }
    };

    this.creationHistory.push(result);
    return Result.ok(result);
  }

  private async handleExtendAgent(
    decision: CreateDecision,
    request: AgentCreationRequest
  ): Promise<Result<AgentCreationResult>> {
    // In a real implementation, this would modify the existing agent
    const result: AgentCreationResult = {
      decision,
      deploymentPlan: {
        phase: 'controlled',
        initialState: 'validation',
        validationCriteria: ['Extension compatibility', 'Performance maintained'],
        rollbackPlan: ['Revert to original agent configuration'],
        estimatedTime: 1800000 // 30 minutes
      }
    };

    this.creationHistory.push(result);
    return Result.ok(result);
  }

  private async handleCreateNewAgent(
    decision: CreateDecision,
    request: AgentCreationRequest,
    startTime: number
  ): Promise<Result<AgentCreationResult>> {
    if (!decision.specification) {
      return Result.fail('No agent specification provided in creation decision');
    }

    // Step 2: Select template
    const templateResult = this.templateSystem.selectTemplate(
      request.requirements.domain,
      {
        domain: request.requirements.domain,
        capabilities: request.requirements.capabilities,
        performanceTargets: [],
        qualityThresholds: [],
        constraints: request.requirements.constraints.map(c => ({ type: 'technical' as const, description: c, impact: 'medium' })),
        dependencies: []
      }
    );

    if (!templateResult.isSuccess) {
      return Result.fail(`Template selection failed: ${templateResult.errorValue()}`);
    }

    const template = templateResult.getValue()!;

    // Step 3: Generate agent file
    const agentFileResult = this.templateSystem.generateAgentFromTemplate(
      template,
      decision.specification
    );

    if (!agentFileResult.isSuccess) {
      return Result.fail(`Agent generation failed: ${agentFileResult.errorValue()}`);
    }

    const agentFile = agentFileResult.getValue()!;

    // Step 4: Validate generated agent
    const validation = this.validateGeneratedAgent(decision.specification, agentFile);

    // Step 5: Create deployment plan
    const deploymentPlan = this.createDeploymentPlan(decision.specification, validation);

    // Step 6: Create monitoring plan
    const monitoringPlan = this.createMonitoringPlan(decision.specification);

    // Step 7: Register agent (in experimental state)
    const agentSummary: AgentSummary = {
      id: decision.specification.name,
      name: decision.specification.displayName,
      domain: decision.specification.domain,
      capabilities: decision.specification.requirements.capabilities,
      state: 'experimental',
      performance: 0.8, // Initial estimate
      lastUsed: new Date()
    };

    this.agentRegistry.set(decision.specification.name, agentSummary);

    // Step 8: Start lifecycle management
    if (this.config.lifecycleEnabled) {
      this.lifecycleManager.startMonitoring(decision.specification.name);
    }

    // Step 9: Update template metrics
    this.templateSystem.updateTemplateMetrics(template.id, validation.valid);

    const creationTime = Date.now() - startTime;

    const result: AgentCreationResult = {
      decision,
      agent: decision.specification,
      agentFile,
      deploymentPlan,
      monitoringPlan,
      validationResult: validation
    };

    this.creationHistory.push(result);

    return Result.ok(result);
  }

  private validateGeneratedAgent(spec: AgentSpecification, agentFile: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!agentFile.includes(spec.name)) {
      errors.push('Generated file does not contain agent name');
    }

    if (!agentFile.includes(spec.description)) {
      errors.push('Generated file does not contain agent description');
    }

    if (spec.responsibilities.length === 0) {
      warnings.push('Agent has no defined responsibilities');
    }

    if (spec.workflows.length === 0) {
      warnings.push('Agent has no defined workflows');
    }

    // Quality checks
    if (agentFile.length < 1000) {
      warnings.push('Generated agent file seems incomplete (< 1000 characters)');
    }

    const score = Math.max(0, 1 - (errors.length * 0.3) - (warnings.length * 0.1));

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  private createDeploymentPlan(spec: AgentSpecification, validation: ValidationResult): DeploymentPlan {
    const phase = validation.score > 0.9 ? 'staged' : 'controlled';
    const initialState: AgentState = validation.score > 0.8 ? 'experimental' : 'experimental';

    return {
      phase,
      initialState,
      validationCriteria: [
        'Agent file syntax validation',
        'Configuration completeness check',
        'Performance baseline establishment'
      ],
      rollbackPlan: [
        'Remove agent from registry',
        'Delete generated files',
        'Notify stakeholders of rollback'
      ],
      estimatedTime: phase === 'staged' ? 300000 : 1800000 // 5 min or 30 min
    };
  }

  private createMonitoringPlan(spec: AgentSpecification): MonitoringPlan {
    return {
      frequency: 300000, // 5 minutes for experimental agents
      metrics: ['errorRate', 'successRate', 'responseTime', 'memoryUsage'],
      alertThresholds: {
        errorRate: 0.1,
        responseTime: 60,
        memoryUsage: 1024
      },
      reportingSchedule: ['daily', 'weekly'],
      escalationPlan: [
        'Alert agent owner on threshold breach',
        'Escalate to factory administrator after 3 consecutive failures',
        'Consider agent suspension after critical failure'
      ]
    };
  }

  private async buildEvolutionContext(agentId: string): Promise<EvolutionContext> {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // This would integrate with actual monitoring data
    return {
      agentId,
      currentSpec: {
        name: agent.name,
        displayName: agent.name,
        description: 'Current agent specification',
        purpose: 'Handle domain tasks',
        mission: 'Deliver quality results',
        domain: agent.domain,
        responsibilities: [],
        standards: [],
        tools: [],
        protocols: [],
        workflows: [],
        metrics: [],
        bestPractices: [],
        requirements: {
          domain: agent.domain,
          capabilities: agent.capabilities,
          performanceTargets: [],
          qualityThresholds: [],
          constraints: [],
          dependencies: []
        }
      },
      performanceHistory: [],
      qualityHistory: [],
      recentAnalysis: {
        bottlenecks: [],
        optimizations: [],
        trends: [],
        alerts: []
      },
      usagePatterns: [],
      successfulTasks: [],
      failedTasks: []
    };
  }

  // Helper methods for system analysis
  private calculateSystemAverageResponseTime(agents: AgentSummary[]): number {
    return agents.length > 0 ? 25 : 0; // Placeholder
  }

  private calculateSystemSuccessRate(agents: AgentSummary[]): number {
    return agents.length > 0 ? 0.92 : 0; // Placeholder
  }

  private calculateSystemThroughput(agents: AgentSummary[]): number {
    return agents.length * 100; // Placeholder: 100 tasks per agent
  }

  private calculateSystemResourceUtilization(agents: AgentSummary[]): number {
    return Math.min(0.75, agents.length * 0.1); // Placeholder
  }

  private calculateSystemQualityScore(agents: AgentSummary[]): number {
    return agents.length > 0 ? 0.87 : 0; // Placeholder
  }

  private getRecentActivity(): ActivitySummary[] {
    return this.creationHistory.slice(-5).map((creation, index) => ({
      timestamp: new Date(Date.now() - (5 - index) * 3600000), // Last 5 hours
      type: 'creation' as const,
      agentId: creation.agent?.name || 'unknown',
      details: `Created ${creation.decision.decision}`,
      impact: creation.validationResult?.valid ? 'low' : 'medium'
    }));
  }

  private generateSystemRecommendations(agents: AgentSummary[]): SystemRecommendation[] {
    const recommendations: SystemRecommendation[] = [];

    // Performance recommendation
    if (agents.length > 10) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        description: 'System has many agents - consider optimization',
        action: 'Run system optimization analysis',
        estimatedImpact: 0.15,
        timeline: 7200000 // 2 hours
      });
    }

    // Capacity recommendation
    const experimentalAgents = agents.filter(a => a.state === 'experimental').length;
    if (experimentalAgents > 5) {
      recommendations.push({
        type: 'capacity',
        priority: 'high',
        description: 'Too many experimental agents',
        action: 'Accelerate agent validation and promotion',
        estimatedImpact: 0.25,
        timeline: 86400000 // 24 hours
      });
    }

    return recommendations;
  }

  private identifyUncoveredDomains(domainCoverage: Record<string, number>): string[] {
    const expectedDomains = ['engineering', 'quality', 'product', 'operations', 'security'];
    return expectedDomains.filter(domain => !domainCoverage[domain]);
  }

  private calculateAverageCreationTime(): number {
    // Placeholder: would calculate from actual creation times
    return 180000; // 3 minutes average
  }
}