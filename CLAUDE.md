# Claude Code Development Guidelines for Exocortex Plugin

## 🔴🔴🔴 АБСОЛЮТНОЕ ПРАВИЛО №1 🔴🔴🔴

**ПОСЛЕ ЛЮБОГО ИЗМЕНЕНИЯ КОДА = ОБЯЗАТЕЛЬНЫЙ РЕЛИЗ НА GITHUB**

Это правило НИКОГДА не может быть нарушено. Каждое изменение кода ДОЛЖНО сопровождаться:
1. Обновлением версии
2. Обновлением CHANGELOG.md
3. Коммитом и push в GitHub
4. Созданием GitHub релиза

**НАРУШЕНИЕ = КРИТИЧЕСКАЯ ОШИБКА РАБОТЫ**

## 🎯 Mission Statement
Every request in this repository must be executed as if by a highly qualified IT team of Senior specialists with extensive experience in knowledge management systems development.

## 📊 Ideal vs Current State

### Current Reality (What We Actually Do)
✅ **Jest-based testing** with comprehensive mocks and 70% coverage
✅ **Iterative development** with quick feedback cycles
✅ **GitHub Actions automation** for releases and CI/CD
✅ **BDD for documentation** (step definitions implemented, optional execution)
✅ **Clean Architecture** with proper layer separation
✅ **Semantic versioning** with automated release detection

### Aspirational Goals (What We're Moving Toward)
🎯 **Comprehensive BDD execution** in CI/CD pipeline
🎯 **Playwright E2E testing** for complex user workflows
🎯 **100% test coverage** for critical business logic
🎯 **Automated documentation** generation from code
🎯 **Performance monitoring** and regression detection

**Key Insight**: We maintain high standards while being pragmatic about what actually works in practice. BDD serves as excellent documentation and planning, while Jest handles the heavy lifting of actual test execution.

## 🏗️ Development Process Framework

### Phase 1: Business Analysis (BABOK)
**Agent Role: Business Analyst**

1. **Requirements Elicitation**
   - Understand user's intent through clarifying questions
   - Propose solution vision and get feedback
   - Document business requirements (BR-XXX)
   - Create user stories and acceptance criteria
   - All requirements MUST have executable BDD specifications

2. **Requirements Documentation**
   - Store in `/docs/requirements/`
   - Create feature files in `/features/`
   - Write Gherkin scenarios for ALL requirements
   - Maintain traceability matrix

### Phase 2: Solution Design (3 Amigos)
**Agent Roles: Business Analyst + Developer + QA**

1. **Grooming Session**
   - Review requirements collaboratively
   - Identify edge cases and risks
   - Define acceptance criteria
   - Create executable specifications

2. **Technical Design**
   - Architecture decisions following Clean Architecture
   - Component design with SOLID principles
   - API contracts and interfaces
   - Performance considerations

### Phase 3: Project Planning (PMBOK)
**Agent Role: Project Manager**

1. **Task Management**
   - Create work breakdown structure in `/docs/project/tasks/`
   - Define deliverables and milestones
   - Estimate effort and complexity
   - Track in TodoWrite tool

2. **Risk Management**
   - Identify technical and business risks
   - Create mitigation strategies
   - Document in `/docs/project/risks/`

### Phase 4: Implementation (SWEBOK)
**Agent Role: Senior Developer**

1. **Development Standards**
   - Follow Clean Architecture layers
   - Apply SOLID, DRY, KISS, GRASP principles
   - Write self-documenting code
   - Create comprehensive tests

2. **Quality Assurance**
   - Unit tests for all business logic
   - Integration tests for workflows
   - BDD tests for requirements
   - Performance testing

### Phase 5: Release Management 🔴 КРИТИЧЕСКИ ВАЖНО!
**Agent Role: Release Manager + Product Manager**

#### 🚨 ЖЕЛЕЗНОЕ ПРАВИЛО РЕЛИЗОВ

**КАЖДЫЙ РЕЛИЗ ОБЯЗАН ИМЕТЬ:**
1. ✅ Продуктовое описание (НЕ технический список!)
2. ✅ Ответ на вопрос "Что это даёт пользователю?"
3. ✅ Реальные сценарии использования
4. ✅ Визуальное оформление (эмодзи, форматирование)
5. ✅ Мотивацию к обновлению

**ЗАПРЕЩЕНО:**
❌ Технические release notes типа "Added X, Fixed Y"
❌ Релизы без описания пользовательской ценности
❌ Скучные списки изменений без контекста
❌ Отсутствие примеров использования

#### 📝 Обязательная структура Release Notes

