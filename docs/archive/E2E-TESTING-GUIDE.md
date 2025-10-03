# E2E Testing Guide for Obsidian Plugin

**Framework**: Playwright for Electron apps
**Status**: Recommended modern approach (Spectron is deprecated)

## 🎯 Overview

End-to-end (E2E) testing for Obsidian plugins tests the plugin in a real Obsidian environment, simulating actual user interactions.

### Why E2E Testing?

- **Real Environment**: Tests run in actual Obsidian app
- **User Perspective**: Validates full user workflows
- **Integration**: Tests plugin + Obsidian API interactions
- **Confidence**: Catches issues unit tests miss

### Testing Pyramid for Obsidian Plugins

```
    E2E Tests (10%)           ← Slow, high confidence
         ▲
    Integration (20%)         ← Medium speed
         ▲
    Unit Tests (70%)          ← Fast, isolated
```

**Current Status**:
- ✅ Unit Tests: 122 tests (domain, value objects)
- ✅ BDD Tests: 97 scenarios (jest-cucumber)
- ⚠️ E2E Tests: Infrastructure ready, needs implementation

## 🛠️ Technology Stack

### Option 1: Playwright (Recommended) ⭐

**Pros**:
- ✅ Modern, actively maintained
- ✅ Excellent Electron support
- ✅ Built-in test runner
- ✅ Auto-waiting, retry logic
- ✅ Great debugging tools

**Installation**:
```bash
npm install --save-dev @playwright/test playwright
```

### Option 2: Spectron (Deprecated) ❌

**Status**: No longer maintained
**Last Update**: 2021
**Recommendation**: Migrate to Playwright

### Option 3: Manual Obsidian Launcher

**For Obsidian-specific needs**:
```bash
npm install --save-dev obsidian-launcher
```

## 📁 Project Structure

```
exocortex-obsidian-plugin/
├── tests/
│   ├── e2e/                      # E2E tests
│   │   ├── setup/
│   │   │   ├── test-vault/       # Fixture vault
│   │   │   │   └── .obsidian/
│   │   │   │       └── plugins/
│   │   │   │           └── exocortex-obsidian-plugin/
│   │   │   │               ├── main.js
│   │   │   │               └── manifest.json
│   │   │   └── helpers.ts    # Test utilities
│   │   │
│   │   ├── plugin-loading.spec.ts
│   │   ├── layout-rendering.spec.ts
│   │   └── asset-creation.spec.ts
│   │
│   ├── unit/                     # Existing unit tests
│   └── specs/                    # BDD tests
│
├── playwright.config.ts          # Playwright configuration
├── .github/
│   └── workflows/
│       ├── ci.yml               # Existing CI
│       └── e2e.yml              # NEW: E2E workflow
│
└── package.json
```

## 🚀 Setup Guide

### Step 1: Install Playwright

```bash
# Playwright is already in package.json as dependency
npm install

# No browser installation needed for Electron testing
# Playwright works directly with Obsidian's Electron app
```

### Step 2: Configure Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,  // Electron tests run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // One worker for Electron
  reporter: 'html',

  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'obsidian-e2e',
      testMatch: '**/*.spec.ts',
    },
  ],
});
```

### Step 3: Create Test Vault

```bash
mkdir -p tests/e2e/setup/test-vault/.obsidian/plugins/exocortex-obsidian-plugin
```

Copy built plugin:
```bash
# After build
cp main.js manifest.json tests/e2e/setup/test-vault/.obsidian/plugins/exocortex-obsidian-plugin/
```

### Step 4: Write E2E Tests

`tests/e2e/plugin-loading.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test('plugin loads in Obsidian', async () => {
  // Launch Obsidian with test vault
  const electronApp = await electron.launch({
    args: [
      path.join(__dirname, '../../../node_modules/obsidian'),
      '--vault',
      path.join(__dirname, 'setup/test-vault'),
    ],
  });

  // Wait for window
  const window = await electronApp.firstWindow();

  // Wait for plugin to load
  await window.waitForLoadState('domcontentloaded');

  // Verify plugin is active
  const pluginStatus = await window.evaluate(async () => {
    // @ts-ignore
    return app.plugins.enabledPlugins.has('exocortex-obsidian-plugin');
  });

  expect(pluginStatus).toBe(true);

  // Close
  await electronApp.close();
});
```

### Step 5: Add npm Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## 🔧 GitHub Actions Setup

### Create `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Manual trigger

permissions:
  contents: read

jobs:
  e2e-tests:
    runs-on: ${{ matrix.os }}
    timeout-minutes: 30

    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]  # Windows optional

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build plugin
        run: npm run build

      - name: Verify Playwright
        run: npx playwright --version

      - name: Setup test vault
        run: |
          mkdir -p tests/e2e/setup/test-vault/.obsidian/plugins/exocortex-obsidian-plugin
          cp main.js manifest.json tests/e2e/setup/test-vault/.obsidian/plugins/exocortex-obsidian-plugin/

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.os }}
          path: playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-videos-${{ matrix.os }}
          path: test-results/
          retention-days: 7
