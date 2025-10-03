# ✅ BDD Testing Best Practices для Obsidian Plugins

**Основано на исследовании сообщества Obsidian (2024-2025)**

## 🎯 TL;DR

**Для Obsidian плагинов рекомендуется:**
- ✅ **jest-cucumber** - BDD поверх Jest infrastructure
- ✅ **jest-environment-obsidian** - автоматический shimming Obsidian API
- ✅ **Manual mocks** - для тонкой настройки (опционально)
- ❌ **Cucumber CLI** - не рекомендуется (ESM/CommonJS конфликты)

## 📊 Экосистема тестирования Obsidian плагинов

### 1. **jest-environment-obsidian** (Официальное сообщество)

**Ссылка**: https://github.com/obsidian-community/jest-environment-obsidian

**Назначение**: Автоматический shimming Obsidian API для Jest тестов

**Установка**:
```bash
npm install --save-dev jest-environment-obsidian
```

**Требования**:
- NodeJS >= 15.0.0
- Jest >= 29.0.0

**Использование**:

```javascript
// jest.config.js - глобально для всех тестов
module.exports = {
    preset: 'jest-environment-obsidian'
}
```

Или для конкретного теста:
```typescript
/**
 * @jest-environment jest-environment-obsidian
 */
import { Plugin } from 'obsidian';

describe('My Plugin', () => {
  // Тесты с shimmed Obsidian API
});
```

**Преимущества**:
- ✅ Автоматический shimming - не нужны `__mocks__/obsidian.ts`
- ✅ Поддержка большинства Obsidian API
- ✅ Активная поддержка сообщества
- ✅ Быстрое начало работы

**Ограничения**:
- ⚠️ Work in progress - не все API реализованы
- ⚠️ Могут быть расхождения с реальным поведением

### 2. **jest-cucumber** (BDD Framework)

**Ссылка**: https://www.npmjs.com/package/jest-cucumber

**Назначение**: BDD подход поверх Jest

**Почему jest-cucumber для Obsidian?**
1. ✅ Использует Jest infrastructure (совместимо с jest-environment-obsidian)
2. ✅ Не требует ESM (`"type": "module"`)
3. ✅ Работает с CommonJS build systems (Obsidian plugins)
4. ✅ TypeScript full support
5. ✅ Быстрая обратная связь (TDD principle)

**Пример использования**:

```gherkin
# specs/features/plugin-settings.feature
Feature: Plugin Settings
  Scenario: User changes setting
    Given plugin is loaded
    When user changes "enableFeature" to true
    Then setting is saved to vault
```

```typescript
// tests/specs/plugin-settings.test.ts
import { loadFeature, defineFeature } from 'jest-cucumber';

const feature = loadFeature('specs/features/plugin-settings.feature');

defineFeature(feature, test => {
  test('User changes setting', ({ given, when, then }) => {
    let plugin: MyPlugin;

    given('plugin is loaded', () => {
      plugin = new MyPlugin();
    });

    when(/user changes "(.*)" to (.*)/, (setting, value) => {
      plugin.settings[setting] = value === 'true';
    });

    then('setting is saved to vault', () => {
      expect(plugin.saveData).toHaveBeenCalled();
    });
  });
});
```

### 3. **Manual Mocking Strategy**

**Подход от Peter Strøiman** (Writing an Obsidian Plugin Driven By Tests)

**Принципы**:
1. **Generics для абстракции** - минимизация зависимостей
2. **Interface segregation** - маленькие, типобезопасные интерфейсы
3. **Fake implementations** - легковесные моки

**Пример**:

```typescript
// Абстракция для тестирования
interface GenericFileManager<TFile> {
  processFrontMatter(file: TFile, fn: (frontmatter: any) => void): Promise<void>;
}

// Бизнес-логика не зависит от Obsidian напрямую
class Publisher<TFile> {
  constructor(private fileManager: GenericFileManager<TFile>) {}

  async publish(file: TFile) {
    await this.fileManager.processFrontMatter(file, (fm) => {
      fm.published = true;
    });
  }
}

// Тест с fake implementation
describe('Publisher', () => {
  it('marks file as published', async () => {
    const fakeFileManager: GenericFileManager<any> = {
      processFrontMatter: jest.fn((file, fn) => {
        const fm = {};
        fn(fm);
        return Promise.resolve();
      })
    };

    const publisher = new Publisher(fakeFileManager);
    await publisher.publish({});

    expect(fakeFileManager.processFrontMatter).toHaveBeenCalled();
  });
});
```

**Результат**: "50% функциональности работало с первого раза в Obsidian"

## 🏗️ Архитектурные паттерны

### 1. Separation of Concerns

**Проблема**: Obsidian API создает web of dependencies - сложно тестировать

**Решение**: Отделить бизнес-логику от Obsidian-зависимого кода

