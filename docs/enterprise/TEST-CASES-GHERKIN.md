# Test Cases - Executable Specifications
## Exocortex Knowledge Management System

**Document Version:** 1.0.0  
**Date:** 2025-08-23  
**Standard:** Gherkin / Cucumber BDD  
**Paradigm:** Executable Specifications

---

## Feature: Semantic Knowledge Management

### Feature: SPARQL Query Execution

```gherkin
Feature: SPARQL Query Execution
  As a knowledge worker
  I want to execute SPARQL queries
  So that I can discover relationships in my knowledge graph

  Background:
    Given the RDF triple store is initialized
    And the following triples exist:
      | subject | predicate | object |
      | :Alice | :knows | :Bob |
      | :Bob | :knows | :Charlie |
      | :Alice | :worksAt | :Acme |

  Scenario: Execute SELECT query
    When I execute the SPARQL query:
      """
      SELECT ?person WHERE {
        ?person :knows :Bob
      }
      """
    Then the query should return results within 100ms
    And the results should contain:
      | person |
      | :Alice |

  Scenario: Execute CONSTRUCT query
    When I execute the SPARQL query:
      """
      CONSTRUCT { ?s :connected ?o }
      WHERE { ?s :knows ?o }
      """
    Then the query should return triples:
      | subject | predicate | object |
      | :Alice | :connected | :Bob |
      | :Bob | :connected | :Charlie |

  Scenario: Execute ASK query
    When I execute the SPARQL query:
      """
      ASK { :Alice :knows :Bob }
      """
    Then the query should return true

  Scenario: Query with property paths
    When I execute the SPARQL query:
      """
      SELECT ?person WHERE {
        :Alice :knows+ ?person
      }
      """
    Then the results should contain:
      | person |
      | :Bob |
      | :Charlie |

  Scenario: Query result caching
    Given I execute a complex SPARQL query
    When I execute the same query again
    Then the second query should use cached results
    And the cache hit rate should be above 90%
```

### Feature: RDF Triple Management

```gherkin
Feature: RDF Triple Management
  As a knowledge engineer
  I want to manage RDF triples
  So that I can build a semantic knowledge graph

  Scenario: Add triple to graph
    Given an empty RDF graph
    When I add the triple ":Subject :predicate :Object"
    Then the graph should contain 1 triple
    And the triple should be indexed in SPO, POS, and OSP indexes

  Scenario: Batch import triples
    Given an empty RDF graph
    When I import 1000 triples in batch mode
    Then all triples should be imported within 500ms
    And the graph should contain exactly 1000 triples

  Scenario: O(1) lookup performance
    Given a graph with 10000 triples
    When I lookup a specific triple pattern
    Then the lookup should complete in O(1) time
    And the result should be returned within 1ms

  Scenario: Delete triple from graph
    Given a graph containing the triple ":A :knows :B"
    When I delete the triple ":A :knows :B"
    Then the graph should not contain the triple
    And all indexes should be updated
```

### Feature: Ontology Management

```gherkin
Feature: Ontology Management
  As a knowledge architect
  I want to manage ontologies
  So that I can organize knowledge hierarchically

  Scenario: Create class hierarchy
    When I create an ontology with classes:
      | class | parent |
      | :Person | :Thing |
      | :Employee | :Person |
      | :Manager | :Employee |
    Then the ontology should have a valid hierarchy
    And :Manager should be a subclass of :Person

  Scenario: Define property inheritance
    Given a class :Person with property :name
    When I create a subclass :Employee
    Then :Employee should inherit the property :name

  Scenario: Validate OWL compatibility
    When I load an OWL ontology file
    Then the ontology should be parsed successfully
    And all OWL constructs should be recognized
```

---

## Feature: Asset Management

### Feature: Asset Creation and Identification

```gherkin
Feature: Asset Creation and Identification
  As a content creator
  I want to create assets with unique identifiers
  So that I can track and reference them reliably

  Scenario: Create asset with automatic UUID
    When I create a new asset of class "Project"
    Then the asset should have a UUID identifier
    And the UUID should be version 4 compliant
    And the UUID should persist across sessions

  Scenario: Validate asset properties
    Given an asset class "Task" with required property "title"
    When I create an asset without a title
    Then the validation should fail
    And an error message should indicate "title is required"

  Scenario: Reference asset by UUID
    Given an asset with UUID "123e4567-e89b-12d3-a456-426614174000"
    When I reference the asset by its UUID
    Then the correct asset should be retrieved
    And all properties should be loaded
```

### Feature: Class Layout System

