@semantic @reasoning @inference @knowledge-derivation
Feature: Semantic Reasoning and Inference Engine
  As a knowledge worker
  I want automated reasoning and inference capabilities
  So that I can discover implicit knowledge and maintain consistency in my knowledge graph

  Background:
    Given the semantic reasoning engine is initialized
    And the inference system supports multiple reasoning paradigms
    And the knowledge graph contains base facts
    And standard ontological vocabularies are loaded:
      | vocabulary | namespace                               |
      | RDFS       | http://www.w3.org/2000/01/rdf-schema#   |
      | OWL        | http://www.w3.org/2002/07/owl#          |
      | SKOS       | http://www.w3.org/2004/02/skos/core#    |
    And domain-specific ontologies are configured:
      | prefix | namespace                           |
      | exo    | https://exocortex.io/ontology/core# |
      | ems    | https://exocortex.io/ontology/ems#  |

  @smoke @basic-reasoning
  Scenario: Basic RDFS reasoning with class hierarchy
    Given the ontology defines class hierarchies:
      | subclass       | superclass     |
      | ems:Task       | exo:WorkItem   |
      | ems:Bug        | ems:Task       |
      | ems:Story      | ems:Task       |
      | ems:Epic       | exo:WorkItem   |
    And the knowledge base contains facts:
      | subject    | predicate | object     |
      | exo:Item1  | rdf:type  | ems:Bug    |
      | exo:Item2  | rdf:type  | ems:Story  |
    When I run RDFS reasoning
    Then the reasoner should infer new facts:
      | inferred_subject | inferred_predicate | inferred_object | reasoning_rule        |
      | exo:Item1        | rdf:type           | ems:Task        | rdfs:subClassOf      |
      | exo:Item1        | rdf:type           | exo:WorkItem    | rdfs:subClassOf      |
      | exo:Item2        | rdf:type           | ems:Task        | rdfs:subClassOf      |
      | exo:Item2        | rdf:type           | exo:WorkItem    | rdfs:subClassOf      |

  @property-reasoning @domain-range-inference
  Scenario: Property domain and range reasoning
    Given the ontology defines property constraints:
      | property       | domain        | range         |
      | ems:assignedTo | ems:Task      | exo:Person    |
      | ems:hasTask    | ems:Project   | ems:Task      |
      | exo:memberOf   | exo:Person    | exo:Team      |
    And the knowledge base contains facts:
      | subject     | predicate      | object        |
      | exo:Item1   | ems:assignedTo | exo:Alice     |
      | exo:Project1| ems:hasTask    | exo:TaskX     |
      | exo:Bob     | exo:memberOf   | exo:DevTeam   |
    When I run property reasoning
    Then the reasoner should infer type information:
      | inferred_subject | inferred_predicate | inferred_object | reasoning_rule    |
      | exo:Item1        | rdf:type           | ems:Task        | property domain   |
      | exo:Alice        | rdf:type           | exo:Person      | property range    |
      | exo:Project1     | rdf:type           | ems:Project     | property domain   |
      | exo:TaskX        | rdf:type           | ems:Task        | property range    |
      | exo:Bob          | rdf:type           | exo:Person      | property domain   |
      | exo:DevTeam      | rdf:type           | exo:Team        | property range    |

  @transitive-reasoning @relationship-chains
  Scenario: Transitive property reasoning
    Given the ontology defines transitive properties:
      | property        | characteristics |
      | ems:dependsOn   | transitive      |
      | exo:subAreaOf   | transitive      |
      | ems:reportedBy  | transitive      |
    And the knowledge base contains dependency chains:
      | subject    | predicate     | object     |
      | exo:TaskA  | ems:dependsOn | exo:TaskB  |
      | exo:TaskB  | ems:dependsOn | exo:TaskC  |
      | exo:TaskC  | ems:dependsOn | exo:TaskD  |
      | exo:Area1  | exo:subAreaOf | exo:Area2  |
      | exo:Area2  | exo:subAreaOf | exo:Area3  |
    When I run transitive reasoning
    Then the reasoner should infer transitive closures:
      | inferred_subject | inferred_predicate | inferred_object | chain_length |
      | exo:TaskA        | ems:dependsOn      | exo:TaskC       | 2            |
      | exo:TaskA        | ems:dependsOn      | exo:TaskD       | 3            |
      | exo:TaskB        | ems:dependsOn      | exo:TaskD       | 2            |
      | exo:Area1        | exo:subAreaOf      | exo:Area3       | 2            |

  @symmetric-reasoning @bidirectional-relationships
  Scenario: Symmetric property reasoning
    Given the ontology defines symmetric properties:
      | property          | characteristics |
      | exo:collaboratesWith | symmetric    |
      | ems:relatedTo     | symmetric       |
      | exo:connectedTo   | symmetric       |
    And the knowledge base contains relationships:
      | subject     | predicate              | object      |
      | exo:Alice   | exo:collaboratesWith   | exo:Bob     |
      | exo:Task1   | ems:relatedTo          | exo:Task2   |
      | exo:Project1| exo:connectedTo        | exo:Project2|
    When I run symmetric reasoning
    Then the reasoner should infer reverse relationships:
      | inferred_subject | inferred_predicate     | inferred_object | reasoning_rule |
      | exo:Bob          | exo:collaboratesWith   | exo:Alice       | symmetry       |
      | exo:Task2        | ems:relatedTo          | exo:Task1       | symmetry       |
      | exo:Project2     | exo:connectedTo        | exo:Project1    | symmetry       |

  @functional-property-reasoning @uniqueness-constraints
  Scenario: Functional property reasoning and constraint checking
    Given the ontology defines functional properties:
      | property           | characteristics | constraint_type |
      | exo:hasManager     | functional      | single_value    |
      | ems:primarySkill   | functional      | unique_primary  |
      | exo:dateOfBirth    | functional      | immutable       |
    And the knowledge base contains data:
      | subject    | predicate        | object          |
      | exo:Alice  | exo:hasManager   | exo:Manager1    |
      | exo:Alice  | exo:hasManager   | exo:Manager2    |
      | exo:Bob    | ems:primarySkill | "Java"          |
      | exo:Bob    | ems:primarySkill | "Python"        |
    When I run functional property reasoning
    Then the reasoner should detect constraint violations
    And the system should report inconsistencies:
      | subject   | property         | violation_type     | conflicting_values         |
      | exo:Alice | exo:hasManager   | multiple_values    | exo:Manager1, exo:Manager2 |
      | exo:Bob   | ems:primarySkill | functional_conflict| "Java", "Python"           |

  @inverse-property-reasoning @bidirectional-inference
  Scenario: Inverse property reasoning
    Given the ontology defines inverse properties:
      | property1        | inverse_of       | property2        |
      | ems:hasTask      | ems:belongsTo    | ems:belongsTo    |
      | exo:manages      | exo:managedBy    | exo:managedBy    |
      | ems:assignedTo   | ems:hasAssignee  | ems:hasAssignee  |
    And the knowledge base contains relationships:
      | subject      | predicate     | object       |
      | exo:Project1 | ems:hasTask   | exo:Task1    |
      | exo:Manager1 | exo:manages   | exo:Alice    |
      | exo:Task2    | ems:assignedTo| exo:Bob      |
    When I run inverse property reasoning
    Then the reasoner should infer inverse relationships:
      | inferred_subject | inferred_predicate | inferred_object | reasoning_rule   |
      | exo:Task1        | ems:belongsTo      | exo:Project1    | inverse_property |
      | exo:Alice        | exo:managedBy      | exo:Manager1    | inverse_property |
      | exo:Bob          | ems:hasAssignee    | exo:Task2       | inverse_property |

  @equivalent-class-reasoning @semantic-equivalence
  Scenario: Equivalent class reasoning and knowledge merging
    Given the ontology defines equivalent classes:
      | class1           | equivalent_to    | class2           |
      | ems:Task         | exo:WorkUnit     | exo:WorkUnit     |
      | ems:Developer    | exo:Programmer   | exo:Programmer   |
      | ems:Requirement  | exo:Specification| exo:Specification|
    And the knowledge base contains instances:
      | subject    | predicate | object        |
      | exo:Item1  | rdf:type  | ems:Task      |
      | exo:Person1| rdf:type  | ems:Developer |
      | exo:Req1   | rdf:type  | ems:Requirement|
    When I run equivalence reasoning
    Then the reasoner should infer equivalent types:
      | inferred_subject | inferred_predicate | inferred_object    | reasoning_rule      |
      | exo:Item1        | rdf:type           | exo:WorkUnit       | equivalent_class    |
      | exo:Person1      | rdf:type           | exo:Programmer     | equivalent_class    |
      | exo:Req1         | rdf:type           | exo:Specification  | equivalent_class    |

  @cardinality-reasoning @constraint-validation
  Scenario: Cardinality constraint reasoning
    Given the ontology defines cardinality constraints:
      | class            | property         | constraint_type | value |
      | ems:Project      | ems:hasManager   | exactly         | 1     |
      | ems:Task         | ems:assignedTo   | max             | 1     |
      | exo:Team         | exo:hasMember    | min             | 3     |
      | ems:Sprint       | ems:hasTask      | min             | 1     |
    And the knowledge base contains instances:
      | subject      | predicate      | object       |
      | exo:Proj1    | rdf:type       | ems:Project  |
      | exo:Proj1    | ems:hasManager | exo:Alice    |
      | exo:Proj1    | ems:hasManager | exo:Bob      |
      | exo:Team1    | rdf:type       | exo:Team     |
      | exo:Team1    | exo:hasMember  | exo:Person1  |
      | exo:Team1    | exo:hasMember  | exo:Person2  |
    When I run cardinality reasoning
    Then the reasoner should detect cardinality violations:
      | subject   | constraint_type | property       | current_count | expected    | status     |
      | exo:Proj1 | exactly         | ems:hasManager | 2            | exactly 1   | violation  |
      | exo:Team1 | min             | exo:hasMember  | 2            | min 3       | violation  |

  @disjoint-class-reasoning @consistency-checking
  Scenario: Disjoint class reasoning and inconsistency detection
    Given the ontology defines disjoint classes:
      | class1        | disjoint_with | class2        |
      | ems:Bug       | ems:Feature   | ems:Feature   |
      | exo:Person    | exo:Software  | exo:Software  |
      | ems:Active    | ems:Completed | ems:Completed |
    And the knowledge base contains potentially inconsistent data:
      | subject    | predicate | object        |
      | exo:Item1  | rdf:type  | ems:Bug       |
      | exo:Item1  | rdf:type  | ems:Feature   |
      | exo:Entity1| rdf:type  | exo:Person    |
      | exo:Entity1| rdf:type  | exo:Software  |
    When I run consistency checking
    Then the reasoner should detect disjointness violations:
      | subject     | conflicting_types        | violation_type | severity |
      | exo:Item1   | ems:Bug, ems:Feature     | disjoint_class | error    |
      | exo:Entity1 | exo:Person, exo:Software | disjoint_class | error    |

  @property-chain-reasoning @complex-inference
  Scenario: Property chain reasoning for complex relationships
    Given the ontology defines property chains:
      | derived_property     | property_chain                          |
      | ems:indirectlyAssignedTo | ems:hasTask o ems:assignedTo        |
      | exo:teamMateOf       | exo:memberOf o exo:hasMember           |
      | ems:projectColleague | ems:worksOnProject o ems:hasTeamMember |
    And the knowledge base contains chain components:
      | subject      | predicate        | object        |
      | exo:Project1 | ems:hasTask      | exo:Task1     |
      | exo:Task1    | ems:assignedTo   | exo:Alice     |
      | exo:Bob      | exo:memberOf     | exo:DevTeam   |
      | exo:DevTeam  | exo:hasMember    | exo:Charlie   |
    When I run property chain reasoning
    Then the reasoner should infer derived relationships:
      | inferred_subject | inferred_predicate        | inferred_object | property_chain_applied           |
      | exo:Project1     | ems:indirectlyAssignedTo  | exo:Alice      | ems:hasTask o ems:assignedTo     |
      | exo:Bob          | exo:teamMateOf            | exo:Charlie    | exo:memberOf o exo:hasMember     |

  @closed-world-reasoning @completeness-assumptions
  Scenario: Closed-world reasoning for specific domains
    Given certain domains are marked as complete with closed-world assumptions:
      | domain_class    | complete_properties     | assumption_type |
      | ems:Task        | ems:assignedTo          | closed_world    |
      | exo:Team        | exo:hasMember          | closed_world    |
    And the knowledge base contains complete information:
      | subject    | predicate      | object      |
      | exo:Task1  | ems:assignedTo | exo:Alice   |
      | exo:Task2  | ems:assignedTo | exo:Bob     |
      | exo:Team1  | exo:hasMember  | exo:Person1 |
      | exo:Team1  | exo:hasMember  | exo:Person2 |
    When I query for unassigned tasks or team non-members
    Then the reasoner should apply closed-world assumptions
    And infer negative facts based on completeness:
      | negative_subject | negative_predicate | negative_object | reasoning_type |
      | exo:Task3        | ems:assignedTo     | exo:Anyone      | closed_world   |
      | exo:Person3      | exo:memberOf       | exo:Team1       | closed_world   |

  @temporal-reasoning @time-based-inference
  Scenario: Temporal reasoning with time-sensitive relationships
    Given the ontology supports temporal properties:
      | property           | temporal_nature | constraint_type     |
      | exo:validFrom      | start_time      | temporal_validity   |
      | exo:validTo        | end_time        | temporal_validity   |
      | ems:completedOn    | instant         | completion_time     |
      | ems:scheduledFor   | interval        | scheduling_window   |
    And the knowledge base contains temporal facts:
      | subject    | predicate         | object                      |
      | exo:Role1  | exo:validFrom     | "2025-01-01T00:00:00Z"^^xsd:dateTime |
      | exo:Role1  | exo:validTo       | "2025-12-31T23:59:59Z"^^xsd:dateTime |
      | exo:Task1  | ems:completedOn   | "2025-01-15T14:30:00Z"^^xsd:dateTime |
    When I query for facts valid at specific times
    Then the reasoner should apply temporal logic:
      | query_time                    | valid_facts                | reasoning_rule    |
      | "2025-06-01T12:00:00Z"       | exo:Role1 validity         | temporal_validity |
      | "2026-01-01T12:00:00Z"       | exo:Role1 invalidity       | temporal_validity |

  @probabilistic-reasoning @uncertainty-handling
  Scenario: Probabilistic reasoning with uncertainty quantification
    Given the reasoning engine supports probabilistic inference
    And the knowledge base contains uncertain facts:
      | subject    | predicate     | object       | probability |
      | exo:Task1  | ems:priority  | "high"       | 0.8         |
      | exo:Task1  | ems:priority  | "medium"     | 0.2         |
      | exo:Alice  | exo:hasSkill  | "Java"       | 0.95        |
      | exo:Alice  | exo:hasSkill  | "Python"     | 0.7         |
    When I run probabilistic reasoning
    Then the reasoner should:
      | reasoning_step           | expected_behavior                     |
      | propagate_uncertainty    | calculate derived fact probabilities  |
      | combine_evidence         | merge multiple probability sources    |
      | threshold_application    | filter facts below confidence level  |
      | ranking_generation       | order results by probability         |

  @explanation-generation @reasoning-transparency
  Scenario: Generate explanations for inferred facts
    Given the reasoning engine tracks inference chains
    And the knowledge base contains complex reasoning scenarios
    When I request an explanation for an inferred fact:
      """
      Why is exo:Alice inferred to be of type exo:WorkItem?
      """
    Then the system should generate a step-by-step explanation:
      | step | rule_applied        | premise                           | conclusion                    |
      | 1    | domain_inference    | exo:Alice ems:assignedTo exo:Task1| exo:Alice rdf:type exo:Person |
      | 2    | subclass_reasoning  | exo:Person rdfs:subClassOf exo:Agent | exo:Alice rdf:type exo:Agent |
      | 3    | equivalence_class   | exo:Agent owl:equivalentClass exo:WorkItem | exo:Alice rdf:type exo:WorkItem |
    And the explanation should be human-readable
    And confidence levels should be provided where applicable

  @rule-based-reasoning @custom-inference-rules
  Scenario: Custom rule-based reasoning with domain-specific logic
    Given I can define custom inference rules:
      """
      Rule: High-priority tasks assigned to senior developers are critical
      IF: ?task ems:priority "high" AND
          ?task ems:assignedTo ?person AND
          ?person exo:seniorityLevel "senior"
      THEN: ?task ems:criticality "high"
      """
    And the knowledge base contains relevant facts:
      | subject    | predicate           | object    |
      | exo:Task1  | ems:priority        | "high"    |
      | exo:Task1  | ems:assignedTo      | exo:Alice |
      | exo:Alice  | exo:seniorityLevel  | "senior"  |
    When I run rule-based reasoning
    Then custom rules should fire and generate new facts:
      | inferred_subject | inferred_predicate | inferred_object | applied_rule |
      | exo:Task1        | ems:criticality    | "high"          | custom_rule_1|

  @performance-optimization @scalable-reasoning
  Scenario: Optimize reasoning performance for large knowledge bases
    Given the knowledge base contains 1 million triples
    And complex ontological structures are defined
    When I run comprehensive reasoning
    Then the reasoning should be optimized:
      | optimization_technique    | expected_improvement      |
      | incremental_reasoning     | only process changes      |
      | parallel_processing       | utilize multiple cores    |
      | selective_materialization | materialize frequently used inferences |
      | index_optimization        | accelerate pattern matching |
      | caching_strategies        | cache intermediate results |
    And reasoning should complete within acceptable time limits
    And memory usage should remain bounded

  @consistency-maintenance @conflict-resolution
  Scenario: Maintain consistency and resolve conflicts automatically
    Given the knowledge base may contain conflicting information
    When inconsistencies are detected during reasoning:
      | conflict_type         | example_conflict                          |
      | type_inconsistency    | resource has disjoint types               |
      | cardinality_violation | functional property has multiple values   |
      | temporal_conflict     | overlapping exclusive time periods        |
      | domain_range_violation| property used outside defined constraints |
    Then the system should:
      | resolution_strategy   | action_taken                              |
      | conflict_detection    | identify and classify all inconsistencies |
      | priority_ranking      | rank conflicts by severity and impact     |
      | automatic_resolution  | apply resolution rules where possible     |
      | user_notification     | alert users to unresolvable conflicts     |
      | provenance_tracking   | maintain source information for debugging |