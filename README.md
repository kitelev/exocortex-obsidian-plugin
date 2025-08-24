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
- Query-based content aggregation using multiple query engines

### 🔄 Dynamic Rendering

- Real-time updates based on asset metadata
- Automatic layout selection based on asset class
- Customizable display templates for each ontology

### 📱 Mobile/iOS Support

- **Touch-Optimized UI**: Native iOS gestures and haptic feedback
- **Performance Optimization**: Intelligent mobile performance management
- **Native Query Engine**: Lightweight querying without external dependencies
- **Offline-First**: Works seamlessly without internet connectivity

### 🔧 Multi-Engine Query Support

- **Dataview Integration**: Full backward compatibility with existing Dataview queries
- **Datacore Support**: Native support for the new Datacore plugin
- **Automatic Fallback**: Intelligent engine selection with graceful degradation
- **Query Abstraction**: Unified interface across different query engines

### 🎯 Core Capabilities

- **Universal Renderer**: Single entry point for all UI rendering
- **Layout as Asset**: Layouts are assets themselves, fully configurable
- **Composable Queries**: Build complex queries from reusable components
- **Semantic Navigation**: Navigate through knowledge using relationships

## Installation

### Using BRAT (Recommended for Beta Testing)

The Exocortex plugin is currently in beta and can be installed using BRAT (Beta Reviewers Auto-update Tool).

#### Step 1: Install BRAT

1. Open Obsidian Settings
2. Navigate to **Community plugins** → **Browse**
3. Search for "BRAT" (Beta Reviewers Auto-update Tool)
4. Install and enable the BRAT plugin

#### Step 2: Add Exocortex via BRAT

1. Open Obsidian Settings → **BRAT**
2. Click on **"Add Beta plugin"**
3. Enter the GitHub repository URL: `https://github.com/kitelev/exocortex-obsidian-plugin`
4. Click **"Add Plugin"**
5. BRAT will automatically download and install the plugin
6. Enable "Exocortex" in your Community plugins list

#### Benefits of Using BRAT

- **Auto-updates**: Automatically receive the latest beta updates
- **Easy rollback**: Switch between versions if needed
- **No manual file management**: BRAT handles all file operations

### Manual Installation (For Developers)

If you prefer to build from source or contribute to development:

```bash
# Clone the repository
git clone https://github.com/kitelev/exocortex-obsidian-plugin.git

# Navigate to the plugin directory
cd exocortex-obsidian-plugin

# Install dependencies
npm install

# Build the plugin
npm run build

# Copy files to your vault (replace <vault> with your vault path)
cp main.js manifest.json styles.css <vault>/.obsidian/plugins/exocortex-obsidian-plugin/
```

Then reload Obsidian and enable the plugin in Settings → Community plugins.

### Updating the Plugin

#### Via BRAT

1. Open Settings → **BRAT**
2. Click **"Check for updates"**
3. BRAT will automatically update all beta plugins

#### Manual Update

Follow the same steps as manual installation with the latest source code.

## Quick Start Guide

### 🚀 Your First Exocortex Asset in 5 Minutes

1. **Enable the Plugin**
   - Go to Settings → Community plugins
   - Find "Exocortex" and toggle it on
   - You should see "Exocortex plugin loaded" in the console

2. **Create Your First Asset**
   - Create a new note called `My First Asset`
   - Add this frontmatter and content:

```yaml
---
exo__Asset_uid: f47ac10b-58cc-4372-a567-0e02b2c3d479
exo__Asset_isDefinedBy: "[[Ontology - Exocortex]]"
exo__Asset_createdAt: 2025-08-20T10:30:00
exo__Instance_class: "[[exo__Asset]]"
exo__Asset_label: "My Knowledge Asset"
exo__Asset_description: "This is my first semantic asset"
---
# My First Asset

This note is now a semantic asset in your knowledge graph!

\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
```

3. **See It In Action**
   - Switch to Reading view
   - The ExoUIRender will display your asset with its metadata
   - Try editing the frontmatter values and watch it update!

## Usage Examples

### Example 1: Task Management System

Create a complete task management system with semantic relationships:

