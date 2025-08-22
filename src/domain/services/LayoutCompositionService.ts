import { LayoutConfiguration, LayoutBlockType, LayoutDisplayMode, BlockConfiguration } from "../value-objects/LayoutConfiguration";
import { ClassName } from "../value-objects/ClassName";
import { Asset } from "../entities/Asset";
import { Result } from "../core/Result";

/**
 * Layout template for common patterns
 */
export interface LayoutTemplate {
  readonly name: string;
  readonly description: string;
  readonly applicableClasses: ClassName[];
  readonly configuration: LayoutConfiguration;
}

/**
 * Layout composition context
 */
export interface LayoutCompositionContext {
  readonly targetClass: ClassName;
  readonly availableProperties: string[];
  readonly userPreferences?: Record<string, any>;
  readonly deviceType?: "mobile" | "tablet" | "desktop";
  readonly accessibilityRequirements?: string[];
}

/**
 * Layout optimization suggestion
 */
export interface LayoutOptimization {
  readonly type: "performance" | "usability" | "accessibility" | "consistency";
  readonly description: string;
  readonly impact: "low" | "medium" | "high";
  readonly suggestedChange: Partial<BlockConfiguration>;
  readonly targetBlock?: LayoutBlockType;
}

/**
 * Layout analytics data
 */
export interface LayoutAnalytics {
  readonly totalBlocks: number;
  readonly visibleBlocks: number;
  readonly estimatedRenderTime: number;
  readonly complexityScore: number;
  readonly accessibilityScore: number;
  readonly responsiveness: boolean;
}

/**
 * Domain service for layout composition and optimization
 * Handles complex layout business logic and template management
 */
