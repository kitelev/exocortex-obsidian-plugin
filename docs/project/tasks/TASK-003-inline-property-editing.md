# TASK-003: Inline Property Editing in Asset Views

## Task Overview

**ID**: TASK-003
**Type**: Feature
**Priority**: High
**Status**: Planning
**Sprint**: 2025-W32
**Story Points**: 8
**Estimated Hours**: 12

## Business Context

Users currently must open a separate modal to edit asset properties. This creates friction in the workflow. Users want to edit properties directly in the asset view, similar to how Obsidian's native properties work.

## User Story

**As a** user viewing an asset  
**I want to** edit property values directly in the asset view  
**So that I** can quickly update information without opening modals

## Requirements

### Functional Requirements

1. **FR-010**: Property values in asset views shall be editable inline
2. **FR-011**: Object properties shall display as dropdowns with assets from the range class
3. **FR-012**: Datatype properties shall use appropriate input controls (text, number, date, etc.)
4. **FR-013**: Changes shall be saved automatically or with explicit save action
5. **FR-014**: Validation shall match the creation form rules
6. **FR-015**: Users shall see visual feedback when editing

### Non-Functional Requirements

1. **NFR-004**: Edit controls shall appear within 100ms of interaction
2. **NFR-005**: Auto-save shall occur within 500ms of stopping typing
3. **NFR-006**: Must support keyboard navigation (Tab, Enter, Escape)
4. **NFR-007**: Must work with Obsidian's undo/redo system

## Acceptance Criteria

- [ ] Click on property value transforms it to edit mode
- [ ] Object properties show dropdown with assets from range class
- [ ] Datatype properties show appropriate input controls
- [ ] Enum properties show dropdown with allowed values
- [ ] Boolean properties show toggle switch
- [ ] Array properties allow adding/removing items
- [ ] Changes persist to the asset file
- [ ] Escape key cancels edit without saving
- [ ] Enter key saves and exits edit mode
- [ ] Tab key saves and moves to next property
- [ ] Visual indication of edit mode (border, background)
- [ ] Validation errors display inline
- [ ] Required properties show indicator

## Technical Design

### Architecture Approach

```
Asset View (Reading Mode)
    ├── PropertyRenderer (Presentation)
    │   ├── ReadOnlyView
    │   └── EditableView
    ├── PropertyEditingUseCase (Application)
    │   ├── ValidatePropertyValue
    │   └── SavePropertyValue
    └── PropertyRepository (Infrastructure)
        └── UpdateAssetProperty
```

### Components to Create/Modify

1. **PropertyRenderer**: New presentation component for rendering properties
2. **PropertyEditingUseCase**: Handle property editing logic
3. **InlinePropertyEditor**: Component for inline editing
4. **PropertyValidator**: Validate values based on property definition

### Data Flow

1. User clicks property value
2. PropertyRenderer switches to edit mode
3. Appropriate input control renders based on property type
4. User modifies value
5. Validation occurs in real-time
6. On save trigger (Enter/Tab/blur):
   - PropertyEditingUseCase validates
   - Updates asset via repository
   - Updates view with new value

## Implementation Plan

1. [ ] Create PropertyRenderer component
2. [ ] Implement edit mode switching logic
3. [ ] Create input controls for each property type
4. [ ] Implement PropertyEditingUseCase
5. [ ] Add validation logic
6. [ ] Integrate with asset repository
7. [ ] Add keyboard navigation
8. [ ] Implement auto-save functionality
9. [ ] Add visual feedback and animations
10. [ ] Write unit tests
11. [ ] Write BDD tests
12. [ ] Update documentation

## Testing Strategy

### Unit Tests

- PropertyRenderer component
- PropertyEditingUseCase
- PropertyValidator
- Input control components

### Integration Tests

- Edit and save flow
- Validation flow
- Keyboard navigation

### BDD Scenarios

```gherkin
Feature: Inline Property Editing
  Scenario: Edit text property
    Given I am viewing an asset with properties
    When I click on a text property value
    Then the value becomes editable
    When I type a new value and press Enter
    Then the new value is saved and displayed
```

## Risks

| Risk                              | Impact | Probability | Mitigation                   |
| --------------------------------- | ------ | ----------- | ---------------------------- |
| Conflicts with Obsidian's editing | High   | Medium      | Use Obsidian's Editor API    |
| Performance with many properties  | Medium | Low         | Lazy loading, virtualization |
| Data loss on concurrent edits     | High   | Low         | Optimistic locking           |
| Complex validation rules          | Medium | Medium      | Clear error messages         |

## Dependencies

- Existing property rendering system
- Asset repository
- Property definitions (range, required, etc.)
- Obsidian Editor API

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit test coverage > 80%
- [ ] BDD tests passing
- [ ] No TypeScript errors
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Accessibility requirements met

## Time Estimate Breakdown

| Task                       | Hours  |
| -------------------------- | ------ |
| PropertyRenderer component | 2      |
| Edit mode logic            | 1      |
| Input controls per type    | 3      |
| PropertyEditingUseCase     | 2      |
| Validation                 | 1      |
| Repository integration     | 1      |
| Testing                    | 2      |
| **Total**                  | **12** |

## Notes

- Follow the same form patterns as asset creation modal
- Ensure consistency with Obsidian's native property editing
- Consider mobile/touch interactions
- Must maintain backward compatibility
