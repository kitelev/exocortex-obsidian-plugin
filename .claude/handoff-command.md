# /handoff Command Documentation
*Ensure seamless Claude Code session continuity with complete context preservation*

## Overview

The `/handoff` command generates a comprehensive prompt template that captures complete session context, enforces mandatory agent usage patterns, and provides clear recovery steps for continuing work in a new Claude Code session.

## Command Syntax

```bash
/handoff [options]
```

### Options
- `--include-git` - Include detailed git status and recent commits
- `--include-tasks` - Include active and completed task details
- `--include-agents` - Include agent utilization analysis
- `--format=json|markdown` - Output format (default: markdown)

## Implementation

### Core Command Function

```typescript
interface HandoffContext {
  sessionSummary: SessionSummary;
  projectState: ProjectState;
  agentUtilization: AgentUtilization;
  criticalFiles: CriticalFiles;
  recoveryInstructions: RecoveryInstructions;
  warningSignals: WarningSignal[];
}

interface SessionSummary {
  duration: string;
  mainAchievements: string[];
  completedTasks: TaskSummary[];
  blockers: BlockingIssue[];
  agentViolations: AgentViolation[];
}

interface ProjectState {
  gitStatus: GitStatus;
  testResults: TestResults;
  buildStatus: BuildStatus;
  packageVersion: string;
  lastCommit: CommitInfo;
}

interface AgentUtilization {
  totalAgentsAvailable: number;
  agentsUsed: string[];
  utilizationRate: number;
  patternsFollowed: string[];
  patternsViolated: string[];
  recommendedNextAgents: string[];
}

interface CriticalFiles {
  modifiedFiles: string[];
  memoryBankFiles: string[];
  configFiles: string[];
  testFiles: string[];
}

interface RecoveryInstructions {
  immediateActions: Action[];
  priorityTasks: PriorityTask[];
  agentAssignments: AgentAssignment[];
  qualityGates: QualityGate[];
}

class HandoffGenerator {
  generateHandoffPrompt(context: HandoffContext): string {
    return `
# 🚨 EXOCORTEX SESSION HANDOFF - CRITICAL CONTEXT RECOVERY

**MANDATORY: Read this ENTIRE prompt before taking ANY action**

## 🔥 CRITICAL PROJECT RULES - VIOLATIONS WILL FAIL
1. **NEVER WORK ALONE**: Every significant task MUST use 3-5 specialized agents
2. **AGENT PATTERNS MANDATORY**: Follow AGENT-UTILIZATION-GUIDE.md patterns
3. **QUALITY GATES**: All tests must pass, coverage >70%, clean commits only
4. **NO SOLO WORK**: Agent usage violations are project standard violations

## 📊 SESSION CONTEXT SNAPSHOT
${this.generateSessionSummary(context.sessionSummary)}

## 🎯 PROJECT STATE RECOVERY
${this.generateProjectState(context.projectState)}

## 🤖 AGENT SYSTEM STATUS
${this.generateAgentUtilization(context.agentUtilization)}

## 📁 CRITICAL FILES REFERENCE
${this.generateCriticalFiles(context.criticalFiles)}

## 🔄 IMMEDIATE RECOVERY PROTOCOL
${this.generateRecoveryInstructions(context.recoveryInstructions)}

## ⚠️ WARNING SIGNALS TO MONITOR
${this.generateWarningSignals(context.warningSignals)}

## 🚀 SUCCESS CRITERIA
${this.generateSuccessCriteria()}

## 🔗 MEMORY BANK INTEGRATION
You MUST read these files before starting work:
- CLAUDE.md - Core project instructions
- .claude/AGENT-UTILIZATION-GUIDE.md - Agent selection patterns
- .claude/session-handoff.md - Previous session context
- CLAUDE-roadmap.md - Current roadmap and priorities

