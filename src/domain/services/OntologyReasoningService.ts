import { Asset } from "../entities/Asset";
import { ClassName } from "../value-objects/ClassName";
import { OntologyPrefix } from "../value-objects/OntologyPrefix";
import { Triple, IRI, BlankNode } from "../semantic/core/Triple";
import { Graph } from "../semantic/core/Graph";
import { Result } from "../core/Result";

/**
 * Class hierarchy relationship
 */
export interface ClassHierarchy {
  readonly className: ClassName;
  readonly superClasses: ClassName[];
  readonly subClasses: ClassName[];
  readonly depth: number;
}

/**
 * Property inheritance information
 */
export interface PropertyInheritance {
  readonly propertyName: string;
  readonly inheritedFrom: ClassName;
  readonly required: boolean;
  readonly type?: string;
  readonly constraints?: Record<string, any>;
}

/**
 * Inference result
 */
export interface InferenceResult {
  readonly newTriples: Triple[];
  readonly inferencesApplied: string[];
  readonly conflicts: string[];
}

/**
 * Reasoning strategy interface
 */
export interface ReasoningStrategy {
  readonly name: string;
  readonly description: string;
  apply(graph: Graph): InferenceResult;
}

/**
 * Domain service for ontology reasoning and inference
 * Handles class hierarchies, property inheritance, and semantic inference
 */
export class OntologyReasoningService {
  private readonly strategies: Map<string, ReasoningStrategy> = new Map();
  private readonly classHierarchies: Map<string, ClassHierarchy> = new Map();

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * Infer missing properties and relationships for an asset
   */
  inferAssetProperties(asset: Asset, graph: Graph): Result<Asset> {
    try {
      const className = asset.getClassName();
      const hierarchy = this.getClassHierarchy(className);
      
      if (!hierarchy) {
        return Result.ok(asset); // No hierarchy information available
      }

      // Get inherited properties
      const inheritedProperties = this.getInheritedProperties(className, graph);
      const currentProperties = asset.getProperties();
      
      // Apply inherited properties that are missing
      const newProperties = new Map(currentProperties);
      let hasChanges = false;

      for (const inheritance of inheritedProperties) {
        if (!currentProperties.has(inheritance.propertyName) && inheritance.required) {
          // Set default value based on type
          const defaultValue = this.getDefaultValueForType(inheritance.type);
          if (defaultValue !== null) {
            newProperties.set(inheritance.propertyName, defaultValue);
            hasChanges = true;
          }
        }
      }

      if (!hasChanges) {
        return Result.ok(asset);
      }

      // Create new asset with inferred properties
      const assetResult = Asset.create({
        id: asset.getId(),
        className: asset.getClassName(),
        ontology: asset.getOntologyPrefix(),
        label: asset.getTitle(),
        properties: Object.fromEntries(newProperties)
      });

      return assetResult;
    } catch (error) {
      return Result.fail<Asset>(`Property inference failed: ${error}`);
    }
  }

  /**
   * Apply reasoning strategies to a graph
   */
  applyReasoning(graph: Graph, strategyNames?: string[]): InferenceResult {
    const allTriples: Triple[] = [];
    const allInferences: string[] = [];
    const allConflicts: string[] = [];

    const strategiesToApply = strategyNames 
      ? strategyNames.map(name => this.strategies.get(name)).filter(s => s !== undefined) as ReasoningStrategy[]
      : Array.from(this.strategies.values());

    for (const strategy of strategiesToApply) {
      try {
        const result = strategy.apply(graph);
        allTriples.push(...result.newTriples);
        allInferences.push(...result.inferencesApplied);
        allConflicts.push(...result.conflicts);

        // Add inferred triples to graph for next strategy
        for (const triple of result.newTriples) {
          graph.addTriple(triple);
        }
      } catch (error) {
        allConflicts.push(`Strategy '${strategy.name}' failed: ${error}`);
      }
    }

    return {
      newTriples: allTriples,
      inferencesApplied: allInferences,
      conflicts: allConflicts
    };
  }

  /**
   * Get class hierarchy for a given class
   */
  getClassHierarchy(className: ClassName): ClassHierarchy | null {
    return this.classHierarchies.get(className.toString()) || null;
  }

