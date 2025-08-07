# Changelog

All notable changes to the Exocortex Obsidian Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.2] - 2025-08-07

### 📚 Документация синхронизирована с реальностью кода!

**Проблема, которую решили**: Документация проекта отставала от реальной реализации. В CLAUDE.md были теоретические требования BDD-тестирования, которые не использовались, процесс ручного релиза вместо автоматизированного, и отсутствовали документированные архитектурные паттерны, которые уже работают в коде.

**Что получает пользователь**:
- **🎯 Точная документация**: Теперь все инструкции соответствуют реальному коду
- **🏗️ Архитектурные паттерны**: Документированы работающие паттерны Clean Architecture, DI, Repository
- **⚙️ Актуальные процессы**: Описан реальный процесс с Jest-тестами и GitHub Actions
- **📈 Ускорение разработки**: Новые разработчики быстрее поймут структуру проекта

**Реальные сценарии использования**:

### Сценарий 1: Новый разработчик присоединяется к проекту
1. Открывает CLAUDE.md - видит актуальную структуру проекта
2. Изучает CLAUDE-PATTERNS.md - понимает используемые паттерны
3. Читает CLAUDE-IMPLEMENTATION.md - знает технический стек
4. Начинает работу, следуя реальным, а не теоретическим практикам

### Сценарий 2: Добавление новой функциональности
1. Смотрит в документацию - видит слои Clean Architecture
2. Следует паттернам Repository и DI Container
3. Пишет Jest-тесты вместо несуществующих BDD
4. Код автоматически релизится через GitHub Actions

**Что изменилось в документации**:
- **CLAUDE.md**: Обновлены процессы тестирования (Jest вместо BDD), релизов (автоматизация), структуры кода
- **CLAUDE-PATTERNS.md**: Новый файл с документацией всех архитектурных паттернов
- **CLAUDE-IMPLEMENTATION.md**: Новый файл с техническими спецификациями и конфигурациями

🚀 **Обновитесь для получения актуальной документации, соответствующей коду!**

## [0.6.1] - 2025-08-07

### 🔧 Редактирование свойств снова работает идеально!

**Проблема, которую решили**: При попытке изменить свойства ассета через визуальный интерфейс появлялось уведомление об успешном сохранении, но на самом деле изменения не сохранялись. Это происходило из-за того, что система не могла правильно найти и обновить файл.

**Что получает пользователь**:
- **✅ Надёжное сохранение**: Все изменения свойств теперь гарантированно сохраняются
- **📝 Сохранение контента**: При обновлении свойств содержимое заметки остаётся нетронутым
- **🎯 Точное обновление**: Система правильно находит файлы по ID или пути
- **⚡ Мгновенные изменения**: Обновления применяются сразу без перезагрузки

**Реальные сценарии использования**:

### Сценарий 1: Обновление статуса проекта
1. Открываете проект с настроенным layout
2. Кликаете на свойство "Status"
3. Выбираете новое значение из выпадающего списка
4. Нажимаете галочку или Enter
5. Изменение сохранено - можно продолжать работу!

### Сценарий 2: Изменение приоритета задачи
1. В layout задачи видите свойство "Priority"
2. Кликаете для редактирования
3. Меняете значение
4. Сохраняете - всё работает!

**Технические улучшения**:
- Добавлен метод прямого обновления frontmatter по пути файла
- Улучшена логика поиска файлов в репозитории
- Сохранение контента заметки при обновлении свойств
- Поддержка файлов без exo__Asset_uid

🚀 **Обновитесь сейчас и редактируйте свойства без проблем!**

## [0.6.0] - 2025-08-07

### 🎨 Каждый класс ассетов теперь имеет свой уникальный интерфейс!

**Проблема, которую решили**: Раньше все ассеты - проекты, задачи, области - отображались одинаково. Вы не могли видеть незавершённые задачи прямо в проекте или дочерние области в родительской области. Приходилось постоянно переключаться между заметками, чтобы увидеть связанную информацию.

