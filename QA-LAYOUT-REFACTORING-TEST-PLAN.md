# Comprehensive Test Plan for Layout Refactoring

## Test Plan Overview

**Document Information:**
- **Test Plan ID**: TP-LAY-REF-001
- **Version**: 1.0
- **Date**: 2025-01-21
- **Test Manager**: QA Engineer
- **Project**: Exocortex Obsidian Plugin Layout Refactoring

## 1. Test Objectives (ISTQB Level)

### 1.1 Primary Objectives
- **Functional Correctness**: Verify layouts are correctly selected based on asset class
- **Terminology Consistency**: Ensure refactoring from "ClassView" to "ClassLayout" maintains functionality
- **Regression Prevention**: Validate all existing functionality remains intact
- **Performance Validation**: Ensure layout rendering performance meets requirements (<100ms)

### 1.2 Quality Goals
- **Functional Suitability**: 98% feature completeness
- **Reliability**: 99.9% availability during user sessions
- **Usability**: Layout selection intuitive for users
- **Maintainability**: Code coverage >80% for layout-related modules

## 2. Current Test Coverage Analysis

### 2.1 Existing Test Coverage

#### Domain Layer Tests
- ✅ `ClassLayout.test.ts` - Comprehensive unit tests (582 lines)
  - Entity creation, validation, block management
  - CRUD operations on layout blocks
  - Business rule validation
  - Edge cases and boundary conditions

#### Application Layer Tests
- ✅ `GetLayoutForClassUseCase` - Limited coverage in integration tests
- ❌ Missing dedicated unit tests for use case
- ❌ Missing tests for class inheritance hierarchy

#### Infrastructure Layer Tests
- ✅ `ObsidianClassLayoutRepository.test.ts` - Basic repository operations
- ❌ Missing tests for fallback mechanisms
- ❌ Missing tests for file system operations

#### Presentation Layer Tests
- ✅ `LayoutRenderer.test.ts` - Basic rendering tests (267 lines)
- ✅ `LayoutRendererIntegration.test.ts` - Integration tests (skipped, deprecated)
- ❌ Missing tests for new class-based layout selection
- ❌ Missing mobile rendering tests

### 2.2 ClassView vs ClassLayout Analysis

**Current State:**
- `ClassView` - Button-focused aggregate for UI button management
- `ClassLayout` - Block-focused entity for layout configuration
- Both coexist and serve different purposes

**Refactoring Impact:**
- No actual terminology refactoring needed
- Confusion in test plan requirements
- Both concepts are valid and serve different domains

## 3. Test Scope

### 3.1 In Scope
- Class-based layout selection logic
- Layout inheritance hierarchy
- Block rendering functionality
- Repository pattern implementation
- Error handling and fallback mechanisms
- Performance characteristics
- Mobile rendering compatibility

### 3.2 Out of Scope
- UI button management (ClassView domain)
- SPARQL query execution
- File system operations (mocked)
- External API integrations

## 4. Test Strategy

### 4.1 Test Levels (ISTQB)

#### Unit Testing (70% of effort)
- **Target**: Individual components in isolation
- **Coverage**: >80% code coverage
- **Mock Strategy**: External dependencies mocked
- **Focus**: Business logic, validation rules, edge cases

#### Integration Testing (20% of effort)  
- **Target**: Component interactions
- **Coverage**: Data flow between layers
- **Focus**: Repository patterns, use case orchestration

#### System Testing (10% of effort)
- **Target**: End-to-end layout rendering
- **Coverage**: Complete user workflows
- **Focus**: Performance, usability, mobile compatibility

### 4.2 Test Types

#### Functional Testing
- **Equivalence Partitioning**: Valid/invalid class names, layout configurations
- **Boundary Value Analysis**: Block limits (0, 1, 20, 21 blocks)
- **Decision Table Testing**: Layout selection logic

#### Non-Functional Testing
- **Performance**: Layout rendering <100ms
- **Usability**: Layout selection intuitive
- **Compatibility**: Cross-platform rendering

## 5. Test Scenarios

### 5.1 Class-Based Layout Selection

