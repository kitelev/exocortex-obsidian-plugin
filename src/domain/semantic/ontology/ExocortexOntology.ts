/**
 * Exocortex Core Ontology Definitions
 * Defines the fundamental classes and properties for the Exocortex system
 */

import { Ontology, ClassDefinition, PropertyDefinition, DataType, IRI } from './Ontology';
import { EXO, EMS } from '../core/Triple';
import { Result } from '../../core/Result';

/**
 * Create the core Exocortex ontology
 */
export function createExocortexCoreOntology(): Result<Ontology> {
  const ontology = new Ontology(
    EXO.namespace,
    'exo',
    'Exocortex Core Ontology',
    '1.0.0'
  );

  // Base Asset class
  const assetClass: ClassDefinition = {
    iri: EXO.Asset,
    label: 'Asset',
    comment: 'Base class for all knowledge objects in the Exocortex system',
    superClasses: [],
    properties: [],
    abstract: true,
    icon: '📦',
    color: '#6366f1'
  };

  const addClassResult = ontology.addClass(assetClass);
  if (addClassResult.isFailure) {
    return Result.fail(addClassResult.error);
  }

  // Core properties
  const properties: PropertyDefinition[] = [
    {
      iri: EXO.uuid,
      label: 'UUID',
      comment: 'Universally unique identifier',
      domain: [EXO.Asset],
      range: DataType.UUID,
      required: true,
      multiple: false,
      order: 1
    },
    {
      iri: new IRI('https://exocortex.io/ontology/core#label'),
      label: 'Label',
      comment: 'Human-readable label',
      domain: [EXO.Asset],
      range: DataType.String,
      required: true,
      multiple: false,
      order: 2
    },
    {
      iri: new IRI('https://exocortex.io/ontology/core#description'),
      label: 'Description',
      comment: 'Detailed description',
      domain: [EXO.Asset],
      range: DataType.Markdown,
      required: false,
      multiple: false,
      order: 3
    },
    {
      iri: EXO.createdAt,
      label: 'Created At',
      comment: 'Creation timestamp',
      domain: [EXO.Asset],
      range: DataType.DateTime,
      required: true,
      multiple: false,
      order: 100
    },
    {
      iri: EXO.updatedAt,
      label: 'Updated At',
      comment: 'Last update timestamp',
      domain: [EXO.Asset],
      range: DataType.DateTime,
      required: true,
      multiple: false,
      order: 101
    },
    {
      iri: EXO.isDefinedBy,
      label: 'Is Defined By',
      comment: 'Ontology that defines this asset',
      domain: [EXO.Asset],
      range: new IRI('https://exocortex.io/ontology/core#Ontology'),
      required: false,
      multiple: false,
      order: 102
    }
  ];

  for (const prop of properties) {
    const result = ontology.addProperty(prop);
    if (result.isFailure) {
      return Result.fail(result.error);
    }
  }

  return Result.ok(ontology);
}

/**
 * Create the Effort Management System ontology
 */
