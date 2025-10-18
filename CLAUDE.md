# AI Assistant Development Guidelines for Exocortex Plugin

## 🎯 UNIVERSAL EXECUTION COMMAND

### Quick Access via Slash Commands:

Custom slash commands are now available in `.claude/commands/` directory:

**Available commands:**

- `/execute [task]` - Execute with BABOK requirements interview, PMBOK planning, and full delivery pipeline
- `/status` - Check current progress and project health
- `/agents` - List available agents and capabilities
- `/release [type] [desc]` - **MANDATORY for releases** - Invokes release-agent with 20-step zero-tolerance process
- `/test [pattern]` - **MANDATORY for testing** - Invokes obsidian-qa-expert with Playwright hang prevention

⚠️ **CRITICAL**: For ANY release, ALWAYS use `/release` command. It guarantees release-agent execution.
⚠️ **CRITICAL**: For ANY testing, ALWAYS use `/test` command. It guarantees hang prevention and quality gates.

### 📋 MANDATORY AGENT COMMAND USAGE

**CRITICAL**: Always use specialized agents through slash commands for these operations:

#### Release Operations - MANDATORY
```bash
/release [major|minor|patch] [description]
```
- **ALWAYS use this command** for ANY release
- **NEVER** manually execute release steps without this command
- **Agent**: release-agent (20-step zero-tolerance process)
- **Guarantees**: Version bump, tests, CI/CD, release creation, GitHub verification

**When to use `/release`:**
- ✅ After committing code changes to src/, tests/, or production files
- ✅ When user explicitly requests release creation
- ✅ After feature completion requiring deployment
- ✅ When CI/CD pipeline needs to be triggered
- ✅ For version bump and changelog update

**VIOLATIONS - NEVER do these:**
- ❌ Manual version bump without `/release`
- ❌ Manual git tag creation
- ❌ Manual GitHub release creation
- ❌ Direct push expecting auto-release without verification

#### Testing Operations - MANDATORY
```bash
/test [unit|ui|component|all|pattern]
```
- **ALWAYS use this command** for comprehensive testing
- **NEVER** run `npm test` directly (risks Playwright hangs, missing quality gates)
- **Agent**: obsidian-qa-expert (20 years Obsidian/TypeScript/Playwright experience)
- **Guarantees**: Hang prevention, quality gates validation, BDD coverage check, failure analysis

**When to use `/test`:**
- ✅ Before committing any code changes
- ✅ After implementing new features or bug fixes
- ✅ When debugging test failures
- ✅ For comprehensive quality validation before release
- ✅ When user explicitly requests test execution
- ✅ As part of development workflow (TDD/BDD)

**VIOLATIONS - NEVER do these:**
- ❌ Direct `npm test` execution (Playwright may hang)
- ❌ Skipping BDD coverage check
- ❌ Skipping quality gates validation
- ❌ Not handling Playwright HTTP server hang
- ❌ Running component tests without timeout wrapper

#### Execution Operations - Optional but Recommended
```bash
/execute [task description]
```
- **USE for complex multi-step tasks** requiring multiple agents
- **Agent**: orchestrator (coordinates 3-5+ specialized agents)
- **Guarantees**: BABOK requirements, PMBOK planning, SWEBOK design, parallel execution

**When to use `/execute`:**
- ✅ Complex feature implementation (multiple files, cross-domain)
- ✅ Major refactoring or architecture changes
- ✅ Full development pipeline execution (requirements → design → implementation → testing → docs)

### Why Mandatory Commands Matter

**Problem without commands:**
- ❌ Playwright hangs waste time (requires manual Ctrl+C, output analysis difficult)
- ❌ Forgotten quality gates (BDD coverage, performance, pass rate)
- ❌ Inconsistent release process (missed steps, incomplete verification)
- ❌ Manual work prone to human error

**Solution with commands:**
- ✅ Automated hang prevention (timeout wrappers, output parsing)
- ✅ Enforced quality gates (BDD ≥80%, 100% pass rate, performance thresholds)
- ✅ Standardized processes (20-step release, 5-phase testing)
- ✅ Comprehensive reporting (failures analyzed, fixes suggested)
- ✅ Agent expertise (20+ years experience encoded)

**Enhanced Execution Flow (v3.5.0):**
1. **BABOK Requirements Interview** - Structured requirements elicitation
2. **PMBOK Project Planning** - WBS, risk analysis, resource planning
3. **SWEBOK Engineering Design** - Technical architecture and patterns
4. **Parallel Agent Execution** - Orchestrated implementation
5. **Quality Gates & Release** - Automated validation and deployment

**Usage:** Type `/` in Claude Code to see available commands

**See `.claude/commands/` directory for command definitions**

## 🚨 CRITICAL: MANDATORY AGENT USAGE

**EVERY significant task MUST use specialized agents.** Not using agents is a violation of project standards.

### Agent Usage Rules

1. **ALWAYS use 3-5 agents in parallel** for any non-trivial task
2. **NEVER work alone** - agents provide specialized expertise
3. **Follow Feature Development Pipeline**: Product → Architecture → Implementation → QA → Documentation
4. **Check CLAUDE-agents.md** for patterns and selection

## 🤖 AI-First Development Approach