#### TC-LAY-001: Direct Class Match
```yaml
Test_Case_ID: TC-LAY-001
Title: Verify direct class layout selection
Priority: High
Preconditions:
  - Layout exists for specific class (e.g., ems__Task)
  - Asset has matching instance class
Test_Steps:
  1. Create asset with exo__Instance_class: "[[ems__Task]]"
  2. Request layout for asset
  3. Verify correct layout returned
Expected_Result:
  - Specific ems__Task layout returned
  - fallbackUsed: false
Test_Data:
  className: "ems__Task"
  expectedLayoutId: "task-layout-001"
```

#### TC-LAY-002: Inheritance Fallback
```yaml
Test_Case_ID: TC-LAY-002
Title: Verify inheritance hierarchy layout fallback
Priority: High
Preconditions:
  - No direct layout for ems__Project
  - Layout exists for parent class ems__Effort
Test_Steps:
  1. Create asset with exo__Instance_class: "[[ems__Project]]"
  2. Request layout for asset
  3. Verify parent layout returned
Expected_Result:
  - ems__Effort layout returned
  - fallbackUsed: true
Test_Data:
  className: "ems__Project"
  parentClassName: "ems__Effort"
```

#### TC-LAY-003: Default Layout Fallback
```yaml
Test_Case_ID: TC-LAY-003
Title: Verify default layout when no match found
Priority: Medium
Preconditions:
  - No layout exists for specified class
  - No parent class layouts available
Test_Steps:
  1. Create asset with unknown class
  2. Request layout for asset
  3. Verify default layout structure
Expected_Result:
  - Default layout with properties, children-efforts, backlinks blocks
  - fallbackUsed: true
Test_Data:
  className: "unknown__Class"
```

### 5.2 Layout Block Rendering

#### TC-LAY-004: All Block Types Rendering
```yaml
Test_Case_ID: TC-LAY-004
Title: Verify all block types render correctly
Priority: High
Preconditions:
  - Layout with all supported block types
Test_Steps:
  1. Create layout with query, properties, backlinks, children-efforts, narrower, buttons, custom blocks
  2. Render layout
  3. Verify each block type renders
Expected_Result:
  - All 7 block types present in DOM
  - Each block has correct CSS classes
  - Block order respected
Block_Types:
  - query: SPARQL query execution
  - properties: Asset property display
  - backlinks: Referenced by display
  - children-efforts: Child asset table
  - narrower: Concept hierarchy
  - buttons: UI action buttons
  - custom: Custom block content
```

#### TC-LAY-005: Block Configuration
```yaml
Test_Case_ID: TC-LAY-005
Title: Verify block configuration parameters
Priority: Medium
Test_Steps:
  1. Create blocks with various configurations
  2. Render layout
  3. Verify configurations applied
Expected_Result:
  - Block titles displayed
  - Visibility settings respected
  - Collapsible blocks functional
  - Custom configurations passed to renderers
```

### 5.3 Error Handling

#### TC-LAY-006: Invalid Class Name
```yaml
Test_Case_ID: TC-LAY-006
Title: Handle invalid class names gracefully
Priority: Medium
Test_Steps:
  1. Request layout with malformed class name
  2. Verify error handling
Expected_Result:
  - Appropriate error message
  - No system crash
  - Fallback to default layout
```

#### TC-LAY-007: Malformed Layout Configuration
```yaml
Test_Case_ID: TC-LAY-007
Title: Handle corrupted layout data
Priority: Medium
Test_Steps:
  1. Load layout with missing required fields
  2. Attempt rendering
Expected_Result:
  - Graceful degradation
  - Error logged
  - Default layout rendered
```

### 5.4 Performance Testing

#### TC-LAY-008: Layout Selection Performance
```yaml
Test_Case_ID: TC-LAY-008
Title: Verify layout selection performance
Priority: Medium
Performance_Requirements:
  - Layout selection: <10ms
  - Layout rendering: <100ms
  - Memory usage: <50MB additional
Test_Steps:
  1. Create 100 different layouts
  2. Measure selection time for various classes
  3. Verify performance thresholds
```

