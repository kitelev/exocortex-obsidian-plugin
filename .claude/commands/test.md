---
description: Run tests and check coverage
allowed-tools: Bash(npm test*), Bash(npm run*), Read, Task
argument-hint: [specific test file or pattern]
---

# Run Tests and Coverage Check

## Test Target: $ARGUMENTS

Please execute comprehensive testing:

1. **Run Test Suite**
   - Execute: `npm test` or specific test if provided
   - Capture and analyze results
   - Identify any failures or errors

2. **Coverage Analysis**
   - Check current coverage metrics
   - Identify uncovered code paths
   - Compare against 70% threshold

3. **Test Categories**
   - Unit tests
   - Integration tests
   - UI tests (if applicable)
   - Mobile/platform-specific tests

4. **Failure Analysis** (if any)
   - Identify root cause of failures
   - Suggest fixes or use test-fixer-agent
   - Check for environment-specific issues

5. **Performance Metrics**
   - Test execution time
   - Memory usage during tests
   - Identify slow tests

6. **Recommendations**
   - Suggest additional test cases
   - Identify areas needing coverage
   - Propose test improvements

Format output with clear sections:
- ✅ Passing tests
- ❌ Failing tests (with details)
- 📊 Coverage report
- 🎯 Recommendations

If failures are found, offer to fix them using the test-fixer-agent or other appropriate agents.