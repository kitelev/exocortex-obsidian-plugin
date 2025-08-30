# Exocortex E2E Testing Infrastructure

This directory contains the comprehensive Docker-based End-to-End (E2E) testing infrastructure for the Exocortex Obsidian plugin using the `obsidian-remote` container.

## 🏗️ Architecture Overview

### Components

- **Docker Environment**: Isolated testing using `obsidian-remote:latest`
- **WebdriverIO Framework**: Modern E2E testing with Page Object pattern
- **Page Objects**: Structured interaction patterns for UI components
- **Test Specs**: Comprehensive test coverage for critical functionality
- **Stability Testing**: 5x validation runs for reliability assurance
- **CI/CD Integration**: GitHub Actions automated testing pipeline

### Key Features

- ✅ **Complete Docker Isolation**: Tests run in containerized Obsidian environment
- ✅ **Dynamic Layout Testing**: Comprehensive coverage of layout rendering
- ✅ **Modal Testing**: Full Create Asset Modal functionality including dynamic form expansion
- ✅ **Universal Layout Testing**: Automatic layout detection and rendering
- ✅ **Stability Validation**: 5 consecutive test runs ensure reliability
- ✅ **Performance Monitoring**: Execution time tracking and optimization
- ✅ **Screenshot Capture**: Visual debugging for test failures
- ✅ **CI/CD Ready**: Automated testing in GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed  
- Plugin built (`npm run build`)

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e:docker

# Run specific test suites
npm run test:e2e:docker:dynamic     # Dynamic Layout tests
npm run test:e2e:docker:modal       # Create Asset Modal tests
npm run test:e2e:docker:universal   # Universal Layout tests

# Run stability testing (5 consecutive runs)
npm run test:e2e:docker:stability
```

### Manual Docker Setup

```bash
# Start services
docker-compose -f tests/e2e/docker/docker-compose.e2e.yml up -d --build

# Wait for services to be healthy
docker-compose -f tests/e2e/docker/docker-compose.e2e.yml ps

# Run tests
npx wdio run wdio.e2e.conf.ts

# Cleanup
docker-compose -f tests/e2e/docker/docker-compose.e2e.yml down --volumes
```

## 📁 Directory Structure

```
tests/e2e/
├── docker/                          # Docker configuration
│   ├── docker-compose.e2e.yml      # Service orchestration
│   ├── Dockerfile.test-runner       # Test runner container
│   ├── run-stable-quick.sh          # Stability testing script
│   └── test-vault/                  # Test Obsidian vault
│       ├── .obsidian/               # Obsidian configuration
│       ├── classes/                 # Test class definitions
│       └── assets/                  # Test asset files
├── page-objects/                    # Page Object pattern implementations
│   ├── WorkspacePage.ts             # Base Obsidian workspace interactions
│   ├── DynamicLayoutPage.ts         # Dynamic layout testing methods
│   └── CreateAssetModalPage.ts      # Modal testing methods
├── specs/                           # Test specifications
│   ├── dynamic-layout.spec.ts       # Dynamic layout test cases
│   ├── create-asset-modal.spec.ts   # Modal test cases
│   └── universal-layout.spec.ts     # Universal layout test cases
├── fixtures/                        # Test data and configuration
└── README.md                        # This file
```

## 🧪 Test Coverage

### DynamicLayout Tests (`dynamic-layout.spec.ts`)

- **Basic Rendering**: Default block rendering, custom configurations
- **Block Functionality**: Properties, buttons, queries, backlinks display
- **Performance**: Render time validation, multiple layouts handling
- **Configuration**: Block ordering, layout refresh capability
- **Error Handling**: Malformed config, missing classes

**Key Test Cases:**
- Layout renders with default blocks ✓
- Custom configuration respected ✓  
- Properties block displays correctly ✓
- Buttons are functional ✓
- Multiple layouts on same page ✓
- Performance under 5 seconds ✓

### CreateAssetModal Tests (`create-asset-modal.spec.ts`)

- **Modal Operations**: Opening, closing, navigation
- **Dynamic Form Expansion**: Class selection triggers property updates
- **Validation**: Required fields, input types, error handling
- **Form Submission**: Success/failure scenarios, file creation
- **Edge Cases**: Race conditions, network delays, window resizing

**Key Test Cases:**
- Modal opens via command ✓
- Class selection updates properties ✓
- Different classes show different properties ✓
- Rapid class switching handled correctly ✓
- Form validation works ✓
- Successful submission creates notes ✓

### UniversalLayout Tests (`universal-layout.spec.ts`)

- **Auto-Detection**: Frontmatter-based layout rendering
- **Class-Based Rendering**: Different configurations per class
- **Dynamic Updates**: Frontmatter changes trigger re-render
- **Block Integration**: Properties, buttons, instances display
- **Performance**: Large notes, complex configurations

**Key Test Cases:**
- Universal layout auto-renders ✓
- Different classes render differently ✓
- Frontmatter updates trigger re-render ✓
- Properties from frontmatter display ✓
- Mixed universal/manual layouts work ✓

## 🔧 Configuration

### WebdriverIO Configuration (`wdio.e2e.conf.ts`)

- **Browser**: Headless Chrome in Docker
- **Timeout**: 30s default, configurable per test
- **Reporters**: Spec, Allure, JSON for CI integration  
- **Services**: Docker service for Selenium
- **Screenshots**: Auto-capture on failures

### Docker Services (`docker-compose.e2e.yml`)

- **obsidian-e2e**: Obsidian Remote container (port 8080)
- **webdriver-chrome**: Selenium Chrome (port 4444)  
- **test-runner**: WebdriverIO test executor
- **Health Checks**: Ensure services ready before tests
- **Volume Mounts**: Plugin code, test vault, results

### Page Object Pattern

Each major UI component has a dedicated Page Object class:

```typescript
// Example: DynamicLayoutPage
class DynamicLayoutPage extends WorkspacePage {
  async waitForDynamicLayout(): Promise<WebdriverIO.Element>
  async getLayoutBlocks(): Promise<WebdriverIO.Element[]>
  async hasLayoutBlock(type: string): Promise<boolean>
  async verifyLayoutStructure(blocks: string[]): Promise<boolean>
}
```

## 📊 Stability Testing

The stability testing script (`run-stable-quick.sh`) provides comprehensive reliability validation:

### Features

- **5 Consecutive Runs**: Tests must pass 5 times in a row
- **Failure Artifacts**: Screenshots, logs, Docker states captured
- **Performance Tracking**: Execution time monitoring
- **JSON Reports**: Structured results for CI integration
- **Cleanup Management**: Proper Docker resource management

### Usage

```bash
# Local execution
./tests/e2e/docker/run-stable-quick.sh

