# SPARQL Test File

This file tests the SPARQL functionality in the Exocortex plugin.

## Test Query 1: Show all triples
```sparql
SELECT * WHERE { }
LIMIT 10
```

## Test Query 2: Find all tasks
```sparql
SELECT ?task WHERE { }
LIMIT 5
```

## Test Query 3: Show subjects and predicates
```sparql
SELECT ?subject ?predicate WHERE { }
LIMIT 15
```