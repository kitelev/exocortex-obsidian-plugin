# Changelog

All notable changes to the Exocortex Obsidian Plugin will be documented in this file.## [2.1.0] - 2025-08-09

### Added

- feat: Complete CI/CD setup with comprehensive testing

### Fixed

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