export function createEMSOntology(): Result<Ontology> {
  const ontology = new Ontology(
    EMS.namespace,
    'ems',
    'Effort Management System Ontology',
    '1.0.0'
  );

  // First, we need the Asset class from core ontology
  const assetClass: ClassDefinition = {
    iri: EXO.Asset,
    label: 'Asset',
    comment: 'Base class (imported from core)',
    superClasses: [],
    properties: [],
    abstract: true
  };

  ontology.addClass(assetClass);

  // Task class
  const taskClass: ClassDefinition = {
    iri: EMS.Task,
    label: 'Task',
    comment: 'A single-step actionable effort',
    superClasses: [EXO.Asset],
    properties: [],
    icon: '✅',
    color: '#10b981'
  };

  ontology.addClass(taskClass);

  // Project class
  const projectClass: ClassDefinition = {
    iri: EMS.Project,
    label: 'Project',
    comment: 'A multi-step effort with defined outcome',
    superClasses: [EXO.Asset],
    properties: [],
    icon: '🎯',
    color: '#f59e0b'
  };

  ontology.addClass(projectClass);

  // Area class
  const areaClass: ClassDefinition = {
    iri: EMS.Area,
    label: 'Area',
    comment: 'A sphere of responsibility with ongoing efforts',
    superClasses: [EXO.Asset],
    properties: [],
    icon: '🏛️',
    color: '#8b5cf6'
  };

  ontology.addClass(areaClass);

  // EMS Properties
  const emsProperties: PropertyDefinition[] = [
    {
      iri: EMS.status,
      label: 'Status',
      comment: 'Current status of the effort',
      domain: [EMS.Task, EMS.Project],
      range: new IRI('https://exocortex.io/ontology/ems#Status'),
      required: true,
      multiple: false,
      defaultValue: 'ems:Inbox',
      order: 10
    },
    {
      iri: EMS.priority,
      label: 'Priority',
      comment: 'Priority level',
      domain: [EMS.Task, EMS.Project],
      range: DataType.Integer,
      required: false,
      multiple: false,
      defaultValue: 3,
      order: 11
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#dueDate'),
      label: 'Due Date',
      comment: 'When the effort is due',
      domain: [EMS.Task, EMS.Project],
      range: DataType.Date,
      required: false,
      multiple: false,
      order: 12
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#estimatedHours'),
      label: 'Estimated Hours',
      comment: 'Estimated time to complete',
      domain: [EMS.Task, EMS.Project],
      range: DataType.Double,
      required: false,
      multiple: false,
      order: 13
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#actualHours'),
      label: 'Actual Hours',
      comment: 'Actual time spent',
      domain: [EMS.Task, EMS.Project],
      range: DataType.Double,
      required: false,
      multiple: false,
      order: 14
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#assignedTo'),
      label: 'Assigned To',
      comment: 'Person responsible for this effort',
      domain: [EMS.Task, EMS.Project],
      range: new IRI('https://exocortex.io/ontology/core#Person'),
      required: false,
      multiple: false,
      order: 15
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#partOf'),
      label: 'Part Of',
      comment: 'Parent project or area',
      domain: [EMS.Task, EMS.Project],
      range: EXO.Asset,
      required: false,
      multiple: false,
      order: 16
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#tags'),
      label: 'Tags',
      comment: 'Categorical tags',
      domain: [EMS.Task, EMS.Project, EMS.Area],
      range: DataType.String,
      required: false,
      multiple: true,
      order: 20
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#blockedBy'),
      label: 'Blocked By',
      comment: 'Tasks or issues blocking this effort',
      domain: [EMS.Task, EMS.Project],
      range: EMS.Task,
      required: false,
      multiple: true,
      order: 30
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#outcomes'),
      label: 'Outcomes',
      comment: 'Expected outcomes or deliverables',
      domain: [EMS.Project],
      range: DataType.Markdown,
      required: false,
      multiple: false,
      order: 40
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ems#budget'),
      label: 'Budget',
      comment: 'Time budget allocation',
      domain: [EMS.Area],
      range: DataType.Double,
      required: false,
      multiple: false,
      order: 50
    }
  ];

  for (const prop of emsProperties) {
    const result = ontology.addProperty(prop);
    if (result.isFailure) {
      return Result.fail(result.error);
    }
  }

  // Status enumeration class
  const statusClass: ClassDefinition = {
    iri: new IRI('https://exocortex.io/ontology/ems#Status'),
    label: 'Status',
    comment: 'Effort status enumeration',
    superClasses: [],
    properties: [],
    abstract: true
  };

  ontology.addClass(statusClass);

  // Status values as individuals
  const statusValues = [
    { iri: 'Inbox', label: 'Inbox', icon: '📥' },
    { iri: 'Next', label: 'Next', icon: '⏭️' },
    { iri: 'InProgress', label: 'In Progress', icon: '🏃' },
    { iri: 'Waiting', label: 'Waiting', icon: '⏸️' },
    { iri: 'Blocked', label: 'Blocked', icon: '🚫' },
    { iri: 'Done', label: 'Done', icon: '✅' },
    { iri: 'Cancelled', label: 'Cancelled', icon: '❌' }
  ];

  for (const status of statusValues) {
    const statusIri = new IRI(`https://exocortex.io/ontology/ems#${status.iri}`);
    const statusDef: ClassDefinition = {
      iri: statusIri,
      label: status.label,
      comment: `Status: ${status.label}`,
      superClasses: [new IRI('https://exocortex.io/ontology/ems#Status')],
      properties: [],
      icon: status.icon
    };
    ontology.addClass(statusDef);
  }

  return Result.ok(ontology);
}

/**
 * Create the Information Management System ontology
 */