```yaml
---
# Task Definition
exo__Asset_uid: e28a3c15-7b4d-4e8a-9f2e-1c3d4e5f6a7b
exo__Asset_isDefinedBy: "[[!ems]]"
exo__Asset_createdAt: 2025-08-20T10:30:00
exo__Instance_class: "[[ems__Task]]"
exo__Asset_label: "Implement User Authentication"
ems__Task_status: "in-progress"
ems__Task_priority: "high"
ems__Task_assignee: "[[John Doe]]"
ems__Task_dueDate: "2025-01-15"
ems__Task_project: "[[Website Redesign]]"
---
## Task Details

\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
```

### Example 2: Knowledge Article with Semantic Links

```yaml
---
exo__Asset_uid: d1e5f8c2-4a7b-4c9e-8f1a-2b3c4d5e6f7g
exo__Asset_isDefinedBy: "[[!kb]]"
exo__Asset_createdAt: 2025-08-20T10:30:00
exo__Instance_class: "[[kb__Article]]"
exo__Asset_label: "RDF Triple Store Architecture"
kb__Article_category: "[[Technical Documentation]]"
kb__Article_relatedTo:
  - "[[Graph Query Engine]]"
  - "[[Graph Databases]]"
  - "[[Semantic Web]]"
kb__Article_author: "[[Your Name]]"
kb__Article_lastReviewed: "2025-01-10"
---
# RDF Triple Store Architecture

## Overview
This article explains how RDF triple stores work...

\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
```

### Example 3: Project Dashboard

```yaml
---
exo__Asset_uid: c3f7e9a1-6d8b-4f2e-9c5a-7b8c9d0e1f2g
exo__Asset_isDefinedBy: "[[!pm]]"
exo__Asset_createdAt: 2025-08-20T10:30:00
exo__Instance_class: "[[pm__Project]]"
exo__Asset_label: "Q1 2025 Roadmap"
pm__Project_status: "active"
pm__Project_startDate: "2025-01-01"
pm__Project_endDate: "2025-03-31"
pm__Project_team:
  - "[[Alice]]"
  - "[[Bob]]"
  - "[[Charlie]]"
---
# Project Dashboard

\`\`\`dataviewjs
// Custom dashboard showing all related tasks
const tasks = dv.pages()
.where(p => p.ems__Task_project?.path === dv.current().file.path)
.sort(p => p.ems__Task_priority, 'desc');

dv.table(
["Task", "Status", "Priority", "Due Date"],
tasks.map(t => [
t.file.link,
t.ems__Task_status,
t.ems__Task_priority,
t.ems__Task_dueDate
])
);

// Render the standard layout below
await window.ExoUIRender(dv, this);
\`\`\`
```

### Example 4: Custom Ontology for Research Notes

```yaml
---
# First, create your ontology
exo__Asset_uid: b2d6c8e4-5a9f-4e7c-8d1b-6e7f8a9b0c1d
exo__Asset_isDefinedBy: "[[!exo]]"
exo__Asset_createdAt: 2025-08-20T10:30:00
exo__Instance_class: "[[exo__Ontology]]"
exo__Ontology_prefix: "research"
exo__Asset_label: "Research Ontology"
---
# Research Ontology Definition
```

Then use it in your research notes:

```yaml
---
exo__Asset_uid: a1b5d7f3-4c8e-4f9a-7e2d-5f6a7b8c9d0e
exo__Asset_isDefinedBy: "[[!research]]"
exo__Asset_createdAt: 2025-08-20T10:30:00
exo__Instance_class: "[[research__Paper]]"
research__Paper_title: "Effects of Knowledge Graphs on Learning"
research__Paper_authors: ["Smith, J.", "Doe, A."]
research__Paper_year: 2024
research__Paper_doi: "10.1234/example"
research__Paper_keyFindings:
  - "Knowledge graphs improve retention by 40%"
  - "Semantic links enhance understanding"
research__Paper_relatedWorks:
  - "[[Previous Study 2023]]"
  - "[[Foundational Work 2020]]"
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
- **Query Engine Preference**: Choose between Dataview, Datacore, or auto-detection
- **Mobile Optimizations**: Enable touch-friendly UI and performance optimizations
- **Debug Mode**: Enable detailed console logging

#### Mobile-Specific Settings

- **Touch Target Size**: Adjust button sizes for better touch interaction (44pt recommended)
- **Enable Haptic Feedback**: Vibration feedback for touch interactions
- **Performance Mode**: Optimize for older devices with reduced animations

## Asset Requirements

### Mandatory Properties

**Every Exocortex Asset must include these three mandatory fields:**

1. **`exo__Asset_uid`** - Unique identifier in UUID format
   - Must be a valid UUID (e.g., `f47ac10b-58cc-4372-a567-0e02b2c3d479`)
   - Cannot be changed after creation
   - Used for internal asset identification and relationships

2. **`exo__Asset_isDefinedBy`** - Ontology reference
   - Must reference an ontology using `[[Ontology Name]]` or `[[!prefix]]` format
   - Examples: `[[!exo]]`, `[[Ontology - Exocortex]]`, `[[!custom_ontology]]`
   - Defines which ontology governs this asset's properties

3. **`exo__Asset_createdAt`** - Creation timestamp
   - Must be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss`
   - Optional timezone suffix (Z, +00:00, -05:00)
   - Examples: `2025-08-20T10:30:00`, `2025-08-20T10:30:00.123Z`