This codebase is optimized for development through AI assistants (Claude Code, GPT-5/Cursor, GitHub Copilot). All documentation, code structure, and workflows are designed for maximum AI comprehension and efficiency.

### 🧠 ENHANCED MULTI-AGENT INTELLIGENCE

- **27+ Specialized Agents**: Complete professional software development coverage with dynamic agent creation
- **Slash Command Integration**: Quick access via /execute, /status, /agents, /release, /test commands
- **Automatic Request Analysis**: NLP-powered complexity and domain detection
- **Parallel Execution Optimization**: 40-60% faster completion through intelligent orchestration
- **Success Pattern Learning**: Automated extraction and replication of winning approaches
- **Quality Gate Integration**: CMMI/ISO standards embedded in every agent interaction

## 🔀 Multi-Instance Development Workflow

⚠️ **CRITICAL AWARENESS**: This plugin is developed in PARALLEL by multiple Claude Code instances. Each instance works in a separate git worktree.

### Multi-Instance Environment Rules

**YOU ARE ONE OF SEVERAL PARALLEL DEVELOPERS:**
- 2-5 Claude Code instances working simultaneously
- Each instance operates in its own isolated git worktree
- Shared main repository - your changes affect others
- Coordination through git commits and GitHub Actions

### MANDATORY: One Task = One Worktree

**NEVER work directly in main worktree directory**

For EACH new task:
```bash
# 1. Create new worktree for the task
git worktree add ../exocortex-task-name -b feature/task-name

# 2. Move to worktree
cd ../exocortex-task-name

# 3. Sync with latest main
git fetch origin main
git rebase origin/main

# 4. Work on task in isolation
# ... your changes ...

# 5. Test locally
npm test:all

# 6. Commit (NO version bump - handled automatically!)
git commit -am "feat: description"

# 7. Push and create PR
git push origin feature/task-name
gh pr create --title "feat: description" --body "Detailed description..."

# 8. Wait for CI checks to complete
gh pr checks --watch

# 9. Auto-merge when all checks GREEN
gh pr merge --auto --squash

# 10. Cleanup after successful merge
cd /Users/kitelev/Documents/exocortex-obsidian-plugin
git worktree remove ../exocortex-task-name
git pull origin main  # Get auto-versioned commit
```

### Task Completion Criteria (MANDATORY)

**A task is COMPLETE only when ALL these steps pass:**

```
1. ✅ npm test:all - ALL tests passing locally (100%)
2. ✅ Changes committed with conventional commit message (feat:/fix:/etc)
3. ✅ PR created and pushed to GitHub
4. ✅ CI checks passing - build-and-test ✅ + e2e-tests ✅
5. ✅ PR merged to main (auto-merge or manual)
6. ✅ Auto-version workflow completed (version bump automatic)
7. ✅ Release created automatically and visible in GitHub Releases
```

**INCOMPLETE = NOT DONE**

If ANY step fails:
- ❌ Task is NOT complete
- ❌ Do NOT move to next task
- ❌ FIX the issue immediately (amend commit, force push, rerun checks)
- ❌ Do NOT leave broken code for other instances

**Version bumping is AUTOMATIC:**
- ✅ NO manual `npm version patch` needed
- ✅ NO manual manifest.json sync needed
- ✅ NO manual CHANGELOG.md update needed
- ✅ All handled by `pr-auto-version.yml` workflow after PR merge

### Pre-Work Synchronization (MANDATORY)

**BEFORE starting ANY task:**

```bash
# 1. Check current worktree location
pwd  # Should be in a task-specific worktree

# 2. Fetch latest from main
git fetch origin main

# 3. Check for conflicts with recent changes
git log main..origin/main --oneline  # See what changed

# 4. Rebase if needed
git rebase origin/main

# 5. Verify clean state
git status  # Should be clean
```

### Conflict Prevention in Multi-Instance Environment

1. **Small, Focused Tasks**: One feature/fix per worktree
2. **Frequent Syncs**: Pull from main before starting, after finishing
3. **Clear Commit Messages**: Help other instances understand your changes
4. **Fast Completion**: Don't leave worktrees open for days
5. **Clean Pipeline**: Never push broken code - it blocks everyone

### Why This Matters - Race Condition Solution

**Problem:** Manual version bumps create race conditions
```
Instance A: v12.5.10 → v12.5.11 (push)
Instance B: v12.5.10 → v12.5.11 (push)  ❌ COLLISION!
```

**Solution:** PR-based workflow with sequential merging
```
Instance A: PR merge → auto-version → v12.5.11 ✅
Instance B: PR merge → auto-version → v12.5.12 ✅
(GitHub merge queue ensures sequential processing)
```

In multi-instance environment:
- ✅ **No version collisions** - GitHub merge queue is atomic
- ✅ **No broken pipeline** - branch protection blocks bad merges
- ✅ **No manual versioning** - automatic and consistent
- ✅ **Safe rollback** - every change is a revertable PR

**Complete tasks fully. Push green code. Keep pipeline healthy.**

## 🔒 Branch Protection & Required CI Checks

**CRITICAL:** The `main` branch is protected. You CANNOT push directly to main. All changes MUST go through Pull Requests.

