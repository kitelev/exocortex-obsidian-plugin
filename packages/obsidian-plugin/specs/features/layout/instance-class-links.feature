# language: en
@instance-class @critical
Feature: Clickable Instance Class Links

  As an Exocortex plugin user
  I want to see Instance Class as clickable links
  So that I can quickly navigate to ontology class definitions

  Rule: Instance Class is always displayed as internal-link

    Scenario: Simple Instance Class value
      Given a note "Task" exists with metadata:
        | Property            | Value         |
        | exo__Instance_class | [[ems__Task]] |
      And a class note "ems__Task" exists
      When I add a Universal Layout table to another note
      And note "Task" is displayed in the table
      Then in column "exo__Instance_class" I see:
        | Element | Value         |
        | Tag     | <a>           |
        | Text    | ems__Task     |
        | Class   | internal-link |
        | href    | ems__Task     |
      And I do NOT see text "[[ems__Task]]"
      And I do NOT see symbols "[[" or "]]"

    Scenario: Array of Instance Class values
      Given a note "Hybrid Object" exists with metadata:
        | Property            | Value                             |
        | exo__Instance_class | [[ems__Task]], [[ems__Document]]  |
      When note "Hybrid Object" is displayed in the table
      Then in column "exo__Instance_class" I see element <a>
      And element <a> contains text "ems__Task"
      And element <a> has class "internal-link"
      # Note: Only the first value from array is displayed

    Scenario: Click on Instance Class link
      Given a note "Task 1" exists with Instance Class "[[ems__Task]]"
      And class file "ems__Task.md" exists
      And note "Task 1" is displayed in Universal Layout table
      When I click on link "ems__Task" in column "exo__Instance_class"
      Then note "ems__Task" opens
      And I see ems__Task class definition

    Scenario: Missing Instance Class
      Given a note "No Class" exists without metadata
      When note "No Class" is displayed in the table
      Then in column "exo__Instance_class" I see text "-"
      And I do NOT see element <a>

    Scenario: Instance Class with prefix
      Given a note "EMS Project" exists with metadata:
        | Property            | Value            |
        | exo__Instance_class | [[ems__Project]] |
      When the note is displayed in the table
      Then Instance Class link contains full name "ems__Project"
      And prefix "ems__" is preserved in link text

  Rule: Instance Class in grouped tables

    Scenario: Grouping by Instance Class
      Given notes exist:
        | Name      | exo__Instance_class |
        | Task 1    | [[ems__Task]]       |
        | Task 2    | [[ems__Task]]       |
        | Project 1 | [[ems__Project]]    |
      When I add a block with configuration:
        """yaml
        layout: table
        groupByProperty: true
        showProperties:
          - exo__Instance_class
        """
      Then I see group "ems__Task" with 2 notes
      And I see group "ems__Project" with 1 note
      And in each group column "exo__Instance_class" contains clickable links

    Scenario: Instance Class in group header
      Given notes exist with Instance Class "[[ems__Task]]"
      And grouping by properties is enabled
      When grouped table is rendered
      Then group header may contain link to "ems__Task"
      And link in header is also clickable

  Rule: Instance Class formatting

    Scenario: Remove wiki-link syntax
      Given Instance Class value in frontmatter: "[[ems__Task]]"
      When value is processed for display
      Then result is: "ems__Task"
      And does NOT contain "[[" or "]]"

    Scenario: Handle empty values
      Given note has Instance Class with value:
        | Input value | Displayed result |
        | null        | -                |
        | undefined   | -                |
        | ""          | -                |
        | []          | -                |
      Then for all empty values "-" is displayed
      And element <a> is NOT created

    Scenario: Handle incorrect values
      Given note has Instance Class: "simple-text-without-brackets"
      When value is displayed in the table
      Then link is created with text "simple-text-without-brackets"
      And link remains clickable
      # Note: Even without brackets value is processed as a link
