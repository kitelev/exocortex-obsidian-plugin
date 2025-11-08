# AGENTS.md – GPT Workflow Guide

## Overview
- This repository contains the Exocortex Obsidian plugin. Treat it as a production-grade TypeScript/React codebase with strict quality expectations.
- Claude-specific slash-command automation described in `CLAUDE.md` is **not** available here. Instead, run the underlying npm scripts yourself while preserving the intent of those guardrails (structured planning, parallel quality checks, and gated releases).
- Consult architectural background in `ARCHITECTURE.md`, domain references in `docs/`, task history in `.claude/`, and existing specs/tests before making changes.

## Worktree Discipline (non-negotiable)
- **Never edit the root checkout.** All implementation work must happen inside a designated Git worktree (e.g. `worktrees/<branch-name>/…`). If `pwd` shows the repository root, stop and move to the correct worktree before touching files.
- **Verify location before each change.** Run `pwd` and `git rev-parse --show-toplevel`; the toplevel must resolve inside the active worktree directory. Abort immediately if it points to the main repo.
- **Create or switch worktrees explicitly.** Use `git worktree list` to inspect existing entries. Add a new one with `git worktree add worktrees/<name> <branch>` when starting fresh, and jump into it with `cd worktrees/<name>`.
- **Keep tooling scoped to the worktree.** Every command (`npm install`, `npm test`, editor sessions) should execute within the worktree to avoid polluting the main checkout.

## Setup Commands
- Install dependencies: `npm install`
- Start the development build (esbuild bundler): `npm run dev`
- Create a production build: `npm run build`

## Development Workflow
1. **Plan deliberately** – outline requirements, risks, and design before coding (mirrors the orchestrated agent flow in `CLAUDE.md`).
2. **Work incrementally** – keep changes focused and align with existing architecture and result-pattern usage.
3. **Document decisions** – update relevant markdown docs when behavior or conventions change.

## Code Style & Quality
- Use TypeScript with existing lint/format rules (`npm run lint`, `npm run format:check`).
- Follow the established project conventions (e.g., double quotes, semicolons, React functional components).
- Prefer explicit error handling and graceful fallbacks consistent with the patterns documented in `CLAUDE.md` (result objects, safe degradation).

## Component Development Patterns

### *WithToggle Components for Table Controls

When adding toggle buttons to table components, reuse the existing `*WithToggle` pattern:

**Pattern (from `DailyTasksTableWithToggle`):**
- Wrapper component with controls div containing toggle buttons
- Each button toggles a feature (Effort Area, Votes, Archived, etc.)
- Settings persist via `plugin.saveSettings()` and trigger `refresh()`
- Base table component receives filtered/configured props
- Consistent styling: `marginBottom: 8px`, `padding: 4px 8px`, `fontSize: 12px`

**Example:** See PR #326 for archive filtering in DailyNote tables - demonstrates adding "Show/Hide Archived" toggle to both tasks and projects tables.

### Display Name Resolution Pattern

When displaying asset names in tables/lists, always resolve the display name **once at the source** (in the Renderer) rather than repeatedly in UI components.

