# Error Log - Exocortex Obsidian Plugin

## Error History

### ERR-2025-001: Invalid IRI for Exocortex Property Names
- **Date**: 2025-01-10
- **Severity**: High
- **Component**: Triple.ts (IRI validation)
- **Status**: Resolved
- **Fixed By**: Error Handler Agent

#### Description
IRI validation was rejecting valid Exocortex property names like `exo__Asset_uid` because the regex pattern didn't support double underscore naming convention.

#### Stack Trace
```
Error: Invalid IRI: exo__Asset_uid
  at new IRI (main.js:316:13)
  at ExocortexPlugin.extractTriplesFromFile (main.js:9150:13)
  at ExocortexPlugin.loadVaultIntoGraph (main.js:9101:30)
```

#### Root Cause
The IRI validation regex only supported standard CURIE format (prefix:localName) but not the Exocortex naming convention (prefix__Class_property).

#### Resolution
Updated the isValid() method in Triple.ts to accept both:
- Standard CURIE: `prefix:localName`
- Exocortex convention: `prefix__Class_property`

#### Code Change
```typescript
// Added support for double underscore pattern
return /^[a-zA-Z][a-zA-Z0-9_]*(__[a-zA-Z][a-zA-Z0-9_]*(_[a-zA-Z][a-zA-Z0-9_]*)?)?$/.test(value) ||
       /^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value);
```

#### Prevention
- Added comprehensive regex pattern for Exocortex naming
- Documented the naming convention support
- Tests now validate both formats

#### Related Issues
- TASK-2025-002: Fix IRI Validation Error

---

## Error Patterns Identified

### Pattern 1: Naming Convention Mismatches
- **Frequency**: Common during initial setup
- **Cause**: Strict validation not accounting for project conventions
- **Solution**: Extend validators to support project-specific patterns
- **Prevention**: Document all naming conventions clearly

---
*Maintained by Error Handler Agent*
*Last Updated: 2025-01-10*