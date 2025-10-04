# BDD Coverage Report

Generated: 2025-10-04T09:57:21.450Z

## Summary

- **Total Scenarios**: 48
- **Covered**: 47 (98%)
- **Not Covered**: 1 (2%)

### Coverage by Feature:

- ✅ **asset-properties-display.feature**: 16/16 (100%)
- ✅ **instance-class-links.feature**: 10/10 (100%)
- ✅ **table-sorting.feature**: 14/14 (100%)
- ⚠️ **universal-layout-rendering.feature**: 7/8 (88%)

## Coverage Matrix

| Feature File | Total | Covered | Uncovered | % | Status |
|-------------|-------|---------|-----------|---|--------|
| asset-properties-display.feature | 16 | 16 | 0 | 100% | ✅ FULL |
| instance-class-links.feature | 10 | 10 | 0 | 100% | ✅ FULL |
| table-sorting.feature | 14 | 14 | 0 | 100% | ✅ FULL |
| universal-layout-rendering.feature | 8 | 7 | 1 | 88% | ⚠️ PARTIAL |

## Uncovered Scenarios

### universal-layout-rendering.feature

#### ❌ Filter archived notes

- **Line**: 97
- **Tags**: none
- **Feature**: Universal Layout Rendering

**Action Required**: Add test case for this scenario

```typescript
test('filter archived notes', async ({ mount }) => {
  // TODO: Implement test for this scenario
});
```

## Covered Scenarios (Detailed)

### asset-properties-display.feature

#### ✅ Display simple properties

- **Line**: 11
- **Coverage Type**: auto
- **Test Cases** (9):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"

#### ✅ Display properties with wiki-links

- **Line**: 24
- **Coverage Type**: auto
- **Test Cases** (12):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render React component with proper DOM structure"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should work with FileBuilder pattern for test data"

#### ✅ Display array properties

- **Line**: 34
- **Coverage Type**: auto
- **Test Cases** (11):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"

#### ✅ Display array with wiki-links

- **Line**: 41
- **Coverage Type**: auto
- **Test Cases** (14):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render React component with proper DOM structure"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should work with FileBuilder pattern for test data"

#### ✅ Empty or missing properties

- **Line**: 49
- **Coverage Type**: auto
- **Test Cases** (8):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should not render when metadata is empty"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"

#### ✅ Properties table before relations table

- **Line**: 57
- **Coverage Type**: auto
- **Test Cases** (8):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should group relations by property"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle grouped relations rendering"

#### ✅ Properties table in reading mode only

- **Line**: 63
- **Coverage Type**: auto
- **Test Cases** (5):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"

#### ✅ Detect wiki-link format [[Note]]

- **Line**: 71
- **Coverage Type**: auto
- **Test Cases** (1):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should preserve property key formatting"

#### ✅ Detect array with wiki-links

- **Line**: 77
- **Coverage Type**: auto
- **Test Cases** (8):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render React component with proper DOM structure"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should work with FileBuilder pattern for test data"

#### ✅ Non-link values remain as text

- **Line**: 83
- **Coverage Type**: auto
- **Test Cases** (6):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"

#### ✅ Mixed content in arrays

- **Line**: 88
- **Coverage Type**: auto
- **Test Cases** (2):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"

#### ✅ Preserve original property names

- **Line**: 97
- **Coverage Type**: auto
- **Test Cases** (2):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should preserve property key formatting"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should group relations by property"

#### ✅ Handle null and undefined

- **Line**: 109
- **Coverage Type**: auto
- **Test Cases** (9):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle grouped relations rendering"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"

#### ✅ Handle boolean values

- **Line**: 116
- **Coverage Type**: auto
- **Test Cases** (13):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle grouped relations rendering"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"

#### ✅ Handle numbers

- **Line**: 123
- **Coverage Type**: auto
- **Test Cases** (9):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle grouped relations rendering"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"

#### ✅ Handle dates

- **Line**: 130
- **Coverage Type**: auto
- **Test Cases** (9):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle grouped relations rendering"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"

### instance-class-links.feature

#### ✅ Simple Instance Class value

- **Line**: 11
- **Coverage Type**: auto
- **Test Cases** (9):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Array of Instance Class values

- **Line**: 27
- **Coverage Type**: auto
- **Test Cases** (11):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Click on Instance Class link

- **Line**: 37
- **Coverage Type**: auto
- **Test Cases** (7):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render wiki-links as clickable internal links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Missing Instance Class

- **Line**: 45
- **Coverage Type**: auto
- **Test Cases** (3):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Instance Class with prefix

