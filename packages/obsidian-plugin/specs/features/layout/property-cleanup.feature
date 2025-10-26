Feature: Clean Empty Properties

  Background:
    Given I am viewing a note with UniversalLayout

  Rule: Clean button appears only when asset has empty properties

    Scenario: Display Clean button for asset with empty string property
      Given I have an Area "Development" with:
        | Key                 | Value           |
        | exo__Instance_class | [[ems__Area]]   |
        | exo__Asset_uid      | area-123        |
        | emptyProp           | ""              |
        | validProp           | "value"         |
      When I view "Development" with UniversalLayout
      Then I see a "Clean Empty Properties" button

    Scenario: Display Clean button for Task with null property
      Given I have a Task "My Task" with:
        | Key                 | Value                       |
        | exo__Instance_class | [[ems__Task]]               |
        | ems__Effort_status  | [[ems__EffortStatusActive]] |
        | nullProp            | null                        |
      When I view "My Task" with UniversalLayout
      Then I see a "Clean Empty Properties" button

    Scenario: Display Clean button for Project with empty array
      Given I have a Project "My Project" with:
        | Key                 | Value                       |
        | exo__Instance_class | [[ems__Project]]            |
        | ems__Effort_status  | [[ems__EffortStatusActive]] |
        | emptyArray          | []                          |
      When I view "My Project" with UniversalLayout
      Then I see a "Clean Empty Properties" button

    Scenario: NO Clean button when asset has no empty properties
      Given I have an Area "Development" with:
        | Key                 | Value         |
        | exo__Instance_class | [[ems__Area]] |
        | exo__Asset_uid      | area-123      |
        | validProp1          | "value1"      |
        | validProp2          | "value2"      |
      When I view "Development" with UniversalLayout
      Then I do NOT see "Clean Empty Properties" button

    Scenario: Display Clean button for any asset class with empty properties
      Given I have a note "Generic Note" with:
        | Key         | Value      |
        | title       | "My Note"  |
        | emptyProp   | ""         |
        | validProp   | "value"    |
      When I view "Generic Note" with UniversalLayout
      Then I see a "Clean Empty Properties" button

  Rule: Clicking Clean button removes all empty properties

    Scenario: Remove empty string properties
      Given I have an Area "Development" with:
        | Key                 | Value         |
        | exo__Instance_class | [[ems__Area]] |
        | emptyProp1          | ""            |
        | validProp           | "value"       |
        | emptyProp2          | ""            |
      When I click "Clean Empty Properties" button
      Then properties "emptyProp1" and "emptyProp2" are removed
      And property "validProp" is preserved
      And "Clean Empty Properties" button disappears

    Scenario: Remove null properties
      Given I have a Task with:
        | Key                 | Value                       |
        | exo__Instance_class | [[ems__Task]]               |
        | ems__Effort_status  | [[ems__EffortStatusActive]] |
        | nullProp            | null                        |
      When I click "Clean Empty Properties" button
      Then property "nullProp" is removed
      And property "ems__Effort_status" is preserved

    Scenario: Remove multiple types of empty properties
      Given I have a Project with:
        | Key                 | Value            |
        | exo__Instance_class | [[ems__Project]] |
        | emptyString         | ""               |
        | nullProp            | null             |
        | emptyArray          | []               |
        | validProp           | "value"          |
      When I click "Clean Empty Properties" button
      Then properties "emptyString", "nullProp", and "emptyArray" are removed
      And property "validProp" is preserved

    Scenario: Preserve all valid properties
      Given I have an Area with:
        | Key                    | Value                    |
        | exo__Instance_class    | [[ems__Area]]            |
        | exo__Asset_uid         | area-123                 |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]         |
        | emptyProp              | ""                       |
      When I click "Clean Empty Properties" button
      Then property "exo__Instance_class" is preserved
      And property "exo__Asset_uid" is preserved
      And property "exo__Asset_isDefinedBy" is preserved
      And property "emptyProp" is removed

  Rule: Empty property detection

    Scenario Outline: Detect various empty value formats
      Given I have a note with property "testProp" set to <value>
      When I view the note with UniversalLayout
      Then Clean button visibility is <button_visible>

      Examples:
        | value       | button_visible |
        | ""          | visible        |
        | null        | visible        |
        | undefined   | visible        |
        | []          | visible        |
        | {}          | visible        |
        | "   "       | visible        |
        | "value"     | hidden         |
        | 123         | hidden         |
        | true        | hidden         |
