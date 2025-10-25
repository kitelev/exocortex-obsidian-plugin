# ADR-0004: Use React for Interactive Tables

## Status

✅ **Accepted** (Implemented)

## Context

Daily tasks and projects tables need interactive features:
- Sortable columns (click header to sort)
- Visual sort indicators (▲/▼)
- Clickable cells (navigate to links)
- Vote buttons inline in table
- Responsive to state changes
- High performance (100+ rows)

### Problem

Implementation options:

1. **Plain DOM manipulation**: `document.createElement()`, event listeners
2. **Obsidian's builtin components**: Limited, not designed for complex tables
3. **UI framework**: React, Vue, Svelte, etc.

## Decision

**Use React 19.2.0** for interactive table components.

### Components Created

- `DailyTasksTable.tsx` - Interactive tasks table with sorting
- `DailyProjectsTable.tsx` - Interactive projects table
- `AssetPropertiesTable.tsx` - Properties display
- `AssetRelationsTable.tsx` - Relations display
- `ActionButtonsGroup.tsx` - Command buttons

### Integration

```typescript
// In UniversalLayoutRenderer
import { createRoot } from 'react-dom/client';
import { DailyTasksTable } from '../components/DailyTasksTable';

// Render React component
const root = createRoot(container);
root.render(<DailyTasksTable tasks={tasks} settings={settings} />);
```

## Consequences

### Positive ✅

- **Declarative**: UI = f(state), easy to reason about
- **State management**: React handles re-renders automatically
- **Component reuse**: Build once, use everywhere
- **Performance**: Virtual DOM optimizes updates
- **Developer experience**: Great tooling, debugging, testing
- **Type safety**: TypeScript + React = excellent DX
- **Testing**: Playwright Component Testing built for React
- **Ecosystem**: Vast library of solutions for common problems

### Negative ❌

- **Bundle size**: React adds ~171kb to plugin (206kb total)
  - React: 135kb
  - React-DOM: 36kb
  - Plugin code: 35kb
- **Complexity**: Requires understanding React paradigms
- **Build setup**: ESBuild must handle JSX
- **Learning curve**: Contributors must know React

### Mitigations

1. **Bundle size acceptable**: 206kb is reasonable for rich UI
2. **Code splitting**: Not needed yet (single plugin file)
3. **Documentation**: Component testing examples provided
4. **React 19**: Latest version with Server Components (future benefit)

## Alternatives Considered

### Alternative 1: Plain DOM + Vanilla JS

```typescript
const table = document.createElement('table');
const headerRow = table.createTHead().insertRow();
// ... 100+ lines of DOM manipulation
```

**Rejected because**:
- Verbose, error-prone
- Hard to maintain (spaghetti code)
- No state management
- Difficult to test
- Every feature requires manual event handling

### Alternative 2: Svelte

**Rejected because**:
- Smaller ecosystem for Obsidian plugins
- Harder to find Svelte + Obsidian examples
- Playwright CT has better React support

### Alternative 3: Preact

**Rejected because**:
- Not significant size benefit in plugin context
- React compatibility more valuable
- React DevTools wouldn't work

## Implementation Details

### Bundle Configuration

```javascript
// esbuild.config.mjs
esbuild.build({
  entryPoints: ['src/main.tsx'],
  format: 'cjs',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['obsidian'],
});
```

### Component Testing

```typescript
// tests/component/DailyTasksTable.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { DailyTasksTable } from '../../src/presentation/components/DailyTasksTable';

test('should render task table with sorting', async ({ mount }) => {
  const component = await mount(<DailyTasksTable tasks={mockTasks} />);
  await expect(component.getByRole('table')).toBeVisible();
});
```

### Performance Optimization

```typescript
// Memoize expensive operations
const sortedTasks = useMemo(() => {
  return tasks.sort(EffortSortingHelpers.sortByPriority);
}, [tasks]);

// Prevent unnecessary re-renders
const MemoizedTaskRow = React.memo(TaskRow);
```

## Related

- **Testing**: Playwright Component Testing for React components
- **Build**: ESBuild with JSX transform
- **Dependencies**: React 19.2.0, React-DOM 19.2.0 in package.json
- **13 components**: All built with React
- **Bundle**: main.js includes React runtime

## Future Considerations

- React 19 Server Components (future: SSR for web interface)
- React Compiler (future: automatic memoization)
- Concurrent rendering (already available in React 19)

---

**Date**: 2025-10-26
**Author**: @kitelev
**Related Issues**: #124 (Architecture Documentation)