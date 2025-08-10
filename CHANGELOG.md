# Changelog

All notable changes to the Exocortex Obsidian Plugin will be documented in this file.

## [2.6.0] - 2025-08-10

### 🎯 Added - ExoFocus Context Filtering
- **Context-Aware Knowledge Management** - Filter your knowledge base by current focus
- **Predefined Contexts** - Work, Personal, Today, This Week contexts ready to use
- **Dynamic SPARQL Filtering** - Query results automatically filtered by active focus
- **Multi-Criteria Filtering** - Filter by class, tags, properties, timeframe, and relations
- **Persistent Configuration** - Focus settings saved in .exocortex folder
- **Statistics Dashboard** - View filtered vs total assets and triples

### Features
- ExoFocus entity with comprehensive filtering logic
- Integration with SPARQL processor for automatic result filtering
- Five predefined focus contexts with smart defaults
- Commands to quickly switch between contexts
- Real-time statistics about filtered knowledge
- Support for complex filter combinations
- Date-based filtering for tasks and events

### Commands
- **ExoFocus: Show All Knowledge** - Disable filtering
- **ExoFocus: Work Context** - Focus on work-related items
- **ExoFocus: Personal Context** - Focus on personal knowledge
- **ExoFocus: Today** - Focus on today's items
- **ExoFocus: Show Statistics** - View filtering statistics

### Technical
- ExoFocus domain entity with Result pattern
- ExoFocusService for managing contexts
- Filter types: class, tag, property, timeframe, relation
- Operators: includes, excludes, equals, contains, before, after, between
- Automatic week start/end calculation for timeframe filters

### Why This Matters
ExoFocus transforms Exocortex into a context-aware knowledge system:
- AI agents can work within specific knowledge contexts
- Reduce cognitive overload by hiding irrelevant information
- Switch between work and personal contexts instantly
- Focus on time-sensitive information with date filters
- Maintain multiple parallel research contexts

## [2.5.0] - 2025-08-10

### 🌐 Added - REST API for External AI Agents
- **Comprehensive REST API Server** - Enable external AI agents to interact with your knowledge base
- **Natural Language Processing** - Convert natural language queries to SPARQL automatically
- **Multiple API Endpoints** - SPARQL, NLP, assets, graph operations, and more
- **File-Based API Fallback** - Alternative mechanism for restricted environments
- **Python Client Library** - Ready-to-use client for AI agent integration
- **API Documentation** - Complete reference with examples and best practices

### Features
- REST API server on port 27124 with API key authentication
- SPARQL query execution endpoint for semantic searches
- Natural language to SPARQL conversion with ExoAgent
- Asset creation and management via API
- Graph operations for triple manipulation
- ExoFocus context management
- Vault search and file operations
- CORS support for browser-based clients
- Self-signed HTTPS option for secure connections

### Commands
- **Start REST API Server** - Launch the API server
- **Stop REST API Server** - Shutdown the API server  
- **Show REST API Key** - Copy API key to clipboard

### Technical
- Integration with obsidian-local-rest-api patterns
- ExoAgent service for NLP to SPARQL conversion
- LocalAPIServer for file-based communication
- Support for both HTTP and HTTPS servers
- Comprehensive error handling and validation

### API Endpoints
- `GET /api/health` - Server health check
- `POST /api/sparql` - Execute SPARQL queries
- `POST /api/nlp` - Natural language queries
- `GET/POST /api/graph` - Graph operations
- `GET /api/assets` - Search assets
- `POST /api/assets/create` - Create new assets
- `POST /api/relations/ontologize` - Ontologize relations
- `GET/POST /api/focus` - Manage ExoFocus context
- `GET /api/vault/files` - List vault files
- `GET /api/vault/search` - Search vault content

### Why This Matters
The REST API transforms Exocortex into an AI-accessible knowledge platform:
- AI agents can query your knowledge base for context
- Automated knowledge creation from AI conversations
- Semantic reasoning through SPARQL queries
- Integration with Claude MCP, GPT agents, and other AI tools
- Programmatic access for automation and workflows

## [2.4.0] - 2025-08-09

