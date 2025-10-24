# Exocortex Plugin Architecture

**Version**: 12.x
**Last Updated**: 2025-10-24

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [System Design](#system-design)
- [Layer Architecture](#layer-architecture)
- [Core Services](#core-services)
- [Data Flow](#data-flow)
- [Command System](#command-system)
- [Rendering Pipeline](#rendering-pipeline)
- [State Management](#state-management)
- [Performance Optimizations](#performance-optimizations)
- [Testing Strategy](#testing-strategy)
- [Development Workflow](#development-workflow)

---

## Overview

The Exocortex plugin implements **Clean Architecture** with **Domain-Driven Design** principles, creating a maintainable, testable, and extensible task management system for Obsidian.

### Core Philosophy

1. **Separation of Concerns**: Business logic independent of framework
2. **Dependency Inversion**: Domain layer has no dependencies
3. **Single Responsibility**: Each component has one reason to change
4. **Testability First**: All layers designed for easy testing
5. **Performance**: O(1) lookups via reverse indexing

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **UI** | React 19.2.0, TypeScript 4.9+ |
| **Build** | ESBuild, strict TypeScript |
| **Testing** | Jest, Playwright CT, Playwright E2E |
| **CI/CD** | GitHub Actions, Docker |
| **Visualization** | D3-force, force-graph |

---

## Architecture Principles

### 1. Clean Architecture

The plugin follows Uncle Bob's Clean Architecture, organizing code into concentric layers:

```
┌─────────────────────────────────────────┐
│         PRESENTATION LAYER              │
│  (React Components, UI Renderers)       │
│  - UniversalLayoutRenderer              │
│  - 24 React Components                  │
│  - Modal Dialogs                        │
└─────────────────────────────────────────┘
              ↓ Depends on ↓
┌─────────────────────────────────────────┐
│         APPLICATION LAYER               │
│  (Use Cases, Services, Commands)        │
│  - CommandManager                       │
│  - Command Visibility Logic             │
└─────────────────────────────────────────┘
              ↓ Depends on ↓
┌─────────────────────────────────────────┐
│            DOMAIN LAYER                 │
│  (Entities, Value Objects, Interfaces)  │
│  - GraphNode, GraphEdge                 │
│  - AreaNode, GraphData                  │
│  - Settings, Commands                   │
└─────────────────────────────────────────┘
              ↑ Implemented by ↑
┌─────────────────────────────────────────┐
│       INFRASTRUCTURE LAYER              │
│  (Obsidian API, File System, Services) │
│  - 9 Specialized Services               │
│  - Logging, Caching                     │
└─────────────────────────────────────────┘
```

### 2. Dependency Rule

**Dependencies point inward only:**
- Presentation → Application → Domain
- Infrastructure → Domain (implements interfaces)
- **NEVER**: Domain → Infrastructure
- **NEVER**: Domain → Presentation

### 3. SOLID Principles

| Principle | Implementation |
|-----------|----------------|
| **S**RP | Each service handles one responsibility (TaskCreationService, EffortVotingService) |
| **O**CP | Commands extensible without modifying CommandManager |
| **L**SP | All services implement consistent interfaces |
| **I**SP | Focused interfaces (ILogger, not IEverything) |
| **D**IP | Services depend on abstractions, not concretions |

---

## System Design

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    OBSIDIAN APP                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 ExocortexPlugin (main)                  │
│  - Plugin lifecycle management                          │
│  - Service initialization                               │
│  - Event registration                                   │
└─────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌───────────────┐   ┌──────────────────┐   ┌──────────────┐
│ CommandManager│   │LayoutRenderer    │   │ Settings Tab │
│ (24 commands) │   │ (6 sections)     │   │              │
└───────────────┘   └──────────────────┘   └──────────────┘
         ↓                    ↓
┌───────────────────────────────────────────────────────┐
│              SERVICES (9 specialized)                 │
│  TaskCreation, ProjectCreation, TaskStatus,           │
│  EffortVoting, PropertyCleanup, FolderRepair,         │
│  RenameToUid, AreaHierarchy, Supervision              │
└───────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    OBSIDIAN VAULT                       │
│  (Markdown files with YAML frontmatter)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Layer Architecture

### 1. Domain Layer (`/src/domain`)

**Purpose**: Contains pure business logic, no framework dependencies.

**Structure**:
```
domain/
├── models/
│   ├── GraphNode.ts          # Node in knowledge graph
│   ├── GraphEdge.ts          # Relationship between nodes
│   ├── AreaNode.ts           # Hierarchical area structure
│   └── GraphData.ts          # Complete graph dataset
├── commands/
│   └── CommandVisibility.ts  # Business rules for command availability
└── settings/
    └── ExocortexSettings.ts  # Plugin configuration model
```

**Key Entities**:

**GraphNode**:
```typescript
interface GraphNode {
  id: string;                    // File path
  label: string;                 // Human-readable name
  class: string;                 // Asset type (ems__Task, etc.)
  isArchived: boolean;           // Archive status
}
```

**AreaNode**:
```typescript
interface AreaNode {
  id: string;                    // Area file path
  label: string;                 // Area name
  parentId: string | null;       // Parent area (null = root)
  isArchived: boolean;
  children: AreaNode[];          // Child areas
}
```

**Design Decisions**:
- No Obsidian imports in domain layer
- All business rules in pure functions
- Value objects are immutable
- Rich domain models (not anemic)

### 2. Application Layer (`/src/application`)

**Purpose**: Orchestrates use cases, coordinates services.

**Structure**:
```
application/
└── services/
    └── CommandManager.ts      # Facade for command registration
```

**CommandManager Responsibilities**:
1. Register 24 commands with Obsidian
2. Determine command availability via visibility rules
3. Delegate execution to infrastructure services
4. Handle errors and user notifications

**Pattern**: Facade + Observer
- **Facade**: Simple interface for complex command system
- **Observer**: Reacts to file changes, updates command availability

### 3. Infrastructure Layer (`/src/infrastructure`)

**Purpose**: Implements technical capabilities, integrates with Obsidian.

**Structure**:
```
infrastructure/
├── services/
│   ├── TaskCreationService.ts        # Create tasks with inheritance
│   ├── ProjectCreationService.ts     # Create projects
│   ├── TaskStatusService.ts          # Manage effort lifecycle
│   ├── EffortVotingService.ts        # Voting system
│   ├── PropertyCleanupService.ts     # Remove empty properties
│   ├── FolderRepairService.ts        # Organize files
│   ├── RenameToUidService.ts         # Sync filenames with UIDs
│   ├── AreaHierarchyBuilder.ts       # Build area trees
│   ├── AreaCreationService.ts        # Create child areas
│   ├── SupervisionCreationService.ts # Create fleeting notes
│   ├── GraphDataService.ts           # Build graph data
│   └── LabelToAliasService.ts        # Copy labels to aliases
└── logging/
    ├── ILogger.ts                     # Logger interface
    ├── Logger.ts                      # Console logger
    └── LoggerFactory.ts               # Logger creation
```

**Service Patterns**:

Each service follows this pattern:
```typescript
export class TaskCreationService {
  constructor(
    private app: App,
    private settings: ExocortexSettings
  ) {}

  async createTask(
    parentPath: string,
    label: string
  ): Promise<void> {
    // 1. Load parent metadata
    // 2. Create task note with inherited properties
    // 3. Update vault
    // 4. Show success notice
  }
}
```

**Key Design Decisions**:
- Services are stateless (except for constructor dependencies)
- All I/O operations are async
- Services throw errors, CommandManager catches them
- Services use Obsidian API directly (no abstraction layer)

### 4. Presentation Layer (`/src/presentation`)

**Purpose**: Renders UI, handles user interaction.

**Structure**:
```
presentation/
├── components/
│   ├── ActionButtonsGroup.tsx         # Button layout manager
│   ├── AssetPropertiesTable.tsx       # Frontmatter display
│   ├── AssetRelationsTable.tsx        # Reverse links
│   ├── AreaHierarchyTree.tsx          # Collapsible tree
│   ├── DailyTasksTable.tsx            # Daily planning view
│   ├── DailyProjectsTable.tsx         # Daily projects
│   ├── GraphCanvas.tsx                # Force-directed graph
│   └── (18 button components)         # Action buttons
├── renderers/
│   └── UniversalLayoutRenderer.ts     # Main layout engine
├── modals/
│   ├── LabelInputModal.ts             # Label entry dialog
│   └── SupervisionInputModal.ts       # Supervision dialog
├── settings/
│   └── ExocortexSettingTab.ts         # Settings UI
└── utils/
    └── ReactRenderer.tsx              # React integration helper
```

**UniversalLayoutRenderer**:

Central rendering engine that orchestrates all UI sections:

```typescript
class UniversalLayoutRenderer {
  render(containerEl: HTMLElement, file: TFile): void {
    // 1. Parse frontmatter
    // 2. Determine which sections to show
    // 3. Render sections in order:
    //    - Properties table
    //    - Action buttons
    //    - Daily tasks (if pn__DailyNote)
    //    - Daily projects (if pn__DailyNote)
    //    - Area hierarchy (if ems__Area)
    //    - Asset relations
  }
}
```

**React Component Architecture**:

All UI components follow this pattern:
```typescript
interface ButtonProps {
  app: App;
  file: TFile;
  settings: ExocortexSettings;
}

export const CreateTaskButton: React.FC<ButtonProps> = ({
  app,
  file,
  settings,
}) => {
  const handleClick = async () => {
    // Execute command
  };

  return (
    <button onClick={handleClick}>
      Create Task
    </button>
  );
};
```

**Design Decisions**:
- React for UI (not native DOM manipulation)
- Components are functional (hooks, no classes)
- Props drilling (no global state management)
- Obsidian styling (no custom CSS framework)

---

## Core Services

### Service Catalog

| Service | Responsibility | Key Methods |
|---------|---------------|-------------|
| **TaskCreationService** | Create tasks/meetings with property inheritance | `createTask()`, `createInstance()` |
| **ProjectCreationService** | Create projects with area references | `createProject()` |
| **TaskStatusService** | Manage effort workflow and timestamps | `setStatus()`, `startEffort()`, `markDone()` |
| **EffortVotingService** | Increment vote counters | `voteOnEffort()` |
| **PropertyCleanupService** | Remove null/empty properties | `cleanEmptyProperties()` |
| **FolderRepairService** | Move files to correct folders | `repairFolder()` |
| **RenameToUidService** | Sync filename with UID | `renameToUid()` |
| **AreaHierarchyBuilder** | Build area tree structure | `buildAreaTree()` |
| **AreaCreationService** | Create child areas | `createChildArea()` |
| **SupervisionCreationService** | Create CBT fleeting notes | `createSupervision()` |
| **GraphDataService** | Build graph visualization data | `buildGraphData()` |
| **LabelToAliasService** | Copy label to aliases | `copyLabelToAliases()` |

### Service Interaction Example

**Creating a Task**:

```
User clicks "Create Task" button
         ↓
CreateTaskButton (React component)
         ↓
CommandManager.executeCommand("create-task")
         ↓
TaskCreationService.createTask()
         ↓
1. Load parent metadata (exo__Instance_class, ems__Effort_area)
2. Generate UUID for new task
3. Create frontmatter with inherited properties
4. Write file to vault
5. Open new file in editor
         ↓
User sees new task note
```

---

## Data Flow

### Reading Mode Layout Rendering

```
User opens note in reading mode
         ↓
Obsidian fires "layout-change" event
         ↓
ExocortexPlugin.handleLayoutChange()
         ↓
UniversalLayoutRenderer.render()
         ↓
1. Check if layout visible (settings)
2. Parse frontmatter from cache
3. Determine section visibility:
   - Properties: always show
   - Action Buttons: check command visibility
   - Daily Tasks: only if pn__DailyNote
   - Daily Projects: only if pn__DailyNote
   - Area Hierarchy: only if ems__Area
   - Asset Relations: always show
4. Render visible sections using React
         ↓
User sees dynamic layout below metadata
```

### Command Execution Flow

```
User triggers command (palette or button)
         ↓
CommandManager.executeCommand(id)
         ↓
1. Get active file
2. Check command visibility (business rules)
3. If visible:
   a. Get user input (if needed, via modal)
   b. Delegate to appropriate service
   c. Service updates vault
   d. Show success/error notice
   e. Reload layout
4. If not visible:
   - Show error notice
         ↓
Vault updated, UI refreshes
```

### Graph Visualization Data Flow

```
User opens graph view
         ↓
GraphCanvas component mounts
         ↓
GraphDataService.buildGraphData()
         ↓
1. Get all files from vault
2. Parse frontmatter
3. Build nodes (GraphNode[])
4. Build edges from:
   - exo__Asset_relates (explicit relations)
   - Body links (implicit relations)
   - Property references (ems__Effort_parent, etc.)
5. Filter archived (if setting disabled)
         ↓
GraphCanvas receives GraphData
         ↓
D3-force simulation positions nodes
         ↓
User sees interactive graph with asset labels
```

---

## Command System

### Command Registration

**24 commands organized by category:**

| Category | Commands | Visibility Logic |
|----------|----------|-----------------|
| **Creation (5)** | Create Task, Create Project, Create Instance, Create Related Task, Create Area | Based on parent asset class |
| **Status (8)** | Set Draft, Move to Backlog, Move to Analysis, Move to ToDo, Start Effort, Mark Done, Trash, Rollback | Based on current status |
| **Planning (6)** | Plan Today, Plan Evening, Shift Day ◀, Shift Day ▶, Vote, Set Active Focus | Based on asset type |
| **Maintenance (3)** | Clean Properties, Repair Folder, Rename to UID | Based on property presence |
| **System (2)** | Open Graph, Reload Layout | Always visible |

### Visibility Rules

Commands appear only when applicable to current note:

```typescript
export function canCreateTask(ctx: CommandVisibilityContext): boolean {
  const classes = ctx.frontmatter?.["exo__Instance_class"];
  return (
    classes?.includes("ems__Area") ||
    classes?.includes("ems__Project")
  );
}

export function canStartEffort(ctx: CommandVisibilityContext): boolean {
  const status = ctx.frontmatter?.["ems__Effort_status"];
  return status === "[[ems__EffortStatusToDo]]";
}
```

**Pattern**: Pure functions take context, return boolean.

### Command Context

```typescript
interface CommandVisibilityContext {
  file: TFile | null;
  frontmatter: Record<string, any> | null;
  settings: ExocortexSettings;
}
```

This context is built from:
- Obsidian metadata cache (fast)
- Current file (if any)
- Plugin settings

---

## Rendering Pipeline

### Section Rendering Order

The UniversalLayoutRenderer renders sections in this order:

1. **Properties Table** (always)
   - All frontmatter key-value pairs
   - Wiki-link resolution to labels
   - Sortable columns

2. **Action Buttons** (conditional)
   - Grouped by semantic function
   - Only visible buttons shown
   - Respects command visibility rules

3. **Daily Tasks Table** (only pn__DailyNote)
   - All tasks where ems__Effort_day matches note date
   - Optional focus filtering by area
   - Sortable by task name, status, area, parent

4. **Daily Projects Table** (only pn__DailyNote)
   - All projects scheduled for this date
   - Similar structure to tasks table

5. **Area Hierarchy Tree** (only ems__Area)
   - Interactive collapsible tree
   - Shows full parent-child hierarchy
   - Highlights current area

6. **Asset Relations Table** (always)
   - All notes referencing this note
   - Grouped by property type
   - Distinguishes property refs from body links

### React Integration

**ReactRenderer** utility handles React-Obsidian bridge:

```typescript
export function renderComponent(
  containerEl: HTMLElement,
  component: React.ReactElement
): void {
  const root = createRoot(containerEl);
  root.render(component);

  // Cleanup on unmount
  containerEl.addEventListener("unload", () => {
    root.unmount();
  });
}
```

**Key Considerations**:
- Each section gets its own React root
- Roots unmounted when layout refreshes
- No React state persists across renders
- Props provide all needed data

---

## State Management

### Plugin-Level State

**Stored in ExocortexPlugin**:
- `settings: ExocortexSettings` (persisted)
- `renderer: UniversalLayoutRenderer` (singleton)
- `commandManager: CommandManager` (singleton)
- Active file (from Obsidian workspace)

**No Redux/MobX**: Simple props drilling sufficient for this use case.

### Settings State

**ExocortexSettings**:
```typescript
interface ExocortexSettings {
  showLayout: boolean;               // Toggle entire layout
  showPropertiesSection: boolean;    // Toggle properties table
  showArchivedAssets: boolean;       // Show/hide archived
  activeFocusArea: string | null;    // Current focus area
}
```

**Persistence**: Automatically saved to `.obsidian/plugins/exocortex/data.json`.

### Component State

Components use React hooks for local UI state:

```typescript
const [isExpanded, setIsExpanded] = useState(false);
const [sortColumn, setSortColumn] = useState<string | null>(null);
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
```

**Principle**: UI state lives in components, data state in Obsidian vault.

---

## Performance Optimizations

### 1. Metadata Cache

**Problem**: Reading files from disk is slow (10-100ms per file).

**Solution**: Use Obsidian's metadata cache.

```typescript
const metadata = this.app.metadataCache.getFileCache(file);
const frontmatter = metadata?.frontmatter ?? {};
```

**Result**: 1ms per file instead of 10-100ms.

### 2. Reverse Index (Planned)

**Problem**: Finding all notes referencing current note requires O(n) vault scan.

**Solution**: Maintain reverse index of relations.

```typescript
interface ReverseIndex {
  [targetPath: string]: {
    [propertyName: string]: string[];  // [source paths]
  }
}
```

**Result**: O(1) relation lookups (1ms vs 100ms for 1000 files).

### 3. Lazy Rendering

**Problem**: Rendering all sections upfront is wasteful.

**Current**: Render only visible sections based on asset class.

**Future**: Intersection Observer for below-fold sections.

### 4. Scroll Preservation

**Problem**: Layout refresh resets scroll position.

**Solution**: Save scroll before refresh, restore after.

```typescript
const scrollY = containerEl.scrollTop;
// ... re-render ...
containerEl.scrollTop = scrollY;
```

### 5. Batch Updates

**Problem**: Multiple metadata changes trigger multiple re-renders.

**Solution**: Debounce layout refresh (300ms).

```typescript
let refreshTimeout: NodeJS.Timeout;
const debouncedRefresh = () => {
  clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(() => this.refresh(), 300);
};
```

---

## Testing Strategy

### Test Pyramid

```
       /\
      /E2E\        6 tests (Docker integration)
     /------\
    /Component\    8 tests (Playwright CT)
   /----------\
  /Unit + UI  \   269 tests (Jest)
 /--------------\
```

### Unit Tests (`/tests/unit`)

**Coverage**: Services, utility functions, visibility rules.

**Pattern**: Mock Obsidian API, test isolated logic.

```typescript
describe("EffortVotingService", () => {
  it("increments vote count", async () => {
    const mockApp = createMockApp();
    const service = new EffortVotingService(mockApp);

    await service.voteOnEffort(mockFile);

    expect(mockFile.frontmatter["ems__Effort_votes"]).toBe(1);
  });
});
```

**10 test suites, 269 tests, ~8s execution.**

### Component Tests (`/tests/component`)

**Coverage**: React components in isolation.

**Pattern**: Playwright Component Testing.

```typescript
test("CreateTaskButton renders and clicks", async ({ mount }) => {
  const component = await mount(
    <CreateTaskButton
      app={mockApp}
      file={mockFile}
      settings={mockSettings}
    />
  );

  await component.click();
  expect(mockApp.vault.create).toHaveBeenCalled();
});
```

**8 tests, ~3s execution.**

### E2E Tests (`/tests/e2e`)

**Coverage**: Full plugin in real Obsidian environment.

**Pattern**: Playwright E2E in Docker.

**Critical Requirements**:
- Run ONLY in Docker (environment parity with CI)
- Screenshots for debugging
- Retry logic for flaky tests
- Modal handling before UI assertions

```typescript
test("layout renders in reading mode", async ({ page }) => {
  await launcher.openVault();
  await launcher.waitForModalsToClose();

  const layout = await launcher.waitForElement(
    ".exocortex-buttons-section",
    60000
  );

  expect(layout).toBeVisible();
});
```

**6 tests, ~3 minutes execution.**

### BDD Coverage

**All .feature files must have corresponding automated tests (≥80% coverage).**

```bash
npm run bdd:coverage    # Show current coverage
npm run bdd:check       # CI enforcer (fails if <80%)
```

**Example**:
```gherkin
Feature: Task Creation
  Scenario: Create task from area
    Given I have an area note
    When I click "Create Task"
    Then a new task note is created
```

**Corresponding test**: `tests/e2e/task-creation.spec.ts`

---

## Development Workflow

### Multi-Instance Development

**2-5 Claude Code instances work in parallel using git worktrees.**

**Workflow**:
```bash
# Instance A:
git worktree add ../exocortex-feat-voting -b feature/voting
cd ../exocortex-feat-voting
# ... implement voting ...
gh pr create
# ... wait for CI, merge ...

# Instance B (parallel):
git worktree add ../exocortex-fix-mobile -b fix/mobile-ui
cd ../exocortex-fix-mobile
# ... fix mobile issue ...
gh pr create
# ... wait for CI, merge ...
```

**Critical Rules**:
1. **NEVER work in main directory** - always in worktree
2. Sync with main before creating worktree
3. Small, focused tasks (one feature per worktree)
4. Clean up worktree after PR merge

### CI/CD Pipeline

**GitHub Actions workflow**:

```yaml
1. build-and-test:
   - TypeScript type check
   - ESLint
   - Build plugin
   - Unit tests (Jest)
   - UI tests (jest-obsidian)
   - Component tests (Playwright CT)
   - BDD coverage check (≥80%)

2. e2e-tests:
   - Docker image build
   - Obsidian 1.9.14 in headless Electron
   - Playwright E2E tests
   - Screenshot artifacts

3. Merge (if all GREEN):
   - Rebase-only merge (linear history)
   - No squash, no merge commits

4. auto-release.yml:
   - Analyze commit messages
   - Calculate semver bump
   - Build plugin with new version
   - Generate CHANGELOG
   - Create git tag + GitHub release
```

### Quality Gates

**Required for PR merge**:
- [ ] 100% tests passing
- [ ] BDD coverage ≥80%
- [ ] TypeScript builds cleanly
- [ ] ESLint passes
- [ ] E2E tests pass in Docker
- [ ] Branch up-to-date with main

**Coverage Thresholds**:
- Global: ≥38-45%
- Domain layer: ≥78-80%
- Aspirational: 70% global / 85% domain

### Versioning Strategy

**Tag-Based Versioning**:
- package.json contains `0.0.0-dev` (placeholder)
- Real version determined from git tags during release
- auto-release.yml workflow:
  1. Gets last tag (e.g., v12.19.0)
  2. Analyzes commits (conventional commits)
  3. Determines bump type (major/minor/patch)
  4. Builds with new version (e.g., 12.19.1)
  5. Creates tag + release

**NO manual version bumps** - fully automated.

---

## Future Architecture Improvements

### Planned Enhancements

1. **Reverse Index Implementation**
   - Build index of all relations on plugin load
   - Update incrementally on file changes
   - Store in memory (or IndexedDB for large vaults)

2. **Query Language**
   - SPARQL-like queries for advanced filtering
   - Example: "All tasks in Development area with status ToDo"

3. **OWL Reasoning**
   - Infer implicit relations from ontology
   - Class hierarchy reasoning

4. **Plugin API**
   - Allow other plugins to query Exocortex data
   - Expose services as public API

5. **Offline-First Graph Store**
   - Replace in-memory graph with persistent store
   - Enable large vaults (10k+ notes)

### Technical Debt

1. **Remove Dataview Dependency Check**
   - Legacy code from early versions
   - Blocks E2E tests unnecessarily

2. **Refactor UniversalLayoutRenderer**
   - 1200+ lines, too large
   - Split into SectionRenderer classes

3. **Add Integration Tests**
   - Test multi-service workflows
   - Example: Create task → set status → plan day

4. **Improve Error Handling**
   - Structured error types
   - Better error messages for users

---

## Conclusion

The Exocortex plugin architecture prioritizes:

1. **Maintainability** - Clear separation of concerns
2. **Testability** - All layers independently testable
3. **Performance** - O(1) lookups, efficient rendering
4. **Extensibility** - Easy to add new commands/services
5. **Reliability** - Comprehensive test suite, CI/CD

**Key Takeaway**: Clean Architecture enables 2-5 developers (AI agents) to work in parallel without conflicts, delivering consistent quality at high velocity.

---

**For detailed implementation patterns, see:**
- `CLAUDE.md` - Development guidelines
- `CLAUDE-agents.md` - Agent coordination patterns
- `CLAUDE-test-patterns.md` - Test infrastructure
- `README.md` - User-facing documentation
