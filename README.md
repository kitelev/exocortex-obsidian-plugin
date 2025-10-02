# Exocortex Obsidian Plugin

**A lightweight, high-performance layout rendering system for Obsidian.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## 🎯 What is Exocortex?

Exocortex is a streamlined Obsidian plugin that provides flexible layout rendering for your notes. It focuses on two core features: **UniversalLayout** and **DynamicLayout**, making it easy to display related notes and custom content blocks.

### Key Features

- 📋 **UniversalLayout**: Display all related assets with grouping and sorting options
- 🎛️ **DynamicLayout**: Configure specific relations based on class layouts
- 🚀 **High Performance**: Optimized relation discovery with reverse indexing (O(1) lookups)
- 📱 **Mobile Compatible**: Works seamlessly on desktop and mobile
- 🎨 **Flexible Configuration**: Customize layouts through frontmatter properties

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

Or use DynamicLayout for custom configurations:

````markdown
```exocortex
DynamicLayout
```
````

## 🏗️ Architecture

Exocortex follows Clean Architecture principles:

```
┌─── Presentation Layer ────────────────────────────┐
│  • UniversalLayoutRenderer                        │
│  • DynamicLayoutRenderer                          │
│  • BaseAssetRelationsRenderer                     │
└───────────────────────────────────────────────────┘
┌─── Domain Layer ──────────────────────────────────┐
│  • Asset Entities   • Value Objects               │
│  • Result Pattern   • Domain Events               │
└───────────────────────────────────────────────────┘
┌─── Infrastructure Layer ──────────────────────────┐
│  • Obsidian API     • Logging                     │
│  • Performance Optimization                       │
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

# Run with coverage
npm run test:coverage

# Build verification
npm run build
```

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