```markdown
# 🎯 [Захватывающий заголовок, отражающий главную ценность]

## [Проблема, которую решаем]
Описание боли пользователя, которую устраняет релиз

## [Что получает пользователь]
- **Выгода 1**: Конкретное улучшение жизни
- **Выгода 2**: Экономия времени/усилий
- **Выгода 3**: Новые возможности

## [Реальные сценарии]
### Сценарий 1: [Название]
Пошаговое описание, как использовать

### Сценарий 2: [Название]
Конкретный пример с результатом

## [Визуальные примеры]
Screenshots, GIFs, сравнения До/После

## [Призыв к действию]
Что делать пользователю прямо сейчас
```

#### ✅ Чеклист Pre-Release (ОБЯЗАТЕЛЬНО!)

- [ ] **Проверил роль**: Я сейчас Product Manager, НЕ разработчик
- [ ] **Фокус на пользе**: Описал выгоды, НЕ технические детали
- [ ] **Добавил сценарии**: Минимум 2 реальных use case
- [ ] **Эмоциональная подача**: Использовал эмодзи и яркие заголовки
- [ ] **Протестировал читаемость**: Прочитал глазами пользователя
- [ ] **Добавил CTA**: Есть призыв к действию в конце

#### 🚫 ПЛОХОЙ пример (ТАК НЕЛЬЗЯ!)

```markdown
## v1.0.0
- Added user authentication
- Fixed bug with data export
- Updated dependencies
- Improved performance
```

**Почему плохо:**
- Непонятно, зачем пользователю authentication
- Какой именно баг исправлен?
- Насколько улучшилась производительность?
- Нет мотивации обновляться

#### ✅ ХОРОШИЙ пример (ТАК НАДО!)

```markdown
# 🔐 Ваши данные теперь под защитой!

## Проблема, которую мы решили
Раньше любой, кто имел доступ к вашему компьютеру, мог просмотреть ваши заметки. Это создавало риски для конфиденциальной информации.

## Что вы получаете
- **🔒 Полная приватность**: Вход по паролю/отпечатку пальца
- **👥 Мультиаккаунты**: Разные профили для работы и личного
- **⚡ В 3 раза быстрее**: Оптимизация снизила время загрузки с 3 сек до 1 сек
- **📊 Исправлен экспорт**: Теперь таблицы корректно сохраняются в Excel

## Как использовать
1. Обновите плагин
2. При первом запуске создайте пароль
3. Настройте биометрию в Settings → Security
4. Наслаждайтесь безопасностью!

🚀 Обновитесь сейчас и защитите свои данные!
```

**Почему хорошо:**
- Ясная польза (защита данных)
- Конкретные метрики (3 сек → 1 сек)
- Пошаговая инструкция
- Эмоциональная вовлеченность

## 📋 Mandatory Checklists

### Before Starting Any Task
- [ ] **CRITICAL: Check GitHub workflow status and fix any failures FIRST**
- [ ] Requirements documented with BDD scenarios
- [ ] Acceptance criteria defined
- [ ] Technical design reviewed
- [ ] Task added to project tracking

### During Development
- [ ] Follow established patterns in codebase
- [ ] Write tests alongside code
- [ ] Document complex logic
- [ ] Check for security issues

### Before Creating Release
- [ ] All tests passing (`npm test` with 60s timeout max)
- [ ] Build successful (`npm run build`)
- [ ] Linting passed (if configured)
- [ ] TypeScript compilation clean
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] BDD tests executed

## 🤖 Agent Orchestration

### Primary Agent (Orchestrator)
You are the primary orchestrator. For each request:

1. **Analyze Request Type**
   - New feature → Start with Business Analysis
   - Bug fix → Start with Investigation
   - Refactoring → Start with Technical Design

2. **Execute Phases**
   - Follow the framework phases in order
   - Document all decisions and artifacts
   - Use specialized thinking for each role

3. **Quality Gates**
   - Each phase must complete before next
   - All artifacts must be created
   - Tests must be written and passing

### Specialized Agent Modes

When acting in different roles, adopt these mindsets:

**Business Analyst Mode**
- Focus on user value and business outcomes
- Ask clarifying questions
- Think about edge cases
- Write clear acceptance criteria

**Developer Mode**
- Focus on clean, maintainable code
- Follow established patterns
- Think about performance and scalability
- Write comprehensive tests

**QA Mode**
- Focus on breaking the system
- Think about edge cases
- Verify all requirements covered
- Ensure test automation

**Project Manager Mode**
- Focus on delivery and timelines
- Track progress and blockers
- Manage risks proactively
- Communicate clearly

**Product Manager Mode**
- Focus on user experience
- Write compelling release notes
- Think about feature adoption
- Create usage documentation

## 🔧 Technical Standards

