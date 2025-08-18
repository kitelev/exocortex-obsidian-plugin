import { AgentTemplateSystem, AgentTemplate } from '../templates/AgentTemplateSystem';
import { AgentSpecification, AgentRequirements } from '../types/AgentTypes';

describe('AgentTemplateSystem', () => {
  let templateSystem: AgentTemplateSystem;
  let mockAgentSpec: AgentSpecification;
  let mockRequirements: AgentRequirements;

  beforeEach(() => {
    templateSystem = new AgentTemplateSystem();

    mockRequirements = {
      domain: 'testing',
      capabilities: ['unit-testing', 'integration-testing', 'test-reporting'],
      performanceTargets: [
        { metric: 'responseTime', target: 30, unit: 'seconds', priority: 'high' }
      ],
      qualityThresholds: [
        { aspect: 'reliability', threshold: 0.95, measurement: 'success_rate' }
      ],
      constraints: [
        { type: 'technical', description: 'Must support Jest framework', impact: 'high' }
      ],
      dependencies: ['qa-engineer', 'swebok-engineer']
    };

    mockAgentSpec = {
      name: 'test-agent',
      displayName: 'Test Agent',
      description: 'Specialized testing agent',
      purpose: 'Execute comprehensive testing workflows',
      mission: 'Ensure software quality through systematic testing',
      domain: 'testing',
      color: 'green',
      responsibilities: [
        {
          category: 'Testing',
          description: 'Execute unit and integration tests',
          priority: 1,
          patterns: ['test-execution-pattern']
        }
      ],
      standards: [
        {
          name: 'ISTQB',
          version: '2018',
          compliance: ['Test Planning', 'Test Execution'],
          validation: ['Coverage Analysis']
        }
      ],
      tools: [
        {
          name: 'Jest',
          type: 'required',
          usage: 'Primary testing framework',
          constraints: ['Version 29+']
        }
      ],
      protocols: [
        {
          name: 'Test Results',
          type: 'output',
          format: 'JSON',
          schema: { results: 'array', summary: 'object' }
        }
      ],
      workflows: [
        {
          name: 'Standard Test Execution',
          steps: [
            {
              id: '1',
              name: 'Setup',
              action: 'prepare-test-environment',
              inputs: ['test-config'],
              outputs: ['test-env']
            }
          ],
          triggers: ['test-request'],
          outcomes: ['test-complete']
        }
      ],
      metrics: [
        {
          name: 'Test Coverage',
          type: 'quality',
          target: 0.8,
          unit: 'percentage',
          measurement: 'lines_covered/total_lines'
        }
      ],
      bestPractices: [
        {
          category: 'Quality',
          practice: 'Maintain high test coverage',
          rationale: 'Ensures comprehensive validation',
          implementation: 'Use coverage reports to guide testing'
        }
      ],
      requirements: mockRequirements
    };
  });

  describe('Template Selection', () => {
    it('should select appropriate template for engineering domain', async () => {
      const result = templateSystem.selectTemplate('engineering', mockRequirements);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue()!;
      expect(template.domain).toBe('engineering');
      expect(template.category).toBe('domain_specific');
    });

    it('should select core template for orchestration domain', async () => {
      const orchestrationRequirements: AgentRequirements = {
        ...mockRequirements,
        domain: 'orchestration',
        capabilities: ['coordination', 'task-routing', 'workflow-management']
      };

      const result = templateSystem.selectTemplate('orchestration', orchestrationRequirements);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue()!;
      expect(template.domain).toBe('orchestration');
      expect(template.category).toBe('core');
    });

    it('should fall back to generation for unknown domains', async () => {
      const unknownRequirements: AgentRequirements = {
        ...mockRequirements,
        domain: 'quantum-mechanics',
        capabilities: ['quantum-simulation', 'wave-function-analysis']
      };

      const result = templateSystem.selectTemplate('quantum-mechanics', unknownRequirements);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue()!;
      expect(template.domain).toBe('quantum-mechanics');
      expect(template.category).toBe('experimental');
    });

    it('should consider capability coverage in template selection', async () => {
      const testingRequirements: AgentRequirements = {
        ...mockRequirements,
        domain: 'testing',
        capabilities: ['unit-testing', 'integration-testing', 'performance-testing']
      };

      const result = templateSystem.selectTemplate('quality', testingRequirements);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue()!;
      // Should select quality template due to testing capabilities overlap
      expect(['quality', 'testing'].includes(template.domain)).toBe(true);
    });
  });

  describe('Agent Generation from Template', () => {
    it('should generate complete agent file from template', async () => {
      const templateResult = templateSystem.selectTemplate('testing', mockRequirements);
      const template = templateResult.getValue()!;

      const result = templateSystem.generateAgentFromTemplate(template, mockAgentSpec);

      expect(result.isSuccess).toBe(true);
      const agentFile = result.getValue()!;
      
      // Check that agent file contains key elements
      expect(agentFile).toContain('name: test-agent');
      expect(agentFile).toContain('Test Agent');
      expect(agentFile).toContain('testing');
      expect(agentFile).toContain('Execute unit and integration tests');
    });

    it('should properly substitute template variables', async () => {
      const templateResult = templateSystem.selectTemplate('engineering', mockRequirements);
      const template = templateResult.getValue()!;

      const customSpec = {
        ...mockAgentSpec,
        name: 'custom-agent',
        displayName: 'Custom Engineering Agent',
        mission: 'Build exceptional software solutions'
      };

      const result = templateSystem.generateAgentFromTemplate(template, customSpec);

      expect(result.isSuccess).toBe(true);
      const agentFile = result.getValue()!;
      
      expect(agentFile).toContain('custom-agent');
      expect(agentFile).toContain('Custom Engineering Agent');
      expect(agentFile).toContain('Build exceptional software solutions');
    });

    it('should handle complex data structures in specifications', async () => {
      const templateResult = templateSystem.selectTemplate('quality', mockRequirements);
      const template = templateResult.getValue()!;

      const complexSpec = {
        ...mockAgentSpec,
        workflows: [
          {
            name: 'Complex Quality Workflow',
            steps: [
              {
                id: 'step1',
                name: 'Initialize',
                action: 'setup-quality-gates',
                inputs: ['requirements', 'standards'],
                outputs: ['quality-config'],
                conditions: ['environment-ready']
              },
              {
                id: 'step2',
                name: 'Analyze',
                action: 'perform-quality-analysis',
                inputs: ['quality-config', 'source-code'],
                outputs: ['analysis-report']
              }
            ],
            triggers: ['quality-check-requested', 'code-review-triggered'],
            outcomes: ['quality-approved', 'quality-rejected', 'quality-needs-improvement']
          }
        ]
      };

      const result = templateSystem.generateAgentFromTemplate(template, complexSpec);

      expect(result.isSuccess).toBe(true);
      const agentFile = result.getValue()!;
      
      expect(agentFile).toContain('Complex Quality Workflow');
      expect(agentFile).toContain('setup-quality-gates');
      expect(agentFile).toContain('quality-approved');
    });

    it('should generate valid markdown structure', async () => {
      const templateResult = templateSystem.selectTemplate('product', mockRequirements);
      const template = templateResult.getValue()!;

      const result = templateSystem.generateAgentFromTemplate(template, mockAgentSpec);

      expect(result.isSuccess).toBe(true);
      const agentFile = result.getValue()!;
      
      // Check markdown structure
      expect(agentFile).toMatch(/^---\n/); // YAML frontmatter start
      expect(agentFile).toMatch(/---\n\n/); // YAML frontmatter end
      expect(agentFile).toContain('## Core Responsibilities');
      expect(agentFile).toContain('## Standards & Compliance');
      expect(agentFile).toContain('## Tools & Technologies');
    });
  });

  describe('Template Registration', () => {
    it('should register custom template successfully', async () => {
      const customTemplate: AgentTemplate = {
        id: 'custom-blockchain-template',
        name: 'Blockchain Agent Template',
        description: 'Template for blockchain development agents',
        category: 'specialized',
        domain: 'blockchain',
        basePattern: 'blockchain-expert',
        components: [
          {
            name: 'header',
            type: 'header',
            required: true,
            content: '---\nname: {{name}}\ndescription: {{description}}\n---',
            variables: ['name', 'description']
          },
          {
            name: 'blockchain-responsibilities',
            type: 'responsibilities',
            required: true,
            content: '### Blockchain Responsibilities\n{{responsibilities}}',
            variables: ['responsibilities']
          }
        ],
        variables: [
          {
            name: 'name',
            type: 'string',
            description: 'Agent name',
            required: true
          },
          {
            name: 'blockchain_network',
            type: 'string',
            description: 'Target blockchain network',
            defaultValue: 'ethereum',
            required: false
          }
        ],
        metadata: {
          version: '1.0.0',
          author: 'Test Author',
          createdAt: new Date(),
          lastModified: new Date(),
          usageCount: 0,
          successRate: 1.0,
          tags: ['blockchain', 'custom']
        }
      };

      const result = templateSystem.registerTemplate(customTemplate);

      expect(result.isSuccess).toBe(true);

      // Test that the template can be selected
      const selectionResult = templateSystem.selectTemplate('blockchain', {
        ...mockRequirements,
        domain: 'blockchain'
      });

      expect(selectionResult.isSuccess).toBe(true);
      expect(selectionResult.getValue()!.id).toBe('custom-blockchain-template');
    });

    it('should validate template before registration', async () => {
      const invalidTemplate: AgentTemplate = {
        id: '', // Invalid empty ID
        name: '',
        description: 'Invalid template',
        category: 'specialized',
        domain: 'invalid',
        basePattern: 'invalid',
        components: [], // Missing required components
        variables: [],
        metadata: {
          version: '1.0.0',
          author: 'Test',
          createdAt: new Date(),
          lastModified: new Date(),
          usageCount: 0,
          successRate: 1.0,
          tags: []
        }
      };

      const result = templateSystem.registerTemplate(invalidTemplate);

      expect(result.isSuccess).toBe(false);
      expect(result.errorValue()).toContain('validation');
    });
  });

  describe('Template Metrics', () => {
    it('should update template usage metrics', async () => {
      const templateResult = templateSystem.selectTemplate('engineering', mockRequirements);
      const template = templateResult.getValue()!;
      
      const initialUsageCount = template.metadata.usageCount;
      const initialSuccessRate = template.metadata.successRate;

      // Simulate successful usage
      templateSystem.updateTemplateMetrics(template.id, true);

      // The template object should be updated
      expect(template.metadata.usageCount).toBe(initialUsageCount + 1);
      // Success rate should be recalculated
      expect(template.metadata.successRate).toBeGreaterThanOrEqual(initialSuccessRate);
    });

    it('should handle failed template usage', async () => {
      const templateResult = templateSystem.selectTemplate('quality', mockRequirements);
      const template = templateResult.getValue()!;
      
      const initialUsageCount = template.metadata.usageCount;

      // Simulate failed usage
      templateSystem.updateTemplateMetrics(template.id, false);

      expect(template.metadata.usageCount).toBe(initialUsageCount + 1);
      // Success rate might decrease
      expect(template.metadata.successRate).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Template Composition', () => {
    it('should compose template from multiple components when exact match not found', async () => {
      const hybridRequirements: AgentRequirements = {
        domain: 'devops-quality',
        capabilities: ['deployment', 'testing', 'monitoring', 'quality-gates'],
        performanceTargets: [],
        qualityThresholds: [],
        constraints: [],
        dependencies: []
      };

      const result = templateSystem.selectTemplate('devops-quality', hybridRequirements);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue()!;
      
      // Should be a composed template
      expect(template.category).toBe('specialized');
      expect(template.name).toContain('devops-quality');
    });

    it('should select appropriate modules for composition', async () => {
      const securityRequirements: AgentRequirements = {
        domain: 'security',
        capabilities: ['vulnerability-scanning', 'penetration-testing'],
        performanceTargets: [],
        qualityThresholds: [],
        constraints: [
          { type: 'security', description: 'Must follow security standards', impact: 'critical' }
        ],
        dependencies: []
      };

      const result = templateSystem.selectTemplate('security', securityRequirements);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue()!;
      expect(template.domain).toBe('security');
    });
  });

  describe('Built-in Templates', () => {
    it('should have core orchestrator template available', async () => {
      const result = templateSystem.selectTemplate('orchestration', {
        domain: 'orchestration',
        capabilities: ['coordination', 'routing'],
        performanceTargets: [],
        qualityThresholds: [],
        constraints: [],
        dependencies: []
      });

      expect(result.isSuccess).toBe(true);
      const template = result.getValue()!;
      expect(template.category).toBe('core');
      expect(template.basePattern).toBe('coordinator');
    });

    it('should have domain-specific templates for common domains', async () => {
      const domains = ['engineering', 'quality', 'product'];
      
      for (const domain of domains) {
        const result = templateSystem.selectTemplate(domain, {
          ...mockRequirements,
          domain
        });

        expect(result.isSuccess).toBe(true);
        const template = result.getValue()!;
        expect(template.category).toBe('domain_specific');
        expect(template.domain).toBe(domain);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle template generation errors gracefully', async () => {
      const templateResult = templateSystem.selectTemplate('engineering', mockRequirements);
      const template = templateResult.getValue()!;

      // Create invalid specification
      const invalidSpec = {
        ...mockAgentSpec,
        workflows: null as any // Invalid workflow data
      };

      const result = templateSystem.generateAgentFromTemplate(template, invalidSpec);

      if (!result.isSuccess) {
        expect(result.errorValue()).toBeDefined();
        expect(result.errorValue().length).toBeGreaterThan(0);
      }
    });

    it('should handle missing template components', async () => {
      // This tests the robustness of template processing
      const minimalTemplate: AgentTemplate = {
        id: 'minimal-template',
        name: 'Minimal Template',
        description: 'Template with minimal components',
        category: 'experimental',
        domain: 'minimal',
        basePattern: 'basic',
        components: [
          {
            name: 'basic-header',
            type: 'header',
            required: true,
            content: '# {{displayName}}',
            variables: ['displayName']
          }
        ],
        variables: [],
        metadata: {
          version: '1.0.0',
          author: 'Test',
          createdAt: new Date(),
          lastModified: new Date(),
          usageCount: 0,
          successRate: 1.0,
          tags: []
        }
      };

      templateSystem.registerTemplate(minimalTemplate);

      const result = templateSystem.generateAgentFromTemplate(minimalTemplate, mockAgentSpec);

      expect(result.isSuccess).toBe(true);
      const agentFile = result.getValue()!;
      expect(agentFile).toContain('Test Agent');
    });
  });

  describe('Template Variables', () => {
    it('should handle array variables correctly', async () => {
      const templateResult = templateSystem.selectTemplate('engineering', mockRequirements);
      const template = templateResult.getValue()!;

      const specWithArrays = {
        ...mockAgentSpec,
        responsibilities: [
          { category: 'Development', description: 'Write clean code', priority: 1, patterns: ['clean-code'] },
          { category: 'Testing', description: 'Write comprehensive tests', priority: 2, patterns: ['tdd'] },
          { category: 'Review', description: 'Conduct code reviews', priority: 3, patterns: ['peer-review'] }
        ]
      };

      const result = templateSystem.generateAgentFromTemplate(template, specWithArrays);

      expect(result.isSuccess).toBe(true);
      const agentFile = result.getValue()!;
      
      expect(agentFile).toContain('Write clean code');
      expect(agentFile).toContain('Write comprehensive tests');
      expect(agentFile).toContain('Conduct code reviews');
    });

    it('should handle nested object variables', async () => {
      const templateResult = templateSystem.selectTemplate('product', mockRequirements);
      const template = templateResult.getValue()!;

      const specWithNestedObjects = {
        ...mockAgentSpec,
        protocols: [
          {
            name: 'User Story Protocol',
            type: 'input' as const,
            format: 'JSON',
            schema: {
              story: { title: 'string', description: 'string', acceptance_criteria: 'array' },
              priority: 'number',
              epic: { id: 'string', name: 'string' }
            }
          }
        ]
      };

      const result = templateSystem.generateAgentFromTemplate(template, specWithNestedObjects);

      expect(result.isSuccess).toBe(true);
      const agentFile = result.getValue()!;
      expect(agentFile).toContain('User Story Protocol');
    });
  });
});