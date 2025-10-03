# Test Structure - BDD-First Approach

## 📊 Test Summary

**Total:** 37 tests across 4 test suites
**Status:** ✅ 100% passing
**Approach:** BDD (Behavior-Driven Development) first

## 📁 Test Organization

### BDD Tests (Primary) - `tests/specs/`

#### 1. **instance-class-links.test.ts** (14 tests)
**Purpose:** Instance Class кликабельные ссылки

**Coverage:**
- ✅ Простое значение Instance Class → internal-link
- ✅ Массив значений → первое значение как ссылка
- ✅ Клик на ссылку → открытие файла класса
- ✅ Отсутствующий Instance Class → "-"
- ✅ Instance Class с префиксом → сохранение префикса
- ✅ Форматирование wiki-link синтаксиса → удаление [[]]
- ✅ Обработка пустых значений (null, undefined, "", [])
- ✅ Регрессионный тест (FAILS - документирует баг)

#### 2. **table-sorting.test.ts** (10 tests)
**Purpose:** Интерактивная сортировка таблиц

**Coverage:**
- ✅ Переключение asc → desc → asc (цикл)
- ✅ Сортировка по Instance Class
- ✅ Использование чистого значения (без [[]])
- ✅ Снятие индикатора с предыдущей колонки
- ✅ Замена ▲ ↔ ▼
- ✅ Дефолтная сортировка при рендере
- ✅ Работа getPropertyValue
- ✅ Сортировка одинаковых значений

#### 3. **universal-layout-basic.test.ts** (6 tests)
**Purpose:** Базовый рендеринг Universal Layout

**Coverage:**
- ✅ Отображение таблицы с правильными колонками
- ✅ Корректный Relation Type
- ✅ Рендеринг пустой таблицы
- ✅ Автоматическое скрытие архивных заметок
- ✅ Обработка relations без metadata
- ✅ Обработка relations с пустым metadata

### Unit Tests (Специализированные) - `tests/unit/`

#### 4. **DynamicLayoutRenderer.defaultLayout.test.ts** (7 tests)
**Purpose:** Тестирование DynamicLayoutRenderer

**Coverage:**
- ✅ Default layout support
- ✅ Layout file loading
- ✅ Fallback mechanisms
- ✅ Error handling

## 🎯 BDD-First Philosophy

### Why BDD First?

1. **User-Centric:** Тесты описывают поведение с точки зрения пользователя
2. **Living Documentation:** Тесты = актуальная документация требований
3. **Business Value:** Каждый тест привязан к бизнес-требованию
4. **Executable Specs:** Требования выполняются как код

### Test Structure Pattern

```typescript
describe("Feature: <Название функции>", () => {
  describe("Правило: <Бизнес-правило>", () => {
    describe("Сценарий: <Конкретный сценарий>", () => {
      it("должен <ожидаемое поведение>", async () => {
        // Given - начальное состояние
        // When - действие
        // Then - ожидаемый результат
      });
    });
  });
});
```

## 📈 Test Coverage by Feature

| Feature | BDD Tests | Coverage |
|---------|-----------|----------|
| Instance Class Links | 14 | ✅ Complete |
| Table Sorting | 10 | ✅ Complete |
| Universal Layout | 6 | ✅ Core scenarios |
| Dynamic Layout | 7 | ✅ Complete |

## 🔄 What Was Removed (Deduplication)

### Eliminated Duplication:
- ❌ `instance-class-core.test.ts` (3 tests) - дублировал instance-class-links
- ❌ `UniversalLayoutRenderer.test.ts` (17 tests) - дублировал BDD тесты
- ❌ `instance-class-core.feature` - упрощенный feature file

### Why Removed?
1. **Duplication:** Те же сценарии тестировались дважды
2. **Maintenance:** Больше кода для поддержки
3. **Clarity:** BDD тесты более читаемы и понятны

## 🚀 Running Tests

```bash
# Все тесты
npm test

# Только BDD тесты
npm run test:cucumber

# Конкретный feature
npm test -- tests/specs/instance-class-links.test.ts

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📝 Adding New Tests

### 1. Create BDD Test (Primary)
```typescript
// tests/specs/my-feature.test.ts
describe("Feature: My New Feature", () => {
  describe("Правило: <Business Rule>", () => {
    describe("Сценарий: Basic behavior", () => {
      it("должен <expected behavior>", async () => {
        // Given - начальное состояние
        const initialState = setupState();

        // When - действие
        const result = await performAction();

        // Then - ожидаемый результат
        expect(result).toBe(expected);
      });
    });
  });
});
```

### 2. Create Feature File (Optional - for documentation)
```gherkin
# specs/features/layout/my-feature.feature
Feature: My New Feature

  Rule: <Business Rule>

    Scenario: Basic behavior
      Given initial state
      When action happens
      Then expected result
```

### 3. Run & Iterate
```bash
npm test -- tests/specs/my-feature.test.ts
```

## ✅ Quality Gates

Before merging:
- ✅ All tests passing (37/37)
- ✅ No duplicate tests
- ✅ BDD format for user scenarios
- ✅ Clear test names describing behavior
- ✅ Given-When-Then structure

## 🔧 WebStorm IDE Integration

### Executable .feature Files in WebStorm

All `.feature` files are now executable directly from WebStorm IDE with:

- ✅ **No yellow underlines** - all steps have definitions
- ✅ **Go-to-definition** - Ctrl+Click navigates to step implementation
- ✅ **Autocomplete** - IntelliSense for Gherkin steps
- ✅ **Run from IDE** - Right-click → Run individual scenarios

### Setup Instructions

See [WebStorm Cucumber Setup Guide](./WEBSTORM-CUCUMBER-SETUP.md) for:
1. Plugin installation
2. Configuration steps
3. Run/Debug setup
4. Troubleshooting

### Step Definitions Architecture

```
tests/steps/
├── universal-layout-rendering.steps.ts  # English step definitions
├── instance-class-links.steps.ts        # English step definitions
├── table-sorting.steps.ts               # English step definitions
├── world.ts                             # Cucumber World context
└── hooks.ts                             # Before/After hooks
```

**Support**:
- **WebStorm IDE**: Uses `*.steps.ts` via `@cucumber/cucumber`
- **CI/CD Tests**: Uses `*.test.ts` via `jest-cucumber`
- **No Duplicates**: Clean structure with single source of truth

## 📚 Related Documentation

- [WebStorm Cucumber Setup](./WEBSTORM-CUCUMBER-SETUP.md) - IDE integration guide
- [Executable Specifications Guide](./EXECUTABLE-SPECIFICATIONS.md)
- [Cucumber Issue Explained](./CUCUMBER-ISSUE-EXPLAINED.md)
- [Feature Files](../specs/features/layout/)

---

**Last Updated:** 2025-10-03
**Test Count:** 37 passing
**Approach:** BDD-First with jest-cucumber
**IDE Support:** WebStorm Cucumber integration enabled
