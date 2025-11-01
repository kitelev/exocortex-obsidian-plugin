# Repository Guidelines

## Quick Context
- Exocortex is an Obsidian plugin that renders ontology-driven layouts, syncs Areas → Projects → Tasks, tracks effort timelines, and surfaces vote-based prioritization signals inside reading mode.
- Key vocabulary: frontmatter prefixes `exo__` (core assets) and `ems__` (effort metrics); layout renderers live in `src/presentation`, while domain logic sits in `src/domain` and shared services in `packages/core`.
- Always operate from a worktree under `worktrees/exocortex-<agent>-<type>-<topic>/`; the upstream `exocortex-obsidian-plugin/` directory remains read-only.
- Definition of done: code lands through a PR, merges to `main`, and a release is completed before the worktree is removed.

## Project Structure & Module Organization
- `src/` hosts the plugin runtime, split into `domain`, `application`, `infrastructure`, and `presentation` layers with entry points in `main.ts` and `ExocortexPlugin.ts`.
- `packages/` contains reusable workspaces: `core` for shared domain utilities and `cli` for tooling. Prefer adding cross-cutting logic here instead of duplicating code under `src/`.
- `tests/` mirrors runtime modules (`unit`, `ui`, `component`, `infrastructure`, `e2e`) and centralizes fixtures in `tests/__mocks__` and `tests/e2e/test-vault`.
- `docs/`, `ARCHITECTURE.md`, and `specs/` capture design notes and Gherkin flows; update whichever describes the behavior you touch.

## Build, Test, and Development Commands
- Install dependencies with Node 18+ via `npm install`.
- `npm run dev` starts the esbuild watcher that writes `main.js` for manual Obsidian testing.
- `npm run build` performs a type check followed by a production bundle; run before tagging releases.
- `npm run check:all` chains type checking, ESLint, and Prettier verification.
- `npm test` executes the full suite. Targeted runs: `npm run test:unit` (batched Jest), `npm run test:ui` (Jest DOM), `npm run test:component` (Playwright component), `npm run test:e2e:local` (Playwright vault), and `npm run test:e2e:docker`.
- Coverage tooling: `npm run bdd:coverage`, `npm run bdd:check`, and `npm run bdd:report`.

## Coding Style & Naming Conventions
- TypeScript + React with ES modules; keep exports explicit and favor composition over inheritance in renderers.
- Prettier enforces 2-space indentation and single quotes; run `npm run format` on feature branches and let ESLint (`eslint.config.js`) guard TypeScript rules plus Obsidian best practices.
- Name files after the primary concept (`DailyTasksTable.tsx`, `FrontmatterService.ts`). Tests should mirror targets with `.spec.ts` or `.test.tsx`.

## Testing Guidelines
- Jest powers unit and UI suites; reuse helpers from `tests/ui/helpers`.
- Playwright drives component and end-to-end coverage via `playwright-ct.config.ts` and `playwright-e2e.config.ts`; store vault fixtures in `tests/e2e/test-vault`.
- Aim for ≥70% statement coverage (see `COVERAGE_QUICK_REFERENCE.md`) and prioritize hot spots listed there when modifying core services.
- Update `specs/features` when workflows change and regenerate reports with `npm run bdd:coverage`.

## Commit & Pull Request Guidelines
- Follow the Conventional Commit style seen in history (`feat:`, `fix:`, `test:`) and include the issue or PR number when applicable (e.g., `feat: make all table columns sortable (#257)`).
- Keep commits focused, separating refactors from feature logic, and ensure PR descriptions include context, test commands run, and screenshots or GIFs for UI changes.
- Cross-check `manifest.json`, `versions.json`, and `CHANGELOG.md` before requesting review, and confirm CI (`check:all`, Playwright suites) is green.
