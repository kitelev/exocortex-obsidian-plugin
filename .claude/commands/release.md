---
description: Create a new release with semantic versioning
allowed-tools: Task
argument-hint: [major|minor|patch] [optional description]
---

# 🚀 Create New Release - ZERO-TOLERANCE Process

**MANDATORY**: This command ALWAYS uses the specialized **release-agent** which follows a bulletproof 20-step process.

## Arguments Provided: $ARGUMENTS

**Invoking release-agent with full quality gates...**

---

## Task for release-agent

You are the **release-agent** specialist. Execute the complete 20-step release process from `.claude/agents/release-agent.md`.

### Context:
- Release type: $ARGUMENTS (or determine from changes if not provided)
- Project: Exocortex Obsidian Plugin
- Mandatory requirements from CLAUDE.md (especially RULE 1)

### Your Mission:

**Execute ALL 20 steps in the documented release process:**

#### Phase 1: Pre-Release Validation (Steps 1-4)
- Check git status
- Pull latest changes
- Run complete test suite
- Check version uniqueness

#### Phase 2: Version Management (Steps 5-8)
- Determine version bump type
- Bump package.json
- Update manifest.json
- Verify version synchronization

#### Phase 3: Changelog Update (Steps 9-10)
- Update CHANGELOG.md with user-focused content
- Validate changelog entry

#### Phase 4: Commit and Push (Steps 11-14)
- Stage changes
- Create conventional commit
- Verify pre-commit hook
- Push to GitHub

#### Phase 5: Release Verification (Steps 15-20) ⚠️ MOST CRITICAL
- Wait for CI/CD pipeline (90s)
- Check pipeline status
- **VERIFY release created** (MANDATORY)
- View release details
- **VERIFY GitHub Actions GREEN** (MANDATORY)
- Report completion with full checklist

### Critical Requirements:

1. ✅ **NEVER skip Step 17** (verify release created)
2. ✅ **NEVER skip Step 19** (verify pipeline GREEN)
3. ✅ **ALWAYS wait** for pipeline completion (Step 15)
4. ✅ **ALWAYS report** full completion checklist (Step 20)

### Success Criteria:

Report is INCOMPLETE unless ALL verified:
- ✅ Version bumped in package.json AND manifest.json
- ✅ Versions match exactly
- ✅ CHANGELOG.md updated
- ✅ All tests passed
- ✅ Pre-commit hook passed
- ✅ Code pushed to GitHub
- ✅ CI/CD pipeline is GREEN ✅
- ✅ Release created and visible on GitHub
- ✅ Release date is TODAY
- ✅ Assets attached to release

### If ANY step fails:

- Follow error handling protocol from release-agent.md
- DO NOT proceed until issue resolved
- Report error to user with clear explanation

---

**Remember**: This is a ZERO-TOLERANCE process. One skipped step = incomplete release = project violation.

Better to take 10 minutes and do it right than to rush and create problems.
