# AI Assistant Development Guidelines for Exocortex Plugin

## 🚨 CRITICAL: MANDATORY AGENT USAGE
**EVERY significant task MUST use specialized agents.** Not using agents is a violation of project standards.

### 🤖 AUTOMATIC META-AGENT INVOCATION
**NEW**: Meta-Agent automatically activates for ANY request meeting these criteria:
- **Complexity Score ≥3** (multiple files, cross-domain, technical standards)
- **Multiple Domains** (UI + Backend + Tests + Docs)
- **Keywords Detected**: implement, develop, analyze, optimize, test, fix, enhance
- **Professional Context**: Feature development, bug investigation, system analysis

### Agent Usage Rules (ENHANCED)
1. **ALWAYS use 3-5 agents in parallel** for any non-trivial task
2. **NEVER work alone** - agents provide specialized expertise  
3. **AUTO-PARALLEL EXECUTION**: Use domain-parallel, pipeline-parallel, or investigation-parallel patterns
4. **INTELLIGENCE-DRIVEN SELECTION**: Meta-Agent selects optimal agent combinations
5. **CONTINUOUS LEARNING**: Every success pattern automatically captured and reused
6. **Check META-AGENT-CORE.md** for auto-invocation system and CLAUDE-agents.md for patterns

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

### Current Implementation (v2.18.0)
- **Domain Layer**: Asset-based entities with Clean Architecture
- **Semantic Foundation**: RDF/OWL/SPARQL for knowledge representation
- **Testing**: Jest with 70%+ coverage (1768 tests passing)
- **CI/CD**: GitHub Actions automated releases with ultra-stable testing infrastructure
- **Documentation**: Self-documenting code with AI-friendly comments
- **Agent System**: 26 professional agents with automatic orchestration and meta-learning
- **Quality Assurance**: CMMI Level 3 compliance with automated quality gates

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

## 🧠 INTELLIGENT AGENT ORCHESTRATION

### Automatic Agent Selection Matrix

**NEW**: The Meta-Agent automatically selects optimal agent combinations based on request analysis:

```yaml
Request_Analysis_Engine:
  complexity_detection:
    simple (1-3): "Fix typo in docs" → 1-2 agents, sequential
    moderate (4-6): "Add UI component with tests" → 3-4 agents, parallel+review
    complex (7-8): "New feature with security" → 4-6 agents, hybrid execution
    enterprise (9-10): "Architecture refactoring" → 5-8 agents, full parallel

  domain_mapping:
    architecture: [architect-agent, swebok-engineer, security-agent, performance-agent]
    implementation: [swebok-engineer, code-review-agent, performance-agent]
    testing: [qa-engineer, test-fixer-agent, ui-test-expert]
    user_experience: [ux-researcher-agent, ux-design-expert, technical-writer-agent]
    quality_assurance: [qa-engineer, code-review-agent, security-agent]
    
  execution_patterns:
    domain_parallel: Multiple domains worked simultaneously
    pipeline_parallel: Sequential streams with parallel stages  
    investigation_parallel: Parallel analysis with consolidated resolution
```

### Parallel Execution Examples

**Feature Development Pipeline (Parallel)**:
```
Phase 1 (Parallel):     Phase 2 (Sequential):    Phase 3 (Parallel):
├ product-manager       → swebok-engineer       ├ qa-engineer
├ architect-agent        (Implementation)        ├ technical-writer-agent
├ ux-design-expert                               └ performance-agent
└ security-agent
```

**Bug Investigation (Parallel)**:
```
Investigation (Parallel):           Resolution (Parallel):
├ error-handler (root cause)       ├ swebok-engineer (fix)
├ code-searcher (exploration)      └ test-fixer-agent (tests)
├ qa-engineer (test impact)
└ performance-agent (perf impact)
```

### Success Pattern Learning

Every successful agent execution is automatically analyzed and patterns extracted:
- **Agent combinations that work well together**
- **Optimal execution timing and dependencies** 
- **Quality metrics achieved**
- **Reusable templates for similar requests**

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

### RULE 0: MANDATORY META-AGENT INVOCATION (NEW)
**AUTOMATIC ACTIVATION**: Meta-Agent MUST be invoked for ANY request with:
- **Complexity ≥3** (multiple files, cross-domain, standards)
- **Keywords**: implement, develop, analyze, optimize, test, fix, enhance, create, build
- **Scope**: Feature development, bug investigation, system analysis, architecture
- **Quality**: Professional software development context

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

### RULE 5: MANDATORY PARALLEL AGENT EXECUTION (NEW)
**ALWAYS USE 3-5 AGENTS IN PARALLEL** for any non-trivial task:
- **Domain-Parallel**: Multi-domain requirements executed simultaneously
- **Pipeline-Parallel**: Sequential streams with parallel stages
- **Investigation-Parallel**: Parallel analysis with consolidated resolution
- **Auto-Learning**: Every success pattern captured for future reuse

**REFERENCE**: See META-AGENT-CORE.md for execution patterns and CLAUDE-agents.md for agent selection

## 🤝 AI Assistant Collaboration (ENHANCED)

### For Claude Code (META-AGENT POWERED)
- **AUTO-INVOKE Meta-Agent** for request analysis and agent selection
- **USE PARALLEL EXECUTION** patterns for 40-60% faster completion
- **LEVERAGE SUCCESS PATTERNS** from previous agent orchestrations
- Use extended thinking for complex tasks
- Leverage memory bank for context
- Follow CLAUDE.md guidelines strictly

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
- ✅ All tests passing (1768+ tests)
- ✅ 70%+ test coverage
- ✅ TypeScript compilation clean
- ✅ Build successful
- ✅ **AGENT UTILIZATION >80%** for complex tasks (NEW)
- ✅ **PARALLEL EXECUTION >60%** of agent calls (NEW)

### Monitored
- 📈 Bundle size < 1MB
- 📈 Test execution < 60s
- 📈 Build time < 10s
- 📈 **Agent Selection Time <5 minutes** (NEW)
- 📈 **Task Success Rate >95%** with agents (NEW)
- 📈 **Pattern Reuse Rate >80%** (NEW)

## 🔄 Continuous Improvement

After each task:
1. Update documentation if patterns change
2. Refactor for clarity if needed
3. Add tests for edge cases discovered
4. Update this guide with learnings

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