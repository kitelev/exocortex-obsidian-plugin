# AI Assistant Development Guidelines for Exocortex Plugin

## 🎯 UNIVERSAL EXECUTION COMMAND

### Quick Access via Slash Commands:

Custom slash commands are now available in `.claude/commands/` directory:

**Available commands:**

- `/execute [task]` - Execute with BABOK requirements interview, PMBOK planning, and full delivery pipeline
- `/status` - Check current progress and project health
- `/agents` - List available agents and capabilities
- `/release [type] [desc]` - Create new release (major/minor/patch)
- `/test [pattern]` - Run tests and check coverage

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

## 🎯 Mission Statement

Execute every request as a highly qualified Senior IT specialist with extensive experience in knowledge management systems, semantic web technologies, and Obsidian plugin development.

## 📊 Architecture Overview

### Terminology (CRITICAL)

**AutoLayout vs ManualLayout:**

- **AutoLayout**: Layout that displays automatically for all assets when the setting "Auto-render layout" is enabled in plugin settings. Appears below metadata (frontmatter) in reading/preview mode only. No code-block needed.

- **ManualLayout**: Layout that displays when user explicitly adds a code-block with type `exocortex` in their note. Works always, regardless of settings. User controls placement.

**IMPORTANT**: Always use correct terminology:
- "AutoLayout" = automatic rendering via settings
- "ManualLayout" = manual code-block rendering
- NEVER confuse these terms in code, docs, or commits

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

### Making Changes

```bash
# 1. Run tests to verify current state
npm test

# 2. Make your changes following patterns in existing code

# 3. Run tests again
npm test

# 4. Build to verify compilation
npm run build

# 5. Update version and CHANGELOG.md
npm version patch/minor/major

# 6. Commit and push (triggers auto-release)
git add -A
git commit -m "feat: your feature description"
git push origin main
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

### RULE 1: Always Release After Changes + Verify Pipeline

Every code change MUST:

1. Update version in **package.json**
2. Update version in **manifest.json** (CRITICAL: must match package.json!)
3. Update CHANGELOG.md with user-focused description
4. Commit with conventional message
5. Push to trigger auto-release
6. **WAIT for GitHub Actions pipeline to turn GREEN** ✅
7. **If pipeline FAILS - FIX immediately, task is NOT complete until pipeline is green**

**CRITICAL**: `manifest.json` version MUST always match `package.json` version. This is required for:
- BRAT (Beta Reviewers Auto-update Tester) compatibility
- Obsidian plugin store compliance
- User update notifications

**CRITICAL**: After EVERY push, monitor GitHub Actions:
- Go to: https://github.com/{repo}/actions
- Watch the pipeline run
- If RED (❌) - IMMEDIATELY fix the issue
- If GREEN (✅) - Task complete
- **A broken pipeline = incomplete task**

**AUTOMATED RELEASE**: Use `.claude/agents/release.sh` script or follow `.claude/agents/release-agent.md` checklist

**Version Update Checklist:**
- [ ] package.json version updated
- [ ] manifest.json version updated (same as package.json)
- [ ] CHANGELOG.md updated
- [ ] Both versions match exactly
- [ ] Code pushed to GitHub
- [ ] **GitHub Actions pipeline is GREEN ✅**

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

### Getting Help

- Review existing test files for patterns
- Check ARCHITECTURE.md for design decisions
- Look for similar features in codebase
- Follow established patterns

---

**Remember**: You are an AI assistant working on a professional software product. Write code that is clear, tested, and maintainable. Focus on user value over technical complexity.