### 🎨 Added - Layout Renderer Integration
- **Custom Layout System** - Dynamic rendering of assets based on class-specific layouts
- **Code Block Support** - Use `exo-layout` code blocks to render custom asset views
- **Block Types** - Support for query, properties, backlinks, and custom blocks
- **Collapsible Sections** - Interactive UI with collapsible layout blocks
- **Default Layouts** - Automatic fallback to sensible defaults when no layout defined

### Features
- New `exo-layout` code block processor for custom rendering
- Integration with existing PropertyRenderer and block renderers
- Support for class-based layout configuration
- Dynamic layout loading based on asset's instance class
- Clean separation between layout definition and rendering

### Technical
- LayoutRenderer integrated into main plugin
- Support for four block types: query, properties, backlinks, custom
- Proper dependency injection with DIContainer
- Comprehensive test coverage for layout rendering
- Compatible with Obsidian's markdown post-processor API

### Usage
Add this code block to any asset note to render its custom layout:
```markdown
```exo-layout
```
```

The layout will automatically adapt based on the asset's `exo__Instance_class` property.

## [2.3.0] - 2025-08-09

### 🚀 Added - Relation Ontologization Feature
- **Relation Ontologization Command** - Convert asset properties into first-class Relation objects
- **Event Sourcing Support** - Every relation becomes a versioned, trackable entity
- **Bidirectional Relations** - Automatically create inverse relations for complete graph
- **N-ary Relations** - Support for complex relationships between multiple assets
- **Vault Migration** - Convert entire vault to relation-based model with progress tracking
- **RelationAsset Entity** - New domain entity for managing relations as assets

### Features
- New "Ontologize Asset Relations" command in Command Palette
- Automatic extraction of object properties from frontmatter
- Wiki link pattern detection for relationship discovery
- Relation files created in "99 Relations" folder
- Confidence scoring and provenance tracking for each relation
- Clean original assets by removing converted properties

### Technical
- RelationOntologizer service for property-to-relation conversion
- RelationAssetHelper for bidirectional relation creation
- Support for inverse predicate mapping
- YAML generation for relation frontmatter
- Comprehensive test coverage for all relation operations

### Why This Matters
Relation Ontologization transforms Obsidian into a true graph database where:
- Every relationship is a trackable, versioned entity
- Event Sourcing enables complete history of knowledge evolution
- Bidirectional relations provide full graph traversal
- N-ary relations support complex real-world relationships
- Relations can have their own metadata, confidence scores, and provenance

Example:
```yaml
# Before (in Task asset)
ems__Task_project: "[[Project Alpha]]"
ems__Task_assignedTo: "[[John Doe]]"

# After (as Relation assets)
Relation 1:
  subject: Task-123
  predicate: ems__Task_project
  object: Project Alpha
  confidence: 1.0
  inverseOf: Relation-2

Relation 2:
  subject: Project Alpha
  predicate: ems__Project_hasTasks
  object: Task-123
  confidence: 1.0
  inverseOf: Relation-1
```

## [2.2.0] - 2025-08-09

### 🚀 Added - Critical MVP Feature
- **CONSTRUCT Query Support** - Enables reasoning and knowledge inference
- **Template-based Triple Generation** - Generate new knowledge from patterns
- **Multi-pattern Joins** - Support for complex WHERE clauses with multiple patterns
- **Graph Integration** - Generated triples automatically added to knowledge graph
- **Provenance Tracking** - Each generated triple tracked with creation timestamp

### Features
- CONSTRUCT queries now work alongside SELECT queries
- Automatic notification shows number of generated triples
- Support for LIMIT clause in CONSTRUCT queries
- Comprehensive error handling for malformed queries

### Technical
- SPARQLEngine.construct() method implementation
- Pattern joining algorithm for complex queries
- Full test coverage for CONSTRUCT functionality
- Integration with existing Graph triple store

### Why This Matters
CONSTRUCT queries are what distinguish Exocortex from simple query tools. They enable:
- Automated reasoning and inference
- Knowledge derivation from existing facts
- Rule-based knowledge generation
- Semantic relationship discovery

