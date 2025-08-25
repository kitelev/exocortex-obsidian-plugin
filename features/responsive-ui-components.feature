@ui @responsive @mobile @components
Feature: Responsive UI Components
  As a user on various devices and screen sizes
  I want the Exocortex plugin UI to adapt seamlessly to my screen
  So that I can use all functionality regardless of my device

  Background:
    Given the Exocortex plugin is installed and activated
    And I am using a device with varying screen dimensions

  @responsive @layout @mobile-first
  Scenario: Mobile-First Responsive Layout
    Given I am using a mobile device with screen width "<width>"
    When I open any Exocortex interface
    Then the layout should be optimized for mobile interaction
    And all content should be readable without horizontal scrolling
    And interactive elements should be appropriately sized for touch
    And navigation should be easily accessible

    Examples:
      | width | device_type     |
      | 320px | Small Phone     |
      | 375px | Standard Phone  |
      | 414px | Large Phone     |
      | 768px | Tablet Portrait |

  @responsive @breakpoints @adaptive
  Scenario: Responsive Breakpoint Transitions
    Given the plugin interface is displayed
    When I change the screen size from mobile to tablet
    Then the layout should smoothly transition between breakpoints
    And content should reorganize appropriately
    And no functionality should be lost during transitions
    When I change from tablet to desktop size
    Then the layout should utilize the additional space effectively
    And advanced features should become available if applicable

  @responsive @typography @readability
  Scenario: Responsive Typography and Readability
    Given I am viewing text content in the plugin
    When I use different screen sizes
    Then font sizes should scale appropriately for readability
    And line height should maintain optimal reading experience
    And text should never be too small to read comfortably
    When I zoom in on mobile browsers
    Then text should remain properly sized and formatted

  @responsive @navigation @adaptive-menus
  Scenario: Adaptive Navigation Systems
    Given the plugin has navigation menus
    When I am on a mobile device
    Then navigation should collapse into a mobile-friendly format
    And menu items should be easily tappable
    And sub-menus should be accessible without overlapping content
    When I am on a larger screen
    Then navigation should expand to utilize available space
    And all options should be visible when appropriate

  @responsive @tables @data-display
  Scenario: Responsive Data Tables and Lists
    Given I am viewing data tables or property lists
    When I am on a mobile device
    Then tables should transform into mobile-friendly card layouts
    And all data should remain accessible
    And scrolling should be optimized for touch
    When I am on a tablet or desktop
    Then tabular data should display in traditional table format
    And column widths should be optimized for content

  @responsive @forms @input-optimization
  Scenario: Responsive Form Design and Input Optimization
    Given I am interacting with forms in the plugin
    When I am on a mobile device
    Then form fields should be properly sized for touch input
    And keyboard should optimize for the input type
    And form validation messages should be mobile-friendly
    When I am on a larger device
    Then forms should utilize available space efficiently
    And multiple-column layouts should be used when appropriate

  @responsive @modals @dialogs
  Scenario: Responsive Modal Dialogs and Overlays
    Given a modal dialog is displayed
    When I am on a mobile device
    Then the modal should occupy most or all of the screen
    And close/dismiss actions should be easily accessible
    And scrolling should work properly within the modal
    When I am on a larger screen
    Then the modal should be appropriately sized for the content
    And should not be too large or too small for the screen

  @responsive @images @media
  Scenario: Responsive Images and Media Content
    Given the plugin displays images or media content
    When I view content on different screen sizes
    Then images should scale appropriately to fit the screen
    And aspect ratios should be maintained
    And loading performance should be optimized for the device
    When bandwidth is limited on mobile
    Then appropriate image optimization should be applied

  @responsive @spacing @touch-targets
  Scenario: Responsive Spacing and Touch Targets
    Given interactive elements are displayed
    When I am using a touch device
    Then all interactive elements should meet minimum touch target sizes (44px)
    And spacing between elements should prevent accidental taps
    And comfortable padding should be applied around interactive areas
    When I am using precise pointing devices
    Then spacing can be more compact while remaining usable

  @responsive @performance @optimization
  Scenario: Performance Optimization Across Devices
    Given I am using devices with varying capabilities
    When the plugin loads and operates
    Then performance should be optimized for the device capabilities
    And animations should be reduced on lower-powered devices
    And resource usage should be appropriate for the device
    And loading times should be optimized for the connection type

  @responsive @orientation @rotation
  Scenario: Orientation-Aware Responsive Design
    Given I am using a mobile device
    When I rotate from portrait to landscape orientation
    Then the layout should adapt to the new aspect ratio
    And content should reflow appropriately
    And navigation should remain accessible
    When I rotate back to portrait
    Then the layout should return to portrait optimization

  @responsive @density @high-dpi
  Scenario: High-DPI and Pixel Density Support
    Given I am using a high-DPI display device
    When the plugin renders content
    Then all graphics and icons should appear crisp
    And text should render clearly at high resolutions
    And touch targets should account for pixel density
    And performance should remain optimal despite higher pixel counts

  @responsive @accessibility @inclusive
  Scenario: Responsive Accessibility Features
    Given I am using assistive technologies on various devices
    When I interact with responsive components
    Then screen readers should work correctly across all breakpoints
    And keyboard navigation should remain functional
    And color contrast should meet standards on all screen types
    And focus indicators should be visible on all device types

  @responsive @customization @user-preferences
  Scenario: User-Customizable Responsive Behavior
    Given I want to customize the responsive behavior
    When I access responsive settings
    Then I should be able to set preferred breakpoints
    And I should be able to override automatic responsive behavior
    And I should be able to force desktop or mobile layouts
    When I have specific accessibility needs
    Then responsive behavior should accommodate my requirements

  @responsive @edge-cases @extreme-sizes
  Scenario: Edge Cases and Extreme Screen Sizes
    Given I am using devices with unusual screen dimensions
    When I use very narrow screens (< 320px)
    Then the interface should still be functional
    And core features should remain accessible
    When I use very wide screens (> 2560px)
    Then the layout should not become excessively stretched
    And content should be appropriately contained or distributed

  @responsive @testing @validation
  Scenario: Responsive Design Validation
    Given I need to verify responsive behavior
    When I test the plugin across multiple devices
    Then all functionality should work consistently
    And visual design should remain cohesive
    And performance should meet standards on all tested devices
    And user experience should be optimal for each device category