### Protected Branch Rules

**Branch:** `main`

**Enforcement:**
- ❌ **Direct pushes BLOCKED** - must use PR
- ✅ **PR merge allowed ONLY if** all required checks pass
- ✅ **Merge button disabled** until checks are GREEN
- ✅ **Administrators cannot bypass** - rules enforced for everyone

### Required Status Checks

Before PR can be merged, these checks MUST pass:

1. **build-and-test** (from `.github/workflows/ci.yml`)
   - Type checking
   - Linting
   - Build compilation
   - Unit tests
   - UI integration tests
   - Component tests (Playwright)
   - BDD coverage check (≥80%)

2. **e2e-tests** (from `.github/workflows/ci.yml`)
   - End-to-end tests in Docker
   - Full plugin integration tests
   - Screenshot validation

**Both checks must be GREEN ✅ before merge is possible.**

### Checking CI Status

```bash
# View current PR check status
gh pr checks

# Watch checks in real-time (wait until complete)
gh pr checks --watch

# View detailed status with JSON
gh pr view --json statusCheckRollup

# Attempt auto-merge (will fail if checks not green)
gh pr merge --auto --squash
```

### When Checks Fail

If any check fails (RED ❌):

```bash
# 1. Identify the failure
gh pr checks  # See which check failed

# 2. Fix the code locally
# ... make fixes ...

# 3. Amend commit and force push
git commit --amend --no-edit
git push --force-with-lease origin feature/branch-name

# 4. Wait for checks to re-run
gh pr checks --watch

# 5. Merge when GREEN
gh pr merge --auto --squash
```

**NEVER skip failing checks. Fix them.**

### Setup (One-Time)

Branch protection is already configured. If you need to set it up on a new repository:

```bash
# Run automated setup script
.github/scripts/setup-branch-protection.sh

# Or see manual instructions
cat .github/BRANCH_PROTECTION.md
```

### What You'll See

When trying to push directly to main:
```
remote: error: GH006: Protected branch update failed
To github.com:kitelev/exocortex-obsidian-plugin.git
 ! [remote rejected] main -> main (protected branch hook declined)
error: failed to push some refs
```

**This is CORRECT behavior. Use PR workflow instead.**

## 🎯 Mission Statement

Execute every request as a highly qualified Senior IT specialist with extensive experience in knowledge management systems, semantic web technologies, and Obsidian plugin development.

## 📊 Architecture Overview

### Terminology (CRITICAL)

**Layout Rendering:**

- **AutoLayout**: The plugin automatically displays related assets below metadata (frontmatter) in reading/preview mode. This is always enabled and requires no configuration.

**IMPORTANT**: Layout rendering is automatic and always active. Users see properties and relations tables below frontmatter in all notes when viewing in reading mode.

### Current Implementation (v12.2.5)

- **React Component Architecture** (v11.5.3): Isolated state management with independent table sorting
- **Clickable Instance Class Links** (v11.2.3): Instance Class displayed as internal links for quick navigation
- **Interactive Table Sorting** (v11.5.3): Independent sort state per table with visual indicators (▲/▼)
- **Archived Asset Filtering** (v11.3.0): Automatic filtering of archived assets with multi-format support
- **Mobile/iOS Support**: Complete mobile experience with touch-optimized UI and platform-specific optimizations
- **React Components**: AssetRelationsTable with grouping and independent sorting
- **Domain Layer**: Asset-based entities with Clean Architecture and mobile performance optimizations
- **Slash Commands**: Quick execution commands (/execute, /status, /agents, /release, /test) for efficient development workflow
- **Testing Excellence**: 14 tests passing (100%) - 6 UI + 8 component (React-only tests)
- **CI/CD**: Optimized GitHub Actions with automated releases on test success
- **Performance**: Fast build times (<1min), optimized bundle (206kb)
- **Architecture**: Clean Architecture with comprehensive test infrastructure and security validation
- **BOK Standards**: Full BABOK/PMBOK/SWEBOK compliance for enterprise-grade development

### Technology Stack

```yaml
Core:
  - TypeScript 4.9+ with strict mode
  - Obsidian Plugin API 1.5.0+
  - ESBuild for bundling

Domain:
  - RDF triple store with SPO/POS/OSP indexing
  - Graph query engine
  - OWL ontology management

Testing:
  - Playwright Component Testing (8 tests for React components)
  - UI Integration tests with jest-environment-obsidian (6 tests)
  - 14 tests total (6 UI + 8 component)
  - Test execution time: ~3 seconds total
  - Focus on React components only (legacy tests removed)

CI/CD:
  - GitHub Actions automated releases
  - Semantic versioning
  - Automated changelog generation
  - Quality gates - tests must pass before release
```

## 📋 Implementation Guidelines

### Technical Implementation Details

#### Technology Stack (v11.5.4)

- **Language**: TypeScript 4.7.4 with strict mode
- **Build System**: ESBuild 0.17.3 (fast compilation and bundling)
- **Testing Framework**: Jest 30.0.5 with jsdom, Playwright Component Testing 1.55.1
- **Plugin Framework**: Obsidian Plugin API with mobile compatibility
- **UI Framework**: React 19.2.0 + React DOM for component rendering
- **Dependencies**: js-yaml 4.1.0, uuid 11.1.0, @types/uuid 10.0.0
- **Mobile Support**: Native iOS/Android detection, responsive React components
- **Test Infrastructure**: jest-environment-obsidian 0.0.1 for UI integration tests

