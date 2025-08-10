# TASK-2025-002: Fix IRI Validation Error

id: TASK-2025-002
title: Fix Invalid IRI Error in RDF Processing
type: bug
priority: high
status: in_progress
assignee: error-handler
epic: EPIC-001
sprint: sprint-01
created: 2025-01-10T12:00:00Z
updated: 2025-01-10T12:00:00Z
estimated: 1h
actual: null
tags: [bug, rdf, validation, tests]

## Error Description
Test suite failing with "Invalid IRI: exo__Asset_uid" error when processing metadata.

## Stack Trace
```
Error: Invalid IRI: exo__Asset_uid
  at new IRI (main.js:316:13)
  at ExocortexPlugin.extractTriplesFromFile (main.js:9150:13)
  at ExocortexPlugin.loadVaultIntoGraph (main.js:9101:30)
```

## Root Cause Analysis
The IRI validation is rejecting property names that don't include the full namespace URI. The code expects full URIs but receives prefixed names.

## Acceptance Criteria
- [ ] Tests pass without IRI validation errors
- [ ] Proper namespace expansion for prefixed names
- [ ] Backward compatibility maintained
- [ ] Error handling improved

## Solution Approach
1. Fix namespace expansion in IRI construction
2. Add validation for prefixed vs full URIs
3. Improve error messages
4. Add unit tests for edge cases

## Memory Bank References
- CLAUDE-errors.md#iri-validation
- CLAUDE-architecture.md#rdf-processing