# AI Assistant Development Guidelines for Exocortex Plugin

## 🎯 Quick Command Reference

**⚠️ STEP 0 (MANDATORY): Before ANY task, create separate worktree!**

```bash
# ALWAYS start with this:
git worktree add ../exocortex-[task-name] -b feature/[description]
cd ../exocortex-[task-name]
git fetch origin main && git rebase origin/main
```

**ALWAYS use slash commands for these operations:**

```bash
/release [major|minor|patch] [desc]  # MANDATORY for releases - auto-versions and creates GitHub release
npm run test:all                     # MANDATORY for testing - run ALL tests before creating PR
/execute [task]                      # Complex multi-step tasks with agent orchestration
/status                              # Check current progress and project health
/agents                              # List available specialized agents
```

⚠️ **CRITICAL**:
- **NEVER work in main directory** - ALWAYS create worktree first (see RULE 0)
- Use `/release` for ANY code change to src/, tests/, or production files
- Use `npm run test:all` before creating PR (runs all tests, enforces BDD coverage ≥80%)
- Use `/execute` for complex tasks requiring multiple agents

## 🚨 Critical Rules

### RULE 0: Mandatory Worktree Isolation (CRITICAL - NEVER VIOLATE)

**🔴 ABSOLUTE REQUIREMENT: EVERY task MUST be done in a separate worktree. NEVER work in main directory.**

**Enforcement:**
```bash
# ✅ CORRECT - Always create worktree first
git worktree add ../exocortex-[task-name] -b feature/[description]
cd ../exocortex-[task-name]
# ... work here ...

# ❌ WRONG - Never work directly in main
cd /Users/kitelev/Documents/exocortex-obsidian-plugin
# ... edit files here ... ❌ BLOCKED!
```

**Why this is CRITICAL:**
- **Multi-instance safety**: 2-5 Claude instances work in parallel - working in main causes conflicts
- **Clean rollback**: Failed experiments don't pollute main directory
- **Atomic changes**: One worktree = one feature = one PR = clean history
- **No accidental main commits**: Impossible to `git commit` in main when you're in a worktree

**Before starting ANY task, ask yourself:**
1. ✅ Am I in a separate worktree?
2. ✅ Did I sync with latest main first?
3. ❌ Am I in `/Users/kitelev/Documents/exocortex-obsidian-plugin`? → STOP and create worktree!

**Workflow enforcement:**
```bash
# Step 0 (MANDATORY): Check current directory
pwd
# If output is main directory → create worktree immediately!

# Step 1: Create worktree
git worktree add ../exocortex-fix-bug -b feature/fix-bug
cd ../exocortex-fix-bug

# Step 2: Sync with main
git fetch origin main && git rebase origin/main

# Step 3: Make changes
# ... your work ...

# Step 4: Cleanup after merge
cd /Users/kitelev/Documents/exocortex-obsidian-plugin
git worktree remove ../exocortex-fix-bug
git pull origin main
```

**Valid exceptions (ONLY 2):**
1. Reading files for research (no edits)
2. Creating new worktree (then immediately switch to it)

**All other operations MUST be in worktree:**
- ✅ Code changes → worktree
- ✅ Documentation updates → worktree
- ✅ Test modifications → worktree
- ✅ Configuration changes → worktree
- ✅ ANY file edit → worktree

### RULE 1: PR-Based Workflow (MANDATORY)

**NEVER push directly to main.** All changes MUST go through Pull Requests.

**🚨 CRITICAL: Task is NOT complete after creating PR!**

**Task is COMPLETE ONLY when:**
1. ✅ CI pipeline passes (both checks GREEN)
2. ✅ PR merged to main
3. ✅ Auto-release workflow completes successfully

**DO NOT stop after `gh pr create`** - you MUST monitor and wait for:
- CI checks to pass (watch with `gh pr checks --watch`)
- PR to be merged (use `gh pr merge --auto --squash`)
- Release to be created (verify with `gh release list --limit 1`)

**Complete workflow (12 steps):**

