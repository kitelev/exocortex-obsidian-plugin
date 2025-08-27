Feature: Dynamic Layout Default Layout Resolution
  As an Obsidian user with semantic knowledge management
  I want DynamicLayout to respect the exo__Class_defaultLayout property
  So that classes can explicitly define their preferred layout without search overhead

  Background:
    Given the Exocortex plugin is installed and active
    And I have a vault with class definitions and layouts

  Scenario: Class with defaultLayout property uses specified layout directly
    Given a class "exo__Class" exists with metadata:
      | property                  | value                                        |
      | exo__Instance_class      | [[exo__Class]]                               |
      | exo__Class_defaultLayout | [[87e5629f-b6c2-485f-a0a3-7b3abe119872]]   |
    And a ClassLayout file "87e5629f-b6c2-485f-a0a3-7b3abe119872.md" exists with:
      | property                        | value                |
      | exo__Instance_class            | [[ui__ClassLayout]]  |
      | ui__ClassLayout_relationsToShow| [[exo__Property_domain]], [[exo__Property_range]] |
    When DynamicLayoutRenderer processes the "exo__Class" file
    Then the layout "87e5629f-b6c2-485f-a0a3-7b3abe119872" should be loaded directly
    And no file iteration should occur
    And no "UniversalLayout will be used" message should appear
    And the configured relations should be displayed

  Scenario: Class without defaultLayout falls back to search logic
    Given a class "exo__Asset" exists with metadata:
      | property             | value          |
      | exo__Instance_class | [[exo__Asset]] |
    And no exo__Class_defaultLayout property is defined
    When DynamicLayoutRenderer processes the "exo__Asset" file
    Then the existing search logic should execute
    And ClassLayout files should be iterated
    And an appropriate layout should be found or UniversalLayout used

  Scenario: Class with invalid defaultLayout UUID falls back gracefully
    Given a class "test__Class" exists with metadata:
      | property                  | value                          |
      | exo__Instance_class      | [[test__Class]]                |
      | exo__Class_defaultLayout | [[non-existent-uuid-12345]]   |
    When DynamicLayoutRenderer processes the "test__Class" file
    Then the direct UUID lookup should fail gracefully
    And the system should fall back to existing search logic
    And no errors should be thrown
    And an appropriate message should be logged

  Scenario: Performance optimization with defaultLayout
    Given a vault with 1000 ClassLayout files
    And a class "perf__TestClass" with metadata:
      | property                  | value                    |
      | exo__Instance_class      | [[perf__TestClass]]      |
      | exo__Class_defaultLayout | [[test-layout-uuid-789]] |
    And the layout file "test-layout-uuid-789.md" exists
    When DynamicLayoutRenderer processes the "perf__TestClass" file
    Then layout resolution should complete in less than 10ms
    And no file iteration through all 1000 files should occur
    And only a single file lookup should be performed

  Scenario: Layout referenced by both UUID and frontmatter UID
    Given a class "uid__TestClass" with defaultLayout "[[abc-def-123]]"
    And a ClassLayout file exists with:
      | property         | value               |
      | exo__Asset_uid  | abc-def-123         |
      | exo__Instance_class | [[ui__ClassLayout]] |
    When DynamicLayoutRenderer processes the class
    Then the layout should be found by UID lookup
    And the correct layout configuration should be loaded

  Scenario: Backward compatibility with existing layout resolution
    Given existing classes without defaultLayout property:
      | className      | layoutFile              |
      | ems__Area     | Layout - ems__Area.md   |
      | ims__Concept  | ClassLayout - ims__Concept.md |
    When DynamicLayoutRenderer processes each class
    Then all existing layout mappings should continue working
    And filename pattern matching should still function
    And ui__ClassLayout_for property should still be respected