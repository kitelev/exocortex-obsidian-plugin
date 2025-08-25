@mobile @platform @ios @android
Feature: Mobile Platform Support
  As a mobile user of Obsidian
  I want the Exocortex plugin to work seamlessly on my mobile device
  So that I can manage my knowledge graph on the go

  Background:
    Given the Exocortex plugin is installed and activated
    And I am using a mobile device

  @ios @happy-path
  Scenario: iOS Platform Detection and Optimization
    Given I am using an iOS device
    When the plugin initializes
    Then it should detect the iOS platform correctly
    And it should apply iOS-specific optimizations
    And it should support safe area insets
    And it should enable smooth scrolling with -webkit-overflow-scrolling
    And it should disable text selection callout where appropriate

  @android @happy-path
  Scenario: Android Platform Detection and Optimization
    Given I am using an Android device
    When the plugin initializes
    Then it should detect the Android platform correctly
    And it should apply Android-specific optimizations
    And it should handle hardware back button appropriately
    And it should optimize for various screen densities

  @tablet @happy-path
  Scenario: Tablet Optimization
    Given I am using a tablet device
    When the plugin initializes
    Then it should detect the tablet form factor
    And it should use tablet-optimized layouts
    And it should provide larger hit targets for touch
    And it should utilize the larger screen real estate effectively

  @viewport @responsive
  Scenario: Responsive Viewport Adaptation
    Given I am using a mobile device with viewport "<viewport>"
    When I open any Exocortex modal or interface
    Then the UI should adapt to the screen size
    And all interactive elements should be properly sized
    And content should be readable without horizontal scrolling
    And navigation should be accessible

    Examples:
      | viewport                    |
      | 320x568 (iPhone SE)        |
      | 375x667 (iPhone 8)         |
      | 414x896 (iPhone XR)        |
      | 768x1024 (iPad Portrait)   |
      | 1024x768 (iPad Landscape)  |

  @orientation
  Scenario: Device Orientation Changes
    Given I am using a mobile device
    And the plugin interface is open
    When I rotate the device from portrait to landscape
    Then the UI should adapt to the new orientation
    And all functionality should remain accessible
    And no content should be cut off or become inaccessible
    When I rotate back to portrait
    Then the UI should adapt back correctly

  @memory @low-memory
  Scenario: Low Memory Device Performance
    Given I am using a device with limited memory (2GB or less)
    When I perform resource-intensive operations
    Then the plugin should implement memory-aware optimizations
    And it should reduce batch sizes for large operations
    And it should implement lazy loading where appropriate
    And it should not cause the app to crash due to memory pressure

  @connectivity @offline
  Scenario: Poor Network Connectivity Handling
    Given I am using a mobile device with poor connectivity
    When the plugin needs to perform operations
    Then it should gracefully handle network timeouts
    And it should provide offline functionality where possible
    And it should cache data appropriately for offline use
    And it should show appropriate loading states

  @battery @power-saving
  Scenario: Battery Optimization
    Given I am using a mobile device with low battery (< 20%)
    When the plugin detects low battery conditions
    Then it should reduce non-essential animations
    And it should minimize background processing
    And it should defer non-critical operations
    And it should provide power-saving mode options

  @error-handling @mobile-specific
  Scenario: Mobile-Specific Error Handling
    Given I am using a mobile device
    When an error occurs in the plugin
    Then error messages should be mobile-friendly
    And they should not require horizontal scrolling
    And they should provide clear next steps
    And they should not interfere with system navigation

  @performance @benchmarking
  Scenario: Mobile Performance Benchmarking
    Given I am using a mobile device
    When I measure plugin performance
    Then initial load time should be under 3 seconds on average mobile hardware
    And UI interactions should respond within 100ms
    And memory usage should stay below 50MB under normal usage
    And the plugin should not impact Obsidian's startup time by more than 500ms

  @accessibility @mobile-a11y
  Scenario: Mobile Accessibility Compliance
    Given I am using a mobile device with accessibility features enabled
    When I interact with the plugin
    Then all interactive elements should be accessible via screen reader
    And touch targets should meet minimum size requirements (44px)
    And color contrast should meet WCAG AA standards
    And focus management should work properly with assistive technologies

  @degradation @graceful-fallback
  Scenario: Graceful Degradation on Unsupported Features
    Given I am using an older mobile device or browser
    When the plugin encounters unsupported features
    Then it should fall back to basic functionality gracefully
    And it should not break core functionality
    And it should provide appropriate user feedback about limitations
    And it should continue to provide value even with reduced capabilities