@layout-rendering @presentation
Feature: Layout Rendering System
  As a user viewing my knowledge assets
  I want the system to render appropriate layouts based on asset classes
  So that I can see relevant information in an organized way

  Background:
    Given the layout system is initialized
    And the following class layouts are available:
      | class         | layout_file              |
      | ems__Project  | Layout - ems__Project.md |
      | ems__Task     | Layout - ems__Task.md    |
      | ems__Area     | Layout - ems__Area.md    |
    And I have test assets of different classes

  @smoke @layout-selection
  Scenario: Selecting appropriate layout for asset class
    Given I have a project asset with class "ems__Project"
    When I view the asset page
    Then the system should select the "Layout - ems__Project.md" layout
    And the layout should be loaded successfully
    And the layout blocks should be identified correctly

  @layout-blocks @component-rendering
  Scenario: Rendering different types of layout blocks
    Given I have a project layout with the following blocks:
      | block_type        | configuration                    |
      | properties        | show: [name, priority, status]   |
      | backlinks         | exclude_self: true               |
      | children_efforts  | group_by: status                 |
      | query             | SELECT ?task WHERE {...}         |
    When I render the layout
    Then each block should render correctly
    And the properties block should show project properties
    And the backlinks block should show related pages
    And the children_efforts block should show task table
    And the query block should show query results

  @error-handling @graceful-degradation
  Scenario: Handling missing layout files
    Given I have an asset with class "ems__CustomClass"
    But no layout file exists for this class
    When I view the asset page
    Then the system should fall back to default layout
    And the default layout should render basic information
    And no errors should be displayed to the user
    And the fallback should be logged for monitoring

  @performance @rendering-optimization
  Scenario: Layout rendering performance requirements
    Given I have a complex layout with 8 different blocks
    When I render the layout
    Then the initial render should complete within 300ms
    And block rendering should be parallelized where possible
    And the DOM updates should be batched
    And memory usage should remain under 50MB

  @responsive-design @adaptive-layouts
  Scenario: Layout adaptation for different screen sizes
    Given I have a project layout
    When I view it on different screen sizes:
      | screen_size | width | expected_columns |
      | mobile      | 320px | 1                |
      | tablet      | 768px | 2                |
      | desktop     | 1200px| 3                |
    Then the layout should adapt appropriately
    And all content should remain accessible
    And no horizontal scrolling should be required

  @dynamic-content @real-time-updates
  Scenario: Dynamic layout updates with real-time data
    Given I have a project layout with live query results
    When the underlying data changes
    Then the affected layout blocks should update automatically
    And the updates should be smooth without flicker
    And unchanged blocks should not re-render
    And the scroll position should be preserved

  @accessibility @inclusive-design
  Scenario: Layout accessibility compliance
    Given I have a complex project layout
    When I navigate it with keyboard only
    Then all interactive elements should be focusable
    And the tab order should be logical
    And focus indicators should be visible
    When I use a screen reader
    Then all content should be properly announced
    And heading hierarchy should be semantic
    And ARIA labels should be appropriate

  @caching @layout-optimization
  Scenario: Layout template caching
    Given layout caching is enabled
    When I view an asset for the first time
    Then the layout template should be loaded and cached
    When I view another asset with the same class
    Then the cached layout template should be used
    And the template loading time should be under 10ms

  @error-recovery @robustness
  Scenario: Recovery from block rendering failures
    Given I have a layout with 5 blocks
    When one block fails to render due to an error
    Then the other blocks should still render successfully
    And the failed block should show an error placeholder
    And the error should be logged for investigation
    And the user should be able to retry the failed block

  @customization @user-preferences
  Scenario: User customization of layout blocks
    Given I have permissions to customize layouts
    When I modify the layout configuration to:
      | block_type       | action  | configuration          |
      | properties       | hide    | N/A                    |
      | custom_query     | add     | SELECT ?related WHERE  |
      | backlinks        | modify  | max_results: 10        |
    And I save the customization
    Then the layout should reflect my changes
    And the customization should persist across sessions
    And other users should see the default layout

  @mobile-optimization @touch-interface
  Scenario: Mobile-optimized layout rendering
    Given I am using the mobile version
    When I view a project layout
    Then buttons should be touch-friendly (minimum 44px)
    And text should be readable without zooming
    And scrolling should be smooth on touch devices
    And loading states should provide haptic feedback
    And the layout should respect mobile performance limits