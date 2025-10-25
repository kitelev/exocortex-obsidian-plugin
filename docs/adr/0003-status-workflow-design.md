# ADR-0003: Effort Status Workflow Design

## Status

✅ **Accepted** (Implemented)

## Context

Tasks and projects need a lifecycle workflow to track progress from creation to completion. The workflow must:
- Support both simple and complex planning methodologies
- Allow flexibility (skip steps when appropriate)
- Be intuitive for users
- Provide clear state transitions
- Enable automation and reporting

### Problem

Common workflow models:

1. **Linear**: Draft → Backlog → ToDo → Doing → Done
   - Too rigid, can't skip steps
   - Forces users through unnecessary states

2. **Kanban-style**: ToDo → In Progress → Done
   - Too simple, lacks planning states
   - No distinction between "ready" and "needs analysis"

3. **Free-form**: Any status to any status
   - Too chaotic, hard to enforce rules
   - Difficult to validate transitions

## Decision

**Hybrid workflow** with mandatory and optional states:

```
Draft → Backlog → Analysis → ToDo → Doing → Done
          ↓                    ↑       ↓
        (Can skip) ────────────┘       ↓
                                    Trashed
```

### State Definitions

| Status | Purpose | Can Skip? | Timestamps |
|--------|---------|-----------|------------|
| **Draft** | Initial creation, not ready | No (start here) | None |
| **Backlog** | Queued for future, no active plan | No (from Draft) | None |
| **Analysis** | Being analyzed/planned | ✅ Yes (Tasks) | None |
| **ToDo** | Ready to start, analyzed | ✅ Yes (Tasks) | None |
| **Doing** | Currently active work | No | ✅ startTimestamp |
| **Done** | Completed | No | ✅ resolutionTimestamp |
| **Trashed** | Cancelled/deleted | Terminal | None |

### Transition Rules

**Tasks** (more flexible):
```
Draft → Backlog → Doing → Done
          ↓
        Trashed (from anywhere)
```

**Projects** (more structured):
```
Draft → Backlog → Analysis → ToDo → Doing → Done
                                       ↓
                                    Trashed
```

**Key Difference**: Tasks can jump from Backlog directly to Doing (quick tasks), but Projects must go through ToDo state (planning required).

### Implementation

```typescript
// TaskStatusService.getPreviousStatusFromWorkflow()
private getPreviousStatusFromWorkflow(
  currentStatus: string,
  instanceClass: string | string[] | null,
): string | null | undefined {
  const normalized = WikiLinkHelpers.normalize(currentStatus);

  if (normalized === EffortStatus.DRAFT) return null;
  if (normalized === EffortStatus.BACKLOG) return EffortStatus.DRAFT;
  if (normalized === EffortStatus.ANALYSIS) return EffortStatus.BACKLOG;
  if (normalized === EffortStatus.TODO) return EffortStatus.ANALYSIS;
  if (normalized === EffortStatus.DOING) {
    // PROJECTS: must come from ToDo
    // TASKS: can come from Backlog or ToDo
    const isProject = this.hasInstanceClass(instanceClass, AssetClass.PROJECT);
    return isProject ? EffortStatus.TODO : EffortStatus.BACKLOG;
  }
  if (normalized === EffortStatus.DONE) return EffortStatus.DOING;

  return undefined; // Invalid status
}
```

## Consequences

### Positive ✅

- **Flexible for tasks**: Quick tasks can skip Analysis/ToDo
- **Structured for projects**: Projects require planning (ToDo)
- **Clear semantics**: Each state has clear meaning
- **Automation-friendly**: State machine enables validation
- **Reporting**: Can track "stuck in Analysis" or "quick wins"
- **Time tracking**: Doing state triggers timestamps automatically

### Negative ❌

- **Complexity**: Two different workflows (Task vs Project)
- **Learning curve**: Users must understand when to skip
- **Validation logic**: Code must check instanceClass for transitions

### Mitigations

1. **UI guidance**: Buttons only show valid next states
2. **Documentation**: Clear workflow diagrams in docs
3. **Validation**: `getPreviousStatusFromWorkflow()` enforces rules
4. **Flexibility**: Users can adapt workflow to their needs

## Alternatives Considered

### Alternative 1: Single workflow for all

```
Draft → ToDo → Doing → Done
```

**Rejected because**:
- No distinction between "queued" (Backlog) and "ready" (ToDo)
- No analysis/planning state
- Too simple for complex projects

### Alternative 2: Separate Task and Project enums

```typescript
enum TaskStatus { ... }
enum ProjectStatus { ... }
```

**Rejected because**:
- Code duplication
- Harder to treat uniformly
- More complex to implement

### Alternative 3: Configurable workflows

```yaml
ems__Effort_workflow: "simple|complex|custom"
```

**Rejected because**:
- Too complex to implement
- Too much flexibility confuses users
- Harder to validate

## Related

- **Commands**: Each status has dedicated command ("Move to ToDo", etc.)
- **Timestamps**: Doing state triggers automatic time tracking
- **Visibility**: Buttons shown based on current status
- **Property**: `ems__Effort_status` stores current state

## Future Enhancements

- [ ] Configurable workflow per Area (different areas, different workflows)
- [ ] Custom status states (user-defined)
- [ ] Workflow templates

---

**Date**: 2025-10-26
**Author**: @kitelev
**Related Issues**: #124 (Architecture Documentation)