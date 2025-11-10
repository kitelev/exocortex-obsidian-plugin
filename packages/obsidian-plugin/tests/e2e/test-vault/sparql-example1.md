---
exo__Instance_class: "[[exo__Document]]"
exo__Asset_label: "SPARQL Example 1 Test"
---

# SPARQL Example 1 Test

This page tests the Example 1 query from the README.

```sparql
PREFIX exo: <https://exocortex.my/ontology/exo#>

SELECT ?asset ?label
WHERE {
  ?asset exo:Asset_label ?label .
}
LIMIT 10
```
