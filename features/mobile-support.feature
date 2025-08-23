@mobile
Feature: Mobile Device Support
  As a mobile user
  I want full Exocortex functionality on my phone/tablet
  So that I can manage knowledge on the go

  Background:
    Given I am using Obsidian mobile app
    And Exocortex plugin is installed
    And platform detection identifies mobile device

  @smoke @mobile
  Scenario: Platform detection and adaptation
    When the plugin initializes on mobile
    Then it should detect:
      | property | value |
      | platform | mobile |
      | device_type | iOS/Android |
      | screen_size | small/medium |
      | touch_enabled | true |
    And load mobile-optimized components
    And adjust UI element sizes

  @mobile @touch
  Scenario: Touch-optimized UI elements
    Given I am viewing an asset with buttons
    When I interact with UI elements
    Then buttons should be:
      | property | specification |
      | min_height | 44px |
      | min_width | 44px |
      | spacing | 8px minimum |
      | tap_target | Accessible |
    And support touch gestures:
      | gesture | action |
      | tap | Select/activate |
      | long_press | Context menu |
      | swipe | Navigate/dismiss |

  @mobile @performance
  Scenario: Mobile performance optimization
    Given limited mobile device resources
    When loading large knowledge bases
    Then the plugin should:
      | optimization | description |
      | Batch size | Reduce to 10 items |
      | Query limit | Cap at 50 results |
      | Cache size | Limit to 10MB |
      | Render throttle | 16ms frame time |
    And maintain responsive UI (60 FPS)

  @mobile @modals
  Scenario: Mobile-adapted modal dialogs
    When I open the asset creation modal
    Then the modal should:
      | feature | behavior |
      | Size | Full screen on small devices |
      | Keyboard | Push content up when visible |
      | Scrolling | Smooth with momentum |
      | Buttons | Bottom-aligned for thumb reach |
    And support swipe-to-dismiss gesture

  @mobile @tables
  Scenario: Responsive table display
    Given a children efforts table with many columns
    When displayed on mobile
    Then the table should:
      | adaptation | description |
      | Layout | Horizontal scroll enabled |
      | Priority cols | Title and status always visible |
      | Touch scroll | Smooth with indicators |
      | Row height | Increased for touch targets |
    And provide column visibility toggles

  @mobile @graph
  Scenario: Mobile graph visualization
    Given a knowledge graph on mobile
    When I interact with the graph
    Then touch controls should include:
      | gesture | function |
      | pinch | Zoom in/out |
      | two-finger drag | Pan view |
      | tap node | Show details |
      | double-tap | Focus node |
      | long-press | Context menu |
    And provide haptic feedback

  @mobile @offline
  Scenario: Offline capability
    Given intermittent mobile connectivity
    When working offline
    Then the plugin should:
      | capability | implementation |
      | Cache data | Store locally |
      | Queue changes | Sync when online |
      | Indicate status | Show offline badge |
      | Full functionality | Everything works offline |

  @mobile @memory
  Scenario: Memory management on mobile
    Given mobile memory constraints
    When memory pressure detected
    Then the plugin should:
      | action | trigger |
      | Clear old cache | >80% memory use |
      | Reduce batch size | Memory warning |
      | Pause background | Critical memory |
      | Graceful degradation | Maintain core features |

  @mobile @text-input
  Scenario: Mobile text input optimization
    When editing properties on mobile
    Then input fields should:
      | feature | implementation |
      | Font size | Minimum 16px |
      | Tap targets | 44x44px minimum |
      | Auto-zoom | Prevent on focus |
      | Keyboard type | Context-appropriate |
      | Autocomplete | Enabled where helpful |