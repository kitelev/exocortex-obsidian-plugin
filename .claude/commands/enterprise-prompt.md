# Enterprise Prompt Generator Command

**Command:** `/enterprise-prompt`

**Description:** Transforms any development request into a comprehensive enterprise-grade prompt with full BOK standards compliance, ready for immediate execution with the `/enterprise` command.

## Usage

```bash
/enterprise-prompt [your request]
```

## Examples

```bash
/enterprise-prompt Add dark mode toggle to settings
/enterprise-prompt Fix performance issues in graph rendering
/enterprise-prompt Implement user authentication system
/enterprise-prompt Add mobile touch gestures support
/enterprise-prompt Create new query language parser
```

## How It Works

This command uses the **enterprise-prompt-writer** agent to analyze your request and generate a fully structured enterprise prompt that includes:

### 🎯 Core Analysis
- **Problem Decomposition**: Breaking down complex requests into manageable components
- **Technical Context**: Identifying affected files, architecture layers, and integration points
- **Agent Orchestration**: Determining optimal agent selection and parallel execution patterns
- **Risk Assessment**: Identifying technical and business risks with mitigation strategies

### 📋 BOK Standards Integration
- **BABOK v3**: Business analysis and requirements management
- **PMBOK 7th**: Project management and delivery planning
- **SWEBOK v4**: Software engineering best practices and quality standards
- **ITIL v4**: Service management and operational excellence
- **TOGAF 9**: Enterprise architecture governance

### 🧪 Mandatory BDD Requirements
- **Phase 0 BDD**: Executable specifications created BEFORE any coding
- **Gherkin Scenarios**: Complete coverage of happy path, edge cases, and error conditions
- **Jest Integration**: Step definitions that work with existing test infrastructure
- **Quality Gates**: Multi-layered validation with >90% scenario coverage requirements

### 🏗️ Enterprise Structure
- **Problem Statement**: Clear, measurable objectives with success criteria
- **Technical Context**: Architecture analysis with performance and security requirements
- **Implementation Constraints**: Backward compatibility and deployment considerations
- **Expected Outcomes**: Specific deliverables with quality metrics
- **Test Scenarios**: Comprehensive validation and regression protection

## Output Format

The command generates a complete enterprise prompt with these sections:

```markdown
# Enterprise Execution Prompt

## Problem Statement
[Clear, measurable goal with business context]

## Technical Context
[Affected components, architecture, and technology stack]

## MANDATORY BDD Requirements (Phase 0)
[Comprehensive BDD specifications with quality gates]

## BOK Standards Alignment
[BABOK/PMBOK/SWEBOK compliance requirements]

## Implementation Constraints
[Compatibility, performance, and security requirements]

## Expected Outcomes
[Functional, quality, and process deliverables]

## Test Scenarios
[BDD integration tests and regression coverage]

## Agent Orchestration Requirements
[Recommended agents and execution patterns]

## Risk Mitigation
[Technical and business risk management]

## Compliance & Governance
[Standards compliance and governance requirements]

---

**Enterprise Execution Command:**
/enterprise [Generated comprehensive prompt]
```

## Agent Integration

The command automatically:

1. **Analyzes Request Complexity**: Determines required analysis depth and agent selection
2. **Maps Technical Domains**: Identifies affected systems and integration points
3. **Generates BDD Scenarios**: Creates executable specifications for all requirements
4. **Selects Optimal Agents**: Recommends 3-11+ agents based on complexity analysis
5. **Structures Quality Gates**: Defines validation checkpoints and success criteria

## Quality Assurance

Every generated prompt includes:

- ✅ **Completeness Validation**: All essential sections populated with specific requirements
- ✅ **BDD Integration**: Mandatory Phase 0 specifications with executable scenarios
- ✅ **BOK Compliance**: Full alignment with industry standards and best practices
- ✅ **Agent Optimization**: Optimal agent selection for parallel execution
- ✅ **Risk Management**: Comprehensive risk assessment and mitigation strategies

## Advanced Features

### 🔄 Pattern Recognition
- **Similar Request Analysis**: Leverages patterns from successful previous implementations
- **Architecture Alignment**: Ensures consistency with existing codebase patterns
- **Integration Point Detection**: Identifies all affected systems and dependencies

### 📊 Complexity Assessment
- **Simple**: Single file, straightforward implementation (3-5 agents)
- **Moderate**: Multiple files, architectural changes (5-7 agents)
- **Complex**: Cross-system integration, performance optimization (7-9 agents)
- **Critical**: Major architectural changes, high-risk implementations (9-11+ agents)

### ⚡ Parallel Optimization
- **Investigation Clusters**: Parallel analysis with independent execution
- **Development Clusters**: Coordinated implementation with testing integration
- **Quality Assurance Clusters**: Comprehensive validation with consolidated reporting

## Best Practices

### For Simple Requests
```bash
/enterprise-prompt Add tooltip to button
# → Generates focused prompt with UI/testing agents
```

### For Complex Features
```bash
/enterprise-prompt Implement real-time collaboration system
# → Generates comprehensive prompt with 11+ agents, security analysis, performance requirements
```

### For Performance Issues
```bash
/enterprise-prompt Fix memory leaks in graph rendering
# → Generates investigation-focused prompt with performance analysis and optimization strategies
```

### For Architectural Changes
```bash
/enterprise-prompt Migrate to microservices architecture
# → Generates enterprise-scale prompt with architectural governance and migration planning
```

## Integration with Existing Workflow

1. **Start with `/enterprise-prompt`** to generate comprehensive requirements
2. **Review generated prompt** for completeness and accuracy
3. **Execute with `/enterprise`** command for full enterprise team deployment
4. **Monitor progress** through structured quality gates and deliverable tracking

## Quality Metrics

Successful enterprise prompts achieve:
- **>98% Task Completion Rate**: Clear requirements lead to successful execution
- **>95% Quality Gate Pass Rate**: Comprehensive validation ensures quality delivery
- **>85% First-Time Success Rate**: Well-structured prompts minimize rework
- **>9.2/10 Stakeholder Satisfaction**: Business-focused outcomes drive value

## Tips for Best Results

### 🎯 Be Specific
```bash
# Good
/enterprise-prompt Add dark mode toggle with system preference detection and smooth transitions

# Better
/enterprise-prompt Add dark mode toggle to settings page with automatic system preference detection, smooth CSS transitions, and persistence across sessions
```

### 📋 Include Context
```bash
# Good
/enterprise-prompt Fix performance issues

# Better
/enterprise-prompt Fix graph rendering performance issues causing UI freezes with large datasets (>1000 nodes)
```

### 🔍 Specify Constraints
```bash
# Good
/enterprise-prompt Add authentication

# Better  
/enterprise-prompt Add OAuth 2.0 authentication with backward compatibility for existing sessions and GDPR compliance
```

---

**Ready to generate your enterprise prompt?** Simply type `/enterprise-prompt` followed by your development request, and receive a comprehensive, BOK-compliant prompt ready for immediate execution with the full enterprise team.