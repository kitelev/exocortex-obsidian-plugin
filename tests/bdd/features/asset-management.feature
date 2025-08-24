@asset-management @core
Feature: Asset Management
  As a knowledge worker
  I want to create and manage assets with proper classification
  So that I can organize my knowledge effectively

  Background:
    Given the Exocortex plugin is initialized
    And the ontology repository is available
    And the class hierarchy is loaded

  @smoke @high-priority
  Scenario: Creating a new asset with valid properties
    Given I have a valid asset configuration
      | field        | value                    |
      | name         | Test Project Asset       |
      | class        | ems__Project             |
      | description  | A test project for BDD   |
      | priority     | high                     |
    When I create an asset through the CreateAssetUseCase
    Then the asset should be created successfully
    And the asset should have the correct properties
    And the asset should be indexed in the graph
    And the asset file should exist in the vault

  @validation @error-handling
  Scenario: Creating an asset with invalid class fails gracefully
    Given I have an invalid asset configuration
      | field    | value                  |
      | name     | Invalid Asset          |
      | class    | non_existent_class     |
    When I attempt to create an asset
    Then the creation should fail with validation error
    And the error message should be user-friendly
    And no asset file should be created

  @integration @property-management
  Scenario: Updating asset properties through PropertyEditingUseCase
    Given an existing asset named "Test Project"
    And the asset has initial properties
      | property     | value     |
      | priority     | medium    |
      | status       | active    |
    When I update the asset properties
      | property     | new_value |
      | priority     | high      |
      | description  | Updated   |
    Then the properties should be updated successfully
    And the asset frontmatter should reflect the changes
    And the graph index should be updated

  @performance @large-dataset
  Scenario: Managing multiple assets efficiently
    Given I have multiple asset templates
      | name       | class        | count |
      | Projects   | ems__Project | 50    |
      | Tasks      | ems__Task    | 200   |
      | Areas      | ems__Area    | 25    |
    When I create all assets in batch
    Then all assets should be created within 5 seconds
    And the graph should contain 275 nodes
    And the memory usage should remain under 100MB

  @security @data-validation
  Scenario: Asset creation with security validation
    Given I have asset data with potential security risks
      | field        | value                           |
      | name         | <script>alert('test')</script>  |
      | description  | ../../../etc/passwd             |
    When I attempt to create the asset
    Then the input should be sanitized
    And the asset should be created safely
    And no script execution should occur

  @edge-cases @resilience
  Scenario: Creating asset when vault is temporarily unavailable
    Given the vault adapter is temporarily unavailable
    When I attempt to create an asset
    Then the system should handle the failure gracefully
    And the user should receive an appropriate error message
    And the system should retry automatically
    And the asset should be created once the vault is available

  @mobile @responsive
  Scenario: Asset creation on mobile platform
    Given I am using the mobile version of Obsidian
    And the touch interface is active
    When I create an asset using touch interactions
    Then the asset creation modal should be touch-optimized
    And the asset should be created successfully
    And the performance should meet mobile standards