export function createIMSOntology(): Result<Ontology> {
  const imsNamespace = new IRI('https://exocortex.io/ontology/ims#');
  
  const ontology = new Ontology(
    imsNamespace,
    'ims',
    'Information Management System Ontology',
    '1.0.0'
  );

  // Import Asset from core
  const assetClass: ClassDefinition = {
    iri: EXO.Asset,
    label: 'Asset',
    comment: 'Base class (imported from core)',
    superClasses: [],
    properties: [],
    abstract: true
  };

  ontology.addClass(assetClass);

  // Note class
  const noteClass: ClassDefinition = {
    iri: new IRI('https://exocortex.io/ontology/ims#Note'),
    label: 'Note',
    comment: 'A piece of knowledge or information',
    superClasses: [EXO.Asset],
    properties: [],
    icon: '📝',
    color: '#3b82f6'
  };

  ontology.addClass(noteClass);

  // MOC (Map of Content) class
  const mocClass: ClassDefinition = {
    iri: new IRI('https://exocortex.io/ontology/ims#MOC'),
    label: 'Map of Content',
    comment: 'An index or overview of related content',
    superClasses: [EXO.Asset],
    properties: [],
    icon: '🗺️',
    color: '#ec4899'
  };

  ontology.addClass(mocClass);

  // Person class
  const personClass: ClassDefinition = {
    iri: new IRI('https://exocortex.io/ontology/core#Person'),
    label: 'Person',
    comment: 'A person or contact',
    superClasses: [EXO.Asset],
    properties: [],
    icon: '👤',
    color: '#06b6d4'
  };

  ontology.addClass(personClass);

  // IMS Properties
  const imsProperties: PropertyDefinition[] = [
    {
      iri: new IRI('https://exocortex.io/ontology/ims#source'),
      label: 'Source',
      comment: 'Source of the information',
      domain: [new IRI('https://exocortex.io/ontology/ims#Note')],
      range: DataType.String,
      required: false,
      multiple: false,
      order: 10
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ims#author'),
      label: 'Author',
      comment: 'Author of the content',
      domain: [new IRI('https://exocortex.io/ontology/ims#Note')],
      range: new IRI('https://exocortex.io/ontology/core#Person'),
      required: false,
      multiple: true,
      order: 11
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ims#relatedTo'),
      label: 'Related To',
      comment: 'Related knowledge objects',
      domain: [new IRI('https://exocortex.io/ontology/ims#Note'), new IRI('https://exocortex.io/ontology/ims#MOC')],
      range: EXO.Asset,
      required: false,
      multiple: true,
      order: 20
    },
    {
      iri: new IRI('https://exocortex.io/ontology/ims#contains'),
      label: 'Contains',
      comment: 'Content items in this map',
      domain: [new IRI('https://exocortex.io/ontology/ims#MOC')],
      range: EXO.Asset,
      required: false,
      multiple: true,
      order: 21
    },
    {
      iri: new IRI('https://exocortex.io/ontology/core#email'),
      label: 'Email',
      comment: 'Email address',
      domain: [new IRI('https://exocortex.io/ontology/core#Person')],
      range: DataType.String,
      required: false,
      multiple: true,
      order: 30
    },
    {
      iri: new IRI('https://exocortex.io/ontology/core#phone'),
      label: 'Phone',
      comment: 'Phone number',
      domain: [new IRI('https://exocortex.io/ontology/core#Person')],
      range: DataType.String,
      required: false,
      multiple: true,
      order: 31
    },
    {
      iri: new IRI('https://exocortex.io/ontology/core#organization'),
      label: 'Organization',
      comment: 'Associated organization',
      domain: [new IRI('https://exocortex.io/ontology/core#Person')],
      range: DataType.String,
      required: false,
      multiple: false,
      order: 32
    }
  ];

  for (const prop of imsProperties) {
    const result = ontology.addProperty(prop);
    if (result.isFailure) {
      return Result.fail(result.error);
    }
  }

  return Result.ok(ontology);
}

/**
 * OntologyManager - Manages all loaded ontologies
 */
export class OntologyManager {
  private ontologies: Map<string, Ontology> = new Map();

  constructor() {
    this.loadCoreOntologies();
  }

  /**
   * Load core ontologies
   */
  private loadCoreOntologies(): void {
    const coreResult = createExocortexCoreOntology();
    if (coreResult.isSuccess) {
      this.registerOntology(coreResult.getValue());
    }

    const emsResult = createEMSOntology();
    if (emsResult.isSuccess) {
      this.registerOntology(emsResult.getValue());
    }

    const imsResult = createIMSOntology();
    if (imsResult.isSuccess) {
      this.registerOntology(imsResult.getValue());
    }
  }

  /**
   * Register an ontology
   */
  registerOntology(ontology: Ontology): void {
    this.ontologies.set(ontology.prefix, ontology);
  }

  /**
   * Get an ontology by prefix
   */
  getOntology(prefix: string): Ontology | undefined {
    return this.ontologies.get(prefix);
  }

  /**
   * Get all registered ontologies
   */
  getAllOntologies(): Ontology[] {
    return Array.from(this.ontologies.values());
  }

  /**
   * Find class definition across all ontologies
   */
  findClass(iri: IRI | string): ClassDefinition | undefined {
    const key = typeof iri === 'string' ? iri : iri.toString();
    
    for (const ontology of this.ontologies.values()) {
      const classDef = ontology.getClass(key);
      if (classDef) return classDef;
    }
    
    return undefined;
  }

  /**
   * Find property definition across all ontologies
   */
  findProperty(iri: IRI | string): PropertyDefinition | undefined {
    const key = typeof iri === 'string' ? iri : iri.toString();
    
    for (const ontology of this.ontologies.values()) {
      const propDef = ontology.getProperty(key);
      if (propDef) return propDef;
    }
    
    return undefined;
  }

  /**
   * Get all properties for a class across all ontologies
   */
  getClassProperties(classIri: IRI): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    const seen = new Set<string>();
    
    for (const ontology of this.ontologies.values()) {
      const props = ontology.getClassProperties(classIri);
      for (const prop of props) {
        const key = prop.iri.toString();
        if (!seen.has(key)) {
          seen.add(key);
          properties.push(prop);
        }
      }
    }
    
    return properties.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }
}