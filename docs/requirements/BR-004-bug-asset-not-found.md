# Business Requirement BR-004: Fix Asset Not Found Error

## Requirement ID
BR-004

## Bug Report
**Severity**: Critical  
**Reported**: 2025-08-06  
**Reporter**: User

## Problem Statement
When editing asset properties through the inline view editor, selecting any value from a dropdown list results in "Asset not found" error. This prevents users from updating object property references, making the inline editing feature unusable for relationship management.

## Root Cause Analysis
**Hypothesis**: The asset lookup is using the wrong identifier (possibly display label instead of filename) when searching for the asset to update.

## Expected Behavior
1. User clicks on an object property value
2. Dropdown appears with available options
3. User selects a new value
4. System saves the selection successfully
5. No errors occur

## Actual Behavior
1. User clicks on an object property value
2. Dropdown appears correctly
3. User selects a new value
4. System shows "Asset not found" error
5. Property is not updated

## Impact
- **Users Affected**: All users using inline editing
- **Features Blocked**: Object property updates
- **Business Impact**: High - core functionality broken
- **Workaround**: Use modal editor (poor UX)

## Acceptance Criteria
1. Dropdown selections must save without errors
2. Asset lookup must use correct identifier
3. Both filename and display label should work
4. Special characters in names handled correctly
5. Performance remains under 500ms

## Technical Requirements

### TR-001: Correct Asset Identification
The system SHALL identify assets by their filename/path, not display label.

### TR-002: Identifier Mapping
The system SHALL correctly map between:
- Display names (shown in dropdown)
- Wiki links ([[filename]])
- Actual file paths

### TR-003: Error Handling
The system SHALL provide clear error messages when:
- Asset genuinely not found
- Permission issues
- File system errors

## Test Requirements

### Unit Tests
- Asset lookup by different identifiers
- Special character handling
- Empty/null value handling

### Integration Tests
- PropertyEditingUseCase with real repository
- PropertyRenderer with actual dropdowns
- End-to-end save flow

### Regression Tests
- All existing inline editing features still work
- Modal editing not affected
- Performance benchmarks maintained

## Definition of Done
- [ ] Bug reproduced in test
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] All tests passing
- [ ] No regression in existing features
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Release created