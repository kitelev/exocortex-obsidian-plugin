# 🎯 CLAUDE EXECUTE COMMAND - Универсальная команда выполнения задач

## 🚀 Slash Commands (v3.4.0 IMPLEMENTED)

**Quick Access Commands:**

- `/execute` (или `/выполни`, `/exec`, `/run`) - Execute with full compliance and agent coordination
- `/status` (или `/st`, `/статус`) - Check current progress and TodoWrite status
- `/agents` (или `/ag`, `/агенты`) - List available agents and their capabilities
- `/release` (или `/rel`, `/релиз`) - Create new release with current changes
- `/test` (или `/t`, `/тест`) - Run tests and check coverage

**Enhanced Execution with Verbose Output:**

```
/execute --verbose [task]     # Detailed agent execution logging
/execute --debug [task]       # Full debug output with decisions
/execute --silent [task]      # Minimal output (only results)
/execute --progress [task]    # Show progress bars for agents
/execute --timing [task]      # Show execution timing metrics
```

**Example Usage:**

```
/execute --verbose добавить поддержку экспорта в CSV
/execute --debug --timing оптимизировать производительность
/status --agents --detailed
/agents --active --metrics
```

_See .claude/SLASH-COMMANDS.md for complete implementation details_

## 📊 Enhanced Agent Output Display (NEW)

### Verbosity Levels

- **silent**: Only critical errors and final results
- **basic**: Agent start/complete/error messages (default)
- **verbose**: All agent activities including progress and decisions
- **debug**: Full trace including internal agent reasoning

### Visual Indicators

```
🚀 Starting agent         - Agent initialization
🔀 Parallel execution     - Multiple agents running simultaneously
➡️ Sequential execution   - Single agent running
⚡ Progress update        - Agent working on subtask
🤔 Decision point         - Agent making strategic decision
📝 Output generated       - Agent produced deliverable
✅ Task completed         - Agent finished successfully
❌ Error occurred         - Agent encountered problem
⏱️ Timing information     - Execution duration metrics
```

### Environment Variables for Agent Output

```bash
export CLAUDE_VERBOSE=verbose        # Set verbosity level
export CLAUDE_SHOW_TIMING=true       # Show execution timing
export CLAUDE_SHOW_PARALLEL=true     # Highlight parallel execution
export CLAUDE_SHOW_DECISIONS=true    # Show agent decision reasoning
export CLAUDE_SHOW_PROGRESS=true     # Display progress bars
export CLAUDE_LOG_FILE=.claude/logs/execution.log  # Log to file
```

## Команда для вызова

```
Выполни задачу в режиме FULL-COMPLIANCE:
[ОПИСАНИЕ ЗАДАЧИ]

При выполнении ОБЯЗАТЕЛЬНО:
1. Используй orchestrator для координации агентов
2. Запусти meta-agent для итеративного улучшения
3. Используй минимум 3-5 агентов параллельно
4. Следуй всем инструкциям из CLAUDE.md
5. Используй TodoWrite для отслеживания прогресса
6. Создай релиз после завершения
7. ИСПОЛЬЗУЙ verbose logging для отображения деталей выполнения
```

## Расширенная команда с полным контролем

```
EXECUTE-WITH-META-OPTIMIZATION:

ЗАДАЧА: [Детальное описание того, что нужно сделать]

РЕЖИМ: FULL-COMPLIANCE-WITH-META-LEARNING
ВЫВОД: VERBOSE # Детальное отображение работы агентов

ТРЕБОВАНИЯ:
☑ Использовать orchestrator для декомпозиции задачи
☑ Запустить 3-5 специализированных агентов параллельно
☑ ПОКАЗЫВАТЬ детальный прогресс каждого агента
☑ Активировать meta-agent для:
  - Мониторинга качества работы агентов
  - Сбора обратной связи
  - Итеративного улучшения инструкций агентов
  - Обновления CLAUDE-agents.md с улучшениями
☑ Использовать TodoWrite на каждом этапе
☑ Следовать Clean Architecture и SOLID
☑ Написать comprehensive tests (>70% coverage)
☑ Проверить все GitHub Actions до зеленого статуса
☑ Создать user-focused релиз

ОТОБРАЖЕНИЕ:
✓ Показывать параллельные группы агентов
✓ Отображать прогресс выполнения задач
✓ Выводить ключевые решения агентов
✓ Показывать timing для каждого агента
✓ Отображать итоговые метрики

ПРОВЕРКИ:
✓ Код компилируется без ошибок
✓ Все тесты проходят
✓ CI/CD полностью зеленый
✓ Документация обновлена
✓ CHANGELOG написан для пользователей
✓ Релиз создан и опубликован

ОТЧЕТ:
После выполнения предоставь:
1. Список использованных агентов и их вклад
2. Метрики производительности (время, параллелизм)
3. Улучшения, внесенные meta-agent
4. Ссылку на созданный релиз
5. Детальный execution timeline
```

