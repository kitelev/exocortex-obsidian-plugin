# Exocortex Obsidian Plugin

**A lightweight, high-performance layout rendering system for Obsidian.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/kitelev/exocortex-obsidian-plugin/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-14%20passing-success)](./specs/TEST-RESULTS.md)

## 🎯 What is Exocortex?

Exocortex is a lightweight Obsidian plugin that displays related notes in a clean, organized table format.

### Key Features

- 📋 **Simple Layout**: Display all related assets with grouping and sorting
- ⚡ **AutoLayout**: Optional automatic display below metadata (no code blocks needed)
- 📝 **ManualLayout**: Code-block insertion for precise placement control
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

**ManualLayout (always available)**

Add a code block to any note for manual placement:

````markdown
```exocortex
```
````

**AutoLayout (optional setting)**

Enable "AutoLayout" in plugin settings to automatically display the relations table below metadata in all notes (reading mode only). No code blocks needed!

Go to: Settings → Exocortex → Enable AutoLayout

### Archive Filtering

Hide completed or archived assets from your views by adding the `archived` field:

```yaml
---
archived: true  # or "yes", "true", 1
---
```

Archived assets are automatically filtered from all relation lists, keeping your views clean and focused on active work.

## 🏗️ Architecture

Simple and focused architecture:

```
┌─── Layout Renderer ───────────────────────────────┐
│  • UniversalLayoutRenderer (single renderer)      │
└───────────────────────────────────────────────────┘
```

Built with TypeScript and React for optimal performance.

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
# Unit tests (30 tests)
npm run test:unit

# BDD tests (30 tests)
npm run test:bdd

# Component tests (31 tests)
npm run test:component

# Build verification
npm run build
```

**Total: 91 tests** covering layout rendering, sorting, and UI components.

## 📚 Documentation

- **[docs/testing/](./docs/)** - Testing guides and best practices
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant development guidelines

## 🌟 Recent Improvements (v11.4.0)

- **Component Testing**: 31 tests with Playwright Component Testing
- **CI/CD Optimization**: 61% faster pipeline (2m 54s → 1m 7s)
- **Test Coverage**: 91 tests total (30 unit + 30 BDD + 31 component)
- **Archive Filtering**: Automatic filtering of archived assets

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues)
- **Releases**: [GitHub Releases](https://github.com/kitelev/exocortex-obsidian-plugin/releases)

---

**Built for the Obsidian community** 💜
