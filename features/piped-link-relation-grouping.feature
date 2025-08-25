Feature: Piped Link Relation Grouping
  As a user of the Exocortex plugin
  I want piped links to be correctly grouped with regular links
  When they reference the same target asset through the same property
  So that all related assets appear in the correct relation groups

  Background:
    Given I have an Obsidian vault with the Exocortex plugin
    And I have an asset "User Interface" with class "[[ims__Concept]]"

  Scenario: Regular link and piped link to same target should group together
    Given I have an asset "GUI" with property "ims__Concept_broader" containing "[[User Interface]]"
    And I have an asset "TUI" with property "ims__Concept_broader" containing "[[User Interface|User Interface]]"
    When UniversalLayout or DynamicLayout renders relations for "User Interface"
    Then both "GUI" and "TUI" should appear in the "ims__Concept_broader" group
    And neither should appear in "Untyped Relations"

  Scenario: Various piped link formats should be recognized
    Given I have assets with different link formats to "User Interface":
      | Asset | Property              | Link Format                              |
      | GUI   | ims__Concept_broader  | [[User Interface]]                       |
      | TUI   | ims__Concept_broader  | [[User Interface\|User Interface]]       |
      | CLI   | ims__Concept_broader  | [[User Interface\|UI]]                   |
      | VUI   | ims__Concept_broader  | [[User Interface\|Voice UI]]             |
    When relations are collected for "User Interface"
    Then all four assets should be in the "ims__Concept_broader" group
    And no assets should be in "Untyped Relations"

  Scenario: Piped links with path should be recognized
    Given I have an asset "WebUI" with property "ims__Concept_broader" containing "[[concepts/User Interface|UI]]"
    And the "User Interface" asset is at path "concepts/User Interface.md"
    When relations are collected for "User Interface"
    Then "WebUI" should appear in the "ims__Concept_broader" group
    And not in "Untyped Relations"

  Scenario: Mixed regular and piped links in array should all be recognized
    Given I have an asset "MultiUI" with property "ims__Concept_related" containing:
      | [[User Interface]]           |
      | [[User Interface\|UI]]       |
      | [[Another Asset]]            |
    When relations are collected for "User Interface"
    Then "MultiUI" should appear once in the "ims__Concept_related" group
    And the property should be correctly identified for all link formats

  Scenario: Piped links in different properties should group separately
    Given I have an asset "ChildUI" with property "ims__Concept_broader" containing "[[User Interface|Parent UI]]"
    And I have an asset "RelatedUI" with property "ims__Concept_related" containing "[[User Interface|Related]]"
    When relations are collected for "User Interface"
    Then "ChildUI" should appear in the "ims__Concept_broader" group
    And "RelatedUI" should appear in the "ims__Concept_related" group
    And neither should appear in "Untyped Relations"

  Scenario: Body links vs frontmatter piped links should be distinguished
    Given I have an asset "DocUI" with body text containing "[[User Interface|UI Documentation]]"
    And I have an asset "MetaUI" with property "ims__Concept_broader" containing "[[User Interface|Parent]]"
    When relations are collected for "User Interface"
    Then "DocUI" should appear in "Untyped Relations"
    And "MetaUI" should appear in "ims__Concept_broader"
    And they should not be grouped together

  Scenario: Complex paths with spaces and piped links
    Given "User Interface" is at path "03 Knowledge/concepts/User Interface.md"
    And I have an asset "TouchUI" with property "ims__Concept_broader" containing "[[03 Knowledge/concepts/User Interface|Touch UI Parent]]"
    When relations are collected for "User Interface"
    Then "TouchUI" should appear in the "ims__Concept_broader" group
    And the path with spaces should be correctly handled