---
description: Execute task with full compliance, agents, and meta-optimization
allowed-tools: Task, TodoWrite, Read, Write, Edit, MultiEdit, Grep, Glob, LS, Bash, WebSearch, WebFetch
argument-hint: [task description]
---

# EXECUTE-WITH-META-OPTIMIZATION

## Task: $ARGUMENTS

## Execution Mode: FULL-COMPLIANCE-WITH-META-LEARNING

### Instructions:
1. **Analyze the task** to determine complexity and required domains
2. **Select 3-5 specialized agents** based on task requirements
3. **Execute agents in parallel** when possible for optimal performance
4. **Apply meta-optimization** to learn from execution patterns
5. **Validate quality gates** (tests, coverage, CI/CD)
6. **Create release** if code changes were made
7. **Generate comprehensive report** of work completed

### Agent Selection Guidelines:
- **Bug fixes**: error-handler, technical-stabilization-agent, qa-engineer
- **Features**: product-manager, architect-agent, swebok-engineer, qa-engineer
- **Performance**: performance-agent, swebok-engineer, qa-engineer
- **Documentation**: technical-writer-agent, ux-researcher-agent
- **Release**: release-agent, devops-engineer, qa-engineer

### Quality Requirements:
- All tests must pass
- Coverage threshold: 70%
- CI/CD pipeline must be green
- Documentation must be updated
- Release notes must be user-focused

### Output Format:
1. Task decomposition and agent selection
2. Parallel execution results
3. Quality validation report
4. Release creation (if applicable)
5. Summary of changes and improvements

Execute the task with maximum efficiency and quality.