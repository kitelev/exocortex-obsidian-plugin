---
description: Execute task with complete delivery pipeline from code to production
allowed-tools: Task, TodoWrite, Read, Write, Edit, MultiEdit, Grep, Glob, LS, Bash, WebSearch, WebFetch
argument-hint: [task description]
---

# EXECUTE-COMPLETE-DELIVERY-PIPELINE

## Task: $ARGUMENTS

## Execution Mode: FULL-PIPELINE-DELIVERY

### CRITICAL: This command does NOT stop until ALL delivery stages are complete:

#### Stage 1: Task Analysis & Agent Deployment
1. **Analyze task complexity** and domain requirements
2. **Deploy 3-5 specialized agents** in parallel formation
3. **Execute implementation** with continuous quality monitoring
4. **Validate implementation** meets all requirements

#### Stage 2: Quality Gate Validation (WITH RETRY LOGIC)
1. **Run comprehensive tests** - RETRY up to 3 times if failures
2. **Verify test coverage >70%** - FIX coverage gaps if below threshold
3. **Build verification** - RETRY build if compilation errors
4. **Code quality checks** - ADDRESS all quality issues before proceeding

#### Stage 3: Local Release Preparation (MANDATORY)
1. **Version bump** in package.json (patch/minor/major based on changes)
2. **Update CHANGELOG.md** with user-focused release notes
3. **Validate manifest.json** version sync
4. **Commit changes** with conventional commit message
5. **VERIFY**: Local git state is clean and ready for push

#### Stage 4: GitHub Release & CI/CD Pipeline (MONITORED)
1. **Push to main branch** triggering auto-release workflow
2. **Monitor GitHub Actions** until ALL workflows complete:
   - auto-release.yml (REQUIRED: SUCCESS)
   - ci.yml (REQUIRED: SUCCESS) 
   - quality-gate.yml (REQUIRED: SUCCESS)
   - all-tests.yml (REQUIRED: SUCCESS)
3. **Verify GitHub Release** created with correct assets
4. **RETRY FAILED WORKFLOWS** up to 2 times with fixes

#### Stage 5: Production Validation (COMPLETION GATE)
1. **Confirm GitHub Release** is published and accessible
2. **Validate release assets** (main.js, manifest.json, .zip package)
3. **Check workflow status** - ALL must be green ✅
4. **Generate delivery report** with complete audit trail

### RETRY & RECOVERY LOGIC:

```bash
# Test Retry Pattern (Max 3 attempts)
for attempt in 1 2 3; do
  if npm test; then break; fi
  echo "Test attempt $attempt failed, analyzing and fixing..."
  # Apply common fixes: memory limits, test isolation, mock updates
done

# Build Retry Pattern (Max 2 attempts)
for attempt in 1 2; do
  if npm run build; then break; fi
  echo "Build attempt $attempt failed, checking dependencies..."
  # Clear cache, reinstall if needed
done

# CI/CD Monitoring Pattern (Max 30 minutes)
timeout=1800  # 30 minutes
while [ $timeout -gt 0 ]; do
  status=$(gh run list --limit 1 --json status --jq '.[0].status')
  if [ "$status" = "completed" ]; then break; fi
  sleep 30; timeout=$((timeout-30))
done
```

### AGENT SELECTION MATRIX:

| Task Type | Required Agents (3-5) | Parallel Execution |
|-----------|----------------------|-------------------|
| **Bug fixes** | error-handler, technical-stabilization-agent, qa-engineer, meta-agent | ✅ Parallel investigation |
| **Features** | product-manager, architect-agent, swebok-engineer, qa-engineer, meta-agent | ✅ Pipeline parallel |
| **Performance** | performance-agent, swebok-engineer, qa-engineer, devops-engineer | ✅ Domain parallel |
| **Documentation** | technical-writer-agent, ux-researcher-agent, qa-engineer | ✅ Content parallel |
| **Infrastructure** | devops-engineer, architect-agent, swebok-engineer, meta-agent | ✅ Layer parallel |
| **Release** | release-agent, devops-engineer, qa-engineer, meta-agent | ✅ Sequential gates |

### QUALITY GATES (NON-NEGOTIABLE):

```yaml
Code_Quality:
  - TypeScript compilation: CLEAN
  - Test suite: >70% coverage, ALL PASSING
  - ESLint: CLEAN (if configured)
  - Build output: main.js generated successfully

Release_Quality:
  - Version: Properly incremented
  - CHANGELOG.md: Updated with user-focused notes
  - Manifest sync: Version consistency across files
  - Git state: Clean working directory

Production_Quality:
  - GitHub Release: Published with assets
  - CI/CD Pipeline: ALL workflows GREEN
  - Package integrity: All required files present
  - Documentation: Updated and accurate
```

### MONITORING & REPORTING:

#### Real-time Status Updates:
- ⏳ Stage progress with timestamps
- ✅ Completed steps with validation
- ❌ Failed steps with retry attempts
- 🔄 Retry operations with rationale
- 📊 Final delivery metrics

#### Completion Report:
1. **Execution Summary**: Tasks completed, agents used, time elapsed
2. **Quality Metrics**: Test results, coverage, build status
3. **Release Details**: Version, changelog, GitHub release URL
4. **CI/CD Status**: All workflow results with links
5. **Production Validation**: Final system state confirmation

### FAILURE HANDLING:

The command will NOT complete until:
- All tests pass (with retry logic)
- Code builds successfully 
- Local release is prepared
- GitHub push succeeds
- CI/CD pipelines complete successfully
- GitHub Release is published

**If any step fails after all retries**: Command reports detailed failure analysis and provides specific remediation steps for manual intervention.

### SUCCESS CRITERIA:

✅ **COMPLETE DELIVERY** achieved when:
1. Code changes implemented and tested
2. Local version incremented and committed
3. GitHub Release published with assets
4. ALL CI/CD workflows showing green status
5. Production system validated and operational

Execute the complete delivery pipeline with maximum reliability and transparency.