#### Architecture Layers

**Domain Layer** (`/src/domain/`)

- **Entities**: Asset, ButtonCommand, ClassLayout, LayoutBlock, Ontology, UIButton
- **Value Objects**: AssetId, ClassName, OntologyPrefix
- **Repository Interfaces**: IAssetRepository, IButtonRepository, etc.
- **Core Patterns**: Entity, AggregateRoot, Result for error handling

**Application Layer** (`/src/application/`)

- **Use Cases**: CreateAssetUseCase, PropertyEditingUseCase, RenderClassButtonsUseCase
- **Services**: ICommandExecutor interface
- **Core**: Container for dependency injection, UseCase base class

**Infrastructure Layer** (`/src/infrastructure/`)

- **Repositories**: Obsidian-specific implementations
- **Services**: ObsidianCommandExecutor
- **Container**: DIContainer with comprehensive dependency registration
- **Adapters**: ObsidianVaultAdapter

**Presentation Layer** (`/src/presentation/`)

- **Components**: ButtonRenderer, PropertyRenderer
- **Modals**: ClassTreeModal, CreateAssetModal
- **Renderers**: LayoutRenderer, QueryBlockRenderer, BacklinksBlockRenderer

### Key Patterns Successfully Implemented

#### Repository Pattern

```typescript
interface IAssetRepository {
  findById(id: AssetId): Promise<Asset | null>;
  save(asset: Asset): Promise<void>;
  updateFrontmatter(
    path: string,
    frontmatter: Record<string, any>,
  ): Promise<void>;
}
```

#### Query Engine Abstraction Pattern (v3.0.0)

```typescript
interface IQueryEngine {
  executeQuery(
    query: string,
    context: QueryContext,
  ): Promise<Result<QueryResult>>;
  renderQuery(container: HTMLElement, query: string): Promise<Result<void>>;
  getPages(options: GetPagesOptions): Promise<Result<PageData[]>>;
}

// Factory with automatic fallback
class QueryEngineFactory {
  async createQueryEngine(
    preferred?: QueryEngineType,
  ): Promise<Result<IQueryEngine>> {
    // Auto-detection with fallback logic
  }
}
```

#### Mobile Performance Optimization Pattern (v3.0.0)

```typescript
class MobilePerformanceOptimizer {
  // Platform-aware performance tuning
  private readonly MOBILE_BATCH_SIZE = 10;
  private readonly DESKTOP_BATCH_SIZE = 50;

  // Adaptive caching based on device capabilities
  optimizeForDevice(operation: Operation): OptimizedOperation;
}
```

#### Touch Controller Pattern (v3.0.0)

```typescript
class TouchGraphController {
  // Gesture recognition with momentum and haptic feedback
  handlePinchGesture(event: TouchEvent): void;
  handlePanGesture(event: TouchEvent): void;
  provideMomentumAnimation(velocity: Vector2D): void;
}
```

#### Result Pattern for Error Handling

```typescript
export class Result<T> {
  static ok<U>(value: U): Result<U> {
    /* ... */
  }
  static fail<U>(error: string): Result<U> {
    /* ... */
  }

  isSuccess: boolean;
  getValue(): T | null;
  getError(): string;
}
```

#### Performance Optimizations

**IndexedGraph Implementation** (v2.8.0+)

- **Problem**: O(n) lookups in large graphs
- **Solution**: SPO/POS/OSP indexes for O(1) lookups
- **Result**: 10x query speed improvement
- **Batch Processing**: 5x faster bulk imports
- **Query Caching**: 90% cache hit rate with LRU cache

## 🚀 Quick Start for AI Assistants

### Understanding the Codebase

1. Start with `/src/main.ts` - plugin entry point
2. Review `/src/domain/` - core business logic
3. Check `/src/infrastructure/container/DIContainer.ts` - dependency wiring
4. Read test files for usage examples

### Making Changes (PR-Based Workflow)

```bash
# 1. Create feature branch in separate worktree
git worktree add ../exocortex-feature-name -b feature/description
cd ../exocortex-feature-name

# 2. Sync with latest main
git fetch origin main
git rebase origin/main

# 3. Make your changes following patterns in existing code
# ... code changes ...

# 4. Run tests locally (MANDATORY: use /test command or npm test:all)
npm test:all
# OR: /test

# 5. Build to verify compilation
npm run build

# 6. Commit with conventional message (NO version bump!)
git commit -am "feat: your feature description"

# 7. Push and create PR
git push origin feature/description
gh pr create --title "feat: description" --body "Detailed description..."

# 8. Wait for CI checks to pass
gh pr checks --watch

# 9. Merge when all checks GREEN
gh pr merge --auto --squash

# 10. Cleanup worktree
cd /Users/kitelev/Documents/exocortex-obsidian-plugin
git worktree remove ../exocortex-feature-name
git pull origin main  # Get auto-versioned commit

# Version bump, CHANGELOG update, and release happen automatically!
```

