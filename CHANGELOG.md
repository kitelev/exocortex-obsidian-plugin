# Changelog

All notable changes to the Exocortex Obsidian Plugin will be documented in this file.

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