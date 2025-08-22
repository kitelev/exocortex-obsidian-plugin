# Exocortex Agent Utilization Guide

_Maximize agent effectiveness through systematic selection and parallel execution_

## Quick Decision Tree

### Step 1: Categorize Your Task

```
❓ Is this a single-file bug fix?
   → YES: Use Error_Handler + SWEBOK_Engineer (2 agents)

❓ Is this a new user-facing feature?
   → YES: Use Feature Development Pipeline (5 agents parallel)

❓ Is this an architectural change?
   → YES: Use Concurrent Analysis Pattern (4-6 agents)

❓ Is this documentation or process improvement?
   → YES: Use Technical_Writer + domain expert (2 agents)
```

### Step 2: Apply Execution Pattern

#### Pattern A: Simple Fix (1-2 agents, 30-90 minutes)

```yaml
Use_When: "Single file changes, clear problem definition"
Agents:
  - Primary: Error_Handler OR SWEBOK_Engineer
  - Quality: QA_Engineer (for testing)
Example: "Fix TypeScript compilation error in RDF parser"
```

#### Pattern B: Feature Pipeline (5 agents, 2-8 hours)

```yaml
Use_When: "New functionality requiring design, implementation, testing"
Stage_1: Product_Manager → User stories (30min)
Stage_2_Parallel:
  - BABOK → Detailed requirements (1h)
  - Architect → Technical design (1h)
Stage_3: SWEBOK_Engineer → Implementation (2-4h)
Stage_4_Parallel:
  - QA_Engineer → Testing (1h)
  - Technical_Writer → Documentation (1h)
Example: "Add SPARQL autocomplete feature"
```

#### Pattern C: Analysis Swarm (4-8 agents, 1-2 hours)

```yaml
Use_When: "Complex problems requiring multiple perspectives"
Concurrent_Analysis:
  - Error_Handler → Root cause analysis
  - Security_Agent → Security implications
  - Performance_Agent → Performance impact
  - Architect → Architectural considerations
  - Data_Analyst → Usage patterns (if applicable)
Synthesis: Orchestrator → Consolidated recommendations
Example: "Optimize RDF query performance"
```

#### Pattern D: Quality Assurance Network (3-4 agents, ongoing)

```yaml
Use_When: "Critical implementations requiring continuous validation"
Primary: SWEBOK_Engineer → Core development
Continuous_Support:
  - Code_Review_Agent → Real-time code review
  - Test_Fixer → Automated test maintenance
  - Security_Agent → Security validation
Example: "Implement new authentication system"
```

## Agent Selection Cheatsheet

### By Task Type

```
🐛 Bug Fixes: Error_Handler + SWEBOK_Engineer + QA_Engineer
📋 Requirements: Product_Manager + BABOK + UX_Researcher
🏗️ Architecture: Architect + SWEBOK_Engineer + Performance_Agent
⚡ Performance: Performance_Agent + SWEBOK_Engineer + Data_Analyst
🔒 Security: Security_Agent + SWEBOK_Engineer + Compliance
📚 Documentation: Technical_Writer + domain_expert
🧪 Testing: QA_Engineer + Test_Fixer + SWEBOK_Engineer
🚀 Release: Release_Agent + DevOps + QA_Engineer
```

### By Complexity Level

```
Simple (1-2h): 1-2 agents maximum
Moderate (2-4h): 2-3 agents with handoffs
Complex (4-8h): 3-5 agents with parallel execution
Architectural (8h+): 5-8 agents with staged approach
```

## Parallel Execution Rules

### When to Use Parallel Agents

✅ **DO use parallel when:**

- Tasks have independent deliverables
- Different expertise domains required
- Quality gates can run concurrently
- Analysis can be done from multiple angles

❌ **DON'T use parallel when:**

- Tasks have strict dependencies
- Shared file modifications required
- Single-threaded thinking needed
- Resource contention likely

### Coordination Strategies

#### Light Coordination (2-3 agents)

```yaml
Communication: Shared task file updates
Sync_Frequency: Every 30 minutes
Conflict_Resolution: Automatic via file timestamps
```

#### Medium Coordination (4-5 agents)

```yaml
Communication: Orchestrator facilitated
Sync_Frequency: Every 15 minutes during critical phases
Conflict_Resolution: Orchestrator arbitration
```