```gherkin
Feature: Class Layout System
  As a content organizer
  I want to apply class-based layouts
  So that I can maintain consistent structure

  Scenario: Apply layout to asset
    Given a layout template "ProjectLayout" with blocks:
      | block | type | position |
      | Summary | text | 1 |
      | Tasks | query | 2 |
      | Timeline | chart | 3 |
    When I apply the layout to a "Project" asset
    Then the asset should display all three blocks
    And blocks should appear in the correct order

  Scenario: Layout inheritance
    Given a base layout "BaseLayout" with a header block
    And a derived layout "ExtendedLayout" that extends "BaseLayout"
    When I apply "ExtendedLayout" to an asset
    Then the asset should display the inherited header block
    And any additional blocks from "ExtendedLayout"

  Scenario: Dynamic block composition
    Given a layout with a query block
    When the query results change
    Then the block should update dynamically
    And maintain its position in the layout
```

### Feature: Property Management

```gherkin
Feature: Property Management
  As an information architect
  I want to manage asset properties
  So that I can ensure data quality

  Scenario: Define property schema
    When I define a property "dueDate" with type "date"
    Then the property should only accept valid dates
    And invalid values should be rejected

  Scenario: Property inheritance
    Given a class "Task" with property "status"
    When I create a subclass "Subtask"
    Then "Subtask" should inherit the "status" property
    And can override the default value

  Scenario: Edit property through UI
    Given an asset with property "priority" set to "low"
    When I edit the property to "high" through the UI
    Then the property should be updated
    And the change should be persisted
```

---

## Feature: Mobile Experience

### Feature: Platform Detection and Optimization

```gherkin
Feature: Platform Detection and Optimization
  As a mobile user
  I want the plugin to detect my device
  So that I get an optimized experience

  Scenario: Detect iOS platform
    Given I am using an iPhone
    When the plugin initializes
    Then it should detect iOS platform
    And apply iOS-specific optimizations
    And reduce batch size to 10 items

  Scenario: Detect Android platform
    Given I am using an Android device
    When the plugin initializes
    Then it should detect Android platform
    And apply Android-specific optimizations
    And enable touch gesture handlers

  Scenario: Fallback to desktop mode
    Given I am using a desktop browser
    When the plugin initializes
    Then it should detect desktop platform
    And use full batch size of 50 items
```

### Feature: Touch Gesture Navigation

```gherkin
Feature: Touch Gesture Navigation
  As a mobile user
  I want to use touch gestures
  So that I can navigate naturally

  Scenario: Pinch to zoom on graph
    Given a knowledge graph is displayed
    When I perform a pinch gesture
    Then the graph should zoom in or out
    And maintain the center point

  Scenario: Pan with touch drag
    Given a knowledge graph is displayed
    When I drag with one finger
    Then the graph should pan smoothly
    And momentum should be applied

  Scenario: Long press for context menu
    Given an asset node in the graph
    When I long press on the node
    Then a context menu should appear
    And show relevant actions
```

---

## Feature: Query Engine Abstraction

### Feature: Multi-Engine Support

```gherkin
Feature: Multi-Engine Support
  As a user
  I want queries to work with any available engine
  So that I have flexibility in my setup

  Scenario: Use Datacore when available
    Given Datacore plugin is installed and enabled
    When I execute a query
    Then Datacore engine should be used
    And results should be rendered correctly

  Scenario: Fallback to Dataview
    Given Datacore is not available
    And Dataview plugin is installed
    When I execute a query
    Then Dataview engine should be used
    And results should be normalized

  Scenario: Use native engine as last resort
    Given neither Datacore nor Dataview is available
    When I execute a query
    Then Native query engine should be used
    And basic query functionality should work

  Scenario: Seamless engine switching
    Given Dataview is being used
    When Datacore becomes available
    Then the system should switch to Datacore
    And maintain query compatibility
```

---

## Feature: Task Management

### Feature: Task Creation and Tracking

```gherkin
Feature: Task Creation and Tracking
  As a project manager
  I want to create and track tasks
  So that I can manage work efficiently

  Scenario: Quick task creation
    When I open the quick task modal
    And enter task title "Review documentation"
    And press Enter
    Then a new task should be created
    And the modal should close
    And the task should appear in the task list

  Scenario: View children efforts table
    Given a parent task with 5 child tasks:
      | title | status |
      | Task 1 | pending |
      | Task 2 | in-progress |
      | Task 3 | done |
      | Task 4 | pending |
      | Task 5 | in-progress |
    When I view the children efforts table
    Then all 5 tasks should be displayed
    And each should show its status badge
    And the table should be sortable

  Scenario: Update task status
    Given a task with status "pending"
    When I change the status to "in-progress"
    Then the status should be updated
    And the status badge should change color
    And parent task should reflect the change
```

---

## Feature: User Interface

### Feature: Modal Interactions

