# SPARQL Query Examples for Exocortex

A collection of practical, ready-to-use SPARQL queries for your Obsidian vault. Copy, paste, and adapt these examples to your needs!

## Table of Contents

1. [Basic Queries](#basic-queries)
2. [Task Management](#task-management)
3. [Project Organization](#project-organization)
4. [Relationships](#relationships)
5. [Time-Based Queries](#time-based-queries)
6. [Aggregation Examples](#aggregation-examples)
7. [Graph Construction](#graph-construction)
8. [Advanced Patterns](#advanced-patterns)

---

## Basic Queries

### 1. List All Assets

Get all notes in your vault:

```sparql
SELECT ?asset ?label
WHERE {
  ?asset <http://exocortex.ai/ontology#Asset_label> ?label .
}
LIMIT 100
```

**Use Case**: Quick overview of vault contents.

---

### 2. List All Entity Types

Find all unique entity classes in your vault:

```sparql
SELECT DISTINCT ?class
WHERE {
  ?asset <http://exocortex.ai/ontology#Instance_class> ?class .
}
```

**Result Example**:
- `ems__Task`
- `ems__Project`
- `ems__Area`

---

### 3. Count Assets by Type

Count how many assets of each type you have:

```sparql
SELECT ?class (COUNT(?asset) AS ?count)
WHERE {
  ?asset <http://exocortex.ai/ontology#Instance_class> ?class .
}
GROUP BY ?class
ORDER BY DESC(?count)
```

**Use Case**: Vault statistics dashboard.

---

## Task Management

### 4. All Active Tasks

List all non-archived tasks:

```sparql
SELECT ?task ?label ?status
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  OPTIONAL { ?task <http://exocortex.ai/ontology#Task_status> ?status . }
  FILTER NOT EXISTS {
    ?task <http://exocortex.ai/ontology#Asset_archived> ?archived .
    FILTER(?archived = true || ?archived = "true" || ?archived = "archived")
  }
}
ORDER BY ?label
```

**Use Case**: Daily task review.

---

### 5. Tasks by Status

Get tasks grouped by their status:

```sparql
SELECT ?status (COUNT(?task) AS ?count)
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
}
GROUP BY ?status
ORDER BY DESC(?count)
```

**Use Case**: Sprint progress tracking.

---

### 6. In-Progress Tasks

Show all tasks currently being worked on:

```sparql
SELECT ?task ?label ?project
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  ?task <http://exocortex.ai/ontology#Task_status> "in-progress" .
  OPTIONAL {
    ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  }
}
ORDER BY ?project ?label
```

**Use Case**: Focus list for active work.

---

### 7. High-Effort Tasks

Find tasks with significant effort votes:

```sparql
SELECT ?task ?label ?votes
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
  FILTER(?votes > 5)
}
ORDER BY DESC(?votes)
```

**Use Case**: Identify tasks requiring more time/resources.

---

### 8. Tasks Without Project

Find orphaned tasks not assigned to any project:

```sparql
SELECT ?task ?label ?status
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  OPTIONAL { ?task <http://exocortex.ai/ontology#Task_status> ?status . }
  FILTER NOT EXISTS {
    ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  }
}
ORDER BY ?label
```

**Use Case**: Cleanup and organization.

---

### 9. Tasks by Priority

List tasks sorted by priority:

```sparql
SELECT ?task ?label ?priority
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  OPTIONAL { ?task <http://exocortex.ai/ontology#Task_priority> ?priority . }
}
ORDER BY ?priority ?label
```

**Use Case**: Priority-based task planning.

---

### 10. Recently Created Tasks

Find tasks created recently (assuming you have a creation date property):

```sparql
SELECT ?task ?label ?created
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  ?task <http://exocortex.ai/ontology#created_at> ?created .
  FILTER(?created > "2025-01-01")
}
ORDER BY DESC(?created)
LIMIT 20
```

**Use Case**: Review recent additions.

---

## Project Organization

### 11. All Projects with Task Count

List projects and count their tasks:

```sparql
SELECT ?project ?projectLabel (COUNT(?task) AS ?taskCount)
WHERE {
  ?project <http://exocortex.ai/ontology#Instance_class> "ems__Project" .
  ?project <http://exocortex.ai/ontology#Asset_label> ?projectLabel .
  OPTIONAL {
    ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  }
}
GROUP BY ?project ?projectLabel
ORDER BY DESC(?taskCount)
```

**Use Case**: Project workload overview.

---

### 12. Projects by Area

Group projects by their parent area:

```sparql
SELECT ?area ?areaLabel ?project ?projectLabel
WHERE {
  ?area <http://exocortex.ai/ontology#Instance_class> "ems__Area" .
  ?area <http://exocortex.ai/ontology#Asset_label> ?areaLabel .
  ?project <http://exocortex.ai/ontology#belongs_to_area> ?area .
  ?project <http://exocortex.ai/ontology#Asset_label> ?projectLabel .
}
ORDER BY ?areaLabel ?projectLabel
```

**Use Case**: Hierarchical organization view.

---

### 13. Active Projects

Find projects with at least one in-progress task:

```sparql
SELECT DISTINCT ?project ?projectLabel
WHERE {
  ?project <http://exocortex.ai/ontology#Instance_class> "ems__Project" .
  ?project <http://exocortex.ai/ontology#Asset_label> ?projectLabel .
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  ?task <http://exocortex.ai/ontology#Task_status> "in-progress" .
}
ORDER BY ?projectLabel
```

**Use Case**: Focus on active projects.

---

### 14. Projects with No Tasks

Find empty projects that might need cleanup:

```sparql
SELECT ?project ?projectLabel
WHERE {
  ?project <http://exocortex.ai/ontology#Instance_class> "ems__Project" .
  ?project <http://exocortex.ai/ontology#Asset_label> ?projectLabel .
  FILTER NOT EXISTS {
    ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  }
}
ORDER BY ?projectLabel
```

**Use Case**: Cleanup stale projects.

---

### 15. Project Completion Rate

Calculate task completion percentage per project:

```sparql
SELECT ?project ?projectLabel
       (COUNT(?task) AS ?totalTasks)
       (SUM(IF(?status = "done", 1, 0)) AS ?doneTasks)
       (SUM(IF(?status = "done", 1, 0)) * 100 / COUNT(?task) AS ?completionRate)
WHERE {
  ?project <http://exocortex.ai/ontology#Instance_class> "ems__Project" .
  ?project <http://exocortex.ai/ontology#Asset_label> ?projectLabel .
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
}
GROUP BY ?project ?projectLabel
HAVING (COUNT(?task) > 0)
ORDER BY DESC(?completionRate)
```

**Use Case**: Progress tracking dashboard.

---

## Relationships

### 16. Task → Project → Area Hierarchy

Show full hierarchy for each task:

```sparql
SELECT ?task ?taskLabel ?project ?projectLabel ?area ?areaLabel
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?taskLabel .
  OPTIONAL {
    ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
    ?project <http://exocortex.ai/ontology#Asset_label> ?projectLabel .
    OPTIONAL {
      ?project <http://exocortex.ai/ontology#belongs_to_area> ?area .
      ?area <http://exocortex.ai/ontology#Asset_label> ?areaLabel .
    }
  }
}
ORDER BY ?areaLabel ?projectLabel ?taskLabel
```

**Use Case**: Full context view for tasks.

---

### 17. Related Assets

Find assets linked to a specific note (replace path):

```sparql
SELECT ?related ?relatedLabel ?relationType
WHERE {
  <vault://path/to/your/note.md> ?relationType ?related .
  ?related <http://exocortex.ai/ontology#Asset_label> ?relatedLabel .
}
```

**Use Case**: Explore connections from a specific note.

---

### 18. Bidirectional Links

Find notes that link to each other:

```sparql
SELECT ?note1 ?note1Label ?note2 ?note2Label
WHERE {
  ?note1 <http://exocortex.ai/ontology#Asset_label> ?note1Label .
  ?note2 <http://exocortex.ai/ontology#Asset_label> ?note2Label .
  ?note1 <http://exocortex.ai/ontology#links_to> ?note2 .
  ?note2 <http://exocortex.ai/ontology#links_to> ?note1 .
  FILTER(?note1 != ?note2)
}
```

**Use Case**: Find tightly coupled concepts.

---

## Time-Based Queries

### 19. Tasks by Start Time

Find tasks scheduled for today (assuming time properties):

```sparql
SELECT ?task ?taskLabel ?startTime
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?taskLabel .
  ?task <http://exocortex.ai/ontology#Effort_startTime> ?startTime .
  FILTER(regex(?startTime, "2025-01-09"))
}
ORDER BY ?startTime
```

**Use Case**: Daily schedule planning.

---

### 20. Tasks by Duration

Find long-running tasks (high effort time):

```sparql
SELECT ?task ?taskLabel ?duration
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?taskLabel .
  ?task <http://exocortex.ai/ontology#Effort_duration_minutes> ?duration .
  FILTER(?duration > 120)
}
ORDER BY DESC(?duration)
```

**Use Case**: Identify time-intensive tasks.

---

## Aggregation Examples

### 21. Total Effort by Project

Sum effort votes per project:

```sparql
SELECT ?project ?projectLabel (SUM(?votes) AS ?totalVotes)
WHERE {
  ?project <http://exocortex.ai/ontology#Instance_class> "ems__Project" .
  ?project <http://exocortex.ai/ontology#Asset_label> ?projectLabel .
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
}
GROUP BY ?project ?projectLabel
ORDER BY DESC(?totalVotes)
```

**Use Case**: Resource allocation planning.

---

### 22. Average Task Votes by Status

Calculate average effort per status:

```sparql
SELECT ?status (AVG(?votes) AS ?avgVotes) (COUNT(?task) AS ?taskCount)
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
}
GROUP BY ?status
ORDER BY DESC(?avgVotes)
```

**Use Case**: Effort estimation insights.

---

### 23. Tasks per Area

Count tasks across all areas (including nested projects):

```sparql
SELECT ?area ?areaLabel (COUNT(?task) AS ?taskCount)
WHERE {
  ?area <http://exocortex.ai/ontology#Instance_class> "ems__Area" .
  ?area <http://exocortex.ai/ontology#Asset_label> ?areaLabel .
  ?project <http://exocortex.ai/ontology#belongs_to_area> ?area .
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
}
GROUP BY ?area ?areaLabel
ORDER BY DESC(?taskCount)
```

**Use Case**: Workload distribution across areas.

---

## Graph Construction

### 24. Extract Task-Project Relationships

Build a graph of task→project relationships:

```sparql
CONSTRUCT {
  ?task <http://example.org/in_project> ?project .
  ?task <http://example.org/has_label> ?taskLabel .
  ?project <http://example.org/has_label> ?projectLabel .
}
WHERE {
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  ?task <http://exocortex.ai/ontology#Asset_label> ?taskLabel .
  ?project <http://exocortex.ai/ontology#Asset_label> ?projectLabel .
}
```

**Use Case**: Export relationships for visualization tools.

---

### 25. Inferred Area Membership

Create direct task→area relationships (bypassing projects):

```sparql
CONSTRUCT {
  ?task <http://example.org/belongs_to_area> ?area .
}
WHERE {
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  ?project <http://exocortex.ai/ontology#belongs_to_area> ?area .
}
```

**Use Case**: Simplify hierarchical queries.

---

### 26. Priority Classification

Add inferred priority classes based on votes:

```sparql
CONSTRUCT {
  ?task <http://example.org/priority_class> ?priorityClass .
}
WHERE {
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
  BIND(
    IF(?votes > 10, "critical",
      IF(?votes > 5, "high",
        IF(?votes > 2, "medium", "low")
      )
    ) AS ?priorityClass
  )
}
```

**Use Case**: Automatic prioritization.

---

## Advanced Patterns

### 27. Tasks with Multiple Projects (Data Quality Check)

Find tasks incorrectly assigned to multiple projects:

```sparql
SELECT ?task ?taskLabel (COUNT(?project) AS ?projectCount)
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?taskLabel .
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
}
GROUP BY ?task ?taskLabel
HAVING (COUNT(?project) > 1)
```

**Use Case**: Data validation and cleanup.

---

### 28. Transitive Relationships

Find all descendants of an area (projects + tasks):

```sparql
SELECT ?descendant ?descendantLabel ?type
WHERE {
  {
    <vault://Areas/My-Area.md> ^<http://exocortex.ai/ontology#belongs_to_area> ?descendant .
    ?descendant <http://exocortex.ai/ontology#Asset_label> ?descendantLabel .
    BIND("project" AS ?type)
  } UNION {
    <vault://Areas/My-Area.md> ^<http://exocortex.ai/ontology#belongs_to_area> / ^<http://exocortex.ai/ontology#belongs_to_project> ?descendant .
    ?descendant <http://exocortex.ai/ontology#Asset_label> ?descendantLabel .
    BIND("task" AS ?type)
  }
}
```

**Use Case**: Complete area breakdown.

---

### 29. Full-Text Search (Label Matching)

Search for assets by label content:

```sparql
SELECT ?asset ?label
WHERE {
  ?asset <http://exocortex.ai/ontology#Asset_label> ?label .
  FILTER(regex(?label, "machine learning", "i"))
}
LIMIT 50
```

**Use Case**: Quick search across vault.

---

### 30. Combined Filters

Complex multi-condition query:

```sparql
SELECT ?task ?taskLabel ?status ?votes ?project
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?taskLabel .
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .

  FILTER(?status = "in-progress" || ?status = "backlog")
  FILTER(?votes > 3)
  FILTER(regex(?taskLabel, "urgent|important", "i"))
  FILTER NOT EXISTS {
    ?task <http://exocortex.ai/ontology#Asset_archived> ?archived .
  }
}
ORDER BY DESC(?votes) ?taskLabel
LIMIT 20
```

**Use Case**: Highly specific task filtering.

---

## Tips for Using These Examples

### Adapting URIs

Replace URIs with your actual property names:

```sparql
<http://exocortex.ai/ontology#Asset_label> → Your property URI
"ems__Task" → Your class name
```

### Using LIMIT

Add `LIMIT` to large queries:

```sparql
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o .
}
LIMIT 100
```

### Performance

- Start with specific patterns (e.g., filter by class first)
- Use `OPTIONAL` sparingly
- Avoid `FILTER NOT EXISTS` on large datasets

### Testing

Test queries in stages:

1. Get basic pattern working
2. Add filters one by one
3. Add aggregations last

---

## Next Steps

- **Learn SPARQL**: Read the [User-Guide.md](./User-Guide.md)
- **Optimize Queries**: Check [Performance-Tips.md](./Performance-Tips.md)
- **Extend Functionality**: See [Developer-Guide.md](./Developer-Guide.md)

## Resources

- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [Exocortex Property Schema](../PROPERTY_SCHEMA.md)
- [GitHub Repository](https://github.com/kitelev/exocortex-obsidian-plugin)

---

**Share Your Queries!** Submit your useful queries via [GitHub Discussions](https://github.com/kitelev/exocortex-obsidian-plugin/discussions) to help the community!
