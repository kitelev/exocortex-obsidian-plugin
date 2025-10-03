# Exocortex Obsidian Plugin

**A lightweight, high-performance layout rendering system for Obsidian.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-30%20passing-success)](./specs/TEST-RESULTS.md)

## 🎯 What is Exocortex?

Exocortex is a simplified Obsidian plugin that provides layout rendering for your notes. Both **UniversalLayout** and **DynamicLayout** work identically, displaying related notes in a clean, organized format.

### Key Features

- 📋 **UniversalLayout/DynamicLayout**: Display all related assets with grouping and sorting
- 🚀 **High Performance**: Optimized relation discovery with reverse indexing (O(1) lookups)
- 📱 **Mobile Compatible**: Works seamlessly on desktop and mobile
- 🔗 **Clickable Links**: Instance Class displayed as internal links for quick navigation
- ↕️ **Interactive Sorting**: Sort tables with visual indicators (▲/▼)
- 📦 **Archive Filtering**: Automatically hide archived assets from views

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

Add a code block to any note:

````markdown
```exocortex
UniversalLayout
```
````

Or use DynamicLayout (works identically):

````markdown
```exocortex
DynamicLayout
```
````

### Archive Filtering

Hide completed or archived assets from your views by adding the `archived` field:

```yaml
---
archived: true  # or "yes", "true", 1
---
```

Archived assets are automatically filtered from all relation lists, keeping your views clean and focused on active work.

## 🏗️ Architecture

Simple and efficient architecture:

```
┌─── Presentation Layer ────────────────────────────┐
│  • UniversalLayoutRenderer                        │
│  • DynamicLayoutRenderer (extends Universal)      │
└───────────────────────────────────────────────────┘
┌─── Infrastructure Layer ──────────────────────────┐
│  • Logging                                        │
└───────────────────────────────────────────────────┘
```

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
- **Clean Architecture**: Domain-driven design patterns
- **SOLID Principles**: Single Responsibility, Open-Closed, etc.
- **Performance First**: Memory-conscious development

### Running Tests

```bash
# Run unit tests
npm test

# Run BDD tests (jest-cucumber)
npm run test:cucumber

# Run with coverage
npm run test:coverage

# Build verification
npm run build
```

### WebStorm IDE Integration

Full Cucumber support for executable .feature files:

- ✅ **No yellow underlines** on step definitions
- ✅ **Go-to-definition** (Ctrl+Click) works
- ✅ **Autocomplete** for Gherkin steps
- ✅ **Run from IDE** - Right-click → Run scenario

See [WebStorm Setup Guide](./docs/WEBSTORM-CUCUMBER-SETUP.md) for configuration instructions.

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - AI assistant development guidelines
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes

## 🌟 Recent Improvements (v11.1.0)

- **10x Faster Relation Discovery**: Reverse index optimization
- **Better Responsiveness**: Fixed cache race conditions
- **Cleaner Architecture**: Moved logging to domain layer
- **Memory Leak Prevention**: Proper event listener cleanup

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues)
- **Releases**: [GitHub Releases](https://github.com/kitelev/exocortex-obsidian-plugin/releases)

---

**Built for the Obsidian community** 💜
test cache
