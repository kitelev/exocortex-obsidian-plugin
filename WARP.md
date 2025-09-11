# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

This is the **Exocortex Obsidian Plugin** - a sophisticated knowledge management plugin for Obsidian that transforms notes into intelligent, interconnected assets through ontology-driven layouts and semantic capabilities. The plugin provides dynamic layouts, intelligent asset creation, and mobile-optimized UI for enhanced knowledge management.

## Core Architecture

The codebase follows **Clean Architecture** principles with clear separation of concerns across four distinct layers:

- **Domain Layer** (`src/domain/`): Core business entities, value objects, and domain services
- **Application Layer** (`src/application/`): Use cases, ports, and application services  
- **Infrastructure Layer** (`src/infrastructure/`): External adapters, repositories, and concrete implementations
- **Presentation Layer** (`src/presentation/`): UI components, modals, and user interaction handlers

Key architectural patterns include Repository Pattern, Dependency Injection, Result Pattern for error handling, and SOLID principles throughout.

## Essential Development Commands

### Building and Development
```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# TypeScript compilation check
npm run check:types

# Full code quality check
npm run check:all
```

### Testing Commands
```bash
# Unit tests (primary test suite)
npm run test:unit

# Integration tests
npm run test:integration

# Real E2E tests with Playwright (against actual Obsidian)
npm run test:e2e:playwright

# BDD tests with Cucumber
npm run test:bdd

# Complete test suite
npm run test:all

# Test with coverage
npm run test:coverage

# Run single test file
npm run test:unit -- tests/unit/domain/entities/Asset.test.ts
```

### Real E2E Testing (Unique Feature)
This plugin uses **authentic E2E testing** with real Obsidian desktop applications:

```bash
# Run complete Playwright E2E suite
./run-playwright-tests.sh

# Interactive Playwright UI
npm run test:e2e:playwright:ui

# Debug specific E2E tests
npm run test:e2e:playwright:debug -- tests/e2e/playwright/tests/universal-layout.spec.ts
```

### Code Quality and Linting
```bash
# ESLint check
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Check for unused exports
npm run check:unused
```

### Specialized Testing
```bash
# Mobile-specific tests
npm run test:mobile

# BDD smoke tests
npm run test:bdd:smoke

# Security-focused BDD tests
npm run test:bdd:security

# Docker-based E2E tests
npm run test:e2e:docker
```

## Key Components and Features

### Core Features (v8.0.0 - Simplified Architecture)
- **UniversalLayout**: Smart rendering system that adapts to content type
- **DynamicLayout**: Flexible layout system for custom views  
- **CreateAssetModal**: Intelligent form with dynamic property fields based on class selection

### Domain Entities
- **Asset** (`src/domain/entities/Asset.ts`): Core business entity representing knowledge assets
- **ClassLayout** (`src/domain/entities/ClassLayout.ts`): Layout configuration for asset classes
- **Ontology** (`src/domain/entities/Ontology.ts`): Semantic ontology management

### Infrastructure Components
- **DIContainer** (`src/infrastructure/container/DIContainer.ts`): Dependency injection container
- **ObsidianVaultAdapter** (`src/infrastructure/adapters/ObsidianVaultAdapter.ts`): Obsidian API adapter
- **ServiceProvider** (`src/infrastructure/providers/ServiceProvider.ts`): Service orchestration

## Technology Stack and Dependencies

### Runtime Dependencies
- **Obsidian API**: 1.5.0+ (external dependency)
- **TypeScript**: 4.7.4 with strict mode enabled
- **js-yaml**: 4.1.0 for YAML parsing
- **uuid**: 11.1.0 for unique identifiers

### Development Dependencies  
- **ESBuild**: 0.17.3 for fast bundling with optimization plugins
- **Jest**: 30.0.5 with jsdom environment for unit testing
- **Playwright**: 1.40.0 for real E2E testing against Obsidian desktop
- **Cucumber**: 11.3.0 for BDD testing with Gherkin scenarios
- **WebDriverIO**: 9.19.2 for UI automation testing

### Build System
The project uses a sophisticated ESBuild configuration (`esbuild.config.mjs`) with:
- Performance monitoring and optimization
- Development-specific optimizations
- Incremental build cache
- Bundle size analysis and warnings

## Testing Strategy

This repository has an exceptionally comprehensive testing strategy:

### Test Types
1. **Unit Tests** (`tests/unit/`): 80+ test files with component isolation
2. **Integration Tests** (`tests/integration/`): Component interaction validation  
3. **Real E2E Tests** (`tests/e2e/playwright/`): Authentic Obsidian desktop testing
4. **BDD Tests** (`tests/bdd/`): Cucumber scenarios for business requirements
5. **UI Tests** (`tests/ui/`): WebDriverIO-based interface testing
6. **Mobile Tests**: iOS/Android specific validation
7. **Performance Tests**: Load testing and benchmarking

### Testing Infrastructure
- **FakeVaultAdapter**: Test doubles for Obsidian API simulation
- **TestDataBuilder**: Fluent API for complex test scenario creation
- **BDDWorld**: Centralized test context with comprehensive utilities
- **PerformanceMonitor**: Built-in performance validation
- **SecurityValidator**: Security testing with threat detection

## Performance Optimization

The codebase includes sophisticated performance optimizations:

### IndexedGraph Implementation
- **SPO/POS/OSP indexing** for O(1) triple lookups vs O(n) linear search
- **Batch processing** with deferred indexing for 5x faster bulk imports
- **LRU query caching** with 90% cache hit rate for typical usage
- **Memory optimization** with configurable batch sizes for different environments

