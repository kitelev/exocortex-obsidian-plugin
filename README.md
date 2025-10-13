# Exocortex Obsidian Plugin

**A lightweight, high-performance layout rendering system for Obsidian.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-passing-success)](https://github.com/kitelev/exocortex-obsidian-plugin/actions)

## 🎯 What is Exocortex?

Exocortex is a lightweight Obsidian plugin that displays related notes in a clean, organized table format.

### Key Features

- 📊 **Automatic Layout**: Related notes displayed in clean tables below metadata (reading mode)
- 🏷️ **Properties Display**: All frontmatter properties in organized key-value tables
- 🔗 **Smart Links**: Wiki-links automatically become clickable internal links
- ↕️ **Interactive Sorting**: Click headers to sort tables with visual indicators (▲/▼)
- 📦 **Archive Filtering**: Automatically hide archived assets from views
- ⚡ **High Performance**: O(1) relation lookups via reverse indexing
- 📱 **Mobile Compatible**: Full desktop and mobile support
- ⌨️ **Command Palette**: Quick access to all actions (Cmd/Ctrl+P)

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
2. **Relations Table** - All notes that reference this note, grouped by property
3. **Action Buttons** - Quick actions for creating tasks, managing status, etc.

**Available Commands** (Cmd/Ctrl+P → "Exocortex:"):
- Create Task from current note
- Start Effort tracking
- Mark Task as Done
- Archive Task
- Clean Empty Properties
- Repair Folder structure

### Archive Filtering

Hide completed or archived assets from your views by adding the `archived` field:

```yaml
---
archived: true  # or "yes", "true", 1
---
```

Archived assets are automatically filtered from all relation lists, keeping your views clean and focused on active work.

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

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues)
- **Releases**: [GitHub Releases](https://github.com/kitelev/exocortex-obsidian-plugin/releases)

---

**Built for the Obsidian community** 💜
