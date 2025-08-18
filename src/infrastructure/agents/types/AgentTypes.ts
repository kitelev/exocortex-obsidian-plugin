export interface AgentMetadata {
  name: string;
  description: string;
  color: string;
  version: string;
  createdAt: Date;
  lastModified: Date;
  state: AgentState;
  tags: string[];
}

export type AgentState = 'experimental' | 'validation' | 'production' | 'optimization' | 'retirement';

export interface AgentSpecification {
  name: string;
  displayName: string;
  description: string;
  purpose: string;
  mission: string;
  domain: string;
  color?: string;
  responsibilities: ResponsibilitySpec[];
  standards: StandardSpec[];
  tools: ToolSpec[];
  protocols: ProtocolSpec[];
  workflows: WorkflowSpec[];
  metrics: MetricSpec[];
  bestPractices: BestPracticeSpec[];
  requirements: AgentRequirements;
}

export interface ResponsibilitySpec {
  category: string;
  description: string;
  priority: number;
  patterns: string[];
}

export interface StandardSpec {
  name: string;
  version: string;
  compliance: string[];
  validation: string[];
}

export interface ToolSpec {
  name: string;
  type: 'required' | 'optional' | 'conditional';
  usage: string;
  constraints: string[];
}

export interface ProtocolSpec {
  name: string;
  type: 'input' | 'output' | 'bidirectional';
  format: string;
  schema: Record<string, any>;
}

export interface WorkflowSpec {
  name: string;
  steps: WorkflowStep[];
  triggers: string[];
  outcomes: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  inputs: string[];
  outputs: string[];
  conditions?: string[];
}

export interface MetricSpec {
  name: string;
  type: 'efficiency' | 'quality' | 'resource' | 'business';
  target: number;
  unit: string;
  measurement: string;
}

export interface BestPracticeSpec {
  category: string;
  practice: string;
  rationale: string;
  implementation: string;
}

export interface AgentRequirements {
  domain: string;
  capabilities: string[];
  performanceTargets: PerformanceTarget[];
  qualityThresholds: QualityThreshold[];
  constraints: Constraint[];
  dependencies: string[];
}

export interface PerformanceTarget {
  metric: string;
  target: number;
  unit: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface QualityThreshold {
  aspect: string;
  threshold: number;
  measurement: string;
}

export interface Constraint {
  type: 'resource' | 'technical' | 'business' | 'security';
  description: string;
  impact: string;
}

export interface GRASPMetrics {
  informationExpert: number;
  creator: number;
  controller: number;
  lowCoupling: number;
  highCohesion: number;
  polymorphism: number;
  pureDesign: number;
  indirection: number;
  protectedVariations: number;
}

export interface SOLIDMetrics {
  singleResponsibility: number;
  openClosed: number;
  liskovSubstitution: number;
  interfaceSegregation: number;
  dependencyInversion: number;
}

export interface CreateDecision {
  decision: 'CREATE_NEW_AGENT' | 'USE_EXISTING' | 'EXTEND_AGENT' | 'ADAPT_EXISTING';
  confidence: number;
  rationale: string;
  specification?: AgentSpecification;
  selectedAgent?: string;
  adaptations?: string[];
}

export interface AgentPerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  successRate: number;
  retryRate: number;
  memoryUsage: number;
  cpuUsage: number;
  apiCalls: number;
  tasksCompleted: number;
  userSatisfaction: number;
  valueDelivered: number;
}

export interface AgentQualityMetrics {
  functionality: {
    completeness: number;
    correctness: number;
    appropriateness: number;
  };
  reliability: {
    maturity: number;
    availability: number;
    faultTolerance: number;
    recoverability: number;
  };
  usability: {
    understandability: number;
    learnability: number;
    operability: number;
  };
  efficiency: {
    timeBehavior: number;
    resourceUtilization: number;
  };
  maintainability: {
    analyzability: number;
    changeability: number;
    stability: number;
    testability: number;
  };
}

export interface TransitionResult {
  success: boolean;
  newState?: AgentState;
  reason?: string;
  failures?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface RegistrationResult {
  success: boolean;
  agentId?: string;
  errors?: string[];
  conflicts?: string[];
}

export interface AgentSummary {
  id: string;
  name: string;
  domain: string;
  capabilities: string[];
  state: AgentState;
  performance: number;
  lastUsed: Date;
}

export interface TaskRequirements {
  domain: string;
  complexity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  capabilities: string[];
  constraints: string[];
  expectedLoad: number;
}

export interface PerformanceAnalysis {
  bottlenecks: string[];
  optimizations: string[];
  trends: TrendAnalysis[];
  alerts: Alert[];
}

export interface TrendAnalysis {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  rate: number;
  prediction: number;
}

export interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  threshold: number;
  current: number;
  action: string;
}

export interface SuccessCriteria {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  unit: string;
}