### Build Performance
- **Incremental builds** with caching
- **Development optimizations** for faster rebuilds
- **Bundle size monitoring** with automatic warnings
- **Performance thresholds** with environment-aware tuning

## Mobile Support and Compatibility

Full mobile optimization with:
- **Touch controllers** with gesture recognition and haptic feedback
- **Platform detection** for iOS/Android specific behaviors
- **Responsive layouts** adaptive to different screen sizes
- **Performance optimization** with mobile-specific rendering paths

## Development Guidelines

### Code Style and Standards
- **No comments policy** unless explicitly requested - code should be self-documenting
- **TypeScript strict mode** with comprehensive type safety
- **Clean Architecture** with clear layer boundaries
- **SOLID principles** throughout the codebase
- **Result Pattern** for consistent error handling

### Git Workflow
The project uses conventional commits with automated releases:
- `feat:` for new features
- `fix:` for bug fixes  
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `perf:` for performance improvements
- `test:` for test additions/modifications

### Release Process
Automated release pipeline:
1. Update `package.json` version
2. Update `CHANGELOG.md` with user-focused descriptions
3. Commit with conventional message
4. Push to trigger GitHub Actions auto-release

## AI Development Integration

This codebase is specifically optimized for AI-assisted development:

### Agent-Based Development
- **Multi-agent orchestration** with 27+ specialized agents
- **Slash command integration** for quick task execution
- **Parallel execution optimization** for 40-60% faster completion
- **BABOK/PMBOK/SWEBOK compliance** for enterprise-grade development

### Development Accelerators  
- **Memory optimization** for CI environments with specific worker limits
- **Emergency test runners** for critical situations
- **Performance monitoring** with automatic threshold validation
- **Comprehensive documentation** designed for AI comprehension

## Claude Rules Integration

Important development standards from `CLAUDE.md`:

### Mandatory Agent Usage
- Always use 3-5 agents in parallel for complex tasks
- Never work alone on multi-file or cross-domain work
- Follow Feature Development Pipeline: Product → Architecture → Implementation → QA → Documentation

### Quality Gates
- Always release after changes with version updates and changelog
- Run `npm test` before any commit
- Maintain 70%+ test coverage  
- Follow existing patterns and conventions

## Security and Privacy

The plugin follows a **privacy-first design**:
- **UUID-based identifiers** (no PII exposure)
- **Local-only processing** with no external data transmission
- **Input validation** with strict YAML parsing and query sanitization
- **No telemetry or analytics** collection

## Performance Benchmarks

Current performance characteristics:
- **Initial Load**: 50ms (100 notes) to 4500ms (10,000 notes)
- **Single Query**: 0.5ms to 1.2ms depending on vault size
- **Complex Query**: 5ms to 15ms for pattern matching
- **Batch Insert**: ~100ms for 1000 triples regardless of vault size
- **Memory Usage**: 10MB to 750MB scaling with content

## Troubleshooting (Repo-specific)
- Playwright E2E: set OBSIDIAN_PATH if not found (macOS default: /Applications/Obsidian.app/Contents/MacOS/Obsidian). Kill running Obsidian before tests.
- macOS Gatekeeper: if Obsidian fails to launch in E2E, run ./fix-obsidian-gatekeeper.sh.
- Husky v9 warning: remove . "$(dirname -- "$0")/_/husky.sh" from .husky/pre-commit (already fixed here).
- Node version: require Node >= 18 (per package engines). Check with node -v.
- Build output missing main.js: run npm run build first.

## Performance Tuning Checklist
- Development: use npm run dev (incremental, watch). Production: npm run build.
- Bundle analysis: npm run analyze:bundle (writes build-meta.json; esbuild logs analysis).
- Performance report: npm run test:performance (writes test-results/performance-report.html).
- Reduce logging in prod: ensure Logger drops debug/console per esbuild production settings.
- Keep SPO/POS/OSP caches sized appropriately (see DEFAULT_SETTINGS query cache values).

## Common Error Patterns
- TypeScript compile errors: run npm run check:types to isolate TS issues.
- Jest timeouts in CI: tests are configured single-worker; prefer test:unit:safe for local flakiness.
- Playwright path errors: verify vault path and OBSIDIAN_PATH in playwright.config.ts.
- ESLint failures in CI: run npm run lint:fix locally to auto-resolve common issues.

## Running GitHub Actions locally

- Prerequisites: GitHub CLI (gh) installed and authenticated (GH_TOKEN in env)
- Trigger a workflow and wait for completion:
  - scripts/ci/run-workflow.sh .github/workflows/fast-feedback.yml -r main -d
  - scripts/ci/run-workflow.sh .github/workflows/bdd-tests.yml -r main -f test_suite=smoke -d

## Common Development Tasks

### Adding New Features
1. Create domain entities in `src/domain/entities/`
2. Define use cases in `src/application/use-cases/`
3. Implement infrastructure adapters in `src/infrastructure/`
4. Add presentation components in `src/presentation/`
5. Write comprehensive tests for all layers
6. Update documentation and changelog

### Debugging
- Use `npm run test:e2e:playwright:debug` for E2E debugging
- Enable verbose logging in development builds
- Use Playwright trace viewer for test failure analysis
- Check screenshot artifacts in `test-results/screenshots/`

### Working with Ontologies
The plugin includes sophisticated RDF/OWL ontology management:
- **Triple store** with indexed graph for fast queries
- **SPARQL query engine** with SELECT, CONSTRUCT, ASK support
- **OWL class hierarchies** with inheritance
- **Property paths** and graph pattern matching