## 📁 Project Structure

```
/src
  /domain           - Business entities and value objects
    /core           - Entity, Result patterns
    /entities       - Asset, Ontology, ClassLayout
    /semantic       - RDF/OWL implementation
    /repositories   - Repository interfaces

  /application      - Use cases and services
    /use-cases      - Business operations
    /services       - Application services
    /ports          - External interfaces

  /infrastructure   - External adapters
    /container      - Dependency injection
    /repositories   - Obsidian implementations
    /services       - Command execution

  /presentation     - UI components
    /components     - Renderers
    /modals         - User dialogs

/tests              - Test suite
  /unit             - Unit tests with mocks
  /integration      - Integration tests
  /__mocks__        - Obsidian API mocks
```

## 🔧 Development Guidelines

### 1. Code Style

- **NO COMMENTS** unless explicitly requested
- Self-documenting code with clear naming
- Follow existing patterns in the codebase
- Use TypeScript strict mode

### 2. Testing Requirements

- Write tests for all new code
- Maintain 70%+ coverage
- Use existing mock infrastructure
- Follow AAA pattern (Arrange, Act, Assert)

**MANDATORY - Use /test Command:**
- **ALWAYS use `/test` command** instead of direct `npm test`
- The obsidian-qa-expert agent handles Playwright hangs automatically
- Quality gates (BDD coverage ≥80%, 100% pass rate, performance) enforced automatically
- Comprehensive reporting with failure analysis included
- Specialized agent with 20 years Obsidian plugin testing experience

**CRITICAL - Prevent Test Hangs:**
- Playwright component tests may open HTTP server after completion
- If you ever see "Serving HTML report at http://localhost:XXXX. Press Ctrl+C to quit"
- IMMEDIATELY recognize this as process hang and analyze test results BEFORE the hang
- Test results appear BEFORE the HTTP server message
- Count passed/failed tests and proceed based on results, don't wait for process to exit
- **NOTE**: `/test` command handles this automatically with timeout wrappers

**Test Execution via /test:**
```bash
/test              # Run all tests (unit, ui, component) with quality gates
/test unit         # Run only unit tests
/test ui           # Run only UI integration tests
/test component    # Run only Playwright CT tests (hang-safe)
/test pattern      # Run specific test pattern
```

### 3. Architecture Principles

- **Clean Architecture**: Separate concerns by layer
- **SOLID**: Single responsibility, Open-closed, etc.
- **DDD**: Rich domain models
- **Privacy-First**: UUID-based public identifiers

### 4. Git Workflow

```bash
# Feature development
git checkout -b feature/description
npm test
# make changes
npm test
git commit -m "feat: description"
git push origin feature/description
# Create PR

# Direct to main (for AI assistants)
npm test
# make changes
npm test
git add -A
git commit -m "type: description"
git push origin main
# GitHub Actions handles release
```

## 📝 Commit Message Format

```
feat: new feature
fix: bug fix
docs: documentation change
style: code style change
refactor: code refactoring
perf: performance improvement
test: test addition/modification
chore: maintenance task
```

## 🚨 Critical Rules (ENHANCED)

### RULE 0: MANDATORY AGENT USAGE

**ALWAYS use agents for complex tasks**:

- Multiple files, cross-domain work, or technical standards
- Feature development, bug investigation, system analysis
- Implementation, optimization, testing, or enhancement work

**VIOLATION**: Working alone on complex tasks is a project standard violation

### RULE 1: MANDATORY RELEASE AFTER EVERY CODE CHANGE

**CRITICAL**: EVERY code change to src/, tests/, or any production file MUST result in a release.

**NO EXCEPTIONS**: If you changed code, you MUST create a release. Period.

⚠️ **MULTI-INSTANCE CONTEXT**: You are one of several parallel developers. Your incomplete task or broken pipeline blocks other Claude Code instances from releasing. Complete ALL steps before considering task done.

### PR-Based Workflow (MANDATORY)

Every code change MUST follow this exact sequence:

**1. Create feature branch in separate worktree**
```bash
git worktree add ../exocortex-feature-name -b feature/description
cd ../exocortex-feature-name
```

**2. Sync with latest main**
```bash
git fetch origin main
git rebase origin/main
```

**3. Make changes and test locally**
```bash
# ... code changes ...
npm test:all  # MUST pass 100%
```

**4. Commit with conventional commit message**
```bash
git commit -am "feat: user-facing description"
# OR: fix:, docs:, style:, refactor:, perf:, test:, chore:
# BREAKING CHANGE in body triggers major version
```

**5. Push and create PR**
```bash
git push origin feature/description
gh pr create --title "feat: description" --body "Details..."
```

**6. Wait for CI checks (MANDATORY)**
```bash
gh pr checks --watch
# Both build-and-test and e2e-tests MUST be GREEN ✅
```

**7. Fix if any check fails (RED ❌)**
```bash
# Fix the code
git commit --amend --no-edit
git push --force-with-lease origin feature/description
# Return to step 6
```

**8. Merge when all checks GREEN**
```bash
gh pr merge --auto --squash
# Branch protection enforces this - merge button disabled until GREEN
```

