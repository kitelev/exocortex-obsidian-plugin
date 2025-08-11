import { QueryTemplate, TemplateCategory, TemplateDifficulty, TemplateLayout } from '../../domain/visual/QueryTemplate';
import { NodeType } from '../../domain/visual/VisualQueryNode';
import { EdgeType } from '../../domain/visual/VisualQueryEdge';

export class BuiltInQueryTemplates {
    private static templates: QueryTemplate[] = [];
    
    static getAll(): QueryTemplate[] {
        if (this.templates.length === 0) {
            this.templates = this.createBuiltInTemplates();
        }
        return [...this.templates];
    }
    
    private static createBuiltInTemplates(): QueryTemplate[] {
        return [
            this.createFindAllRelatedTemplate(),
            this.createPropertyChainTemplate(),
            this.createTypeHierarchyTemplate(),
            this.createEntityPropertiesTemplate(),
            this.createOptionalPropertiesTemplate(),
            this.createFilterByValueTemplate(),
            this.createCountEntitiesTemplate(),
            this.createFindByLabelTemplate(),
            this.createRelationshipPathTemplate(),
            this.createValueComparisonTemplate()
        ];
    }
    
    private static createFindAllRelatedTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'entity1',
                    type: NodeType.ENTITY,
                    label: '{{entityName}}',
                    position: { x: 100, y: 200 },
                    uri: '{{entityUri}}'
                },
                {
                    id: 'var1',
                    type: NodeType.VARIABLE,
                    label: 'related',
                    position: { x: 400, y: 200 },
                    variableName: 'related'
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'entity1',
                    targetNodeId: 'var1',
                    type: EdgeType.PROPERTY,
                    label: '?property',
                    propertyUri: undefined
                }
            ],
            viewport: { x: 0, y: 0, zoom: 1 }
        };
        
        return new QueryTemplate({
            id: 'builtin_find_all_related',
            metadata: {
                name: 'Find All Related',
                description: 'Find all entities related to a specific entity',
                category: TemplateCategory.EXPLORATION,
                difficulty: TemplateDifficulty.BEGINNER,
                tags: ['exploration', 'relationships', 'basic'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'entityName',
                    type: 'entity',
                    description: 'Name of the entity to explore',
                    required: true,
                    placeholder: 'Entity name'
                },
                {
                    name: 'entityUri',
                    type: 'entity',
                    description: 'URI of the entity',
                    required: false,
                    placeholder: 'Optional entity URI'
                }
            ],
            sparqlTemplate: `SELECT ?property ?related
WHERE {
  <{{entityUri}}> ?property ?related .
}`,
            isBuiltIn: true
        });
    }
    
    private static createPropertyChainTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'start',
                    type: NodeType.VARIABLE,
                    label: 'start',
                    position: { x: 100, y: 200 },
                    variableName: 'start'
                },
                {
                    id: 'middle',
                    type: NodeType.VARIABLE,
                    label: 'middle',
                    position: { x: 300, y: 200 },
                    variableName: 'middle'
                },
                {
                    id: 'end',
                    type: NodeType.VARIABLE,
                    label: 'end',
                    position: { x: 500, y: 200 },
                    variableName: 'end'
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'start',
                    targetNodeId: 'middle',
                    type: EdgeType.PROPERTY,
                    label: '{{property1}}',
                    propertyUri: undefined
                },
                {
                    id: 'edge2',
                    sourceNodeId: 'middle',
                    targetNodeId: 'end',
                    type: EdgeType.PROPERTY,
                    label: '{{property2}}',
                    propertyUri: undefined
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_property_chain',
            metadata: {
                name: 'Property Chain',
                description: 'Follow a chain of properties between entities',
                category: TemplateCategory.RELATIONSHIP,
                difficulty: TemplateDifficulty.INTERMEDIATE,
                tags: ['path', 'chain', 'relationship'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'property1',
                    type: 'property',
                    description: 'First property in the chain',
                    required: true,
                    defaultValue: 'hasParent'
                },
                {
                    name: 'property2',
                    type: 'property',
                    description: 'Second property in the chain',
                    required: true,
                    defaultValue: 'hasChild'
                }
            ],
            sparqlTemplate: `SELECT ?start ?middle ?end
WHERE {
  ?start {{property1}} ?middle .
  ?middle {{property2}} ?end .
}`,
            isBuiltIn: true
        });
    }
    
    private static createTypeHierarchyTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'instance',
                    type: NodeType.VARIABLE,
                    label: 'instance',
                    position: { x: 100, y: 200 },
                    variableName: 'instance'
                },
                {
                    id: 'type',
                    type: NodeType.ENTITY,
                    label: '{{typeClass}}',
                    position: { x: 400, y: 200 }
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'instance',
                    targetNodeId: 'type',
                    type: EdgeType.PROPERTY,
                    label: 'rdf:type',
                    propertyUri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_type_hierarchy',
            metadata: {
                name: 'Type Hierarchy',
                description: 'Find all instances of a specific type or class',
                category: TemplateCategory.ANALYSIS,
                difficulty: TemplateDifficulty.BEGINNER,
                tags: ['type', 'class', 'hierarchy', 'rdf'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'typeClass',
                    type: 'entity',
                    description: 'The type/class to search for',
                    required: true,
                    defaultValue: 'Person'
                }
            ],
            sparqlTemplate: `SELECT ?instance
WHERE {
  ?instance rdf:type {{typeClass}} .
}`,
            isBuiltIn: true
        });
    }
    
    private static createEntityPropertiesTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'entity',
                    type: NodeType.ENTITY,
                    label: '{{entityName}}',
                    position: { x: 100, y: 200 }
                },
                {
                    id: 'value',
                    type: NodeType.VARIABLE,
                    label: 'value',
                    position: { x: 400, y: 200 },
                    variableName: 'value'
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'entity',
                    targetNodeId: 'value',
                    type: EdgeType.PROPERTY,
                    label: '?property',
                    propertyUri: undefined
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_entity_properties',
            metadata: {
                name: 'Entity Properties',
                description: 'List all properties and values of an entity',
                category: TemplateCategory.PROPERTY,
                difficulty: TemplateDifficulty.BEGINNER,
                tags: ['properties', 'attributes', 'exploration'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'entityName',
                    type: 'entity',
                    description: 'Entity to explore',
                    required: true
                }
            ],
            sparqlTemplate: `SELECT ?property ?value
WHERE {
  {{entityName}} ?property ?value .
}`,
            isBuiltIn: true
        });
    }
    
    private static createOptionalPropertiesTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'subject',
                    type: NodeType.VARIABLE,
                    label: 'subject',
                    position: { x: 100, y: 200 },
                    variableName: 'subject'
                },
                {
                    id: 'name',
                    type: NodeType.VARIABLE,
                    label: 'name',
                    position: { x: 400, y: 100 },
                    variableName: 'name'
                },
                {
                    id: 'description',
                    type: NodeType.VARIABLE,
                    label: 'description',
                    position: { x: 400, y: 300 },
                    variableName: 'description'
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'subject',
                    targetNodeId: 'name',
                    type: EdgeType.PROPERTY,
                    label: 'rdfs:label',
                    propertyUri: 'http://www.w3.org/2000/01/rdf-schema#label'
                },
                {
                    id: 'edge2',
                    sourceNodeId: 'subject',
                    targetNodeId: 'description',
                    type: EdgeType.OPTIONAL,
                    label: 'rdfs:comment',
                    propertyUri: 'http://www.w3.org/2000/01/rdf-schema#comment'
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_optional_properties',
            metadata: {
                name: 'Optional Properties',
                description: 'Query with optional properties that may or may not exist',
                category: TemplateCategory.PROPERTY,
                difficulty: TemplateDifficulty.INTERMEDIATE,
                tags: ['optional', 'properties', 'flexible'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [],
            sparqlTemplate: `SELECT ?subject ?name ?description
WHERE {
  ?subject rdfs:label ?name .
  OPTIONAL { ?subject rdfs:comment ?description }
}`,
            isBuiltIn: true
        });
    }
    
    private static createFilterByValueTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'entity',
                    type: NodeType.VARIABLE,
                    label: 'entity',
                    position: { x: 100, y: 200 },
                    variableName: 'entity'
                },
                {
                    id: 'value',
                    type: NodeType.VARIABLE,
                    label: 'value',
                    position: { x: 400, y: 200 },
                    variableName: 'value'
                },
                {
                    id: 'filter',
                    type: NodeType.FILTER,
                    label: '?value > {{threshold}}',
                    position: { x: 250, y: 350 }
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'entity',
                    targetNodeId: 'value',
                    type: EdgeType.PROPERTY,
                    label: '{{property}}',
                    propertyUri: undefined
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_filter_by_value',
            metadata: {
                name: 'Filter by Value',
                description: 'Find entities with property values matching a condition',
                category: TemplateCategory.ANALYSIS,
                difficulty: TemplateDifficulty.INTERMEDIATE,
                tags: ['filter', 'condition', 'comparison'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'property',
                    type: 'property',
                    description: 'Property to filter on',
                    required: true,
                    defaultValue: 'hasAge'
                },
                {
                    name: 'threshold',
                    type: 'literal',
                    description: 'Threshold value',
                    required: true,
                    defaultValue: '18',
                    constraints: {
                        pattern: '^\\d+$'
                    }
                }
            ],
            sparqlTemplate: `SELECT ?entity ?value
WHERE {
  ?entity {{property}} ?value .
  FILTER (?value > {{threshold}})
}`,
            isBuiltIn: true
        });
    }
    
    private static createCountEntitiesTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'entity',
                    type: NodeType.VARIABLE,
                    label: 'entity',
                    position: { x: 100, y: 200 },
                    variableName: 'entity'
                },
                {
                    id: 'type',
                    type: NodeType.ENTITY,
                    label: '{{entityType}}',
                    position: { x: 400, y: 200 }
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'entity',
                    targetNodeId: 'type',
                    type: EdgeType.PROPERTY,
                    label: 'rdf:type',
                    propertyUri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_count_entities',
            metadata: {
                name: 'Count Entities',
                description: 'Count the number of entities of a specific type',
                category: TemplateCategory.ANALYSIS,
                difficulty: TemplateDifficulty.BEGINNER,
                tags: ['count', 'aggregate', 'statistics'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'entityType',
                    type: 'entity',
                    description: 'Type of entities to count',
                    required: true,
                    defaultValue: 'Person'
                }
            ],
            sparqlTemplate: `SELECT (COUNT(?entity) AS ?count)
WHERE {
  ?entity rdf:type {{entityType}} .
}`,
            isBuiltIn: true
        });
    }
    
    private static createFindByLabelTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'entity',
                    type: NodeType.VARIABLE,
                    label: 'entity',
                    position: { x: 100, y: 200 },
                    variableName: 'entity'
                },
                {
                    id: 'label',
                    type: NodeType.VARIABLE,
                    label: 'label',
                    position: { x: 400, y: 200 },
                    variableName: 'label'
                },
                {
                    id: 'filter',
                    type: NodeType.FILTER,
                    label: 'regex(?label, "{{searchTerm}}", "i")',
                    position: { x: 250, y: 350 }
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'entity',
                    targetNodeId: 'label',
                    type: EdgeType.PROPERTY,
                    label: 'rdfs:label',
                    propertyUri: 'http://www.w3.org/2000/01/rdf-schema#label'
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_find_by_label',
            metadata: {
                name: 'Find by Label',
                description: 'Search for entities by their label text',
                category: TemplateCategory.EXPLORATION,
                difficulty: TemplateDifficulty.INTERMEDIATE,
                tags: ['search', 'text', 'label', 'regex'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'searchTerm',
                    type: 'literal',
                    description: 'Text to search for in labels',
                    required: true,
                    placeholder: 'Search term'
                }
            ],
            sparqlTemplate: `SELECT ?entity ?label
WHERE {
  ?entity rdfs:label ?label .
  FILTER (regex(?label, "{{searchTerm}}", "i"))
}`,
            isBuiltIn: true
        });
    }
    
    private static createRelationshipPathTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'source',
                    type: NodeType.ENTITY,
                    label: '{{sourceEntity}}',
                    position: { x: 100, y: 200 }
                },
                {
                    id: 'target',
                    type: NodeType.ENTITY,
                    label: '{{targetEntity}}',
                    position: { x: 500, y: 200 }
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'source',
                    targetNodeId: 'target',
                    type: EdgeType.PROPERTY,
                    label: '{{relationship}}+',
                    propertyUri: undefined
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_relationship_path',
            metadata: {
                name: 'Relationship Path',
                description: 'Find paths between two specific entities',
                category: TemplateCategory.RELATIONSHIP,
                difficulty: TemplateDifficulty.ADVANCED,
                tags: ['path', 'connection', 'graph', 'traversal'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'sourceEntity',
                    type: 'entity',
                    description: 'Starting entity',
                    required: true
                },
                {
                    name: 'targetEntity',
                    type: 'entity',
                    description: 'Target entity',
                    required: true
                },
                {
                    name: 'relationship',
                    type: 'property',
                    description: 'Relationship type to follow',
                    required: false,
                    defaultValue: 'knows'
                }
            ],
            sparqlTemplate: `SELECT ?path
WHERE {
  {{sourceEntity}} {{relationship}}+ {{targetEntity}} .
  BIND({{relationship}} AS ?path)
}`,
            isBuiltIn: true
        });
    }
    
    private static createValueComparisonTemplate(): QueryTemplate {
        const layout: TemplateLayout = {
            nodes: [
                {
                    id: 'entity',
                    type: NodeType.VARIABLE,
                    label: 'entity',
                    position: { x: 250, y: 100 },
                    variableName: 'entity'
                },
                {
                    id: 'value1',
                    type: NodeType.VARIABLE,
                    label: 'value1',
                    position: { x: 100, y: 250 },
                    variableName: 'value1'
                },
                {
                    id: 'value2',
                    type: NodeType.VARIABLE,
                    label: 'value2',
                    position: { x: 400, y: 250 },
                    variableName: 'value2'
                },
                {
                    id: 'filter',
                    type: NodeType.FILTER,
                    label: '?value1 > ?value2',
                    position: { x: 250, y: 400 }
                }
            ],
            edges: [
                {
                    id: 'edge1',
                    sourceNodeId: 'entity',
                    targetNodeId: 'value1',
                    type: EdgeType.PROPERTY,
                    label: '{{property1}}',
                    propertyUri: undefined
                },
                {
                    id: 'edge2',
                    sourceNodeId: 'entity',
                    targetNodeId: 'value2',
                    type: EdgeType.PROPERTY,
                    label: '{{property2}}',
                    propertyUri: undefined
                }
            ]
        };
        
        return new QueryTemplate({
            id: 'builtin_value_comparison',
            metadata: {
                name: 'Value Comparison',
                description: 'Compare values of different properties on the same entity',
                category: TemplateCategory.ANALYSIS,
                difficulty: TemplateDifficulty.ADVANCED,
                tags: ['comparison', 'analysis', 'filter'],
                author: 'Exocortex',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            layout,
            parameters: [
                {
                    name: 'property1',
                    type: 'property',
                    description: 'First property to compare',
                    required: true,
                    defaultValue: 'hasIncome'
                },
                {
                    name: 'property2',
                    type: 'property',
                    description: 'Second property to compare',
                    required: true,
                    defaultValue: 'hasExpenses'
                }
            ],
            sparqlTemplate: `SELECT ?entity ?value1 ?value2
WHERE {
  ?entity {{property1}} ?value1 .
  ?entity {{property2}} ?value2 .
  FILTER (?value1 > ?value2)
}`,
            isBuiltIn: true
        });
    }
}