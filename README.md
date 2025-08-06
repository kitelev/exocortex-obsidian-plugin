# Exocortex Obsidian Plugin

A configurable UI system for Obsidian that transforms knowledge management through ontology-driven layouts and semantic capabilities.

## Overview

The Exocortex plugin brings a revolutionary approach to knowledge management in Obsidian by implementing a fully configurable, data-driven UI system. Based on the concept of an "exocortex" - an external extension of the brain - this plugin allows you to organize and visualize your knowledge using semantic ontologies and dynamic layouts.

## Key Features

### 🧠 Ontology-Driven Architecture
- Define custom ontologies for your knowledge domains
- Create semantic relationships between assets
- Use RDF-compatible triple structures for maximum interoperability

### 📐 Universal Layout System
- Configurable layouts for different asset types
- Dynamic blocks that adapt to your content
- Query-based content aggregation using Dataview

### 🔄 Dynamic Rendering
- Real-time updates based on asset metadata
- Automatic layout selection based on asset class
- Customizable display templates for each ontology

### 🎯 Core Capabilities
- **Universal Renderer**: Single entry point for all UI rendering
- **Layout as Asset**: Layouts are assets themselves, fully configurable
- **Composable Queries**: Build complex queries from reusable components
- **Semantic Navigation**: Navigate through knowledge using relationships

## Installation

### From GitHub Releases (Recommended)
1. Download the latest release from the [Releases](https://github.com/kitelev/exocortex-obsidian-plugin/releases) page
2. Extract the files into your vault's plugins folder: `<vault>/.obsidian/plugins/exocortex-obsidian-plugin/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

### Manual Installation
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile the plugin
4. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugins folder
5. Reload Obsidian and enable the plugin

## Usage

### Basic Setup

1. **Create an Ontology Asset**:
```yaml
---
exo__Instance_class: "[[exo__Ontology]]"
exo__Ontology_prefix: "my-ontology"
---
```

2. **Create a Class Asset**:
```yaml
---
exo__Instance_class: "[[exo__Class]]"
exo__Class_superClass: "[[exo__Asset]]"
---
```

3. **Create an Instance Asset**:
```yaml
---
exo__Asset_isDefinedBy: "[[!my-ontology]]"
exo__Instance_class: "[[MyClass]]"
exo__Asset_label: "My Asset"
---

\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
```

### Commands

- **Create ExoAsset**: Create a new asset with proper ontology metadata
- **Refresh Exocortex Layouts**: Manually refresh all dynamic layouts

### Configuration

Access plugin settings through Settings → Plugin options → Exocortex:

- **Default Ontology**: Set the default namespace for new assets
- **Enable Auto Layout**: Automatically refresh layouts periodically
- **Debug Mode**: Enable detailed console logging

## Ontology Structure

The plugin supports a three-tier ontology system:

```
├── 0 Meta/          # External standard ontologies (RDF, OWL, etc.)
├── 1 Exo/           # Base internal ontology
│   ├── Asset/       # Base assets
│   ├── Class/       # Class definitions
│   ├── Instance/    # Instance templates
│   └── Property/    # Property definitions
└── 2 Custom/        # Your domain-specific ontologies
    ├── ems/         # Effort Management System
    ├── gtd/         # Getting Things Done
    └── ...          # Your custom ontologies
```

## Advanced Features

### Custom Layouts

Create a layout for any class by creating an asset named `Layout - ClassName`:

```yaml
---
exo__Instance_class: [[ui__Layout]]
ui__Layout_targetClass: [[ems__Task]]
ui__Layout_blocks:
  - [[LayoutBlock - Task Details]]
  - [[LayoutBlock - Subtasks]]
  - [[LayoutBlock - Related Projects]]
---
```

### Layout Blocks

Define reusable UI components:

```yaml
---
exo__Instance_class: [[ui__LayoutBlock]]
ui__LayoutBlock_title: "Active Tasks"
ui__LayoutBlock_query: |
  TABLE status, due
  WHERE ems__Task_status != "completed"
  SORT due ASC
---
```

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build in development mode (with watching)
npm run dev

# Build for production
npm run build
```

### Project Structure

```
├── main.ts           # Plugin entry point
├── manifest.json     # Plugin metadata
├── styles.css        # Plugin styles
├── esbuild.config.mjs # Build configuration
└── README.md         # Documentation
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines

1. Follow TypeScript best practices
2. Maintain backward compatibility
3. Add tests for new features
4. Update documentation

## Roadmap

- [ ] Visual layout editor
- [ ] SPARQL query support
- [ ] Import/export of ontologies
- [ ] Multi-vault synchronization
- [ ] Mobile optimization
- [ ] Performance improvements for large vaults

## Support

- **Issues**: [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kitelev/exocortex-obsidian-plugin/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Inspired by the concept of exocortex and semantic web technologies
- Built on top of the excellent Obsidian API
- Thanks to the Obsidian community for feedback and support

## Related Projects

- [Obsidian Dataview](https://github.com/blacksmithgu/obsidian-dataview) - Query engine used for dynamic content
- [Semantic Web](https://www.w3.org/standards/semanticweb/) - Standards for ontology representation

---

Made with ❤️ for the Obsidian community