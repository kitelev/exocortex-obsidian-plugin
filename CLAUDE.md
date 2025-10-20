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
/test [unit|ui|component|all]        # MANDATORY for testing - prevents Playwright hangs, enforces quality gates
/execute [task]                      # Complex multi-step tasks with agent orchestration
/status                              # Check current progress and project health
/agents                              # List available specialized agents
```

⚠️ **CRITICAL**:
- **NEVER work in main directory** - ALWAYS create worktree first (see RULE 0)
- Use `/release` for ANY code change to src/, tests/, or production files
- Use `/test` instead of `npm test` (prevents hangs, enforces BDD coverage ≥80%)
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
- PR to be merged (use `gh pr merge --auto --rebase`)
- Release to be created (verify with `gh release list --limit 1`)

**Complete workflow (11 steps):**

```bash
# 1. Create feature branch in separate worktree
git worktree add ../exocortex-feature-name -b feature/description
cd ../exocortex-feature-name

# 2. Sync with latest main
git fetch origin main && git rebase origin/main

# 3. Make changes and test (MANDATORY)
npm test:all  # OR: /test - MUST pass 100%

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

# 8. Merge when all checks GREEN (rebase only - linear history)
gh pr merge --auto --rebase

# 9. Automatic release (NO manual steps - tag-based versioning)
# ✅ auto-release.yml: analyzes commits, calculates version, builds plugin, creates tag + GitHub release
# ✅ CHANGELOG generated automatically from commit messages
# ✅ NO version bump commits (versions exist only as git tags)

# 10. Cleanup worktree
cd /Users/kitelev/Documents/exocortex-obsidian-plugin
git worktree remove ../exocortex-feature-name
git pull origin main

# 11. Verify release created
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

**ALWAYS use `/test` command before ANY commit:**

```bash
/test              # Run all tests with quality gates
/test unit         # Unit tests only
/test component    # Playwright CT tests (hang-safe)
```

**Requirements:**
- 100% tests passing
- BDD coverage ≥80% (enforced automatically)
- NEVER commit broken tests
- NEVER use `--no-verify` to bypass pre-commit hooks

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
- ✅ Only `git rebase` allowed (linear history)
- ❌ Squash merge DISABLED
- ❌ Merge commits DISABLED

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

## 📊 Current Architecture

### Technology Stack

```yaml
Core:
  - TypeScript 4.9+ (strict mode)
  - Obsidian Plugin API 1.5.0+
  - ESBuild (bundling)
  - React 19.2.0 (UI components)

Domain:
  - RDF triple store (SPO/POS/OSP indexing)
  - Graph query engine
  - OWL ontology management

Testing:
  - Playwright CT (8 component tests)
  - jest-environment-obsidian (6 UI tests)
  - Total: 14 tests, ~8s execution
  - Coverage: 70%+

CI/CD:
  - GitHub Actions
  - Automated releases
  - Branch protection
  - Quality gates
```

### Clean Architecture Layers

```
/src
  /domain           - Entities, value objects, repository interfaces
  /application      - Use cases, services
  /infrastructure   - Obsidian implementations, DI container
  /presentation     - UI components, modals, renderers

/tests              - Unit, UI, component tests
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

### Understanding Codebase

1. `/src/main.ts` - Plugin entry point
2. `/src/domain/` - Core business logic
3. `/src/infrastructure/container/DIContainer.ts` - Dependency wiring
4. `/tests/` - Usage examples and patterns

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
- Test suite: 14 tests (6 UI + 8 component)
- Coverage: ≥70%
- BDD coverage: ≥80%
- TypeScript: Clean compilation (strict mode)
- Build: <1 minute
- Agent utilization: >80% for complex tasks

**Monitored:**
- Bundle size: 206kb (React: 171kb, Plugin: 35kb)
- Test execution: ~8 seconds
- Task success rate: >95% with agents

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
