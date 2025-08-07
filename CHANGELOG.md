# Changelog

All notable changes to the Exocortex Obsidian Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.12] - 2025-08-07

### 📱 Mobile Experience Improvements
- **iPhone 13 Pro Optimization**: Complete redesign for mobile devices
  - Full-screen modals on mobile for better space utilization
  - Touch-friendly 44px minimum tap targets (iOS standard)
  - Safe area support for modern devices with notches
  - Sticky headers and footers for better navigation

### ✨ New Mobile Features
- **Responsive Design**: Adaptive layouts for all screen sizes
  - Automatic layout adjustments for phones (< 428px)
  - Tablet optimizations (< 768px)
  - Landscape mode support
  - High DPI/Retina display support

### 🎨 UI/UX Enhancements
- **Touch Gestures**: Improved touch interaction
  - Larger hit areas for buttons and controls
  - Visual feedback on touch
  - Smooth scrolling with momentum
  - No zoom on input focus (16px font size)

### 🔧 Technical Improvements
- Created separate `styles-mobile.css` for mobile-specific styles
- Added media queries for various breakpoints
- Implemented CSS Grid and Flexbox for responsive layouts
- Added support for CSS environment variables (safe areas)
- Optimized for iOS-specific requirements

### 📊 Mobile Tables
- Tables convert to card layout on mobile
- Horizontal scrolling for wide content
- Improved readability with adjusted typography

## [0.5.11] - 2025-08-07

### 🚀 CI/CD Improvements
- **Automated Release Pipeline**: Added GitHub Actions workflow for automatic releases on code changes
  - Automatic version detection and tag creation
  - Build and test verification before release
  - Changelog extraction for release notes
  - ZIP package creation for easy installation

### 📋 Process Enhancements
- **Strict Release Policy**: Enforced mandatory release creation after every code change
- **CLAUDE.md Updates**: Added ultra-critical release rules with zero tolerance policy
- **Release Verification**: Added mandatory release verification step in development process

### 🔧 Technical Changes
- Created `.github/workflows/auto-release.yml` for automated releases
- Enhanced release documentation and procedures
- Improved development workflow automation

## [0.5.10] - 2025-08-07

### ✨ New Features
- **Claude Code GitHub Integration**: Added GitHub Action workflow for AI-powered code reviews and assistance
  - Automatic code review on pull requests
  - AI-powered assistance for issues and PRs
  - Seamless integration with Claude API

### 🚀 Improvements
- **Development Workflow**: Enhanced CI/CD pipeline with Claude Code support
- **Code Quality**: Automated AI-driven code analysis and suggestions

## [0.5.9] - 2025-08-07

### 🔧 Fixed
- **CI/CD Pipeline**: Resolved critical GitHub workflow failures blocking releases
- **NPM Dependencies**: Restored stable package-lock.json for consistent builds
- **Test Execution**: Implemented 60-second timeout limits to prevent hanging tests

### 🚀 Improvements
- **GitHub Actions Optimization**:
  - Added npm caching for faster workflow runs
  - Configured retry logic and timeout protection
  - Optimized with `--prefer-offline` and `--no-audit` flags
- **Development Process**: 
  - Updated CLAUDE.md with mandatory workflow checks before new tasks
  - Added automated workflow status verification requirements

### 📋 Technical Changes
- Created `.npmrc` configuration for faster npm operations
- Enhanced CI/CD with proper timeout management
- Fixed npm ci compatibility issues in GitHub Actions

## [0.5.8] - 2025-08-06

### Fixed
- **Critical Bug**: Fixed "Asset not found" error when editing properties via dropdown
- Asset lookup now correctly handles multiple identifier types (UUID, filename, path)
- Improved error handling with fallback search methods

### Added
- **findByFilename** method in asset repositories for robust asset discovery
- Comprehensive test suite to prevent regression
- Enhanced asset identification with automatic extension handling

### Improved
- PropertyEditingUseCase now tries multiple lookup methods for asset discovery
- Better handling of special characters in filenames
- Performance optimizations for asset search operations

### Technical
- Added 20+ unit tests for asset repository operations
- Added 10+ integration tests for property editing use case
- Added 7 end-to-end tests for inline editing scenarios
- Implemented robust fallback chain: ID → Filename → Path search

### Tests Added
- Unit tests for ObsidianAssetRepository.findByFilename()
- Integration tests for PropertyEditingUseCase with different identifiers
- E2E tests for dropdown selections and special characters
- Performance tests ensuring < 500ms response times
- Regression tests to prevent future "Asset not found" errors

## [0.5.7] - 2025-08-06

### Added
- **Inline Property Editing**: Properties in asset views can now be edited directly by clicking on them
- **Domain-Driven Design Architecture**: Refactored to follow DDD principles with proper layer separation
- **Clean Architecture Implementation**: Added repositories, use cases, and dependency injection
- **Property Renderer Component**: New component for rendering editable properties with same rules as asset creation