- **Line**: 51
- **Coverage Type**: auto
- **Test Cases** (8):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render React component with proper DOM structure"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should work with FileBuilder pattern for test data"

#### ✅ Grouping by Instance Class

- **Line**: 61
- **Coverage Type**: auto
- **Test Cases** (3):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Instance Class in group header

- **Line**: 78
- **Coverage Type**: auto
- **Test Cases** (5):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should group relations by property"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle grouped relations rendering"

#### ✅ Remove wiki-link syntax

- **Line**: 87
- **Coverage Type**: manual
- **Test Cases** (1):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"

#### ✅ Handle empty values

- **Line**: 93
- **Coverage Type**: auto
- **Test Cases** (14):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should not render when metadata is empty"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle grouped relations rendering"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"

#### ✅ Handle incorrect values

- **Line**: 103
- **Coverage Type**: auto
- **Test Cases** (13):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle mixed content in arrays"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle grouped relations rendering"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"

### table-sorting.feature

#### ✅ First click - sort ascending

- **Line**: 19
- **Coverage Type**: auto
- **Test Cases** (6):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render wiki-links as clickable internal links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Second click - sort descending

- **Line**: 29
- **Coverage Type**: auto
- **Test Cases** (6):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render wiki-links as clickable internal links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Third click - return to ascending

- **Line**: 42
- **Coverage Type**: auto
- **Test Cases** (4):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render wiki-links as clickable internal links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle link clicks"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle asset click"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Sort by Instance Class works correctly

- **Line**: 51
- **Coverage Type**: auto
- **Test Cases** (4):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Instance Class is extracted from metadata

- **Line**: 60
- **Coverage Type**: auto
- **Test Cases** (5):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should not render when metadata is empty"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Sort by custom property

- **Line**: 68
- **Coverage Type**: auto
- **Test Cases** (4):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should preserve property key formatting"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should group relations by property"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"

#### ✅ All custom properties are sortable

- **Line**: 81
- **Coverage Type**: auto
- **Test Cases** (4):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"

#### ✅ Only one column has indicator

- **Line**: 94
- **Coverage Type**: auto
- **Test Cases** (1):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"

#### ✅ Arrows update when direction changes

- **Line**: 103
- **Coverage Type**: auto
- **Test Cases** (1):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should not render when metadata is empty"

#### ✅ Initial sort by Name ascending

- **Line**: 111
- **Coverage Type**: auto
- **Test Cases** (2):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"

#### ✅ Preserve sort state in groups

- **Line**: 117
- **Coverage Type**: auto
- **Test Cases** (4):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should preserve property key formatting"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"

#### ✅ Sort with empty values

- **Line**: 127
- **Coverage Type**: auto
- **Test Cases** (16):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle null and undefined values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should not render when metadata is empty"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should handle empty arrays"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle empty relations"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render React component with proper DOM structure"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should handle empty state gracefully"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should work with FileBuilder pattern for test data"

#### ✅ Sort dates

- **Line**: 140
- **Coverage Type**: auto
- **Test Cases** (2):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"

#### ✅ Sort numbers

- **Line**: 146
- **Coverage Type**: auto
- **Test Cases** (2):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"

### universal-layout-rendering.feature

#### ✅ Display table of related notes

- **Line**: 15
- **Coverage Type**: auto
- **Test Cases** (10):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"

#### ✅ Instance Class column contains clickable links

- **Line**: 34
- **Coverage Type**: auto
- **Test Cases** (5):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render wiki-links as clickable internal links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Sort by Name column

- **Line**: 52
- **Coverage Type**: auto
- **Test Cases** (3):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"

#### ✅ Sort by Instance Class column

- **Line**: 74
- **Coverage Type**: auto
- **Test Cases** (4):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"
  - `tests/ui/UniversalLayoutRenderer.ui.test.ts`: "should render clickable Instance Class links"

#### ✅ Sort indicators

- **Line**: 87
- **Coverage Type**: auto
- **Test Cases** (2):
  - `tests/component/AssetRelationsTable.spec.tsx`: "should handle sorting by name"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should sort by exo__Instance_class"

#### ✅ Display additional properties

- **Line**: 109
- **Coverage Type**: auto
- **Test Cases** (9):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display simple text properties"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array properties as comma-separated values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display array with wiki-links"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display boolean values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display number values"
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should display object values as JSON"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display additional properties"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should display exo__Instance_class column"

#### ✅ Mobile table adaptation

- **Line**: 129
- **Coverage Type**: auto
- **Test Cases** (2):
  - `tests/component/AssetPropertiesTable.spec.tsx`: "should render properties table with metadata"
  - `tests/component/AssetRelationsTable.spec.tsx`: "should render table with relations"