Example:
```sparql
CONSTRUCT {
  ?person ems:contributesTo ?project
}
WHERE {
  ?task ems:assignedTo ?person .
  ?task ems:partOf ?project .
}
```

## [2.1.13] - 2025-08-09

### Fixed
- **Test Infrastructure** - Improved test mocks for Obsidian DOM methods
- **HTMLElement Extensions** - Added global createEl, createDiv, empty methods for tests
- **Mock Components** - Fixed Setting and DropdownComponent mocks
- **Test Stability** - Reduced test failures from 22 to 9

### Technical
- Added proper DOM method mocking for Obsidian API
- Improved test isolation and reliability
- Enhanced mock coverage for UI components

## [2.1.12] - 2025-08-09

### Fixed
- **Dynamic property field updates** - Properties now correctly refresh when switching classes
- **Obsidian API compatibility** - Fixed empty() method usage for both Obsidian and DOM elements
- **Array domain support** - Properties with multiple domain classes now detected correctly

### Added
- Console logging for debugging property discovery
- Fallback to DOM methods when Obsidian methods unavailable
- Support for properties with array domains (multiple classes)

### Technical
- Fixed container clearing using compatible methods
- Added proper type checking for empty() method availability
- Enhanced domain matching to support arrays
- Added comprehensive tests for dynamic updates

## [2.1.11] - 2025-08-09

### Fixed
- **Dropdown lists now populated with data** - Classes and ontologies now appear in Create ExoAsset modal
- **Dynamic property loading** - Properties are loaded based on selected class
- **Default values provided** - When no data found, sensible defaults are shown

### Added
- Automatic discovery of classes from vault files with `exo__Instance_class: [[exo__Class]]`
- Automatic discovery of ontologies from files starting with `!`
- Property detection based on `rdfs__domain` matching selected class
- Type mapping from RDF ranges to appropriate input fields

### Technical
- Enhanced CreateAssetModal to scan vault for classes, ontologies and properties
- Added mapRangeToType() method for converting RDF types to UI inputs
- Provided fallback default values when vault is empty

## [2.1.10] - 2025-08-09

### Fixed
- **SPARQL processor double registration error resolved** - Plugin now handles hot reload correctly
- **Graceful error handling** - Plugin continues to work even if SPARQL processor already registered
- **Proper cleanup on unload** - Added disposal of DIContainer and reset of registration flags
- **Test coverage maintained at 91.5%** - Added comprehensive tests for registration scenarios

### Technical
- Added try-catch block around SPARQL processor registration
- Added processorRegistered flag to track registration state
- Enhanced onunload() with proper cleanup of all resources
- Added SPARQLProcessorRegistration.test.ts for regression testing

## [2.1.9] - 2025-08-09

### Fixed
- **Command now appears in Command Palette** - Added missing "main" field to manifest.json
- **Create ExoAsset command fully functional** - Command can be accessed via Cmd/Ctrl+P
- **Hotkey support working** - Cmd/Ctrl+Shift+N creates new asset
- **Ribbon icon functional** - Plus circle icon in sidebar works correctly

### Technical
- Added "main": "main.js" to manifest.json for proper plugin loading
- Fixed plugin export in build process
- Command ID "create-exo-asset" properly registered

## [2.1.8] - 2025-08-09

### Fixed
- **Critical DIContainer initialization error resolved** - Plugin now loads correctly without errors
- **Singleton pattern fix** - DIContainer.initialize() now properly creates and manages the singleton instance
- **Test coverage maintained at 91%** - Added comprehensive integration tests for DIContainer initialization

### Technical
- Fixed DIContainer.initialize() to be called instead of getInstance() in main.ts
- Added getPropertyEditingUseCase() method to DIContainer
- Updated mocks to include registerEvent method for Plugin class
- Added comprehensive DIContainerInitialization.test.ts to prevent regression

## [2.1.7] - 2025-08-09

### Fixed
- **Build issues resolved** - Fixed import paths and build configuration
- **Command now appears in Command Palette** - "Create new ExoAsset" command is properly compiled
- **Tests added** - Added comprehensive tests for CreateAssetModal and command registration
- **Main.ts consolidation** - Merged src/main.ts into root main.ts with correct imports