### Changed
- Asset properties are now displayed as clickable, editable fields in asset views
- Property editing follows the same dropdown/input rules as the asset creation form
- Refactored codebase to follow enterprise architecture patterns

### Improved
- Better separation of concerns with DDD/Clean Architecture
- More maintainable and testable codebase structure
- Consistent property editing experience across creation and viewing

### Technical
- Added `PropertyRenderer` component for inline editing functionality
- Implemented `PropertyEditingUseCase` for business logic
- Created `ObsidianAssetRepository` and `ObsidianOntologyRepository`
- Set up dependency injection container with `DIContainer`
- Added domain entities, value objects, and aggregates
- Implemented Result pattern for error handling

## [0.5.6] - 2025-08-06

### Added
- **Interactive Tree Selector Modal**: Replaced dropdown with interactive modal for class selection
- **Expand/Collapse Functionality**: Tree nodes can be expanded/collapsed to navigate hierarchy
- **Search Feature**: Real-time search with highlighting in tree view
- **Visual Improvements**: Better visual hierarchy with icons and ontology badges
- **Button Selector**: Class field now uses button to open tree modal

### Changed
- Class selection now opens a dedicated modal instead of using dropdown
- Tree view automatically expands to show selected class
- Search functionality filters tree and highlights matching terms
- Modal overlays properly on top of the main creation modal

### Improved
- Better navigation of large class hierarchies
- More intuitive visual representation of inheritance relationships
- Easier to find classes with search functionality
- Clearer distinction between classes from different ontologies

### Technical
- Added `ClassTreeModal` component with TreeNode interface
- Implemented recursive tree rendering with cycle detection
- Added expand/collapse state management
- Search implementation with real-time filtering
- Proper modal stacking for overlays

## [0.5.5] - 2025-08-06

### Improved
- **Enhanced UI/UX**: Complete redesign to match Obsidian's native design language
- **Dropdown Height Limits**: Dropdowns now limited to 40% of viewport height
- **Better Modal Structure**: Proper semantic HTML structure with title, form, and button sections
- **Refined Styling**: Improved spacing, borders, and transitions throughout

### Added
- Custom scrollbars for dropdowns and properties container
- Hover effects for better interactivity
- Proper modal sections with visual separation
- Button container with Obsidian-style CTA button

### Changed
- Dropdowns now have maximum height with scrollbar
- Properties section has improved visual hierarchy
- Form elements have consistent spacing and alignment
- Modal has proper width constraints and responsive design

### Technical
- Added `exocortex-asset-modal` CSS class to modal
- Implemented viewport-relative height calculations
- Used Obsidian CSS variables for consistent theming
- Improved CSS organization and specificity

## [0.5.4] - 2025-08-06

### Added
- **Subclass Instances in Dropdowns**: Object property dropdowns now include instances of subclasses
- **Tree-like Class Hierarchy**: Classes displayed in hierarchical tree structure
- **Multiple Inheritance Support**: Classes with multiple parents appear under each parent
- **Cycle Detection**: Detects and displays recursion warnings for circular inheritance

### Changed
- `findAssetsByClass()` now includes assets from all subclasses by default
- Class dropdown shows indented tree structure based on inheritance hierarchy
- Object property dropdowns show assets from target class and all its subclasses

### Improved
- Better visualization of class relationships in the UI
- More comprehensive asset discovery for object properties
- Protection against infinite loops in circular inheritance chains

### Technical
- Added `getAllSubclasses()` method for recursive subclass discovery
- Added `buildClassHierarchyTree()` for constructing inheritance tree
- Added `flattenClassTree()` for converting tree to indented list
- Cycle detection with visited set tracking

## [0.5.3] - 2025-08-06

### Added
- **Field Value Persistence**: Property values are now preserved when switching between classes
- Values are stored per class in a Map structure
- When returning to a previously selected class, all field values are restored

### Improved
- Better user experience when exploring different asset classes
- No data loss when accidentally switching classes
- Fields show saved values when switching back to a class

### Technical
- Added `classPropertyValues` Map to store values for each class
- Save current values before switching to a new class
- Restore saved values when loading properties for a class
- Handle all field types: text, textarea, dropdown, toggle, date, number, array

## [0.5.2] - 2025-08-06

### Added
- **Object Property Dropdowns**: Fields with `exo__ObjectProperty` class now show dropdowns
- Assets matching the class specified in `exo__Property_range` are populated in dropdown
- New method `findAssetsByClass()` to discover assets of a specific class
- Property discovery now detects whether a property is an ObjectProperty

### Changed
- Updated `findPropertiesForClass()` to include `isObjectProperty` flag
- Modal property field generation checks for ObjectProperty and creates dropdowns
- Object property values are stored as wiki links (e.g., `[[AssetName]]`)

### Improved
- Better user experience when selecting related assets through dropdowns
- Clear display of asset labels alongside filenames in dropdowns

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