## 🚀 Примеры использования с расширенным выводом

### Пример 1: Добавление новой функциональности с verbose output

```
EXECUTE-WITH-META-OPTIMIZATION:

ЗАДАЧА: Добавить возможность экспорта Children Efforts в CSV
ВЫВОД: VERBOSE

[Система покажет детальный вывод:]
🚀 Starting orchestrator: Decompose and coordinate CSV export feature
  🔀 Starting parallel group (4 agents):
    • swebok-engineer
    • qa-engineer
    • ux-design-expert
    • technical-writer-agent

  ⚡ swebok-engineer: Analyzing existing export patterns
  🤔 swebok-engineer decided: Use Factory pattern for exporters
  📝 swebok-engineer output: Generated CSVExporter class

  ⚡ qa-engineer: Creating test scenarios
  ⚡ ux-design-expert: Designing export UI
  ⚡ technical-writer-agent: Preparing documentation

  ✅ All agents completed (execution time: 3m 45s)

📊 Session Summary:
  • Total execution: 3m 45s
  • Parallel efficiency: 85%
  • Success rate: 100%
```

### Пример 2: Debug режим для исследования проблемы

```
/execute --debug --timing Исправить баг с отображением Children Efforts

[Детальный debug вывод:]
🚀 orchestrator (0ms): Starting bug investigation
  🔀 Parallel execution batch 1:
    🚀 error-handler (15ms): Analyzing error patterns
      ⚡ Progress [25%]: Collecting error logs
      ⚡ Progress [50%]: Identifying root cause patterns
      🤔 Decision: Memory leak in query caching
        Reasoning: Found unfreed references in IndexedGraph
        Alternatives considered: DOM manipulation, Event handlers
      ⚡ Progress [75%]: Validating hypothesis
      📝 Output: Root cause analysis document
      ✅ Completed (1245ms)

    🚀 code-searcher (15ms): Locating relevant code
      ⚡ Progress [33%]: Searching query implementations
      ⚡ Progress [66%]: Analyzing cache mechanisms
      📝 Output: 5 files identified for review
      ✅ Completed (892ms)

  🔀 Parallel execution batch 2:
    🚀 swebok-engineer (1260ms): Implementing fix
      ⚡ Progress [20%]: Reviewing patterns
      🤔 Decision: Implement WeakMap for cache
      ⚡ Progress [60%]: Writing fix
      ⚡ Progress [100%]: Adding cleanup hooks
      ✅ Completed (2150ms)

    🚀 qa-engineer (1260ms): Creating tests
      ⚡ Progress [50%]: Writing memory leak tests
      ⚡ Progress [100%]: Validating fix
      ✅ Completed (1890ms)

⏱️ Total execution: 3.4s
📊 Parallelization rate: 87%
✅ Success rate: 100%
```

## 📋 Контрольный список для меня (Claude) - ENHANCED

При получении команды EXECUTE-WITH-META-OPTIMIZATION я ОБЯЗАН:

1. **Инициализация с verbose output (0-30 сек)**
   - [ ] Показать начало сессии с ID и параметрами
   - [ ] Создать TodoWrite с декомпозицией задачи
   - [ ] Определить необходимых агентов И ПОКАЗАТЬ ИХ СПИСОК
   - [ ] Запустить orchestrator С ОТОБРАЖЕНИЕМ СТАТУСА

