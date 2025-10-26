# Exocortex Plugin - Executable Specifications

Эта директория содержит исполняемые спецификации (Executable Specifications) для Exocortex Obsidian Plugin в формате Gherkin.

## Структура

```
specs/
├── features/
│   └── layout/
│       ├── universal-layout-rendering.feature
│       ├── dynamic-layout-rendering.feature
│       ├── instance-class-links.feature
│       ├── table-sorting.feature
│       └── layout-views.feature
└── README.md
```

## Парадигма Executable Specifications

Executable Specifications - это подход к документированию требований через примеры, которые:

1. **Понятны всем** - бизнес-аналитикам, разработчикам, тестировщикам
2. **Исполняемы** - могут быть автоматически проверены
3. **Актуальны** - служат живой документацией системы
4. **Являются источником истины** - требования и тесты в одном месте

## Формат Gherkin

Спецификации написаны на языке Gherkin (русский язык) и следуют структуре:

```gherkin
Функция: Краткое описание функциональности

  Как <роль>
  Я хочу <цель>
  Чтобы <выгода>

  Сценарий: Описание конкретного сценария
    Дано <начальное состояние>
    Когда <действие>
    Тогда <ожидаемый результат>
```

## Ключевые файлы спецификаций

### universal-layout-rendering.feature
Основная функциональность Universal Layout:
- Отображение таблиц связанных заметок
- **Кликабельные ссылки в Instance Class** (основное требование)
- Сортировка по колонкам
- Фильтрация архивных заметок
- Мобильная адаптация

### instance-class-links.feature
Детальная спецификация требования о кликабельных ссылках:
- Instance Class должен быть `<a class="internal-link">`
- НЕ должен содержать символы `[[` или `]]`
- Клик должен открывать файл класса
- Обработка массивов, пустых и некорректных значений

### table-sorting.feature
Интерактивная сортировка таблиц:
- Сортировка по Name, Instance Class, кастомным свойствам
- Переключение asc/desc по клику
- Индикаторы сортировки (▲/▼)
- Независимое состояние сортировки для групп

### layout-views.feature
Различные виды отображения:
- Table (таблица)
- List (список)
- Cards (карточки)
- Grouped tables (группировка)
- Лимитирование результатов

### dynamic-layout-rendering.feature
Dynamic Layout с предустановленными макетами:
- Автоматическое применение по Instance Class
- Fallback на дефолтный макет
- Секции и запросы в макетах
- Кеширование

## Текущее состояние vs Требования

### ❌ НЕ реализовано (приоритет 1)
**Instance Class как кликабельные ссылки**
- Текущее состояние: `<td>[[ems__Task]]</td>` (простой текст)
- Требуемое состояние: `<a class="internal-link" href="ems__Task">ems__Task</a>`
- Файл спецификации: `instance-class-links.feature`
- Затронутые компоненты:
  - `UniversalLayoutRenderer.ts` - метод `renderTable()` и `updateTableBody()`
  - `UniversalLayoutRenderer.ts` - метод `renderGroupedAssetRelationsBlock()`
  - Нужно заменить `row.createEl("td", {text: instanceClass})` на создание ссылки

### ✅ Реализовано
- Сортировка по колонкам (Name, Instance Class, кастомные свойства)
- Индикаторы сортировки (▲/▼)
- Фильтрация архивных заметок
- Различные виды отображения (table, list, cards)
- Мобильная адаптация
- Группировка по свойствам

## Запуск спецификаций

На данный момент спецификации служат документацией. Для автоматического выполнения потребуется:

### Вариант 1: Cucumber.js
```bash
npm install --save-dev @cucumber/cucumber
npx cucumber-js specs/features
```

### Вариант 2: Jest + Cucumber
```bash
npm install --save-dev jest-cucumber
# Создать step definitions в tests/specs/
```

### Вариант 3: Playwright + Cucumber
```bash
npm install --save-dev @playwright/test @cucumber/cucumber
# Для E2E тестирования в реальном Obsidian
```

## Приоритеты реализации

1. **Instance Class Links** (критический) - `instance-class-links.feature`
2. Полное покрытие тестами спецификаций из `table-sorting.feature`
3. E2E тесты для `layout-views.feature`
4. Автоматизация `dynamic-layout-rendering.feature`

## Связь со спецификациями

При реализации новой функциональности:

1. Сначала пишется сценарий в `.feature` файле
2. Сценарий обсуждается с заказчиком/командой
3. Реализуется функциональность
4. Пишутся step definitions для автоматизации
5. Спецификация становится регрессионным тестом

## Полезные ссылки

- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [Cucumber Best Practices](https://cucumber.io/docs/bdd/better-gherkin/)
- [Writing Good Gherkin](https://automationpanda.com/2017/01/30/bdd-101-writing-good-gherkin/)

## Вопросы и предложения

Для вопросов по спецификациям или предложений новых сценариев создавайте issues в репозитории проекта.