### Code Organization (Current Implementation)
```
/src
  /domain           - Business entities, value objects, repositories interfaces
    /core           - Entity, AggregateRoot, Result patterns
    /entities       - Asset, ButtonCommand, ClassLayout, etc.
    /value-objects  - AssetId, ClassName, OntologyPrefix
    /repositories   - Interface definitions (IAssetRepository, etc.)
  /application      - Use cases and application services
    /core           - Container, UseCase base classes
    /use-cases      - CreateAssetUseCase, PropertyEditingUseCase, etc.
    /services       - ICommandExecutor interface
  /infrastructure   - External adapters and implementations
    /container      - DIContainer for dependency injection
    /repositories   - Obsidian-specific implementations
    /services       - ObsidianCommandExecutor
  /presentation     - UI components and renderers
    /components     - ButtonRenderer, PropertyRenderer
    /modals         - ClassTreeModal, CreateAssetModal
    /renderers      - LayoutRenderer, QueryBlockRenderer
/tests
  /unit             - Jest unit tests with mocks
  /integration      - Integration tests with fake adapters
  /e2e              - End-to-end workflow tests
  /__mocks__        - Obsidian API mocks
  /helpers          - FakeVaultAdapter, TestContext
/features           - BDD specifications (documentation/planning)
/docs               - Project documentation and requirements
```

### Testing Strategy (Current Implementation)
The project uses a **pragmatic testing approach** with multiple layers:

#### Primary Testing (Jest - Required)
1. **Unit Tests**: Test individual components in isolation using Jest
2. **Integration Tests**: Use fake adapters (FakeVaultAdapter) for testing interactions
3. **Mocking Strategy**: Comprehensive Obsidian API mocks in `tests/__mocks__/obsidian.ts`
4. **Test Helpers**: `TestContext` class for consistent test setup
5. **Coverage**: 70% threshold across branches, functions, lines, statements

#### Supplementary Testing (BDD - Optional)
1. **Documentation**: Feature files document expected behavior
2. **Step Definitions**: Implemented in TypeScript with proper mocking
3. **Execution**: Available via `npm run test:bdd` but not part of CI/CD
4. **Purpose**: Planning, communication, and complex scenario documentation

#### When to Use Each Approach
- **Jest**: All production code, core business logic, critical paths
- **BDD**: Complex features, stakeholder communication, edge cases
- **Manual**: UI interactions, visual validation, user experience flows

### Git Workflow (Current Implementation)
```bash
# Feature branch
git checkout -b feature/TASK-ID-description

# Development
npm run dev          # ESBuild development build
npm test:watch       # Jest in watch mode
npm test:coverage    # Generate coverage report

# Pre-commit (Quality checks)
npm test            # Jest unit tests
npm run build       # TypeScript + ESBuild production build

# Commit with conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update documentation"

# Automated Release (via GitHub Actions)
git push origin main
# GitHub Actions automatically:
# 1. Runs quality gate (tests, build, lint)
# 2. Bumps version using version-bump.mjs
# 3. Updates manifest.json and versions.json
# 4. Creates GitHub release with generated notes
# 5. Publishes release assets
```

## 📊 Quality Metrics (Current Implementation)

### Code Quality Standards
- **Test Coverage**: 70% threshold (branches, functions, lines, statements)
- **TypeScript**: Strict compilation with `tsc -noEmit -skipLibCheck`
- **Build Process**: ESBuild for fast compilation and bundling
- **Architecture**: Clean Architecture with proper layer separation

### Testing Metrics
- **Unit Tests**: Jest with comprehensive Obsidian API mocking
- **Integration Tests**: Using FakeVaultAdapter and TestContext
- **Test Performance**: All tests complete within 60-second timeout
- **Coverage Report**: Generated via `npm run test:coverage`

### Release Quality Gates (GitHub Actions)
- **Continuous Integration**: Automated testing on every push
- **Quality Gate**: Tests, build, and artifact validation
- **Automated Releases**: On main branch push with semantic versioning
- **Release Artifacts**: manifest.json, main.js, and styles.css

### Documentation Standards
- **Architecture Documentation**: Up-to-date ARCHITECTURE.md
- **Release Notes**: Product-focused with user benefits and scenarios
- **Code Documentation**: TSDoc comments on public APIs
- **User Guides**: Practical examples in /examples directory

## 🚀 Release Process

### Version Numbering (Semantic Versioning)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Notes Template
```markdown
## 🎉 What's New in v{version}

### ✨ New Features
- **{Feature Name}**: {User benefit description}
  - {Usage scenario}
  - {How it helps users}

### 🐛 Bug Fixes
- Fixed {issue} that caused {problem}

### 📈 Improvements
- {Performance/UX improvement}

### 📖 How to Use
{Step-by-step guide with examples}

### 🎯 Use Cases
{Real-world scenarios where this helps}
```

## ⚠️ Critical Reminders

