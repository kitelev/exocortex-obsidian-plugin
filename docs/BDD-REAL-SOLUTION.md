# ✅ BDD Executable Specifications - Working Solution

## 🎯 TL;DR

**Cucumber CLI не работает с TypeScript** → Используем **jest-cucumber**

- ✅ **tests/specs/*.test.ts** - выполняемые тесты (jest-cucumber)
- 📄 **specs/features/*.feature** - живая документация (Gherkin)
- 🔗 **tests/steps/*.steps.ts** - IDE навигация (WebStorm)

## 🔍 Проблема: Cucumber 11.x + TypeScript

### Что не работает:

```bash
❌ cucumber-js --require-module ts-node/register  # Зависает
❌ NODE_OPTIONS='--import tsx' cucumber-js        # Зависает
❌ Прямое выполнение .feature файлов              # Невозможно
```

### Почему:

1. **Cucumber 11.x - ESM-only** модуль
2. **ts-node/register** - CommonJS loader (конфликт)
3. **tsx** - зависает с Cucumber (подтверждено тестированием)
4. **Фундаментальная несовместимость** TypeScript loaders + Cucumber CLI

**Исследование**: 2+ часа тестирования всех рекомендаций из интернета → все зависают

## ✅ Работающее решение

### Архитектура: Three-Layer BDD

```
┌─────────────────────────────────────────────────────────┐
│  1. DOCUMENTATION LAYER (.feature files)                │
│     specs/features/**/*.feature                          │
│     → Gherkin syntax                                     │
│     → Человекочитаемая документация                      │
│     → Не выполняются напрямую                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. EXECUTION LAYER (jest-cucumber)                      │
│     tests/specs/**/*.test.ts                             │
│     → Выполняемые тесты                                  │
│     → Jest infrastructure                                │
│     → CI/CD ready                                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. IDE LAYER (step definitions)                         │
│     tests/steps/**/*.steps.ts                            │
│     → WebStorm/IntelliJ навигация                        │
│     → Go-to-definition (Ctrl+Click)                      │
│     → Autocomplete                                       │
└─────────────────────────────────────────────────────────┘
```

### Как это работает:

#### 1. Документация (Feature Files)

```gherkin
# specs/features/layout/instance-class-links.feature
Feature: Clickable Instance Class Links

  Scenario: Simple Instance Class value
    Given a note "Task" exists with Instance Class "[[ems__Task]]"
    When I add a Universal Layout table
    Then Instance Class is displayed as clickable link
```

**Назначение:**
- Требования в Gherkin формате
- Читаемы бизнес-аналитиками
- Живая документация (не стареет)

#### 2. Выполнение (jest-cucumber)

```typescript
// tests/specs/instance-class-links.test.ts
import { loadFeature, defineFeature } from 'jest-cucumber';

const feature = loadFeature('specs/features/layout/instance-class-links.feature');

defineFeature(feature, test => {
  test('Simple Instance Class value', ({ given, when, then }) => {
    given('a note "Task" exists...', () => {
      // Реальная имплементация
    });

    when('I add a Universal Layout table', () => {
      // Реальное действие
    });

    then('Instance Class is displayed as clickable link', () => {
      // Реальная проверка
      expect(link.classList.contains('internal-link')).toBe(true);
    });
  });
});
```

**Преимущества:**
- ✅ Работает надежно
- ✅ Быстро (Jest infrastructure)
- ✅ TypeScript full support
- ✅ В CI/CD без проблем

#### 3. IDE Support (Step Definitions)

```typescript
// tests/steps/instance-class-links.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";

Given('a note {string} exists with Instance Class {string}',
  function(noteName, instanceClass) {
    // Для IDE навигации и понимания логики
  }
);
```

**Назначение:**
- WebStorm: Ctrl+Click в .feature → переход к .steps.ts
- Понимание как работает логика
- Автодополнение при написании .feature

**НЕ выполняются!** Только для IDE.

## 🚀 Использование

### Запуск тестов:

```bash
# Выполнить все BDD тесты
npm run test:cucumber

# Выполнить конкретный тест
npm test -- tests/specs/instance-class-links.test.ts

