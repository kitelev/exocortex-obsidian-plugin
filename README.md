# Exocortex Obsidian Plugin

**A lightweight, high-performance layout rendering system for Obsidian.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-passing-success)](https://github.com/kitelev/exocortex-obsidian-plugin/actions)
[![Coverage](https://img.shields.io/badge/coverage-49%25-orange)](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml)

## 🎯 What is Exocortex?

Exocortex is a lightweight Obsidian plugin that displays related notes in a clean, organized table format.

### Key Features

- 📊 **Automatic Layout**: Related notes displayed in clean tables below metadata (reading mode)
- 🌳 **Area Hierarchy Tree**: Visual navigation of area parent-child relationships via `ems__Area_parent` property
- 🏷️ **Properties Display**: All frontmatter properties in organized key-value tables
- 🔗 **Smart Links**: Wiki-links automatically become clickable internal links
- ↕️ **Interactive Sorting**: Click headers to sort tables with visual indicators (▲/▼)
- 📦 **Archive Filtering**: Automatically hide archived assets from views
- ⚡ **High Performance**: O(1) relation lookups via reverse indexing
- 📱 **Mobile Compatible**: Full desktop and mobile support
- ⌨️ **Command Palette**: Quick access to all actions (Cmd/Ctrl+P)
- 🗳️ **Effort Voting**: Vote on tasks/projects to prioritize work (increments `ems__Effort_votes`)

## 🏃‍♂️ Quick Start

### Installation

**Manual Installation**:
```bash
cd /your/vault/.obsidian/plugins
git clone https://github.com/kitelev/exocortex-obsidian-plugin
cd exocortex-obsidian-plugin
npm install && npm run build
```

Enable the plugin in Obsidian settings.

### Basic Usage

The plugin automatically displays related assets below metadata in all notes (reading mode only).

**What you'll see:**
1. **Properties Table** - All frontmatter properties in key-value format
2. **Area Tree** - For ems__Area assets: Hierarchical tree showing parent-child relationships
3. **Relations Table** - All notes that reference this note, grouped by property
4. **Action Buttons** - Quick actions for creating tasks, managing status, etc.

**Available Commands** (Cmd/Ctrl+P → "Exocortex:"):
- Create Task from current note
- Create Area (creates child area)
- Start Effort tracking
- Mark Task as Done
- Archive Task
- Vote on Effort (increments vote count for tasks/projects)
- Clean Empty Properties
- Repair Folder structure

**Effort Voting:**

Prioritize tasks and projects through community voting. Each vote increments the `ems__Effort_votes` property:

- **Via Command Palette**: Cmd/Ctrl+P → "Exocortex: Vote on Effort"
- **Via Layout Button**: Click "Vote" button on eligible tasks/projects
- Vote count displays on button: "Vote (5)" shows 5 votes
- Property auto-created if missing (starts at 1 on first vote)

### Archive Filtering

Hide completed or archived assets from your views by adding the `archived` field:

```yaml
---
archived: true  # or "yes", "true", 1
---
```

Archived assets are automatically filtered from all relation lists, keeping your views clean and focused on active work.

### Area Hierarchy Tree

For `ems__Area` assets, the plugin automatically displays a hierarchical tree visualization of parent-child relationships defined through the `ems__Area_parent` property. The tree appears above the Relations section.

**Features:**
- **Collapsible/Expandable**: Click ▶/▼ to toggle child areas
- **Current Area Highlighting**: The current area is highlighted with an accent color
- **Archived Area Styling**: Archived areas shown with reduced opacity
- **Clickable Navigation**: Click any area to navigate to it
- **Keyboard Support**: Use Arrow keys and Enter to navigate the tree
- **Automatic Root Detection**: Always starts from the top-level parent area

**Example `ems__Area_parent` usage:**
```yaml
---
exo__Instance_class: ems__Area
exo__Asset_label: Development
ems__Area_parent: "[[Projects]]"  # Links to parent area
---
```

The tree will automatically build the complete hierarchy from all related areas, displaying the structure from root to leaves with proper indentation and visual indicators.

## 🏗️ Architecture

Clean Architecture with domain-driven design:

```
┌─────────── Presentation ────────────┐
│  React Components                   │
│  Layout Renderer                    │
└─────────────────────────────────────┘
         ↓
┌─────────── Application ─────────────┐
│  Services & Use Cases               │
└─────────────────────────────────────┘
         ↓
┌─────────── Domain ──────────────────┐
│  Entities, Value Objects            │
└─────────────────────────────────────┘
```

**Tech Stack**: TypeScript, React, Obsidian API

## 🚀 Performance

Built for speed and efficiency:

- **Reverse Index**: O(1) relation lookups instead of O(n) iteration
- **Smart Caching**: Intelligent cache invalidation on metadata changes
- **Memory Management**: Proper event listener cleanup prevents leaks
- **Race-Free**: Promise-based locking prevents cache race conditions

## 📊 Quality & Testing

### Quality Gates (Enforced in CI)

All pull requests must pass these automated quality gates:

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

### Running Tests

```bash
# All tests
npm test

# Individual test suites
npm run test:unit       # Unit tests
npm run test:ui         # UI integration tests
npm run test:component  # Component tests

# Build verification
npm run build
```

## 📚 Documentation

- **[CHANGELOG.md](./CHANGELOG.md)** - Complete version history
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines for AI assistants
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

---

**Built for the Obsidian community** 💜
