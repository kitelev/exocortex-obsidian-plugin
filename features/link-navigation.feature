Feature: Link Navigation in Asset Relations Tables
  As an Obsidian user
  I want links in asset relation tables to behave like standard web links
  So that keyboard modifiers work correctly and other plugins remain compatible

  Background:
    Given I have the Exocortex plugin installed
    And I have a note with asset relations displayed in a table
    And the table contains clickable links to other notes

  Scenario: Simple click opens link in current tab
    Given I am viewing an asset relations table
    When I click on a link without any modifiers
    Then the linked note should open in the current tab
    And the current tab should navigate to the linked note
    And no new tabs should be created

  Scenario: Cmd+Click opens link in new tab (macOS)
    Given I am using macOS
    And I am viewing an asset relations table
    When I click on a link while holding the Cmd key
    Then the linked note should open in a new tab
    And the current tab should remain unchanged
    And focus should stay on the current tab
    And the event should be properly stopped to prevent double navigation

  Scenario: Ctrl+Click opens link in new tab (Windows/Linux)
    Given I am using Windows or Linux
    And I am viewing an asset relations table
    When I click on a link while holding the Ctrl key
    Then the linked note should open in a new tab
    And the current tab should remain unchanged
    And focus should stay on the current tab
    And the event should be properly stopped to prevent double navigation

  Scenario: Middle mouse button opens link in new tab
    Given I am viewing an asset relations table
    When I click on a link with the middle mouse button
    Then the linked note should open in a new tab
    And the current tab should remain unchanged
    And focus should stay on the current tab

  Scenario: Shift+Click opens link in new window/split
    Given I am viewing an asset relations table
    When I click on a link while holding the Shift key
    Then the linked note should open in a new split pane
    And the current pane should remain unchanged
    And both panes should be visible

  Scenario: Alt+Click shows link context menu
    Given I am viewing an asset relations table
    When I click on a link while holding the Alt key
    Then the link context menu should appear
    And the menu should contain standard Obsidian link options
    And no navigation should occur

  Scenario: Link compatibility with other plugins
    Given I have other plugins that enhance link behavior installed
    And I am viewing an asset relations table
    When I interact with a link
    Then the link should emit standard DOM events
    And other plugins should be able to intercept these events
    And the link should not use proprietary event handling

  Scenario: Preventing default browser behavior
    Given I am viewing an asset relations table
    And the link has an href attribute
    When I click on the link with Cmd/Ctrl held
    Then preventDefault should be called on the event
    And stopPropagation should be called on the event
    And the browser should not navigate to the href
    And only Obsidian navigation should occur

  Scenario: Touch device link behavior
    Given I am using a touch device
    And I am viewing an asset relations table
    When I tap on a link
    Then the linked note should open in the current tab
    And long press should show the context menu
    And swipe gestures should work as expected

  Scenario: Keyboard navigation accessibility
    Given I am viewing an asset relations table
    And a link has keyboard focus
    When I press Enter
    Then the linked note should open in the current tab
    When I press Cmd+Enter (or Ctrl+Enter)
    Then the linked note should open in a new tab
    And the current tab should remain unchanged

  Scenario: Link hover preview compatibility
    Given I have hover preview enabled
    And I am viewing an asset relations table
    When I hover over a link
    Then the hover preview should appear
    And Cmd+hover should show the preview
    And the preview should not interfere with click behavior

  Scenario: Rapid link clicking
    Given I am viewing an asset relations table
    When I rapidly click multiple links with Cmd held
    Then each link should open in a separate new tab
    And no tabs should replace the current tab
    And all navigation events should be handled correctly
    And no race conditions should occur