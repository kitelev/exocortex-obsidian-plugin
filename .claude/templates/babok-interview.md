# BABOK Requirements Interview Template

## Interview Protocol for Plugin Enhancement Tasks

### Phase 1: Context Understanding

**Opening Questions:**
1. What problem are you trying to solve?
2. What is the current state vs desired state?
3. Who will benefit from this enhancement?
4. What triggered this requirement?

### Phase 2: Functional Requirements

**Core Functionality:**
1. What specific actions should the system perform?
2. What are the inputs and expected outputs?
3. Are there different user roles or permissions?
4. What are the main use cases?

**User Interactions:**
1. How will users interact with this feature?
2. What UI elements are needed?
3. Are there any workflow considerations?
4. What feedback should users receive?

### Phase 3: Non-Functional Requirements

**Performance:**
1. What are the performance expectations?
2. How many concurrent operations?
3. What's the acceptable response time?
4. Are there memory/storage constraints?

**Quality Attributes:**
1. What reliability level is required?
2. Are there security considerations?
3. What about accessibility needs?
4. Any compliance requirements?

### Phase 4: Acceptance Criteria

**Success Metrics:**
1. How will you know when this is complete?
2. What constitutes success?
3. What would be considered a failure?
4. Are there specific test scenarios?

**Validation:**
1. Who will validate the solution?
2. What testing is required?
3. Are there edge cases to consider?
4. What documentation is needed?

### Phase 5: Constraints & Dependencies

**Technical Constraints:**
1. Are there technology limitations?
2. Must integrate with existing systems?
3. Specific frameworks/libraries required?
4. Platform-specific considerations?

**Project Constraints:**
1. What's the timeline/deadline?
2. Are there budget considerations?
3. Resource availability?
4. Dependencies on other features?

### Phase 6: Prioritization

**MoSCoW Analysis:**
- **Must Have:** Core requirements that are non-negotiable
- **Should Have:** Important but not critical
- **Could Have:** Nice to have if time permits
- **Won't Have:** Out of scope for this iteration

### Interview Output Format

```yaml
Requirements_Summary:
  business_context:
    problem_statement: ""
    stakeholders: []
    business_value: ""
  
  functional_requirements:
    - id: FR-001
      description: ""
      priority: MUST
      acceptance_criteria: []
    
  non_functional_requirements:
    - id: NFR-001
      category: performance
      description: ""
      metric: ""
      threshold: ""
  
  use_cases:
    - id: UC-001
      actor: ""
      description: ""
      preconditions: []
      steps: []
      postconditions: []
      exceptions: []
  
  constraints:
    technical: []
    business: []
    regulatory: []
  
  assumptions:
    - ""
  
  risks:
    - description: ""
      probability: LOW/MEDIUM/HIGH
      impact: LOW/MEDIUM/HIGH
      mitigation: ""
  
  acceptance_criteria:
    - ""
  
  out_of_scope:
    - ""
```

### Interactive Session Example

```typescript
// BABOK Agent conducts interview
async function conductRequirementsInterview(initialTask: string) {
  const interview = new RequirementsInterview();
  
  // Phase 1: Context
  const context = await interview.askContext([
    "What problem does this solve?",
    "Who are the users?",
    "What's the business value?"
  ]);
  
  // Phase 2: Functional Requirements
  const functional = await interview.askFunctional([
    "What should it do?",
    "How should it work?",
    "What are the key features?"
  ]);
  
  // Phase 3: Non-Functional Requirements
  const nonFunctional = await interview.askNonFunctional([
    "Performance requirements?",
    "Security needs?",
    "Quality expectations?"
  ]);
  
  // Phase 4: Acceptance Criteria
  const acceptance = await interview.askAcceptance([
    "How to measure success?",
    "Test scenarios?",
    "Definition of done?"
  ]);
  
  // Phase 5: Constraints
  const constraints = await interview.askConstraints([
    "Technical limitations?",
    "Timeline?",
    "Dependencies?"
  ]);
  
  // Generate Requirements Document
  return interview.generateRequirements({
    context,
    functional,
    nonFunctional,
    acceptance,
    constraints
  });
}
```

### Confirmation Protocol

Before proceeding to implementation:

1. **Present Requirements Summary**
   - Clear, structured format
   - Highlight key points
   - Show priorities

2. **Get Explicit Confirmation**
   - "Do these requirements accurately reflect your needs?"
   - "Are the priorities correct?"
   - "Is anything missing or incorrect?"

3. **Document Changes**
   - Track any clarifications
   - Update requirements
   - Re-confirm if significant changes

4. **Create Traceability Matrix**
   - Link requirements to design
   - Map to test cases
   - Track through implementation

### Best Practices

1. **Active Listening**
   - Paraphrase to confirm understanding
   - Ask clarifying questions
   - Avoid assumptions

2. **Progressive Elaboration**
   - Start high-level
   - Drill down into details
   - Validate at each level

3. **Visual Aids**
   - Use diagrams when helpful
   - Show examples
   - Create mockups if needed

4. **Documentation**
   - Record all decisions
   - Note assumptions
   - Track changes

5. **Stakeholder Engagement**
   - Keep user involved
   - Regular check-ins
   - Clear communication

This template ensures comprehensive requirements gathering following BABOK v3 best practices.