```typescript
// ❌ ПЛОХО - всё завязано на Obsidian
class MyPlugin extends Plugin {
  async onload() {
    const files = this.app.vault.getMarkdownFiles();
    const processed = files
      .filter(f => f.name.startsWith('task'))
      .map(f => this.processTask(f));
  }

  processTask(file: TFile) {
    // Бизнес-логика + Obsidian API
  }
}

// ✅ ХОРОШО - бизнес-логика отдельно
class TaskProcessor {
  processTask(fileName: string, content: string): TaskData {
    // Чистая бизнес-логика - легко тестируется
  }
}

class MyPlugin extends Plugin {
  async onload() {
    const processor = new TaskProcessor();
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (file.name.startsWith('task')) {
        const content = await this.app.vault.read(file);
        const result = processor.processTask(file.name, content);
        // Работа с результатом
      }
    }
  }
}
```

### 2. Dependency Injection

**Для тестируемости**:

```typescript
// ✅ Constructor injection
class MyService {
  constructor(
    private vault: IVaultAdapter,  // Интерфейс, не конкретная реализация
    private logger: ILogger
  ) {}
}

// В тестах - fake implementations
const fakeVault: IVaultAdapter = {
  read: jest.fn().mockResolvedValue('fake content'),
  write: jest.fn()
};

const service = new MyService(fakeVault, console);
```

### 3. Test-Driven Development (TDD)

**Принципы для Obsidian плагинов**:

1. **Быстрая обратная связь** - используйте Jest, не запускайте Obsidian
2. **Моки для Obsidian API** - jest-environment-obsidian или manual mocks
3. **Изоляция бизнес-логики** - максимум кода должен работать без Obsidian
4. **Integration tests** - минимум, только для критичных путей

**Цикл TDD**:
```
Red → Green → Refactor → Repeat
 ↓      ↓       ↓
Test  Code  Improve
fails works  quality
```

## 🚀 Рекомендуемый Setup для Obsidian Plugin

### Структура проекта:

```
/
├── src/
│   ├── domain/              # Бизнес-логика (100% coverage)
│   │   └── *.ts             # Чистые функции, легко тестируются
│   │
│   ├── application/         # Use cases (80%+ coverage)
│   │   └── *.ts             # Оркестрация, моки для зависимостей
│   │
│   ├── infrastructure/      # Obsidian adapters (50%+ coverage)
│   │   └── *.ts             # Интеграция с Obsidian API
│   │
│   └── main.ts              # Plugin entry (integration tests)
│
├── tests/
│   ├── unit/                # Jest unit tests
│   │   └── **/*.test.ts     # Моки, изоляция
│   │
│   ├── specs/               # BDD executable tests
│   │   └── **/*.test.ts     # jest-cucumber
│   │
│   └── __mocks__/           # Опционально (если не используете jest-environment-obsidian)
│       └── obsidian.ts
│
├── specs/features/          # Gherkin documentation
│   └── **/*.feature         # Living documentation
│
├── jest.config.js           # Jest configuration
└── package.json
```

### jest.config.js:

```javascript
module.exports = {
  preset: 'jest-environment-obsidian',  // Автоматический shimming

  testEnvironment: 'jest-environment-obsidian',

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/specs/**/*.test.ts'
  ],

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',  // Entry point - integration only
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/domain/': {
      branches: 90,  // Бизнес-логика - высокий порог
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

### package.json scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:bdd": "jest --config jest.cucumber.config.js",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration"
  },
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "jest": "^30.0.0",
    "jest-cucumber": "^4.5.0",
    "jest-environment-obsidian": "^0.0.1",
    "ts-jest": "^29.0.0"
  }
}
```

## 📝 Лучшие практики из сообщества

### ✅ DO:

1. **Используйте jest-cucumber для BDD**
   - Работает с Obsidian plugin build system
   - Совместим с jest-environment-obsidian
   - TypeScript full support

2. **Отделяйте бизнес-логику от Obsidian API**
   - Domain layer - чистые функции
   - Infrastructure layer - Obsidian adapters
   - Application layer - оркестрация

3. **Используйте generics для абстракции**
   - Минимизация зависимостей от конкретных типов
   - Легче писать моки

4. **Пишите .feature файлы как живую документацию**
   - Требования в Gherkin формате
   - Читаемы бизнес-аналитиками
   - Синхронизированы с тестами

5. **Стремитесь к высокому coverage в domain layer**
   - 90%+ для бизнес-логики
   - Меньше для infrastructure (Obsidian integrations)

### ❌ DON'T:

1. **Не используйте Cucumber CLI для TypeScript**
   - Несовместимость Cucumber 11.x ESM с CommonJS build
   - Зависает или не находит step definitions
   - jest-cucumber - лучшая альтернатива

2. **Не смешивайте бизнес-логику с Obsidian API**
   - Сложно тестировать
   - Tight coupling
   - Трудно рефакторить

3. **Не игнорируйте тесты "потому что Obsidian закрыт"**
   - 50%+ кода можно протестировать без Obsidian
   - Используйте моки для остального

4. **Не добавляйте `"type": "module"` в package.json**
   - Сломает Obsidian plugin build (CommonJS)
   - Не требуется для jest-cucumber

