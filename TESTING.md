# Exocortex Plugin Testing Guide

## Overview

The Exocortex plugin has a comprehensive testing architecture with both unit tests and E2E UI tests.

## Test Architecture

### Unit Tests (Jest)

- **Location**: `/tests/unit/`
- **Framework**: Jest with TypeScript
- **Coverage**: Core plugin functionality, SPARQL processing

### E2E UI Tests (WebdriverIO)

- **Location**: `/tests/ui/`
- **Framework**: WebdriverIO with wdio-obsidian-service
- **Coverage**: Full plugin interaction in real Obsidian environment

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Plugin

```bash
npm run build
```

### 3. Run Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### 4. Run E2E UI Tests

#### First Time Setup

```bash
# Download Obsidian for testing
./scripts/download-obsidian.sh

# Set environment variable (copy from script output)
export OBSIDIAN_APP_PATH="/path/to/Obsidian.app"
```

#### Run Tests

```bash
# Run all UI tests
npm run test:ui

# Run specific test suite
npx wdio run wdio.conf.ts --spec tests/ui/specs/activate.spec.ts

# Run with debug mode
npx wdio run wdio.conf.ts --logLevel debug
```

## Test Categories

### Unit Tests

1. **Plugin Loading** (`plugin-loading.test.js`)
   - Plugin initialization
   - Configuration handling
   - Error recovery

2. **SPARQL Functionality** (`sparql-functionality.test.js`)
   - Query parsing
   - Triple extraction
   - Result formatting

### E2E UI Tests

1. **Activation Tests** (`activate.spec.ts`)
   - Plugin activation/deactivation
   - Workspace initialization
   - File detection

2. **SPARQL Processing** (`sparql-processing.spec.ts`)
   - Query execution in UI
   - Results rendering
   - Error display
   - Dynamic query creation

3. **Advanced Features** (`sparql-advanced.spec.ts`)
   - Complex queries
   - File navigation
   - Frontmatter extraction
   - Performance testing

## CI/CD Integration

Tests run automatically on GitHub Actions:

- On push to main/master/develop
- On pull requests
- Manual workflow dispatch

See `.github/workflows/ci.yml` and `.github/workflows/ui-tests.yml`

## Page Object Pattern

The UI tests use Page Object pattern for maintainability:

```typescript
// Example usage
import { ObsidianAppPage } from "../pageobjects/ObsidianApp.page";
import { SparqlBlockPage } from "../pageobjects/SparqlBlock.page";

const app = new ObsidianAppPage();
const sparql = new SparqlBlockPage();

await app.openFile("test.md");
await sparql.waitForResults();
```

## Test Data

### Unit Test Fixtures

- Mock Obsidian API
- Sample markdown files
- Test frontmatter data

### UI Test Vault

- **Location**: `/tests/ui/fixtures/vault/`
- Pre-configured `.obsidian` settings
- Sample markdown files with SPARQL queries
- Test data for frontmatter extraction

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm test -- plugin-loading.test.js

# Run with verbose output
npm test -- --verbose

# Debug with VS Code
# Use "Debug Jest Tests" launch configuration
```

### UI Tests

```bash
# Run with headed browser (see what's happening)
npx wdio run wdio.conf.ts --headless false

# Increase timeout for debugging
npx wdio run wdio.conf.ts --mochaOpts.timeout 300000

# Take screenshots on failure
# Already configured in wdio.conf.ts
```

## Writing New Tests

### Unit Test Template

```javascript
describe("Feature Name", () => {
  beforeEach(() => {
    // Setup
  });

  it("should do something", () => {
    // Test implementation
    expect(result).toBe(expected);
  });

  afterEach(() => {
    // Cleanup
  });
});
```

### UI Test Template

```typescript
describe("Feature Name", () => {
  let app: ObsidianAppPage;

  before(() => {
    app = new ObsidianAppPage();
  });

  it("should interact with UI", async () => {
    await app.waitForWorkspaceReady();
    await app.openFile("test.md");
    // Test implementation
    expect(await element.isDisplayed()).to.be.true;
  });
});
```

## Common Issues

### Obsidian Not Found

```bash
# Re-run download script
./scripts/download-obsidian.sh

# Verify path
echo $OBSIDIAN_APP_PATH
```

### TypeScript Errors

```bash
# Check TypeScript compilation
npx tsc --project tsconfig.wdio.json --noEmit

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Tests Timing Out

- Increase timeout in test configuration
- Check if Obsidian is actually launching
- Verify no modal dialogs blocking

## Test Coverage Goals

- **Unit Tests**: > 80% code coverage
- **E2E Tests**: All critical user paths
- **Integration**: All SPARQL query types
- **Edge Cases**: Error handling, malformed data

## Contributing

1. Write tests for new features
2. Ensure all tests pass before PR
3. Include test output in PR description
4. Update this document for new test categories
