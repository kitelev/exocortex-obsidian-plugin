@owl @ontology @semantic-modeling
Feature: OWL Ontology Management
  As a knowledge engineer
  I want to manage OWL ontologies within the knowledge graph
  So that I can define structured vocabularies and enable reasoning

  Background:
    Given the OWL ontology manager is initialized
    And the RDF graph supports OWL constructs
    And standard OWL vocabulary is available:
      | prefix | namespace                         |
      | owl    | http://www.w3.org/2002/07/owl#    |
      | rdfs   | http://www.w3.org/2000/01/rdf-schema# |
      | rdf    | http://www.w3.org/1999/02/22-rdf-syntax-ns# |
      | xsd    | http://www.w3.org/2001/XMLSchema# |
    And Exocortex ontology namespace is configured:
      | prefix | namespace                           |
      | exo    | https://exocortex.io/ontology/core# |
      | ems    | https://exocortex.io/ontology/ems#  |

  @smoke @ontology-creation
  Scenario: Create a new OWL ontology
    When I create a new OWL ontology with IRI "https://example.org/myontology"
    Then the ontology should be created successfully
    And the ontology should have the correct IRI
    And the ontology should be registered in the system
    And the ontology should be queryable via SPARQL

  @class-definition @basic-modeling
  Scenario: Define OWL classes with hierarchy
    Given I have an empty ontology "https://example.org/projectontology"
    When I define the following OWL classes:
      | class              | subClassOf         |
      | exo:WorkItem       |                    |
      | exo:Project        | exo:WorkItem       |
      | exo:Task           | exo:WorkItem       |
      | exo:Epic           | exo:WorkItem       |
      | exo:Story          | exo:Task           |
      | exo:Bug            | exo:Task           |
    Then all classes should be defined correctly
    And the class hierarchy should be established
    And I should be able to query the class hierarchy
    And subclass relationships should be inferrable

  @property-definition @object-properties
  Scenario: Define OWL object properties with characteristics
    Given I have an ontology with defined classes
    When I define the following object properties:
      | property        | domain      | range       | characteristics           |
      | exo:hasTask     | exo:Project | exo:Task    | functional                |
      | exo:assignedTo  | exo:Task    | exo:Person  | functional                |
      | exo:dependsOn   | exo:Task    | exo:Task    | transitive               |
      | exo:sameAs      | exo:WorkItem| exo:WorkItem| symmetric, transitive    |
    Then all object properties should be defined
    And domain and range restrictions should be enforced
    And property characteristics should be recorded
    And I should be able to query property definitions

  @property-definition @datatype-properties
  Scenario: Define OWL datatype properties with restrictions
    Given I have an ontology with defined classes
    When I define the following datatype properties:
      | property         | domain      | range           | restrictions              |
      | exo:priority     | exo:WorkItem| xsd:integer     | minInclusive=1, maxInclusive=5 |
      | exo:title        | exo:WorkItem| xsd:string      | maxLength=200             |
      | exo:createdDate  | exo:WorkItem| xsd:dateTime    |                           |
      | exo:isCompleted  | exo:Task    | xsd:boolean     |                           |
      | exo:estimatedHours| exo:Task   | xsd:decimal     | minInclusive=0           |
    Then all datatype properties should be defined
    And datatype restrictions should be enforced
    And I should be able to validate data against restrictions

  @class-restrictions @complex-modeling
  Scenario: Define classes with complex OWL restrictions
    Given I have an ontology with basic classes and properties
    When I define a class with complex restrictions:
      """
      exo:HighPriorityProject rdf:type owl:Class ;
        rdfs:subClassOf exo:Project ;
        rdfs:subClassOf [
          rdf:type owl:Restriction ;
          owl:onProperty exo:priority ;
          owl:hasValue 5
        ] ;
        rdfs:subClassOf [
          rdf:type owl:Restriction ;
          owl:onProperty exo:hasTask ;
          owl:minCardinality 1
        ] .
      """
    Then the complex class should be defined correctly
    And the value restriction should be enforced
    And the cardinality restriction should be enforced
    And instances should satisfy all restrictions

  @equivalence-classes @logical-modeling
  Scenario: Define equivalent and disjoint classes
    Given I have basic classes defined
    When I define equivalence relationships:
      | class1          | relationship | class2           |
      | exo:Task        | equivalentTo | exo:WorkUnit     |
      | exo:Bug         | disjointWith | exo:Story        |
      | exo:Epic        | disjointWith | exo:Task         |
    Then the equivalence relationships should be established
    And the disjoint relationships should be enforced
    And reasoning should respect these relationships
    And inconsistencies should be detected

  @property-chains @advanced-modeling
  Scenario: Define property chains for complex relationships
    Given I have properties defined for project management
    When I define a property chain:
      """
      exo:indirectlyAssignedTo rdf:type owl:ObjectProperty ;
        owl:propertyChainAxiom ( exo:hasTask exo:assignedTo ) .
      """
    Then the property chain should be defined
    And I should be able to infer indirect assignments
    When a project has a task assigned to a person
    Then the project should be indirectly assigned to that person
    And this should be inferrable through the property chain

  @validation @consistency-checking
  Scenario: Validate ontology consistency
    Given I have a complex ontology with multiple constraints
    When I add potentially inconsistent data:
      | subject    | predicate      | object           |
      | exo:Item1  | rdf:type       | exo:Bug          |
      | exo:Item1  | rdf:type       | exo:Story        |
      | exo:Task1  | exo:priority   | 6                |
      | exo:Project1| exo:title     | "Very long title that exceeds 200 characters..." |
    Then the ontology validator should detect inconsistencies
    And violations should be reported with specific error messages
    And the inconsistent data should be rejected or flagged

  @reasoning @entailment
  Scenario: Perform reasoning and derive new knowledge
    Given I have an ontology with inference rules
    And the following base facts:
      | subject      | predicate     | object        |
      | exo:Project1 | exo:hasTask   | exo:Task1     |
      | exo:Task1    | exo:dependsOn | exo:Task2     |
      | exo:Task2    | exo:dependsOn | exo:Task3     |
      | exo:Task1    | exo:assignedTo| exo:Person1   |
    When I run the reasoner
    Then new facts should be inferred:
      | subject      | predicate             | object      | reason                    |
      | exo:Project1 | exo:indirectlyAssignedTo | exo:Person1| property chain           |
      | exo:Task1    | exo:dependsOn         | exo:Task3   | transitivity             |
    And the inferred knowledge should be queryable

  @ontology-import @modular-design
  Scenario: Import and reuse existing ontologies
    Given I have a base ontology "https://example.org/core"
    When I create a new ontology that imports the base ontology:
      """
      @prefix : <https://example.org/extended#> .
      @prefix core: <https://example.org/core#> .
      
      : rdf:type owl:Ontology ;
        owl:imports <https://example.org/core> .
      
      :ExtendedProject rdfs:subClassOf core:Project .
      """
    Then the import should succeed
    And all classes from the base ontology should be available
    And I should be able to extend imported classes
    And the import hierarchy should be maintained

  @versioning @ontology-evolution
  Scenario: Manage ontology versions and evolution
    Given I have an ontology version 1.0
    When I create version 2.0 with backwards-compatible changes:
      | change_type      | element         | modification          |
      | add_class        | exo:Milestone   | new subclass of exo:WorkItem |
      | add_property     | exo:deadline    | new datatype property |
      | extend_domain    | exo:priority    | add exo:Milestone to domain |
    Then the new version should be created successfully
    And backwards compatibility should be maintained
    And existing data should remain valid
    And version information should be tracked

  @namespace-management @vocabulary-organization
  Scenario: Manage ontology namespaces and prefixes
    Given I have multiple ontology modules
    When I define namespace mappings:
      | prefix | namespace                                |
      | proj   | https://example.org/project-ontology#    |
      | task   | https://example.org/task-ontology#       |
      | person | https://example.org/person-ontology#     |
    Then all prefixes should be registered
    And I should be able to use short names in queries
    And namespace conflicts should be detected and resolved
    And prefix-to-namespace mappings should be persistent

  @annotation-properties @documentation
  Scenario: Add annotations and documentation to ontology elements
    Given I have defined ontology classes and properties
    When I add annotations to ontology elements:
      | element         | annotation_property | annotation_value                    |
      | exo:Project     | rdfs:label         | "Project"@en                        |
      | exo:Project     | rdfs:comment       | "A collection of related tasks"@en  |
      | exo:hasTask     | rdfs:label         | "has task"@en                       |
      | exo:priority    | rdfs:comment       | "Priority level from 1 to 5"@en    |
    Then all annotations should be stored
    And annotations should be queryable
    And multilingual annotations should be supported
    And documentation should be accessible

  @individuals @instance-management
  Scenario: Define and manage OWL individuals (instances)
    Given I have defined ontology classes
    When I create individuals of these classes:
      | individual      | class           | properties                              |
      | exo:WebProject  | exo:Project     | exo:title="Web Application", exo:priority=5 |
      | exo:UITask      | exo:Task        | exo:title="UI Design", exo:priority=3   |
      | exo:Alice       | exo:Person      | exo:name="Alice Smith"                  |
    Then all individuals should be created
    And class membership should be established
    And property values should be assigned correctly
    And I should be able to query individuals

  @same-different-individuals @identity-reasoning
  Scenario: Define identity relationships between individuals
    Given I have defined individuals
    When I specify identity relationships:
      | individual1    | relationship | individual2      |
      | exo:Alice      | owl:sameAs   | exo:AliceSmith   |
      | exo:Bob        | owl:differentFrom | exo:Charlie |
    Then identity relationships should be established
    And reasoning should merge information for same individuals
    And different individuals should be kept distinct
    And queries should respect identity relationships

  @closed-world @open-world-reasoning
  Scenario: Handle closed-world vs open-world reasoning
    Given I have an ontology with complete information about some domains
    When I specify closed-world assumptions for specific properties:
      """
      exo:Project rdfs:subClassOf [
        rdf:type owl:Restriction ;
        owl:onProperty exo:hasTask ;
        owl:allValuesFrom exo:Task
      ] .
      """
    Then closed-world reasoning should apply to specified areas
    And open-world reasoning should apply elsewhere
    And the reasoner should handle both paradigms correctly

  @performance @large-ontologies
  Scenario: Handle large ontologies efficiently
    Given I create an ontology with 10000 classes
    And 50000 property definitions
    And complex class hierarchies
    When I perform reasoning operations
    Then the ontology should load within 5 seconds
    And basic queries should complete within 100ms
    And reasoning should complete within 30 seconds
    And memory usage should remain reasonable

  @export-import @interoperability
  Scenario: Export and import ontologies in standard formats
    Given I have a complete OWL ontology
    When I export the ontology to different formats:
      | format    | expected_output                           |
      | RDF/XML   | valid RDF/XML with OWL constructs         |
      | Turtle    | valid Turtle with readable structure      |
      | OWL/XML   | native OWL XML format                     |
      | JSON-LD   | JSON-LD with OWL context                  |
    Then all exports should be valid in their respective formats
    And exported ontologies should be importable by other tools
    When I import the exported ontologies
    Then the imported ontologies should be identical to the original

  @integration-obsidian @vault-integration
  Scenario: Integrate ontology with Obsidian vault structure
    Given I have an Obsidian vault with structured notes
    When I extract ontology from vault structure:
      | note_type      | maps_to_class | properties_from           |
      | Project notes  | exo:Project   | frontmatter fields        |
      | Task notes     | exo:Task      | frontmatter + content     |
      | Person notes   | exo:Person    | frontmatter + links       |
    Then the ontology should reflect vault structure
    And note relationships should become object properties
    And note properties should become datatype properties
    And the ontology should be queryable for vault insights

  @schema-validation @data-quality
  Scenario: Validate vault data against ontology schema
    Given I have defined a comprehensive ontology for my domain
    When I validate existing vault notes against the ontology
    Then schema violations should be identified
    And missing required properties should be reported
    And invalid property values should be flagged
    And suggestions for fixes should be provided
    And valid notes should be confirmed as compliant