#### Heavy Coordination (6+ agents)

```yaml
Communication: Formal handoff protocols
Sync_Frequency: Continuous during overlapping work
Conflict_Resolution: Meta_Agent escalation
```

## Session Optimization Checklist

### Before Starting (5 minutes)

- [ ] Read session handoff notes from `.claude/session-handoff.md`
- [ ] Check active tasks in `.claude/tasks/active/`
- [ ] Identify task complexity and domain
- [ ] Select execution pattern
- [ ] Assign agents using decision tree

### During Execution

- [ ] Update task status every 30 minutes
- [ ] Monitor agent handoffs for knowledge loss
- [ ] Adjust parallelism if coordination overhead too high
- [ ] Escalate blockers within 15 minutes

### After Completion (10 minutes)

- [ ] Update all task files with outcomes
- [ ] Document lessons learned
- [ ] Update agent performance metrics
- [ ] Create session handoff notes
- [ ] Archive completed tasks

## Performance Targets

### Individual Agent Metrics

```yaml
Utilization_Rate: >75% (avoid over/under utilization)
Task_Success_Rate: >95% (first-time completion)
Handoff_Efficiency: >90% (knowledge retention)
Response_Time: <5 minutes (initial response to assignment)
```

### System-Wide Metrics

```yaml
Parallel_Execution_Success: >85% (concurrent tasks complete)
Load_Distribution: <20% variance (balanced workload)
Escalation_Rate: <10% (tasks requiring meta-agent help)
Session_Continuity: 100% (no lost tasks)
```

## Common Anti-Patterns to Avoid

### 1. "Single Agent Syndrome"

❌ **Problem**: Using only Orchestrator or SWEBOK for everything
✅ **Solution**: Always consider if specialized expertise would be valuable

### 2. "Parallel Everything"

❌ **Problem**: Making every task parallel regardless of dependencies
✅ **Solution**: Use parallel execution only when tasks are truly independent

### 3. "Agent Hopping"

❌ **Problem**: Switching agents mid-task without proper handoffs
✅ **Solution**: Complete logical units before handoffs, document context

### 4. "Over-Engineering"

❌ **Problem**: Using 8 agents for simple tasks
✅ **Solution**: Match complexity to agent count (simple=1-2, complex=3-5, architectural=5-8)

## Emergency Procedures

### When Parallel Execution Fails

1. Stop all parallel work immediately
2. Assess conflicting changes
3. Designate single agent as conflict resolver
4. Resume with sequential execution
5. Document lessons learned

### When Agent Selection Was Wrong

1. Acknowledge mismatch early
2. Complete current logical unit
3. Proper handoff to correct agent
4. Update selection criteria for future

### When Coordination Overhead Too High

1. Reduce parallel agents by 50%
2. Increase synchronization frequency
3. Designate coordination agent
4. Consider sequential fallback

## Success Examples

### Example 1: Feature Implementation

**Task**: "Add graph export functionality"
**Pattern Used**: Feature Pipeline
**Agents**: Product_Manager → BABOK + Architect → SWEBOK → QA + Technical_Writer
**Result**: 4-hour task completed in 2.5 hours with full documentation and tests

### Example 2: Performance Investigation

**Task**: "SPARQL queries running slow"
**Pattern Used**: Analysis Swarm
**Agents**: Performance_Agent + Data_Analyst + SWEBOK + Architect (parallel)
**Result**: Root cause identified in 45 minutes, solution implemented in 1 hour

### Example 3: Security Review

**Task**: "Review RDF input sanitization"
**Pattern Used**: Quality Network
**Agents**: Security_Agent + Code_Review + Compliance + SWEBOK
**Result**: 15 vulnerabilities found and fixed, comprehensive security audit

---

## Quick Reference Commands

```bash
# Check agent status
ls -la .claude/agents/

# Review active tasks
ls -la .claude/tasks/active/

# Check session handoff
cat .claude/session-handoff.md

# Update task status
# Use TodoWrite tool with agent coordination
```

Remember: **The goal is maximum value delivery, not maximum agent utilization.** Use the right agents for the job, coordinate effectively, and always prioritize task completion over process perfection.
