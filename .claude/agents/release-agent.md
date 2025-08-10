# Release Agent for Exocortex Plugin

## Purpose
Automated release agent that ensures all quality checks pass before creating a GitHub release, following the strict guidelines in CLAUDE.md.

## Pre-Release Checklist

### 1. Code Quality Verification
- [ ] Run `npm test` - ALL tests must pass (currently 518 tests)
- [ ] Check test coverage - Must be ≥70%
- [ ] Run `npm run build` - Build must succeed without errors
- [ ] Check TypeScript compilation - No errors in strict mode
- [ ] Verify bundle size < 1MB

### 2. Version Management
- [ ] Determine version bump type (patch/minor/major)
  - `patch`: Bug fixes only
  - `minor`: New features, backwards compatible
  - `major`: Breaking changes
- [ ] Update version in `package.json`
- [ ] Run `npm run version` to sync manifest.json and versions.json
- [ ] Verify all version files are in sync

### 3. Documentation Updates
- [ ] Update CHANGELOG.md with user-focused release notes
  - Focus on user benefits, not technical details
  - Include usage scenarios
  - Use clear, non-technical language
- [ ] Format: ## [X.Y.Z] - YYYY-MM-DD
- [ ] Sections: Major Improvements, Bug Fixes, Breaking Changes (if any)

### 4. Git Operations
- [ ] Stage all changes: `git add -A`
- [ ] Commit with conventional message format:
  ```
  feat: new feature
  fix: bug fix
  docs: documentation
  style: code style
  refactor: code refactoring
  perf: performance
  test: test changes
  chore: maintenance
  ```
- [ ] Push to main: `git push origin main`

### 5. GitHub Release Creation
- [ ] Create release with `gh release create`
- [ ] Tag format: `vX.Y.Z`
- [ ] Title format: `vX.Y.Z - Brief Description`
- [ ] Include release assets: `main.js`, `manifest.json`, `styles.css`
- [ ] Release notes from CHANGELOG.md

## Automated Release Script

```bash
#!/bin/bash
set -e

echo "🚀 Starting Exocortex Plugin Release Process"

# Step 1: Run all tests
echo "📊 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Fix all tests before releasing."
    exit 1
fi

# Step 2: Check test coverage
echo "📈 Checking test coverage..."
npm run test:coverage
# Parse coverage output and verify ≥70%

# Step 3: Build the plugin
echo "🔨 Building plugin..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix build errors before releasing."
    exit 1
fi

# Step 4: Check bundle size
echo "📦 Checking bundle size..."
BUNDLE_SIZE=$(stat -f%z main.js 2>/dev/null || stat -c%s main.js 2>/dev/null)
if [ $BUNDLE_SIZE -gt 1048576 ]; then
    echo "⚠️ Warning: Bundle size exceeds 1MB ($(($BUNDLE_SIZE / 1024))KB)"
fi

# Step 5: Get version bump type
echo "What type of release is this?"
echo "1) patch - Bug fixes"
echo "2) minor - New features"
echo "3) major - Breaking changes"
read -p "Enter choice (1-3): " choice

case $choice in
    1) VERSION_TYPE="patch";;
    2) VERSION_TYPE="minor";;
    3) VERSION_TYPE="major";;
    *) echo "Invalid choice"; exit 1;;
esac

# Step 6: Update version
echo "📝 Updating version..."
npm version $VERSION_TYPE --no-git-tag-version

# Step 7: Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: $NEW_VERSION"

# Step 8: Ensure CHANGELOG.md is updated
echo "⚠️ Please ensure CHANGELOG.md is updated with release notes for v$NEW_VERSION"
echo "Press Enter when ready to continue..."
read

# Step 9: Commit changes
echo "💾 Committing changes..."
git add -A
git commit -m "chore: Release v$NEW_VERSION"

# Step 10: Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Step 11: Create GitHub release
echo "🎉 Creating GitHub release..."
gh release create "v$NEW_VERSION" \
    --title "v$NEW_VERSION - $(date +%Y-%m-%d)" \
    --notes-file CHANGELOG.md \
    main.js manifest.json styles.css

echo "✅ Release v$NEW_VERSION completed successfully!"
echo "🔗 View at: https://github.com/kitelev/exocortex-obsidian-plugin/releases/tag/v$NEW_VERSION"
```

## Usage Instructions

### Manual Process
1. Run each checklist item manually
2. Verify each step passes before proceeding
3. Stop if any step fails

### Automated Process
1. Save the script as `release.sh`
2. Make executable: `chmod +x release.sh`
3. Run: `./release.sh`

## Common Issues & Solutions

### Tests Failing
- Check `__mocks__/obsidian.ts` for mock setup
- Run `npm test -- --verbose` for detailed output
- Fix individual test files before full suite

### Build Errors
- Run `npm run build` for detailed TypeScript errors
- Check for missing imports or type issues
- Ensure all dependencies are installed

### Coverage Too Low
- Run `npm run test:coverage` to see uncovered lines
- Add tests for uncovered branches
- Focus on critical business logic

### Version Conflicts
- Ensure package.json, manifest.json, versions.json are in sync
- Use `npm run version` to update all files
- Check git status for uncommitted changes

### Release Already Exists
- Check existing releases: `gh release list`
- Delete draft releases if needed
- Ensure version was properly incremented

## Critical Reminders

⚠️ **NEVER** release without:
- All tests passing (518+ tests)
- Test coverage ≥70%
- Successful build
- Updated CHANGELOG.md
- Proper version bump

⚠️ **ALWAYS** write release notes as Product Manager:
- Focus on user benefits
- Include usage scenarios
- Avoid technical jargon
- Highlight breaking changes

⚠️ **FOLLOW** commit message conventions:
- feat: new features
- fix: bug fixes
- docs: documentation
- chore: maintenance

## Quick Commands Reference

```bash
# Test suite
npm test                    # Run all tests
npm run test:coverage      # Check coverage
npm run test:watch        # Watch mode

# Build
npm run build             # Production build
npm run dev              # Development build

# Version management
npm version patch         # X.Y.Z -> X.Y.Z+1
npm version minor        # X.Y.Z -> X.Y+1.0
npm version major        # X.Y.Z -> X+1.0.0

# Git operations
git status               # Check changes
git add -A              # Stage all
git commit -m "..."    # Commit
git push origin main   # Push

# GitHub CLI
gh release list        # List releases
gh release create     # Create release
gh release delete    # Delete release
```

## Success Criteria

✅ Release is successful when:
1. All tests pass (100% success rate)
2. Coverage is ≥70%
3. Build completes without errors
4. Version files are synchronized
5. CHANGELOG.md is updated
6. GitHub release is created
7. Assets are attached (main.js, manifest.json, styles.css)
8. Release is visible on GitHub
9. BRAT can fetch the update

## Contact for Issues

If automated release fails:
1. Check GitHub Actions logs
2. Review error messages
3. Fix issues locally
4. Re-run release process
5. Verify on GitHub releases page