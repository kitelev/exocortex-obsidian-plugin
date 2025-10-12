Feature: Repair Folder Button
  As a user
  I want to automatically move misplaced assets to correct folders
  So that my vault organization matches the semantic relationships

  Background:
    Given I have an Obsidian vault
    And the plugin is installed and active

  Scenario: Display repair button when asset is in wrong folder
    Given I have an asset with exo__Asset_isDefinedBy property
    And the referenced asset is in a different folder
    And the current asset is NOT in the same folder as the referenced asset
    When I view the asset in reading mode
    Then I should see the "Repair Folder" button
    And the button should show the target folder in tooltip

  Scenario: Hide repair button when asset is in correct folder
    Given I have an asset with exo__Asset_isDefinedBy property
    And the referenced asset is in folder "path/to/folder"
    And the current asset is also in folder "path/to/folder"
    When I view the asset in reading mode
    Then I should NOT see the "Repair Folder" button

  Scenario: Hide repair button when exo__Asset_isDefinedBy is missing
    Given I have an asset without exo__Asset_isDefinedBy property
    When I view the asset in reading mode
    Then I should NOT see the "Repair Folder" button

  Scenario: Hide repair button when referenced file does not exist
    Given I have an asset with exo__Asset_isDefinedBy pointing to "[[NonExistent]]"
    And the file "NonExistent.md" does not exist in the vault
    When I view the asset in reading mode
    Then I should NOT see the "Repair Folder" button

  Scenario: Move asset to correct folder on button click
    Given I have an asset in folder "wrong/path"
    And the asset has exo__Asset_isDefinedBy pointing to "[[Reference]]"
    And "Reference.md" exists in folder "correct/path"
    And I view the asset in reading mode
    And I see the "Repair Folder" button
    When I click the "Repair Folder" button
    Then the asset should be moved to folder "correct/path"
    And the button should disappear
    And the asset path should be "correct/path/asset.md"

  Scenario: Handle folder creation when target folder does not exist
    Given I have an asset in folder "old/path"
    And the asset has exo__Asset_isDefinedBy pointing to "[[Reference]]"
    And "Reference.md" exists in folder "new/nested/path"
    And the folder "new/nested/path" does not exist
    When I click the "Repair Folder" button
    Then the folder "new/nested/path" should be created
    And the asset should be moved to "new/nested/path"

  Scenario: Prevent move when target file already exists
    Given I have an asset "task.md" in folder "old/path"
    And the asset has exo__Asset_isDefinedBy pointing to "[[Reference]]"
    And "Reference.md" exists in folder "new/path"
    And a file "task.md" already exists in folder "new/path"
    When I click the "Repair Folder" button
    Then I should see an error message
    And the asset should remain in "old/path"

  Scenario: Handle wiki-link format variations
    Given I have an asset with exo__Asset_isDefinedBy: "[[Reference]]"
    When the system extracts the reference
    Then it should resolve to "Reference"

  Scenario: Handle quoted wiki-link format
    Given I have an asset with exo__Asset_isDefinedBy: "\"[[Reference]]\""
    When the system extracts the reference
    Then it should resolve to "Reference"

  Scenario: Handle plain text reference format
    Given I have an asset with exo__Asset_isDefinedBy: "Reference"
    When the system extracts the reference
    Then it should resolve to "Reference"

  Scenario: Normalize paths for comparison
    Given I have an asset in folder "path/to/folder/"
    And the referenced asset is in folder "path/to/folder"
    When comparing folder paths
    Then they should be considered equal
    And the repair button should NOT appear

  Scenario: Handle root folder assets
    Given I have an asset in root folder ""
    And the asset has exo__Asset_isDefinedBy pointing to a file in root
    When I view the asset in reading mode
    Then I should NOT see the "Repair Folder" button

  Scenario: Button positioning in layout
    Given I have an asset that needs folder repair
    When I view the asset in reading mode
    Then the "Repair Folder" button should appear after "Clean Empty Properties" button
    And the "Repair Folder" button should appear before the properties table

  Scenario: Refresh UI after folder repair
    Given I have an asset in wrong folder
    And I can see the "Repair Folder" button
    When I click the "Repair Folder" button
    And the move operation completes successfully
    Then the UI should refresh after 100ms delay
    And the button should no longer be visible
    And the properties should reflect the new location