  /**
   * Build class hierarchy from graph
   */
  buildClassHierarchy(graph: Graph): void {
    this.classHierarchies.clear();

    // Find all class definitions
    const classTriples = graph.getTriples()
      .filter(triple => 
        triple.getPredicate().toString().includes('rdf:type') && 
        triple.getObject().toString().includes('owl:Class')
      );

    for (const classTriple of classTriples) {
      const classNameResult = ClassName.create(classTriple.getSubject().toString());
      if (!classNameResult.isSuccess) continue;

      const className = classNameResult.getValue()!;
      
      // Find superclasses
      const superClasses = this.findSuperClasses(className, graph);
      
      // Find subclasses
      const subClasses = this.findSubClasses(className, graph);
      
      // Calculate depth in hierarchy
      const depth = this.calculateClassDepth(className, graph);

      this.classHierarchies.set(className.toString(), {
        className,
        superClasses,
        subClasses,
        depth
      });
    }
  }

  /**
   * Get inherited properties for a class
   */
  getInheritedProperties(className: ClassName, graph: Graph): PropertyInheritance[] {
    const inherited: PropertyInheritance[] = [];
    const hierarchy = this.getClassHierarchy(className);
    
    if (!hierarchy) {
      return inherited;
    }

    // Traverse up the hierarchy
    for (const superClass of hierarchy.superClasses) {
      const properties = this.getClassProperties(superClass, graph);
      
      for (const property of properties) {
        inherited.push({
          propertyName: property.name,
          inheritedFrom: superClass,
          required: property.required,
          type: property.type,
          constraints: property.constraints
        });
      }

      // Recursively get properties from super-superclasses
      const superInherited = this.getInheritedProperties(superClass, graph);
      inherited.push(...superInherited);
    }

    return inherited;
  }