**9. Automatic version bump and release**
- ✅ `pr-auto-version.yml` workflow auto-detects change type (feat/fix/BREAKING)
- ✅ Auto-bumps version in package.json (patch/minor/major)
- ✅ Auto-syncs manifest.json version
- ✅ Auto-updates CHANGELOG.md
- ✅ Commits changes to main
- ✅ `auto-release.yml` workflow creates GitHub release

**10. Cleanup worktree**
```bash
cd /Users/kitelev/Documents/exocortex-obsidian-plugin
git worktree remove ../exocortex-feature-name
git pull origin main  # Get auto-versioned commit
```

**11. Verify release created**
```bash
gh release list --limit 1
# Should show new version
```

### What You DON'T Do Anymore

**NO MANUAL VERSION MANAGEMENT:**
- ❌ NO `npm version patch/minor/major`
- ❌ NO manual manifest.json editing
- ❌ NO manual CHANGELOG.md updates
- ✅ All handled automatically by GitHub Actions

### Race Condition Solution

**OLD PROBLEM** (manual versioning):
```bash
Instance A: v12.5.10 → bump → v12.5.11 → push  ❌
Instance B: v12.5.10 → bump → v12.5.11 → push  ❌ COLLISION!
```

**NEW SOLUTION** (PR-based with auto-versioning):
```bash
Instance A: PR merge → auto-version → v12.5.11  ✅
Instance B: PR merge → auto-version → v12.5.12  ✅
(GitHub merge queue ensures sequential atomic processing)
```

### VIOLATIONS AND CONSEQUENCES

❌ **WRONG**: Trying to push directly to main
```bash
git commit -m "fix: button rendering"
git push origin main
# ❌ REJECTED by branch protection
```

❌ **WRONG**: Merging PR with failing checks
```bash
gh pr merge --admin  # Bypass checks
# ❌ VIOLATION - breaks pipeline for everyone
```

✅ **CORRECT**: PR-based workflow with all checks passing
```bash
# Feature branch workflow
git worktree add ../exocortex-fix-button -b fix/button-rendering
cd ../exocortex-fix-button
# ... fix code ...
npm test:all  # ✅ All pass
git commit -am "fix: button rendering in mobile view"
git push origin fix/button-rendering
gh pr create --title "fix: button rendering" --body "..."
gh pr checks --watch  # ✅ Wait for GREEN
gh pr merge --auto --squash
# ✅ Auto-version creates v12.5.11
# ✅ Auto-release creates GitHub release
```

### Why This is CRITICAL

**Multi-instance coordination:**
- ✅ No version collisions - sequential merging
- ✅ No broken pipeline - branch protection enforces quality
- ✅ No manual errors - automation handles versioning
- ✅ Safe rollback - every change is a PR

**User impact:**
- Users get fixes immediately after PR merge
- Every improvement reaches users through consistent release process
- Clear version history with meaningful changes
- No confusion about what version has what features

**Task completion checklist:**
- [ ] Feature branch created in separate worktree
- [ ] Changes tested locally (npm test:all ✅)
- [ ] Conventional commit created
- [ ] PR created and pushed
- [ ] CI checks passed (build-and-test ✅ + e2e-tests ✅)
- [ ] PR merged to main
- [ ] Auto-version workflow completed
- [ ] Release created and visible in GitHub Releases
- [ ] Worktree cleaned up

### RULE 2: User-Focused Release Notes

Write CHANGELOG entries as Product Manager:

- Focus on user benefits, not technical details
- Include usage scenarios
- Use clear, non-technical language

### RULE 3: Test Before Push (CRITICAL)

**ALWAYS run the FULL test suite before creating ANY commit:**

```bash
npm test
```

This runs:
1. `npm run test:unit` - Unit tests
2. `npm run test:ui` - UI integration tests
3. `npm run test:component` - Playwright component tests

**Requirements:**
- ALL tests must pass (100%)
- Fix all test failures before committing
- Maintain 70%+ coverage
- NEVER commit broken tests
- NEVER skip tests to "fix later"

**Why this is critical:**
- Broken commits block CI/CD pipeline
- Failed releases waste time and break trust
- Testing locally is faster than waiting for CI
- Prevents embarrassing rollbacks

**Checklist before EVERY commit:**
- [ ] `npm test` executed locally
- [ ] All test suites passed
- [ ] No test failures or errors
- [ ] Build successful (`npm run build`)
- [ ] Ready to commit

**CRITICAL - NEVER BYPASS PRE-COMMIT HOOKS:**
- **NEVER use `--no-verify` flag** to skip pre-commit hooks
- Pre-commit hooks exist to protect code quality and prevent broken commits
- If hooks fail, FIX the underlying issue, don't bypass the check
- Bypassing hooks is a serious violation of development standards
- If you encounter technical issues with hooks (e.g., environment-specific problems), fix the hook itself or the environment

**Why this is critical:**
- Pre-commit hooks are the last line of defense before bad code enters the repository
- Bypassing hooks can introduce broken code into main branch
- Broken code in main blocks other developers and CI/CD pipeline
- Trust in the development process is built on consistent quality gates

### RULE 4: Follow Existing Patterns

- Study existing code before adding new features
- Use the same patterns and conventions
- Don't introduce new dependencies without need

