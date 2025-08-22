---
exo__Asset_uid: "test-note-001"
exo__Instance_class: "[[ztlk__Note]]"
exo__Asset_label: "SPARQL Query Examples"
tags: ["sparql", "testing", "documentation"]
---

# SPARQL Query Examples

## Basic SELECT Query

```sparql
SELECT * WHERE { }
LIMIT 10
```

## Find Tasks

```sparql
SELECT ?subject ?predicate ?object WHERE { }
LIMIT 50
```

## Invalid Query (for error testing)

```sparql
INVALID SPARQL SYNTAX
```