**Что получает пользователь**:
- **🎯 Контекстная информация**: Каждый класс показывает именно то, что нужно
- **📊 Умные запросы**: Автоматические списки связанных ассетов с фильтрами
- **⚡ Быстрая навигация**: Вся важная информация на одном экране
- **🛠️ Полная кастомизация**: Создавайте свои layouts через конфигурационные файлы
- **🔄 Гибкие блоки**: Query, Properties, Relations, Backlinks, Custom

**Реальные сценарии использования**:

### Сценарий 1: Управление проектом
1. Открываете проект "Разработка сайта"
2. Сразу видите блок "📝 Активные задачи" с незавершёнными задачами
3. Блок "✅ Завершённые задачи" свёрнут, но доступен одним кликом
4. Блок "🎯 Вехи проекта" показывает ключевые даты в таблице
5. Всё на одном экране - никаких переходов!

### Сценарий 2: Организация областей
1. Открываете область "Разработка"
2. Видите карточки всех подобластей: "Frontend", "Backend", "DevOps"
3. Таблица активных проектов этой области с приоритетами
4. Список целей области с дедлайнами
5. Иерархическая навигация без потери контекста

### Сценарий 3: Создание своего layout
1. Создаёте файл `Layout - ems__MyClass.md` в папке layouts
2. Настраиваете блоки в frontmatter:
   ```yaml
   ui__ClassLayout_blocks:
     - type: "query"
       className: "ems__Task"
       propertyFilters:
         - property: "status"
           operator: "notEquals"
           value: "Done"
   ```
3. Сохраняете и сразу видите результат!

**Возможности конфигурации**:
- **Query блоки**: Фильтруйте ассеты по любым критериям
- **Properties блоки**: Редактируемые и readonly свойства
- **Relations блоки**: Прямые и обратные связи
- **Backlinks блоки**: Входящие ссылки с группировкой
- **Custom блоки**: Dataview запросы и JavaScript

**Примеры готовых layouts**:
- `ems__Project`: Задачи, вехи, документы
- `ems__Area`: Подобласти, проекты, цели
- `ems__Task`: Подзадачи, зависимости, история

🚀 **Обновитесь и настройте идеальные представления для каждого типа ассетов!**

### Технические детали
- Новая система Class-Based Layouts
- Поддержка приоритетов и наследования
- Кэширование для производительности
- Полная обратная совместимость

## [0.5.15] - 2025-08-07

### 🔗 Связи между заметками больше не ломаются!

**Проблема, которую решили**: При редактировании свойств через визуальный интерфейс ассетов терялись кавычки вокруг wikilinks (`[[ИмяЗаметки]]`), что приводило к поломке связей между заметками. Obsidian переставал распознавать эти ссылки, и граф знаний разрушался.

**Что получает пользователь**:
- **🔒 Защищённые связи**: Wikilinks всегда сохраняются корректно в кавычках
- **🎯 Целостность графа**: Все связи между заметками остаются активными
- **✨ Беспроблемное редактирование**: Изменяйте свойства через UI без страха потерять связи
- **🔄 Автоматическая корректность**: Система сама определяет, когда нужны кавычки

**Реальные сценарии использования**:

### Сценарий 1: Редактирование связанных проектов
1. Открываете заметку проекта
2. В свойстве "Связанные задачи" видите `[[Задача 1]]`, `[[Задача 2]]`
3. Редактируете любое свойство через визуальный интерфейс
4. Связи сохраняются корректно - граф остаётся целостным!

### Сценарий 2: Управление командой
1. В заметке сотрудника есть свойство "Руководитель": `[[Иван Иванов]]`
2. Меняете другие свойства (должность, отдел)
3. Ссылка на руководителя остаётся рабочей
4. Обратные ссылки продолжают работать

**До исправления**: `exo__Instance_class: [[MyClass]]` превращалось в `exo__Instance_class: MyClass` ❌