# CI execution (via GitHub Actions)
# Triggered on: schedule, workflow_dispatch, main/develop pushes
```

### Output

```
======================================
E2E STABILITY TEST SUMMARY  
======================================
Total runs: 5
Passed: 5
Failed: 0  
Success rate: 100%
Total time: 420s (7m 0s)
======================================
🎉 ALL TESTS STABLE - E2E test suite is reliable!
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/e2e-docker-tests.yml`)

**Triggers:**
- Push to main/develop (when E2E files change)
- Pull requests (when E2E files change)
- Nightly schedule (2 AM UTC)
- Manual dispatch

**Strategy:**
- **Matrix Testing**: Parallel execution of test suites
- **Artifact Collection**: Screenshots, logs, reports
- **PR Comments**: Automatic result reporting
- **Allure Reports**: Rich test result visualization

**Jobs:**
1. **e2e-docker-tests**: Run individual test suites in parallel
2. **stability-test**: Run stability validation (scheduled/manual)
3. **report-results**: Aggregate and report final results

### Performance Targets

- **Test Execution**: < 15 minutes per suite
- **Layout Rendering**: < 5 seconds
- **Modal Operations**: < 3 seconds
- **Property Updates**: < 2 seconds
- **Stability Rate**: 100% (5/5 runs pass)

## 🐛 Debugging

### Local Debugging

```bash
# Start services with VNC access
docker-compose -f tests/e2e/docker/docker-compose.e2e.yml up -d

# Access VNC (password-free)
open vnc://localhost:7900

# View Obsidian interface
open http://localhost:8080

# Check service logs
docker-compose -f tests/e2e/docker/docker-compose.e2e.yml logs
```

### CI Debugging

- **Screenshots**: Downloaded as GitHub Actions artifacts
- **Service Logs**: Captured in test results
- **Video Recording**: Available via VNC connection
- **Allure Reports**: Rich test execution details

### Common Issues

1. **Service Startup**: Check health checks in docker-compose
2. **Test Timeouts**: Increase timeout values in wdio.e2e.conf.ts  
3. **Element Not Found**: Verify selectors in page objects
4. **Race Conditions**: Add appropriate wait conditions
5. **Resource Cleanup**: Ensure Docker cleanup in CI

## 🎯 Best Practices

### Writing E2E Tests

1. **Use Page Objects**: Encapsulate UI interactions
2. **Wait for Elements**: Always wait for elements before interaction
3. **Explicit Waits**: Use explicit waits over sleep()
4. **Error Screenshots**: Capture state on failures
5. **Cleanup Resources**: Ensure proper test isolation

### Test Data Management

1. **Fresh State**: Each test starts with clean vault
2. **Predictable Data**: Use deterministic test data
3. **Isolation**: Tests don't depend on each other
4. **Cleanup**: Remove test artifacts after execution

### Performance Optimization

1. **Parallel Execution**: Use matrix strategy in CI
2. **Docker Layer Caching**: Optimize container builds
3. **Resource Limits**: Set appropriate timeouts
4. **Selective Testing**: Run relevant tests for changes

## 📈 Metrics and Monitoring

### Success Metrics

- **Test Coverage**: All critical UI paths covered
- **Stability Rate**: 100% reliability in consecutive runs  
- **Performance**: All operations under target thresholds
- **CI Success**: Consistent passing in automated pipeline

### Monitoring Dashboard

The E2E testing infrastructure provides comprehensive monitoring:

- **Execution Times**: Track performance trends
- **Failure Rates**: Identify flaky tests
- **Resource Usage**: Monitor Docker resource consumption
- **Screenshot Gallery**: Visual test failure debugging

## 🤝 Contributing

### Adding New Tests

1. Create test spec in `tests/e2e/specs/`
2. Add corresponding Page Object methods
3. Update CI matrix if needed
4. Ensure 5x stability validation passes

### Updating Page Objects

1. Keep methods focused and reusable
2. Use consistent naming conventions
3. Add proper error handling
4. Document complex interactions

### CI/CD Changes  

1. Test locally first with `run-stable-quick.sh`
2. Verify Docker resource cleanup
3. Update timeout values appropriately
4. Test artifact collection works

---

This E2E testing infrastructure provides comprehensive, reliable testing for the Exocortex plugin's critical UI functionality with Docker isolation, stability validation, and CI/CD integration. It ensures that all user-facing features work correctly across different environments and configurations.