**Assets missing any of these mandatory fields will be silently ignored by the plugin.**

### Example Valid Asset

```yaml
---
exo__Asset_uid: f47ac10b-58cc-4372-a567-0e02b2c3d479
exo__Asset_isDefinedBy: "[[!exo]]"
exo__Asset_createdAt: 2025-08-20T10:30:00
exo__Instance_class: "[[exo__Asset]]"
exo__Asset_label: "My Valid Asset"
---
```

### Optional Properties

- **`exo__Asset_label`** - Human-readable name for the asset
- **`exo__Asset_description`** - Detailed description
- **`exo__Instance_class`** - Asset type/class definition
- Any domain-specific properties defined by your ontology

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

## Troubleshooting

### Common Issues and Solutions

#### 1. Plugin Not Loading

**Symptom**: Exocortex doesn't appear in the Community plugins list

**Solutions**:

- Ensure you've installed via BRAT or manually copied all files
- Check that `manifest.json`, `main.js`, and `styles.css` are in the plugin folder
- Restart Obsidian completely (Cmd/Ctrl + Q, then reopen)
- Check the console for error messages (Cmd/Ctrl + Shift + I)

#### 2. ExoUIRender Not Working

**Symptom**: `ExoUIRender is not defined` error or blank render

**Solutions**:

```javascript
// Ensure Dataview is installed and enabled first
// Use this diagnostic code block:
\`\`\`dataviewjs
if (typeof window.ExoUIRender === 'undefined') {
  dv.paragraph("❌ ExoUIRender not found. Please ensure:");
  dv.list([
    "Exocortex plugin is enabled",
    "Dataview plugin is installed and enabled",
    "You've reloaded Obsidian after installation"
  ]);
} else {
  dv.paragraph("✅ ExoUIRender is available!");
  await window.ExoUIRender(dv, this);
}
\`\`\`
```

#### 3. Assets Not Displaying Properly

**Symptom**: Asset metadata not showing or layout broken

**Solutions**:

- Verify frontmatter syntax (must be valid YAML)
- Check that class references use double brackets: `[[exo__Asset]]`
- Ensure you're in Reading view, not Edit view
- Validate property names follow the pattern: `prefix__Class_property`

**Debug frontmatter**:

```yaml
---
# This will help identify issues
exo__Instance_class: "[[exo__Asset]]" # Correct
# exo__Instance_class: exo__Asset       # Wrong - missing brackets
# exo__Instance_class: [[exo__Asset]]   # Wrong - missing quotes
---
```

#### 4. Performance Issues

**Symptom**: Slow rendering or Obsidian freezing

**Solutions**:

- Limit the number of ExoUIRender blocks per note (max 3-5)
- Reduce query complexity in Dataview blocks
- Disable auto-refresh in settings if not needed
- For large vaults (>1000 notes), use filtered queries:

```javascript
\`\`\`dataviewjs
// Instead of querying all pages
const filtered = dv.pages('"specific-folder"')
  .where(p => p.exo__Instance_class)
  .limit(20);
\`\`\`
```

#### 5. Ontology Not Recognized

**Symptom**: Custom ontology prefix not working

**Solutions**:

1. Create the ontology asset first:

```yaml
---
exo__Instance_class: "[[exo__Ontology]]"
exo__Ontology_prefix: "myprefix"
---
```

2. Reference it correctly in other assets:

```yaml
---
exo__Asset_isDefinedBy: "[[!myprefix]]" # Note the ! prefix
---
```

