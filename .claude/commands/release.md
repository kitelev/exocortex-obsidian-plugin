---
description: Create a new release with semantic versioning
allowed-tools: Task, Bash(git*), Bash(npm version*), Read, Write, Edit
argument-hint: [major|minor|patch] [description]
---

# Create New Release

## Release Type: $ARGUMENTS

Please create a new release following these steps:

1. **Pre-Release Checks**
   - Run all tests and ensure they pass
   - Check git status for uncommitted changes
   - Verify CI/CD pipeline is green
   - Review recent commits for release notes

2. **Version Update**
   - Determine version bump type (major/minor/patch)
   - Update package.json version
   - Follow semantic versioning rules:
     - MAJOR: Breaking changes
     - MINOR: New features (backwards compatible)
     - PATCH: Bug fixes

3. **Update CHANGELOG.md**
   - Write user-focused release notes
   - Group changes by category:
     - Features
     - Bug Fixes
     - Performance Improvements
     - Documentation
   - Include migration notes if breaking changes

4. **Create Release Commit**
   - Stage all changes
   - Commit with message: "chore: Release vX.Y.Z - [brief description]"
   - Tag the release: vX.Y.Z

5. **Push Release**
   - Push commits to main branch
   - Push tags to trigger GitHub Actions
   - Verify automated release workflow

6. **Post-Release Verification**
   - Check GitHub releases page
   - Verify package published correctly
   - Update any dependent documentation

Use the release-agent for comprehensive release management if complex coordination is needed.
