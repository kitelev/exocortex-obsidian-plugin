# BDD Test Suite for Plugin Refactoring

This directory contains comprehensive Behavior-Driven Development (BDD) specifications for the Exocortex plugin refactoring task. The tests ensure that essential functionality is preserved while non-essential components are properly removed, maintaining clean architecture principles.

## 📁 Structure

```
features/
├── core-functionality-preservation.feature  # Tests for preserved components
├── functionality-removal.feature            # Tests for removed components  
├── clean-architecture-validation.feature    # Architecture integrity tests
├── step_definitions/
│   └── refactoring-steps.ts                # Step implementations
├── test-framework/
│   └── bdd-test-runner.ts                  # Custom BDD test runner
├── package.json                            # BDD test dependencies
└── README.md                               # This file
```

## 🎯 Test Coverage

### Core Functionality Preservation
- **UniversalLayout**: Asset relations rendering, grouping, sorting, navigation
- **DynamicLayout**: Class-based layout configuration, fallback behavior
- **CreateAssetModal**: Dynamic property loading, class switching, asset creation
- **Architecture**: Layer integrity, dependency injection, clean boundaries

### Functionality Removal  
- **Button Commands**: Complete removal of button-related code
- **Query Blocks**: Elimination of query processing components
- **Block Renderers**: Removal of specialized renderers
- **Legacy Components**: Cleanup of redundant implementations
- **Services**: Removal of unused services and utilities

### Clean Architecture Validation
- **Domain Layer**: Independence from external frameworks
- **Application Layer**: Use case orchestration integrity  
- **Infrastructure Layer**: Proper adapter implementations
- **Presentation Layer**: UI component separation
- **Dependency Flow**: Correct architectural boundaries

## 🚀 Quick Start

### Prerequisites

```bash
cd features/
npm install
```

### Running Tests

```bash
# Run all BDD tests
npm run test:bdd

# Run specific feature tests
npm run test:bdd:core         # Core functionality only
npm run test:bdd:removal      # Functionality removal only  
npm run test:bdd:architecture # Architecture validation only

# Run with options
npm run test:bdd:verbose      # Detailed step output
npm run test:bdd:fail-fast    # Stop on first failure
```

### Custom Test Execution

```bash
# Run specific feature file
npx tsx test-framework/bdd-test-runner.ts --feature=core-functionality-preservation

# Run with custom options
npx tsx test-framework/bdd-test-runner.ts --verbose --fail-fast
```

## 📊 Test Reports

Test execution generates comprehensive reports:

- **JSON Report**: `../test-reports/bdd/bdd-results.json`
- **HTML Report**: `../test-reports/bdd/bdd-report.html`

The HTML report provides:
- Test summary with success rates
- Scenario-by-scenario results
- Step execution details
- Error messages and stack traces
- Performance metrics

## 🧪 Test Scenarios Overview

### Core Functionality Preservation (15 scenarios)

| Scenario | Purpose |
|----------|---------|
| UniversalLayout remains fully functional | Verify complete rendering pipeline |
| UniversalLayout handles empty results | Test error handling |
| UniversalLayout supports all layout modes | Test layout variations |
| DynamicLayout continues working | Test class-based configuration |
| DynamicLayout falls back to UniversalLayout | Test fallback behavior |
| DynamicLayout handles defaultLayout optimization | Test performance optimization |
| CreateAssetModal creates assets | Test asset creation workflow |
| CreateAssetModal handles class switching | Test dynamic property loading |
| CreateAssetModal creates valid assets | Test output validation |
| CreateAssetModal handles property validation | Test error handling |
| CreateAssetModal supports different property types | Test UI components |
| Architecture layers remain intact | Test architectural integrity |

### Functionality Removal (12 scenarios)

| Scenario | Purpose |
|----------|---------|
| Button command functionality removed | Verify complete button cleanup |
| Query block functionality removed | Verify query system removal |
| Specialized block renderers removed | Verify renderer consolidation |
| Legacy renderers removed | Verify redundant code cleanup |
| Command execution infrastructure removed | Verify service cleanup |
| Unnecessary services cleaned up | Verify utility cleanup |
| Entity and value object cleanup | Verify domain cleanup |
| Repository interface cleanup | Verify persistence cleanup |
| Use case cleanup verification | Verify application cleanup |
| Event and specification cleanup | Verify event system cleanup |
| Modal and component cleanup | Verify UI cleanup |
| Configuration and settings cleanup | Verify settings cleanup |
| Test cleanup verification | Verify test suite cleanup |
| Documentation and type cleanup | Verify type system cleanup |

