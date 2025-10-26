# language: en
@properties @critical
Feature: Asset Properties Display in AutoLayout

  As an Exocortex user
  I want to see all properties of the current asset in a key-value table
  So that I can replace Obsidian's standard Properties block with richer functionality

  Rule: All frontmatter properties must be displayed

    Scenario: Display simple properties
      Given I have a note "My Task" with frontmatter:
        | Key      | Value       |
        | title    | My Task     |
        | status   | in-progress |
        | priority | high        |
      When AutoLayout renders for "My Task"
      Then I see a properties table with:
        | Property | Value       |
        | title    | My Task     |
        | status   | in-progress |
        | priority | high        |

    Scenario: Display properties with wiki-links
      Given I have a note "Task 1" with frontmatter:
        | Key                 | Value          |
        | exo__Instance_class | [[ems__Task]]  |
        | project             | [[My Project]] |
      When AutoLayout renders for "Task 1"
      Then property "exo__Instance_class" displays "ems__Task" as clickable link
      And property "project" displays "My Project" as clickable link
      And clicking the link navigates to the referenced note

    Scenario: Display array properties
      Given I have a note "Tagged Note" with frontmatter:
        | Key  | Value                  |
        | tags | [work, urgent, review] |
      When AutoLayout renders for "Tagged Note"
      Then property "tags" displays "work, urgent, review"

    Scenario: Display array with wiki-links
      Given I have a note "Multi-ref" with frontmatter:
        | Key       | Value                        |
        | references | [[Note A]], [[Note B]]       |
      When AutoLayout renders for "Multi-ref"
      Then property "references" shows "Note A" as clickable link
      And property "references" shows "Note B" as clickable link

    Scenario: Empty or missing properties
      Given I have a note "Empty Note" with no frontmatter
      When AutoLayout renders for "Empty Note"
      Then properties table is not displayed
      And I only see relations table (if any relations exist)

  Rule: Properties table must be positioned correctly

    Scenario: Properties table before relations table
      Given I have a note with frontmatter and backlinks
      When AutoLayout renders
      Then I see properties table FIRST
      And relations table appears AFTER properties table

    Scenario: Properties table in reading mode only
      Given AutoLayout is enabled
      When I switch to edit/source mode
      Then properties table is hidden
      And only visible in reading/preview mode

  Rule: Link detection and rendering

    Scenario: Detect wiki-link format [[Note]]
      Given property value is "[[My Note]]"
      When value is rendered
      Then value is displayed as clickable link to "My Note"
      And link has class "internal-link"

    Scenario: Detect array with wiki-links
      Given property value is array: ["[[Note A]]", "[[Note B]]"]
      When value is rendered
      Then both "Note A" and "Note B" are clickable links
      And links are separated by commas

    Scenario: Non-link values remain as text
      Given property value is "simple text"
      When value is rendered
      Then value is displayed as plain text (not a link)

    Scenario: Mixed content in arrays
      Given property value is array: ["simple", "[[Note]]", "text"]
      When value is rendered
      Then "simple" is plain text
      And "Note" is a clickable link
      And "text" is plain text

  Rule: Property key formatting

    Scenario: Preserve original property names
      Given properties with keys:
        | Original Key        |
        | exo__Instance_class |
        | simple_name         |
        | CamelCase           |
      When properties table is rendered
      Then all keys are displayed exactly as defined
      And no transformation or normalization occurs

  Rule: Special value handling

    Scenario: Handle null and undefined
      Given property "empty1" has value null
      And property "empty2" has value undefined
      When properties table is rendered
      Then "empty1" displays empty string or "-"
      And "empty2" displays empty string or "-"

    Scenario: Handle boolean values
      Given property "active" has value true
      And property "archived" has value false
      When properties table is rendered
      Then "active" displays "true"
      And "archived" displays "false"

    Scenario: Handle numbers
      Given property "count" has value 42
      And property "price" has value 99.99
      When properties table is rendered
      Then "count" displays "42"
      And "price" displays "99.99"

    Scenario: Handle dates
      Given property "created" has value "2024-01-15"
      When properties table is rendered
      Then "created" displays "2024-01-15"
      And value is plain text (not parsed as date object)
