import { Result } from "../../../domain/core/Result";
import {
  AgentSpecification,
  AgentRequirements,
  ResponsibilitySpec,
  StandardSpec,
  ToolSpec,
  ProtocolSpec,
  WorkflowSpec,
  MetricSpec,
  BestPracticeSpec,
} from "../types/AgentTypes";

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  domain: string;
  basePattern: string;
  components: TemplateComponent[];
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
}

export type TemplateCategory =
  | "core"
  | "domain_specific"
  | "specialized"
  | "experimental";

export interface TemplateComponent {
  name: string;
  type: ComponentType;
  required: boolean;
  content: string;
  variables: string[];
}

export type ComponentType =
  | "header"
  | "responsibilities"
  | "standards"
  | "tools"
  | "protocols"
  | "workflows"
  | "metrics"
  | "best_practices"
  | "custom";

export interface TemplateVariable {
  name: string;
  type: "string" | "array" | "object" | "number" | "boolean";
  description: string;
  defaultValue?: any;
  required: boolean;
  validation?: string;
}

export interface TemplateMetadata {
  version: string;
  author: string;
  createdAt: Date;
  lastModified: Date;
  usageCount: number;
  successRate: number;
  tags: string[];
}

export interface CompositeTemplate {
  base: AgentTemplate;
  standards: TemplateComponent[];
  tools: TemplateComponent[];
  patterns: TemplateComponent[];
  protocols: TemplateComponent[];
}

export class AgentTemplateSystem {
  private templates: Map<string, AgentTemplate> = new Map();
  private builtInTemplates: AgentTemplate[];

  constructor() {
    this.builtInTemplates = this.initializeBuiltInTemplates();
    this.loadBuiltInTemplates();
  }

