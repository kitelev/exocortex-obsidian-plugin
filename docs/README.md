# 📚 Documentation

Documentation for the Exocortex Obsidian Plugin testing infrastructure.

## 📂 Structure

### `/testing` - Testing Documentation

Essential testing guides and best practices:

- **[BDD-OBSIDIAN-BEST-PRACTICES.md](testing/BDD-OBSIDIAN-BEST-PRACTICES.md)** - Best practices for BDD testing in Obsidian plugins
- **[CI-CD-COMPONENT-TESTING.md](testing/CI-CD-COMPONENT-TESTING.md)** - Component testing CI/CD integration guide
- **[EXECUTABLE-SPECIFICATIONS.md](testing/EXECUTABLE-SPECIFICATIONS.md)** - Executable specifications concept


## 🎯 Quick Start

### Running Tests

```bash
# Unit tests (30 tests)
npm run test:unit

# BDD tests (30 tests)
npm run test:bdd

# Component tests (31 tests)
npm run test:component

# All tests
npm test
```

### CI/CD

All tests run automatically on every push via GitHub Actions:
- Total: 91 tests
- Execution time: ~1 minute
- See [CI-CD-COMPONENT-TESTING.md](testing/CI-CD-COMPONENT-TESTING.md) for details

## 📊 Current Test Coverage

| Type | Count | Coverage |
|------|-------|----------|
| **Unit Tests** | 30 | Domain layer |
| **BDD Tests** | 30 | User scenarios |
| **Component Tests** | 31 | UI components (95%) |
| **Total** | **91** | **80%+** |

## 🔗 Related

- `/tests/unit` - Unit test files
- `/tests/component` - Component test files
- `/specs/features` - BDD feature specifications
- `/.github/workflows/ci.yml` - CI/CD configuration

---

**Last Updated**: 2025-10-03
**Testing Stack**: Jest + Playwright Component Testing + Cucumber
