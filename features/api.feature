@api
Feature: REST API Endpoints
  As an API consumer
  I want to access Exocortex functionality via REST
  So that I can integrate with external systems

  Background:
    Given the API server is running on port 3000
    And I have a valid API key "sk-test-key-123"

  @smoke @api
  Scenario: Health check endpoint
    When I GET "/api/health" with valid authentication
    Then I should receive a 200 response
    And the response should contain:
      """
      {
        "status": "healthy",
        "uptime": number,
        "version": "3.17.1"
      }
      """

  @api
  Scenario: Execute SPARQL query via API
    When I POST to "/api/sparql/query" with:
      """
      {
        "query": "SELECT * WHERE { ?s ?p ?o } LIMIT 10",
        "format": "json"
      }
      """
    Then I should receive a 200 response
    And the response should contain SPARQL results
    And results should have no more than 10 bindings

  @api
  Scenario: Create asset via API
    When I POST to "/api/assets" with:
      """
      {
        "class": "Project",
        "properties": {
          "title": "New Project",
          "status": "active"
        }
      }
      """
    Then I should receive a 201 Created response
    And the response should include the asset UUID
    And the asset should be persisted

  @api @security
  Scenario: Reject invalid API key
    When I make a request with invalid API key
    Then I should receive a 401 Unauthorized response
    And the response should include "Invalid API key"

  @api
  Scenario: Handle malformed requests
    When I POST invalid JSON to "/api/sparql/query"
    Then I should receive a 400 Bad Request response
    And the response should contain error details