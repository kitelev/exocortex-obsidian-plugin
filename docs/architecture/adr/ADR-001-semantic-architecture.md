# ADR-001: Adopt Semantic Web Technologies for Core Architecture

## Status
Accepted

## Context
The Exocortex plugin currently uses a file-based approach with frontmatter properties for metadata management. While functional, this approach has limitations:

1. **Limited Querying**: Cannot perform complex queries across relationships
2. **No Inference**: Cannot derive new knowledge from existing data
3. **Weak Typing**: Properties are loosely typed strings
4. **No Validation**: No formal schema validation
5. **Poor Interoperability**: Difficult to share knowledge between systems

The vision for Exocortex as a "cognitive prosthesis" requires more sophisticated knowledge representation and reasoning capabilities.

## Decision
We will adopt Semantic Web technologies (RDF/OWL/SPARQL/SHACL) as the core data model and query language for the Exocortex plugin.

### Specific Technologies:
- **RDF** (Resource Description Framework) for data representation
- **OWL** (Web Ontology Language) for ontology definition
- **SPARQL 1.1** for querying and updates
- **SHACL** (Shapes Constraint Language) for validation
- **Turtle/JSON-LD** for serialization

## Consequences

### Positive
1. **Rich Querying**: SPARQL enables complex graph queries with reasoning
2. **Formal Semantics**: OWL provides formal meaning to concepts
3. **Validation**: SHACL ensures data integrity
4. **Interoperability**: RDF is a W3C standard with wide tool support
5. **Extensibility**: New ontologies can be added without code changes
6. **Inference**: Can derive new facts from existing knowledge
7. **Temporal Reasoning**: Can track how knowledge evolves over time

### Negative
1. **Learning Curve**: Developers need to learn semantic technologies
2. **Complexity**: RDF/OWL can be complex for simple use cases
3. **Performance**: Triple stores can be slower than key-value stores
4. **Tooling**: Limited TypeScript libraries for semantic web
5. **File Size**: RDF serializations can be verbose

### Mitigation Strategies
1. **Progressive Disclosure**: Hide complexity behind simple APIs
2. **Caching Layer**: Use IndexedDB for performance-critical queries
3. **Hybrid Approach**: Keep markdown files, generate RDF on-demand
4. **Code Generation**: Generate TypeScript types from ontologies
5. **Documentation**: Comprehensive guides and examples

## Implementation Plan

### Phase 1: Foundation
```typescript
// Core RDF model
interface Triple {
  subject: IRI | BlankNode;
  predicate: IRI;
  object: IRI | BlankNode | Literal;
}

// Knowledge Object with RDF backing
class KnowledgeObject {
  private graph: Graph;
  
  constructor(public uuid: UUID, public type: IRI) {
    this.graph = new Graph();
    this.addTriple(this.uuid, RDF.type, this.type);
  }
  
  setProperty(predicate: IRI, value: any): void {
    this.graph.add(this.uuid, predicate, value);
  }
  
  query(sparql: string): ResultSet {
    return this.graph.query(sparql);
  }
}
```

### Phase 2: Ontology Integration
```typescript
// Ontology-driven UI generation
class OntologyDrivenUI {
  renderForm(classIRI: IRI): FormDefinition {
    const shape = this.getSHACLShape(classIRI);
    return this.shapeToForm(shape);
  }
  
  validate(object: KnowledgeObject): ValidationReport {
    return SHACL.validate(object.graph, this.shapes);
  }
}
```

### Phase 3: Advanced Features
```typescript
// Reasoning and inference
class ReasoningEngine {
  async infer(graph: Graph): Promise<Graph> {
    const reasoner = new OWLReasoner(this.ontology);
    return reasoner.materialize(graph);
  }
  
  async explain(fact: Triple): Promise<ProofTree> {
    return this.reasoner.explain(fact);
  }
}
```

## References
- [W3C RDF Primer](https://www.w3.org/TR/rdf-primer/)
- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [OWL 2 Web Ontology Language](https://www.w3.org/TR/owl2-overview/)
- [SHACL Specification](https://www.w3.org/TR/shacl/)
- [RDF.js Specification](http://rdf.js.org/)

## Related ADRs
- ADR-002: Privacy-First Architecture with UUID Exposure
- ADR-003: CQRS Pattern for Read/Write Separation
- ADR-004: Event Sourcing for Temporal Reasoning