#### 6. Layout Blocks Not Updating

**Symptom**: Changes to layout definitions not reflected

**Solutions**:

- Use the "Refresh Exocortex Layouts" command (Cmd/Ctrl + P)
- Clear the cache: Settings → Files & Links → Clear cache
- Ensure layout asset follows naming convention: `Layout - ClassName`

#### 7. BRAT Update Issues

**Symptom**: BRAT not updating to latest version

**Solutions**:

```bash
# Manual BRAT update process:
1. Settings → BRAT → "Check for updates"
2. If that fails, remove and re-add:
   - Click "Delete" next to the plugin
   - Click "Add Beta plugin"
   - Re-enter the GitHub URL
```

#### 8. Console Errors

**Common errors and fixes**:

| Error                                                     | Solution                                     |
| --------------------------------------------------------- | -------------------------------------------- |
| `Cannot read property 'exo__Instance_class' of undefined` | Add frontmatter to your note                 |
| `Maximum call stack size exceeded`                        | Check for circular references in assets      |
| `Failed to load plugin`                                   | Reinstall via BRAT or check file permissions |
| `Dataview API not found`                                  | Install and enable Dataview plugin           |

### Getting Help

If you're still experiencing issues:

1. **Check the Console** (Cmd/Ctrl + Shift + I)
   - Look for red error messages
   - Copy the full error text

2. **Enable Debug Mode**
   - Settings → Exocortex → Enable Debug Mode
   - Check console for detailed logs

3. **Report Issues**
   - [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues)
   - Include:
     - Obsidian version
     - Exocortex version
     - Error messages
     - Steps to reproduce

