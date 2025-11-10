# Testing Guide

**Testing patterns and best practices for Exocortex.**

---

## Test Types

### Unit Tests

**Location**: `packages/obsidian-plugin/tests/unit/`

**Run**: `npm run test:unit`

**Pattern**:
```typescript
import { MyService } from '../../src/services/MyService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService(mockVault);
  });

  it('should process task correctly', () => {
    const result = service.process(task);
    expect(result).toBe(expected);
  });
});
```

### Component Tests

**Location**: `packages/obsidian-plugin/tests/component/`

**Run**: `npm run test:component`

**Pattern**: Uses Playwright Component Testing for React components.

### E2E Tests

**Location**: `packages/obsidian-plugin/tests/e2e/`

**Run**: `npm run test:e2e:local` (Docker)

---

## Mock Helpers

### Test Helpers Location

`packages/obsidian-plugin/tests/unit/helpers/testHelpers.ts`

### Available Mocks

```typescript
import {
  createMockApp,
  createMockPlugin,
  createMockMetadata,
  createMockTFile
} from './helpers/testHelpers';

const mockApp = createMockApp();
const mockPlugin = createMockPlugin();
const mockMetadata = createMockMetadata({
  exo__Asset_label: "Test Task"
});
const mockFile = createMockTFile('test.md');
```

---

## Best Practices

### Override Mock Defaults

```typescript
const metadata = createMockMetadata({
  exo__Asset_label: null  // Test fallback behavior
});
```

### Test File Lookups

```typescript
mockApp.metadataCache.getFirstLinkpathDest.mockImplementation(
  (linkpath: string) => {
    if (linkpath === "file") return null;
    if (linkpath === "file.md") return mockFile;
    return null;
  }
);
```

### Coverage Requirements

- Global: ≥49%
- Domain layer: ≥78-80%
- BDD coverage: ≥80%

---

**See also:**
- [Plugin Development Guide](Plugin-Development-Guide.md)
- [Core API Reference](api/Core-API.md)