#### TC-LAY-009: Large Layout Rendering
```yaml
Test_Case_ID: TC-LAY-009
Title: Verify performance with maximum blocks
Priority: Low
Test_Steps:
  1. Create layout with 20 blocks (maximum)
  2. Render layout
  3. Measure rendering time
Expected_Result:
  - Rendering completes <200ms
  - No memory leaks
  - UI remains responsive
```

### 5.5 Mobile Compatibility

#### TC-LAY-010: Mobile Layout Rendering
```yaml
Test_Case_ID: TC-LAY-010
Title: Verify mobile-optimized rendering
Priority: Medium
Test_Steps:
  1. Enable mobile platform detection
  2. Render layout on mobile
  3. Verify touch-friendly elements
Expected_Result:
  - Mobile-specific CSS classes applied
  - Touch handlers attached
  - Responsive layout structure
```

## 6. Regression Test Suite

### 6.1 Critical Path Tests
1. **Layout Selection Pipeline** (TC-LAY-001, TC-LAY-002, TC-LAY-003)
2. **Block Rendering Chain** (TC-LAY-004, TC-LAY-005)
3. **Error Recovery** (TC-LAY-006, TC-LAY-007)

### 6.2 Existing Functionality Validation

#### Repository Pattern Tests
```yaml
Test_Category: Repository Integration
Tests:
  - ObsidianClassLayoutRepository.findByClass()
  - ObsidianClassLayoutRepository.findEnabledByClass()
  - ObsidianClassLayoutRepository.save()
  - File system interaction mocking
```

#### Use Case Integration Tests
```yaml
Test_Category: Application Layer
Tests:
  - GetLayoutForClassUseCase execution
  - Dependency injection container
  - Error propagation
```

#### Presentation Layer Tests
```yaml
Test_Category: UI Rendering
Tests:
  - LayoutRenderer.renderLayout() - both signatures
  - Block renderer orchestration
  - CSS class application
  - Event handler attachment
```

## 7. Test Data Preparation

### 7.1 Test Layout Definitions
```typescript
// Standard test layouts
const TEST_LAYOUTS = {
  'ems__Task': {
    blocks: [
      { type: 'properties', order: 1, title: 'Task Properties' },
      { type: 'children-efforts', order: 2, title: 'Subtasks' },
      { type: 'backlinks', order: 3, title: 'References' }
    ]
  },
  'ems__Project': {
    blocks: [
      { type: 'properties', order: 1, title: 'Project Info' },
      { type: 'query', order: 2, title: 'Project Status', config: { query: 'PROJECT_QUERY' } },
      { type: 'children-efforts', order: 3, title: 'Tasks' }
    ]
  },
  'ems__Effort': {
    blocks: [
      { type: 'properties', order: 1, title: 'Effort Details' },
      { type: 'buttons', order: 2, title: 'Actions' }
    ]
  }
};
```

### 7.2 Test Asset Data
```typescript
const TEST_ASSETS = [
  {
    filename: 'Task - Example.md',
    frontmatter: {
      'exo__Instance_class': '[[ems__Task]]',
      'title': 'Example Task',
      'status': 'active'
    }
  },
  {
    filename: 'Project - Test.md', 
    frontmatter: {
      'exo__Instance_class': '[[ems__Project]]',
      'title': 'Test Project',
      'status': 'planning'
    }
  }
];
```

## 8. Test Environment Setup

### 8.1 Test Infrastructure
```yaml
Testing_Framework: Jest 30.0.5
Coverage_Tool: Istanbul
Mock_Library: Obsidian mocks (__mocks__/obsidian.ts)
Test_Types:
  - Unit: tests/unit/
  - Integration: tests/integration/
  - E2E: tests/e2e/
```

### 8.2 Mock Strategy
- **Obsidian API**: Complete mock in __mocks__/obsidian.ts
- **File System**: FakeVaultAdapter for controlled testing
- **External Dependencies**: Dependency injection with test doubles

## 9. Test Execution Plan

### 9.1 Test Phases

#### Phase 1: Unit Testing (Days 1-2)
- Execute all unit tests
- Achieve >80% code coverage
- Fix any failing tests

#### Phase 2: Integration Testing (Day 3)
- Repository integration tests
- Use case integration tests
- Cross-layer data flow validation