4. **Community Support**
   - [GitHub Discussions](https://github.com/kitelev/exocortex-obsidian-plugin/discussions)
   - Discord: [Obsidian Community](https://obsidian.md/community)

### Diagnostic Commands

Run these in the Developer Console (Cmd/Ctrl + Shift + I):

```javascript
// Check if plugin is loaded
app.plugins.plugins["exocortex-obsidian-plugin"];

// Check Dataview availability
app.plugins.plugins["dataview"];

// List all available commands
app.commands.listCommands().filter((c) => c.id.includes("exocortex"));

// Check plugin version
app.plugins.plugins["exocortex-obsidian-plugin"]?.manifest?.version;
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

# Run comprehensive tests
npm run test:all

# Run specific test categories
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:bdd           # BDD scenarios
npm run test:ui            # UI automation
npm run test:e2e           # End-to-end tests
npm run test:mobile        # Mobile-specific tests

# Run tests with coverage
npm run test:coverage

# Development testing commands
npm run test:watch         # Watch mode for TDD
npm run test:bdd:watch     # BDD watch mode
```

### Development Workflow

```bash
# Start development server with hot reload
npm run dev

# In another terminal, run tests in watch mode
npm run test:watch

# Run BDD tests for specific features
npm run test:bdd:smoke     # Critical scenarios
npm run test:bdd:security  # Security tests
npm run test:bdd:api       # API integration

# Performance and quality checks
npm run check:all          # Type checking, linting, formatting
npm run test:performance   # Performance benchmarks
```

### Project Structure

```
├── src/                           # Source code
│   ├── domain/                    # Business logic
│   │   ├── entities/             # Domain entities
│   │   ├── value-objects/        # Value objects
│   │   └── semantic/             # RDF/semantic layer
│   ├── application/              # Use cases and services
│   │   ├── use-cases/           # Business operations
│   │   └── services/            # Application services
│   ├── infrastructure/          # External adapters
│   │   ├── container/           # Dependency injection
│   │   ├── logging/             # Logging infrastructure
│   │   └── repositories/        # Data persistence
│   └── presentation/            # UI components
│       ├── components/          # Renderers
│       ├── modals/             # User dialogs
│       └── renderers/          # Block renderers
├── tests/                        # Comprehensive test suite
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── bdd/                     # BDD scenarios
│   │   ├── features/           # Gherkin feature files
│   │   ├── step-definitions/   # Step implementations
│   │   ├── helpers/            # Test utilities
│   │   └── support/            # World context
│   ├── ui/                      # UI automation tests
│   ├── e2e/                     # End-to-end tests
│   └── __mocks__/               # Mock implementations
├── docs/                         # Documentation
│   ├── BDD-TESTING-GUIDE.md     # BDD testing guide
│   ├── architecture/            # Architecture docs
│   └── enterprise/              # Enterprise documentation
├── main.ts                       # Plugin entry point
├── manifest.json                 # Plugin metadata
├── styles.css                    # Plugin styles
└── esbuild.config.mjs           # Build configuration
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines

1. **TypeScript Best Practices**: Use strict mode, proper typing, and interface segregation
2. **Test-Driven Development**: Write tests before implementation (TDD/BDD)
3. **Clean Architecture**: Follow dependency inversion and separation of concerns
4. **Documentation**: Update both technical and user documentation
5. **Performance**: Include performance tests for new features
6. **Security**: Add security validation for user inputs
7. **Logging**: Use structured logging for observability
8. **Backward Compatibility**: Maintain compatibility with existing features

### Testing Requirements

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **BDD Tests**: Business scenarios in Gherkin format
- **UI Tests**: User interface automation with WebDriverIO
- **Performance Tests**: Load testing and benchmarking
- **Security Tests**: Vulnerability testing and validation
- **Mobile Tests**: iOS/Android specific testing

### Code Quality Standards

```bash
# Before committing
npm run check:all          # Type checking, linting, formatting
npm run test:all           # All test categories
npm run build              # Ensure clean build

# Continuous Integration
- All tests must pass
- Coverage threshold: 70%+
- No TypeScript errors
- ESLint compliance
- Performance benchmarks within limits
```

## Recent Updates

### Version 4.1 (Current)

- ✅ **Comprehensive Logging Infrastructure**: Enterprise-grade logging with performance monitoring and security features
- ✅ **BDD Testing Framework**: Complete Behavior-Driven Development with Gherkin scenarios and advanced test utilities
- ✅ **Enhanced Test Coverage**: 80+ test files across multiple categories (unit, integration, BDD, UI, E2E)
- ✅ **Type System Improvements**: Enhanced TypeScript definitions with strict type safety
- ✅ **Performance Monitoring**: Built-in performance validation and metrics collection
- ✅ **Security Validation**: Comprehensive security testing with threat detection

### Version 3.0 (Previous)

- ✅ **Mobile/iOS Support**: Complete touch-optimized interface with native gestures
- ✅ **Query Engine Abstraction**: Support for both Dataview and Datacore plugins
- ✅ **Offline-First Architecture**: Works without internet connectivity
- ✅ **Performance Optimizations**: 40% faster on mobile devices

### Upcoming Features

- [ ] Visual layout editor with drag-and-drop interface
- [ ] Graph query support with visual query builder
- [ ] Import/export of ontologies in standard formats
- [ ] Multi-vault synchronization across devices
- [ ] Apple Pencil support for iPad with drawing capabilities
- [ ] Widget support for iOS 14+ with live data
- [ ] Real-time collaboration features
- [ ] AI-powered content suggestions

## Development and Testing

### Logging Infrastructure

The plugin includes comprehensive logging for development and debugging:

```typescript
// Using the Logger in your code
import { LoggerFactory } from './src/infrastructure/logging/LoggerFactory';

class MyService {
  private logger = LoggerFactory.createForClass(MyService);
  
  async processData(data: any) {
    this.logger.startTiming('data-processing');
    this.logger.info('Processing data', { recordCount: data.length });
    
    try {
      const result = await this.processInternal(data);
      this.logger.endTiming('data-processing', { success: true });
      return result;
    } catch (error) {
      this.logger.error('Processing failed', { error: error.message }, error);
      throw error;
    }
  }
}
```

### BDD Testing

The project uses Behavior-Driven Development with Gherkin scenarios:

```bash
# Run BDD tests
npm run test:bdd

# Run specific test categories
npm run test:bdd:smoke     # Critical scenarios
npm run test:bdd:security  # Security validation
npm run test:bdd:performance # Performance tests
```

**Example Feature File:**

```gherkin
Feature: Asset Management
  As a knowledge worker
  I want to create and manage assets
  So that I can organize my knowledge effectively

  Scenario: Creating a new asset
    Given I have valid asset data
    When I create an asset
    Then the asset should be created successfully
    And it should have the correct properties
```

## Support

- **Issues**: [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kitelev/exocortex-obsidian-plugin/discussions)
- **Development**: See `docs/` directory for detailed development guides
- **Testing**: See `CLAUDE-test-patterns.md` for testing best practices

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
