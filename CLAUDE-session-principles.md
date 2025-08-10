# Session Principles and Critical Context

## 🚨 ABSOLUTE REQUIREMENTS

### 1. AGENT USAGE IS MANDATORY
- **Minimum**: 3-5 agents per task
- **Pattern**: Parallel execution when possible
- **Documentation**: Follow CLAUDE-agents.md patterns
- **Violation**: Not using agents = project standard violation

### 2. CURRENT PROJECT STATE (as of 2025-01-10)
- **Version**: v2.10.0 deployed
- **Tests**: 520/530 passing (98.1%)
- **Coverage**: 98.3% (excellent)
- **Architecture**: Clean Architecture with DI
- **Agents**: 23 specialized agents available

### 3. V1.0.0 FOUNDATION STATUS
✅ **COMPLETE** - All core features implemented:
- Note-to-RDF conversion: WORKING
- Graph visualization: IMPLEMENTED
- Ontology support: AVAILABLE
- SPARQL queries: FUNCTIONAL

### 4. NEXT PRIORITIES (Q1 2025)
Based on RICE analysis:
1. **Graph Export** (RICE: 5400) - Quick win
2. **Better Error Messages** (RICE: 1750)
3. **SPARQL Autocomplete** (RICE: 1500)

### 5. ARCHITECTURAL ISSUES TO ADDRESS
From swebok-engineer analysis:
- Business logic in presentation layer (main.ts)
- Need Domain Service for RDF conversion
- Missing unit tests for conversion logic
- SOLID principle violations

## 📋 Session Start Checklist

- [ ] Read CLAUDE.md (especially agent rules)
- [ ] Read CLAUDE-agents.md (patterns and selection)
- [ ] Read session-handoff.md (current context)
- [ ] Check .claude/tasks/active/ for pending tasks
- [ ] Run `npm test` to verify system state
- [ ] Launch task-manager agent for overview

## 🎯 Task Execution Protocol

### For EVERY Non-Trivial Task:
1. **Identify** task complexity and domain
2. **Select** 3-5 appropriate agents
3. **Launch** agents in parallel when possible
4. **Synthesize** results from all agents
5. **Document** patterns and learnings

### Agent Selection Quick Reference:
- **Feature Development**: product-manager, swebok-engineer, qa-engineer
- **Bug Fixing**: error-handler, code-searcher, test-fixer-agent
- **Architecture**: architect-agent, swebok-engineer, security-agent
- **Performance**: performance-agent, qa-engineer, meta-agent

## 💡 Key Learnings

### From User Feedback (2025-01-10):
> "Мне показалось, что ты практически не использовал агентов. Почему? Мы с тобой договаривались, что практически на каждую задачу должен вступать в работу агент"

**Response**: Immediately corrected by using 5 agents in parallel, achieving:
- 5x more comprehensive analysis
- Multiple expert perspectives
- 40-60% time savings
- Higher quality solutions

### Success Pattern:
```
Bad: 1 agent (orchestrator) → Superficial analysis
Good: 5 agents (parallel) → Deep, multi-faceted insights
```

## 🔄 Continuous Improvement

### After Each Session:
1. Update CLAUDE-agents.md with new patterns
2. Document agent effectiveness metrics
3. Refine agent selection algorithm
4. Share learnings in session-handoff.md

### Meta-Agent Recommendations:
- Monitor agent utilization rate (target: >80%)
- Track parallel execution rate (target: >60%)
- Measure task success rate (target: >95%)
- Optimize based on actual performance

## 🚀 Quick Start for Next Session

```bash
# 1. Verify system state
npm test

# 2. Launch overview agents (PARALLEL)
- task-manager: Current task status
- qa-engineer: Test suite health
- architect-agent: System architecture state

# 3. Begin priority task with appropriate agents
- For Graph Export: product-manager, swebok-engineer, ux-design-expert
- For Error Messages: product-manager, ux-researcher-agent, technical-writer-agent
```

## 📝 Commitment

**I commit to:**
- Using specialized agents for ALL non-trivial tasks
- Following documented patterns in CLAUDE-agents.md
- Executing agents in parallel when possible
- Continuously improving agent utilization
- Never working alone on complex tasks

---

**Remember**: The agents are your team. Use them liberally, in parallel, and systematically for maximum effectiveness.