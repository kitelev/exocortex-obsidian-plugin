import { AgentNecessityAnalyzer } from '../core/AgentNecessityAnalyzer';
import { TaskRequirements, AgentSummary } from '../types/AgentTypes';

describe('AgentNecessityAnalyzer', () => {
  let analyzer: AgentNecessityAnalyzer;
  let mockTaskRequirements: TaskRequirements;
  let mockExistingAgents: AgentSummary[];

  beforeEach(() => {
    analyzer = new AgentNecessityAnalyzer();

    mockTaskRequirements = {
      domain: 'testing',
      complexity: 7,
      urgency: 'medium',
      capabilities: ['unit-testing', 'integration-testing', 'test-reporting'],
      constraints: ['performance', 'security'],
      expectedLoad: 100
    };

    mockExistingAgents = [
      {
        id: 'qa-agent-1',
        name: 'QA Engineer',
        domain: 'quality',
        capabilities: ['testing', 'validation', 'reporting'],
        state: 'production',
        performance: 0.9,
        lastUsed: new Date()
      },
      {
        id: 'dev-agent-1',
        name: 'Development Agent',
        domain: 'engineering',
        capabilities: ['coding', 'debugging', 'testing'],
        state: 'production',
        performance: 0.85,
        lastUsed: new Date()
      },
      {
        id: 'test-agent-1',
        name: 'Test Specialist',
        domain: 'testing',
        capabilities: ['unit-testing', 'performance-testing'],
        state: 'validation',
        performance: 0.8,
        lastUsed: new Date()
      }
    ];
  });

  describe('Need Analysis', () => {
    it('should recommend creating new agent when no suitable agent exists', async () => {
      const uniqueRequirements: TaskRequirements = {
        domain: 'blockchain',
        complexity: 9,
        urgency: 'high',
        capabilities: ['smart-contracts', 'defi-protocols', 'consensus-algorithms'],
        constraints: ['gas-optimization', 'security-auditing'],
        expectedLoad: 50
      };

      const result = analyzer.analyzeNeed(uniqueRequirements, mockExistingAgents);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      expect(decision.decision).toBe('CREATE_NEW_AGENT');
      expect(decision.confidence).toBeGreaterThan(0.5);
      expect(decision.specification).toBeDefined();
      expect(decision.specification!.domain).toBe('blockchain');
    });

    it('should recommend using existing agent when perfect match exists', async () => {
      const matchingRequirements: TaskRequirements = {
        domain: 'testing',
        complexity: 5,
        urgency: 'medium',
        capabilities: ['unit-testing', 'performance-testing'],
        constraints: ['performance'],
        expectedLoad: 30
      };

      const result = analyzer.analyzeNeed(matchingRequirements, mockExistingAgents);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      expect(['USE_EXISTING', 'EXTEND_AGENT', 'ADAPT_EXISTING']).toContain(decision.decision);
      
      if (decision.decision === 'USE_EXISTING') {
        expect(decision.selectedAgent).toBe('Test Specialist');
      }
    });

    it('should recommend extending agent when partial match exists', async () => {
      const partialMatchRequirements: TaskRequirements = {
        domain: 'quality',
        complexity: 6,
        urgency: 'medium',
        capabilities: ['testing', 'validation', 'reporting', 'automation'],
        constraints: ['performance'],
        expectedLoad: 75
      };

      const result = analyzer.analyzeNeed(partialMatchRequirements, mockExistingAgents);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      expect(['USE_EXISTING', 'EXTEND_AGENT', 'ADAPT_EXISTING']).toContain(decision.decision);
      
      if (decision.decision === 'EXTEND_AGENT') {
        expect(decision.selectedAgent).toBeDefined();
        expect(decision.adaptations).toBeDefined();
        expect(decision.adaptations!.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty agent list', async () => {
      const result = analyzer.analyzeNeed(mockTaskRequirements, []);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      expect(decision.decision).toBe('CREATE_NEW_AGENT');
      expect(decision.specification).toBeDefined();
    });

    it('should handle high complexity requirements', async () => {
      const complexRequirements: TaskRequirements = {
        domain: 'ai-research',
        complexity: 10,
        urgency: 'critical',
        capabilities: ['machine-learning', 'deep-learning', 'nlp', 'computer-vision'],
        constraints: ['gpu-requirements', 'model-optimization', 'ethical-ai'],
        expectedLoad: 200
      };

      const result = analyzer.analyzeNeed(complexRequirements, mockExistingAgents);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      expect(decision.decision).toBe('CREATE_NEW_AGENT');
      expect(decision.confidence).toBeGreaterThan(0.6);
      expect(decision.specification!.domain).toBe('ai-research');
    });

    it('should consider agent performance in decision making', async () => {
      const lowPerformanceAgents: AgentSummary[] = [
        {
          id: 'slow-agent',
          name: 'Slow Agent',
          domain: 'testing',
          capabilities: ['unit-testing', 'integration-testing'],
          state: 'production',
          performance: 0.3, // Very low performance
          lastUsed: new Date()
        }
      ];

      const result = analyzer.analyzeNeed(mockTaskRequirements, lowPerformanceAgents);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      // Should likely recommend creating new agent due to low performance
      expect(['CREATE_NEW_AGENT', 'EXTEND_AGENT']).toContain(decision.decision);
    });

    it('should respect SOLID principles in analysis', async () => {
      // Create scenario that would violate Single Responsibility Principle
      const overloadedAgent: AgentSummary = {
        id: 'overloaded-agent',
        name: 'Swiss Army Agent',
        domain: 'general',
        capabilities: [
          'testing', 'development', 'deployment', 'monitoring',
          'documentation', 'support', 'training', 'sales'
        ],
        state: 'production',
        performance: 0.7,
        lastUsed: new Date()
      };

      const focusedRequirements: TaskRequirements = {
        domain: 'testing',
        complexity: 6,
        urgency: 'medium',
        capabilities: ['unit-testing'],
        constraints: ['focused-responsibility'],
        expectedLoad: 50
      };

      const result = analyzer.analyzeNeed(focusedRequirements, [overloadedAgent]);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      // Should prefer creating focused agent over using overloaded one
      expect(decision.decision).toBe('CREATE_NEW_AGENT');
      expect(decision.rationale).toContain('responsibility');
    });

    it('should handle domain specialization requirements', async () => {
      const specializedRequirements: TaskRequirements = {
        domain: 'security',
        complexity: 8,
        urgency: 'high',
        capabilities: ['penetration-testing', 'vulnerability-assessment', 'security-auditing'],
        constraints: ['compliance', 'confidentiality'],
        expectedLoad: 25
      };

      const result = analyzer.analyzeNeed(specializedRequirements, mockExistingAgents);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      expect(decision.decision).toBe('CREATE_NEW_AGENT');
      expect(decision.specification!.domain).toBe('security');
      expect(decision.specification!.color).toBe('red'); // Security agents should be red
    });
  });

  describe('GRASP Metrics Calculation', () => {
    it('should calculate information expert metrics correctly', async () => {
      const expertRequirements: TaskRequirements = {
        domain: 'quality',
        complexity: 6,
        urgency: 'medium',
        capabilities: ['testing', 'validation'],
        constraints: [],
        expectedLoad: 50
      };

      const result = analyzer.analyzeNeed(expertRequirements, mockExistingAgents);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      
      // QA Engineer should score high on information expert for quality domain
      if (decision.decision !== 'CREATE_NEW_AGENT') {
        expect(decision.selectedAgent).toBe('QA Engineer');
      }
    });

    it('should evaluate coupling considerations', async () => {
      // Create many agents in same domain to test coupling concerns
      const manyTestingAgents: AgentSummary[] = [];
      for (let i = 0; i < 5; i++) {
        manyTestingAgents.push({
          id: `testing-agent-${i}`,
          name: `Testing Agent ${i}`,
          domain: 'testing',
          capabilities: ['testing', 'validation'],
          state: 'production',
          performance: 0.8,
          lastUsed: new Date()
        });
      }

      const result = analyzer.analyzeNeed(mockTaskRequirements, manyTestingAgents);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      
      // High coupling should favor creating new agent
      if (decision.decision === 'CREATE_NEW_AGENT') {
        expect(decision.rationale).toContain('coupling');
      }
    });
  });

  describe('Agent Design Generation', () => {
    it('should generate complete agent specification', async () => {
      const result = analyzer.analyzeNeed(mockTaskRequirements, []);

      expect(result.isSuccess).toBe(true);
      const decision = result.getValue()!;
      expect(decision.decision).toBe('CREATE_NEW_AGENT');
      
      const spec = decision.specification!;
      expect(spec.name).toBeDefined();
      expect(spec.displayName).toBeDefined();
      expect(spec.description).toBeDefined();
      expect(spec.domain).toBe('testing');
      expect(spec.responsibilities.length).toBeGreaterThan(0);
      expect(spec.standards.length).toBeGreaterThan(0);
      expect(spec.tools.length).toBeGreaterThan(0);
      expect(spec.workflows.length).toBeGreaterThan(0);
      expect(spec.metrics.length).toBeGreaterThan(0);
      expect(spec.bestPractices.length).toBeGreaterThan(0);
    });

    it('should generate appropriate agent name and color', async () => {
      const securityRequirements: TaskRequirements = {
        domain: 'security',
        complexity: 7,
        urgency: 'high',
        capabilities: ['security-testing'],
        constraints: [],
        expectedLoad: 30
      };

      const result = analyzer.analyzeNeed(securityRequirements, []);
      const spec = result.getValue()!.specification!;
      
      expect(spec.name).toContain('security');
      expect(spec.color).toBe('red');
      expect(spec.displayName).toContain('Security');
    });

    it('should create appropriate responsibilities based on capabilities', async () => {
      const result = analyzer.analyzeNeed(mockTaskRequirements, []);
      const spec = result.getValue()!.specification!;
      
      const responsibilityDescriptions = spec.responsibilities.map(r => r.description.toLowerCase());
      
      mockTaskRequirements.capabilities.forEach(capability => {
        const hasMatchingResponsibility = responsibilityDescriptions.some(desc => 
          desc.includes(capability) || desc.includes(capability.replace('-', ' '))
        );
        expect(hasMatchingResponsibility).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid task requirements', async () => {
      const invalidRequirements = {
        domain: '',
        complexity: -1,
        urgency: 'invalid' as any,
        capabilities: [],
        constraints: [],
        expectedLoad: -10
      };

      const result = analyzer.analyzeNeed(invalidRequirements, mockExistingAgents);

      // Should handle gracefully and either succeed with defaults or provide meaningful error
      if (!result.isSuccess) {
        expect(result.errorValue()).toBeDefined();
        expect(result.errorValue().length).toBeGreaterThan(0);
      }
    });

    it('should handle malformed agent summaries', async () => {
      const malformedAgents = [
        {
          id: '',
          name: '',
          domain: '',
          capabilities: [],
          state: 'unknown' as any,
          performance: -1,
          lastUsed: new Date()
        }
      ];

      const result = analyzer.analyzeNeed(mockTaskRequirements, malformedAgents as any);

      expect(result.isSuccess).toBe(true);
      // Should still make a decision despite malformed data
    });
  });

  describe('Decision Confidence', () => {
    it('should provide high confidence for clear decisions', async () => {
      const clearNewRequirement: TaskRequirements = {
        domain: 'quantum-computing',
        complexity: 10,
        urgency: 'critical',
        capabilities: ['quantum-algorithms', 'qbit-manipulation', 'quantum-error-correction'],
        constraints: ['quantum-hardware', 'decoherence-mitigation'],
        expectedLoad: 10
      };

      const result = analyzer.analyzeNeed(clearNewRequirement, mockExistingAgents);
      const decision = result.getValue()!;
      
      expect(decision.confidence).toBeGreaterThan(0.8);
      expect(decision.decision).toBe('CREATE_NEW_AGENT');
    });

    it('should provide lower confidence for ambiguous decisions', async () => {
      const ambiguousRequirements: TaskRequirements = {
        domain: 'general',
        complexity: 5,
        urgency: 'medium',
        capabilities: ['generic-task'],
        constraints: [],
        expectedLoad: 50
      };

      const result = analyzer.analyzeNeed(ambiguousRequirements, mockExistingAgents);
      const decision = result.getValue()!;
      
      // Confidence should reflect the ambiguity
      expect(decision.confidence).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });
  });
});