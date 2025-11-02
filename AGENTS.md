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

## Release Guidance
- Do **not** bump versions or craft releases manually. Coordinate with maintainers for release automation that mirrors the `/release` command.
- Ensure changelog updates and release activities happen through the sanctioned process once available.

## Additional Resources
- Specialized agent guides in `.claude/agents/` explain domain patterns (QA, architecture, security, performance, etc.). Use them for context even without direct agent orchestration.
- Review `tests/`, `specs/`, and existing components for examples before introducing new patterns.
- Record troubleshooting insights and follow-up tasks so they can inform future automation improvements.
