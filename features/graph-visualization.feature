@graph @visualization
Feature: Interactive Knowledge Graph Visualization
  As a visual learner
  I want to see my knowledge as an interactive graph
  So that I can understand relationships and navigate visually

  Background:
    Given I have a knowledge graph with semantic data
    And the graph visualization component is initialized

  @smoke @graph
  Scenario: Basic graph rendering
    Given I have nodes and relationships:
      | source | relationship | target |
      | Project A | hasTask | Task 1 |
      | Project A | hasTask | Task 2 |
      | Task 1 | dependsOn | Task 2 |
    When I render the knowledge graph
    Then I should see 3 nodes displayed
    And I should see 3 edges connecting them
    And nodes should be labeled with their titles

  @graph @interaction
  Scenario: Interactive node exploration
    Given a rendered graph with multiple nodes
    When I click on node "Project A"
    Then the node should be highlighted
    And its properties should display in a panel:
      | property | value |
      | class | Project |
      | status | active |
      | created | 2024-01-15 |
    And connected nodes should be emphasized

  @graph @navigation
  Scenario: Focus-based graph navigation
    Given a large graph with 100+ nodes
    When I focus on node "Central Concept"
    Then the graph should show:
      | depth | nodes_shown |
      | 0 | Central Concept |
      | 1 | Direct connections |
      | 2 | Secondary connections |
    And distant nodes should be hidden
    And I can expand/collapse node clusters

  @graph @mobile
  Scenario: Touch gesture support on mobile
    Given I am using a mobile device
    When I use pinch gesture on the graph
    Then the graph should zoom in/out
    When I use two-finger pan
    Then the graph should move accordingly
    When I double-tap a node
    Then it should center and focus on that node

  @graph @filters
  Scenario: Filter graph by relationship type
    Given a graph with multiple relationship types:
      | types |
      | hasTask |
      | dependsOn |
      | relatedTo |
      | implements |
    When I filter to show only "hasTask" relationships
    Then only "hasTask" edges should be visible
    And unconnected nodes should be dimmed

  @graph @export
  Scenario: Export graph visualization
    Given a rendered graph view
    When I export the visualization
    Then I can choose formats:
      | format | description |
      | PNG | Static image |
      | SVG | Vector graphics |
      | JSON | Graph data |
    And the export should preserve current view state

  @graph @performance
  Scenario: Handle large graphs efficiently
    Given a graph with 1000 nodes and 5000 edges
    When I render the graph
    Then initial render should complete within 3 seconds
    And panning/zooming should maintain 30+ FPS
    And memory usage should stay below 200MB

  @graph @layout
  Scenario: Multiple layout algorithms
    Given a complex graph structure
    When I switch between layout algorithms:
      | algorithm | description |
      | Force-directed | Natural clustering |
      | Hierarchical | Tree-like structure |
      | Circular | Nodes in circles |
      | Grid | Organized grid |
    Then the graph should reorganize accordingly
    And transitions should be animated

  @graph @search
  Scenario: Search and highlight in graph
    Given a large knowledge graph
    When I search for "authentication"
    Then matching nodes should be highlighted
    And the view should pan to show results
    And a results panel should list all matches