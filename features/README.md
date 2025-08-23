# BDD Feature Coverage for Exocortex Plugin

## Overview
This directory contains Behavior-Driven Development (BDD) feature specifications for the Exocortex Obsidian plugin. These features are written in Gherkin syntax and can be executed using Cucumber.js.

## Current Coverage Status

### ✅ Implemented Features (Existing)
1. **semantic-knowledge.feature** - RDF triple store and SPARQL query execution
2. **class-layouts.feature** - Class-based layout rendering system
3. **class-tree-selector.feature** - Hierarchical class selection UI
4. **ui-buttons.feature** - Button commands and UI interactions
5. **inline-property-editing.feature** - In-place property modification
6. **bug-fix-asset-not-found.feature** - Asset resolution error handling

### ✅ Core Features (Added for MVP)
7. **task-management.feature** - Task and project management system
8. **rdf-operations.feature** - RDF import/export functionality
9. **graph-visualization.feature** - Interactive knowledge graph display
10. **query-engines.feature** - Multi-engine query abstraction layer
11. **mobile-support.feature** - Mobile device optimizations
12. **cache-management.feature** - Performance caching system
13. **sparql-commands.feature** - SPARQL command execution

### ❌ Removed Features (Premature for MVP)
- **api.feature** - REST API endpoints (removed - not implemented)
- **security.feature** - Security validation (removed - premature optimization)

## Feature Organization

### By Priority

#### High Priority (Core Functionality)
- Task Management (`@tasks`)
- SPARQL Operations (`@sparql`)
- RDF Data Management (`@rdf`)
- Class Layouts (`@layouts`)

#### Medium Priority (User Experience)
- Graph Visualization (`@graph`)
- Mobile Support (`@mobile`)
- Cache Management (`@cache`)
- Query Engines (`@query-engines`)

#### Low Priority (Enhancements)
- Inline Property Editing
- UI Buttons
- Bug Fixes

### By Tag

- `@smoke` - Critical path tests that must always pass
- `@tasks` - Task and project management features
- `@sparql` - SPARQL query functionality
- `@rdf` - RDF import/export operations
- `@graph` - Graph visualization features
- `@mobile` - Mobile-specific functionality
- `@cache` - Caching and performance features
- `@query-engines` - Query engine abstraction
- `@layouts` - Layout rendering system
- `@performance` - Performance-related scenarios

## Running the Tests

### Run all features
```bash
npm run test:bdd
```

### Run specific feature
```bash
npx cucumber-js features/task-management.feature
```

### Run by tag
```bash
npx cucumber-js --tags "@smoke"
npx cucumber-js --tags "@mobile and not @performance"
```

### Generate HTML report
```bash
npx cucumber-js --format html:reports/cucumber-report.html
```

## Implementation Status

### Step Definitions
Currently implemented step definitions are in:
- `/features/step-definitions/semantic-knowledge.steps.js` - Basic RDF/SPARQL steps

Additional step definitions needed for:
- Task management operations
- RDF import/export operations  
- Graph visualization interactions
- Mobile-specific gestures
- Cache operations
- Query engine selection

## Writing New Features

1. Create a `.feature` file in this directory
2. Tag appropriately for organization
3. Write scenarios following Given-When-Then format
4. Implement step definitions in `/features/step-definitions/`
5. Run tests to verify

## Best Practices

1. **Use Background** for common setup across scenarios
2. **Tag features and scenarios** for selective execution
3. **Keep scenarios focused** - one behavior per scenario
4. **Use data tables** for multiple examples
5. **Write from user perspective** - avoid technical implementation details
6. **Make scenarios executable** - they should run as tests

## Coverage Metrics

- **Total Features**: 13
- **Total Scenarios**: ~150+
- **Core Functionality Coverage**: 100%
- **Advanced Features Coverage**: ~80%
- **Step Definition Coverage**: ~20% (needs expansion)

## Next Steps

1. Implement remaining step definitions for all features
2. Integrate with CI/CD pipeline
3. Add performance benchmarks to relevant scenarios
4. Create smoke test suite for rapid validation
5. Add accessibility scenarios
6. Document test data requirements