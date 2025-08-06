# Changelog

All notable changes to the Exocortex Obsidian Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2025-08-06

### Added
- **Quality Gate**: GitHub Actions workflow for comprehensive quality checks
- **Mandatory Release Process**: Updated CLAUDE.md with strict release requirements
- **Quality Checks**:
  - Test execution
  - Build validation
  - File size checks
  - Manifest validation
  - Documentation verification
  - Architecture compliance

### Changed
- CLAUDE.md now emphasizes mandatory release process after every code change
- Added clear success/failure criteria for task completion

### Technical
- Quality Gate runs on every push to main branch
- Automated checks ensure code quality before release
- Clear documentation of release requirements for AI assistants

## [0.5.0] - 2025-08-06

### Added
- **Clean Architecture**: Complete refactoring following Clean Architecture principles
- **Domain Layer**: Pure business entities and value objects
- **Application Layer**: Use cases with clear boundaries
- **Infrastructure Layer**: Adapters for external dependencies
- **Dependency Injection**: IoC container for service management
- **Test Infrastructure**: Fake objects and test contexts for comprehensive testing
- **Architecture Documentation**: Detailed documentation of patterns and principles

### Changed
- **BREAKING**: Complete restructure of codebase into layers
- Code organized by feature and responsibility
- All business logic isolated from Obsidian API
- Tests refactored with fake implementations

### Improved
- **SOLID Principles**: Full adherence to SOLID principles
- **DRY**: Eliminated code duplication
- **KISS**: Simplified complex logic
- **GRASP**: Proper responsibility assignment
- **Low Coupling**: Minimal dependencies between modules
- **High Cohesion**: Related functionality grouped together
- **Testability**: 100% of business logic testable without Obsidian

### Technical
- Implemented Repository Pattern for data access
- Implemented Adapter Pattern for external APIs
- Implemented Factory Pattern for object creation
- Added comprehensive test helpers and contexts
- FIRST principles applied to all tests

## [0.4.3] - 2025-08-06

### Changed
- **BREAKING**: Renamed command from "Create Exocortex Note" to "Create ExoAsset"
- Command ID changed from `create-exo-note` to `create-exo-asset`
- Modal class renamed from `ExocortexNoteModal` to `ExocortexAssetModal`
- Replaced all "note" terminology with "asset" throughout the plugin
- Updated UI text to use "asset" instead of "note"
- Documentation updated to reflect new terminology

### Technical
- Consistent use of "asset" terminology aligns with Exocortex ontology concepts
- All internal variables renamed (noteTitle → assetTitle, noteClass → assetClass, etc.)
- Tests updated to use new terminology

## [0.4.2] - 2025-08-06

### Fixed
- Default ontology from settings now properly applied when creating new notes
- Fixed initialization logic to correctly map saved prefix to fileName

### Added
- Comprehensive test suite with 32 tests covering all features
- Template folder path setting to exclude templates from dropdowns
- Files in template folder are now excluded from ontology/class/property discovery

### Improved
- Test coverage for all plugin functionality
- Settings validation and handling

### Technical
- Added Jest testing framework with Obsidian mocks
- TypeScript configuration updated with esModuleInterop
- 100% test pass rate achieved

## [0.4.1] - 2025-08-06

### Changed
- Default Ontology setting is now a dropdown instead of text field
- Setting automatically discovers all ontologies in vault
- Shows prefix and label for each ontology in settings

### Improved
- Better UX in plugin settings with visual selection
- Consistent with the dropdown approach used in note creation modal

## [0.4.0] - 2025-08-06

### Added
- **Dynamic property fields** based on selected class
- Automatic discovery of properties through `exo__Property_domain`
- Recursive property inheritance from parent classes
- Different input types based on `exo__Property_range`:
  - Text inputs for strings
  - Textareas for descriptions/comments
  - Dropdowns for enums
  - Toggles for booleans
  - Date inputs for dates
  - Number inputs for numbers
  - Array inputs for relations
- Properties section in create note modal
- All properties saved to frontmatter

### Technical
- Added `findPropertiesForClass()` to discover applicable properties
- Added `getClassHierarchy()` for recursive parent class lookup
- Dynamic form generation based on property ranges
- Property values stored in Map and included in frontmatter

## [0.3.1] - 2025-08-06

### Fixed
- Fixed incorrect links in `exo__Asset_isDefinedBy` - now uses actual ontology filename
- Previously was incorrectly adding `!` prefix to ontology prefix (e.g., `[[!exo]]` instead of `[[!exo]]` file)
- Now correctly links to the actual ontology file (e.g., `[[!exo]]`, `[[Ontology - EMS]]`)

### Technical
- Modified `findAllOntologies()` to return fileName alongside prefix
- Dropdown now stores and uses actual filename for creating correct wiki links
- Default ontologies use convention of `!prefix` for filename

## [0.3.0] - 2025-08-06

### Changed
- **BREAKING**: Class and Ontology selections are now independent
- Class dropdown shows ALL available classes from vault, regardless of ontology
- Ontology selection only determines which knowledge graph the asset belongs to
- Reordered fields: Title → Class → Ontology for better workflow

### Fixed
- Corrected conceptual understanding: ontology is about graph membership, not class restriction
- Classes can be used with any ontology (e.g., ems__Task can belong to 'exo' ontology)

### Technical
- Replaced `findClassesForOntology()` with `findAllClasses()` that finds all exo__Class instances
- Removed dependency between ontology and class dropdowns
- Simplified modal logic for independent selections

## [0.2.0] - 2025-08-06

### Added
- Dynamic ontology discovery - automatically finds all ontologies in your vault
- Dropdown selector for ontologies instead of text field
- Dropdown selector for classes based on selected ontology
- Automatic class discovery from vault assets
- Intelligent defaults for common ontologies (exo, ems, gtd, ims)

### Changed
- Create Note modal now uses dropdowns for better user experience
- Ontology dropdown shows prefix and label for clarity
- Class dropdown updates dynamically when ontology changes
- Better error handling for vaults without ontologies

### Technical
- Added `findAllOntologies()` method to scan vault for ontology definitions
- Added `findClassesForOntology()` method to discover available classes
- Improved metadata parsing for ontology prefixes and labels

## [0.1.0] - 2025-08-06

### Added
- Initial release of Exocortex plugin
- Universal layout renderer (`ExoUIRender`) for ontology-driven UI
- Dynamic content rendering based on note metadata
- Support for semantic relationships between notes
- Configurable settings tab with options for:
  - Default ontology namespace
  - Auto-refresh layouts
  - Debug mode
- Commands:
  - Create Exocortex Note - creates new notes with proper ontology metadata
  - Refresh Exocortex Layouts - manually refresh all dynamic layouts
- Automatic detection of note class from `exo__Instance_class` property
- Display of note properties, related assets, and backlinks
- Custom styling for layout blocks and property tables
- GitHub Actions workflows for CI/CD and automated releases

### Technical Details
- Built with TypeScript for type safety
- Uses esbuild for fast compilation
- Follows Obsidian plugin best practices
- Compatible with Obsidian v1.0.0+

[0.1.0]: https://github.com/kitelev/exocortex-obsidian-plugin/releases/tag/0.1.0