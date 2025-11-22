# SPARQL Performance Tips for Exocortex

Optimize your SPARQL queries for speed and efficiency, especially in large vaults with thousands of notes.

## Table of Contents

1. [Query Optimization Basics](#query-optimization-basics)
2. [Index Utilization](#index-utilization)
3. [Pattern Ordering](#pattern-ordering)
4. [Avoiding Anti-Patterns](#avoiding-anti-patterns)
5. [Monitoring and Debugging](#monitoring-and-debugging)
6. [Best Practices](#best-practices)

---

## Query Optimization Basics

### Understanding Triple Store Indexes

Exocortex uses a **triple-indexed storage system** with three indexes:

1. **SPO Index** (Subject → Predicate → Object)
2. **POS Index** (Predicate → Object → Subject)
3. **OSP Index** (Object → Subject → Predicate)

**Key Insight**: Queries that match an index pattern run in **O(1)** time. Queries without index support run in **O(n)** time.

### Query Execution Time Expectations

**Fast Queries** (<10ms):
- Indexed triple patterns
- Small result sets (<100 results)
- Simple filters

**Medium Queries** (10-100ms):
- Partially indexed patterns
- Medium result sets (100-1000 results)
- Multiple joins

**Slow Queries** (>100ms):
- Unindexed patterns (wildcards)
- Large result sets (>1000 results)
- Complex aggregations

**Goal**: Keep most queries under 50ms for smooth UI experience.

---

## Index Utilization

### Pattern Analysis

**Check which index your query uses**:

| Triple Pattern | Index Used | Speed |
|---------------|------------|-------|
| `(s, p, o)` | SPO | ⚡ O(1) |
| `(s, p, ?)` | SPO | ⚡ O(1) |
| `(?, p, o)` | POS | ⚡ O(1) |
| `(?, ?, o)` | OSP | ⚡ O(1) |
| `(s, ?, o)` | None | 🐌 O(n) |
| `(s, ?, ?)` | None | 🐌 O(n) |
| `(?, p, ?)` | None | 🐌 O(n) |
| `(?, ?, ?)` | None | 🐌 O(n) |

### Optimization Strategy

❌ **Slow (unindexed)**:
```sparql
SELECT ?task ?status
WHERE {
  ?task ?p ?status .  # No index match
  FILTER(?p = <https://exocortex.my/ontology/ems#Task_status>)
}
```

✅ **Fast (indexed)**:
```sparql
SELECT ?task ?status
WHERE {
  ?task <https://exocortex.my/ontology/ems#Task_status> ?status .  # POS index
}
```

**Speedup**: ~100x faster (10ms → 0.1ms)

### Always Specify Predicates

❌ **Slow**:
```sparql
SELECT ?task ?p ?o
WHERE {
  ?task ?p ?o .  # Wildcard predicate
  FILTER(?p = <https://exocortex.my/ontology/ems#Task_status>)
}
```

✅ **Fast**:
```sparql
SELECT ?task ?status
WHERE {
  ?task <https://exocortex.my/ontology/ems#Task_status> ?status .
}
```

**Lesson**: Never use wildcard predicates (`?p`) if you know the property name.

---

## Pattern Ordering

### Selective Patterns First

**Principle**: Execute the most selective pattern first to reduce the candidate set.

❌ **Slow (generic pattern first)**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .  # Matches ~1000 assets
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .  # Filters to ~200 tasks
}
```

✅ **Fast (selective pattern first)**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .  # Matches ~200 tasks
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .  # Gets labels for 200
}
```

**Speedup**: ~5x faster (50ms → 10ms)

### Filter Early

❌ **Slow (filter after all joins)**:
```sparql
SELECT ?task ?label ?project
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
  ?task <https://exocortex.my/ontology/ems#belongs_to_project> ?project .
  FILTER(regex(?label, "urgent", "i"))  # Filter at end
}
```

✅ **Fast (filter early)**:
```sparql
SELECT ?task ?label ?project
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
  FILTER(regex(?label, "urgent", "i"))  # Filter reduces set early
  ?task <https://exocortex.my/ontology/ems#belongs_to_project> ?project .
}
```

**Speedup**: ~2-3x faster (30ms → 10ms)

### Ordering Guidelines

1. **Fixed values first** (e.g., `Instance_class = "ems__Task"`)
2. **Property lookups second** (e.g., `Asset_label`)
3. **Filters third** (reduce candidate set)
4. **Relationships last** (joins on smaller set)

---

## Avoiding Anti-Patterns

### Anti-Pattern 1: Wildcard Queries

❌ **DON'T**:
```sparql
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o .
}
LIMIT 1000
```

**Problem**: Scans entire triple store (O(n)).

✅ **DO**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
}
```

**Speedup**: 1000x faster (1000ms → 1ms)

### Anti-Pattern 2: String Operations on Large Sets

❌ **DON'T**:
```sparql
SELECT ?asset ?label
WHERE {
  ?asset <https://exocortex.my/ontology/exo#Asset_label> ?label .
  FILTER(regex(?label, ".*", "i"))  # Match everything
}
```

**Problem**: Regex on every asset in vault.

✅ **DO**:
```sparql
SELECT ?asset ?label
WHERE {
  ?asset <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .  # Reduce set first
  ?asset <https://exocortex.my/ontology/exo#Asset_label> ?label .
  FILTER(regex(?label, "urgent", "i"))  # Specific pattern
}
```

### Anti-Pattern 3: Unnecessary DISTINCT

❌ **DON'T**:
```sparql
SELECT DISTINCT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
}
```

**Problem**: `DISTINCT` adds overhead when results are already unique.

✅ **DO**:
```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
}
```

**When to use DISTINCT**: Only when you know duplicates exist (e.g., after UNION).

### Anti-Pattern 4: Excessive OPTIONALs

❌ **DON'T**:
```sparql
SELECT ?task ?label ?status ?priority ?votes ?project ?area
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  OPTIONAL { ?task <https://exocortex.my/ontology/exo#Asset_label> ?label . }
  OPTIONAL { ?task <https://exocortex.my/ontology/ems#Task_status> ?status . }
  OPTIONAL { ?task <https://exocortex.my/ontology/ems#Task_priority> ?priority . }
  OPTIONAL { ?task <https://exocortex.my/ontology/ems#Effort_votes> ?votes . }
  OPTIONAL { ?task <https://exocortex.my/ontology/ems#belongs_to_project> ?project . }
  OPTIONAL { ?project <https://exocortex.my/ontology/ems#belongs_to_area> ?area . }
}
```

**Problem**: Many OPTIONAL clauses slow down query execution.

✅ **DO** (required properties only):
```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
}
```

**Lesson**: Only use OPTIONAL for truly optional properties. Split into multiple queries if needed.

### Anti-Pattern 5: Large Aggregations Without GROUP BY

❌ **DON'T**:
```sparql
SELECT (COUNT(?task) AS ?count)
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
  ?task <https://exocortex.my/ontology/ems#Task_status> ?status .
}
```

**Problem**: Unnecessarily fetches labels and statuses just to count tasks.

✅ **DO**:
```sparql
SELECT (COUNT(?task) AS ?count)
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
}
```

**Speedup**: ~3x faster (30ms → 10ms)

---

## Monitoring and Debugging

### Measure Query Performance

**Use browser console timing**:

```javascript
console.time("query");
// Execute query
console.timeEnd("query");
```

**In code (plugin development)**:

```typescript
const startTime = Date.now();
const results = await plugin.sparql.query(queryString);
const elapsed = Date.now() - startTime;
console.log(`Query took ${elapsed}ms, returned ${results.count} results`);
```

### Query Complexity Indicators

**Signs of a slow query**:
- ❌ Uses `(?, p, ?)` or `(s, ?, ?)` patterns
- ❌ No `LIMIT` clause
- ❌ Many OPTIONAL clauses (>3)
- ❌ Regex on large sets
- ❌ Multiple `FILTER NOT EXISTS`

**Signs of a fast query**:
- ✅ Specific class filter first
- ✅ Uses indexed patterns
- ✅ Has `LIMIT` clause
- ✅ Filters early
- ✅ Minimal OPTIONALs

### Debugging Slow Queries

**Step 1**: Simplify query to basic pattern:

```sparql
SELECT ?task
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
}
```

**Step 2**: Add patterns one by one:

```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
}
```

**Step 3**: Add filters incrementally:

```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
  FILTER(regex(?label, "urgent", "i"))
}
```

**Step 4**: Identify which pattern causes slowdown.

---

## Best Practices

### 1. Always Use LIMIT

**During development**:

```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
}
LIMIT 10  # Safe for testing
```

**In production** (when you need all results):

```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
}
# Only omit LIMIT if you're sure result set is small
```

### 2. Cache Expensive Queries

**For static data** (e.g., class hierarchy):

```typescript
let cachedResults: SolutionMapping[] | null = null;