2. **Параллельное выполнение с визуализацией (1-5 мин)**
   - [ ] ПОКАЗАТЬ группы параллельных агентов
   - [ ] Запустить минимум 3 агента параллельно
   - [ ] ОТОБРАЖАТЬ прогресс каждого агента
   - [ ] ПОКАЗЫВАТЬ ключевые решения агентов
   - [ ] Координировать через orchestrator
   - [ ] Собирать промежуточные результаты С ВЫВОДОМ

3. **Meta-оптимизация с логированием (непрерывно)**
   - [ ] Запустить meta-agent
   - [ ] ПОКАЗЫВАТЬ анализ качества работы агентов
   - [ ] Вносить улучшения в процессе работы
   - [ ] ОТОБРАЖАТЬ оптимизации в реальном времени
   - [ ] Обновлять документацию агентов

4. **Реализация с progress tracking (5-15 мин)**
   - [ ] Написать код согласно Clean Architecture
   - [ ] ПОКАЗЫВАТЬ прогресс создания файлов
   - [ ] Создать comprehensive tests С СЧЕТЧИКОМ
   - [ ] Проверить компиляцию и тесты С ВЫВОДОМ РЕЗУЛЬТАТОВ

5. **Валидация с детальным отчетом (2-5 мин)**
   - [ ] Запустить все тесты И ПОКАЗАТЬ РЕЗУЛЬТАТЫ
   - [ ] Проверить GitHub Actions С СТАТУСАМИ
   - [ ] Исправить любые проблемы С ЛОГИРОВАНИЕМ

6. **Релиз с полной информацией (2-3 мин)**
   - [ ] Обновить версии И ПОКАЗАТЬ ИЗМЕНЕНИЯ
   - [ ] Написать user-focused CHANGELOG
   - [ ] Создать и запушить релиз С ВЫВОДОМ URL

7. **Детальный отчет (30 сек)**
   - [ ] Execution timeline с timing
   - [ ] Список агентов и их вклад
   - [ ] Метрики выполнения (время, параллелизм)
   - [ ] Улучшения от meta-agent
   - [ ] Визуальная сводка сессии
   - [ ] Ссылка на релиз

## 🔄 Автоматические улучшения вывода

Meta-agent должен после каждой задачи:

1. Анализировать эффективность отображения информации
2. Предлагать улучшения для verbose output
3. Обновлять паттерны логирования в CLAUDE-agents.md
4. Оптимизировать баланс между информативностью и читаемостью

## 📊 Метрики успеха с визуализацией

- **Использование агентов**: >80% задач с агентами ✅
- **Параллелизация**: >60% агентов работают параллельно 🔀
- **Качество кода**: 100% компиляция, >70% test coverage 📊
- **CI/CD**: 100% зеленых workflow ✅
- **Время выполнения**: На 40-60% быстрее последовательного ⚡
- **Информативность**: 100% критических решений отображено 📝

## 🎨 Форматирование вывода агентов

### Стандартный формат для агента:

```
🚀 agent-name: Task description
  ⚡ Step 1: Action being performed [25%]
  ⚡ Step 2: Next action [50%]
  🤔 Decision: Chosen approach
    • Reasoning: Why this approach
    • Alternative: Other option considered
  📝 Output: What was produced
  ✅ Completed (2.3s)
```

### Формат для параллельной группы:

```
🔀 Parallel execution group (3 agents):
  • agent-1: Task 1
  • agent-2: Task 2
  • agent-3: Task 3

[Parallel execution visualization]
agent-1: ████████████████████ 100% ✅
agent-2: ████████████░░░░░░░  65% ⚡
agent-3: ████████████████████ 100% ✅
```

## 🚨 Критические правила для вывода

1. **ВСЕГДА** показывать начало и завершение агента
2. **ОБЯЗАТЕЛЬНО** отображать параллельные группы
3. **ПОКАЗЫВАТЬ** ключевые решения и их обоснование
4. **ВЫВОДИТЬ** timing информацию при запросе
5. **ФОРМАТИРОВАТЬ** вывод для читаемости
6. **ИСПОЛЬЗОВАТЬ** цвета и эмодзи для визуальной ясности

---

**Эта команда гарантирует выполнение задач с полной прозрачностью процесса, детальным отображением работы агентов и максимальной информативностью для пользователя.**
