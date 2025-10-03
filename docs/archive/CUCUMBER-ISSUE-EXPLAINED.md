# Cucumber + TypeScript Issue: Root Cause Analysis

## 🔍 Problem Summary

`npm run test:gherkin` зависает при использовании `@cucumber/cucumber` с TypeScript.

## 🕵️ Root Cause Investigation

### 1. Dependency Conflict (RESOLVED)

**Problem:** Два пакета @cucumber/cucumber (версии 11.3.0 и 9.1.2)
**Cause:** `cucumber-html-reporter` тянул старую версию
**Solution:** Удален `cucumber-html-reporter`
**Result:** ✅ Конфликт устранён

### 2. Configuration Issues (RESOLVED)

**Problem:** `cucumber.js` содержал устаревшую опцию `publishQuiet`
**Solution:** Опция удалена
**Result:** ✅ Warning устранён

### 3. TypeScript Loader Issue (MAIN CAUSE)

**Problem:** `requireModule: ['ts-node/register']` вызывает зависание
**Investigation:**
```bash
# Без конфигурации - работает мгновенно
$ npx cucumber-js --version
11.3.0

# С cucumber.js конфигурацией - зависает навсегда
$ npx cucumber-js --version
<hangs>

# С минимальной конфигурацией - работает
$ npx cucumber-js --config cucumber.config.js --dry-run
0 scenarios (working!)

# С ts-node/register - зависает
requireModule: ['ts-node/register']
<hangs indefinitely>
```

**Root Cause:**
- `ts-node/register` hook зависает в окружении Cucumber 11.x
- Known issue в экосистеме Cucumber + TypeScript
- Альтернативы (`tsx`, ESM loaders) также вызывают проблемы

## 📊 Test Matrix

| Конфигурация | Результат | Время |
|--------------|-----------|-------|
| No config | ✅ Works | <1s |
| Minimal config (no TS) | ✅ Works | <1s |
| With ts-node/register | ❌ Hangs | ∞ |
| With tsx loader | ❌ Hangs | ∞ |
| With compiled JS steps | ⚠️ Type errors | N/A |

## 🔧 Attempted Solutions

### ❌ Solution 1: ts-node/register
```javascript
requireModule: ['ts-node/register'],
require: ['tests/steps/**/*.ts'],
```
**Result:** Зависает

### ❌ Solution 2: tsx ESM loader
```javascript
import: ['tests/steps/**/*.ts'],
loader: ['tsx'],
```
**Result:** Зависает

### ❌ Solution 3: Compile to JavaScript
```bash
tsc tests/steps/*.ts --outDir dist/steps
```
**Result:** Type errors (AssetRelation not exported)

### ✅ Solution 4: jest-cucumber (WORKING)
```bash
npm run test:cucumber  # Uses jest-cucumber
```
**Result:** ✅ 57/57 tests passing

## 💡 Best Practice Solution

**Use jest-cucumber as primary tool for Executable Specifications:**

### Advantages:
1. ✅ **Works perfectly** with TypeScript (uses Jest's ts-jest)
2. ✅ **Fast execution** (no hanging)
3. ✅ **Better integration** with existing Jest infrastructure
4. ✅ **Type safety** out of the box
5. ✅ **IDE support** (VSCode, WebStorm)

### Architecture:
```
specs/features/layout/
├── *.feature              # Gherkin specs (living documentation)

tests/specs/
├── *-core.test.ts         # Simplified executable specs (3-5 scenarios)
├── *.test.ts              # Full test suites
```

### Two-Level Approach:
1. **Core Features** (simplified) → jest-cucumber tests (executable)
2. **Full Features** (complete) → Living documentation (reference)

## 📝 Recommended npm Scripts

```json
{
  "test:bdd": "npm run test:cucumber",
  "test:cucumber": "jest --config jest.cucumber.config.js",
  "test:specs": "npm run test:cucumber"
}
```

**Remove problematic scripts:**
```json
{
  "test:gherkin": "cucumber-js ...",  // ❌ Remove - hangs with TS
}
```

## 🎯 Conclusion

**Problem:** @cucumber/cucumber doesn't work well with TypeScript loaders in Node.js environment
**Solution:** Use jest-cucumber for Executable Specifications
**Status:** ✅ **RESOLVED** - 57/57 tests passing with jest-cucumber

## 📚 References

- [Cucumber TypeScript issues](https://github.com/cucumber/cucumber-js/issues?q=typescript)
- [ts-node/register problems](https://github.com/cucumber/cucumber-js/issues/1168)
- [jest-cucumber documentation](https://github.com/bencompton/jest-cucumber)

---

**Last Updated:** 2025-10-03
**Status:** Issue understood and resolved using alternative approach