  selectTemplate(
    domain: string,
    requirements: AgentRequirements,
  ): Result<AgentTemplate> {
    try {
      // 1. Check for exact domain match
      const exactMatch = this.findExactTemplate(domain);
      if (exactMatch.isSuccess) {
        return exactMatch;
      }

      // 2. Find similar templates
      const similarTemplates = this.findSimilarTemplates(domain);
      if (similarTemplates.length > 0) {
        const bestMatch = this.selectBestMatch(similarTemplates, requirements);
        return Result.ok(bestMatch);
      }

      // 3. Try to compose from multiple templates
      const composition = this.composeTemplate(domain, requirements);
      if (composition.isSuccess) {
        return Result.ok(this.templateFromComposition(composition.getValue()!));
      }

      // 4. Generate from base template
      const generated = this.generateFromBase(domain, requirements);
      return Result.ok(generated);
    } catch (error) {
      return Result.fail(
        `Template selection failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  generateAgentFromTemplate(
    template: AgentTemplate,
    spec: AgentSpecification,
  ): Result<string> {
    try {
      const variables = this.extractVariables(spec);
      const renderedContent = this.renderTemplate(template, variables);
      return Result.ok(renderedContent);
    } catch (error) {
      return Result.fail(
        `Agent generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  registerTemplate(template: AgentTemplate): Result<void> {
    try {
      const validation = this.validateTemplate(template);
      if (!validation.isSuccess) {
        return Result.fail(
          `Template validation failed: ${validation.errorValue()}`,
        );
      }

      this.templates.set(template.id, template);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        `Template registration failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  updateTemplateMetrics(templateId: string, success: boolean): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.metadata.usageCount++;
      const currentSuccessCount = Math.floor(
        template.metadata.successRate * template.metadata.usageCount,
      );
      const newSuccessCount = success
        ? currentSuccessCount + 1
        : currentSuccessCount;
      template.metadata.successRate =
        newSuccessCount / template.metadata.usageCount;
      template.metadata.lastModified = new Date();
    }
  }

  private findExactTemplate(domain: string): Result<AgentTemplate> {
    const exactMatch = Array.from(this.templates.values()).find(
      (template) => template.domain.toLowerCase() === domain.toLowerCase(),
    );

    return exactMatch
      ? Result.ok(exactMatch)
      : Result.fail("No exact template match found");
  }

  private findSimilarTemplates(domain: string): AgentTemplate[] {
    return Array.from(this.templates.values())
      .filter((template) => {
        const domainSimilarity = this.calculateDomainSimilarity(
          template.domain,
          domain,
        );
        return domainSimilarity > 0.6;
      })
      .sort((a, b) => {
        const simA = this.calculateDomainSimilarity(a.domain, domain);
        const simB = this.calculateDomainSimilarity(b.domain, domain);
        return simB - simA;
      });
  }

  private calculateDomainSimilarity(domain1: string, domain2: string): number {
    const words1 = domain1.toLowerCase().split(/\s+|-|_/);
    const words2 = domain2.toLowerCase().split(/\s+|-|_/);

    const commonWords = words1.filter((word) => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;

    return commonWords.length / totalWords;
  }

  private selectBestMatch(
    templates: AgentTemplate[],
    requirements: AgentRequirements,
  ): AgentTemplate {
    return templates.reduce((best, current) => {
      const currentScore = this.calculateTemplateScore(current, requirements);
      const bestScore = this.calculateTemplateScore(best, requirements);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateTemplateScore(
    template: AgentTemplate,
    requirements: AgentRequirements,
  ): number {
    let score = 0;

    // Domain match
    const domainMatch = this.calculateDomainSimilarity(
      template.domain,
      requirements.domain,
    );
    score += domainMatch * 0.4;

    // Capability coverage
    const capabilityCoverage = this.calculateCapabilityCoverage(
      template,
      requirements.capabilities,
    );
    score += capabilityCoverage * 0.3;

    // Success rate
    score += template.metadata.successRate * 0.2;

    // Usage frequency (popular templates tend to be better)
    const usageScore = Math.min(template.metadata.usageCount / 100, 1);
    score += usageScore * 0.1;

    return score;
  }

  private calculateCapabilityCoverage(
    template: AgentTemplate,
    capabilities: string[],
  ): number {
    const templateCapabilities = this.extractTemplateCapabilities(template);
    const covered = capabilities.filter((cap) =>
      templateCapabilities.some((tcap) =>
        tcap.toLowerCase().includes(cap.toLowerCase()),
      ),
    );

    return covered.length / capabilities.length;
  }

  private extractTemplateCapabilities(template: AgentTemplate): string[] {
    const responsibilityComponent = template.components.find(
      (c) => c.type === "responsibilities",
    );
    if (!responsibilityComponent) return [];

    // Simple extraction - in real implementation, this would be more sophisticated
    const capabilities =
      responsibilityComponent.content.match(/\b\w+ing\b/g) || [];
    return capabilities;
  }

  private composeTemplate(
    domain: string,
    requirements: AgentRequirements,
  ): Result<CompositeTemplate> {
    try {
      const base = this.selectBaseTemplate(domain);
      const standards = this.selectStandardsModule(domain);
      const tools = this.selectToolsModule(requirements);
      const patterns = this.selectPatternsModule(domain);
      const protocols = this.selectProtocolsModule();

      return Result.ok({
        base,
        standards,
        tools,
        patterns,
        protocols,
      });
    } catch (error) {
      return Result.fail(
        `Template composition failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private selectBaseTemplate(domain: string): AgentTemplate {
    // Select core template based on domain
    const coreTemplates = Array.from(this.templates.values()).filter(
      (t) => t.category === "core",
    );

    return coreTemplates[0] || this.builtInTemplates[0]; // Fallback to first core template
  }

  private selectStandardsModule(domain: string): TemplateComponent[] {
    const standardsMap: Record<string, TemplateComponent[]> = {
      engineering: [
        this.createStandardComponent(
          "IEEE SWEBOK v3",
          "Software engineering best practices",
        ),
        this.createStandardComponent("ISO/IEC 25010", "Software quality model"),
      ],
      quality: [
        this.createStandardComponent(
          "ISTQB",
          "International software testing standards",
        ),
        this.createStandardComponent(
          "ISO/IEC 25010",
          "Quality assurance framework",
        ),
      ],
      product: [
        this.createStandardComponent(
          "Pragmatic Marketing",
          "Product management framework",
        ),
        this.createStandardComponent(
          "Lean Product",
          "Lean development principles",
        ),
      ],
    };

    return standardsMap[domain.toLowerCase()] || standardsMap["engineering"];
  }

  private selectToolsModule(
    requirements: AgentRequirements,
  ): TemplateComponent[] {
    const tools: TemplateComponent[] = [
      this.createToolComponent(
        "Claude Code",
        "required",
        "Primary AI interface",
      ),
      this.createToolComponent(
        "TypeScript",
        "required",
        "Development language",
      ),
    ];

    // Add domain-specific tools based on capabilities
    if (requirements.capabilities.includes("testing")) {
      tools.push(
        this.createToolComponent("Jest", "required", "Testing framework"),
      );
    }

    if (requirements.capabilities.includes("database")) {
      tools.push(
        this.createToolComponent("IndexedGraph", "required", "Graph database"),
      );
    }

    return tools;
  }

  private selectPatternsModule(domain: string): TemplateComponent[] {
    const patterns = [
      this.createPatternComponent(
        "Clean Architecture",
        "Layered architecture pattern",
      ),
      this.createPatternComponent(
        "SOLID Principles",
        "Object-oriented design principles",
      ),
    ];

    if (domain === "engineering") {
      patterns.push(
        this.createPatternComponent(
          "Repository Pattern",
          "Data access abstraction",
        ),
      );
      patterns.push(
        this.createPatternComponent(
          "Use Case Pattern",
          "Business logic organization",
        ),
      );
    }

    return patterns;
  }

  private selectProtocolsModule(): TemplateComponent[] {
    return [
      this.createProtocolComponent(
        "Task Assignment",
        "YAML",
        "Standard task routing protocol",
      ),
      this.createProtocolComponent(
        "Status Update",
        "JSON",
        "Progress reporting protocol",
      ),
      this.createProtocolComponent(
        "Completion Report",
        "Markdown",
        "Task completion documentation",
      ),
    ];
  }

  private templateFromComposition(
    composition: CompositeTemplate,
  ): AgentTemplate {
    const components: TemplateComponent[] = [
      ...composition.base.components,
      ...composition.standards,
      ...composition.tools,
      ...composition.patterns,
      ...composition.protocols,
    ];

    return {
      id: `composed-${Date.now()}`,
      name: `Composed ${composition.base.domain} Agent`,
      description: "Dynamically composed agent template",
      category: "specialized",
      domain: composition.base.domain,
      basePattern: composition.base.basePattern,
      components,
      variables: composition.base.variables,
      metadata: {
        version: "1.0.0",
        author: "Agent Factory",
        createdAt: new Date(),
        lastModified: new Date(),
        usageCount: 0,
        successRate: 1.0,
        tags: ["composed", "dynamic"],
      },
    };
  }

  private generateFromBase(
    domain: string,
    requirements: AgentRequirements,
  ): AgentTemplate {
    return {
      id: `generated-${domain}-${Date.now()}`,
      name: `Generated ${domain} Agent`,
      description: `Dynamically generated agent for ${domain} domain`,
      category: "experimental",
      domain,
      basePattern: "standard-agent",
      components: this.generateStandardComponents(domain, requirements),
      variables: this.generateStandardVariables(requirements),
      metadata: {
        version: "1.0.0",
        author: "Agent Factory",
        createdAt: new Date(),
        lastModified: new Date(),
        usageCount: 0,
        successRate: 0.8, // Conservative estimate for generated templates
        tags: ["generated", "experimental", domain],
      },
    };
  }

  private generateStandardComponents(
    domain: string,
    requirements: AgentRequirements,
  ): TemplateComponent[] {
    return [
      {
        name: "header",
        type: "header",
        required: true,
        content: this.generateHeaderTemplate(domain),
        variables: ["name", "description", "color", "displayName", "purpose"],
      },
      {
        name: "responsibilities",
        type: "responsibilities",
        required: true,
        content: this.generateResponsibilitiesTemplate(),
        variables: ["responsibilities"],
      },
      {
        name: "standards",
        type: "standards",
        required: true,
        content: this.generateStandardsTemplate(),
        variables: ["standards"],
      },
      {
        name: "workflows",
        type: "workflows",
        required: true,
        content: this.generateWorkflowsTemplate(),
        variables: ["workflows"],
      },
    ];
  }

  private generateStandardVariables(
    requirements: AgentRequirements,
  ): TemplateVariable[] {
    return [
      {
        name: "name",
        type: "string",
        description: "Agent identifier name",
        required: true,
      },
      {
        name: "displayName",
        type: "string",
        description: "Human-readable agent name",
        required: true,
      },
      {
        name: "description",
        type: "string",
        description: "Agent description",
        required: true,
      },
      {
        name: "domain",
        type: "string",
        description: "Primary domain of expertise",
        defaultValue: requirements.domain,
        required: true,
      },
      {
        name: "capabilities",
        type: "array",
        description: "List of agent capabilities",
        defaultValue: requirements.capabilities,
        required: true,
      },
    ];
  }

  private renderTemplate(
    template: AgentTemplate,
    variables: Record<string, any>,
  ): string {
    let content = this.assembleTemplate(template);

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      const replacement = Array.isArray(value)
        ? this.formatArray(value)
        : String(value);
      content = content.replace(placeholder, replacement);
    });

    return content;
  }

  private assembleTemplate(template: AgentTemplate): string {
    const sortedComponents = template.components.sort((a, b) => {
      const order: ComponentType[] = [
        "header",
        "responsibilities",
        "standards",
        "tools",
        "protocols",
        "workflows",
        "metrics",
        "best_practices",
        "custom",
      ];
      return order.indexOf(a.type) - order.indexOf(b.type);
    });

    return sortedComponents.map((component) => component.content).join("\n\n");
  }

  private extractVariables(spec: AgentSpecification): Record<string, any> {
    return {
      name: spec.name,
      displayName: spec.displayName,
      description: spec.description,
      purpose: spec.purpose,
      mission: spec.mission,
      domain: spec.domain,
      color: spec.color || "blue",
      responsibilities: spec.responsibilities,
      standards: spec.standards,
      tools: spec.tools,
      protocols: spec.protocols,
      workflows: spec.workflows,
      metrics: spec.metrics,
      bestPractices: spec.bestPractices,
    };
  }

  private formatArray(array: any[]): string {
    return array.map((item) => `- ${this.formatItem(item)}`).join("\n");
  }

  private formatItem(item: any): string {
    if (typeof item === "object" && item !== null) {
      return Object.entries(item)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    }
    return String(item);
  }

  private validateTemplate(template: AgentTemplate): Result<void> {
    const errors: string[] = [];

    if (!template.id) errors.push("Template ID is required");
    if (!template.name) errors.push("Template name is required");
    if (!template.domain) errors.push("Template domain is required");
    if (template.components.length === 0)
      errors.push("Template must have at least one component");

    // Validate required components
    const requiredTypes: ComponentType[] = ["header", "responsibilities"];
    for (const reqType of requiredTypes) {
      if (!template.components.some((c) => c.type === reqType)) {
        errors.push(`Missing required component: ${reqType}`);
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join("; "));
    }

    return Result.ok(undefined);
  }

  private loadBuiltInTemplates(): void {
    this.builtInTemplates.forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  private initializeBuiltInTemplates(): AgentTemplate[] {
    return [
      this.createCoreOrchestratorTemplate(),
      this.createEngineeringTemplate(),
      this.createQualityTemplate(),
      this.createProductTemplate(),
    ];
  }

  private createCoreOrchestratorTemplate(): AgentTemplate {
    return {
      id: "core-orchestrator",
      name: "Orchestrator Template",
      description: "Template for coordination and orchestration agents",
      category: "core",
      domain: "orchestration",
      basePattern: "coordinator",
      components: [
        {
          name: "header",
          type: "header",
          required: true,
          content: this.generateHeaderTemplate("orchestration"),
          variables: ["name", "description", "color"],
        },
      ],
      variables: [],
      metadata: {
        version: "1.0.0",
        author: "System",
        createdAt: new Date(),
        lastModified: new Date(),
        usageCount: 0,
        successRate: 1.0,
        tags: ["core", "orchestration"],
      },
    };
  }

  private createEngineeringTemplate(): AgentTemplate {
    return {
      id: "engineering-template",
      name: "Engineering Agent Template",
      description: "Template for software engineering agents",
      category: "domain_specific",
      domain: "engineering",
      basePattern: "technical-expert",
      components: [
        {
          name: "header",
          type: "header",
          required: true,
          content: this.generateHeaderTemplate("engineering"),
          variables: ["name", "description", "color"],
        },
      ],
      variables: [],
      metadata: {
        version: "1.0.0",
        author: "System",
        createdAt: new Date(),
        lastModified: new Date(),
        usageCount: 0,
        successRate: 1.0,
        tags: ["engineering", "technical"],
      },
    };
  }

  private createQualityTemplate(): AgentTemplate {
    return {
      id: "quality-template",
      name: "Quality Assurance Template",
      description: "Template for QA and testing agents",
      category: "domain_specific",
      domain: "quality",
      basePattern: "quality-expert",
      components: [
        {
          name: "header",
          type: "header",
          required: true,
          content: this.generateHeaderTemplate("quality"),
          variables: ["name", "description", "color"],
        },
      ],
      variables: [],
      metadata: {
        version: "1.0.0",
        author: "System",
        createdAt: new Date(),
        lastModified: new Date(),
        usageCount: 0,
        successRate: 1.0,
        tags: ["quality", "testing"],
      },
    };
  }

  private createProductTemplate(): AgentTemplate {
    return {
      id: "product-template",
      name: "Product Management Template",
      description: "Template for product management agents",
      category: "domain_specific",
      domain: "product",
      basePattern: "product-expert",
      components: [
        {
          name: "header",
          type: "header",
          required: true,
          content: this.generateHeaderTemplate("product"),
          variables: ["name", "description", "color"],
        },
      ],
      variables: [],
      metadata: {
        version: "1.0.0",
        author: "System",
        createdAt: new Date(),
        lastModified: new Date(),
        usageCount: 0,
        successRate: 1.0,
        tags: ["product", "management"],
      },
    };
  }

  private generateHeaderTemplate(domain: string): string {
    return `---
name: {{name}}
description: {{description}}
color: {{color}}
---

You are the {{displayName}}, {{purpose}}.

## Core Responsibilities

{{responsibilities}}

## Standards & Compliance

{{standards}}

## Tools & Technologies

{{tools}}

## Communication Protocols

{{protocols}}

## Workflows

{{workflows}}

## Quality Metrics

{{metrics}}

## Best Practices

{{bestPractices}}

Your mission is to {{mission}}.`;
  }

  private generateResponsibilitiesTemplate(): string {
    return `### Primary Responsibilities
{{#each responsibilities}}
- **{{category}}**: {{description}}
{{/each}}`;
  }

  private generateStandardsTemplate(): string {
    return `### Compliance Standards
{{#each standards}}
- **{{name}} {{version}}**: {{compliance}}
{{/each}}`;
  }

  private generateWorkflowsTemplate(): string {
    return `### Standard Workflows
{{#each workflows}}
#### {{name}}
{{#each steps}}
{{id}}. **{{name}}**: {{action}}
{{/each}}
{{/each}}`;
  }

  private createStandardComponent(
    name: string,
    description: string,
  ): TemplateComponent {
    return {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      type: "standards",
      required: false,
      content: `- **${name}**: ${description}`,
      variables: [],
    };
  }

  private createToolComponent(
    name: string,
    type: string,
    description: string,
  ): TemplateComponent {
    return {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      type: "tools",
      required: type === "required",
      content: `- **${name}** (${type}): ${description}`,
      variables: [],
    };
  }

  private createPatternComponent(
    name: string,
    description: string,
  ): TemplateComponent {
    return {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      type: "custom",
      required: false,
      content: `#### ${name}\n${description}`,
      variables: [],
    };
  }

  private createProtocolComponent(
    name: string,
    format: string,
    description: string,
  ): TemplateComponent {
    return {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      type: "protocols",
      required: false,
      content: `### ${name}\n**Format**: ${format}\n**Description**: ${description}`,
      variables: [],
    };
  }
}
