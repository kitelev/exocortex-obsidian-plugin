# Exocortex Plugin - BDD Test Suite

This directory contains the BDD (Behavior-Driven Development) test suite for the Exocortex Obsidian Plugin using Cucumber.js with Gherkin syntax.

## Quick Start

```bash
# Run BDD tests
npm run bdd:test

# Dry run (check step definitions without executing)
npm run bdd:test:dry

# Check BDD coverage
npm run bdd:coverage

# Generate coverage report
npm run bdd:report
```

## Directory Structure

```
specs/
├── features/                    # Gherkin feature files
│   ├── layout/                  # Layout-related features
│   │   ├── daily-tasks.feature
│   │   ├── instance-class-links.feature
│   │   ├── table-sorting.feature
│   │   ├── property-cleanup.feature
│   │   └── ...
│   └── commands/                # Command-related features
│       └── command-palette-integration.feature
├── step_definitions/            # Step implementations
│   ├── common.steps.ts          # Shared steps
│   ├── daily-tasks.steps.ts     # Daily task steps
│   ├── effort-workflow.steps.ts # Effort workflow steps
│   ├── instance-class-links.steps.ts
│   ├── table-sorting.steps.ts
│   ├── property-cleanup.steps.ts
│   ├── universal-layout.steps.ts
│   └── command-palette.steps.ts
├── support/                     # Support files
│   ├── world.ts                 # Custom World class
│   └── hooks.ts                 # Before/After hooks
├── tsconfig.json                # TypeScript config for specs
└── README.md                    # This file
```

## Feature Files

### Layout Features

| Feature | Description | Scenarios |
|---------|-------------|-----------|
| `daily-tasks.feature` | Daily note task display | ~30 |
| `instance-class-links.feature` | Clickable class links | ~15 |
| `table-sorting.feature` | Interactive sorting | ~25 |
| `property-cleanup.feature` | Clean empty properties | ~15 |
| `universal-layout-rendering.feature` | Table rendering | ~10 |
| `effort-workflow.feature` | Task status workflow | ~20 |

### Command Features

| Feature | Description | Scenarios |
|---------|-------------|-----------|
| `command-palette-integration.feature` | Command availability | ~25 |

## Writing New Scenarios

### Step Pattern Reference

**Given steps** (setup):
```gherkin
Given I have a pn__DailyNote for "2024-01-15"
Given I have a Task "My Task" with Draft status
Given I have an Area "Development"
Given Dataview plugin is installed and active
```

**When steps** (actions):
```gherkin
When I view the daily note
When I click "Start Effort" button
When I click on column header "Name"
When I open Command Palette
```

**Then steps** (assertions):
```gherkin
Then I should see a "Tasks" section
Then task "Task A" should display "✅" status icon
Then table is sorted ascending
Then "Exocortex: Create Task" command is available
```

### Adding New Step Definitions

1. Create or update a step definition file in `step_definitions/`
2. Import the World class:
   ```typescript
   import { Given, When, Then } from "@cucumber/cucumber";
   import { ExocortexWorld } from "../support/world.js";
   ```

3. Define steps with proper typing:
   ```typescript
   Given("my new step {string}", function (this: ExocortexWorld, param: string) {
     // Implementation using this.currentNote, this.tableRows, etc.
   });
   ```

## The World Object

The `ExocortexWorld` class provides a simulated Obsidian environment:

### Properties
- `currentNote` - Currently viewed note
- `notes` - Map of all notes in vault
- `tableRows` - Current table data
- `renderedSections` - Visible sections
- `renderedButtons` - Available buttons
- `sortState` - Current sort state

### Methods
- `createFile(path, frontmatter)` - Create a mock note
- `createTask(name, properties)` - Create a task note
- `createDailyNote(date)` - Create a daily note
- `viewNote(note)` - Simulate viewing a note
- `click(element, modifier)` - Simulate click action
- `sortColumn(column)` - Sort table by column
- `resolveAreaForTask(note)` - Resolve area inheritance

## Coverage Goals

- **Target**: 80% scenario coverage (176+ of 220 scenarios)
- **Current**: ~50 scenarios automated (23%)
- **Priority**: Focus on high-value features first

## CI Integration

BDD tests run in the CI pipeline:
1. `npm run bdd:test` - Execute tests
2. `npm run bdd:check` - Verify coverage threshold
3. `npm run bdd:report` - Generate coverage report

Reports are uploaded as artifacts in GitHub Actions.

## Best Practices

1. **One scenario = one behavior** - Keep scenarios focused
2. **Use backgrounds** - Share common setup steps
3. **Avoid implementation details** - Test behavior, not code
4. **Descriptive names** - Scenarios should read like documentation
5. **Reuse steps** - Avoid duplicate step definitions

## Troubleshooting

### Common Issues

**"Undefined step"**
- Add the step definition in appropriate `.steps.ts` file

**"Ambiguous step"**
- Check for duplicate step patterns across files
- Use regex patterns for complex matching

**"Assertion failed"**
- Check World state (notes, tableRows, etc.)
- Verify step execution order

### Debug Tips

```bash
# Run with verbose output
npm run bdd:test -- --format progress

# Run specific feature
npm run bdd:test -- specs/features/layout/daily-tasks.feature

# Run specific scenario by line number
npm run bdd:test -- specs/features/layout/daily-tasks.feature:15
```

## Related Documentation

- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)
