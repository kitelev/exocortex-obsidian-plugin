# UI Testing in CI/CD

This document describes the complete setup for running UI tests in headless mode within GitHub Actions CI/CD environment.

## Overview

The project now supports running WebdriverIO-based UI tests in both local development and CI environments with the following key features:

- **Headless Chrome** for CI environments
- **Screenshot capture** on test failures
- **Retry logic** for flaky tests
- **Enhanced error handling** and logging
- **Cross-platform support** (Linux with Xvfb, macOS)
- **Optimized timeouts** for slower CI environments

## Configuration Files

### 1. `wdio.conf.ts` - Base Configuration

The base configuration automatically detects CI environment and adjusts settings:

```typescript
// Automatically enables headless mode when CI=true
capabilities: [
  {
    "goog:chromeOptions": {
      args: process.env.CI
        ? [
            "--headless=new",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ]
        : ["--disable-web-security", "--window-size=1920,1080"],
    },
  },
];
```

### 2. `wdio.conf.ci.ts` - CI-Specific Configuration

Dedicated CI configuration with optimizations:

- **Extended timeouts**: 5-minute test timeout, 5-minute connection timeout
- **Retry logic**: Up to 2 retries for failed tests
- **Enhanced reporting**: JSON and JUnit reporters
- **Screenshot capture**: Automatic failure screenshots
- **Optimized Chrome args**: Full headless configuration

### 3. Updated GitHub Actions Workflow

The workflow (`.github/workflows/ui-tests.yml`) now includes:

- **Improved Xvfb setup** with proper screen resolution (1920x1080)
- **Additional Linux dependencies** for Chrome
- **CI-specific test command** usage
- **Artifact collection** for logs and screenshots
- **Test result summaries** in GitHub

## Running Tests

### Local Development

```bash
# Standard local testing (with UI)
npm run test:ui

# Local headless testing
npm run test:ui:headless

# Force headless with screenshots
TAKE_SCREENSHOTS=true npm run test:ui:headless
```

### CI Environment

```bash
# CI-optimized configuration
npm run test:ui:ci

# With debug logging
DEBUG=true npm run test:ui:ci
```

### Environment Variables

| Variable           | Description              | Default                               |
| ------------------ | ------------------------ | ------------------------------------- |
| `CI`               | Enables CI optimizations | `false`                               |
| `DEBUG`            | Enable debug logging     | `false`                               |
| `TAKE_SCREENSHOTS` | Force screenshot capture | `false` (enabled automatically in CI) |

## Key Features

### 1. Screenshot Capture

Screenshots are automatically captured on test failures in CI or when `TAKE_SCREENSHOTS=true`:

```typescript
// Automatic screenshot on failure
afterTest: async function (test, context, result) {
  if (!result.passed && (process.env.CI || process.env.TAKE_SCREENSHOTS)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testName = test.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filepath = `screenshots/failure-${testName}-${timestamp}.png`;
    await browser.saveScreenshot(filepath);
  }
}
```

### 2. Retry Logic

CI configuration includes intelligent retry logic:

```typescript
retry: {
  test: 2,  // Retry failed tests up to 2 times
  suite: 0  // Don't retry suite failures
}
```

### 3. Enhanced Timeouts

Different timeout configurations for CI vs local:

- **Local**: 2-minute test timeout, 2-minute connection timeout
- **CI**: 5-minute test timeout, 5-minute connection timeout

### 4. Xvfb Configuration

Linux CI runners use optimized Xvfb setup:

```bash
Xvfb :99 -screen 0 1920x1080x24 -ac -nolisten tcp -dpi 96
```

## Browser Configuration

### Chrome Arguments for CI

```typescript
'goog:chromeOptions': {
  args: [
    '--headless=new',           // New headless mode
    '--no-sandbox',             // Required for CI
    '--disable-dev-shm-usage',  // Overcome limited resource problems
    '--disable-gpu',            // Disable GPU for headless
    '--disable-web-security',   // Allow cross-origin requests
    '--window-size=1920,1080',  // Consistent window size
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-default-apps',
    '--no-first-run',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-images',
    '--disable-background-networking'
  ]
}
```

