Feature: DynamicLayout Fallback to UniversalLayout
  As a user of the Exocortex plugin
  I want DynamicLayout to gracefully fall back to UniversalLayout
  When no specific ClassLayout is defined for an asset's class
  So that I always see content instead of errors

  Background:
    Given I have an Obsidian vault with the Exocortex plugin
    And I have assets with various class configurations

  Scenario: DynamicLayout falls back to UniversalLayout when no ClassLayout exists
    Given I have an asset "TestAsset" with class "[[CustomClass]]"
    And no ClassLayout file exists for "CustomClass"
    When DynamicLayout is rendered for "TestAsset"
    Then I should see the message "There is no specific Layout for class [[CustomClass]] - UniversalLayout will be used"
    And the UniversalLayout content should be displayed below the message
    And no error message should be shown

  Scenario: DynamicLayout uses specific ClassLayout when it exists
    Given I have an asset "AssetWithLayout" with class "[[ConfiguredClass]]"
    And a ClassLayout file "ClassLayout - ConfiguredClass" exists
    When DynamicLayout is rendered for "AssetWithLayout"
    Then the specific ClassLayout should be rendered
    And no fallback message should be displayed

  Scenario: Fallback message formats class name as wikilink
    Given I have an asset with class "exo__TestClass"
    And no ClassLayout exists for this class
    When DynamicLayout is rendered
    Then the fallback message should contain "[[exo__TestClass]]"
    And not "exo__TestClass" without brackets

  Scenario: UniversalLayout functionality is preserved in fallback
    Given I have an asset with properties and relations
    And no specific ClassLayout exists
    When DynamicLayout falls back to UniversalLayout
    Then all asset properties should be displayed
    And all asset relations should be shown
    And the layout should match UniversalLayout's standard output

  Scenario: Multiple assets without ClassLayouts show consistent fallback
    Given I have multiple assets with different classes
    And none of them have ClassLayout files
    When DynamicLayout is rendered for each asset
    Then each should show its own class name in the fallback message
    And each should render UniversalLayout content correctly