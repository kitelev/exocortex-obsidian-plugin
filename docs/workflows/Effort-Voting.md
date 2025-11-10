# Effort Voting Guide

**Collaborative prioritization through voting on tasks and projects.**

---

## What is Effort Voting?

Voting system allows teams to prioritize work:
- **Vote on tasks/projects** to indicate importance
- **Higher votes = higher priority**
- **Democratic** approach to prioritization

---

## Voting on Efforts

### Using Vote Button

1. Open task or project in Reading Mode
2. Click **"Vote on Effort"** button
3. Vote count increments by 1

Result:
```yaml
ems__Effort_votes: 3
```

### Using Command Palette

1. Cmd/Ctrl + P
2. Type "Vote on Effort"
3. Execute command

---

## Viewing Vote Counts

### In Relations Tables

Asset Relations section shows vote counts:
- **Votes column** displays current count
- **Sort by votes** to see highest priority
- Click column header to sort ascending/descending

### In Daily Notes

Daily Tasks section shows votes:
- Each task displays vote count
- Sort by votes to focus on high-priority
- Visual indicator of team priorities

---

## Voting Strategies

### Team Voting

**Async voting process:**
```markdown
1. Weekly: Review backlog
2. Each team member votes on top priorities
3. Sort by votes
4. Move top-voted to ToDo/Analysis
5. Schedule top items for week
```

### Personal Voting

**Individual prioritization:**
```markdown
1. Vote on tasks you're excited about
2. Vote on high-value work
3. Review votes weekly
4. Focus on top-voted items
```

### Stakeholder Voting

**External input:**
```markdown
1. Share task/project notes with stakeholders
2. Stakeholders vote on priorities
3. Aggregate votes guide roadmap
4. Balance votes with strategic goals
```

---

## Best Practices

### When to Vote

**Good voting scenarios:**
- Backlog grooming
- Sprint planning
- Quarterly roadmap planning
- Feature prioritization

### Vote Interpretation

**Vote ranges (team of 5):**
- **0-2 votes**: Low priority or unclear value
- **3-4 votes**: Moderate priority
- **5+ votes**: High priority, broad agreement

**For larger teams, scale proportionally.**

### Avoiding Vote Inflation

**Don't:**
- Vote on everything (dilutes signal)
- Vote multiple times on same item (not supported)
- Use votes as only metric (combine with business value)

**Do:**
- Vote selectively on high-value items
- Re-evaluate votes periodically
- Consider vote count + business impact + effort

---

## Combining Votes with Other Signals

### Priority Matrix

```
High Value + High Votes = Do First
High Value + Low Votes = Investigate why low engagement
Low Value + High Votes = Reconsider value assessment
Low Value + Low Votes = Deprioritize
```

### RICE Scoring with Votes

Combine votes with RICE framework:
- **Reach**: Who benefits?
- **Impact**: How much improvement?
- **Confidence**: How certain?
- **Effort**: How complex?
- **+ Votes**: Team enthusiasm/priority

---

## Common Patterns

### Pattern 1: Sprint Planning with Votes

```markdown
1. Filter backlog by "ToDo" status
2. Sort by votes (descending)
3. Review top 10 voted items
4. Estimate effort for top items
5. Select items fitting sprint capacity
6. Schedule to daily notes
```

### Pattern 2: Quarterly Roadmap

```markdown
1. Collect project proposals
2. Team votes on each proposal
3. Plot: Votes (Y-axis) vs Effort (X-axis)
4. Select high-vote, low-effort (quick wins)
5. Balance with high-vote, high-effort (strategic)
```

### Pattern 3: Tie-Breaking

```markdown
When tasks have equal priority:
1. Check vote counts
2. Higher votes = higher priority
3. If votes equal, consider:
   - Business impact
   - Dependencies
   - Strategic alignment
```

---

## Vote Management

### Resetting Votes

Manual reset (no command available):
```yaml
ems__Effort_votes: 0
```

**When to reset:**
- After quarterly planning (start fresh)
- Significant priority shift
- Re-evaluation of backlog

### Vote History

Exocortex doesn't track vote history. For audit trail:

**Option 1: Add notes**
```markdown
## Vote History
- 2025-11-10: 3 votes (sprint planning)
- 2025-11-17: 5 votes (stakeholder input)
```

**Option 2: External tracking**
- Spreadsheet with vote counts over time
- Weekly snapshots of top-voted items

---

## Quick Reference

### Voting Commands

| Action | Command |
|--------|---------|
| Vote | "Vote on Effort" button or Command Palette |
| View votes | Check `ems__Effort_votes` property or Relations table |
| Sort by votes | Click "Votes" column header in Relations |

### Property

```yaml
ems__Effort_votes: 5  # Integer count
```

---

**Back to workflows**: [Area Organization](Area-Organization.md) | [Task Workflow](Task-Workflow.md)
