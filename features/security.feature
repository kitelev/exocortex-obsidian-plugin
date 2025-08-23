@security
Feature: SPARQL Security Validation
  As a security administrator
  I want to validate all SPARQL queries
  So that I can prevent injection attacks and system abuse

  Background:
    Given the security framework is enabled
    And rate limiting is configured to 100 requests per minute
    And query complexity limit is set to 1000

  @smoke @security
  Scenario: Prevent SPARQL injection
    When I submit a query with injection attempt:
      """
      SELECT * WHERE { 
        ?s ?p ?o . 
      } ; DROP GRAPH <http://example.com>
      """
    Then the query should be rejected
    And the security log should record the attempt
    And an alert should be sent to administrators

  @security
  Scenario: Block excessive query complexity
    When I submit a query with complexity score 1500
    Then the query should be rejected with error "Query too complex"
    And the complexity analysis should show:
      | metric | value |
      | triple_patterns | 50 |
      | optional_clauses | 20 |
      | filters | 30 |
      | estimated_cost | 1500 |

  @security
  Scenario: Enforce rate limiting
    Given I have made 99 requests in the last minute
    When I make 2 more requests
    Then the first request should succeed
    And the second request should be rate limited
    And receive a 429 status with retry-after header

  @security
  Scenario: Query timeout enforcement
    When I execute a query that runs for 6 seconds
    And the timeout is configured for 5 seconds
    Then the query should be terminated at 5 seconds
    And resources should be freed
    And a timeout error should be returned

  @security @critical
  Scenario: Emergency mode activation
    When 10 security incidents occur within 1 minute
    Then emergency mode should activate automatically
    And all non-admin queries should be blocked
    And administrators should be notified immediately