```bash
# 1. Create feature branch in separate worktree
git worktree add ../exocortex-feature-name -b feature/description
cd ../exocortex-feature-name

# 2. Sync with latest main
git fetch origin main && git rebase origin/main

# 3. Make changes and test (MANDATORY)
npm run test:all  # MUST pass 100% - runs ALL tests

# 4. Commit (NO version bump - automatic!)
git commit -am "feat: user-facing description"

# 5. Push and create PR
git push origin feature/description
gh pr create --title "feat: description" --body "Details..."

# 6. Wait for CI checks (MANDATORY - both must be GREEN ✅)
gh pr checks --watch  # build-and-test + e2e-tests

# 7. Fix if any check fails (RED ❌)
git commit --amend --no-edit
git push --force-with-lease origin feature/description

# 8. If main changed, manually rebase your branch first
git fetch origin main && git rebase origin/main
git push --force-with-lease origin feature/description

# 9. Merge when all checks GREEN (squash merge)
gh pr merge --auto --squash   # All commits → 1 new commit on main

# 10. Automatic release (NO manual steps - tag-based versioning)
# ✅ auto-release.yml: analyzes commits, calculates version, builds plugin, creates tag + GitHub release
# ✅ CHANGELOG generated automatically from commit messages
# ✅ NO version bump commits (versions exist only as git tags)

# 11. Cleanup worktree
cd /Users/kitelev/Documents/exocortex-obsidian-plugin
git worktree remove ../exocortex-feature-name
git pull origin main

# 12. Verify release created
gh release list --limit 1
```

**Task is COMPLETE only when ALL steps pass:**
- [ ] Tests pass locally (100%)
- [ ] PR created and pushed
- [ ] CI checks GREEN (build-and-test + e2e-tests)
- [ ] PR merged to main
- [ ] Auto-version workflow completed
- [ ] Release visible in GitHub Releases
- [ ] Worktree cleaned up

**Version Management (Tag-Based):**
- 📌 package.json/manifest.json contain placeholder version `0.0.0-dev` in repository
- 📌 Real version determined ONLY during release from git tags
- 📌 auto-release.yml workflow:
  1. Gets last git tag (e.g., v12.19.0)
  2. Analyzes commit messages since last tag
  3. Determines bump type (major/minor/patch) from conventional commits
  4. Calculates new version (e.g., 12.19.1)
  5. Temporarily updates package.json/manifest.json for build
  6. Builds plugin with correct version
  7. Generates CHANGELOG from commit messages
  8. Creates git tag and GitHub release
- ❌ NO manual versioning (`npm version` commands)
- ❌ NO version bump commits in main branch
- ❌ NO manual CHANGELOG.md updates
- ✅ Versions exist only as git tags, not in source files
- ✅ Clean commit history without version noise

### RULE 2: Mandatory Agent Usage

**EVERY significant task MUST use specialized agents.**

- **ALWAYS use 3-5 agents in parallel** for non-trivial tasks
- **NEVER work alone** on complex features
- **Follow pipeline**: Product → Architecture → Implementation → QA → Documentation
- **See CLAUDE-agents.md** for patterns

### RULE 3: Test Before Push (CRITICAL)

**⚠️ MANDATORY TEST COVERAGE FOR ALL NEW CODE:**

**📝 Golden Rule: Every new feature MUST have tests BEFORE creating PR:**

1. **New Service → Unit Tests (MANDATORY)**
   - Example: `EffortVotingService.ts` → `EffortVotingService.test.ts`
   - Coverage: All public methods, edge cases, error scenarios
   - Pattern: Mock Vault, test file operations, verify frontmatter updates

2. **New Visibility Function → Unit Tests (MANDATORY)**
   - Example: `canVoteOnEffort()` → tests in `CommandVisibility.test.ts`
   - Coverage: All true/false branches, archived states, class types

3. **New UI Component → Component Tests (MANDATORY)**
   - Example: `VoteOnEffortButton.tsx` → `VoteOnEffortButton.spec.tsx`
   - Coverage: Render conditions, click handlers, prop variations
   - Use Playwright Component Testing

