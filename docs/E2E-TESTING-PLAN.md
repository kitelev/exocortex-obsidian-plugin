# E2E Testing Implementation Plan

## Current State

### What We Have ✅
- **Component Tests**: Playwright CT for React components (165 tests)
- **UI Integration Tests**: Jest with Obsidian API mocks (51 tests)
- **Unit Tests**: Business logic tests (172 tests)
- **Total**: 388 tests with ~70% coverage

### What We're Missing ❌
- **Real E2E Tests**: No tests running actual Obsidian with real vault
- **Regression Testing**: Tests rely on mocks, not real behavior
- **CI E2E Pipeline**: No headless Obsidian testing in GitHub Actions

## Problem Statement

Current "UI tests" are **integration tests with mocks**, not true E2E tests:

```typescript
// Current approach - MOCKED
mockApp.vault.getMarkdownFiles = jest.fn().mockReturnValue([taskFile]);
mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({...});
```

**Real E2E should:**
1. Launch actual Obsidian application
2. Load real vault with test data
3. Install the plugin
4. Interact with UI via automation
5. Verify DOM changes

## Research Findings

### Best Practices from Community

1. **trashhalo/obsidian-plugin-e2e-test**
   - Uses Spectron (deprecated) + Mocha
   - Docker setup with xvfb
   - GitHub Actions integration
   - [Link](https://github.com/trashhalo/obsidian-plugin-e2e-test)

2. **ObsidianToAnki E2E Implementation**
   - Migrated to **WebdriverIO** + Mocha
   - ~120 tests covering all features
   - Docker + xvfb for headless
   - JUnit reporters for PR integration
   - [PR #419](https://github.com/ObsidianToAnki/Obsidian_to_Anki/pull/419)

3. **Playwright for Electron**
   - Microsoft recommends Playwright over Spectron
   - Better maintained and documented
   - Successfully used in production
   - [Blog post](https://blog.dangl.me/archive/running-fully-automated-e2e-tests-in-electron-in-a-docker-container-with-playwright/)

### Technology Stack Comparison

| Tool | Pros | Cons | Recommendation |
|------|------|------|----------------|
| **Spectron** | Electron-specific, simple API | Deprecated, unmaintained | ❌ Avoid |
| **WebdriverIO** | Mature, good docs, used by ObsidianToAnki | More complex setup | ✅ Good choice |
| **Playwright** | Modern, well-maintained, Microsoft support | Less Electron examples | ✅ Best choice |

**Verdict**: Use **Playwright** (we already have it for component tests!)

## Implementation Phases

### Phase 1: Proof of Concept (1-2 days)

**Goal**: Get ONE E2E test working locally

#### Setup
```bash
# Install dependencies
npm install --save-dev @playwright/test

# Create E2E test directory
mkdir -p tests/e2e
```

#### Test Vault Setup
```bash
# Create test vault with known structure
tests/e2e/test-vault/
  ├── .obsidian/
  │   └── plugins/
  │       └── exocortex/  # Symlink to built plugin
  ├── 03 Knowledge/
  │   └── test-daily-note.md  # DailyNote with known tasks
  └── Tasks/
      └── test-task-1.md
```

#### First E2E Test
```typescript
// tests/e2e/daily-note.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';

test('DailyNote displays tasks table', async () => {
  // Launch Obsidian
  const electronApp = await electron.launch({
    args: ['/path/to/obsidian'],
    env: {
      OBSIDIAN_VAULT: 'tests/e2e/test-vault'
    }
  });

  const window = await electronApp.firstWindow();

  // Wait for vault to load
  await window.waitForSelector('.workspace');

  // Open DailyNote
  await window.click('[data-file-path="03 Knowledge/test-daily-note.md"]');

  // Verify tasks table is visible
  const tasksTable = await window.locator('.exocortex-daily-tasks-section');
  await expect(tasksTable).toBeVisible();

  // Verify task count
  const taskRows = await window.locator('.exocortex-tasks-table tbody tr');
  await expect(taskRows).toHaveCount(2);

  await electronApp.close();
});
```

### Phase 2: Docker + xvfb Setup (2-3 days)

**Goal**: Run E2E tests in Docker for CI

#### Dockerfile
```dockerfile
FROM node:18-slim

# Install xvfb and dependencies for Obsidian
RUN apt-get update && apt-get install -y \
    xvfb \
    libgtk-3-0 \
    libgbm1 \
    libnss3 \
    libxss1 \
    libasound2 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Download Obsidian AppImage
RUN wget https://github.com/obsidianmd/obsidian-releases/releases/download/v1.5.0/Obsidian-1.5.0.AppImage \
    && chmod +x Obsidian-1.5.0.AppImage \
    && ./Obsidian-1.5.0.AppImage --appimage-extract \
    && mv squashfs-root /opt/obsidian

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Entrypoint script for xvfb
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "run", "test:e2e"]
```

#### Entrypoint Script
```bash
#!/bin/bash
# docker-entrypoint.sh

# Start xvfb
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99

# Wait for X server
sleep 2

# Run tests
exec "$@"
```

#### npm Scripts
```json
{
  "scripts": {
    "test:e2e": "playwright test tests/e2e",
    "test:e2e:docker": "docker build -t exocortex-e2e . && docker run exocortex-e2e",
    "test:e2e:headed": "HEADED=true playwright test tests/e2e"
  }
}
```

### Phase 3: GitHub Actions Integration (1 day)

**Goal**: Automated E2E testing on every PR

#### Workflow
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build plugin
        run: npm run build

      - name: Run E2E tests in Docker
        run: npm run test:e2e:docker

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results
          path: playwright-report/
```

### Phase 4: Comprehensive Test Coverage (3-5 days)

**Goal**: Cover critical user journeys

#### Test Scenarios

1. **DailyNote Tasks Display** (Regression for v12.15.13 bug)
   - Open DailyNote with tasks
   - Verify tasks table renders
   - Check task filtering by day
   - Verify task sorting

2. **Asset Creation**
   - Click "Create Task" button
   - Fill in task form
   - Verify task file created
   - Check frontmatter populated correctly

3. **Property Editing**
   - Open asset with properties
   - Edit property value inline
   - Verify frontmatter updated
   - Check UI reflects changes

4. **Relations Display**
   - Open asset with relations
   - Verify relations table shows
   - Check grouped display
   - Test relation sorting

5. **Button Actions**
   - Test "Mark Done" button
   - Test "Archive" button
   - Test "Clean Properties" button
   - Verify state changes persist

## Success Metrics

### Coverage Goals
- **Critical paths**: 100% (DailyNote, Create Asset, Edit Property)
- **Features**: 80% (all buttons, tables, modals)
- **Edge cases**: 60% (error states, empty states)

### Performance Targets
- E2E test suite: < 5 minutes total
- Individual test: < 30 seconds
- CI pipeline: < 10 minutes end-to-end

### Quality Gates
- All E2E tests must pass before merge
- No flaky tests allowed (must be deterministic)
- Screenshots captured on failure
- Video recording for debugging

## Migration Strategy

### Phase 1-2: Parallel Testing
- Keep existing UI tests (fast feedback)
- Add E2E tests incrementally
- No removal until E2E coverage complete

### Phase 3: Gradual Replacement
- Replace mocked UI tests with E2E where appropriate
- Keep unit/component tests (fast, focused)
- Remove redundant integration tests

### Phase 4: Maintenance
- Document E2E test patterns
- Create test data fixtures
- Establish flake-free practices

## Cost/Benefit Analysis

### Benefits ✅
- **Catch real bugs**: No more mock-induced false positives
- **Regression prevention**: Real behavior verification
- **Confidence**: Deploy with certainty
- **Documentation**: Tests show real usage

### Costs ⏱️
- **Setup time**: ~7-12 days initial investment
- **Maintenance**: ~20% more time than mocked tests
- **CI time**: ~5 minutes per run (vs. ~3 seconds unit)
- **Complexity**: Docker, xvfb, Electron automation

### ROI Calculation
- **Bug found in production**: 2-4 hours investigation + fix + release
- **E2E test prevents bug**: 0 hours
- **Break-even**: After preventing ~2-3 production bugs
- **Expected**: ~10-15 bugs prevented per year

**Verdict**: ROI positive after 1-2 months ✅

## Next Steps

### Immediate (This Sprint)
1. ✅ Improve current UI test (remove implementation details)
2. ⏳ Create POC E2E test locally
3. ⏳ Document findings

### Short-term (Next Sprint)
1. Docker setup with xvfb
2. GitHub Actions integration
3. First E2E test in CI

### Long-term (Next Quarter)
1. Comprehensive E2E coverage
2. Replace redundant integration tests
3. Establish E2E best practices

## Resources

### Documentation
- [Playwright Electron](https://playwright.dev/docs/api/class-electron)
- [Electron Testing](https://electronjs.org/docs/tutorial/testing-on-headless-ci)
- [xvfb Guide](https://www.x.org/releases/X11R7.6/doc/man/man1/Xvfb.1.xhtml)

### Example Projects
- [trashhalo/obsidian-plugin-e2e-test](https://github.com/trashhalo/obsidian-plugin-e2e-test)
- [ObsidianToAnki E2E](https://github.com/ObsidianToAnki/Obsidian_to_Anki/pull/419)
- [Electron Playwright Blog](https://blog.dangl.me/archive/running-fully-automated-e2e-tests-in-electron-in-a-docker-container-with-playwright/)

---

**Status**: Planning Phase
**Owner**: Development Team
**Last Updated**: 2025-10-17
**Priority**: High (Quality Improvement)
