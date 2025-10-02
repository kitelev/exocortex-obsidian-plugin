# 🚀 QUICK START - Максимальная скорость Claude

## Мгновенные команды (без ожидания):

```bash
/execute [task]     # Сразу выполнение с параллельными агентами
/status            # Проверка прогресса
/test             # Запуск тестов
/release patch    # Быстрый релиз
```

## Примеры быстрых команд:

### Вместо: "Помоги исправить тесты"
### Используй:
```
/execute Fix failing tests in CreateAssetUseCase.test.ts
```

### Вместо: "Нужно добавить новую функцию"
### Используй:
```
/execute Add caching to PropertyCacheService with 5min TTL
```

### Вместо: "Проверь код на ошибки"
### Используй:
```
npm test && npm run lint
```

## Активация турбо-режима:
```bash
source .claude/activate-performance.sh
```

## Параллельные команды:
```bash
# Одновременная проверка
npm test & npm run build & npm run lint & wait
```

## Прямые пути к файлам:
- src/domain/services/PropertyCacheService.ts
- src/infrastructure/container/DIContainer.ts
- tests/unit/application/use-cases/CreateAssetUseCase.test.ts

## Горячие клавиши:
- `/` - показать все команды
- `Tab` - автодополнение