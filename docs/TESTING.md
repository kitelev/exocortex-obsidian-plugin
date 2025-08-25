# Testing Guide

This document describes the testing setup and how to run tests for the Exocortex Obsidian Plugin.

## Test Structure

The project uses a multi-layered testing approach:

```
tests/
├── __mocks__/           # Mock implementations (Obsidian API)
├── setup.ts            # Jest test environment setup
├── unit/               # Unit tests (isolated component testing)
├── integration/        # Integration tests (multiple components)
├── e2e/               # End-to-end tests (Node.js based, no GUI)
├── ui/                # UI tests (WebDriver based, excluded from CI)
└── fixtures/          # Test data and helpers
```

## Test Types

### 1. Unit Tests
- **Location**: `tests/unit/`, `tests/domain/`
- **Command**: `npm run test:unit`
- **Purpose**: Test individual components in isolation
- **Environment**: JSDOM with Obsidian API mocks

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Command**: `npm run test:integration`
- **Purpose**: Test multiple components working together
- **Environment**: JSDOM with enhanced mocks

### 3. E2E Tests (Node.js)
- **Location**: `tests/e2e/`
- **Command**: `npm run test:e2e:all`
- **Purpose**: Test plugin loading and SPARQL functionality without GUI
- **Environment**: Node.js with mocked DOM and Obsidian API

### 4. UI Tests (WebDriver)
- **Location**: `tests/ui/`
- **Command**: `npm run test:ui`
- **Purpose**: Test actual UI interactions in Obsidian
- **Environment**: Real Obsidian instance (excluded from CI)

## Running Tests

### Local Development
```bash
# All unit and integration tests
npm test

# Watch mode for development
npm run test:watch

# With coverage
npm run test:coverage

# All tests including E2E
npm run test:all

# Individual test suites
npm run test:unit
npm run test:integration
npm run test:e2e:all
```

### CI Environment
```bash
# CI-optimized test suite
npm run test:ci
```

The CI test suite:
1. Runs unit tests with CI optimizations
2. Runs integration tests
3. Runs E2E tests with fallback DOM implementation
4. Excludes UI tests that require real Obsidian

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses `ts-jest` for TypeScript support
- JSDOM environment for DOM testing
- Excludes UI tests from Jest runs
- Enhanced setup for CI environments
- Proper timeout handling and worker optimization

### Test Setup (`tests/setup.ts`)
- Provides DOM polyfills for CI
- Handles missing dependencies gracefully
- Extends HTMLElement with Obsidian-specific methods
- Configures console output for CI

### Obsidian Mocks (`tests/__mocks__/obsidian.ts`)
- Comprehensive Obsidian API mocking
- Plugin lifecycle simulation
- Vault and file system mocking
- Workspace and metadata cache simulation

## CI/CD Integration

The project includes GitHub Actions workflow (`.github/workflows/ci.yml`) that:

- Tests on multiple Node.js versions (18.x, 20.x)
- Installs required dependencies (including jsdom for CI)
- Runs build verification
- Executes all test suites except UI tests
- Generates and uploads coverage reports
- Verifies plugin installation readiness

### Environment Variables
- `CI=true` - Enables CI-specific optimizations
- `GITHUB_ACTIONS=true` - Detected automatically in GitHub Actions

## Troubleshooting

### Common Issues

1. **Timeout Errors in CI**
   - Solution: Tests automatically use longer timeouts and single worker in CI

2. **Missing Dependencies**
   - Solution: E2E tests have fallback implementations for missing packages

3. **DOM-related Failures**
   - Solution: Tests use JSDOM with comprehensive polyfills

4. **Obsidian API Errors**
   - Solution: Enhanced mocks cover all used Obsidian APIs

### Debug Commands
```bash
# Verbose test output
JEST_VERBOSE=true npm test

# Debug specific test file
npm test -- tests/path/to/test.ts

# Run with CI environment locally
CI=true npm run test:ci
```

## Writing New Tests

### Unit Test Example
```typescript
import { MyComponent } from '../src/MyComponent';

describe('MyComponent', () => {
  test('should perform expected behavior', () => {
    const component = new MyComponent();
    expect(component.method()).toBe(expectedResult);
  });
});
```

### Integration Test Example
```typescript
import { App } from 'obsidian';
import { MyUseCase } from '../src/MyUseCase';

describe('MyUseCase Integration', () => {
  let app: App;
  let useCase: MyUseCase;

  beforeEach(() => {
    app = new App(); // Uses mock
    useCase = new MyUseCase(app);
  });

  test('should integrate with Obsidian API', async () => {
    const result = await useCase.execute();
    expect(result.isSuccess()).toBe(true);
  });
});
```

### E2E Test Example
See `tests/e2e/plugin-loading.test.js` for reference implementation.

## Best Practices

1. **Use appropriate test type**: Unit for logic, integration for workflows, E2E for full scenarios
2. **Mock external dependencies**: Use provided mocks for Obsidian API
3. **Test error conditions**: Ensure graceful error handling
4. **Keep tests isolated**: Use beforeEach/afterEach to reset state
5. **CI-friendly**: Tests should work without GUI dependencies