4. **New Command → Integration via Existing Tests (MANDATORY)**
   - Example: Vote command → update `CommandManager.test.ts` count
   - Coverage: Command registration, visibility, execution

**Test-First Development Checklist:**
```bash
# Step 1: Write implementation
# ... create service/component/function ...

# Step 2: IMMEDIATELY write tests (don't postpone!)
# ... create corresponding .test.ts or .spec.tsx ...

# Step 3: Run tests locally
npm run test:all   # MUST pass 100%

# Step 4: Only then commit and create PR
git commit -am "feat: description"
```

**NEVER create PR without tests for new code!**

**ALWAYS use `npm run test:all` before creating PR:**

```bash
npm run test:all   # Run ALL tests with quality gates (unit + ui + component + e2e)
```

**Requirements:**
- 100% tests passing
- BDD coverage ≥80% (enforced automatically)
- NEVER commit broken tests
- NEVER use `--no-verify` to bypass pre-commit hooks
- **NEVER create PR with untested new functionality**
- **🚨 NEVER DELETE TESTS WHEN THEY FAIL - FIX THEM INSTEAD! 🚨**

**⛔ ABSOLUTE PROHIBITION: Removing Tests**

When a test fails (especially in CI):
- ❌ **NEVER** remove the test to make CI green
- ❌ **NEVER** comment out failing tests
- ❌ **NEVER** skip tests with `.skip()` or similar
- ✅ **ALWAYS** debug and fix the failing test
- ✅ **ALWAYS** investigate why the test fails in CI but not locally
- ✅ **ALWAYS** add retry logic, increase timeouts, or fix environment issues

**Example of WRONG approach:**
```bash
# Test fails in CI
git rm tests/e2e/failing-test.spec.ts  # ❌ WRONG!
git commit -am "fix: remove failing test"  # ❌ TERRIBLE!
```

**Example of CORRECT approach:**
```bash
# Test fails in CI - investigate and fix!
# 1. Check CI logs for actual error
# 2. Identify environment difference (Docker vs local)
# 3. Add retry logic, increase timeouts, fix selectors
# 4. Test in Docker locally: npm run test:e2e:local
# 5. Fix the test until it passes
git commit -am "test: fix e2e test for Docker environment"  # ✅ CORRECT!
```

**Why this is critical:**
- Tests are documentation of expected behavior
- Removing tests hides bugs and regressions
- CI failures usually indicate real environment issues
- Future developers rely on comprehensive test coverage

**Test Coverage Matrix (MANDATORY):**

| Code Type | Test Type | Test File Location | Required Coverage |
|-----------|-----------|-------------------|-------------------|
| Service (`src/infrastructure/services/*.ts`) | Unit | `tests/unit/*.test.ts` | All methods, edge cases |
| Visibility Function (`CommandVisibility.ts`) | Unit | `tests/unit/CommandVisibility.test.ts` | All branches |
| UI Component (`src/presentation/components/*.tsx`) | Component | `tests/component/*.spec.tsx` | Render, clicks, props |
| Command (`CommandManager.ts`) | Integration | `tests/unit/CommandManager.test.ts` | Registration count |
| BDD Scenario (`.feature` file) | E2E | Cypress/Playwright test | Auto-checked by coverage |

### RULE 4: Branch Protection & Linear History

**Main branch is protected:**
- ❌ Direct pushes BLOCKED
- ✅ PR merge ONLY if all checks GREEN
- ✅ Linear history REQUIRED (rebase-only, no merge commits)
- ✅ No administrator bypass

**Required checks:**
1. **build-and-test**: Type check, lint, build, unit/ui/component tests, BDD coverage
2. **e2e-tests**: Docker integration tests, screenshot validation

