# Agent Usage Principles for Exocortex Development

## 🎯 Core Principle: ALWAYS USE AGENTS

**CRITICAL**: Not using agents when they're available is considered a project standard violation.

## Available Agents (23 Total)

### Core Development Agents
- **swebok-engineer**: Software architecture and design (IEEE SWEBOK v3)
- **architect-agent**: System architecture (TOGAF, IEEE 1471)
- **qa-engineer**: Testing and quality (ISTQB, ISO/IEC 25010)
- **performance-agent**: Performance optimization (ISO/IEC 25010)
- **security-agent**: Security analysis (OWASP, ISO 27001)

### Process Management Agents
- **orchestrator**: Multi-agent coordination
- **product-manager**: Feature prioritization (Pragmatic Marketing)
- **scrum-master-agent**: Agile processes (Scrum Guide 2020)
- **pmbok-agent**: Project management (PMI PMBOK)
- **babok-agent**: Business analysis (IIBA BABOK v3)

### Specialized Agents
- **code-searcher**: Codebase exploration
- **error-handler**: Error diagnosis and resolution
- **test-fixer-agent**: Automated test fixing (TDD/BDD)
- **code-review-agent**: Code quality review (IEEE 1028)
- **meta-agent**: Agent system optimization (CMMI, Kaizen)

### Support Agents
- **technical-writer-agent**: Documentation (DITA, IEEE)
- **ux-design-expert**: UX/UI design and optimization
- **devops-engineer**: CI/CD and infrastructure (DORA, SRE)
- **integration-agent**: Third-party integrations (OpenAPI 3.1)
- **compliance-agent**: Regulatory compliance (GDPR, ISO 27001)
- **data-analyst-agent**: Data analysis (DMBOK, CRISP-DM)
- **community-manager-agent**: Community engagement (CMBOK)
- **ux-researcher-agent**: User research (ISO 9241-210)

## Task-to-Agent Mapping

### Feature Development
```yaml
Pattern: Feature Development Pipeline
Agents: [product-manager, swebok-engineer, qa-engineer, technical-writer-agent]
Parallel: Yes
Example: Implementing Better Error Messages
```

### Bug Fixing
```yaml
Pattern: Debug and Fix
Agents: [error-handler, code-searcher, test-fixer-agent, qa-engineer]
Parallel: Yes
Example: Fixing flaky tests
```

### Architecture Review
```yaml
Pattern: Architecture Analysis
Agents: [architect-agent, swebok-engineer, security-agent, performance-agent]
Parallel: Yes
Example: Reviewing RDF conversion architecture
```

### Code Quality
```yaml
Pattern: Quality Assessment
Agents: [code-review-agent, qa-engineer, performance-agent, security-agent]
Parallel: Yes
Example: Pre-release code review
```

## Parallel Execution Patterns

### Pattern 1: Feature Development Pipeline
```
Stage 1: [product-manager] → Requirements
Stage 2: [babok-agent, architect-agent] → Design (PARALLEL)
Stage 3: [swebok-engineer] → Implementation
Stage 4: [qa-engineer, performance-agent] → Testing (PARALLEL)
Stage 5: [technical-writer-agent] → Documentation
```

### Pattern 2: Bug Investigation
```
Parallel Execution:
- error-handler: Root cause analysis
- code-searcher: Find related code
- qa-engineer: Test coverage analysis
- performance-agent: Performance impact
```

### Pattern 3: System Analysis
```
Parallel Execution:
- architect-agent: Architecture assessment
- security-agent: Security audit
- performance-agent: Performance analysis
- compliance-agent: Compliance check
```

## Agent Selection Algorithm

```
IF task involves multiple files OR complexity > simple:
    IF feature_development:
        USE Feature Development Pipeline
    ELIF bug_fix:
        USE Debug and Fix Pattern
    ELIF architecture_change:
        USE Architecture Analysis Pattern
    ELIF quality_review:
        USE Quality Assessment Pattern
    ELSE:
        SELECT 3-5 most relevant agents
        EXECUTE in parallel where possible
ELSE:
    MAY work without agents (simple, single-file tasks)
```

## Performance Metrics

### Target Metrics
- **Agent Utilization Rate**: >80% for complex tasks
- **Parallel Execution Rate**: >60% of agent calls
- **Task Success Rate**: >95% with agents
- **Time Savings**: 40-60% with parallel execution

### Monitoring
- Track agent usage per session
- Measure task completion time
- Monitor quality improvements
- Adjust patterns based on results

## Common Mistakes to Avoid

1. **Working alone** - Always use agents for non-trivial tasks
2. **Sequential execution** - Run agents in parallel when possible
3. **Wrong agent selection** - Match agent expertise to task domain
4. **Ignoring meta-agent** - Use for continuous improvement
5. **Not documenting patterns** - Update this file with new patterns

## Session Checklist

- [ ] Read CLAUDE.md and CLAUDE-agents.md at session start
- [ ] Identify tasks requiring agents
- [ ] Select appropriate agents using algorithm
- [ ] Execute agents in parallel where possible
- [ ] Document any new patterns discovered
- [ ] Update session-handoff.md with agent usage

## Examples from Current Session

### Good Example (After Correction)
```
Task: Analyze system state
Agents Used (Parallel):
- swebok-engineer: Architecture analysis
- qa-engineer: Test quality assessment
- product-manager: Feature prioritization
- performance-agent: Flaky test resolution
- meta-agent: Usage optimization
Result: Comprehensive analysis in 40% less time
```

### Bad Example (Initial Approach)
```
Task: Analyze system state
Agents Used: orchestrator (1 agent only)
Result: Superficial analysis, missed critical issues
```

## Recovery Protocol

If you realize you haven't been using agents:
1. STOP current approach
2. Identify appropriate agents for the task
3. Launch 3-5 agents in parallel
4. Synthesize results
5. Update this document with learnings

---

**Remember**: The 23 agents are your team. Use them liberally and in parallel for maximum effectiveness.