async function getTaskStatuses() {
  if (cachedResults) {
    return cachedResults;
  }

  cachedResults = await plugin.sparql.query(`
    SELECT DISTINCT ?status
    WHERE {
      ?task <https://exocortex.my/ontology/ems#Task_status> ?status .
    }
  `);

  return cachedResults;
}
```

### 3. Paginate Large Results

**Don't fetch 1000+ results at once**:

```sparql
SELECT ?task ?label
WHERE {
  ?task <https://exocortex.my/ontology/exo#Instance_class> "ems__Task" .
  ?task <https://exocortex.my/ontology/exo#Asset_label> ?label .
}
LIMIT 50
OFFSET 0
```

**Next page**:

```sparql
LIMIT 50
OFFSET 50
```

### 4. Use Specific Properties

❌ **DON'T** (wildcard):
```sparql
?task ?anyProperty ?value .
```

✅ **DO** (specific):
```sparql
?task <https://exocortex.my/ontology/ems#Task_status> ?status .
```

### 5. Avoid Complex Filters

❌ **SLOW**:
```sparql
FILTER(
  (?status = "in-progress" || ?status = "backlog") &&
  (?priority > 3) &&
  (regex(?label, "urgent|critical", "i"))
)
```

✅ **FAST** (break into multiple queries if needed):
```sparql
FILTER(?status = "in-progress" || ?status = "backlog")
```

### 6. Profile Before Optimizing

**Don't optimize blindly**:
1. Measure current performance
2. Identify bottlenecks
3. Apply targeted optimization
4. Re-measure to verify improvement

### 7. Consider Pre-computation

**For expensive aggregations**:

Instead of:
```sparql
SELECT ?project (COUNT(?task) AS ?count)
WHERE {
  ?task <https://exocortex.my/ontology/ems#belongs_to_project> ?project .
}
GROUP BY ?project
```

**Pre-compute** during indexing and store as property:
```turtle
<vault://Projects/My-Project.md> <http://example.org/task_count> "15" .
```

Then query:
```sparql
SELECT ?project ?count
WHERE {
  ?project <http://example.org/task_count> ?count .
}
```

---

## Performance Checklist

Before deploying a query, verify:

- [ ] Uses specific predicates (no `?p` wildcards)
- [ ] Has `LIMIT` clause (during development)
- [ ] Filters on class/type first
- [ ] OPTIONAL clauses are minimal (<3)
- [ ] Regex patterns are specific, not `.*`
- [ ] Uses indexed patterns (check table above)
- [ ] Tested with realistic vault size
- [ ] Execution time <100ms for interactive queries

---

## Real-World Benchmarks

**Vault Size**: 1,000 notes (5,000 triples)

| Query Type | Time | Result Count |
|-----------|------|--------------|
| All tasks (indexed) | 2ms | 200 |
| Tasks with labels (indexed) | 5ms | 200 |
| Tasks filtered by status | 8ms | 50 |
| Project task counts | 15ms | 20 |
| Full hierarchy (task→project→area) | 25ms | 200 |
| Regex search on labels | 35ms | 15 |
| Complex aggregation (5 groups) | 50ms | 5 |
| Wildcard query (`?s ?p ?o` LIMIT 100) | 120ms | 100 |

**Goal**: Keep most queries under 50ms.

---

## When to Optimize

**Optimize if**:
- Query takes >100ms consistently
- UI feels sluggish when query runs
- User reports performance issues
- Vault has >1,000 notes

**Don't optimize if**:
- Query runs <50ms
- Runs infrequently (e.g., once per day)
- Result set is naturally small

**Remember**: Premature optimization is the root of all evil. Measure first, optimize second.

---

## RDF/RDFS Inference Performance

### Transitive Closure Queries

Queries using `rdfs:subClassOf*` or `rdfs:subPropertyOf*` compute transitive closures.

**Performance Characteristics:**
- **Complexity**: O(n×m) where n = assets, m = hierarchy depth
- **Cached**: First query slow, subsequent queries fast
- **Memory**: Closure cached in-memory

**Optimization Tips:**

#### 1. Use LIMIT

❌ **Slow: Returns all assets**
```sparql
SELECT ?asset WHERE {
  ?asset rdf:type ?type .
  ?type rdfs:subClassOf* exo:Asset .
}
```

✅ **Fast: Returns only 10 assets**
```sparql
SELECT ?asset WHERE {
  ?asset rdf:type ?type .
  ?type rdfs:subClassOf* exo:Asset .
}
LIMIT 10
```

#### 2. Filter by Specific Type First

✅ **Faster: Filter before transitive closure**
```sparql
SELECT ?asset
WHERE {
  ?asset rdf:type ems:Task .  # Filter first
  ems:Task rdfs:subClassOf* exo:Asset .
}
```

#### 3. Avoid Deep Hierarchies in Hot Paths

- Exocortex class hierarchy is shallow (max depth: 3)
- Custom ontologies with deep hierarchies: consider caching
- **Recommendation**: Use ExoRDF for performance-critical queries, RDF/RDFS for interoperability

### RDF/RDFS vs ExoRDF Performance

| Query Type | RDF/RDFS | ExoRDF | Winner |
|-----------|----------|--------|--------|
| Direct type query | ~same | ~same | Tie |
| Transitive hierarchy | Slower (inference) | N/A | ExoRDF |
| Standard tooling | Compatible | Incompatible | RDF/RDFS |

**Recommendation**: Use ExoRDF for performance-critical queries, RDF/RDFS for interoperability.

### Inference Examples

**Simple class query** (<10ms):
```sparql
SELECT ?task WHERE {
  ?task rdf:type ems:Task .
}
```

**Transitive query** (10-100ms):
```sparql
SELECT ?asset WHERE {
  ?asset rdf:type ?type .
  ?type rdfs:subClassOf* exo:Asset .
}
LIMIT 100
```

**Deep transitive query** (100ms+):
```sparql
SELECT ?asset ?type1 ?type2 ?type3 WHERE {
  ?asset rdf:type ?type1 .
  ?type1 rdfs:subClassOf ?type2 .
  ?type2 rdfs:subClassOf ?type3 .
  ?type3 rdfs:subClassOf* exo:Asset .
}
```

---

## Next Steps

- **Learn Query Syntax**: Read [User-Guide.md](./User-Guide.md)
- **Try Examples**: Explore [Query-Examples.md](./Query-Examples.md)
- **Extend System**: See [Developer-Guide.md](./Developer-Guide.md)

## Resources

- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [Exocortex GitHub](https://github.com/kitelev/exocortex-obsidian-plugin)

---

**Need Help?** Report performance issues on [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues) with your query and vault size!
