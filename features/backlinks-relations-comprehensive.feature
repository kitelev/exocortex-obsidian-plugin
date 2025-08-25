@business @workflow @semantic @relationships
Feature: Backlinks and Relations Management - Semantic Graph Navigation
  As a knowledge worker using the Exocortex plugin
  I want to navigate and manage semantic relationships between assets
  So that I can discover connections and maintain a coherent knowledge graph

  Background:
    Given the Exocortex plugin is initialized
    And the semantic graph system is enabled
    And the RDF triple store is active
    And I have a knowledge base with interconnected assets

  @backlinks @discovery @basic-functionality
  Scenario: Discover basic backlinks for an asset
    Given I have the following assets with relationships:
      | asset           | property              | target                |
      | Project Alpha   | ems__Effort_parent    | [[Epic Strategy]]     |
      | Task Beta       | ems__Effort_parent    | [[Project Alpha]]     |
      | Task Gamma      | ems__Effort_parent    | [[Project Alpha]]     |
      | Document Delta  | exo__Asset_relatedTo  | [[Project Alpha]]     |
    When I view backlinks for "Project Alpha"
    Then I should see 3 incoming relationships:
      | source          | relationship_type     |
      | Task Beta       | ems__Effort_parent    |
      | Task Gamma      | ems__Effort_parent    |
      | Document Delta  | exo__Asset_relatedTo  |

  @backlinks @dynamic-rendering @ui-integration
  Scenario: Render dynamic backlinks in note view
    Given I am viewing the note "Project Alpha"
    And it has multiple incoming relationships
    When the dynamic backlinks block is rendered
    Then I should see a collapsible section titled "Backlinks"
    And each backlink should show:
      | element           | content                              |
      | source_asset      | Link to the source asset             |
      | relationship_type | Human-readable relationship name     |
      | context_snippet   | Relevant context from source         |
    And the section should have proper CSS styling

  @backlinks @filtering @relationship-types
  Scenario: Filter backlinks by relationship type
    Given I have backlinks with various relationship types:
      | source        | relationship                    |
      | Task A        | ems__Effort_parent             |
      | Task B        | ems__Effort_parent             |
      | Doc C         | exo__Asset_relatedTo           |
      | Note D        | exo__Asset_dependsOn           |
      | Issue E       | ems__Issue_affectedAsset       |
    When I filter backlinks by relationship type "ems__Effort_parent"
    Then I should see only 2 backlinks:
      | source  | relationship         |
      | Task A  | ems__Effort_parent  |
      | Task B  | ems__Effort_parent  |

  @relations @rdf-triples @semantic-processing
  Scenario: Process RDF relationships from frontmatter
    Given I have an asset with frontmatter:
      | property                 | value                        |
      | exo__Asset_relatedTo     | [[Concept A]], [[Concept B]] |
      | ems__Effort_parent       | [[Project X]]                |
      | exo__Asset_dependsOn     | [[Resource Y]]               |
      | custom__Property_value   | [[Custom Target]]            |
    When the system processes the relationships
    Then RDF triples should be created:
      | subject    | predicate                | object          |
      | CurrentAsset| exo__Asset_relatedTo     | Concept A       |
      | CurrentAsset| exo__Asset_relatedTo     | Concept B       |
      | CurrentAsset| ems__Effort_parent       | Project X       |
      | CurrentAsset| exo__Asset_dependsOn     | Resource Y      |
      | CurrentAsset| custom__Property_value   | Custom Target   |

  @relations @grouping @piped-links
  Scenario: Group piped link relations correctly
    Given I have an asset with the following relationships:
      | property              | value                                    |
      | exo__Asset_relatedTo  | [[Asset A|Display Name A]]              |
      | exo__Asset_relatedTo  | [[Asset B|Display Name B]]              |
      | ems__Effort_parent    | [[Project C|My Project]]                |
    When I render the relations block
    Then relations should be grouped by property:
      | property_group        | relations                          |
      | exo__Asset_relatedTo  | Display Name A, Display Name B     |
      | ems__Effort_parent    | My Project                         |
    And piped link display names should be preserved
    And actual asset references should be used for navigation

  @relations @ontology-aware @semantic-reasoning
  Scenario: Display relations with ontology-aware labeling
    Given I have ontology definitions that map:
      | property_iri           | human_label              |
      | exo__Asset_relatedTo   | Related To               |
      | ems__Effort_parent     | Parent Effort            |
      | exo__Asset_dependsOn   | Depends On               |
    And I have an asset with these relationships
    When I render the relations block
    Then relationships should be displayed with human-readable labels:
      | displayed_label | property_iri           |
      | Related To      | exo__Asset_relatedTo   |
      | Parent Effort   | ems__Effort_parent     |
      | Depends On      | exo__Asset_dependsOn   |

  @relations @inverse-discovery @bidirectional
  Scenario: Discover inverse relationships
    Given I have asset A with relation "dependsOn" to asset B
    And the ontology defines "dependsOn" has inverse "isDependedOnBy"
    When I view asset B
    Then I should see an inverse relationship:
      | relationship      | source   | direction |
      | isDependedOnBy    | Asset A  | incoming  |
    And the inverse relationship should be marked as computed

  @performance @large-graphs @caching
  Scenario: Handle large relationship networks efficiently
    Given I have a knowledge base with:
      | metric                | value |
      | total_assets         | 10000 |
      | total_relationships  | 50000 |
      | max_relationships_per_asset | 100 |
    When I query relationships for any asset
    Then the query should complete within 500ms
    And results should be cached for subsequent requests
    And memory usage should remain bounded

  @caching @relationship-cache @performance-optimization
  Scenario: Cache relationship data effectively
    Given I have queried relationships for "Project Alpha"
    And the results are cached
    When I navigate to another asset and back
    Then the cached relationships should be used
    And the response time should be under 50ms
    When a related asset is modified
    Then the cache should be invalidated
    And fresh data should be fetched on next access

  @validation @data-integrity @consistency-checks
  Scenario: Validate relationship consistency
    Given I have the following relationships:
      | asset_a    | property       | asset_b    |
      | Task 1     | dependsOn      | Resource X |
      | Task 2     | dependsOn      | Resource Y |
      | Resource X | exists         | false      |
    When the system validates relationships
    Then I should receive validation warnings:
      | issue_type        | details                           |
      | broken_reference  | Resource X does not exist         |
      | orphaned_relation | Task 1 -> Resource X is orphaned  |
    And valid relationships should remain intact
    And broken relationships should be flagged for cleanup

  @circular-dependencies @graph-analysis
  Scenario: Detect circular dependencies
    Given I have relationships forming a cycle:
      | asset_a  | property   | asset_b  |
      | Task A   | dependsOn  | Task B   |
      | Task B   | dependsOn  | Task C   |
      | Task C   | dependsOn  | Task A   |
    When the system analyzes dependencies
    Then a circular dependency should be detected
    And I should receive a warning about the cycle:
      | cycle_path | Task A -> Task B -> Task C -> Task A |
    And the cycle should be visualized if requested

  @relationship-strength @weighted-connections
  Scenario: Calculate relationship strength metrics
    Given I have assets with varying connection strengths:
      | asset_a    | asset_b    | connection_types | frequency |
      | Project A  | Concept X  | relatedTo        | 5         |
      | Project A  | Concept Y  | relatedTo, dependsOn | 2     |
      | Project A  | Concept Z  | relatedTo        | 1         |
    When I analyze relationship strength
    Then connections should be ranked by strength:
      | rank | target     | strength_score |
      | 1    | Concept X  | 0.8           |
      | 2    | Concept Y  | 0.6           |
      | 3    | Concept Z  | 0.3           |

  @search @relationship-queries @graph-traversal
  Scenario: Search for assets through relationship paths
    Given I have a relationship network:
      | path                                    |
      | Project A -> Task 1 -> Resource X       |
      | Project A -> Task 2 -> Resource Y       |
      | Resource X -> Document A                |
    When I search for "all documents related to Project A"
    Then the system should traverse relationships
    And find "Document A" through the path: Project A -> Task 1 -> Resource X -> Document A
    And the traversal path should be shown in results

  @ui-components @interactive-navigation
  Scenario: Provide interactive relationship browser
    Given I am viewing an asset with complex relationships
    When I open the relationship browser
    Then I should see an interactive interface with:
      | component         | functionality                     |
      | relationship_tree | Hierarchical view of connections  |
      | filter_controls   | Filter by relationship type       |
      | search_box        | Find specific connected assets    |
      | breadcrumb_trail  | Track navigation path             |
      | zoom_controls     | Adjust detail level               |

  @mobile-support @touch-interface
  Scenario: Navigate relationships on mobile devices
    Given I am using the plugin on a mobile device
    When I view relationships for an asset
    Then the relationship interface should be touch-friendly:
      | element               | mobile_behavior                |
      | relationship_links    | Large touch targets            |
      | expandable_sections   | Touch to expand/collapse       |
      | navigation_gestures   | Swipe to navigate history      |
      | context_menus        | Long press for options         |

  @export @data-portability @graph-formats
  Scenario: Export relationship data
    Given I have a set of assets with rich relationships
    When I export the relationship data
    Then I should be able to export in formats:
      | format     | structure                        |
      | JSON-LD    | Semantic web standard format     |
      | GraphML    | Graph analysis software format   |
      | DOT        | Graphviz visualization format    |
      | CSV        | Tabular relationship data        |
    And exported data should preserve:
      | element              | preservation                   |
      | relationship_types   | Full property URIs             |
      | asset_identifiers    | Stable asset IDs               |
      | metadata             | Timestamps and provenance      |

  @real-time-sync @collaborative-editing
  Scenario: Synchronize relationship changes across sessions
    Given multiple users are editing the knowledge base
    When user A creates a new relationship
    Then user B should see the relationship appear
    And the relationship should be reflected in B's backlinks view
    And conflict resolution should handle simultaneous edits

  @privacy @access-control @security
  Scenario: Respect access controls in relationship traversal
    Given I have assets with different access levels:
      | asset        | access_level | relationships           |
      | Public Doc   | public       | -> Private Resource     |
      | Private Resource | private   | -> Confidential Data    |
    And I have read access only to public assets
    When I view relationships for "Public Doc"
    Then I should see the relationship exists
    But I should not be able to access "Private Resource"
    And relationship traversal should stop at access boundaries

  @analytics @relationship-insights
  Scenario: Generate relationship analytics
    Given I have a mature knowledge base with many relationships
    When I request relationship analytics
    Then I should see insights like:
      | metric                    | description                        |
      | most_connected_assets     | Assets with highest connectivity   |
      | relationship_type_usage   | Most frequently used relations     |
      | orphaned_assets          | Assets with no relationships       |
      | cluster_analysis         | Groups of highly connected assets  |
      | growth_trends            | Relationship creation over time    |

  @error-handling @graceful-degradation
  Scenario: Handle relationship errors gracefully
    Given I have relationships with various data issues:
      | issue_type           | specific_problem                |
      | malformed_uri        | Invalid relationship property   |
      | missing_target       | Target asset no longer exists   |
      | circular_reference   | Self-referencing relationship   |
      | encoding_error       | Non-UTF8 characters in names    |
    When the system processes these relationships
    Then errors should be handled gracefully:
      | issue_type         | handling_strategy              |
      | malformed_uri      | Skip with warning logged       |
      | missing_target     | Mark as broken, offer cleanup  |
      | circular_reference | Allow but flag for user review |
      | encoding_error     | Attempt to fix or sanitize     |
    And the UI should remain functional with partial data

  @performance-monitoring @relationship-metrics
  Scenario: Monitor relationship processing performance
    Given the relationship system is under normal load
    When performance metrics are collected
    Then I should be able to monitor:
      | metric                   | threshold           |
      | relationship_query_time  | < 500ms for 95%     |
      | cache_hit_rate          | > 80%               |
      | memory_usage_growth     | < 10MB per 1000 rels|
      | concurrent_query_limit  | 10 simultaneous     |
    And performance degradation should trigger alerts