5. **Не пытайтесь запускать тесты внутри Obsidian**
   - Медленная обратная связь
   - Нарушает TDD принципы
   - Используйте Jest для unit/BDD tests

## 🔬 Сравнение подходов

### jest-cucumber vs Cucumber CLI

| Критерий | jest-cucumber ✅ | Cucumber CLI ❌ |
|----------|-----------------|-----------------|
| **TypeScript support** | Full | Проблемы с ESM |
| **Obsidian plugin compatibility** | ✅ CommonJS | ❌ Требует ESM |
| **Скорость** | Быстро (Jest) | Медленно |
| **Setup сложность** | Простой | Сложный (зависает) |
| **CI/CD** | Работает из коробки | Требует workarounds |
| **IDE integration** | WebStorm support | WebStorm support |
| **Сообщество** | Активное | Мало примеров для Obsidian |

### jest-environment-obsidian vs Manual Mocks

| Критерий | jest-environment-obsidian | Manual Mocks |
|----------|---------------------------|--------------|
| **Setup** | Автоматический | Ручной |
| **API coverage** | Широкий (WIP) | Только нужное |
| **Точность** | Может отличаться от реального API | Полный контроль |
| **Обновления** | Сообщество поддерживает | Ваша ответственность |
| **Flexibility** | Средняя | Высокая |

**Рекомендация**: Начните с jest-environment-obsidian, добавляйте manual mocks только для специфичных случаев.

## 📚 Примеры из реальных плагинов

### Плагины с Jest тестами:

1. **flashcards-obsidian** - использует Jest с TypeScript
2. **obsidian-tasks** - рассматривал eslint-plugin-jest
3. **obsidian-sample-plugin-with-tests** - Mocha + Chai (альтернатива)

### Ресурсы сообщества:

- **Obsidian Hub**: Guides для тестирования плагинов
- **Obsidian Forum**: "Unit Testing Your Plugins (AKA Automating Obsidian)"
- **GitHub**: obsidian-community/jest-environment-obsidian
- **DEV.to**: "Writing an Obsidian Plugin Driven By Tests" (Peter Strøiman)

## 🎯 Выводы для Exocortex Plugin

### Текущая архитектура ✅ СООТВЕТСТВУЕТ Best Practices:

1. ✅ **jest-cucumber** - правильный выбор для Obsidian BDD
2. ✅ **Three-layer architecture**:
   - `.feature` - живая документация
   - `tests/specs/*.test.ts` - executable (jest-cucumber)
   - `tests/steps/*.steps.ts` - IDE навигация
3. ✅ **Clean Architecture** - domain отделен от infrastructure
4. ✅ **Manual mocks** - `__mocks__/obsidian.ts` для тонкой настройки
5. ✅ **High coverage** - 70%+ threshold

### ❌ jest-environment-obsidian Evaluation (2025-10-03)

**Tested version**: 0.0.1

**Result**: ❌ **NOT RECOMMENDED** - Hangs indefinitely on all tests

**Details**: See `docs/JEST-ENVIRONMENT-OBSIDIAN-EVALUATION.md`

**Verdict**: **Manual mocks approach is SUPERIOR**

**Comparison**:
| Criterion | Manual Mocks | jest-environment-obsidian |
|-----------|--------------|---------------------------|
| Reliability | ✅ Stable | ❌ Hangs |
| Speed | ✅ ~1s for 37 tests | ❌ Timeout |
| Control | ✅ Full | ❌ N/A |
| Maintenance | ✅ Active | ⚠️ Inactive (2023) |

### Рекомендации по улучшению:

1. ✅ **KEEP Manual Mocks** - доказанное превосходство над jest-environment-obsidian

2. **Расширить .feature файлы**:
   - Добавить больше business scenarios
   - Использовать как requirements документацию

3. **Повысить coverage в domain layer**:
   - Стремиться к 90%+ для бизнес-логики

## 📖 Дополнительные ресурсы

### Документация:
- [jest-cucumber NPM](https://www.npmjs.com/package/jest-cucumber)
- [jest-environment-obsidian GitHub](https://github.com/obsidian-community/jest-environment-obsidian)
- [Obsidian Plugin Development](https://docs.obsidian.md/Plugins)

### Статьи:
- [Writing an Obsidian Plugin Driven By Tests (DEV.to)](https://dev.to/stroiman/writing-an-obsidian-plugin-driven-by-tests-1b35)
- [Setting Up BDD with TypeScript, Jest, Cucumber](https://medium.com/@azizzouaghia/setting-up-basic-api-testing-with-supertest-cucumber-jest-and-typescript-8c6a23c045a1)

### Сообщество:
- Obsidian Forum - Plugin Testing discussions
- Obsidian Discord - #plugin-dev channel
- GitHub Topics - obsidian-plugin-development

---

**Last Updated**: 2025-10-03 17:00 MSK
**Research Sources**: Obsidian community, DEV.to, GitHub, npm
**Status**: ✅ Best practices validated and applied to Exocortex
