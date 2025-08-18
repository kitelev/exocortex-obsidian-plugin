# Руководство по настройке Exocortex для Obsidian

## Краткое описание
Exocortex превращает ваши заметки в семантическую базу знаний с поддержкой RDF-графов, SPARQL-запросов и динамических интерфейсов.

## 1. Установка и первоначальная настройка

### Шаг 1: Установка плагина Dataview (ОБЯЗАТЕЛЬНО)
1. Откройте **Настройки** → **Плагины сообщества** → **Обзор**
2. Найдите "Dataview" и установите его
3. Включите плагин Dataview
4. В настройках Dataview включите **"Enable JavaScript Queries"**

### Шаг 2: Установка Exocortex
1. Перейдите в **Настройки** → **Плагины сообщества** → **Обзор**
2. Найдите "Exocortex" и установите
3. Включите плагин
4. Проверьте - в левой панели должна появиться иконка плюса (⊕)

### Шаг 3: Проверка работоспособности
- Кликните на иконку плюса - откроется модальное окно создания актива
- При активации плагина должно появиться уведомление "🔍 Exocortex: SPARQL support and graph visualization enabled!"
- Откройте палитру команд (Ctrl/Cmd + P) и найдите команды с префиксом "Exocortex:"

## 2. Базовая настройка онтологии

### Создание основных онтологий
1. Откройте палитру команд (Ctrl/Cmd + P)
2. Выберите `Exocortex: Create new ExoAsset`
3. Создайте базовые онтологии:

**Основная онтология (exo):**
- **Название**: "!exo"
- **Класс**: `exo__Ontology`
- **Онтология**: `exo`

**Управление задачами (ems):**
- **Название**: "!ems"
- **Класс**: `ems__Ontology` 
- **Онтология**: `ems`

## 3. Создание первых активов

### Создание простого актива
```yaml
---
exo__Asset_isDefinedBy: "[[!exo]]"
exo__Asset_uid: auto-generated-uuid
exo__Asset_createdAt: 2025-08-14T12:00:00
exo__Instance_class:
  - "[[exo__Asset]]"
exo__Asset_label: "Мой первый актив"
exo__Asset_description: "Описание актива"
---

# Мой первый актив

```dataviewjs
await window.ExoUIRender(dv, this);
```
```

### Создание задачи
```yaml
---
exo__Asset_isDefinedBy: "[[!ems]]"
exo__Asset_uid: auto-generated-uuid
exo__Instance_class:
  - "[[ems__Task]]"
exo__Asset_label: "Важная задача"
ems__Task_status: "todo"
ems__Task_priority: "high"
ems__Task_dueDate: 2025-08-20
---

# Важная задача

```dataviewjs
await window.ExoUIRender(dv, this);
```
```

### Создание проекта
```yaml
---
exo__Asset_isDefinedBy: "[[!ems]]"
exo__Instance_class:
  - "[[ems__Project]]"
exo__Asset_label: "Новый проект"
ems__Project_status: "active"
ems__Project_startDate: 2025-08-01
exo__Asset_relates:
  - "[[Важная задача]]"
---
```

## 4. Основные функции для начала работы

### Команды плагина (Ctrl/Cmd + P):
- `Exocortex: Create new ExoAsset` - создать новый актив
- `Exocortex: View SPARQL cache statistics` - статистика кэша
- `Exocortex: Clear SPARQL cache` - очистить кэш SPARQL
- `Exocortex: Export knowledge graph` - экспорт графа знаний
- `Exocortex: Import RDF data` - импорт RDF данных
- `Exocortex: Quick create task for current project` - быстрое создание задачи

### Горячие клавиши:
- **Ctrl/Cmd + Shift + N** - быстрое создание актива
- **Ctrl/Cmd + Shift + T** - быстрое создание задачи для текущего проекта
- **Ctrl/Cmd + E** - переключение в режим чтения (для просмотра UI)

### SPARQL-запросы
Создайте блок кода с типом `sparql`:

```sparql
SELECT ?subject ?label
WHERE {
  ?subject exo__Asset_label ?label .
}
```

### Визуализация графа
Создайте блок кода с типом `graph`:

**Основная визуализация:**
```graph
limit: 100
```