### RULE 5: PARALLEL AGENT EXECUTION

**USE 3-5 AGENTS IN PARALLEL** for complex tasks:

- **Domain-Parallel**: Multi-domain requirements executed simultaneously
- **Pipeline-Parallel**: Sequential streams with parallel stages
- **Investigation-Parallel**: Parallel analysis with consolidated resolution

**REFERENCE**: See CLAUDE-agents.md for patterns and agent selection

### RULE 6: BDD Coverage Guarantee (CRITICAL)

**Every scenario in .feature files MUST have corresponding automated test.**

**Available Commands:**
```bash
npm run bdd:coverage    # Show current BDD coverage
npm run bdd:report      # Generate detailed Markdown report
npm run bdd:check       # Fail if coverage < 80% threshold
```

**Before adding new scenario:**
1. Write the scenario in `.feature` file (specs/features/)
2. Implement the corresponding test (tests/component/ or tests/ui/)
3. Run `npm run bdd:coverage` to verify coverage
4. Update `coverage-mapping.json` if auto-detection fails

**Before committing:**
```bash
npm run bdd:check  # Must pass (≥80% coverage)
```

**Naming Conventions:**
- Test description should contain keywords from scenario name
- Use descriptive test names that match scenario intent
- Manual mapping via `coverage-mapping.json` for complex cases

**Example:**

Feature file (`specs/features/layout/table-sorting.feature`):
```gherkin
Scenario: First click - sort ascending
  When I click on header "Name"
  Then table is sorted ascending
  And header "Name" contains symbol "▲"
```

Test file (`tests/component/AssetRelationsTable.spec.tsx`):
```typescript
test('should handle sorting by name', async ({ mount }) => {
  const component = await mount(<AssetRelationsTable relations={mockRelations} />);

  await component.locator('th:has-text("Name")').click();
  await expect(component.locator('th:has-text("Name")')).toContainText('↑');
});
```

**Manual Mapping** (`coverage-mapping.json`):
```json
{
  "table-sorting.feature": {
    "First click - sort ascending": {
      "tests": [
        "tests/component/AssetRelationsTable.spec.tsx::should handle sorting by name"
      ],
      "status": "covered"
    }
  }
}
```

**Coverage Threshold:**
- Minimum: 80% (enforced by `bdd:check`)
- Target: 100%
- Current threshold set via: `BDD_COVERAGE_THRESHOLD=80`

**Why this is critical:**
- Feature files serve as living documentation
- Prevents scenario/test drift
- Ensures every requirement is tested
- Enables BDD-driven development

## 🤝 AI Assistant Collaboration

### For Claude Code

- Use extended thinking for complex tasks
- Leverage memory bank for context
- Follow CLAUDE.md guidelines strictly
- **USE PARALLEL EXECUTION** patterns for 40-60% faster completion

### For GPT-5/Cursor

- Provide clear, specific instructions
- Reference existing patterns in codebase
- Use type hints and interfaces

### For GitHub Copilot

- Write descriptive function signatures
- Use clear variable names
- Add JSDoc comments when needed

## 📊 Quality Metrics

### Required

- **Test Suite**: 14 tests total (6 UI + 8 component, React-focused)
- **Test Coverage**: 70%+ coverage maintained across all modules
- **TypeScript**: Clean compilation with strict mode
- **Build**: Successful production builds (<1min)
- **AGENT UTILIZATION >80%** for complex tasks
- **PARALLEL EXECUTION >60%** of agent calls
- **SLASH COMMANDS** implemented for efficient workflow

### Current Features

- React component architecture with isolated state management
- Independent table sorting per instance (v11.5.3)
- AssetRelationsTable with grouping and clickable Instance Class links
- Platform detection working
- Mobile performance optimizer implemented
- Slash commands system operational (/execute, /status, /agents, /release, /test)

### Monitored

- **Bundle size**: 206kb (React: 171kb, Plugin code: 35kb)
- **Test execution**: ~8 seconds total
- **Build time**: <1 minute
- **Task Success Rate >95%** with agents

## 📋 Business Requirements Integration

### Core Functional Requirements

- **FR-001**: RDF Triple Store with SPO/POS/OSP indexing
- **FR-002**: Graph Query Engine with SELECT, CONSTRUCT, ASK
- **FR-003**: OWL Ontology Management with class hierarchies
- **FR-004**: Obsidian Integration with note-to-RDF conversion
- **FR-005**: Interactive knowledge graph visualization

### Non-Functional Requirements

- **NFR-001**: Performance < 100ms queries for 10k triples
- **NFR-002**: 99.9% reliability during sessions
- **NFR-003**: <30 minute learning curve
- **NFR-004**: 70%+ test coverage
- **NFR-005**: Privacy-first design, no external data transmission

### Security Controls

- **Input Validation**: Query sanitization, IRI validation, path validation
- **Access Control**: Local-only operations, Obsidian permission model
- **Data Protection**: No telemetry, privacy-first design, GDPR ready

## 📝 Error Handling Patterns

### Common Error Types

1. **Validation Errors**: Invalid IRI format, naming convention mismatches
2. **Performance Issues**: CI environment test timeouts, memory constraints
3. **Integration Errors**: Obsidian API compatibility, file path issues