**После исправления**: `exo__Instance_class: "[[MyClass]]"` остаётся корректным ✅

🚀 **Обновитесь сейчас и забудьте о проблемах со связями навсегда!**

## [0.5.14] - 2025-08-07

### 🛡️ Гарантия качественных Release Notes навсегда!

**Проблема решена**: Больше никогда не будет скучных технических release notes без пользовательской ценности!

**Что сделано**:
- **📝 Release Template**: Создан мощный шаблон для идеальных release notes
- **✅ Pre-Release Checklist**: Обязательная проверка перед каждым релизом
- **📚 Примеры и антипримеры**: Наглядная демонстрация хорошего и плохого
- **🔴 Усиленные правила**: CLAUDE.md теперь содержит железные требования к релизам
- **🎯 Product Manager Mode**: Обязательное переключение в роль PM при создании релизов

**Гарантии для пользователей**:
- Каждый релиз объяснит, что вы получаете
- Реальные сценарии использования в каждом релизе
- Понятный язык без технического жаргона
- Эмоциональная подача, которую приятно читать

## [0.5.13] - 2025-08-07

### 📝 Documentation & Release Management Excellence

**For Users**: All previous releases now have beautiful, user-focused documentation that explains benefits, use cases, and real-world scenarios!

**For Developers**: Enforced Release Manager role compliance - every release now follows product management best practices with engaging, benefit-focused descriptions.

### 🎯 What Changed
- **Release Notes Transformation**: Rewrote v0.5.10, v0.5.11, and v0.5.12 release notes with product focus
- **User Value Focus**: Each release now clearly explains "What's in it for me?"
- **Real Scenarios**: Added practical use cases and examples
- **Visual Structure**: Better formatting with emojis, sections, and highlights
- **Engagement**: Made release notes exciting and worth reading!

## [0.5.12] - 2025-08-07

### 📱 Perfect Mobile Experience for iPhone Users

**The Problem We Solved**: Using Obsidian on iPhone was painful - tiny buttons, constant zooming, cut-off modals. Not anymore!

**What You Get**:
- **Full-Screen Modals**: Use 100% of your iPhone screen
- **44px Touch Targets**: Apple's recommended size - easy to tap!
- **No More Zoom**: 16px fonts prevent unwanted scaling
- **Smart Tables**: Convert to cards on mobile for readability
- **Safe Areas**: Perfect display on iPhone 13 Pro and newer
- **Smooth Scrolling**: Native iOS momentum scrolling

**Real Use Case**: Take notes on the subway, edit properties with one hand, sync across all devices seamlessly!

## [0.5.11] - 2025-08-07

### 🚀 Never Miss a Release Again - Full Automation!

**The Problem We Solved**: Developers forget to create releases, users miss updates, important fixes stay hidden. This ends now!

**What You Get**:
- **Instant Updates**: Every code change = automatic release in 2-3 minutes
- **Zero Manual Work**: Push code → GitHub Actions → Release ready!
- **100% Coverage**: Physically impossible to forget a release now
- **Transparency**: Every change documented and released

**Real Impact**: Critical bug at 14:00? Fixed and released by 14:20. Your users get fixes in minutes, not days!

## [0.5.10] - 2025-08-07

### 🤖 Your AI Pair Programmer is Here!

**The Game Changer**: Imagine having a senior developer who never sleeps, instantly reviews your code, and answers any question about your codebase!

**What You Get**:
- **Instant Code Reviews**: Just type `@claude` in any PR
- **Bug Detective**: AI finds issues before they become problems  
- **24/7 Tech Support**: Get answers about your code anytime
- **Learning Assistant**: Perfect for onboarding new team members

**Real Scenarios**:
- "Help, I have error X!" → `@claude help fix this` → Solution in seconds
- "How does this module work?" → `@claude explain` → Detailed explanation
- "Review my PR" → `@claude check performance` → Professional code review

**Try it now**: Create an issue with `@claude help` and see the magic!

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