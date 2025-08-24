Feature: Universal Layout Block Ordering
  As a user of the Exocortex plugin
  I want the "Untyped Relations" block to appear last
  So that typed relationships are prioritized in the display

  Background:
    Given I have the Exocortex plugin installed
    And I have a vault with semantic assets

  Scenario: Untyped Relations block appears last
    Given I have an asset "Project Alpha" of class "ems__Project"
    And the asset has typed relations to other assets
    And the asset has untyped backlinks from various notes
    When I view "Project Alpha" without a custom layout
    Then the UniversalLayout should be rendered
    And the "Untyped Relations" block should appear last
    And typed relation blocks should appear before untyped

  Scenario: Order of typed relation blocks
    Given I have an asset with multiple typed relations
    When UniversalLayout renders the asset
    Then the display order should be:
      | Block Type          | Order |
      | Typed Relations     | First |
      | Other Blocks        | Middle |
      | Untyped Relations   | Last  |

  Scenario: Empty untyped relations still appears last
    Given an asset has only typed relations
    And no untyped backlinks exist
    When UniversalLayout renders the asset
    Then the "Untyped Relations" block should still be positioned last
    Even if it displays "No untyped relations found"

  Scenario: Only untyped relations present
    Given an asset has only untyped backlinks
    And no typed relations exist
    When UniversalLayout renders the asset
    Then the "Untyped Relations" block should be the only block
    And it should display all untyped backlinks

  Scenario: Block ordering with custom properties
    Given an asset has custom layout properties
    But no custom ClassLayout defined
    When UniversalLayout is used as fallback
    Then typed blocks should render first
    And "Untyped Relations" should render last
    Regardless of property configuration

  Scenario: Consistent ordering across asset classes
    Given assets of different classes without custom layouts
    When each asset is rendered with UniversalLayout
    Then all should have "Untyped Relations" as the last block
    Ensuring consistent user experience

  Scenario: Performance with reordered blocks
    Given a large asset with many relations
    When UniversalLayout renders with new ordering
    Then rendering performance should not degrade
    And the block order should be maintained