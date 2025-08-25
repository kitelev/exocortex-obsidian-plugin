Feature: Plugin Initialization Smoke Tests
  As a user of the Exocortex plugin
  I want the plugin to initialize correctly
  So that I can use all plugin features without errors

  Background:
    Given the Obsidian app is running
    And the vault is properly configured

  @smoke @critical
  Scenario: Plugin loads successfully without errors
    When I enable the Exocortex plugin
    Then the plugin should load without errors
    And the plugin status should be "active"
    And no error messages should appear in the console

  @smoke @critical
  Scenario: All required services are registered during initialization
    Given the plugin is not yet loaded
    When the plugin initialization sequence starts
    Then the ServiceProvider should initialize successfully
    And the following services should be registered:
      | Service Name         | Type                    | Required For              |
      | RDFService          | RDFService              | RDF operations            |
      | IAssetRepository    | IAssetRepository        | Asset management          |
      | LayoutRenderer      | LayoutRenderer          | Layout rendering          |
      | PropertyRenderer    | PropertyRenderer        | Property editing          |
    And all services should be retrievable without errors

  @smoke @critical
  Scenario: Code block processor initializes with all dependencies
    Given the ServiceProvider is initialized with all services
    When the CodeBlockProcessor is initialized
    Then the UniversalLayoutRenderer should be created successfully
    And the AssetListRenderer should be created successfully
    And no "Service not found" errors should occur

  @smoke
  Scenario: Plugin initialization follows correct order
    When the plugin onload method is called
    Then the initialization should follow this sequence:
      | Step | Component                      | Status    |
      | 1    | Logger initialization          | Success   |
      | 2    | LifecycleRegistry setup        | Success   |
      | 3    | CommandRegistry setup          | Success   |
      | 4    | LifecycleManagers initialize   | Success   |
      | 5    | ServiceProvider initialize     | Success   |
      | 6    | CommandControllers initialize  | Success   |
      | 7    | LifecycleRegistry.initializeAll| Success   |
      | 8    | CommandRegistry.initializeAll  | Success   |
      | 9    | CodeBlockProcessor initialize  | Success   |

  @smoke @critical
  Scenario: Plugin handles missing dependencies gracefully
    Given a dependency is not available
    When the plugin tries to initialize
    Then the plugin should log a meaningful error message
    And the plugin should disable affected features
    But the plugin should not crash the Obsidian app

  @smoke
  Scenario: Plugin unloads cleanly
    Given the plugin is loaded and active
    When I disable the Exocortex plugin
    Then all services should be cleaned up
    And all event listeners should be removed
    And no memory leaks should be detected
    And the plugin status should be "unloaded"

  @smoke @regression
  Scenario: Plugin reload maintains consistency
    Given the plugin is loaded and active
    When I disable and then re-enable the plugin
    Then the plugin should initialize successfully
    And all services should be available
    And no duplicate registrations should occur
    And no stale references should exist

  @smoke @performance
  Scenario: Plugin initialization completes within time limit
    When I enable the Exocortex plugin
    Then the plugin should complete initialization within 5 seconds
    And the UI should remain responsive during initialization
    And no blocking operations should occur on the main thread

  @smoke @error-recovery
  Scenario: Plugin recovers from initialization errors
    Given an error occurs during service initialization
    When the plugin attempts to recover
    Then the error should be logged with context
    And the plugin should attempt to reinitialize failed services
    And a user-friendly error notification should be displayed
    And the plugin should provide a recovery action

  @smoke @dependencies
  Scenario: External dependencies are properly checked
    When the plugin checks for external dependencies
    Then it should verify Obsidian API version compatibility
    And it should check for required Obsidian features
    And it should handle missing optional dependencies gracefully
    And it should log dependency status information