**Merge strategy:**
- ✅ **Squash merge ONLY** (all commits → 1 new commit on main)
- ✅ **Combined with `required_linear_history`** (ensures no merge commits)
- ✅ **Combined with `strict: true`** (requires manual rebase if main changed)
- ❌ Regular rebase DISABLED (only squash merge allowed)
- ❌ Merge commits DISABLED (no merge bubbles)

**How it works:**
1. Developer manually rebases branch if main changed: `git rebase origin/main`
2. GitHub squash merge creates NEW commit on main with all changes
3. Result: Linear history with one commit per PR

**Note:** Squash merge is NOT git rebase - it creates a new commit. Manual rebase needed if main changed.

### RULE 5: Multi-Instance Awareness

⚠️ **This plugin is developed in PARALLEL by 2-5 Claude Code instances.**

**Coordination rules (enforced by RULE 0):**
- **One task = One worktree** (NEVER work in main directory - see RULE 0)
- **Worktree isolation prevents conflicts** between parallel instances
- Small, focused tasks (one feature/fix per worktree)
- Frequent syncs (fetch origin main before starting)
- Fast completion (don't leave worktrees open for days)
- Clean pipeline (never push broken code - blocks everyone)

**Why worktree is mandatory for multi-instance:**
```
❌ WITHOUT worktree (chaos):
Instance A (main dir): Edits file.ts → commit → push ❌ CONFLICT
Instance B (main dir): Edits file.ts → commit → push ❌ CONFLICT
Result: Merge conflicts, lost work, frustration

✅ WITH worktree (harmony):
Instance A (worktree-A): feature/add-x → PR #123 → merge → v12.5.11
Instance B (worktree-B): feature/add-y → PR #124 → merge → v12.5.12
Result: Clean sequential processing, no conflicts
```

**Race condition prevention:**
```
OLD: Instance A: v12.5.10 → v12.5.11 → push ❌ COLLISION
NEW: Instance A: PR merge → auto-version → v12.5.11 ✅
     Instance B: PR merge → auto-version → v12.5.12 ✅
(GitHub merge queue ensures sequential processing)
```

**Worktree Permissions:**

All permissions and agents are automatically available in every worktree because `.claude/settings.local.json` is tracked by git and copied during `git worktree add`.

✅ **No additional setup needed** - all slash commands, agents, and bash permissions work immediately in new worktrees.

The permissions file contains universal wildcards (`Bash(npm *)`, `Bash(git *)`, `SlashCommand(/test*)`, etc.) to cover all operations without requiring approval for each specific command.

### RULE 6: BDD Coverage Guarantee

**Every scenario in .feature files MUST have corresponding automated test (≥80% coverage).**

```bash
npm run bdd:coverage    # Show current coverage
npm run bdd:check       # Enforced in CI (must pass)
```

### RULE 7: Code Style

- **NO COMMENTS** unless explicitly requested
- Self-documenting code with clear naming
- Follow existing patterns in codebase
- TypeScript strict mode

### RULE 8: Documentation Updates (MANDATORY)

**NEVER forget to update README.md when adding/changing user-facing functionality.**

**Mandatory README.md updates for:**

1. **New Commands** → Add to "Available Commands" list
   - Example: "Vote on Effort" added after implementing voting feature
   - Include brief description in parentheses

2. **New Features** → Add to "Key Features" section
   - User-facing functionality must be documented
   - Use clear emoji bullets for scannability

3. **New Properties** → Document in relevant section
   - Example: `ems__Effort_votes` explained in "Effort Voting" section
   - Include property name, purpose, and usage

4. **Behavior Changes** → Update affected sections
   - Commands that change functionality
   - Modified UI elements
   - Changed workflows

**Checklist before creating PR:**
```bash
# ✅ Did I add a new command? → Update "Available Commands"
# ✅ Did I add a new feature? → Update "Key Features"
# ✅ Did I add a new property? → Document in relevant section
# ✅ Did I change existing behavior? → Update affected documentation

# If ANY of the above is YES, README.md MUST be updated!
```

**README.md is the user's first impression** - keep it current, accurate, and complete.

## 📊 Current Architecture

### Monorepo Structure

```
/packages
  /core                       - @exocortex/core (storage-agnostic business logic)
    /src
      /domain                 - Entities, value objects, repository interfaces
      /application            - Use cases, services
      /infrastructure         - File system adapters (IFileSystemAdapter)
    /tests                    - Unit tests for core logic

  /obsidian-plugin            - @exocortex/obsidian-plugin (Obsidian UI)
    /src
      /presentation           - UI components, modals, renderers
      /infrastructure         - Obsidian API integration (ObsidianVaultAdapter)
    /tests                    - Component, UI, E2E tests

  /cli                        - @exocortex/cli (command-line automation)
    /src                      - CLI commands and utilities
    /tests                    - CLI integration tests
```

### Technology Stack

```yaml
Monorepo:
  - npm workspaces (package management)
  - Shared dependencies across packages
  - Independent versioning per package

Core (@exocortex/core):
  - TypeScript 4.9+ (strict mode)
  - Zero external dependencies (pure business logic)
  - Storage-agnostic design

Obsidian Plugin (@exocortex/obsidian-plugin):
  - Obsidian Plugin API 1.5.0+
  - ESBuild (bundling)
  - React 19.2.0 (UI components)
  - Depends on @exocortex/core

CLI (@exocortex/cli):
  - Node.js 18+
  - Commander.js (CLI framework)
  - Depends on @exocortex/core

Testing:
  - Jest (unit tests: 803 total across all packages)
  - Playwright CT (8 component tests)
  - Playwright E2E (6 Docker-based integration tests)
  - Total execution: ~15s (unit) + ~3min (E2E)
  - Coverage: 49% global, 78-80% domain layer

CI/CD:
  - GitHub Actions
  - Automated releases
  - Branch protection
  - Quality gates
```

### Key Features

- React component architecture with isolated state management
- Interactive table sorting with visual indicators (▲/▼)
- Clickable Instance Class links for navigation
- Archived asset filtering (multi-format support)
- Mobile/iOS support with touch-optimized UI
- Platform-specific performance optimizations

## 🔧 Development Patterns

### Repository Pattern

```typescript
interface IAssetRepository {
  findById(id: AssetId): Promise<Asset | null>;
  save(asset: Asset): Promise<void>;
  updateFrontmatter(path: string, frontmatter: Record<string, any>): Promise<void>;
}
```

### Result Pattern (Error Handling)

```typescript
export class Result<T> {
  static ok<U>(value: U): Result<U>;
  static fail<U>(error: string): Result<U>;

  isSuccess: boolean;
  getValue(): T | null;
  getError(): string;
}

// Usage
const assetResult = Asset.create(props);
if (!assetResult.isSuccess) {
  console.error(assetResult.getError());
  return;
}
```

### Performance Optimization

**IndexedGraph** (10x query speed):
- SPO/POS/OSP indexes for O(1) lookups
- Batch processing (5x faster bulk imports)
- LRU cache (90% hit rate)

**Mobile Optimization**:
- Platform-aware batch sizes (10 mobile / 50 desktop)
- Adaptive caching based on device capabilities
- Touch gestures with momentum and haptic feedback

## 🚀 Quick Start

### Understanding Monorepo Codebase

**Key Entry Points:**

1. **Core Package** (`packages/core/`)
   - `src/domain/` - Business entities and rules
   - `src/application/` - Services and use cases
   - `src/infrastructure/IFileSystemAdapter.ts` - Storage abstraction

2. **Obsidian Plugin** (`packages/obsidian-plugin/`)
   - `src/main.ts` - Plugin entry point
   - `src/presentation/` - UI components and renderers
   - `src/infrastructure/ObsidianVaultAdapter.ts` - Obsidian API integration

3. **CLI Tool** (`packages/cli/`)
   - `src/index.ts` - CLI entry point
   - `src/commands/` - Command implementations

4. **Tests**
   - `packages/core/tests/` - Core business logic tests
   - `packages/obsidian-plugin/tests/` - UI, component, E2E tests
   - `packages/cli/tests/` - CLI integration tests

### Commit Message Format

```
feat: new feature
fix: bug fix
docs: documentation change
refactor: code refactoring
perf: performance improvement
test: test addition/modification
chore: maintenance task

# BREAKING CHANGE in body triggers major version bump
```

## 📋 Business Requirements

### Functional Requirements

- **FR-001**: RDF Triple Store (SPO/POS/OSP indexing)
- **FR-002**: Graph Query Engine (SELECT, CONSTRUCT, ASK)
- **FR-003**: OWL Ontology Management (class hierarchies)
- **FR-004**: Obsidian Integration (note-to-RDF conversion)
- **FR-005**: Interactive knowledge graph visualization

### Non-Functional Requirements

- **NFR-001**: Performance <100ms queries (10k triples)
- **NFR-002**: 99.9% reliability
- **NFR-003**: <30 minute learning curve
- **NFR-004**: 70%+ test coverage
- **NFR-005**: Privacy-first (no external data transmission)

### Security Controls

- Input validation (query sanitization, IRI/path validation)
- Access control (local-only, Obsidian permission model)
- Data protection (no telemetry, GDPR-ready)

## 📊 Quality Metrics

**Required:**
- Test suite: 803 unit tests + 8 component tests + 6 E2E tests (total: 817 tests)
- Coverage: ≥49% global, ≥78-80% domain layer
- BDD coverage: ≥80%
- TypeScript: Clean compilation (strict mode)
- Build: <2 minutes (all packages)
- Agent utilization: >80% for complex tasks

**Monitored:**
- Bundle size: Obsidian plugin ~206kb (React: 171kb, Plugin: 35kb)
- Test execution: ~15s (unit) + ~3min (E2E)
- Task success rate: >95% with agents
- Monorepo package interdependencies

## 🆘 Troubleshooting

### Common Issues

1. **Tests failing**: Check mock setup in `__mocks__/obsidian.ts`
2. **Build errors**: Run `npm run build` for detailed output
3. **Coverage low**: Add tests for uncovered branches
4. **E2E timeout**: Verify CSS selectors match actual rendered classes in screenshots
5. **Obsolete dependencies**: Audit code for unused plugin availability checks

### E2E Testing Critical Lessons

**5 key lessons from v12.15.45-49 debugging (5 versions, 4 failures):**

1. **Screenshot Analysis First**: Screenshots show actual rendered state - don't assume plugin broken when tests fail
2. **Read Source Code**: Finds root cause faster than trial-and-error (`.exocortex-layout-container` never existed)
3. **Audit Obsolete Dependencies**: Code evolves but old checks remain (Dataview availability blocked E2E Docker)
4. **E2E Environment ≠ Production**: Docker lacks optional plugins, creates different code paths
5. **Verify CSS Selectors**: Always check selectors exist in actual rendered output before writing tests

**4 additional lessons from v12.30.5 debugging (PR #37 after main branch rebase):**

6. **Docker Environment Variables**: Docker containers don't inherit GitHub Actions environment variables automatically
   - Problem: `process.env.CI` was undefined in Docker → Playwright retries disabled (`retries: 0` instead of `retries: 2`)
   - Solution: Export `CI=1` explicitly in `docker-entrypoint-e2e.sh`
   - Location: `docker-entrypoint-e2e.sh:9`
   - Lesson: Always export required environment variables in Docker entrypoint scripts

7. **Modal Timing Race Condition**: Modal dialogs can appear unpredictably in headless Electron + Docker
   - Problem: Tests waited for `.exocortex-buttons-section`, but modals blocked plugin rendering
   - Solution: Always call `waitForModalsToClose()` BEFORE `waitForElement()` for UI elements
   - Pattern: `await launcher.waitForModalsToClose(10000);` → then `await launcher.waitForElement('.selector', 60000);`
   - Lesson: Handle transient UI states (modals, loading indicators) before asserting on main UI

8. **Auto-Merge Requirements**: GitHub auto-merge requires branch to be up-to-date with base branch
   - Problem: PR had `auto-merge: enabled` but stayed OPEN with `mergeStateStatus: BEHIND`
   - Solution: Rebase feature branch with main: `git fetch origin main && git rebase origin/main && git push --force-with-lease`
   - Trigger: After rebase, CI reruns and auto-merge activates automatically when all checks GREEN
   - Lesson: Auto-merge doesn't trigger until: (1) All CI checks GREEN, (2) Branch up-to-date, (3) No conflicts

9. **Playwright Retries Configuration**: Retry behavior depends on runtime environment detection
   - Config: `retries: process.env.CI ? 2 : 0` in `playwright-e2e.config.ts:7`
   - Problem: First test (cold start) failed in CI, but no retries happened
   - Root cause: `CI` variable not set → Playwright treated CI as local environment → 0 retries
   - Solution: Combined with Lesson #6 (export CI=1 in Docker entrypoint)
   - Lesson: Verify environment-dependent configurations work in all execution contexts (local, Docker, CI)

### E2E Tests: Docker-Only Policy (MANDATORY)

**⚠️ CRITICAL: E2E tests MUST run in Docker locally - NEVER directly via npm run test:e2e**

**Why Docker-only is mandatory:**

1. **Environment Parity**: Docker environment matches GitHub Actions CI exactly
   - Same Obsidian version (1.9.14)
   - Same OS (Ubuntu Jammy)
   - Same dependencies and plugins
   - Prevents "works locally, fails in CI" scenarios

2. **Isolation**: Docker ensures clean, reproducible test environment
   - No interference from local Obsidian settings
   - No cached data between runs
   - No host system pollution

3. **Performance Optimization**: Tests are optimized for Docker
   - Parallel execution (workers: 3)
   - Shared Obsidian fixtures per worker
   - Multi-worker CDP port allocation (9222, 9223, 9224)
   - Reduced timeouts (60s instead of 180s)

**Correct commands:**

```bash
# ✅ CORRECT - Local E2E testing (Docker)
npm run test:e2e:local        # Runs in Docker with BuildKit cache (fast rebuilds)

# ✅ CORRECT - Full test suite (includes E2E via Docker)
npm run test:all              # Runs unit + ui + component + e2e (Docker)

# ⚠️ CI-ONLY - Direct E2E execution (Docker environment assumed)
npm run test:e2e              # Used ONLY by Docker entrypoint in CI

# ❌ WRONG - Never run E2E directly on host
playwright test -c playwright-e2e.config.ts  # BLOCKED - use Docker!
```

**BuildKit Cache benefits (local development):**

```bash
# First run: ~60 seconds (builds from scratch)
npm run test:e2e:local

# Subsequent runs: ~5-10 seconds (cache hit)
# Only changed layers rebuild
# Obsidian base image cached (/tmp/.buildx-cache)
# npm dependencies cached
```

**Actual CSS classes** (from UniversalLayoutRenderer.ts):
```typescript
exocortex-buttons-section          // line 439
exocortex-properties-section       // line 1072
exocortex-daily-tasks-section      // line 1149
exocortex-assets-relations         // line 1196
// NOTE: .exocortex-layout-container does NOT exist!
```

## 📚 Key Resources

**Internal:**
- `ARCHITECTURE.md` - System design
- `CLAUDE-agents.md` - Agent patterns and parallel execution
- `CLAUDE-test-patterns.md` - Test infrastructure patterns
- `docs/` - Requirements and ADRs
- `.claude/commands/` - Slash command definitions

**External:**
- [Obsidian Plugin API](https://docs.obsidian.md/)
- [RDF Primer](https://www.w3.org/TR/rdf-primer/)

## 🔄 Continuous Improvement

After each task:
1. Update documentation if patterns change
2. Refactor for clarity
3. Add tests for edge cases discovered
4. Document error patterns and resolutions

---

**Remember**: You are an AI assistant working on a professional software product. Write code that is clear, tested, and maintainable. Focus on user value over technical complexity.
