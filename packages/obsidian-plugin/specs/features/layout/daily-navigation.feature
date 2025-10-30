Feature: Daily Note Navigation
  As a user viewing daily notes
  I want to navigate between consecutive days
  So that I can quickly move through my daily notes

  Background:
    Given the Exocortex plugin is enabled
    And I have daily notes for consecutive days

  Scenario: Navigation links appear at top of DailyNote layout
    Given I open a daily note "2025-10-16"
    Then I should see navigation links at the very top of the layout
    And the navigation should appear above the Properties section
    And the previous day link should show "← 2025-10-15"
    And the next day link should show "2025-10-17 →"

  Scenario: Navigation links do not appear for non-DailyNote assets
    Given I open a task note
    Then I should not see daily navigation links

  Scenario: Navigation links are positioned correctly
    Given I open a daily note "2025-10-16"
    When the layout renders
    Then the navigation container should be the first element
    And it should appear before the Properties section
    And it should appear before the Action Buttons section
    And it should appear before all other content sections

  Scenario: Previous day link calculates date correctly
    Given I open a daily note "2025-10-16"
    Then the previous day link should point to "2025-10-15"
    And the link should use wikilink format

  Scenario: Next day link calculates date correctly
    Given I open a daily note "2025-10-16"
    Then the next day link should point to "2025-10-17"
    And the link should use wikilink format

  Scenario: Navigation handles month boundaries
    Given I open a daily note "2025-11-01"
    Then the previous day link should show "2025-10-31"
    And the next day link should show "2025-11-02"

  Scenario: Navigation handles year boundaries
    Given I open a daily note "2026-01-01"
    Then the previous day link should show "2025-12-31"
    And the next day link should show "2026-01-02"

  Scenario: Navigation gracefully handles missing day property
    Given I have a DailyNote without "pn__DailyNote_day" property
    When I open that daily note
    Then navigation links should not render
    And no error should be displayed
    And other sections should render normally

  Scenario: Navigation has proper mobile touch targets
    Given I open a daily note on a mobile device
    Then each navigation link should have a minimum touch target of 44px
    And the links should be easily tappable

  Scenario: Navigation has proper styling
    Given I open a daily note "2025-10-16"
    Then the navigation container should have consistent Exocortex styling
    And it should use the secondary background color
    And links should have hover effects
    And the container should have proper spacing and padding

  Scenario: Navigation links use internal-link class
    Given I open a daily note "2025-10-16"
    Then the previous day link should have class "internal-link"
    And the next day link should have class "internal-link"
    And the links should have proper data-href attributes

  Scenario: Navigation recognizes DailyNote in array format
    Given I have a DailyNote with "exo__Instance_class" as an array containing "[[pn__DailyNote]]"
    When I open that daily note
    Then navigation links should render correctly

  Scenario: Navigation recognizes DailyNote without brackets
    Given I have a DailyNote with "exo__Instance_class" set to "pn__DailyNote" (without brackets)
    When I open that daily note
    Then navigation links should render correctly

  Scenario: Navigation parses wikilink date format
    Given I have a DailyNote with "pn__DailyNote_day" set to "[[2025-10-16]]"
    When I open that daily note
    Then the date should be parsed correctly as "2025-10-16"
    And navigation links should calculate from that date

  Scenario: Navigation handles invalid date format gracefully
    Given I have a DailyNote with invalid "pn__DailyNote_day" format
    When I open that daily note
    Then navigation links should not render
    And no error should be displayed