export class LayoutCompositionService {
  private readonly templates: Map<string, LayoutTemplate> = new Map();
  private readonly optimizationRules: LayoutOptimizationRule[] = [];

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeOptimizationRules();
  }

  /**
   * Compose optimal layout for a given context
   */
  composeLayout(context: LayoutCompositionContext): Result<LayoutConfiguration> {
    try {
      // Find best matching template
      const template = this.findBestTemplate(context);
      
      if (!template) {
        // Create default layout if no template matches
        return this.createDefaultLayout(context);
      }

      // Customize template for context
      const customizedLayout = this.customizeLayoutForContext(template.configuration, context);
      
      if (!customizedLayout.isSuccess) {
        return customizedLayout;
      }

      // Apply optimizations
      const optimizedLayout = this.applyOptimizations(customizedLayout.getValue()!, context);
      
      return optimizedLayout;
    } catch (error) {
      return Result.fail<LayoutConfiguration>(`Layout composition failed: ${error}`);
    }
  }

  /**
   * Optimize existing layout configuration
   */
  optimizeLayout(
    layout: LayoutConfiguration, 
    context: LayoutCompositionContext
  ): Result<LayoutConfiguration> {
    try {
      let currentLayout = layout;
      const optimizations = this.analyzeLayoutOptimizations(layout, context);

      // Apply high-impact optimizations
      const highImpactOptimizations = optimizations.filter(opt => opt.impact === "high");
      
      for (const optimization of highImpactOptimizations) {
        if (optimization.targetBlock) {
          const optimizedResult = currentLayout.withUpdatedBlock(
            optimization.targetBlock,
            optimization.suggestedChange
          );
          
          if (optimizedResult.isSuccess) {
            currentLayout = optimizedResult.getValue()!;
          }
        }
      }

      return Result.ok(currentLayout);
    } catch (error) {
      return Result.fail<LayoutConfiguration>(`Layout optimization failed: ${error}`);
    }
  }

  /**
   * Analyze layout for optimization opportunities
   */
  analyzeLayoutOptimizations(
    layout: LayoutConfiguration,
    context: LayoutCompositionContext
  ): LayoutOptimization[] {
    const optimizations: LayoutOptimization[] = [];

    for (const rule of this.optimizationRules) {
      try {
        const suggestions = rule.analyze(layout, context);
        optimizations.push(...suggestions);
      } catch (error) {
        console.warn(`Optimization rule failed: ${error}`);
      }
    }

    return optimizations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Get layout analytics and metrics
   */
  analyzeLayout(layout: LayoutConfiguration): LayoutAnalytics {
    const blocks = layout.getBlocks();
    const visibleBlocks = layout.getVisibleBlocks();

    // Calculate estimated render time based on block complexity
    const estimatedRenderTime = this.calculateEstimatedRenderTime(visibleBlocks);
    
    // Calculate complexity score
    const complexityScore = this.calculateComplexityScore(blocks);
    
    // Calculate accessibility score
    const accessibilityScore = this.calculateAccessibilityScore(layout);

    return {
      totalBlocks: blocks.length,
      visibleBlocks: visibleBlocks.length,
      estimatedRenderTime,
      complexityScore,
      accessibilityScore,
      responsiveness: layout.isResponsive()
    };
  }

  /**
   * Create layout from asset properties
   */
  createLayoutFromAsset(asset: Asset): Result<LayoutConfiguration> {
    const context: LayoutCompositionContext = {
      targetClass: asset.getClassName(),
      availableProperties: Array.from(asset.getProperties().keys())
    };

    return this.composeLayout(context);
  }

  /**
   * Merge multiple layouts into a composite layout
   */
  mergeLayouts(
    layouts: LayoutConfiguration[],
    name: string
  ): Result<LayoutConfiguration> {
    if (layouts.length === 0) {
      return Result.fail<LayoutConfiguration>("Cannot merge empty layout array");
    }

    if (layouts.length === 1) {
      return Result.ok(layouts[0]);
    }

    try {
      const allBlocks: BlockConfiguration[] = [];
      let orderCounter = 1;

      // Merge blocks from all layouts
      for (const layout of layouts) {
        const blocks = layout.getBlocks();
        
        for (const block of blocks) {
          // Check if block type already exists
          const existingBlock = allBlocks.find(b => b.type === block.type);
          
          if (!existingBlock) {
            allBlocks.push({
              ...block,
              order: orderCounter++
            });
          } else {
            // Merge properties for duplicate blocks
            const mergedBlock: BlockConfiguration = {
              ...existingBlock,
              visible: existingBlock.visible || block.visible,
              properties: [
                ...(existingBlock.properties || []),
                ...(block.properties || [])
              ].filter((prop, index, arr) => arr.indexOf(prop) === index)
            };
            
            const existingIndex = allBlocks.indexOf(existingBlock);
            allBlocks[existingIndex] = mergedBlock;
          }
        }
      }

      return LayoutConfiguration.create({
        name,
        description: `Merged layout from ${layouts.length} layouts`,
        blocks: allBlocks,
        responsive: layouts.every(l => l.isResponsive())
      });
    } catch (error) {
      return Result.fail<LayoutConfiguration>(`Layout merge failed: ${error}`);
    }
  }

  /**
   * Register custom layout template
   */
  registerTemplate(template: LayoutTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * Get all available templates
   */
  getTemplates(): ReadonlyMap<string, LayoutTemplate> {
    return new Map(this.templates);
  }

  /**
   * Get templates applicable to a specific class
   */
  getTemplatesForClass(className: ClassName): LayoutTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => 
        template.applicableClasses.length === 0 || // Universal template
        template.applicableClasses.some(cls => cls.equals(className))
      );
  }

  /**
   * Find best matching template for context
   */
  private findBestTemplate(context: LayoutCompositionContext): LayoutTemplate | null {
    const applicableTemplates = this.getTemplatesForClass(context.targetClass);
    
    if (applicableTemplates.length === 0) {
      return null;
    }

    // Score templates based on context match
    const scoredTemplates = applicableTemplates.map(template => ({
      template,
      score: this.scoreTemplateForContext(template, context)
    }));

    // Return highest scoring template
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0]?.template || null;
  }

  /**
   * Score template match for context
   */
  private scoreTemplateForContext(
    template: LayoutTemplate,
    context: LayoutCompositionContext
  ): number {
    let score = 0;

    // Class specificity bonus
    if (template.applicableClasses.some(cls => cls.equals(context.targetClass))) {
      score += 10;
    }

    // Property coverage bonus
    const templateBlocks = template.configuration.getBlocks();
    const propertiesBlock = templateBlocks.find(b => b.type === LayoutBlockType.PROPERTIES);
    
    if (propertiesBlock && propertiesBlock.properties) {
      const coveredProperties = propertiesBlock.properties.filter(prop => 
        context.availableProperties.includes(prop)
      );
      score += coveredProperties.length;
    }

    // Device compatibility bonus
    if (context.deviceType === "mobile" && template.configuration.isResponsive()) {
      score += 5;
    }

    return score;
  }

  /**
   * Customize layout for specific context
   */
  private customizeLayoutForContext(
    layout: LayoutConfiguration,
    context: LayoutCompositionContext
  ): Result<LayoutConfiguration> {
    let customizedLayout = layout;

    // Customize properties block
    const propertiesBlock = layout.getBlockByType(LayoutBlockType.PROPERTIES);
    if (propertiesBlock) {
      const relevantProperties = context.availableProperties
        .filter(prop => !prop.startsWith('exo__')); // Filter system properties

      const updatedResult = customizedLayout.withUpdatedBlock(
        LayoutBlockType.PROPERTIES,
        { properties: relevantProperties }
      );

      if (updatedResult.isSuccess) {
        customizedLayout = updatedResult.getValue()!;
      }
    }

    // Device-specific customizations
    if (context.deviceType === "mobile") {
      // Make mobile-friendly adjustments
      const blocks = customizedLayout.getBlocks();
      
      for (const block of blocks) {
        if (block.displayMode === LayoutDisplayMode.TABLE) {
          const mobileResult = customizedLayout.withUpdatedBlock(
            block.type,
            { displayMode: LayoutDisplayMode.LIST }
          );
          
          if (mobileResult.isSuccess) {
            customizedLayout = mobileResult.getValue()!;
          }
        }
      }
    }

    return Result.ok(customizedLayout);
  }

  /**
   * Apply layout optimizations
   */
  private applyOptimizations(
    layout: LayoutConfiguration,
    context: LayoutCompositionContext
  ): Result<LayoutConfiguration> {
    const optimizations = this.analyzeLayoutOptimizations(layout, context);
    let optimizedLayout = layout;

    // Apply only safe, high-confidence optimizations
    const safeOptimizations = optimizations.filter(opt => 
      opt.impact === "high" && opt.type === "performance"
    );

    for (const optimization of safeOptimizations) {
      if (optimization.targetBlock) {
        const result = optimizedLayout.withUpdatedBlock(
          optimization.targetBlock,
          optimization.suggestedChange
        );
        
        if (result.isSuccess) {
          optimizedLayout = result.getValue()!;
        }
      }
    }

    return Result.ok(optimizedLayout);
  }

  /**
   * Create default layout for context
   */
  private createDefaultLayout(context: LayoutCompositionContext): Result<LayoutConfiguration> {
    const blocks: BlockConfiguration[] = [
      {
        type: LayoutBlockType.PROPERTIES,
        title: "Properties",
        displayMode: LayoutDisplayMode.TABLE,
        visible: true,
        order: 1,
        properties: context.availableProperties.filter(prop => !prop.startsWith('exo__'))
      },
      {
        type: LayoutBlockType.CHILDREN_EFFORTS,
        title: "Related Items",
        displayMode: LayoutDisplayMode.TABLE,
        visible: true,
        order: 2
      },
      {
        type: LayoutBlockType.BACKLINKS,
        title: "Backlinks",
        displayMode: LayoutDisplayMode.LIST,
        visible: true,
        order: 3
      }
    ];

    return LayoutConfiguration.create({
      name: `Default-${context.targetClass.toString()}`,
      description: "Default generated layout",
      blocks
    });
  }

  /**
   * Calculate estimated render time
   */
  private calculateEstimatedRenderTime(blocks: ReadonlyArray<BlockConfiguration>): number {
    let time = 0;
    
    for (const block of blocks) {
      switch (block.type) {
        case LayoutBlockType.PROPERTIES:
          time += 50; // Base time for properties
          time += (block.properties?.length || 0) * 10;
          break;
        case LayoutBlockType.CHILDREN_EFFORTS:
          time += 200; // Query time
          break;
        case LayoutBlockType.CUSTOM_QUERY:
          time += 300; // Custom query time
          break;
        case LayoutBlockType.BACKLINKS:
          time += 150;
          break;
        default:
          time += 75;
      }
    }

    return time;
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexityScore(blocks: ReadonlyArray<BlockConfiguration>): number {
    let score = 0;
    
    score += blocks.length * 10; // Base complexity
    score += blocks.filter(b => b.type === LayoutBlockType.CUSTOM_QUERY).length * 30;
    score += blocks.filter(b => b.displayMode === LayoutDisplayMode.TABLE).length * 15;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(layout: LayoutConfiguration): number {
    let score = 100;
    const blocks = layout.getBlocks();
    
    // Deduct points for accessibility issues
    for (const block of blocks) {
      if (!block.title) {
        score -= 10; // Missing titles hurt accessibility
      }
    }
    
    if (!layout.isResponsive()) {
      score -= 20; // Non-responsive layouts hurt mobile accessibility
    }
    
    return Math.max(score, 0);
  }

  /**
   * Initialize default layout templates
   */
  private initializeDefaultTemplates(): void {
    // Person template
    const personBlocks: BlockConfiguration[] = [
      {
        type: LayoutBlockType.PROPERTIES,
        title: "Personal Information",
        displayMode: LayoutDisplayMode.TABLE,
        visible: true,
        order: 1,
        properties: ["firstName", "lastName", "email", "phone", "organization"]
      },
      {
        type: LayoutBlockType.CHILDREN_EFFORTS,
        title: "Related Projects",
        displayMode: LayoutDisplayMode.TABLE,
        visible: true,
        order: 2
      },
      {
        type: LayoutBlockType.BACKLINKS,
        title: "Mentions",
        displayMode: LayoutDisplayMode.LIST,
        visible: true,
        order: 3
      }
    ];

    const personTemplate: LayoutTemplate = {
      name: "Person",
      description: "Layout template for person entities",
      applicableClasses: [ClassName.create("exo__Person").getValue()!],
      configuration: LayoutConfiguration.create({
        name: "Person Template",
        blocks: personBlocks
      }).getValue()!
    };

    this.registerTemplate(personTemplate);

    // Project template
    const projectBlocks: BlockConfiguration[] = [
      {
        type: LayoutBlockType.PROPERTIES,
        title: "Project Details",
        displayMode: LayoutDisplayMode.TABLE,
        visible: true,
        order: 1,
        properties: ["status", "priority", "startDate", "endDate", "budget"]
      },
      {
        type: LayoutBlockType.CHILDREN_EFFORTS,
        title: "Tasks & Deliverables",
        displayMode: LayoutDisplayMode.TABLE,
        visible: true,
        order: 2
      },
      {
        type: LayoutBlockType.BACKLINKS,
        title: "References",
        displayMode: LayoutDisplayMode.LIST,
        visible: true,
        order: 3
      },
      {
        type: LayoutBlockType.BUTTONS,
        title: "Actions",
        displayMode: LayoutDisplayMode.LIST,
        visible: true,
        order: 4
      }
    ];

    const projectTemplate: LayoutTemplate = {
      name: "Project",
      description: "Layout template for project entities",
      applicableClasses: [ClassName.create("exo__Project").getValue()!],
      configuration: LayoutConfiguration.create({
        name: "Project Template",
        blocks: projectBlocks
      }).getValue()!
    };

    this.registerTemplate(projectTemplate);
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    // Performance optimization rule
    this.optimizationRules.push({
      analyze: (layout: LayoutConfiguration, context: LayoutCompositionContext): LayoutOptimization[] => {
        const optimizations: LayoutOptimization[] = [];
        const blocks = layout.getBlocks();

        // Too many visible blocks
        const visibleBlocks = blocks.filter(b => b.visible);
        if (visibleBlocks.length > 5) {
          optimizations.push({
            type: "performance",
            description: "Too many visible blocks may impact performance",
            impact: "medium",
            suggestedChange: { visible: false },
            targetBlock: visibleBlocks[visibleBlocks.length - 1].type
          });
        }

        // Complex queries without limits
        for (const block of blocks) {
          if (block.type === LayoutBlockType.CUSTOM_QUERY && !block.maxItems) {
            optimizations.push({
              type: "performance",
              description: "Custom queries should have item limits",
              impact: "high",
              suggestedChange: { maxItems: 50 },
              targetBlock: block.type
            });
          }
        }

        return optimizations;
      }
    });

    // Usability optimization rule
    this.optimizationRules.push({
      analyze: (layout: LayoutConfiguration, context: LayoutCompositionContext): LayoutOptimization[] => {
        const optimizations: LayoutOptimization[] = [];
        const blocks = layout.getBlocks();

        // Missing titles
        for (const block of blocks) {
          if (!block.title) {
            optimizations.push({
              type: "usability",
              description: "Blocks should have descriptive titles",
              impact: "medium",
              suggestedChange: { title: this.getDefaultBlockTitle(block.type) },
              targetBlock: block.type
            });
          }
        }

        return optimizations;
      }
    });
  }

  /**
   * Get default title for block type
   */
  private getDefaultBlockTitle(type: LayoutBlockType): string {
    switch (type) {
      case LayoutBlockType.PROPERTIES:
        return "Properties";
      case LayoutBlockType.CHILDREN_EFFORTS:
        return "Related Items";
      case LayoutBlockType.CUSTOM_QUERY:
        return "Query Results";
      case LayoutBlockType.BACKLINKS:
        return "Backlinks";
      case LayoutBlockType.NARROWER:
        return "Narrower Concepts";
      case LayoutBlockType.BUTTONS:
        return "Actions";
      case LayoutBlockType.MARKDOWN:
        return "Content";
      default:
        return "Block";
    }
  }
}

/**
 * Layout optimization rule interface
 */
interface LayoutOptimizationRule {
  analyze(layout: LayoutConfiguration, context: LayoutCompositionContext): LayoutOptimization[];
}