### Clean Architecture Validation (10 scenarios)

| Scenario | Purpose |
|----------|---------|
| Domain layer remains independent | Test layer isolation |
| Domain repositories remain pure | Test interface purity |
| Application layer maintains orchestration | Test use case integrity |
| Application services remain focused | Test service cohesion |
| Infrastructure implements contracts | Test adapter compliance |
| Presentation maintains separation | Test UI boundaries |
| Dependency injection maintains registration | Test DI container |
| Cross-layer communication follows rules | Test dependency flow |
| Entity and value object integrity | Test domain model |
| Domain services maintain encapsulation | Test business logic |
| Error handling follows patterns | Test error architecture |
| Ports and adapters pattern implemented | Test hexagonal architecture |
| Clean architecture benefits preserved | Test overall quality |

## 🔧 Implementation Details

### Step Definitions

The `step_definitions/refactoring-steps.ts` file implements all Gherkin steps using:

- **Mock Obsidian App**: Simulates the Obsidian environment
- **Test Fixtures**: Creates sample files and data
- **Performance Monitoring**: Tracks execution times
- **Error Collection**: Captures and validates errors
- **Architecture Analysis**: Examines code structure

### Test Runner

The `test-framework/bdd-test-runner.ts` provides:

- **Gherkin Parser**: Parses .feature files
- **Jest Integration**: Executes steps via Jest
- **Report Generation**: Creates JSON and HTML reports
- **Performance Tracking**: Monitors test execution
- **CLI Interface**: Command-line test execution

### Mock Infrastructure

The test framework includes comprehensive mocks:

- **Obsidian API**: Complete app, vault, and metadata cache simulation
- **File System**: Virtual file operations
- **Plugin Lifecycle**: Plugin loading and unloading
- **DOM Elements**: HTML element creation and manipulation

## 📋 Usage Examples

### Writing New Scenarios

```gherkin
Scenario: New functionality works correctly
  Given I have the required setup
  When I perform the action
  Then I should see the expected result
  And no errors should occur
```

### Adding Step Definitions

```typescript
Given('I have the required setup', async function() {
  // Setup test conditions
  testContext.setup = await createTestSetup();
  expect(testContext.setup).toBeDefined();
});

When('I perform the action', async function() {
  // Execute the action being tested
  testContext.result = await performAction(testContext.setup);
});

Then('I should see the expected result', function() {
  // Verify the outcome
  expect(testContext.result).toMatchExpectedOutcome();
});
```

### Custom Test Execution

```typescript
import { BDDTestRunner } from './test-framework/bdd-test-runner';

const runner = new BDDTestRunner({
  verbose: true,
  failFast: false,
  timeout: 60000
});

await runner.runTests('my-feature');
```

## 🐛 Troubleshooting

### Common Issues

1. **Step Not Found**: Ensure step definitions match Gherkin text exactly
2. **Mock Failures**: Verify Obsidian API mocks are properly configured  
3. **Timeout Errors**: Increase timeout for slow operations
4. **Path Issues**: Check file paths are correct for your environment

### Debug Mode

Enable verbose logging:

```bash
npm run test:bdd:verbose
```

This shows:
- Individual step execution
- Performance metrics
- Mock object states  
- Error stack traces

### Performance Issues

Monitor test performance:

```bash
# Check step execution times in HTML report
npm run test:bdd
open ../test-reports/bdd/bdd-report.html
```

Optimize slow steps by:
- Reducing test data size
- Mocking expensive operations
- Parallelizing independent tests

## 🤝 Contributing

### Adding New Tests

1. Write Gherkin scenarios in appropriate .feature file
2. Implement step definitions in `step_definitions/refactoring-steps.ts`
3. Add any required test utilities or mocks
4. Run tests to verify implementation
5. Update this README if needed

### Code Style

- Follow TypeScript best practices
- Use descriptive step names matching Gherkin text
- Include error handling and cleanup
- Add performance monitoring for slow operations
- Write self-documenting code with clear variable names

## 📚 References

- [Gherkin Syntax](https://cucumber.io/docs/gherkin/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)