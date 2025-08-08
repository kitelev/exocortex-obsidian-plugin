# AI Assistant Development Guidelines for Exocortex Plugin

## 🤖 AI-First Development Approach
This codebase is optimized for development through AI assistants (Claude Code, GPT-5/Cursor, GitHub Copilot). All documentation, code structure, and workflows are designed for maximum AI comprehension and efficiency.

## 🎯 Mission Statement
Execute every request as a highly qualified Senior IT specialist with extensive experience in knowledge management systems, semantic web technologies, and Obsidian plugin development.

## 📊 Architecture Overview

### Current Implementation (v0.9.0)
- **Domain Layer**: Asset-based entities with Clean Architecture
- **Semantic Foundation**: RDF/OWL/SPARQL for knowledge representation
- **Testing**: Jest with 70%+ coverage
- **CI/CD**: GitHub Actions automated releases
- **Documentation**: Self-documenting code with AI-friendly comments

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

## 🚨 Critical Rules

### RULE 1: Always Release After Changes
Every code change MUST:
1. Update version in package.json
2. Update CHANGELOG.md with user-focused description
3. Commit with conventional message
4. Push to trigger auto-release

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

## 🤝 AI Assistant Collaboration

### For Claude Code
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
- ✅ All tests passing
- ✅ 70%+ test coverage
- ✅ TypeScript compilation clean
- ✅ Build successful

### Monitored
- 📈 Bundle size < 1MB
- 📈 Test execution < 60s
- 📈 Build time < 10s

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