# Exocortex Obsidian Plugin

**A comprehensive task management and knowledge graph system for Obsidian with automatic layout rendering, hierarchical organization, and effort tracking.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-passing-success)](https://github.com/kitelev/exocortex-obsidian-plugin/actions)
[![Coverage](https://img.shields.io/badge/coverage-49%25-orange)](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml)

## 🎯 What is Exocortex?

Exocortex is a powerful Obsidian plugin that transforms your notes into an interconnected task management and knowledge organization system. It automatically displays related notes, tracks effort across projects, manages task workflows with status transitions, and visualizes hierarchical relationships - all within your existing notes in reading mode.

### Key Features

- 📊 **Automatic Layout Rendering**: Context-aware sections displayed below metadata in reading mode
- 🕸️ **Graph View**: Interactive force-directed graph showing all notes with `exo__Asset_label` instead of UID filenames
- 🎯 **Daily Task Planning**: Aggregate all tasks scheduled for specific days with active focus filtering
- 🌳 **Area Hierarchy Visualization**: Interactive collapsible tree showing organizational structure
- 🔄 **Effort Status Workflow**: Complete lifecycle from Draft → Backlog → Analysis → ToDo → Doing → Done
- ⏱️ **Automatic Time Tracking**: Timestamps recorded when efforts start and complete
- 🗳️ **Effort Voting System**: Collaborative prioritization through vote counts
- 🏷️ **Smart Properties Display**: All frontmatter in organized tables with wiki-link resolution
- 🔗 **Bidirectional Relations**: See all notes referencing current note, grouped by property
- ↕️ **Interactive Sorting**: Click table headers to sort with visual indicators (▲/▼)
- 📦 **Archive Filtering**: Toggle visibility of completed/archived assets
- ⚡ **High Performance**: O(1) relation lookups via reverse indexing
- 📱 **Mobile Compatible**: Full touch-optimized UI for desktop and mobile
- ⌨️ **24 Commands**: Comprehensive command palette integration for all operations
- 🎨 **Action Buttons**: Context-aware UI buttons for quick access to relevant commands

## 🏃‍♂️ Quick Start

### Installation

**Manual Installation**:
```bash
cd /your/vault/.obsidian/plugins
git clone https://github.com/kitelev/exocortex-obsidian-plugin
cd exocortex-obsidian-plugin
npm install && npm run build
```

Enable the plugin in Obsidian Settings → Community plugins → Exocortex.

### Basic Usage

The plugin automatically renders a dynamic layout below the metadata section in reading mode. The layout is context-aware and shows different sections based on the current note's class type and properties.

**Layout Sections** (rendered in order):

1. **Properties Table** - All frontmatter properties with wiki-link resolution
2. **Action Buttons** - Context-aware buttons grouped by function (Creation, Status, Planning, Maintenance)
3. **Daily Tasks** (pn__DailyNote only) - All tasks scheduled for this date with optional focus filtering
4. **Daily Projects** (pn__DailyNote only) - All projects scheduled for this date
5. **Area Hierarchy Tree** (ems__Area only) - Interactive tree of parent-child area relationships
6. **Asset Relations** - All notes referencing this note, grouped by property

### Example Workflow: Managing a Project

1. **Create an Area** for the project domain:
```yaml
---
exo__Instance_class: ems__Area
exo__Asset_label: Development
---
```

2. **Create a Project** within the area:
```yaml
---
exo__Instance_class: ems__Project
exo__Asset_label: Build New Feature
ems__Effort_area: "[[Development]]"
ems__Effort_status: "[[ems__EffortStatusBacklog]]"
---
```

3. **Create Tasks** under the project using the "Create Task" button
4. **Vote on efforts** to prioritize work: Click "Vote" button or use Command Palette
5. **Plan tasks** for specific days: Click "Plan on Today" or shift days with ◀/▶ buttons
6. **Execute workflow**: Move through statuses (Backlog → Analysis → ToDo → Doing → Done)
7. **View daily plan**: Open today's daily note to see all scheduled tasks with area context

## 📋 Available Commands

All commands accessible via Command Palette (Cmd/Ctrl+P → "Exocortex:"). Commands are context-aware and only appear when applicable to the current note.

### Creation Commands (5)

| Command | Available When | Creates | Inherited Properties |
|---------|---------------|---------|---------------------|
| **Create Task** | ems__Area, ems__Project | ems__Task | Parent reference, area, prototype |
| **Create Project** | ems__Area, ems__Initiative, ems__Project | ems__Project | Area, initiative reference |
| **Create Instance** | ems__TaskPrototype, ems__MeetingPrototype | ems__Task or ems__Meeting | Prototype template content |
| **Create Related Task** | ems__Project | ems__Task with project parent | Parent project, area |
| **Create Area** | ems__Area | Child ems__Area | Parent area reference |

### Status Transition Commands (8)

Complete workflow lifecycle with automatic timestamp tracking:

| Command | Available When | Transition | Timestamps Updated |
|---------|---------------|-----------|-------------------|
| **Set Draft Status** | Efforts with no status | → Draft | - |
| **Move to Backlog** | Draft status | Draft → Backlog | - |
| **Move to Analysis** | ems__Project with Backlog | Backlog → Analysis | - |
| **Move to ToDo** | Analysis status | Analysis → ToDo | - |
| **Start Effort** | ToDo status | ToDo → Doing | ems__Effort_startTimestamp |
| **Mark as Done** | Doing status | Doing → Done | ems__Effort_endTimestamp, ems__Effort_resolutionTimestamp |
| **Trash** | Any effort | Any → Trashed | ems__Effort_endTimestamp |
| **Rollback Status** | Done/Trashed efforts | → Previous status | Removes end timestamps |

### Planning Commands (6)

Schedule and prioritize efforts:

| Command | Available When | Action | Property Modified |
|---------|---------------|--------|-------------------|
| **Plan on Today** | Any active effort | Set effort for today | ems__Effort_day |
| **Plan for Evening** | Task/Meeting with Backlog | Schedule for 19:00 | ems__Effort_plannedStartTimestamp |
| **Shift Day ◀** | Efforts with day set | Move to previous day | ems__Effort_day |
| **Shift Day ▶** | Efforts with day set | Move to next day | ems__Effort_day |
| **Vote on Effort** | Task/Project (not archived) | Increment vote counter | ems__Effort_votes |
| **Set/Clear Active Focus** | ems__Area | Focus daily tasks on area | Plugin settings |

### Maintenance Commands (3)

Keep your vault organized:

| Command | Available When | Action |
|---------|---------------|--------|
| **Clean Empty Properties** | Any asset | Remove null/empty frontmatter properties |
| **Repair Folder** | Assets with exo__Asset_isDefinedBy | Move file to correct folder based on reference |
| **Rename to UID** | Filename ≠ exo__Asset_uid | Rename file to match UID, preserve label |

### System Commands (5)

Control plugin behavior and visualization:

| Command | Always Available | Action |
|---------|-----------------|--------|
| **Open Exocortex Graph** | Yes | Visualize vault as interactive force-directed graph with asset labels |
| **Reload Layout** | Yes | Manually refresh layout rendering |
| **Add Supervision** | Yes | Create CBT-format fleeting note in 01 Inbox |
| **Toggle Layout Visibility** | Yes | Show/hide entire layout section |
| **Toggle Properties Visibility** | Yes | Show/hide properties table |

## 🏷️ Frontmatter Properties Reference

### Asset Core Properties (exo__Asset_*)

Foundation properties for all assets:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `exo__Instance_class` | Wiki-link(s) | Yes | Asset class type(s): ems__Task, ems__Project, ems__Area, etc. |
| `exo__Asset_uid` | UUID string | Recommended | Unique identifier, used for filename consistency |
| `exo__Asset_label` | String | Recommended | Human-readable display name |
| `exo__Asset_isDefinedBy` | Wiki-link | Optional | Reference to area/container for folder organization |
| `exo__Asset_relates` | List of wiki-links | Optional | Related assets for cross-referencing |
| `exo__Asset_isArchived` | Boolean | Optional | Mark asset as archived (alternative to `archived`) |

### Effort Tracking Properties (ems__Effort_*)

Complete lifecycle tracking for tasks and projects:

| Property | Type | Set By | Description |
|----------|------|--------|-------------|
| `ems__Effort_status` | Wiki-link enum | Status commands | Current workflow status (see Status Values below) |
| `ems__Effort_day` | Wiki-link date | Planning commands | Scheduled day: [[YYYY-MM-DD]] |
| `ems__Effort_startTimestamp` | ISO 8601 | "Start Effort" command | When effort moved to Doing status |
| `ems__Effort_endTimestamp` | ISO 8601 | "Mark Done"/"Trash" | When effort completed/cancelled |
| `ems__Effort_resolutionTimestamp` | ISO 8601 | Auto-synced | Copy of endTimestamp for tracking |
| `ems__Effort_plannedStartTimestamp` | ISO 8601 | "Plan Evening" command | Evening planning timestamp (19:00) |
| `ems__Effort_votes` | Integer | "Vote on Effort" command | Vote counter for prioritization |
| `ems__Effort_parent` | Wiki-link | Task creation | Parent project/effort reference |
| `ems__Effort_area` | Wiki-link | Task creation | Organizational area reference |
| `ems__Effort_prototype` | Wiki-link | Instance creation | Template prototype reference |

**Status Values** (ems__EffortStatus* enum):

- `[[ems__EffortStatusDraft]]` - Initial status, no planning
- `[[ems__EffortStatusBacklog]]` - Ready for analysis/planning
- `[[ems__EffortStatusAnalysis]]` - Under analysis (projects only)
- `[[ems__EffortStatusToDo]]` - Ready to start
- `[[ems__EffortStatusDoing]]` - Currently in progress (startTimestamp recorded)
- `[[ems__EffortStatusDone]]` - Completed successfully (endTimestamp recorded)
- `[[ems__EffortStatusTrashed]]` - Discarded/cancelled (endTimestamp recorded)

### Organizational Properties

| Property | Type | Used For | Description |
|----------|------|----------|-------------|
| `ems__Area_parent` | Wiki-link | ems__Area | Parent area for hierarchy tree visualization |
| `pn__DailyNote_day` | Wiki-link date | pn__DailyNote | Daily note date link: [[YYYY-MM-DD]] |

### Archive Property

| Property | Type | Values | Description |
|----------|------|--------|-------------|
| `archived` | Boolean/String | `true`, `"yes"`, `1` | Standard YAML archive flag (alternative to exo__Asset_isArchived) |

## 📊 Layout Sections

### Properties Table

Displays all frontmatter properties in a clean key-value format.

**Features:**
- Wiki-links automatically resolved to display labels
- Clickable internal links for navigation
- Supports alias display: `[[target|alias]]`
- Toggle visibility via settings or "Toggle Properties Visibility" command

**Example:**
```
Key                      | Value
-------------------------|-----------------
exo__Instance_class      | ems__Task
exo__Asset_label         | Implement feature
ems__Effort_status       | ems__EffortStatusDoing
ems__Effort_day          | 2025-10-23
ems__Effort_votes        | 5
```

### Action Buttons

Context-aware buttons grouped by semantic function, displayed above other sections.

**Button Groups:**

1. **Creation** - Create Task, Create Project, Create Instance, Create Area
2. **Status** - Set Draft, Move to Backlog, Move to Analysis, Move to ToDo, Start Effort, Mark Done, Trash, Rollback Status
3. **Planning** - Plan on Today, Plan Evening, Shift Day ◀, Shift Day ▶, Vote on Effort, Set Active Focus
4. **Maintenance** - Clean Properties, Repair Folder, Rename to UID

Buttons only appear when applicable to the current note's class and state.

### Daily Tasks Table

Visible **only** on notes with `exo__Instance_class: pn__DailyNote`.

Aggregates all tasks where `ems__Effort_day` matches the daily note's date.

**Columns:**
- Task Name (clickable)
- Status (with visual indicators)
- Effort Area
- Effort Parent (project/initiative)

**Active Focus Feature:**
When an area is set as "Active Focus" using the "Set Active Focus" button:
- Daily tasks filtered to show only tasks from that area
- Indicator displays: "🎯 Active Focus: [Area Name]"
- Click "Clear Active Focus" to remove filter

**Example:**
```
🎯 Active Focus: Development

Task Name              | Status      | Area        | Parent
-----------------------|-------------|-------------|-------------
Implement API          | Doing       | Development | Backend Project
Write tests            | ToDo        | Development | Backend Project
```

### Daily Projects Table

Visible **only** on notes with `exo__Instance_class: pn__DailyNote`.

Shows all projects scheduled for the daily note's date (via `ems__Effort_day`).

Similar structure to Daily Tasks table with project-specific columns.

### Area Hierarchy Tree

Visible **only** on notes with `exo__Instance_class: ems__Area`.

Interactive tree visualization of area parent-child relationships defined through `ems__Area_parent` property.

**Features:**
- **Collapsible/Expandable**: Click ▶/▼ icons to toggle child areas
- **Current Area Highlighting**: Current area shown with accent color background
- **Archived Area Styling**: Archived areas displayed with reduced opacity
- **Clickable Navigation**: Click any area name to navigate to that note
- **Keyboard Support**: Arrow keys to navigate, Enter to open
- **Automatic Root Detection**: Tree always starts from top-level parent area
- **Full Depth Display**: Shows complete hierarchy regardless of depth

**Example hierarchy:**
```
▼ Projects (root)
  ▼ Development
    ▶ Frontend
    ▼ Backend
      → API Development (current)
      → Database Design
  ▶ Research
  ▶ Documentation
```

**Setup:**
```yaml
---
exo__Instance_class: ems__Area
exo__Asset_label: API Development
ems__Area_parent: "[[Backend]]"
---
```

The tree automatically builds the complete hierarchy from all areas in the vault, traversing parent references to find the root.

### Asset Relations Table

Shows all notes that reference the current note through properties or body links.

**Columns:**
- Name (clickable)
- Instance Class
- Grouped properties (shows property values that reference this note)

**Features:**
- **Grouped by Property**: Relations organized by which property references this note (ems__Effort_parent, ems__Effort_area, etc.)
- **Body Link Detection**: Distinguishes between property references and body content links
- **Sortable Columns**: Click headers to sort with ▲/▼ indicators
- **Archive Filtering**: Toggle archived asset visibility via settings
- **Performance**: O(1) lookups via reverse index cache

**Example:**
For a Project note, relations might show:
- Tasks where `ems__Effort_parent` links to this project
- Areas where this project is mentioned in body content
- Other projects with cross-references

## ⚙️ Plugin Settings

Access via Settings → Exocortex.

| Setting | Default | Description |
|---------|---------|-------------|
| **Show Layout** | On | Display automatic layout sections in reading mode |
| **Show Properties Section** | On | Include properties table in layout |
| **Show Archived Assets** | Off | Display archived assets in relations table with reduced opacity |

Additional internal settings:
- **Active Focus Area**: Current focus area for daily tasks filtering (set via "Set Active Focus" button)

## 🗂️ Asset Class Types

Understanding the class hierarchy:

| Class | Purpose | Common Properties |
|-------|---------|------------------|
| **ems__Area** | Organizational container | ems__Area_parent |
| **ems__Project** | Project effort | ems__Effort_status, ems__Effort_area, ems__Effort_votes |
| **ems__Task** | Task effort | ems__Effort_status, ems__Effort_parent, ems__Effort_day |
| **ems__Meeting** | Meeting effort | ems__Effort_status, ems__Effort_plannedStartTimestamp |
| **ems__Initiative** | High-level initiative | Similar to Project |
| **ems__TaskPrototype** | Task template | Used for instance creation |
| **ems__MeetingPrototype** | Meeting template | Used for instance creation |
| **pn__DailyNote** | Daily planning note | pn__DailyNote_day |
| **ztlk__FleetingNote** | Supervision/fleeting note | Created in 01 Inbox |

## 🔄 Archive Filtering

Hide completed or archived assets to keep views focused on active work.

**Two methods:**

1. **Standard YAML:**
```yaml
---
archived: true  # or "yes", "true", 1
---
```

2. **Exocortex property:**
```yaml
---
exo__Asset_isArchived: true
---
```

**Behavior:**
- Archived assets filtered from relations table by default
- Toggle visibility: Settings → "Show Archived Assets" or Command Palette
- When visible, archived assets shown with reduced opacity
- Archive status considered in command visibility logic

### Graph View

Interactive force-directed graph visualization of your entire vault. Displays human-readable labels (`exo__Asset_label`) instead of UID filenames, solving the problem of unreadable UUIDs in Obsidian's native graph.

**Features:**
- **Label Resolution**: Automatically uses `exo__Asset_label` for node labels, falling back to filename if not set
- **Prototype Inheritance**: For effort instances, resolves label from `ems__Effort_prototype` if needed
- **Interactive Navigation**: Click any node to open the corresponding note
- **Type Filtering**: Filter nodes by `exo__Asset_class` (Area, Effort, Project, etc.)
- **Archive Toggle**: Show/hide archived assets with single checkbox
- **Force-Directed Layout**: D3-force simulation for optimal node positioning
- **Zoom & Pan**: Navigate large graphs with mouse wheel zoom and drag panning
- **Color Coding**: Different colors for different asset types

**How to open:**
- **Ribbon Icon**: Click the graph icon (git-fork) in the left sidebar
- **Command Palette**: Cmd/Ctrl+P → "Open Exocortex Graph"

**Graph View solves the UID problem:**
```yaml
# Before: Obsidian Graph shows filename
File: 550e8400-e29b-41d4-a716-446655440000.md
Graph: [unreadable UID]

# After: Exocortex Graph shows label
File: 550e8400-e29b-41d4-a716-446655440000.md
---
exo__Asset_label: "My Important Project"
---
Graph: [My Important Project]  ✅ Readable!
```

## 🏗️ Architecture

Clean Architecture with domain-driven design:

```
┌─────────── Presentation ────────────┐
│  React Components (24 UI buttons)   │
│  Layout Renderer (6 sections)       │
│  Tables, Trees, Interactive UI      │
└─────────────────────────────────────┘
         ↓
┌─────────── Application ─────────────┐
│  Services (9 specialized services)  │
│  Use Cases & Business Logic         │
│  Command Manager (23 commands)      │
└─────────────────────────────────────┘
         ↓
┌─────────── Domain ──────────────────┐
│  Entities, Value Objects            │
│  Repository Interfaces              │
│  Business Rules                     │
└─────────────────────────────────────┘
         ↓
┌─────────── Infrastructure ──────────┐
│  Obsidian API Integration           │
│  File System Operations             │
│  Metadata Cache Management          │
└─────────────────────────────────────┘
```

**Key Services:**

| Service | Purpose |
|---------|---------|
| TaskCreationService | Create Task/Meeting assets with inheritance |
| ProjectCreationService | Create Project assets |
| TaskStatusService | Manage effort lifecycle and timestamps |
| EffortVotingService | Handle voting system |
| PropertyCleanupService | Remove empty properties |
| FolderRepairService | Organize files by folder structure |
| RenameToUidService | Synchronize filenames with UIDs |
| AreaHierarchyBuilder | Build area tree structure |
| SupervisionCreationService | Create CBT-format fleeting notes |

**Tech Stack**: TypeScript 4.9+, React 19.2.0, Obsidian API 1.5.0+, ESBuild

## 🚀 Performance

Optimized for large vaults with thousands of notes:

- **Reverse Index**: O(1) relation lookups instead of O(n) vault iteration
- **Smart Caching**: Intelligent cache invalidation on metadata changes only
- **Memory Management**: Proper event listener cleanup prevents memory leaks
- **Race-Free**: Promise-based locking prevents cache race conditions
- **Scroll Preservation**: Maintains scroll position during layout refreshes
- **Lazy Rendering**: Components render only when visible

**Benchmarks:**
- Relation lookup: <1ms for 10,000 notes
- Full layout render: <50ms typical
- Cache invalidation: <10ms on metadata change

## 📊 Quality & Testing

### Quality Gates (Enforced in CI)

All pull requests must pass automated quality gates:

**Code Coverage Thresholds:**
- ✅ Global coverage: ≥38-45% (branches: 38%, functions: 42%, lines: 45%, statements: 44%)
- ✅ Domain layer: ≥78-80% (higher standards for business logic)
- 🎯 Aspirational targets: 70% global / 85% domain

**Test Requirements:**
- ✅ 100% tests passing (unit + component + E2E)
- ✅ BDD scenario coverage ≥80%
- ✅ Type safety (TypeScript strict mode)
- ✅ Linting (ESLint)
- ✅ Build success

**Coverage Reports:**
- Automatically generated on every CI run
- Available as artifacts in GitHub Actions
- Includes lcov, HTML, and text-summary formats

### Test Suite

- **Unit Tests**: 10 suites, 269 tests (jest + ts-jest)
- **Component Tests**: 8 Playwright CT tests
- **E2E Tests**: 6 Docker-based integration tests
- **Total Execution**: ~8 seconds (unit) + ~3 minutes (E2E)

## 🛠️ Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/kitelev/exocortex-obsidian-plugin
cd exocortex-obsidian-plugin

# Install dependencies
npm install

# Build plugin
npm run build

# Start development mode (watch mode)
npm run dev
```

### Development Standards

- **TypeScript**: Strict mode with comprehensive type safety
- **Performance First**: Memory-conscious development
- **Testing**: BDD with jest-cucumber + Playwright Component Testing
- **Clean Architecture**: Domain-driven design with SOLID principles

### Running Tests

```bash
# All tests (required before PR)
npm run test:all

# Individual test suites
npm run test:unit       # Unit tests (jest)
npm run test:ui         # UI integration tests
npm run test:component  # Component tests (Playwright)
npm run test:e2e:local  # E2E tests (Docker required)

# Coverage reports
npm run test:coverage

# BDD coverage check
npm run bdd:coverage
npm run bdd:check       # Enforced in CI (≥80%)

# Build verification
npm run build
```

## 📚 Documentation

- **[CHANGELOG.md](./CHANGELOG.md)** - Complete version history with semantic versioning
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines for AI assistants
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and patterns
- **[specs/features/](./specs/features/)** - BDD feature specifications

## ⚠️ Known Issues

### Command/Ctrl+Click Link Behavior (v12.9.10)

**Status**: Partially Working

**What works:**
- ✅ No duplicate tabs created (fixed in v12.9.10)
- ✅ Links are clickable
- ✅ Regular clicks open in current tab

**What doesn't work:**
- ❌ Command/Ctrl+Click doesn't open in new tab (opens in current tab instead)

**Root cause:**
- Obsidian's internal link handler intercepts clicks on elements with `internal-link` class
- Added `e.stopPropagation()` which fixed the duplicate tab issue
- However, Obsidian's modifier key detection still doesn't reach our handler
- Debug logging shows our onClick handlers are not being called at all

**Workaround:**
- Use standard Obsidian link opening: Right-click → "Open in new tab"
- Or use Middle-click (mouse wheel button) to open in new tab

**Future fix:**
- May need to completely remove `internal-link` class and implement custom link styling
- Or register our own Obsidian link handler instead of React onClick
- Issue tracked for future investigation

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues)
- **Releases**: [GitHub Releases](https://github.com/kitelev/exocortex-obsidian-plugin/releases)
- **Documentation**: This README and linked documentation files

---

**Built for the Obsidian community** 💜
