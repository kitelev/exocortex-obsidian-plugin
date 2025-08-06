# TASK-002: Dynamic UI Button System for Asset Views

## Task Overview
**ID**: TASK-002
**Type**: Feature
**Priority**: High
**Status**: In Progress
**Sprint**: 2025-W32
**Story Points**: 13
**Estimated Hours**: 20
**Actual Hours**: 12 (so far)

## Business Context
Users need the ability to execute custom actions directly from asset views without manual navigation. The current system requires users to manually execute commands, which is inefficient for repetitive tasks.

## User Story
**As a** user viewing assets in Exocortex  
**I want to** see and click custom buttons in asset views  
**So that I** can execute actions quickly without manual navigation  

## Requirements References
- **Business Requirement**: BR-002 (docs/requirements/BR-002-UI-BUTTONS.md)
- **BDD Specification**: features/ui-buttons.feature
- **Related Tasks**: TASK-001 (Interactive Tree Selector)

## Deliverables
- [x] Domain model for buttons and commands
- [x] Repository implementations
- [x] Use cases for button rendering and execution
- [x] Command executor service
- [x] Button renderer presentation component
- [x] CSS styling for buttons
- [x] BDD test specifications
- [ ] Integration with main plugin
- [ ] End-to-end testing
- [ ] User documentation

## Acceptance Criteria
### Functional
- [x] Buttons appear in asset views based on class configuration
- [x] Button labels are dynamically loaded from ui__Button assets
- [x] Commands execute when buttons are clicked
- [x] Modal appears for commands requiring input
- [x] Commands receive validated parameters
- [ ] Buttons respect context (selection, permissions)
- [ ] Error handling shows user-friendly messages

### Non-Functional
- [ ] Button rendering < 100ms
- [ ] Command execution < 500ms
- [ ] Supports 20+ buttons per view
- [ ] Keyboard accessible
- [ ] Works in light and dark themes

## Technical Design

### Domain Model
```
ClassView (Aggregate Root)
├── UIButton (Entity)
│   ├── label: string
│   ├── commandId: AssetId
│   └── order: number
└── ButtonCommand (Entity)
    ├── type: CommandType
    ├── parameters: CommandParameter[]
    └── requiresInput: boolean
```

### Architecture Layers
1. **Domain**: Entities, Value Objects, Aggregates
2. **Application**: Use Cases, Services
3. **Infrastructure**: Repositories, Command Executor
4. **Presentation**: Button Renderer, Input Modal

### Key Components
- `ClassView`: Aggregate managing button configurations
- `RenderClassButtonsUseCase`: Orchestrates button rendering
- `ExecuteButtonCommandUseCase`: Handles command execution
- `ObsidianCommandExecutor`: Infrastructure service for commands
- `ButtonRenderer`: Presentation component

## Implementation Plan
1. ✅ Design domain model following DDD
2. ✅ Create entities and value objects
3. ✅ Implement repositories
4. ✅ Create use cases
5. ✅ Build command executor
6. ✅ Create presentation components
7. ⏳ Integrate with main plugin
8. ⏳ Write unit tests
9. ⏳ Perform integration testing
10. ⏳ Document user guide

## Testing Strategy
### Unit Tests
- [ ] Domain entities
- [ ] Use cases
- [ ] Command executor
- [ ] Button renderer

### Integration Tests
- [ ] Repository with Obsidian vault
- [ ] End-to-end button flow

### BDD Tests
- [x] Gherkin scenarios written
- [ ] Step definitions implemented
- [ ] Cucumber tests passing

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Performance with many buttons | Medium | High | Implement virtual scrolling if needed |
| Complex command parameters | High | Medium | Clear validation and error messages |
| Breaking existing functionality | Low | High | Comprehensive testing before release |
| User confusion with dynamic UI | Medium | Medium | Clear documentation and tooltips |

## Dependencies
- Obsidian Plugin API
- Existing asset/ontology system
- Clean Architecture implementation
- DI Container

## Definition of Done
- [ ] Code complete and reviewed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] Performance benchmarks met
- [ ] Accessibility requirements met
- [ ] Released to GitHub

## Time Tracking
| Date | Hours | Activities |
|------|-------|------------|
| 2025-08-06 | 4 | Domain model design and implementation |
| 2025-08-06 | 3 | Repository implementations |
| 2025-08-06 | 2 | Use cases and services |
| 2025-08-06 | 3 | Presentation components and styling |

## Blockers
- TypeScript compilation errors in existing codebase
- Need to refactor main.ts to use DDD architecture

## Notes
- Following DDD principles strictly
- Using Result pattern for error handling
- Implementing proper separation of concerns
- All requirements have BDD specifications

## Lessons Learned
1. Should have created TASK document at the beginning
2. DDD requires significant upfront design
3. TypeScript strict mode helps catch issues early
4. BDD specifications guide implementation

## Next Steps
1. Fix remaining TypeScript errors
2. Integrate with main plugin using DI container
3. Write comprehensive unit tests
4. Create user documentation
5. Performance testing with large datasets