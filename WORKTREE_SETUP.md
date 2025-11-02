# iOS Integration Worktree Setup

This worktree is dedicated to iOS Live Activities integration development.

## Setup Details

**Worktree Location:** `/Users/kitelev/Documents/exocortex-development/worktrees/exocortex-ai-ios-integration`  
**Branch:** `feature/ios-live-activities`  
**Created:** 2025-11-02  
**Purpose:** Isolate iOS-related changes from main development

## Dependencies

Dependencies are shared with main repository via symlink to optimize disk usage:
```bash
node_modules -> ../../exocortex-obsidian-plugin/node_modules
```

If you need to install additional dependencies:
```bash
cd /Users/kitelev/Documents/exocortex-development/exocortex-obsidian-plugin
npm install <package>
```

## Development Workflow

### Build
```bash
npm run build
```

### Test
```bash
npm test                # All tests
npm run test:unit       # Unit tests only
npm run test:e2e        # E2E tests
```

### Lint
```bash
npm run lint
npm run lint:fix
```

## Related Issues

- Issue #273: Worktree setup (this task)
- Issue #276: Obsidian Plugin Status Detection
- Issue #285: Plugin Release v1.5.0

## Next Steps

After this worktree setup is merged:
1. Implement iOS status detection in Obsidian plugin (Issue #276)
2. Add URL scheme integration
3. Test with iOS companion app
