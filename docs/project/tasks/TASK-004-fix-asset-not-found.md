# TASK-004: Fix Asset Not Found Error in Inline Editing

## Task ID
TASK-004

## Task Type
Bug Fix

## Priority
Critical

## Sprint
Current

## Story Points
3

## Problem Analysis

### Root Cause
The inline property editor receives `file.basename` (filename without extension) as the asset identifier, but the Asset repository's `save()` method constructs the filename using `asset.getTitle()` + ".md". When looking up the asset, there's a mismatch between the identifier passed and what the system expects.

### Flow Analysis
1. `main.ts` calls `propertyRenderer.renderPropertiesBlock(file.basename, ...)`
2. `file.basename` = "MyAsset" (without .md)
3. PropertyRenderer passes "MyAsset" as assetId to PropertyEditingUseCase
4. PropertyEditingUseCase tries to find asset by AssetId("MyAsset")
5. ObsidianAssetRepository looks for asset with ID "MyAsset"
6. But assets have IDs like UUID, not filenames!
7. Fallback lookup by title fails because title != basename always

### The Real Issue
We're confusing three different identifiers:
1. **AssetId**: UUID stored in frontmatter (exo__Asset_uid)
2. **Filename**: Physical file name with .md extension
3. **Title/Label**: Display name stored in frontmatter (exo__Asset_label)

## Solution Design

### Option 1: Pass Correct AssetId (Recommended)
- Extract actual AssetId from frontmatter
- Pass it to PropertyRenderer
- Maintain proper domain boundaries

### Option 2: Support Multiple Lookup Methods
- Add findByFilename() to repository
- Fallback chain: ID -> Filename -> Title

### Option 3: Use Filename as Identifier
- Change PropertyRenderer to accept filename
- Add filename-based operations

## Implementation Plan

1. **Fix Immediate Issue**
   - Get AssetId from frontmatter in main.ts
   - Pass correct ID to PropertyRenderer
   
2. **Add Robust Lookup**
   - Implement findByFilename in repository
   - Add error recovery

3. **Write Tests**
   - Unit test for asset lookup
   - Integration test for save flow
   - E2E test for dropdown selection

## Test Cases

### TC-001: Asset Lookup by ID
```typescript
it('should find asset by UUID', async () => {
  const asset = await repository.findById(AssetId.create('uuid-123'));
  expect(asset).toBeDefined();
});
```

### TC-002: Asset Lookup by Filename
```typescript
it('should find asset by filename', async () => {
  const asset = await repository.findByFilename('MyAsset.md');
  expect(asset).toBeDefined();
});
```

### TC-003: Inline Edit Save
```typescript
it('should save dropdown selection correctly', async () => {
  const result = await useCase.execute({
    assetId: 'correct-uuid',
    propertyName: 'assignee',
    value: '[[Bob]]'
  });
  expect(result.isSuccess).toBe(true);
});
```

## Acceptance Criteria
- [ ] Dropdown selections save without errors
- [ ] Asset found using correct identifier
- [ ] All existing tests still pass
- [ ] New tests prevent regression
- [ ] Performance < 500ms

## Dependencies
- ObsidianAssetRepository
- PropertyEditingUseCase
- PropertyRenderer
- main.ts

## Risks
- Breaking existing asset references
- Performance impact of additional lookups
- Backward compatibility

## Definition of Done
- [ ] Code implemented and reviewed
- [ ] All tests passing
- [ ] No regression in existing features
- [ ] Documentation updated
- [ ] Release notes written
- [ ] Deployed to production