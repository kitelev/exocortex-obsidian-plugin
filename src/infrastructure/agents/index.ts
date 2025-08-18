// Core Agent Factory System
export { AgentFactory } from './AgentFactory';

// Core Components
export { AgentNecessityAnalyzer } from './core/AgentNecessityAnalyzer';

// Template System
export { AgentTemplateSystem } from './templates/AgentTemplateSystem';
export type { AgentTemplate, TemplateCategory, TemplateComponent, TemplateVariable, CompositeTemplate } from './templates/AgentTemplateSystem';

// Performance Monitoring
export { AgentPerformanceMonitor } from './monitoring/AgentPerformanceMonitor';
export type { PerformanceSnapshot, PerformanceContext, PerformanceThresholds, MetricTrend } from './monitoring/AgentPerformanceMonitor';

// Evolution Engine
export { AgentEvolutionEngine } from './evolution/AgentEvolutionEngine';
export type { 
  EvolutionPattern, 
  EvolutionContext, 
  EvolutionProposal, 
  AgentTransformation,
  EvolutionInsights
} from './evolution/AgentEvolutionEngine';

// Orchestration
export { AgentOrchestrator } from './orchestration/AgentOrchestrator';
export type { 
  OrchestrationPattern, 
  ExecutionPlan, 
  ExecutionResult,
  OrchestrationRecommendations,
  PatternAnalysis
} from './orchestration/AgentOrchestrator';

// Lifecycle Management
export { AgentLifecycleManager } from './lifecycle/AgentLifecycleManager';
export type { 
  StateTransition, 
  StateConfiguration, 
  PromotionRecommendation,
  LifecycleEvent
} from './lifecycle/AgentLifecycleManager';

// Types
export type {
  // Core Types
  AgentMetadata,
  AgentState,
  AgentSpecification,
  AgentSummary,
  TaskRequirements,
  CreateDecision,
  
  // Performance Types
  AgentPerformanceMetrics,
  AgentQualityMetrics,
  PerformanceAnalysis,
  TrendAnalysis,
  Alert,
  
  // Result Types
  ValidationResult,
  RegistrationResult,
  TransitionResult,
  
  // Specification Types
  ResponsibilitySpec,
  StandardSpec,
  ToolSpec,
  ProtocolSpec,
  WorkflowSpec,
  MetricSpec,
  BestPracticeSpec,
  AgentRequirements,
  
  // Configuration Types
  PerformanceTarget,
  QualityThreshold,
  Constraint,
  
  // Metrics Types
  GRASPMetrics,
  SOLIDMetrics,
  SuccessCriteria
} from './types/AgentTypes';

// Factory Configuration Types
export type {
  AgentFactoryConfig,
  AgentCreationRequest,
  AgentCreationResult,
  DeploymentPlan,
  MonitoringPlan,
  FactoryMetrics,
  SystemOverview,
  SystemPerformanceSummary,
  ActivitySummary,
  SystemRecommendation
} from './AgentFactory';