# AI Assistant Development Guidelines for Exocortex Plugin

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
- **26 Specialized Agents**: Complete professional software development coverage
- **Automatic Request Analysis**: NLP-powered complexity and domain detection
- **Parallel Execution Optimization**: 40-60% faster completion through intelligent orchestration
- **Success Pattern Learning**: Automated extraction and replication of winning approaches
- **Quality Gate Integration**: CMMI/ISO standards embedded in every agent interaction

## 🎯 Mission Statement
Execute every request as a highly qualified Senior IT specialist with extensive experience in knowledge management systems, semantic web technologies, and Obsidian plugin development.

## 📊 Architecture Overview

### Current Implementation (v3.0.0)
- **Mobile/iOS Support**: Complete mobile experience with touch-optimized UI and platform-specific optimizations
- **Query Engine Abstraction**: Multi-engine support (Dataview, Datacore, Native) with automatic fallback
- **Domain Layer**: Asset-based entities with Clean Architecture and mobile performance optimizations
- **Semantic Foundation**: RDF/OWL/SPARQL with IndexedGraph and mobile-aware caching
- **Testing**: Jest with comprehensive coverage (1906/2047 tests passing - mobile features in development)
- **CI/CD**: GitHub Actions automated releases with mobile test suites
- **Performance**: 40% faster loading on mobile, 50% memory reduction, battery optimization
- **Architecture**: Clean Architecture with mobile adapters and touch controllers

### Technology Stack
```yaml
Core:
  - TypeScript 4.9+ with strict mode
  - Obsidian Plugin API 1.5.0+
  - ESBuild for bundling
  
Domain:
  - RDF triple store with SPO/POS/OSP indexing
  - SPARQL 1.1 query engine
  - OWL ontology management
  
Testing:
  - Jest with comprehensive mocks
  - 70% coverage threshold
  - Integration tests with FakeVaultAdapter
  
CI/CD:
  - GitHub Actions automated releases
  - Semantic versioning
  - Automated changelog generation
```

## 📋 Implementation Guidelines

### Technical Implementation Details

#### Technology Stack (v3.0.0)
- **Language**: TypeScript 4.7.4 with strict mode
- **Build System**: ESBuild 0.17.3 (fast compilation and bundling)
- **Testing Framework**: Jest 30.0.5 with jsdom, WebdriverIO for UI tests
- **Plugin Framework**: Obsidian Plugin API with mobile compatibility
- **Dependencies**: js-yaml 4.1.0, uuid 11.1.0, @types/uuid 10.0.0
- **Mobile Support**: Native iOS/Android detection, touch controllers, platform optimizers
- **Query Engines**: Dataview, Datacore, and Native query engine abstraction layer

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
  updateFrontmatter(path: string, frontmatter: Record<string, any>): Promise<void>;
}
```

#### Query Engine Abstraction Pattern (v3.0.0)
```typescript
interface IQueryEngine {
  executeQuery(query: string, context: QueryContext): Promise<Result<QueryResult>>;
  renderQuery(container: HTMLElement, query: string): Promise<Result<void>>;
  getPages(options: GetPagesOptions): Promise<Result<PageData[]>>;
}

// Factory with automatic fallback
class QueryEngineFactory {
  async createQueryEngine(preferred?: QueryEngineType): Promise<Result<IQueryEngine>> {
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
  static ok<U>(value: U): Result<U> { /* ... */ }
  static fail<U>(error: string): Result<U> { /* ... */ }
  
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

### RULE 1: Always Release After Changes
Every code change MUST:
1. Update version in package.json
2. Update CHANGELOG.md with user-focused description
3. Commit with conventional message
4. Push to trigger auto-release

**AUTOMATED RELEASE**: Use `.claude/agents/release.sh` script or follow `.claude/agents/release-agent.md` checklist

### RULE 2: User-Focused Release Notes
Write CHANGELOG entries as Product Manager:
- Focus on user benefits, not technical details
- Include usage scenarios
- Use clear, non-technical language

### RULE 3: Test Before Push
- Run `npm test` before ANY commit
- Fix all test failures
- Maintain 70%+ coverage

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
- ⚠️ 1906/2047 tests passing (93% pass rate - mobile features under development)
- ✅ High test coverage maintained
- ✅ TypeScript compilation clean
- ✅ Build successful
- ✅ **AGENT UTILIZATION >80%** for complex tasks
- ✅ **PARALLEL EXECUTION >60%** of agent calls

### Mobile-Specific Metrics
- ⚠️ Touch controller tests in development (8 failing test suites)
- ✅ Platform detection working
- ✅ Mobile performance optimizer implemented
- ✅ Query engine abstraction layer functional

### Monitored
- 📈 Bundle size < 1MB
- 📈 Test execution < 60s
- 📈 Build time < 10s
- 📈 **Task Success Rate >95%** with agents

## 📋 Business Requirements Integration

### Core Functional Requirements
- **FR-001**: RDF Triple Store with SPO/POS/OSP indexing (✅ Implemented)
- **FR-002**: SPARQL 1.1 Query Engine with SELECT, CONSTRUCT, ASK (✅ Implemented)
- **FR-003**: OWL Ontology Management with class hierarchies (✅ Implemented)
- **FR-004**: Obsidian Integration with note-to-RDF conversion (✅ Implemented)
- **FR-005**: Interactive knowledge graph visualization (✅ Implemented)

### Non-Functional Requirements
- **NFR-001**: Performance < 100ms queries for 10k triples (✅ Achieved)
- **NFR-002**: 99.9% reliability during sessions (✅ Stable)
- **NFR-003**: <30 minute learning curve (✅ User-friendly)
- **NFR-004**: 70%+ test coverage (✅ Maintained)
- **NFR-005**: Privacy-first design, no external data transmission (✅ Secure)

### Security Controls
- **Input Validation**: SPARQL sanitization, IRI validation, path validation
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

### External
- [Obsidian Plugin API](https://docs.obsidian.md/)
- [RDF Primer](https://www.w3.org/TR/rdf-primer/)
- [SPARQL Specification](https://www.w3.org/TR/sparql11-query/)

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