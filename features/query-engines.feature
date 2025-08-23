@query-engines
Feature: Multi-Engine Query Support
  As a power user
  I want to use different query engines
  So that I can leverage the best tool for each query type

  Background:
    Given I have Obsidian with multiple query plugins installed
    And the query engine abstraction layer is initialized

  @smoke @query-engines
  Scenario: Automatic query engine detection
    When the plugin initializes
    Then it should detect available engines:
      | engine | status |
      | Dataview | Available |
      | Datacore | Not installed |
      | Native | Always available |
    And select the best available engine automatically

  @query-engines
  Scenario: Dataview query execution
    Given Dataview plugin is installed and enabled
    When I execute a Dataview query:
      """
      TABLE title, status, created
      FROM "Projects"
      WHERE status = "active"
      SORT created DESC
      """
    Then the query should execute via Dataview engine
    And results should be displayed in a table
    And formatting should match Dataview standards

  @query-engines
  Scenario: Fallback to native engine
    Given Dataview is not available
    When I execute a query requiring table display
    Then the system should fall back to native engine
    And render results using internal table renderer
    And maintain similar visual presentation

  @query-engines
  Scenario: Query engine preference configuration
    Given I have all engines available
    When I set my preferred engine to "Datacore"
    Then all compatible queries should use Datacore
    And incompatible queries should fall back gracefully
    And preferences should persist across sessions

  @query-engines
  Scenario: Engine-specific query translation
    Given I write a standardized query:
      """
      SELECT title, status 
      WHERE class = "Task" AND status = "todo"
      ORDER BY priority
      """
    When executed with different engines
    Then it should translate appropriately:
      | engine | translated_query |
      | Dataview | TABLE title, status WHERE class = "Task" AND status = "todo" SORT priority |
      | Native | Internal query format |
      | SPARQL | SELECT ?title ?status WHERE { ?s :class "Task" ; :status "todo" ; :title ?title ; :status ?status } |

  @query-engines
  Scenario: Performance comparison across engines
    Given the same dataset in all engines
    When I execute identical queries
    Then I should see performance metrics:
      | engine | execution_time | memory_usage |
      | Dataview | <100ms | Low |
      | Datacore | <50ms | Medium |
      | Native | <200ms | Low |
    And results should be identical across engines

  @query-engines @error-handling
  Scenario: Graceful engine failure handling
    Given Dataview engine encounters an error
    When executing a query
    Then the system should:
      | action | description |
      | Log error | Record failure details |
      | Attempt fallback | Try next available engine |
      | Notify user | Show non-intrusive message |
      | Continue operation | Don't crash the plugin |

  @query-engines
  Scenario: Query result caching across engines
    Given I execute the same query multiple times
    When using different engines
    Then cached results should be shared when possible
    And cache keys should be engine-agnostic
    And invalidation should affect all engines

  @query-engines @mobile
  Scenario: Mobile-optimized engine selection
    Given I am on a mobile device
    When executing queries
    Then the system should prefer lightweight engines
    And limit result set sizes automatically
    And use mobile-optimized renderers