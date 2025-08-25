Feature: Filter archived assets from UniversalLayout and DynamicLayout
  As a knowledge worker using Exocortex
  I want archived assets to be hidden from UniversalLayout and DynamicLayout views
  So that I can focus on active, relevant assets without clutter from archived items

  Background:
    Given I have the Exocortex plugin installed
    And I have a mix of active and archived assets in my vault
    And archived assets have the property "archived: true" in their frontmatter

  Scenario: Hide archived assets in UniversalLayout
    Given I have 5 active assets and 3 archived assets related to the current note
    When I view the current note with UniversalLayout
    Then I should see only the 5 active assets in the relations table
    And the 3 archived assets should not be displayed
    And the count should show "5 relations" not "8 relations"

  Scenario: Hide archived assets in DynamicLayout
    Given I have a note with DynamicLayout configuration
    And there are 10 related assets, 4 of which are archived
    When the DynamicLayout renders
    Then only 6 active assets should be visible
    And archived assets should be filtered out completely
    And no empty sections should be shown for archived assets

  Scenario: Handle various archived property formats
    Given I have assets with different archived property formats:
      | Asset Name    | Archived Property Value |
      | Asset1        | true                   |
      | Asset2        | "true"                 |
      | Asset3        | yes                    |
      | Asset4        | 1                      |
      | Asset5        | false                  |
      | Asset6        | (not set)              |
    When I view them in UniversalLayout
    Then Asset1, Asset2, Asset3, and Asset4 should be hidden
    And Asset5 and Asset6 should be visible

  Scenario: Archived assets in grouped relations
    Given I have relations grouped by property
    And each group contains both active and archived assets
    When I view the UniversalLayout with groupByProperty enabled
    Then each group should only show active assets
    And groups containing only archived assets should not be displayed
    And group headers should reflect the count of active assets only

  Scenario: Performance with large numbers of archived assets
    Given I have 1000 assets where 800 are archived
    When I view the UniversalLayout
    Then only the 200 active assets should be displayed
    And the filtering should complete within 500ms
    And memory usage should remain reasonable

  Scenario: Archived filtering in table layout mode
    Given I have UniversalLayout configured with layout: "table"
    And I have 15 assets where 5 are archived
    When the table renders
    Then the table should have 10 rows (excluding header)
    And archived assets should not appear in any column
    And sorting should only affect visible active assets

  Scenario: Archived filtering in cards layout mode
    Given I have UniversalLayout configured with layout: "cards"
    And I have 12 assets where 3 are archived
    When the cards render
    Then exactly 9 cards should be displayed
    And no placeholder cards for archived assets should exist
    And card grid should adjust to show only active assets

  Scenario: Archived filtering with limit parameter
    Given I have UniversalLayout with limit: 5
    And I have 10 active assets and 5 archived assets
    When the layout renders
    Then exactly 5 active assets should be shown
    And the limit should apply after filtering archived assets
    And archived assets should not count toward the limit

  Scenario: Empty state when all assets are archived
    Given all related assets have archived: true
    When I view the UniversalLayout
    Then I should see a message "No active relations found"
    And the message should be different from "No relations found"
    And the UI should gracefully handle the empty state

  Scenario: Archived assets should not affect sorting
    Given I have assets sorted by modified date
    And some assets in between are archived
    When the sorting is applied
    Then archived assets should be filtered before sorting
    And the sort order should be correct for visible assets only
    And archived assets should not create gaps in the display

  Scenario: Dynamic toggling of archived visibility (future enhancement)
    Given I have a toggle option "Show archived" (future feature)
    When I toggle it on
    Then archived assets should become visible with visual distinction
    And when I toggle it off
    Then archived assets should be hidden again

  Scenario: Archived filtering in BacklinksBlock
    Given I have backlinks where some linking notes are archived
    When I view the BacklinksBlock
    Then only backlinks from non-archived notes should show
    And the count should reflect only active backlinks
    And archived notes should not appear in the list

  Scenario: Consistent filtering across all renderers
    Given I have the same set of assets with some archived
    When I view them in different renderers:
      | Renderer                    |
      | UniversalLayoutRenderer     |
      | RefactoredUniversalLayoutRenderer |
      | DynamicLayoutRenderer       |
      | BaseAssetRelationsRenderer  |
    Then all renderers should filter archived assets consistently
    And the displayed count should be the same across all views