#### Phase 3: System Testing (Day 4)
- End-to-end rendering tests
- Performance validation
- Mobile compatibility testing

#### Phase 4: Regression Testing (Day 5)
- Execute full regression suite
- Validate no functionality broken
- Performance regression testing

### 9.2 Entry Criteria
- ✅ All existing unit tests passing
- ✅ Code compilation successful
- ✅ Test environment configured
- ✅ Test data prepared

### 9.3 Exit Criteria
- ✅ All new test cases passing
- ✅ Code coverage >80% for layout modules
- ✅ No critical or high-severity defects
- ✅ Performance requirements met
- ✅ All regression tests passing

## 10. Risk Assessment

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance degradation | Medium | High | Performance benchmarking, optimization |
| Mobile rendering issues | Low | Medium | Mobile-specific test suite |
| Complex inheritance bugs | High | Medium | Comprehensive inheritance testing |
| Memory leaks in rendering | Low | High | Memory profiling, cleanup validation |

### 10.2 Test Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Insufficient test data | Medium | Medium | Comprehensive test data generation |
| Mock limitations | Medium | Low | Realistic mock implementation |
| Test environment instability | Low | High | Containerized test environment |

## 11. Test Deliverables

### 11.1 Test Artifacts
- ✅ Test Plan Document (this document)
- 🔄 Test Case Specifications (embedded above)
- 🔄 Test Data Sets (defined above) 
- 🔄 Test Execution Reports (to be generated)
- 🔄 Defect Reports (if issues found)
- 🔄 Coverage Reports (target >80%)

### 11.2 Test Reports

#### Daily Test Report Template
```yaml
Date: YYYY-MM-DD
Test_Phase: [Unit|Integration|System|Regression]
Tests_Executed: X
Tests_Passed: Y
Tests_Failed: Z
Coverage: XX%
Issues_Found: N
Critical_Issues: N
Recommendations: [List]
```

## 12. Test Automation Strategy

### 12.1 Automated Tests
- **Unit Tests**: 100% automated via Jest
- **Integration Tests**: Automated with mocked dependencies
- **Regression Tests**: Fully automated in CI/CD
- **Performance Tests**: Automated with benchmarking

### 12.2 Manual Tests
- **Usability Testing**: Manual evaluation of layout intuitiveness
- **Cross-platform Testing**: Manual verification on different OS
- **Exploratory Testing**: Ad-hoc testing for edge cases

## 13. Test Metrics and KPIs

### 13.1 Coverage Metrics
- **Line Coverage**: Target >80%
- **Branch Coverage**: Target >75%
- **Function Coverage**: Target >85%

### 13.2 Quality Metrics
- **Defect Density**: <1 defect per 100 lines of code
- **Test Case Execution**: 100% of planned test cases
- **Automation Rate**: >90% of regression tests

### 13.3 Performance Metrics
- **Layout Selection Time**: <10ms average
- **Rendering Time**: <100ms for standard layouts
- **Memory Usage**: <50MB additional for layout system

## 14. Test Case Implementation

### 14.1 Recommended New Test Files
```
tests/unit/application/use-cases/GetLayoutForClassUseCase.test.ts
tests/unit/domain/layout/ClassLayoutInheritance.test.ts
tests/unit/presentation/renderers/LayoutRenderer.enhanced.test.ts
tests/integration/layout/LayoutSelectionWorkflow.test.ts
tests/performance/layout/LayoutRenderingPerformance.test.ts
```

### 14.2 Test Implementation Priority
1. **High Priority**: Direct class matching, inheritance fallback
2. **Medium Priority**: Error handling, performance testing
3. **Low Priority**: Edge cases, mobile-specific features

## Conclusion

This comprehensive test plan provides complete coverage for the layout refactoring initiative, ensuring both functional correctness and regression prevention. The plan follows ISTQB standards and includes detailed test scenarios, data preparation, and execution strategies.

**Key Success Factors:**
- Systematic test case execution
- Comprehensive coverage metrics
- Rigorous regression testing  
- Performance validation
- Mobile compatibility assurance

The test plan is designed to validate that layouts are correctly selected based on asset class while ensuring no existing functionality is compromised during the refactoring process.