**Pattern (from PR #337 - Name Sorting Fix):**

✅ **CORRECT - Resolve at Source (Renderer):**
```typescript
// In RelationsRenderer.ts
const displayLabel = enrichedMetadata.exo__Asset_label || sourceFile.basename;
const relation: AssetRelation = {
  file: sourceFile,
  path: sourcePath,
  title: displayLabel,  // ← Single source of truth
  metadata: enrichedMetadata,
  // ...
};
```

❌ **WRONG - Resolve in Component:**
```typescript
// In AssetRelationsTable.tsx (DON'T DO THIS)
const getDisplayLabel = (relation: AssetRelation): string => {
  const label = relation.metadata?.exo__Asset_label;
  return label && label.trim() !== "" ? label : relation.title;  // ← Repeated logic
};
```

**Why this matters:**
- Single source of truth prevents inconsistencies
- Sorting works correctly (sorts by displayed value, not internal ID)
- Performance: resolve once instead of N times per render
- Maintainability: change display logic in one place

**Rule**: If a property appears in tables/lists and needs display formatting, resolve it in the Renderer and store in the relation object's `title` or dedicated field.

**Example:** See PR #337 for Name column sorting fix using `exo__Asset_label`.

### Error Handling Pattern for UI Components

When implementing error handling in components that display UI:

1. **Dual logging**: Always log to BOTH console AND user-facing UI
   ```typescript
   } catch (error) {
     const errorObj = error instanceof Error ? error : new Error(String(error));
     console.error("[ComponentName] Error description:", errorObj);
     console.error("[ComponentName] Stack trace:", errorObj.stack);
     new Notice(`User-friendly error message: ${errorObj.message}`, 5000);
   }
   ```

2. **Searchable prefixes**: Use `[ComponentName]` prefix for easy console filtering
3. **Include stack traces**: Log `errorObj.stack` separately for full debug info
4. **User-friendly messages**: Notice popup should explain what went wrong in user terms
5. **Timeout duration**: 5 seconds (5000ms) for errors, 2 seconds for success messages

**Example from SPARQLCodeBlockProcessor.ts**: See lines 99-106 for query execution error handling pattern.

**Git Operations During Development:**

When git operations (fetch, push, rebase) fail due to network issues, use GitHub API as fallback:
```bash
# Instead of: git fetch && git rebase && git push --force-with-lease
# Use: gh api to update PR branch server-side
gh api -X PUT repos/OWNER/REPO/pulls/PR_NUMBER/update-branch \
  -f expected_head_sha=$(git rev-parse HEAD)
```

**Benefits**: Bypasses network issues, triggers CI automatically, updates branch on GitHub without local git operations.

## Critical Quality Rules

### ⛔ NEVER Use `git commit --no-verify`

**ABSOLUTE PROHIBITION** - bypassing pre-commit hooks is **FORBIDDEN**.

**Why:**
- Pre-commit hooks catch errors before CI
- Bypassing pushes broken code that blocks other developers
- Lint/test failures must be fixed, not ignored

**If pre-commit fails:**
- ✅ Fix YOUR lint errors: `npx eslint --fix path/to/your/file.ts`
- ✅ Fix BLOCKING lint errors in other files too
- ✅ Ask maintainer to address systemic issues
- ❌ NEVER use `--no-verify`

## Testing Requirements
- Run targeted checks that mirror the `/test` command pipeline:
  - Unit tests: `npm run test:unit`
  - UI tests: `npm run test:ui`
  - Component tests: `npm run test:component`
- When time permits or before significant merges, execute the full suite: `npm run test`.
- Validate behavior-driven coverage as expected by the CLAUDE workflow: `npm run bdd:check` (or `npm run bdd:coverage` / `npm run bdd:report` for diagnostics).
- Investigate and resolve all failures; prevent Playwright hangs by keeping runs scoped when possible.

### Troubleshooting: Missing ts-jest preset

**Symptom**: Running Jest yields `Preset ts-jest not found relative to rootDir ...`.

**Root Cause**: Dependencies have not been installed inside the current worktree (common immediately after `git worktree add`).

**Solution**:
1. From the worktree root, run `npm install`.
2. Re-run the Jest command.

**Prevention**: Always execute `npm install` right after creating a new worktree.

### Jest async generators

The shared ts-jest configuration does not handle class-level `async *` methods. When you need an async stream, expose a helper that returns an `AsyncIterableIterator` instead of adding `async *` directly on a class.

### Jest Mock Creation Pattern for Obsidian UI

When creating mock elements for Obsidian UI testing, always wrap methods in jest.fn():

```typescript
// ✅ CORRECT - Methods are jest mocks
export function createMockElement(): any {
  const el: any = document.createElement("div");
  el.createDiv = jest.fn((opts?: any) => {
    const div: any = document.createElement("div");
    // ... implementation
    return div;
  });
}

// ❌ WRONG - Plain function, not a jest mock
export function createMockElement(): any {
  const el: any = document.createElement("div");
  el.createDiv = (opts?: any) => {  // Missing jest.fn()!
    // ...
  };
}
```

This allows tests to use jest mock utilities like `mockReturnValueOnce()`.

## Release Guidance
- Do **not** bump versions or craft releases manually. Coordinate with maintainers for release automation that mirrors the `/release` command.
- Ensure changelog updates and release activities happen through the sanctioned process once available.

## Additional Resources
- Specialized agent guides in `.claude/agents/` explain domain patterns (QA, architecture, security, performance, etc.). Use them for context even without direct agent orchestration.
- Review `tests/`, `specs/`, and existing components for examples before introducing new patterns.
- Record troubleshooting insights and follow-up tasks so they can inform future automation improvements.
