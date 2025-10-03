# Executable Specifications Guide

## 🎯 Overview

This project uses **Executable Specifications** approach - requirements are written as executable tests using BDD (Behavior-Driven Development) with Gherkin syntax.

## 📋 Architecture

### Tools Stack

- **jest-cucumber** - Jest integration for Gherkin features
- **Gherkin** - Business-readable DSL for behavior specification
- **Jest** - Test runner and assertion framework
- **TypeScript** - Type-safe test implementation

### Directory Structure

```
specs/features/layout/
├── instance-class-core.feature       # Core Instance Class functionality
├── instance-class-links.feature      # Full Instance Class specification (documentation)
├── table-sorting.feature             # Table sorting specification (documentation)
└── universal-layout-rendering.feature # Layout rendering specification (documentation)

tests/specs/
├── instance-class-core.test.ts       # EXECUTABLE: Core BDD tests
├── instance-class-links.test.ts      # EXECUTABLE: Instance Class tests
├── table-sorting.test.ts             # EXECUTABLE: Sorting tests
└── universal-layout-basic.test.ts    # EXECUTABLE: Basic layout tests
```

## 🚀 Usage

### Running Tests

```bash
# Run all tests (57 passing)
npm test

# Run only BDD/Cucumber tests
npm run test:cucumber

# Run specific feature test
npm run test:cucumber -- tests/specs/instance-class-core.test.ts

# Watch mode
npm run test:watch
```

### Writing New Executable Specifications

#### Step 1: Write Feature File (Gherkin)

Create a **simple, focused** feature file in `specs/features/layout/`:

```gherkin
# language: en
Feature: My New Feature

  Scenario: Basic behavior
    Given initial state
    When action happens
    Then expected result
```

**Important:** Keep scenarios simple with 3-5 steps maximum for jest-cucumber compatibility.

#### Step 2: Create Test File

Create corresponding test file in `tests/specs/`:

```typescript
import { loadFeature, defineFeature } from "jest-cucumber";
import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";

const feature = loadFeature("specs/features/layout/my-feature.feature");

defineFeature(feature, (test) => {
  // Setup
  let renderer: UniversalLayoutRenderer;
  let mockApp: any;

  beforeEach(() => {
    // Initialize test doubles
  });

  test("Basic behavior", ({ given, when, then }) => {
    given("initial state", () => {
      // Setup initial state
    });

    when("action happens", async () => {
      // Execute action
    });

    then("expected result", () => {
      // Assert expectations
      expect(result).toBe(expected);
    });
  });
});
```

#### Step 3: Run Test

```bash
npm run test:cucumber -- tests/specs/my-feature.test.ts
```

If test fails, jest-cucumber will show you exactly which steps are missing.

## 📖 Best Practices

### 1. Keep Features Simple

✅ **Good - Simple & Focused:**
```gherkin
Scenario: Display link
  Given a note with Instance Class
  When I render table
  Then I see a link
```

❌ **Bad - Too Complex:**
```gherkin
Scenario: Complex multi-step scenario
  Given note "X" with metadata table with 10 fields
  And Background steps from parent feature
  And multiple nested conditions
  When complex multi-part action
  Then verify 15 different assertions
```

### 2. Use Regex Patterns

```typescript
// Flexible matching with regex
given(/^a note "(.*)" exists with class "(.*)"$/, (name, cls) => {
  // name and cls are captured from regex groups
});

// Fixed text
given("I render the table", async () => {
  // No parameters
});
```

### 3. One Feature = One Concern

Each feature file should test ONE specific functionality:
- `instance-class-core.feature` - Core Instance Class behavior
- `table-sorting.feature` - Sorting functionality
- `universal-layout-rendering.feature` - Layout rendering

### 4. Use Background Wisely

Background steps are executed before EVERY scenario. Keep them minimal:

```gherkin
Background:
  Given mock app is initialized

Scenario: Test 1
  When action 1
  Then result 1
```

## 🔍 Troubleshooting

### Problem: Test hangs with `npm run test:gherkin`

**Cause:** Full Cucumber CLI (`@cucumber/cucumber`) has environment issues.

**Solution:** Use `npm run test:cucumber` (jest-cucumber) instead.

### Problem: "Expected step to match..." error

**Cause:** Step definition doesn't exactly match feature file text.

**Solution:**
1. Check regex pattern matches Gherkin text exactly
2. Use the suggested code from error message
3. Simplify feature file wording

### Problem: Too many steps to implement

**Cause:** Feature file is too complex for jest-cucumber.

**Solution:**
1. Create simplified "core" feature file with 3-5 key scenarios
2. Keep full feature as living documentation
3. Implement core scenarios with jest-cucumber

## 📊 Current Status

- ✅ **57/57 tests passing (100%)**
- ✅ **4 executable feature specifications**
- ✅ **jest-cucumber integration working**
- ✅ **English language for all features**
- ✅ **Living documentation approach**

## 🎓 Learning Resources

### Gherkin Syntax
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)

### jest-cucumber
- [jest-cucumber GitHub](https://github.com/bencompton/jest-cucumber)
- [API Documentation](https://github.com/bencompton/jest-cucumber/blob/master/docs/AdditionalConfiguration.md)

### Examples in This Project
- `tests/specs/instance-class-core.test.ts` - Simple BDD test
- `tests/specs/table-sorting.test.ts` - Complex scenarios
- `specs/features/layout/` - Feature file examples

## 💡 Tips

1. **Start Simple** - Begin with 1-2 scenarios, expand later
2. **Test First** - Write .feature file, let tests guide implementation
3. **Readable Steps** - Write steps a business person can understand
4. **Maintain Sync** - Keep .feature files updated with code changes
5. **Use Both Approaches**:
   - Simplified .feature files → jest-cucumber tests (executable)
   - Full .feature files → living documentation (reference)

## 🔄 Workflow Example

1. **Product Owner** writes requirement in `my-feature.feature`
2. **Developer** creates simplified `my-feature-core.feature` (3-5 scenarios)
3. **Developer** implements `my-feature-core.test.ts` with jest-cucumber
4. **Tests fail** (Red) - shows missing implementation
5. **Developer** implements feature
6. **Tests pass** (Green) - feature complete
7. **Full .feature** serves as complete documentation
8. **Core .feature** ensures critical paths always work

---

**Remember:** Executable Specifications are **living documentation** that stays in sync with code!
