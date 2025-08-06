# Exocortex Plugin Requirements Specification

## Business Requirements

### BR-001: Interactive Class Selection
**Description**: Users need a more interactive way to navigate and select classes from the hierarchy
**Rationale**: Dropdown lists become unwieldy with large class hierarchies
**Success Criteria**: Users can easily navigate and find classes in large hierarchies

### BR-002: Tree Navigation
**Description**: Users should be able to expand and collapse tree branches
**Rationale**: Allows focused exploration of relevant parts of the hierarchy
**Success Criteria**: Tree nodes can be expanded/collapsed to show/hide children

### BR-003: Modal-based Selection
**Description**: Replace dropdown with modal dialog for class selection
**Rationale**: Provides more screen space and better UX for complex hierarchies
**Success Criteria**: Clicking class field opens a dedicated selection modal

## Functional Requirements

### FR-001: Tree Hierarchy Display
**Description**: Display class hierarchy as an expandable tree structure
**Acceptance Criteria**:
- Classes are displayed in hierarchical tree format
- Parent-child relationships are visually clear
- Multiple inheritance is properly represented
- Circular references are detected and marked

**Implementation**: `ClassTreeModal.renderTreeNode()` (src/presentation/modals/ClassTreeModal.ts:195-267)

### FR-002: Expand/Collapse Functionality
**Description**: Allow users to expand and collapse tree nodes
**Acceptance Criteria**:
- Clicking expand icon toggles node state
- Expanded state is preserved during modal session
- Tree expands to show selected class on open

**Implementation**: `ClassTreeModal.toggleExpand()` (src/presentation/modals/ClassTreeModal.ts:277-289)

### FR-003: Search and Filter
**Description**: Provide search functionality to filter the tree
**Acceptance Criteria**:
- Real-time filtering as user types
- Matching terms are highlighted
- Tree auto-expands to show matches
- Clear indication when no matches found

**Implementation**: `ClassTreeModal.filterTree()` (src/presentation/modals/ClassTreeModal.ts:116-148)

### FR-004: Modal Integration
**Description**: Integrate tree selector with main asset creation modal
**Acceptance Criteria**:
- Button shows current selection
- Click opens tree modal
- Selection updates main form
- Modal properly overlays parent modal

**Implementation**: Button handler in `main.ts:846-863`

## Non-Functional Requirements

### NFR-001: Performance
**Description**: Tree should handle large hierarchies efficiently
**Criteria**: 
- Render 1000+ classes without lag
- Search responds within 100ms
- Smooth expand/collapse animations

### NFR-002: Accessibility
**Description**: Modal should be keyboard navigable
**Criteria**:
- Tab navigation through tree
- Enter to select
- Escape to close
- Arrow keys for tree navigation

### NFR-003: Visual Design
**Description**: Consistent with Obsidian's design language
**Criteria**:
- Uses Obsidian CSS variables
- Matches native modal styling
- Proper dark/light theme support

## User Stories

### US-001: Class Selection
**As a** user creating an asset
**I want to** select a class from an interactive tree
**So that I** can easily navigate complex hierarchies

### US-002: Search Classes  
**As a** user with many classes
**I want to** search for classes by name
**So that I** can quickly find what I need

### US-003: Explore Hierarchy
**As a** user learning the ontology
**I want to** explore the class hierarchy
**So that I** can understand relationships

## Acceptance Scenarios

### Scenario 1: Open Tree Selector
**Given** I am creating a new asset
**When** I click the class selection button
**Then** a modal opens showing the class tree

### Scenario 2: Expand Node
**Given** the tree modal is open
**When** I click the expand icon on a node with children
**Then** the children are displayed below the parent

### Scenario 3: Search Classes
**Given** the tree modal is open
**When** I type in the search field
**Then** only matching classes are shown
**And** matching text is highlighted

### Scenario 4: Select Class
**Given** the tree modal is open
**When** I click on a class name
**Then** the modal closes
**And** the selected class appears in the main form

## Test Cases

### TC-001: Tree Rendering
- Verify all classes are displayed
- Verify hierarchy is correct
- Verify multiple inheritance handled
- Verify recursion detection works

### TC-002: Expand/Collapse
- Verify click toggles state
- Verify state persists
- Verify children show/hide

### TC-003: Search Function
- Verify filters on type
- Verify highlights matches
- Verify auto-expands to matches
- Verify handles no results

### TC-004: Selection Flow
- Verify button opens modal
- Verify selection closes modal
- Verify form updates
- Verify properties reload