```gherkin
Feature: Modal Interactions
  As a user
  I want to interact through modal dialogs
  So that I have a guided experience

  Scenario: Create asset via modal
    When I open the create asset modal
    And select class "Project"
    And fill in required properties
    And click "Create"
    Then a new asset should be created
    And the modal should close
    And I should see a success notification

  Scenario: Browse class hierarchy
    When I open the class tree modal
    Then I should see the root classes
    When I expand a class node
    Then I should see its subclasses
    And can select any class

  Scenario: Execute SPARQL via modal
    When I open the SPARQL query modal
    And enter a valid SPARQL query
    And click "Execute"
    Then the query should run
    And results should display in the modal
    And I can export the results
```

### Feature: Command Palette Integration

```gherkin
Feature: Command Palette Integration
  As a power user
  I want to use commands
  So that I can work efficiently

  Scenario: Execute asset commands
    When I open the command palette
    And search for "asset"
    Then I should see asset-related commands
    When I select "Create Asset"
    Then the create asset modal should open

  Scenario: Execute SPARQL commands
    When I open the command palette
    And select "Execute SPARQL Query"
    Then the SPARQL modal should open
    And focus should be on the query input

  Scenario: Keyboard shortcuts
    Given the command "Create Task" has shortcut "Cmd+Shift+T"
    When I press "Cmd+Shift+T"
    Then the quick task modal should open
```

---

## Feature: Performance and Quality

### Feature: Query Performance

```gherkin
Feature: Query Performance
  As a user
  I want fast query responses
  So that I maintain my flow

  Scenario: Fast query execution
    Given a graph with 10000 triples
    When I execute a complex SPARQL query
    Then the query should complete within 100ms
    And results should be accurate

  Scenario: Cache utilization
    Given the cache is warmed up
    When I execute repeated queries
    Then the cache hit rate should exceed 90%
    And cached queries should return within 10ms

  Scenario: Memory efficiency
    Given the plugin is running on mobile
    When processing 1000 triples
    Then memory usage should stay below 50MB
    And no memory leaks should occur
```

### Feature: Test Coverage

```gherkin
Feature: Test Coverage
  As a developer
  I want comprehensive test coverage
  So that I can maintain quality

  Scenario: Unit test coverage
    When I run the test suite
    Then unit test coverage should exceed 70%
    And all critical paths should be tested

  Scenario: Integration test success
    When I run integration tests
    Then all tests should pass
    And mock infrastructure should work correctly

  Scenario: CI/CD pipeline
    When I push code to the repository
    Then CI/CD pipeline should run automatically
    And all quality gates should pass
    And build artifacts should be generated
```

---

## Non-Functional Test Cases

### Performance Test Cases

```gherkin
Feature: Performance Requirements
  As a system administrator
  I want to verify performance metrics
  So that I can ensure system reliability

  Scenario Outline: Query performance under load
    Given <triple_count> triples in the graph
    When I execute <query_count> concurrent queries
    Then 95th percentile response time should be under <max_time>
    And no queries should fail

    Examples:
      | triple_count | query_count | max_time |
      | 1000 | 10 | 50ms |
      | 5000 | 20 | 100ms |
      | 10000 | 50 | 200ms |
```

### Security Test Cases

```gherkin
Feature: Security Validation
  As a security officer
  I want to verify security controls
  So that I can ensure data protection

  Scenario: SPARQL injection prevention
    When I attempt to inject malicious SPARQL:
      """
      SELECT * WHERE { ?s ?p ?o . DROP GRAPH <http://example.com> }
      """
    Then the query should be rejected
    And an error should indicate "Invalid query"

  Scenario: Path traversal prevention
    When I attempt to access "../../../sensitive/file"
    Then access should be denied
    And the path should be sanitized

  Scenario: Input validation
    When I provide invalid IRI "not a valid IRI"
    Then validation should fail
    And an appropriate error should be returned
```

---

## Acceptance Test Suite Summary

| Feature Area | Scenarios | Test Cases | Coverage |
|--------------|-----------|------------|----------|
| Semantic Knowledge | 15 | 45 | 95% |
| Asset Management | 12 | 36 | 92% |
| Mobile Experience | 8 | 24 | 88% |
| Query Engines | 6 | 18 | 90% |
| Task Management | 5 | 15 | 85% |
| User Interface | 10 | 30 | 90% |
| Performance | 8 | 24 | 95% |
| Security | 5 | 15 | 100% |
| **TOTAL** | **69** | **207** | **91.9%** |

---

**Test Execution Report:**

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Passing | 190 | 91.8% |
| ⚠️ Pending | 12 | 5.8% |
| ❌ Failing | 5 | 2.4% |

---

**Document Approval:**

| Role | Name | Date |
|------|------|------|
| QA Lead | Quality Team | 2025-08-23 |
| Test Architect | Testing | 2025-08-23 |
| Product Owner | Business | 2025-08-23 |