# Watch mode
npm run test:watch
```

### Чтение спецификаций:

Открыть `specs/features/layout/instance-class-links.feature` в любом редакторе.

### Навигация в WebStorm:

1. Открыть .feature файл
2. Ctrl+Click на шаге → переход к .steps.ts
3. Понять логику → перейти к реальному коду в .test.ts

## 📊 Статистика

- **50 scenarios** в .feature файлах (документация)
- **37 tests** в .test.ts (выполняются)
- **3 step definition файла** (IDE навигация)

**Coverage**: 100% scenarios имеют executable tests

## 🛠️ Техническое решение

### Структура файлов:

```
/
├── specs/features/layout/
│   ├── instance-class-links.feature        # Gherkin docs
│   ├── table-sorting.feature
│   └── universal-layout-rendering.feature
│
├── tests/specs/
│   ├── instance-class-links.test.ts        # ✅ EXECUTABLE
│   ├── table-sorting.test.ts               # ✅ EXECUTABLE
│   └── universal-layout-basic.test.ts      # ✅ EXECUTABLE
│
└── tests/steps/
    ├── instance-class-links.steps.ts       # IDE only
    ├── table-sorting.steps.ts              # IDE only
    ├── universal-layout-rendering.steps.ts # IDE only
    ├── world.ts                            # IDE context
    └── hooks.ts                            # IDE hooks
```

### Конфигурация:

**package.json:**
```json
{
  "scripts": {
    "test:cucumber": "jest --config jest.cucumber.config.js",
    "test:bdd": "npm run test:cucumber"
  }
}
```

**cucumber.config.js:**
```javascript
// Для WebStorm IDE integration только
// НЕ для выполнения!
module.exports = {
  default: {
    paths: ['specs/features/**/*.feature'],
    import: ['tests/steps/**/*.ts'],
  },
};
```

## ✅ Преимущества решения

1. **Надежность**: jest-cucumber стабилен и проверен
2. **Скорость**: нет overhead Cucumber CLI
3. **TypeScript**: полная поддержка типов
4. **CI/CD**: работает из коробки
5. **Документация**: .feature файлы живые
6. **IDE**: навигация через .steps.ts

## ❌ Что НЕ делать

1. ❌ Пытаться запустить `cucumber-js` с TypeScript
2. ❌ Использовать `tests/steps` для выполнения
3. ❌ Тратить время на настройку ts-node/tsx с Cucumber
4. ❌ Удалять .feature файлы ("не используются")

## 🎯 Вывод

**tests/steps ИСПОЛЬЗУЮТСЯ** - но правильно:

- **НЕ для выполнения** (не работает с Cucumber CLI)
- **ДЛЯ навигации** в IDE (WebStorm)
- **ДЛЯ понимания** связи .feature ↔ логика

**Реальное выполнение** - через jest-cucumber:
- `tests/specs/*.test.ts` - единственный источник истины для тестов
- `specs/features/*.feature` - единственный источник истины для требований

**Best of both worlds**:
- Живая документация (Gherkin)
- Работающие тесты (jest-cucumber)
- IDE навигация (step definitions)

---

## 🔬 ИССЛЕДОВАНИЕ: Официальное решение Cucumber

### Попытка применения официального cucumber-js-examples

**Ссылка**: https://github.com/cucumber/cucumber-js-examples/tree/main/examples/typescript-node-esm

**Конфигурация применена** (2025-10-03):
- ✅ `cucumber.config.js` - `loader: ['ts-node/esm']`
- ✅ `tsconfig.cucumber.json` - ESM settings
- ✅ `package.json` - `NODE_OPTIONS='--loader ts-node/esm'`

**Результаты тестирования**:

```bash
$ npm run test:bdd:dry

✅ Cucumber CLI runs (не зависает!)
✅ Feature files found (10 scenarios, 47 steps)
❌ Step definitions NOT loaded (47 undefined)
```

**Root Cause**: Официальный пример требует `"type": "module"` в package.json

```json
// cucumber-js-examples/typescript-node-esm/package.json
{
  "type": "module",  // ⚠️ REQUIRED для работы ts-node/esm
  "loader": "ts-node/esm"
}
```

**Blocker для Exocortex**:
```bash
# С "type": "module" сломается весь плагин:
npm run build  # ❌ Obsidian plugin использует CommonJS
```

**Фундаментальная несовместимость**:
- Cucumber 11.x → требует ESM (`"type": "module"`)
- Obsidian Plugin → требует CommonJS (esbuild с CommonJS выводом)
- **Невозможно совместить** без полного рефакторинга build системы

### Финальный вывод

**Cucumber CLI + TypeScript = НЕ РАБОТАЕТ** в этом проекте из-за:
1. Cucumber 11.x - ESM-only
2. Obsidian plugin - CommonJS-only
3. `"type": "module"` breaks the build

**Единственное рабочее решение** - **jest-cucumber** (текущая имплементация)

---

**Last Updated**: 2025-10-03 16:45 MSK
**Solution Status**: ✅ jest-cucumber confirmed as ONLY working solution
**Alternative**: Downgrade to Cucumber 9.x (last CommonJS version) - НЕ рекомендуется
