Feature: Simplified Plugin Settings
  As a user of the Exocortex plugin
  I want a clean and minimal settings interface
  With only essential debug and reset options
  So that the settings are not cluttered with outdated features

  Background:
    Given I have the Exocortex plugin installed
    And I open the plugin settings tab

  Scenario: Settings tab shows only Debug and Reset sections
    When I view the plugin settings
    Then I should see a "Debug Settings" section
    And I should see a "Reset Settings" section
    And I should not see any legacy settings sections
    And I should not see RDF-related settings
    And I should not see query engine settings
    And I should not see performance settings

  Scenario: Debug Settings section contains essential debug options
    When I expand the "Debug Settings" section
    Then I should see a toggle for "Enable Debug Mode"
    And I should see a toggle for "Enable Performance Tracking"
    And I should see a toggle for "Show Console Logs"
    And the debug mode should be disabled by default

  Scenario: Reset Settings section provides reset functionality
    When I view the "Reset Settings" section
    Then I should see a "Reset to Defaults" button
    And I should see a warning message about data loss
    And the button should have a danger/warning style

  Scenario: Reset button restores default settings
    Given I have modified some debug settings
    When I click the "Reset to Defaults" button
    And I confirm the reset action
    Then all settings should be restored to defaults
    And debug mode should be disabled
    And a success notification should appear

  Scenario: Settings persistence works correctly
    Given I enable debug mode
    When I close and reopen the settings tab
    Then debug mode should still be enabled
    And the setting should persist across plugin reloads

  Scenario: No legacy settings are accessible
    When I inspect the settings data structure
    Then there should be no "rdfEnabled" property
    And there should be no "queryEngine" property
    And there should be no "performanceThresholds" property
    And there should be no "namespacePrefix" property
    And there should be no "defaultOntology" property

  Scenario: Clean settings UI without clutter
    When I view the entire settings panel
    Then the total number of sections should be exactly 2
    And there should be no nested subsections
    And there should be no complex configuration forms
    And the interface should be simple and intuitive

  Scenario: Settings migration handles old configurations
    Given I have an old configuration with legacy settings
    When the plugin loads with old settings
    Then legacy settings should be ignored
    And only debug settings should be preserved
    And no errors should occur during migration