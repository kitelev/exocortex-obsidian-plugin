# WebStorm Cucumber Integration Setup

## 🎯 Goal

Enable executable .feature files in WebStorm IDE with:
- ✅ No yellow underlines on step definitions
- ✅ Go-to-definition from feature to steps
- ✅ Autocomplete for Gherkin steps
- ✅ Run individual scenarios directly from IDE

## 📋 Prerequisites

1. **WebStorm 2024.1+** or **IntelliJ IDEA Ultimate**
2. **Cucumber for JavaScript plugin** installed
3. **Node.js 18+** and npm dependencies installed

## 🔧 Installation Steps

### 1. Install WebStorm Cucumber Plugin

1. Open WebStorm
2. Go to **Settings/Preferences** → **Plugins**
3. Search for **"Cucumber for JavaScript"**
4. Click **Install**
5. Restart IDE

### 2. Configure Cucumber Plugin

1. Open **Settings/Preferences** → **Languages & Frameworks** → **JavaScript** → **Cucumber**
2. Set **Step definitions directory**: `tests/steps`
3. Enable **"Resolve links to step definitions"**
4. Click **OK**

### 3. Install TypeScript Dependencies

```bash
npm install --save-dev @cucumber/cucumber ts-node
```

### 4. Configure Run/Debug Configuration

1. Right-click on any `.feature` file
2. Select **Create 'Feature: ...'** → **Cucumber.js**
3. Configure:
   - **Feature file or directory**: `specs/features`
   - **Program arguments**: `--require-module ts-node/register --require tests/steps/**/*.ts`
   - **Working directory**: `$ProjectFileDir$`
   - **Node interpreter**: (auto-detected)
   - **Cucumber package**: `node_modules/@cucumber/cucumber`

4. Click **OK**

### 5. Verify Setup

1. Open any `.feature` file (e.g., `specs/features/layout/universal-layout-rendering.feature`)
2. Steps should **NOT** be underlined in yellow
3. **Ctrl+Click** (or **Cmd+Click** on Mac) on a step should navigate to step definition
4. Right-click on a scenario → **Run 'Scenario: ...'** should execute

## 📁 Project Structure

```
/
├── specs/
│   └── features/
│       └── layout/
│           ├── universal-layout-rendering.feature   # English
│           ├── instance-class-links.feature         # English
│           ├── table-sorting.feature                # English
│           ├── dynamic-layout-rendering.feature     # Russian
│           └── layout-views.feature                 # Russian
│
├── tests/
│   └── steps/
│       ├── universal-layout-rendering.steps.ts  # NEW - English steps
│       ├── instance-class-links-english.steps.ts # NEW - English steps
│       ├── table-sorting-english.steps.ts       # NEW - English steps
│       ├── universal-layout.steps.ts            # OLD - Russian steps
│       ├── instance-class-links.steps.ts        # OLD - Russian steps
│       ├── table-sorting.steps.ts               # OLD - Russian steps
│       ├── world.ts                             # Cucumber World setup
│       └── hooks.ts                             # Before/After hooks
│
├── cucumber.config.js          # Cucumber configuration
└── tsconfig.cucumber.json      # TypeScript config for Cucumber
```

## 🔍 Troubleshooting

### Yellow Underlines Still Appear

**Cause**: WebStorm can't find step definitions

**Solution**:
1. Check **Settings** → **Languages & Frameworks** → **Cucumber**
2. Verify **Step definitions directory** is set to `tests/steps`
3. Click **Invalidate Caches** → **File** → **Invalidate Caches / Restart**
4. Restart WebStorm

### "Undefined step reference" Error

**Cause**: Step definition doesn't match Gherkin text exactly

**Solution**:
1. Open step definition file (e.g., `tests/steps/universal-layout-rendering.steps.ts`)
2. Verify regex or string matches feature file step exactly
3. Example:
   ```typescript
   // Feature file:
   Given("Obsidian vault with Exocortex plugin installed")

   // Step definition should be:
   Given("Obsidian vault with Exocortex plugin installed", function() { ... })
   ```

### Cannot Run Feature from IDE

**Cause**: Cucumber package not configured

**Solution**:
1. Edit Run Configuration
2. Set **Cucumber package** to `node_modules/@cucumber/cucumber`
3. Set **Program arguments**: `--require-module ts-node/register --require tests/steps/**/*.steps.ts`

### TypeScript Import Errors

**Cause**: Wrong module resolution

**Solution**:
1. Use `tsconfig.cucumber.json` for Cucumber-specific settings
2. Ensure `compilerOptions.module` is set to `"commonjs"`
3. Verify `requireModule: ['ts-node/register']` in `cucumber.config.js`

## ⚙️ Configuration Files

### `cucumber.config.js`

```javascript
module.exports = {
  default: {
    paths: ['specs/features/**/*.feature'],
    require: ['tests/steps/**/*.steps.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress'],
    dryRun: false,
  },
};
```

### `tsconfig.cucumber.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "types": ["node", "jest", "@cucumber/cucumber"]
  },
  "include": [
    "tests/steps/**/*.ts",
    "specs/features/**/*.feature"
  ]
}
```

## 🚀 Running Tests

### From WebStorm IDE

1. **Run single scenario**:
   - Right-click on scenario → **Run 'Scenario: ...'**

2. **Run entire feature**:
   - Right-click on feature file → **Run 'Feature: ...'**

3. **Run all features**:
   - Right-click on `specs/features` folder → **Run**

### From Command Line

```bash
# Run via jest-cucumber (recommended for CI/CD)
npm run test:cucumber

# Run via Cucumber-js (for IDE compatibility testing)
npx cucumber-js specs/features/**/*.feature \
  --require-module ts-node/register \
  --require 'tests/steps/**/*.steps.ts'
```

## 📝 Creating New Features

### 1. Create Feature File

```gherkin
# specs/features/layout/my-new-feature.feature
Feature: My New Feature

  Scenario: Basic behavior
    Given initial state
    When action happens
    Then expected result
```

### 2. Create Step Definitions

WebStorm will show **yellow underlines** for undefined steps:

1. **Alt+Enter** on undefined step
2. Select **"Create step definition"**
3. WebStorm generates step definition template
4. Implement the step

### 3. Run and Iterate

1. Right-click scenario → **Run**
2. Fix failing steps
3. Re-run until green ✅

## ✅ Success Criteria

- [ ] No yellow underlines in .feature files
- [ ] Ctrl+Click navigates to step definitions
- [ ] Autocomplete works for Gherkin steps
- [ ] Can run individual scenarios from IDE
- [ ] All scenarios pass when run from IDE
- [ ] TypeScript types work correctly in step definitions

## 📚 References

- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [WebStorm Cucumber Plugin](https://www.jetbrains.com/help/webstorm/cucumber.html)
- [jest-cucumber](https://github.com/bencompton/jest-cucumber) - Used for actual test execution

---

**Last Updated**: 2025-10-03
**Status**: ✅ Configured for WebStorm IDE integration
