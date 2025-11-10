# SPARQL User Guide for Exocortex

Welcome to the SPARQL User Guide for Exocortex! This guide will teach you how to query your Obsidian vault using SPARQL, the powerful semantic query language for RDF data.

## Table of Contents

1. [Introduction to SPARQL in Exocortex](#introduction-to-sparql-in-exocortex)
2. [Basic Queries](#basic-queries)
3. [Filtering and Conditions](#filtering-and-conditions)
4. [Working with Obsidian Properties](#working-with-obsidian-properties)
5. [Aggregations and Grouping](#aggregations-and-grouping)
6. [Graph Construction](#graph-construction)
7. [Performance Best Practices](#performance-best-practices)
8. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)

---

## Introduction to SPARQL in Exocortex

### What is SPARQL?

SPARQL (SPARQL Protocol and RDF Query Language) is a standardized query language for RDF (Resource Description Framework) data. It allows you to search, retrieve, and manipulate structured knowledge represented as triples (subject-predicate-object).

### Why SPARQL in Obsidian?

Exocortex converts your Obsidian notes into RDF triples, enabling:

- **Semantic Queries**: Ask complex questions about relationships between notes
- **Knowledge Discovery**: Find hidden patterns and connections in your vault
- **Dynamic Views**: Generate live reports that update automatically
- **Data Export**: Export structured data for analysis or visualization

### Triple Structure

Every note in your vault becomes a set of RDF triples:

```
<note-path> <property> "value"
```

For example, a task note becomes:

```turtle
<vault://Projects/My-Task.md> <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
<vault://Projects/My-Task.md> <http://exocortex.ai/ontology#Asset_label> "My Task" .
<vault://Projects/My-Task.md> <http://exocortex.ai/ontology#Task_status> "in-progress" .
```

### How to Write SPARQL Queries in Obsidian

Create a code block with `sparql` language identifier:

````markdown
```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
```
````

The results will appear live in your note and update automatically when your vault changes!

---

## Basic Queries

### SELECT Queries

SELECT queries retrieve specific variables from your data.

#### Basic Pattern: All Tasks

```sparql
SELECT ?task
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
}
```

**Explanation**:
- `SELECT ?task` - Return the `?task` variable
- `WHERE { ... }` - Pattern to match
- Variables start with `?` (e.g., `?task`, `?label`)

#### Multiple Variables: Tasks with Labels

```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
```

**Result**:

| task | label |
|------|-------|
| `vault://Tasks/Write-Report.md` | "Write Report" |
| `vault://Tasks/Review-Code.md` | "Review Code" |

#### Wildcard Pattern: All Triples

```sparql
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o .
}
```

**Warning**: This returns ALL triples in your vault. Use `LIMIT` to avoid overwhelming results.

### LIMIT and OFFSET

Control result size:

```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
LIMIT 10
```

Pagination:

```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
LIMIT 10
OFFSET 20
```

### DISTINCT Results

Remove duplicates:

```sparql
SELECT DISTINCT ?status
WHERE {
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
}
```

**Result**: Unique list of all task statuses in your vault.

---

## Filtering and Conditions

### FILTER Clause

Filter results based on conditions:

#### String Matching

```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  FILTER(regex(?label, "report", "i"))
}
```

**Explanation**:
- `regex(?label, "report", "i")` - Case-insensitive regex match
- Finds all tasks with "report" in their label

#### Numeric Comparisons

```sparql
SELECT ?task ?votes
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
  FILTER(?votes > 5)
}
```

**Operators**:
- `>`, `<`, `>=`, `<=` - Numeric comparisons
- `=`, `!=` - Equality/inequality
- `&&`, `||`, `!` - Logical operators

#### Multiple Conditions

```sparql
SELECT ?task ?label ?status
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
  FILTER(?status = "in-progress" || ?status = "backlog")
  FILTER(regex(?label, "urgent", "i"))
}
```

### OPTIONAL Patterns

Match optional properties:

```sparql
SELECT ?task ?label ?priority
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  OPTIONAL {
    ?task <http://exocortex.ai/ontology#Task_priority> ?priority .
  }
}
```

**Result**: Includes tasks even if they don't have a `priority` property (will show `null` or empty).

### UNION Patterns

Match either pattern:

```sparql
SELECT ?asset ?label
WHERE {
  {
    ?asset <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  } UNION {
    ?asset <http://exocortex.ai/ontology#Instance_class> "ems__Project" .
  }
  ?asset <http://exocortex.ai/ontology#Asset_label> ?label .
}
```

**Result**: All tasks and projects in your vault.

---

## Working with Obsidian Properties

### Property Namespaces

Exocortex uses two main property namespaces:

1. **`exo__`** - Core Exocortex properties (e.g., `exo__Asset_label`, `exo__Instance_class`)
2. **`ems__`** - Entity Model Schema classes (e.g., `ems__Task`, `ems__Project`, `ems__Area`)

**Full URIs**:
```
exo__Asset_label → <http://exocortex.ai/ontology#Asset_label>
ems__Task → "ems__Task"
```

### Common Properties

#### Core Asset Properties

```sparql
SELECT ?asset ?label ?class ?archived
WHERE {
  ?asset <http://exocortex.ai/ontology#Instance_class> ?class .
  ?asset <http://exocortex.ai/ontology#Asset_label> ?label .
  OPTIONAL {
    ?asset <http://exocortex.ai/ontology#Asset_archived> ?archived .
  }
}
```

**Properties**:
- `exo__Asset_label` - Display name
- `exo__Instance_class` - Entity type (Task, Project, Area)
- `exo__Asset_archived` - Archival status

#### Task-Specific Properties

```sparql
SELECT ?task ?label ?status ?priority ?votes
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  OPTIONAL { ?task <http://exocortex.ai/ontology#Task_status> ?status . }
  OPTIONAL { ?task <http://exocortex.ai/ontology#Task_priority> ?priority . }
  OPTIONAL { ?task <http://exocortex.ai/ontology#Effort_votes> ?votes . }
}
```

**Properties**:
- `exo__Task_status` - Task status (backlog, in-progress, done, archived)
- `exo__Task_priority` - Priority level
- `ems__Effort_votes` - Effort voting count

#### Relationship Properties

```sparql
SELECT ?task ?project ?area
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  OPTIONAL {
    ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  }
  OPTIONAL {
    ?project <http://exocortex.ai/ontology#belongs_to_area> ?area .
  }
}
```

**Properties**:
- `belongs_to_project` - Task → Project relationship
- `belongs_to_area` - Project → Area relationship

### Finding Active (Non-Archived) Assets

```sparql
SELECT ?asset ?label
WHERE {
  ?asset <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?asset <http://exocortex.ai/ontology#Asset_label> ?label .
  FILTER NOT EXISTS {
    ?asset <http://exocortex.ai/ontology#Asset_archived> ?archived .
    FILTER(?archived = true || ?archived = "true" || ?archived = "archived")
  }
}
```

**Explanation**: Filters out assets with archived property set to `true` or `"archived"`.

---

## Aggregations and Grouping

### COUNT - Count Results

```sparql
SELECT (COUNT(?task) AS ?taskCount)
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
}
```

**Result**: Total number of tasks.

### GROUP BY - Grouping

```sparql
SELECT ?status (COUNT(?task) AS ?count)
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
}
GROUP BY ?status
```

**Result**:

| status | count |
|--------|-------|
| "backlog" | 15 |
| "in-progress" | 7 |
| "done" | 42 |

### SUM - Total Values

```sparql
SELECT ?project (SUM(?votes) AS ?totalVotes)
WHERE {
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
}
GROUP BY ?project
```

**Result**: Total effort votes per project.

### HAVING - Filter Groups

```sparql
SELECT ?project (COUNT(?task) AS ?taskCount)
WHERE {
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
}
GROUP BY ?project
HAVING (COUNT(?task) > 5)
```

**Result**: Only projects with more than 5 tasks.

### Multiple Aggregations

```sparql
SELECT ?status
       (COUNT(?task) AS ?taskCount)
       (SUM(?votes) AS ?totalVotes)
       (AVG(?votes) AS ?avgVotes)
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
}
GROUP BY ?status
```

**Functions**:
- `COUNT()` - Count items
- `SUM()` - Sum numeric values
- `AVG()` - Average values
- `MIN()`, `MAX()` - Min/max values

---

## Graph Construction

### CONSTRUCT Queries

CONSTRUCT queries create new RDF triples instead of returning table results.

#### Basic CONSTRUCT

```sparql
CONSTRUCT {
  ?task <http://exocortex.ai/ontology#has_label> ?label .
}
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
```

**Result**: Returns triples (subject-predicate-object) instead of table rows.

#### Creating Inferred Relationships

```sparql
CONSTRUCT {
  ?task <http://exocortex.ai/ontology#in_area> ?area .
}
WHERE {
  ?task <http://exocortex.ai/ontology#belongs_to_project> ?project .
  ?project <http://exocortex.ai/ontology#belongs_to_area> ?area .
}
```

**Result**: Directly links tasks to their areas (skipping intermediate project).

#### Transforming Data

```sparql
CONSTRUCT {
  ?task <http://example.org/priority_level> ?priorityClass .
}
WHERE {
  ?task <http://exocortex.ai/ontology#Effort_votes> ?votes .
  BIND(
    IF(?votes > 10, "high",
      IF(?votes > 5, "medium", "low")
    ) AS ?priorityClass
  )
}
```

**Result**: Classifies tasks into priority levels based on votes.

### Export to Turtle Format

CONSTRUCT results can be exported as Turtle (`.ttl`) files using the export button in the query result viewer.

---

## Performance Best Practices

### 1. Use Specific Patterns

❌ **Slow**:
```sparql
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o .
}
LIMIT 100
```

✅ **Fast**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
```

**Why**: Specific patterns leverage indexing (SPO, POS, OSP indexes).

### 2. Use LIMIT

Always use `LIMIT` when exploring:

```sparql
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o .
}
LIMIT 10
```

**Why**: Prevents overwhelming results and browser lag.

### 3. Filter Early

❌ **Slow**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  FILTER(regex(?label, "report", "i"))
}
```

✅ **Fast**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
  FILTER(regex(?label, "report", "i"))
}
```

**Why**: Filtering on class first reduces candidate set before string matching.

### 4. Avoid OPTIONAL When Possible

❌ **Slower**:
```sparql
SELECT ?task ?label ?priority
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  OPTIONAL { ?task <http://exocortex.ai/ontology#Asset_label> ?label . }
  OPTIONAL { ?task <http://exocortex.ai/ontology#Task_priority> ?priority . }
}
```

✅ **Faster**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
```

**Why**: OPTIONAL patterns disable some optimizations. Only use when needed.

### 5. Use DISTINCT Sparingly

`DISTINCT` has overhead. Only use when necessary:

```sparql
SELECT ?status
WHERE {
  ?task <http://exocortex.ai/ontology#Task_status> ?status .
}
```

**When to use DISTINCT**: When you expect duplicates and need unique values.

---

## Common Pitfalls and Solutions

### Pitfall 1: Missing Brackets

❌ **Wrong**:
```sparql
SELECT ?task
WHERE
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
```

✅ **Correct**:
```sparql
SELECT ?task
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
}
```

**Error**: `Expected WHERE clause`

### Pitfall 2: Forgetting Dot Separator

❌ **Wrong**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task"
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
```

✅ **Correct**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
  ?task <http://exocortex.ai/ontology#Asset_label> ?label .
}
```

**Error**: Each triple pattern must end with `.` (except the last one, which is optional).

### Pitfall 3: Incorrect URI Format

❌ **Wrong**:
```sparql
SELECT ?task
WHERE {
  ?task exo__Instance_class "ems__Task" .
}
```

✅ **Correct**:
```sparql
SELECT ?task
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
}
```

**Error**: Properties must be full URIs in angle brackets.

### Pitfall 4: Case Sensitivity

SPARQL is case-sensitive:

❌ **Wrong**:
```sparql
select ?task
where {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
}
```

✅ **Correct**:
```sparql
SELECT ?task
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
}
```

**Best Practice**: Use uppercase keywords (`SELECT`, `WHERE`, `FILTER`).

### Pitfall 5: String vs Variable

❌ **Wrong**:
```sparql
SELECT ?task
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> ems__Task .
}
```

✅ **Correct**:
```sparql
SELECT ?task
WHERE {
  ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
}
```

**Error**: String literals must be quoted. `ems__Task` without quotes is treated as a variable.

### Pitfall 6: No Results?

**Debugging Checklist**:

1. **Check property URIs**:
   ```sparql
   SELECT ?s ?p ?o
   WHERE {
     ?s ?p ?o .
   }
   LIMIT 10
   ```
   Verify actual property names in your vault.

2. **Check class values**:
   ```sparql
   SELECT DISTINCT ?class
   WHERE {
     ?s <http://exocortex.ai/ontology#Instance_class> ?class .
   }
   ```
   Verify actual class names (`ems__Task`, not `Task`).

3. **Check property existence**:
   ```sparql
   SELECT ?task
   WHERE {
     ?task <http://exocortex.ai/ontology#Instance_class> "ems__Task" .
   }
   ```
   Verify tasks exist in your vault with correct frontmatter.

### Pitfall 7: Namespace URI Mismatch

**Problem**: Query executes without errors but returns 0 results.

**Root Cause**: Namespace URIs in query don't match actual URIs used in triple store.

**Diagnostic Query**:
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?predicate
WHERE {
  ?subject ?predicate ?object .
}
LIMIT 20
```

If you see predicates like `http://exocortex.org/ontology/Asset_label` but your query uses:
```sparql
PREFIX exo: <https://exocortex.my/ontology/exo#>
```

That's a mismatch!

**Solution**:
1. Check vault ontology files (`!exo.md`, `!ems.md`) for canonical URIs in `exo__Ontology_url` property
2. Update PREFIX declarations to match:
   ```sparql
   PREFIX exo: <https://exocortex.my/ontology/exo#>
   PREFIX ems: <https://exocortex.my/ontology/ems#>
   ```
3. Use hash-style URIs (`#` at end), not slash-style (`/` at end)

**Reference**: See PR #363 for namespace unification example.

---

## Next Steps

- **Explore Examples**: See [Query-Examples.md](./Query-Examples.md) for 20+ real-world query patterns
- **Performance Tuning**: Read [Performance-Tips.md](./Performance-Tips.md) for optimization techniques
- **Developer Guide**: Learn about the architecture in [Developer-Guide.md](./Developer-Guide.md)

## Resources

- [SPARQL 1.1 Query Language Specification](https://www.w3.org/TR/sparql11-query/)
- [RDF Primer](https://www.w3.org/TR/rdf-primer/)
- [Exocortex Property Schema](../PROPERTY_SCHEMA.md)

---

**Need Help?** Open an issue on [GitHub](https://github.com/kitelev/exocortex-obsidian-plugin/issues) or ask in the community discussions!