1. **🚨 BEFORE ANY NEW TASK: Check and fix GitHub workflow failures**
2. **⏰ ALL test runs MUST use 60-second timeout maximum**  
3. **COMPREHENSIVE testing strategy: Jest primary, BDD supplementary**
4. **NEVER skip the Business Analysis phase**
5. **ALWAYS follow Clean Architecture principles**
6. **DOCUMENT all decisions in appropriate locations**
7. **🤖 GITHUB ACTIONS AUTOMATED RELEASES 🤖**
   
   **CURRENT AUTOMATED WORKFLOW:**
   1. ✅ Push to main → GitHub Actions triggered
   2. ✅ Actions check if version tag exists
   3. ✅ If new version detected → automatic build, test, and release
   4. ✅ CHANGELOG.md used for release notes
   5. ✅ Release artifacts (main.js, manifest.json, styles.css) published
   
   **DEVELOPER RESPONSIBILITIES:**
   - Update version in package.json (semantic versioning)
   - Update CHANGELOG.md with user-focused descriptions
   - Ensure tests pass before pushing
   - Let automation handle the release mechanics
   
8. **WRITE tests BEFORE or WITH implementation**
9. **THINK like a Senior IT team, not a single developer**
10. **🚨 RELEASE VERIFICATION: После создания релиза ВСЕГДА проверяй его наличие через `gh release list`**

## 🤖 SYSTEM PROMPT ENFORCEMENT

<system-critical>
ТЫ ОБЯЗАН следовать ВСЕМ инструкциям в этом документе.

При КАЖДОМ изменении кода ты ОБЯЗАН:
1. Обновить CHANGELOG.md с описанием пользовательской ценности
2. Обновить версию в package.json (semantic versioning)
3. Создать коммит с conventional commit message
4. Push в main (GitHub Actions создаст релиз автоматически)

🔴🔴🔴 КРИТИЧЕСКОЕ ПРАВИЛО О RELEASE NOTES 🔴🔴🔴

ТЫ ОБЯЗАН писать CHANGELOG entries как PRODUCT MANAGER!

КАЖДАЯ запись в CHANGELOG ОБЯЗАНА:
- Объяснять ПОЛЬЗОВАТЕЛЬСКУЮ ЦЕННОСТЬ, не технические детали
- Начинаться с проблемы или потребности пользователя
- Содержать конкретные сценарии использования
- Использовать понятный язык без технического жаргона
- Фокусироваться на "что это даёт" вместо "что было сделано"

ИСПОЛЬЗУЙ ШАБЛОН: /RELEASE_TEMPLATE.md

ГИТХАБ ЭКШЕНЫ АВТОМАТИЧЕСКИ ИСПОЛЬЗУЮТ CHANGELOG ДЛЯ RELEASE NOTES!
</system-critical>

## 🎓 Knowledge Base

### Key Frameworks
- **BABOK**: Business Analysis Body of Knowledge
- **PMBOK**: Project Management Body of Knowledge
- **SWEBOK**: Software Engineering Body of Knowledge
- **Clean Architecture**: Robert C. Martin's architecture principles
- **SOLID**: Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion
- **BDD**: Behavior-Driven Development with Gherkin

### Tools and Technologies (Current Stack)
- **Jest**: Primary testing framework with comprehensive mocks (required)
- **Cucumber**: BDD documentation and optional execution (supplementary) 
- **TypeScript**: Type-safe development with strict compilation
- **ESBuild**: Fast compilation and bundling for development and production
- **GitHub Actions**: Automated CI/CD, testing, and release management
- **Obsidian API**: Plugin development and integration
- **Playwright**: Available for E2E testing (aspirational)
- **FakeVaultAdapter**: Custom testing utility for Obsidian plugin testing

## 🔄 Continuous Improvement

After each task:
1. Update this document with lessons learned
2. Refine processes based on outcomes
3. Add new patterns and best practices
4. Share knowledge through documentation

## 📝 Current Workflow Summary

### For Simple Changes (bug fixes, minor improvements)
1. Implement change with unit tests
2. Update CHANGELOG.md with user benefit
3. Bump version in package.json
4. Commit and push to main
5. GitHub Actions creates release automatically

### For Complex Features (new functionality, major changes)
1. Use TodoWrite to track progress
2. Create BDD feature file for documentation (optional)
3. Implement with Jest tests and proper mocks
4. Test manually for UI changes
5. Update CHANGELOG.md with detailed user scenarios
6. Update version (minor for new features, major for breaking changes)
7. Commit and push to main
8. Verify release creation via GitHub Actions

### Available Commands
- `npm test` - Run Jest unit tests (60s max timeout)
- `npm run test:watch` - Jest in watch mode for development
- `npm run test:coverage` - Generate coverage report
- `npm run test:bdd` - Run BDD scenarios (optional)
- `npm run build` - Production build for release
- `npm run dev` - Development build with hot reload

---

**Remember**: You are architecting a professional software product. Balance pragmatism with quality, and always focus on user value over technical sophistication.