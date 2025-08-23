# Code Quality & Testing Guide
## Exocortex Knowledge Management System

**Version:** 1.0.0  
**Date:** 2025-08-23

---

## 🎯 Overview

This guide covers:
1. **BDD Testing** - How to write and run Behavior-Driven Development tests
2. **Code Quality** - Linting, formatting, and compilation checks
3. **Pre-commit Hooks** - Automatic quality gates
4. **CI/CD Integration** - Continuous quality checks

---

## 🧪 BDD Testing

### Running BDD Tests

```bash
# Run all BDD tests
npm run test:bdd

# Run specific suites
npm run test:bdd:smoke    # Quick smoke tests
npm run test:bdd:security  # Security tests
npm run test:bdd:api       # API tests

# Run with Cucumber directly
npx cucumber-js features/semantic-knowledge.feature
```

### Current Status
- ✅ Cucumber.js installed and configured
- ✅ Basic step definitions working
- ✅ 118 BDD scenarios documented
- ⚠️ Step definitions need expansion for full coverage

### Writing New BDD Tests

1. Create feature file in `/features/`:
```gherkin
Feature: Your Feature
  Scenario: Your scenario
    Given initial state
    When action occurs
    Then expected result
```

2. Implement step definitions in `/features/step-definitions/`:
```javascript
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('initial state', function() {
  // Setup
});

When('action occurs', function() {
  // Action
});

Then('expected result', function() {
  // Assertion
  assert(condition);
});
```

---

## 🔍 Code Quality Checks

### TypeScript Compilation

```bash
# Check TypeScript compilation
npm run check:types

# Full compilation check (with linting)
npm run check:compile

# Check all quality metrics
npm run check:all
```

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Code Formatting

```bash
# Check formatting
npm run format:check

# Auto-format code
npm run format
```

### Unused Exports

```bash
# Check for unused exports
npm run check:unused
```

---

## 🚦 Quality Gates

### Pre-commit Hooks

Automatically runs before each commit:
1. ✅ TypeScript compilation check
2. ✅ ESLint validation
3. ✅ Import verification
4. ✅ Code formatting check
5. ✅ Unit tests

### Manual Override (Use Sparingly!)
```bash
git commit --no-verify -m "Emergency fix"
```

---

## 📋 ESLint Configuration

### Strict TypeScript Rules
- `no-explicit-any` - No 'any' types allowed
- `explicit-function-return-type` - All functions must declare return types
- `strict-boolean-expressions` - No implicit boolean coercion
- `no-unsafe-*` - Prevent unsafe operations

### Import Rules
- `import/no-unresolved` - All imports must resolve
- `import/no-cycle` - No circular dependencies
- `import/no-unused-modules` - No unused exports

### Override for Tests
Test files have relaxed rules for flexibility.

---

## 🔄 CI/CD Integration

### GitHub Actions Workflows

#### Type Check & Lint (`type-check.yml`)
Runs on every push and PR:
- TypeScript compilation
- ESLint checks
- Prettier formatting
- Unused exports detection
- Full build verification

#### BDD Tests (Future)
```yaml
- name: Run BDD Tests
  run: npm run test:bdd
```

---

## 🛠️ Troubleshooting

### Common Issues

#### TypeScript Compilation Errors
```bash
# Check specific file
npx tsc src/path/to/file.ts --noEmit

# List all errors
npm run check:types
```

#### ESLint Errors
```bash
# Auto-fix what's possible
npm run lint:fix

# Check specific file
npx eslint src/path/to/file.ts
```

#### BDD Test Failures
```bash
# Run in debug mode
DEBUG=cucumber:* npx cucumber-js

# Run specific scenario
npx cucumber-js features/file.feature:line
```

---

## 📊 Quality Metrics

### Current Status
| Metric | Status | Target |
|--------|--------|--------|
| TypeScript Strict | ✅ Enabled | 100% |
| ESLint Rules | ✅ Configured | 0 errors |
| BDD Scenarios | ✅ 118 defined | 100% passing |
| Test Coverage | ✅ 70%+ | 80% |
| Pre-commit Hooks | ✅ Active | Always on |

### Quality Commands Summary
```bash
# Quick quality check
npm run check:all

# Fix issues
npm run lint:fix && npm run format

# Full validation
npm run check:compile && npm run test

# BDD tests
npm run test:bdd
```

---

## 🎯 Best Practices

### For Developers
1. **Always run `npm run check:compile` before committing**
2. **Write BDD scenarios for new features**
3. **Fix linting errors immediately**
4. **Keep TypeScript strict mode enabled**
5. **Don't use `any` type - use proper types**

### For CI/CD
1. **Never skip quality checks in CI**
2. **Fail builds on compilation errors**
3. **Monitor quality metrics trends**
4. **Keep dependencies updated**

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup pre-commit hooks
npm run prepare

# Run all checks
npm run check:all

# Run BDD tests
npm run test:bdd

# Fix issues
npm run lint:fix && npm run format
```

---

**Remember**: Quality is not negotiable. Every commit should compile, pass linting, and include tests!