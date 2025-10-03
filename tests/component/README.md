# Component Tests

React component tests using Playwright Component Testing framework.

## Quick Start

```bash
# One-time setup: Install browser
npx playwright install chromium

# Run all tests
npm run test:component

# Interactive UI mode (RECOMMENDED)
npm run test:component:ui

# Debug mode
npm run test:component:debug

# Single browser
npm run test:component:chromium
```

## Test Files

- **AssetRelationsTable.spec.tsx** - 8 tests for asset relations table
- **PropertyDisplay.spec.tsx** - 11 tests for property display component
- **ChildrenEffortsTable.spec.tsx** - 12 tests for children efforts table

**Total: 31 tests**

## Components Tested

### AssetRelationsTable
- Table rendering with relations
- Column sorting (title, created, modified)
- Grouping by property
- Additional property columns
- Click handling
- Empty state

### PropertyDisplay
- Type rendering (text, number, date, boolean, list)
- Null/undefined handling
- Edit mode toggle
- Save/Cancel editing
- Input focus

### ChildrenEffortsTable
- Table with child efforts
- Status badges (color-coded)
- Priority badges (color-coded)
- Effort values
- Progress bars
- Totals calculation
- Empty state
- Optional columns

## Benefits

✅ **Fast** - Tests run in seconds
✅ **Isolated** - No Obsidian needed
✅ **Visual** - Real browser rendering
✅ **Cross-browser** - Chromium, Firefox, WebKit
✅ **Debuggable** - Visual inspector
✅ **CI-ready** - No dependencies

## Documentation

See `docs/COMPONENT-TESTING-SETUP.md` for comprehensive guide.