  /**
   * Check if one class is a subclass of another
   */
  isSubClassOf(subClass: ClassName, superClass: ClassName): boolean {
    const hierarchy = this.getClassHierarchy(subClass);
    if (!hierarchy) return false;

    // Direct superclass check
    if (hierarchy.superClasses.some(sc => sc.equals(superClass))) {
      return true;
    }

    // Recursive check
    for (const directSuperClass of hierarchy.superClasses) {
      if (this.isSubClassOf(directSuperClass, superClass)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find most specific common superclass
   */
  findCommonSuperClass(classes: ClassName[]): ClassName | null {
    if (classes.length === 0) return null;
    if (classes.length === 1) return classes[0];

    // Get all superclasses for first class
    const firstClassHierarchy = this.getClassHierarchy(classes[0]);
    if (!firstClassHierarchy) return null;

    const candidates = [classes[0], ...firstClassHierarchy.superClasses];

    // Find candidates that are superclasses of all input classes
    for (const candidate of candidates) {
      const isCommonSuperClass = classes.every(cls => 
        cls.equals(candidate) || this.isSubClassOf(cls, candidate)
      );

      if (isCommonSuperClass) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Add reasoning strategy
   */
  addReasoningStrategy(strategy: ReasoningStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Get all available reasoning strategies
   */
  getReasoningStrategies(): ReadonlyMap<string, ReasoningStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Initialize default reasoning strategies
   */
  private initializeDefaultStrategies(): void {
    // Transitive closure strategy for subclass relationships
    this.addReasoningStrategy({
      name: "TransitiveSubclassInference",
      description: "Infers transitive subclass relationships",
      apply: (graph: Graph): InferenceResult => {
        const newTriples: Triple[] = [];
        const inferences: string[] = [];
        const conflicts: string[] = [];

        // Find all subclass relationships
        const subclassTriples = graph.getTriples()
          .filter(triple => triple.getPredicate().toString().includes('rdfs:subClassOf'));

        // Apply transitivity: if A subClassOf B and B subClassOf C, then A subClassOf C
        for (const triple1 of subclassTriples) {
          for (const triple2 of subclassTriples) {
            // Check if objects match subjects (handle both IRI and BlankNode)
            const obj1 = triple1.getObject();
            const subj2 = triple2.getSubject();
            let isEqual = false;
            
            if (obj1 instanceof IRI && subj2 instanceof IRI) {
              isEqual = obj1.equals(subj2);
            } else if (obj1 instanceof BlankNode && subj2 instanceof BlankNode) {
              isEqual = obj1.equals(subj2);
            } else if (obj1 === subj2) {
              isEqual = true;
            }
            
            if (isEqual) {
              // Create transitive triple
              const transitiveTriple = new Triple(
                triple1.getSubject(),
                triple1.getPredicate(),
                triple2.getObject()
              );

              // Check if it doesn't already exist
              if (!graph.hasTriple(transitiveTriple)) {
                newTriples.push(transitiveTriple);
                inferences.push(`Transitive subclass: ${triple1.getSubject()} -> ${triple2.getObject()}`);
              }
            }
          }
        }

        return { newTriples, inferencesApplied: inferences, conflicts };
      }
    });

    // Property domain/range inference
    this.addReasoningStrategy({
      name: "PropertyDomainRangeInference",
      description: "Infers types based on property domains and ranges",
      apply: (graph: Graph): InferenceResult => {
        const newTriples: Triple[] = [];
        const inferences: string[] = [];
        const conflicts: string[] = [];

        // This would need actual property domain/range definitions in the graph
        // For now, return empty result
        return { newTriples, inferencesApplied: inferences, conflicts };
      }
    });

    // Inverse property inference
    this.addReasoningStrategy({
      name: "InversePropertyInference",
      description: "Infers inverse property relationships",
      apply: (graph: Graph): InferenceResult => {
        const newTriples: Triple[] = [];
        const inferences: string[] = [];
        const conflicts: string[] = [];

        // Find inverse property definitions and create inverse triples
        // This would need owl:inverseOf definitions in the graph
        return { newTriples, inferencesApplied: inferences, conflicts };
      }
    });
  }

  /**
   * Find superclasses for a given class
   */
  private findSuperClasses(className: ClassName, graph: Graph): ClassName[] {
    const superClasses: ClassName[] = [];
    
    const subclassTriples = graph.getTriples()
      .filter(triple => 
        triple.getSubject().toString() === className.toString() &&
        triple.getPredicate().toString().includes('rdfs:subClassOf')
      );

    for (const triple of subclassTriples) {
      const superClassResult = ClassName.create(triple.getObject().toString());
      if (superClassResult.isSuccess) {
        superClasses.push(superClassResult.getValue()!);
      }
    }

    return superClasses;
  }

  /**
   * Find subclasses for a given class
   */
  private findSubClasses(className: ClassName, graph: Graph): ClassName[] {
    const subClasses: ClassName[] = [];
    
    const subclassTriples = graph.getTriples()
      .filter(triple => 
        triple.getObject().toString() === className.toString() &&
        triple.getPredicate().toString().includes('rdfs:subClassOf')
      );

    for (const triple of subclassTriples) {
      const subClassResult = ClassName.create(triple.getSubject().toString());
      if (subClassResult.isSuccess) {
        subClasses.push(subClassResult.getValue()!);
      }
    }

    return subClasses;
  }

  /**
   * Calculate class depth in hierarchy
   */
  private calculateClassDepth(className: ClassName, graph: Graph): number {
    const superClasses = this.findSuperClasses(className, graph);
    
    if (superClasses.length === 0) {
      return 0; // Root class
    }

    let maxDepth = 0;
    for (const superClass of superClasses) {
      const depth = this.calculateClassDepth(superClass, graph);
      maxDepth = Math.max(maxDepth, depth + 1);
    }

    return maxDepth;
  }

  /**
   * Get properties defined for a specific class
   */
  private getClassProperties(className: ClassName, graph: Graph): Array<{
    name: string;
    required: boolean;
    type?: string;
    constraints?: Record<string, any>;
  }> {
    const properties: Array<{
      name: string;
      required: boolean;
      type?: string;
      constraints?: Record<string, any>;
    }> = [];

    // This would need actual property definitions in the graph
    // For now, return empty array
    return properties;
  }

  /**
   * Get default value for a property type
   */
  private getDefaultValueForType(type?: string): any {
    switch (type) {
      case "string":
        return "";
      case "number":
        return 0;
      case "boolean":
        return false;
      case "array":
        return [];
      case "object":
        return {};
      default:
        return null;
    }
  }
}