### Error Resolution Patterns

```typescript
// Result pattern usage
const assetResult = Asset.create(props);
if (!assetResult.isSuccess) {
  console.error(assetResult.getError());
  return;
}

// Graceful degradation
if (!layoutFile) {
  await this.renderDefaultLayout(dv, file, metadata, container);
  return;
}
```

### Prevention Strategies

- Environment-aware performance thresholds
- Comprehensive regex patterns for project conventions
- Fallback mechanisms for missing configurations
- Safe error handling with user notifications

## 🔄 Continuous Improvement

After each task:

1. Update documentation if patterns change
2. Refactor for clarity if needed
3. Add tests for edge cases discovered
4. Update this guide with learnings
5. Document error patterns and resolutions

## 📚 Key Resources

### Internal

- `/ARCHITECTURE.md` - System design
- `/docs/` - Requirements and ADRs
- `/tests/` - Usage examples
- **`CLAUDE-test-patterns.md`** - Comprehensive test infrastructure patterns and best practices
- **`CLAUDE-agents.md`** - Agent usage patterns and parallel execution strategies
- **`CLAUDE-tasks.md`** - Task tracking and sprint management

### External

- [Obsidian Plugin API](https://docs.obsidian.md/)
- [RDF Primer](https://www.w3.org/TR/rdf-primer/)

## 🆘 Troubleshooting

### Common Issues

1. **Tests failing**: Check mock setup in `__mocks__/obsidian.ts`
2. **Build errors**: Run `npm run build` for detailed output
3. **Coverage low**: Add tests for uncovered branches
4. **Release failed**: Check GitHub Actions logs
5. **E2E tests timeout**: Verify CSS selectors match actual rendered classes in screenshots
6. **E2E environment differences**: Check all dependencies available in Docker (Dataview, etc.)
7. **Obsolete dependency checks**: Audit code for unused plugin availability checks that block functionality

### E2E Testing Lessons Learned

Critical lessons from v12.15.45-49 debugging session (5 versions, 4 failures before success):

#### 1. Screenshot Analysis is Critical

**Lesson**: E2E test screenshots show actual rendered state - don't assume plugin is broken just because tests fail.

**Example**: v12.15.47 screenshots proved plugin rendered perfectly (Properties + DailyNote tasks tables visible), but tests failed with timeout. Problem was wrong CSS selector, not broken plugin.

**Action**:
- Always check E2E screenshots first when tests fail
- Compare expected vs. actual rendered output
- Use screenshots to validate assumptions about plugin behavior

#### 2. Code Analysis > Trial and Error

**Lesson**: Reading source code finds root cause faster than experimenting with fixes.

**Example**: After 3 failed attempts (config, UI clicks, timing), analyzed `UniversalLayoutRenderer.ts` source code and discovered `.exocortex-layout-container` CSS class **never existed** in the codebase.

**Action**:
- Read the actual source code that creates DOM elements
- Verify CSS classes, selectors, and element structure
- Don't guess - check the implementation directly
- Use `grep -r "class-name"` to find where selectors are created

#### 3. Obsolete Dependencies Kill

**Lesson**: Code evolves but old dependency checks remain, blocking functionality in different environments.

**Example**: `renderDailyTasks` checked for Dataview plugin availability (9 lines of code) but hasn't used Dataview API since v12.x. In E2E Docker (no Dataview), method returned early without rendering `.exocortex-daily-tasks-section`, causing test timeouts.

**Action**:
- Regular audit of dependency availability checks
- Verify checks are actually needed for functionality
- Remove obsolete checks when code evolves
- Document required vs. optional dependencies clearly

#### 4. E2E Environment ≠ Production

**Lesson**: Docker test environment lacks optional plugins, creating different code paths than production.

**Example**: Plugin worked perfectly in production with Dataview installed, but failed in E2E Docker without Dataview because of obsolete availability check.

**Action**:
- Explicitly test both environments (with/without optional plugins)
- Mock or install required dependencies in E2E Docker
- Remove environment-specific code paths when possible
- Document environment differences in test README

#### 5. CSS Selector Validation

**Lesson**: Always verify CSS selectors exist in actual rendered output before writing tests.

**Example**: Tests waited for `.exocortex-layout-container` selector that plugin never created. Should have been `.exocortex-daily-tasks-section` or `.exocortex-properties-section`.

**Action**:
- Use browser DevTools or E2E screenshots to verify selectors
- Check source code for actual CSS class names
- Update tests when component structure changes
- Keep test selectors in sync with implementation

**Quick Reference - Actual CSS Classes Created by Plugin**:
```typescript
// From UniversalLayoutRenderer.ts:
exocortex-buttons-section          // line 439
exocortex-properties-section       // line 1072
exocortex-daily-tasks-section      // line 1149
exocortex-assets-relations         // line 1196
// NOTE: .exocortex-layout-container does NOT exist!
```

### Getting Help

- Review existing test files for patterns
- Check ARCHITECTURE.md for design decisions
- Look for similar features in codebase
- Follow established patterns

---

**Remember**: You are an AI assistant working on a professional software product. Write code that is clear, tested, and maintainable. Focus on user value over technical complexity.
