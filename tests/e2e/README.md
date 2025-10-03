# E2E Tests

End-to-end tests for the Exocortex Obsidian Plugin using Playwright and Electron.

## Quick Start

### Prerequisites

```bash
# Install dependencies (includes Playwright)
npm install

# Ensure Obsidian is installed on your system
# Default path: /Applications/Obsidian.app/Contents/MacOS/Obsidian (macOS)
# Set custom path: export OBSIDIAN_PATH=/path/to/obsidian

# No browser installation needed - Playwright works with Obsidian's Electron
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

## Test Structure

```
tests/e2e/
├── setup/
│   ├── helpers.ts          # Test utilities
│   └── test-vault/         # Test vault (auto-generated)
├── plugin-loading.spec.ts  # Plugin initialization tests
├── layout-rendering.spec.ts # Layout rendering tests
└── commands.spec.ts        # Command execution tests
```

## Writing Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { launchObsidian, closeObsidian } from './setup/helpers';

test('should do something', async () => {
  const context = await launchObsidian();

  // Your test code here

  await closeObsidian(context);
});
```

### Helper Functions

- `launchObsidian()` - Launch Obsidian with test vault
- `closeObsidian(context)` - Close Obsidian gracefully
- `openNote(window, name)` - Open note by name
- `createTestNote(name, content, frontmatter)` - Create test note
- `openCommandPalette(window)` - Open command palette
- `executeCommand(window, name)` - Execute Obsidian command
- `waitForPlugin(window, id)` - Wait for plugin to load

## CI/CD

E2E tests run automatically on:
- Push to main branch
- Pull requests
- Manual workflow dispatch

See `.github/workflows/e2e.yml` for configuration.

## Documentation

For comprehensive guide, see: `docs/E2E-TESTING-GUIDE.md`

## Debugging

### Local Debugging

```bash
# Step-by-step debugging
npm run test:e2e:debug

# See what's happening
npm run test:e2e:headed

# Specific test file
npx playwright test plugin-loading
```

### CI Debugging

1. Download artifacts from GitHub Actions
2. Open `playwright-report/index.html`
3. Watch test videos in `test-results/`

## Configuration

Test configuration in `playwright.config.ts`:
- Tests run sequentially (Electron limitation)
- 30s timeout per test
- Screenshots on failure
- Traces on first retry (CI)