## Obsidian-Specific Configuration

### Enhanced Startup Configuration

```typescript
'wdio:obsidianOptions': {
  appVersion: 'latest',
  vault: './tests/ui/fixtures/vault',
  plugins: [{ path: '.', enabled: true }],
  headless: true,                 // CI-specific
  devMode: false,                 // CI-specific
  safeMode: false,               // CI-specific
  configDir: '.obsidian-ci',     // Separate CI config
  startupTimeout: 60000          // Increased for CI
}
```

### Custom Commands

Enhanced commands for better CI testing:

```typescript
// Wait for Obsidian to be ready
browser.addCommand("waitForObsidianReady", async function (timeout) {
  await this.waitUntil(
    async () => {
      const ready = await this.executeObsidian(({ app }) => {
        return app && app.workspace && app.workspace.layoutReady;
      });
      return ready === true;
    },
    { timeout, timeoutMsg: "Obsidian failed to become ready" },
  );
});

// Enhanced screenshot capture
browser.addCommand("takeScreenshotOnFailure", async function (testName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `failure-${testName}-${timestamp}.png`;
  const filepath = `screenshots/${filename}`;
  await this.saveScreenshot(filepath);
  return filepath;
});
```

## Troubleshooting

### Common CI Issues

1. **Chrome fails to start**
   - Ensure all required dependencies are installed
   - Check Xvfb is running on Linux
   - Verify `--no-sandbox` flag is present

2. **Tests timeout**
   - Increase timeout values in CI config
   - Check for memory issues in CI runner
   - Verify Obsidian downloads correctly

3. **Screenshots not captured**
   - Check `screenshots/` directory permissions
   - Verify `CI=true` or `TAKE_SCREENSHOTS=true` is set
   - Check error handling in test hooks

### Debug Mode

Enable debug logging for troubleshooting:

```bash
DEBUG=true npm run test:ui:ci
```

This will provide detailed logs of:

- Browser startup process
- Obsidian plugin loading
- Test execution steps
- Error details

### Artifact Collection

GitHub Actions automatically collects:

- WebdriverIO logs (`wdio-logs/`)
- Failure screenshots (`screenshots/`)
- Xvfb logs (`/tmp/xvfb.log`)

Access these through the Actions tab in your GitHub repository.

## Best Practices

### 1. Test Structure

- Use `waitForObsidianReady()` before interacting with Obsidian
- Add appropriate waits for dynamic content
- Use descriptive test names for better screenshot naming

### 2. Error Handling

- Always wrap Obsidian interactions in try-catch
- Use meaningful error messages
- Test both success and failure scenarios

### 3. Performance

- Minimize test execution time where possible
- Use appropriate timeouts (not too short, not too long)
- Clean up test data in `after` hooks

### 4. CI Optimization

- Run tests in parallel when possible
- Use caching for dependencies
- Only run UI tests when necessary (on relevant file changes)

## Validation

Use the included validation script to check your setup:

```bash
node scripts/test-ui-setup.js
```

This script validates:

- ✅ All required files exist
- ✅ Package.json scripts are configured
- ✅ Dependencies are installed
- ✅ TypeScript compilation works
- ✅ Configuration files are valid

## Migration from Previous Setup

If you're migrating from an older UI testing setup:

1. **Update workflow**: Use `npm run test:ui:ci` instead of `npm run test:ui`
2. **Update dependencies**: Ensure latest WebdriverIO versions
3. **Update configurations**: Adopt the new timeout and retry settings
4. **Test locally**: Run `npm run test:ui:headless` to verify headless mode works
5. **Validate setup**: Run the validation script before committing

This setup ensures reliable, fast UI testing in GitHub Actions with proper error handling and debugging capabilities.
