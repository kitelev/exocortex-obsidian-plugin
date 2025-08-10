# TASK-2025-004: Fix Test Suite Failures

id: TASK-2025-004
title: Fix IndexedGraph test failures and improve coverage
type: bug
priority: critical
status: in_progress
assignee: qa-engineer
epic: EPIC-001
sprint: sprint-01
created: 2025-01-10T14:00:00Z
updated: 2025-01-10T14:00:00Z
estimated: 1h
actual: null
tags: [testing, bug, quality]

## Problem Description
Test suite has 14 failing tests due to missing methods in IndexedGraph implementation.

## Current Status
- Tests: 14 failed, 9 skipped, 507 passed
- Total: 530 tests
- Pass rate: 95.7%
- Target: 100% pass rate

## Root Cause
IndexedGraph extends Graph but doesn't expose all parent methods properly:
- `getAllTriples()` method not accessible
- `clear()` method not accessible
- `size()` method not accessible

## Acceptance Criteria
- [ ] All tests passing (100%)
- [ ] No skipped tests without justification
- [ ] Coverage report generated
- [ ] Test execution time < 5 seconds

## Fix Approach
1. Add missing method delegates in IndexedGraph
2. Fix test assertions
3. Remove or fix skipped tests
4. Generate coverage report

## Memory Bank References
- CLAUDE-test-plans.md#test-strategy
- CLAUDE-errors.md#test-failures