```

## 📝 Example E2E Test Scenarios

### 1. Plugin Initialization

```typescript
test.describe('Plugin Initialization', () => {
  test('loads without errors', async () => {
    const { window, app } = await launchObsidian();

    const errors = await window.evaluate(() => {
      return (window as any).electronApp.getAppLogs();
    });

    expect(errors).not.toContain('exocortex');
    await app.close();
  });

  test('settings are accessible', async () => {
    const { window, app } = await launchObsidian();

    // Open settings
    await window.click('[data-test="settings-button"]');

    // Find plugin in settings
    const pluginVisible = await window.isVisible(
      'text=Exocortex'
    );

    expect(pluginVisible).toBe(true);
    await app.close();
  });
});
```

### 2. Layout Rendering

```typescript
test.describe('Layout Rendering', () => {
  test('renders universal layout', async () => {
    const { window, app } = await launchObsidian();

    // Open test note
    await openNote(window, 'Test Task.md');

    // Verify layout renders
    const layoutExists = await window.waitForSelector(
      '[data-layout="universal"]',
      { timeout: 5000 }
    );

    expect(layoutExists).toBeTruthy();

    await app.close();
  });

  test('displays asset properties', async () => {
    const { window, app } = await launchObsidian();

    await openNote(window, 'Asset Note.md');

    // Check property rendering
    const propertyValue = await window.textContent(
      '[data-property="status"]'
    );

    expect(propertyValue).toBe('active');
    await app.close();
  });
});
```

### 3. User Interactions

```typescript
test.describe('User Interactions', () => {
  test('creates new asset via command', async () => {
    const { window, app } = await launchObsidian();

    // Open command palette
    await window.keyboard.press('Control+P');  // Cmd+P on Mac

    // Type command
    await window.type('Create new asset');
    await window.keyboard.press('Enter');

    // Fill modal
    await window.fill('[data-test="asset-label"]', 'E2E Test Asset');
    await window.click('[data-test="create-button"]');

    // Verify creation
    const noteTitle = await window.textContent('.view-header-title');
    expect(noteTitle).toContain('E2E Test Asset');

    await app.close();
  });
});
```

## 🔍 Helper Utilities

`tests/e2e/setup/helpers.ts`:

```typescript
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'path';

export async function launchObsidian(): Promise<{
  app: ElectronApplication;
  window: Page;
}> {
  const app = await electron.launch({
    args: [
      path.join(__dirname, '../../../node_modules/obsidian'),
      '--vault',
      path.join(__dirname, 'test-vault'),
    ],
  });

  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  return { app, window };
}

export async function openNote(window: Page, noteName: string) {
  // Open quick switcher
  await window.keyboard.press('Control+O');

  // Type note name
  await window.type(noteName);
  await window.keyboard.press('Enter');

  // Wait for note to load
  await window.waitForSelector('.markdown-source-view', {
    timeout: 5000,
  });
}

export async function createTestNote(
  window: Page,
  name: string,
  content: string
) {
  await window.evaluate(
    ({ name, content }) => {
      // @ts-ignore
      return app.vault.create(name, content);
    },
    { name, content }
  );
}
```

## 🐛 Debugging E2E Tests

### Local Debugging

```bash
# Interactive UI mode
npm run test:e2e:ui

# Step-by-step debugging
npm run test:e2e:debug

# Headed mode (see browser)
npx playwright test --headed

# Specific test
npx playwright test plugin-loading
```

### CI Debugging

1. **Download artifacts**:
   - Go to GitHub Actions run
   - Download `playwright-report` artifact
   - Open `index.html` locally

2. **View videos**:
   - Download `test-videos` artifact
   - Watch failed test recordings

3. **Enable trace**:
```typescript
use: {
  trace: 'on',  // Always record trace
}
```

## 📊 Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up after tests
- Use fresh vault or reset state

### 2. Selectors
- Use data-test attributes
- Avoid brittle selectors
- Use Playwright's auto-waiting

### 3. Performance
- Run E2E tests separately from unit tests
- Limit to critical user paths
- Keep tests under 30 seconds each

### 4. CI Optimization
- Run on push to main + PRs
- Use matrix for multiple OS
- Cache dependencies
- Upload artifacts for debugging

## 🎯 Recommended Test Coverage

### Critical Paths (Must Test)
- ✅ Plugin loads without errors
- ✅ Settings are accessible
- ✅ Main features work (layouts, assets)
- ✅ Commands execute successfully

### Nice to Have
- Different Obsidian versions
- Migration scenarios
- Performance benchmarks
- Mobile simulation

### Not Recommended for E2E
- ❌ Unit logic (use unit tests)
- ❌ All edge cases (too slow)
- ❌ Visual regression (use snapshot tests)

## 🚀 Quick Start Checklist

- [ ] Install Playwright: `npm install --save-dev @playwright/test`
- [ ] Install Electron browser: `npx playwright install electron`
- [ ] Create `playwright.config.ts`
- [ ] Create test vault structure
- [ ] Write first E2E test (plugin loading)
- [ ] Add npm scripts
- [ ] Create GitHub Actions workflow
- [ ] Run locally: `npm run test:e2e:ui`
- [ ] Push and verify CI passes

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright for Electron](https://playwright.dev/docs/api/class-electron)
- [Obsidian Plugin Development](https://docs.obsidian.md/)
- [Example: obsidian-plugin-e2e-test](https://github.com/trashhalo/obsidian-plugin-e2e-test)

---

**Status**: Documentation ready, implementation pending
**Next Steps**: Implement first E2E test for plugin loading
**Estimated Effort**: 2-3 hours for basic setup