**Фокус на конкретной заметке:**
```graph
focus: [[Моя заметка]]
depth: 2
limit: 50
```

**С SPARQL запросом:**
```graph
SELECT ?s ?p ?o WHERE {
  ?s ?p ?o .
  FILTER(regex(?s, "Project", "i"))
} LIMIT 20
```

**Настройка параметров:**
```graph
focus: [[Управление задачами]]
depth: 3
limit: 200
showLabels: true
nodeSize: 10
linkDistance: 100
```

## 5. Базовые типы активов

### Основные свойства всех активов:
| Свойство | Назначение | Пример |
|----------|------------|--------|
| `exo__Asset_label` | Название | "Моя заметка" |
| `exo__Asset_description` | Описание | "Подробное описание" |
| `exo__Asset_relates` | Связанные заметки | `["[[Другая заметка]]"]` |
| `exo__Instance_class` | Тип актива | `["[[ems__Task]]"]` |

### Специфические свойства задач:
- `ems__Task_status`: "todo", "in_progress", "done"
- `ems__Task_priority`: "low", "medium", "high"
- `ems__Task_dueDate`: дата в формате YYYY-MM-DD

### Специфические свойства проектов:
- `ems__Project_status`: "active", "paused", "completed"
- `ems__Project_startDate`: дата начала
- `ems__Project_endDate`: дата окончания

## Быстрый старт (5 минут)

1. **Установите Dataview** и включите JavaScript Queries
2. **Установите Exocortex** и проверьте активность
3. **Создайте актив** командой `Exocortex: Create new ExoAsset`
4. **Добавьте блок** ````dataviewjs await window.ExoUIRender(dv, this); ``` в заметку
5. **Переключитесь в режим чтения** (Ctrl/Cmd + E) для просмотра UI

## Устранение неполадок

**"ExoUIRender is not defined":**
- Убедитесь, что плагин включен
- Перезагрузите Obsidian (Ctrl/Cmd + R)
- Проверьте консоль разработчика (Ctrl/Cmd + Shift + I) на наличие ошибок

**Ничего не отображается:**
- Проверьте, что Dataview включен и настроен правильно
- Убедитесь, что блок кода имеет тип `dataviewjs`, а не `javascript`

**Свойства не показываются:**
- Проверьте корректность YAML в frontmatter
- Свойства должны быть в начале файла между `---`

## Дальнейшие шаги

- Изучите примеры в папке `examples/` плагина:
  - `1. Basic Example.md` - базовый пример актива
  - `2. Task Example.md` - пример задачи
  - `3. Project Example.md` - пример проекта
  - `4. Ontology Example.md` - пример онтологии
  - `Graph Visualization Examples.md` - примеры визуализации
- Создайте собственные онтологии для своих нужд
- Экспериментируйте с SPARQL-запросами
- Используйте связи между активами для построения графа знаний
- Изучите возможности визуализации графов

## Дополнительные возможности

### Управление кэшем SPARQL
- **Просмотр статистики**: `Exocortex: View SPARQL cache statistics`
- **Очистка кэша**: `Exocortex: Clear SPARQL cache`
- Кэш автоматически обновляется при изменении файлов

### Экспорт и импорт данных
- **Экспорт графа**: `Exocortex: Export knowledge graph` - сохранение в RDF форматах
- **Импорт RDF**: `Exocortex: Import RDF data` - загрузка внешних данных

### Структура файлов для онтологий
Рекомендуемая структура для организации онтологий:
```
Ваше хранилище/
├── ontologies/
│   ├── !exo.md          # Основная онтология
│   ├── !ems.md          # Управление задачами
│   └── !custom.md       # Ваша онтология
├── templates/
│   ├── Asset.md         # Шаблон актива
│   └── Task.md          # Шаблон задачи
└── projects/
    ├── Проект1.md
    └── Проект2.md
```

### Отладка и диагностика
- Откройте консоль разработчика: **Ctrl/Cmd + Shift + I**
- Проверьте вкладку Console на наличие ошибок
- Используйте команду статистики кэша для мониторинга производительности
- При проблемах с визуализацией сначала протестируйте SPARQL запросы

---
*Версия плагина: 2.10.0+ | Документация обновлена: 2025-08-14*