## 🎯 NEXT ACTION PROTOCOL
1. Read memory bank files (15 minutes)
2. Run \`npm test\` to verify current state
3. Select agents using decision tree
4. Create TodoWrite with agent assignments
5. Begin work with proper coordination

**Remember: This is a professional software product requiring multi-agent collaboration**
    `;
  }
}
```

### Template Sections

#### Session Summary Template
```markdown
## 📊 SESSION SUMMARY
**Duration**: {{sessionDuration}}
**Main Achievements**: 
{{#achievements}}
- ✅ {{description}} ({{impact}})
{{/achievements}}

**Completed Tasks**:
{{#completedTasks}}
- {{taskId}}: {{title}} - {{status}}
{{/completedTasks}}

**Blocking Issues**:
{{#blockers}}
- 🚨 {{severity}}: {{description}}
  - Impact: {{impact}}
  - Required Agents: {{requiredAgents}}
{{/blockers}}

**Agent Usage Violations**:
{{#violations}}
- ❌ {{violationType}}: {{description}}
  - Should have used: {{recommendedPattern}}
  - Impact: {{businessImpact}}
{{/violations}}
```

#### Project State Template
```markdown
## 🎯 PROJECT STATE
**Git Status**: {{gitStatus}}
- Modified Files: {{modifiedFilesCount}}
- Untracked Files: {{untrackedFilesCount}}
- Last Commit: {{lastCommitHash}} - {{lastCommitMessage}}

**Test Results**: {{testPassRate}}% passing ({{passCount}}/{{totalCount}})
{{#testFailures}}
- 🔴 {{testFile}}: {{failureCount}} failures
{{/testFailures}}

**Build Status**: {{buildStatus}}
**Package Version**: {{currentVersion}}
**Release Status**: {{releaseStatus}}
```

#### Agent Utilization Template
```markdown
## 🤖 AGENT SYSTEM STATUS
**Available Agents**: {{totalAgents}}
**Agents Used This Session**: {{usedAgents.length}}/{{totalAgents}} ({{utilizationRate}}%)
{{#usedAgents}}
- {{agentName}}: {{utilizationTime}} - {{effectiveness}}
{{/usedAgents}}

**Pattern Compliance**:
✅ Patterns Followed: {{followedPatterns}}
❌ Patterns Violated: {{violatedPatterns}}

**Recommended Next Agents**:
{{#recommendedAgents}}
- {{agentName}}: {{reason}} ({{pattern}})
{{/recommendedAgents}}
```

## Recovery Protocol Templates

### Immediate Actions Checklist
```yaml
Pre_Work_Validation:
  - [ ] Read session-handoff.md completely (5 min)
  - [ ] Read AGENT-UTILIZATION-GUIDE.md (10 min) 
  - [ ] Check CLAUDE.md agent usage rules (2 min)
  - [ ] Run npm test and analyze results (2 min)
  - [ ] Identify task complexity and pattern (3 min)

Agent_Selection:
  - [ ] Use decision tree from utilization guide
  - [ ] Select 3-5 agents minimum for significant tasks
  - [ ] Document agent assignments in TodoWrite
  - [ ] Plan coordination strategy
  - [ ] Set success metrics

Quality_Gates:
  - [ ] All tests must pass before commits
  - [ ] Coverage must remain >70%
  - [ ] Agent sign-offs required for deliverables
  - [ ] Documentation updates for new features
```

### Priority Task Assignment Template
```markdown
## 🎯 PRIORITY TASK ASSIGNMENTS

### IMMEDIATE PRIORITY (Next 30 minutes)
**Task**: {{urgentTask.title}}
**Pattern**: {{urgentTask.pattern}}
**Required Agents**: 
{{#urgentTask.agents}}
- {{agentName}}: {{responsibility}}
{{/urgentTask.agents}}
**Success Criteria**: {{urgentTask.successCriteria}}
**Blocking**: {{urgentTask.blockingReason}}

### HIGH PRIORITY (Next 2 hours)
{{#highPriorityTasks}}
**Task**: {{title}}
**RICE Score**: {{riceScore}}
**Agents**: {{requiredAgents}}
**Dependencies**: {{dependencies}}
{{/highPriorityTasks}}
```

## Sample Generated Prompt

Based on the current session state, here's a sample prompt the `/handoff` command would generate:

```markdown
# 🚨 EXOCORTEX SESSION HANDOFF - CRITICAL CONTEXT RECOVERY

**MANDATORY: Read this ENTIRE prompt before taking ANY action**

Working Directory: `/Users/kitelev/Documents/exocortex-obsidian-plugin/`

## 🔥 CRITICAL PROJECT RULES - VIOLATIONS WILL FAIL
1. **NEVER WORK ALONE**: Every significant task MUST use 3-5 specialized agents
2. **AGENT PATTERNS MANDATORY**: Follow AGENT-UTILIZATION-GUIDE.md patterns  
3. **QUALITY GATES**: All tests must pass, coverage >70%, clean commits only
4. **NO SOLO WORK**: Agent usage violations are project standard violations

## 📊 SESSION SUMMARY
**Duration**: ~2.5 hours
**Main Achievements**: 
- ✅ Graph Export feature COMPLETED (RICE: 5400) - PNG/SVG export with theming
- ✅ Updated roadmap to reflect completion status
- ✅ Created comprehensive implementation documentation

**Completed Tasks**:
- TASK-2025-002: Fix IRI validation ✅
- TASK-2025-003: Optimize RDF indexing ✅ 
- TASK-2025-004: Fix test failures ✅
- TASK-2025-005: Prioritize backlog ✅
- EPIC-001: Multi-agent system ✅

**Blocking Issues**:
- 🚨 CRITICAL: 7 test failures in GraphVisualizationProcessor.export.test.ts
  - Impact: Blocks CI/CD and release
  - Required Agents: QA_Engineer + Test_Fixer + Error_Handler

**Agent Usage Violations**:
- ❌ Solo Work Pattern: Worked mostly alone despite requirements
  - Should have used: Feature Pipeline Pattern (5 agents)
  - Impact: Suboptimal results, user dissatisfaction, missed insights

## 🎯 PROJECT STATE
**Git Status**: DIRTY - Multiple uncommitted changes
- Modified Files: 5 (IndexedGraph.ts, GraphVisualizationProcessor.ts, etc.)
- Untracked Files: 15+ (new agent files, completed tasks, summaries)
- Last Commit: `9f5f195 feat: complete multi-agent ecosystem with dynamic agent creation`

**Test Results**: 98.7% passing (544/551)
- 🔴 GraphVisualizationProcessor.export.test.ts: 7 failures

**Build Status**: ✅ PASSING
**Package Version**: 2.10.0
**Release Status**: Ready for v2.11.0 after test fix

## 🤖 AGENT SYSTEM STATUS  
**Available Agents**: 23 professional agents
**Agents Used This Session**: 2/23 (~9% utilization) - SEVERE UNDER-UTILIZATION
- Orchestrator: 90% of work - VIOLATION
- Technical_Writer: Brief documentation - INSUFFICIENT

**Pattern Compliance**:
❌ Patterns Violated: Feature Pipeline, Analysis Swarm, Quality Network
✅ Patterns Followed: None properly implemented

**Recommended Next Agents**:
- QA_Engineer: Test failure analysis and resolution (Pattern A)
- Test_Fixer: Automated test maintenance (Pattern A)  
- Error_Handler: Root cause analysis of failures (Pattern A)

## 📁 CRITICAL FILES REFERENCE
**Memory Bank Files (MUST READ)**:
- `/Users/kitelev/Documents/exocortex-obsidian-plugin/CLAUDE.md` - Core instructions
- `/Users/kitelev/Documents/exocortex-obsidian-plugin/.claude/AGENT-UTILIZATION-GUIDE.md` - Agent patterns
- `/Users/kitelev/Documents/exocortex-obsidian-plugin/.claude/session-handoff.md` - Session context
- `/Users/kitelev/Documents/exocortex-obsidian-plugin/CLAUDE-roadmap.md` - Current roadmap

**Modified Files**:
- `src/domain/semantic/core/IndexedGraph.ts` - Performance optimizations
- `src/presentation/processors/GraphVisualizationProcessor.ts` - Export functionality
- `tests/unit/domain/semantic/IndexedGraph.test.ts` - Test updates

**Test Files**:
- `tests/unit/presentation/GraphVisualizationProcessor.export.test.ts` - FAILING (7 tests)

## 🔄 IMMEDIATE RECOVERY PROTOCOL

### Phase 1: Context Recovery (15 minutes)
1. **Read Memory Bank Files**:
   ```bash
   # Read these files in order:
   cat CLAUDE.md  # Project instructions
   cat .claude/AGENT-UTILIZATION-GUIDE.md  # Agent selection guide
   cat .claude/session-handoff.md  # Previous session context
   ```

2. **Verify Current State**:
   ```bash
   npm test  # Check exact test failures
   npm run build  # Verify compilation
   git status  # See uncommitted changes
   ```

### Phase 2: Agent Selection (5 minutes)
3. **Apply Decision Tree** (from AGENT-UTILIZATION-GUIDE.md):
   - Task: Fix test failures (Simple Fix)
   - Pattern: Pattern A (Simple Fix)
   - Required Agents: 3 minimum
   - Coordination: Light coordination

4. **Create TodoWrite with Agent Assignments**:
   ```typescript
   // Use TodoWrite tool with these assignments:
   {
     "todos": [
       {
         "id": "test-fix-001",
         "content": "QA_Engineer: Analyze 7 test failures in GraphVisualizationProcessor.export.test.ts",
         "status": "pending"
       },
       {
         "id": "test-fix-002", 
         "content": "Test_Fixer: Implement test fixes based on QA analysis",
         "status": "pending"
       },
       {
         "id": "test-fix-003",
         "content": "Error_Handler: Root cause analysis and prevention strategies",
         "status": "pending"  
       }
     ]
   }
   ```

### Phase 3: Execution (30-60 minutes)
5. **Parallel Analysis** (15 minutes):
   - QA_Engineer analyzes test failures
   - Error_Handler identifies root causes
   - Test_Fixer plans remediation

6. **Sequential Implementation** (30-45 minutes):
   - Apply fixes based on analysis
   - Verify all tests pass
   - Ensure no regressions

## ⚠️ WARNING SIGNALS TO MONITOR
- Working alone for >30 minutes without agent consultation
- Making technical decisions without proper agent expertise
- Skipping agent selection and coordination steps
- Test failures not addressed by QA_Engineer
- Commits without full test suite passing

## 🚀 SUCCESS CRITERIA
**Immediate (Next 30 minutes)**:
- [ ] All 7 test failures resolved
- [ ] Test suite 100% passing
- [ ] Clean git status ready for commit

**Session (Next 2 hours)**:
- [ ] Agent utilization >75% (vs current 9%)
- [ ] Proper pattern selection documented
- [ ] Clean commit with version bump to v2.11.0
- [ ] Next priority feature identified and agents assigned

**Quality Gates**:
- [ ] npm test passes 100%
- [ ] npm run build succeeds
- [ ] All agent sign-offs documented
- [ ] Session handoff notes updated

## 🔗 MEMORY BANK INTEGRATION
**MUST READ before starting work**:
```bash
# Required reading order (25 minutes total):
cat CLAUDE.md                                    # 10 minutes
cat .claude/AGENT-UTILIZATION-GUIDE.md          # 10 minutes  
cat .claude/session-handoff.md                  # 5 minutes
```

**Reference During Work**:
- CLAUDE-roadmap.md - Current priorities
- .claude/agents/*.md - Agent capabilities
- tests/ - Usage patterns and examples

## 🎯 NEXT ACTION PROTOCOL
1. **Read memory bank files** (15 minutes) - NO EXCEPTIONS
2. **Run `npm test`** to see current failures
3. **Use AGENT-UTILIZATION-GUIDE.md decision tree** to select agents
4. **Create TodoWrite** with proper agent assignments
5. **Execute Pattern A (Simple Fix)** with 3 agents minimum
6. **Verify success criteria** before any commits

## 🚨 RECOVERY VERIFICATION
Before starting ANY work, confirm:
- [ ] I have read all memory bank files completely
- [ ] I understand the agent usage requirements  
- [ ] I have selected 3+ agents for the task
- [ ] I have a clear coordination strategy
- [ ] I know the current test failure details

**Remember**: This is a professional software product requiring multi-agent collaboration. Solo work violates core project standards and produces suboptimal results.

---
**Session ID**: 2025-01-10-handoff
**Generated**: 2025-01-10T20:00:00Z
**Target**: New Claude Code session with full context recovery
```

## Usage Instructions

### For Users
1. At end of session, run `/handoff` command
2. Copy the generated prompt 
3. Paste complete prompt into new Claude Code session
4. Allow new session to read memory bank files
5. Verify recovery protocol completion

### For Implementation
The `/handoff` command should:
1. Scan current project state
2. Analyze agent utilization patterns
3. Identify blocking issues
4. Generate recovery-focused prompt
5. Include all critical context
6. Enforce mandatory agent usage

## Quality Assurance

### Command Testing
```bash
# Test scenarios:
/handoff --test-scenario="clean-state"
/handoff --test-scenario="failing-tests" 
/handoff --test-scenario="dirty-git"
/handoff --test-scenario="agent-violations"
```

### Validation Metrics
- Context completeness: 100% of critical state captured
- Recovery success rate: >95% successful session continuity
- Agent enforcement: 100% of handoffs include agent requirements
- Memory bank integration: All critical files referenced

## Anti-Patterns to Avoid

### Common Handoff Failures
1. **Incomplete Context**: Missing critical state information
2. **Agent Amnesia**: Not enforcing mandatory agent usage
3. **Priority Confusion**: Unclear next actions
4. **Quality Gate Skip**: Missing test/build status
5. **Memory Bank Gap**: Not referencing critical documentation

### Prevention Strategies
1. Standardized template with required sections
2. Validation checklist for generated prompts
3. Agent usage enforcement warnings
4. Critical file reference verification
5. Recovery protocol testing

This `/handoff` command ensures seamless session continuity while enforcing the project's mandatory multi-agent collaboration requirements.