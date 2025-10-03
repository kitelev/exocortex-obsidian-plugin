Feature: Class Layout Configuration
  As a knowledge worker
  I want to configure custom layouts for different asset classes
  So that I can view and organize my assets effectively

  Background:
    Given the Exocortex plugin is loaded

  Scenario: Create class layout with single block
    When I create a class layout for "ems__Task" with blocks:
      | Block ID | Type              | Title     | Order | Visible |
      | block1   | dynamic-backlinks | Relations | 1     | true    |
    Then the layout is created successfully
    And the layout has 1 block
    And the layout is enabled

  Scenario: Create class layout with multiple blocks
    When I create a class layout for "ems__Project" with blocks:
      | Block ID | Type              | Title      | Order | Visible |
      | block1   | dynamic-backlinks | Backlinks  | 1     | true    |
      | block2   | relation-properties | Properties | 2     | true    |
      | block3   | Buttons           | Actions    | 3     | true    |
    Then the layout is created successfully
    And the layout has 3 blocks
    And blocks are sorted by order

  Scenario: Fail when exceeding maximum blocks
    When I create a class layout with 21 blocks
    Then layout creation fails
    And I see error "Cannot have more than 20 blocks"

  Scenario: Fail when blocks have duplicate order values
    When I create a class layout with blocks:
      | Block ID | Order |
      | block1   | 1     |
      | block2   | 1     |
    Then layout creation fails
    And I see error "duplicate order values"

  Scenario: Add block to existing layout
    Given a class layout for "ems__Task" with 1 block
    When I add a new block:
      | Block ID | Type    | Title   | Order |
      | block2   | Buttons | Actions | 2     |
    Then the block is added successfully
    And the layout has 2 blocks

  Scenario: Fail to add block with duplicate ID
    Given a class layout with block "block1"
    When I add a new block with ID "block1"
    Then adding block fails
    And I see error "Block with this ID already exists"

  Scenario: Fail to add block with duplicate order
    Given a class layout with block at order 1
    When I add a new block with order 1
    Then adding block fails
    And I see error "Block with order 1 already exists"

  Scenario: Remove block from layout
    Given a class layout with blocks:
      | Block ID | Title     |
      | block1   | Backlinks |
      | block2   | Actions   |
    When I remove block "block1"
    Then the block is removed successfully
    And the layout has 1 block
    And only "block2" remains

  Scenario: Fail to remove non-existent block
    Given a class layout with blocks
    When I remove block "nonexistent"
    Then removing block fails
    And I see error "Block not found"

  Scenario: Update block title
    Given a class layout with block "block1" titled "Old Title"
    When I update block "block1" with title "New Title"
    Then the update is successful
    And block "block1" has title "New Title"

  Scenario: Update block visibility
    Given a class layout with visible block "block1"
    When I hide block "block1"
    Then the update is successful
    And block "block1" is not visible

  Scenario: Reorder blocks
    Given a class layout with blocks:
      | Block ID | Order |
      | block1   | 1     |
      | block2   | 2     |
    When I update block "block1" to order 3
    Then the update is successful
    And blocks are reordered correctly

  Scenario: Fail to reorder to duplicate position
    Given a class layout with blocks at orders 1 and 2
    When I update block 1 to order 2
    Then the update fails
    And I see error "Block with order 2 already exists"

  Scenario: Get visible blocks only
    Given a class layout with blocks:
      | Block ID | Visible |
      | block1   | true    |
      | block2   | false   |
      | block3   | true    |
    When I get visible blocks
    Then I receive 2 blocks
    And blocks are "block1" and "block3"

  Scenario: Enable and disable layout
    Given a disabled class layout
    When I enable the layout
    Then the layout is enabled
    When I disable the layout
    Then the layout is disabled

  Scenario: Layout priority
    When I create layouts with priorities:
      | Class       | Priority |
      | ems__Task   | 10       |
      | ems__Project | 5       |
    Then layouts are ordered by priority

  Scenario: Empty layout is valid
    When I create a class layout with no blocks
    Then the layout is created successfully
    And the layout has 0 blocks

  Scenario: Blocks are always returned sorted by order
    Given a class layout with blocks added in random order:
      | Block ID | Order |
      | block3   | 3     |
      | block1   | 1     |
      | block2   | 2     |
    When I get all blocks
    Then blocks are in order: 1, 2, 3
