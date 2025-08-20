# /execute - Universal Task Execution Command

## Command Definition
```yaml
name: execute
aliases: [exec, run, выполни]
description: Execute task with full compliance, agents, and meta-optimization
category: Task Management
```

## Usage
```
/execute [task description]
```

## Full Command Template
When `/execute` is invoked, automatically expand to:

```
EXECUTE-WITH-META-OPTIMIZATION:

ЗАДАЧА: {user_input}

РЕЖИМ: FULL-COMPLIANCE-WITH-META-LEARNING

ТРЕБОВАНИЯ:
☑ Использовать orchestrator для декомпозиции задачи
☑ Запустить 3-5 специализированных агентов параллельно
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
```

## Examples

### Basic Usage
```
/execute добавить поддержку экспорта в PDF
```

### With Context
```
/execute исправить баг с отображением кириллицы в Children Efforts таблице
```

### Complex Task
```
/execute реализовать drag-and-drop для переупорядочивания efforts в таблице с сохранением порядка в frontmatter
```

## Command Behavior

1. **Immediate Actions**:
   - Create TodoWrite with task decomposition
   - Launch orchestrator agent
   - Start meta-agent monitoring

2. **Parallel Execution**:
   - Minimum 3-5 agents working simultaneously
   - Coordinated through orchestrator
   - Real-time progress tracking

3. **Quality Gates**:
   - Compilation check
   - Test execution (>70% coverage)
   - CI/CD validation
   - Release creation

4. **Reporting**:
   - Agent contribution summary
   - Performance metrics
   - Meta-agent improvements
   - Release link

## Shortcuts

### Quick Fix
```
/execute fix: [description]
```
Automatically triggers hotfix workflow with emergency-ci-stabilization

### Feature Development
```
/execute feat: [description]
```
Full feature development pipeline with all quality gates

### Performance Optimization
```
/execute perf: [description]
```
Includes performance-agent and benchmarking

### Documentation Update
```
/execute docs: [description]
```
Focuses on technical-writer-agent and documentation updates

## Integration with Claude Code

This command integrates with Claude Code's slash command system. When registered, it will:
1. Appear in the slash command menu
2. Provide autocomplete for the command
3. Show this documentation on hover
4. Execute the full compliance workflow

## Error Handling

If the command fails at any stage:
1. TodoWrite will show the failure point
2. Error-handler agent will be automatically invoked
3. Meta-agent will analyze and suggest fixes
4. Retry with improvements

## Metrics

Track success rate:
- Agent utilization: >80%
- Parallel execution: >60%
- First-time success: >85%
- Release creation: 100%

---

**This command ensures every task is executed with maximum efficiency and full compliance with project standards.**