### Technical
- Fixed esbuild configuration to properly compile all dependencies
- Consolidated multiple main.ts files into single source
- Added 50+ tests for CreateAsset functionality
- Command properly registers with id "create-exo-asset"

## [2.1.6] - 2025-08-09

### Added
- **Create ExoAsset command** - New command to create assets through a modal dialog
- **Command palette integration** - Access via Cmd/Ctrl+P and search for "Create new ExoAsset"
- **Hotkey support** - Use Cmd/Ctrl+Shift+N to quickly create new assets
- **Ribbon icon** - Added plus-circle icon in the left sidebar for quick access
- **DI Container integration** - Properly initialized dependency injection for asset creation

### Fixed
- Integrated CreateAssetModal and CreateAssetUseCase into the main plugin
- Connected DIContainer for proper dependency resolution

## [2.1.5] - 2025-08-09

### Fixed
- Fixed SPARQL functionality by integrating proper SPARQLEngine and Graph components
- Replaced simplified SPARQL implementation with full-featured RDF triple store
- Added real-time graph updates when files are modified, created, or deleted
- Improved frontmatter parsing to handle arrays and complex values correctly
- Fixed SPARQL processor to use the proper architecture components

### Changed
- SPARQL queries now run against a persistent in-memory RDF graph
- Graph is automatically synchronized with vault changes
- Better performance for large vaults through indexed triple store

## [2.1.0] - 2025-08-09

### Added

- feat: Complete CI/CD setup with comprehensive testing

### Fixed

- Fix UI tests in GitHub Actions workflows
## [2.1.0] - 2025-08-09

### Added

- feat: Complete CI/CD setup with comprehensive testing

### Fixed

- fix: Remove Obsidian cache from repository
- fix: Add missing WDIO reporters for CI
- fix: Comprehensive CI/CD fixes and Obsidian plugin best practices
- Fix UI tests in GitHub Actions workflows

## [2.1.0] - 2025-08-09

### Added

- feat: Complete CI/CD setup with comprehensive testing

### Fixed

- Fix UI tests in GitHub Actions workflows

## [2.1.0] - 2025-08-09

### 🎯 Major Quality Improvements
This release implements comprehensive testing and quality assurance following Test-Driven Development (TDD) principles.

### ✨ Added
- **Comprehensive E2E Test Suite**: 13 end-to-end tests covering all plugin functionality
- **Unit Test Coverage**: 9 unit tests for SPARQL processing and DOM operations  
- **CI/CD Pipeline**: GitHub Actions for automated testing and releases
- **Test Documentation**: Complete test coverage reports and validation

### 🐛 Fixed
- **DOM Compatibility**: Replaced Obsidian-specific `el.empty()` with standard `innerHTML = ''`
- **DOM Methods**: Fixed `createEl()` and `createDiv()` to use standard DOM API
- **Cross-Environment Support**: Plugin now works in both Obsidian and test environments

### 🔧 Changed
- Refactored DOM manipulation to use standard JavaScript APIs
- Updated all unit tests to match SPARQL functionality
- Improved error handling and logging

### 📊 Test Coverage
- **E2E Plugin Loading**: 6/6 tests ✅
- **E2E SPARQL Functionality**: 7/7 tests ✅
- **Unit Tests**: 9/9 tests ✅
- **Total**: 22/22 tests passing (100% success rate)

### 🚀 Performance
- Query execution time displayed in results
- Optimized frontmatter parsing
- Efficient RDF triple extraction

## [2.0.0] - 2025-08-08

### ✨ Added
- **SPARQL Query Support**: Write SPARQL queries in markdown code blocks
- **RDF Triple Extraction**: Automatic extraction from frontmatter
- **Styled Results Display**: Beautiful table output with blue theme
- **File Link Integration**: Clickable links to vault files
- **Error Handling**: Graceful error messages with styling

### 🎨 Features
- `SELECT` query support with variables
- `LIMIT` clause support
- Frontmatter to RDF triple conversion
- Interactive results table
- Performance metrics display

## [1.0.0] - 2025-08-01

### 🚀 Initial Release
- Basic plugin structure
- Obsidian plugin API integration
- Initial documentation