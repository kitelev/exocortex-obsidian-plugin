# AI Assistant Quick Reference

## 🚀 Quick Commands

### Start New Feature
```bash
npm test                    # Verify current state
npm run dev                 # Start development mode
# Make changes...
npm test                    # Verify changes
npm run build              # Check compilation
```

### Before Commit
```bash
npm test                    # Run all tests
npm run test:coverage      # Check coverage
npm run build              # Verify build
```

### Release Process
```bash
# 1. Update version
npm version patch          # for fixes
npm version minor          # for features
npm version major          # for breaking changes

# 2. Update CHANGELOG.md (user-focused!)

# 3. Commit and push
git add -A
git commit -m "feat: description"
git push origin main       # Auto-release triggered
```

## 📁 Where to Find Things

### Core Business Logic
- `/src/domain/entities/` - Asset, Ontology models
- `/src/domain/semantic/` - RDF/SPARQL implementation
- `/src/application/use-cases/` - Business operations

### UI Components
- `/src/presentation/components/` - Renderers
- `/src/presentation/modals/` - User dialogs

### Infrastructure
- `/src/infrastructure/container/DIContainer.ts` - Dependency injection
- `/src/infrastructure/repositories/` - Data access

### Tests
- `/tests/unit/` - Unit tests with examples
- `/tests/__mocks__/obsidian.ts` - Mock setup

## 🎯 Common Tasks

### Add New Feature
1. Create use case in `/src/application/use-cases/`
2. Add tests in `/tests/unit/`
3. Wire in `DIContainer.ts`
4. Update UI if needed

### Fix Bug
1. Write failing test first
2. Fix the bug
3. Verify test passes
4. Check other tests still pass

### Add New Entity
1. Create in `/src/domain/entities/`
2. Create repository interface in `/src/domain/repositories/`
3. Implement repository in `/src/infrastructure/repositories/`
4. Add tests

### Update UI Component
1. Find component in `/src/presentation/`
2. Update following existing patterns
3. Test manually in Obsidian
4. Add/update tests

## ⚡ Performance Tips

### Keep Bundle Small
- Check size: `ls -lh main.js`
- Target: < 1MB
- Use dynamic imports for large features

### Fast Tests
- Mock external dependencies
- Use `beforeEach` for setup
- Keep tests focused

### Efficient Queries
- Use Graph indexes (SPO/POS/OSP)
- Cache SPARQL results
- Batch operations

## 🐛 Debugging

### Test Failures
```bash
npm test -- --verbose      # Detailed output
npm test -- path/to/test   # Run specific test
```

### Build Errors
```bash
npm run build              # See TypeScript errors
tsc --noEmit              # Type check only
```

### Runtime Issues
- Check Obsidian console (Ctrl+Shift+I)
- Add `console.log` temporarily
- Use debugger in DevTools

## 📝 Code Patterns

### Use Case Pattern
```typescript
export class MyUseCase {
  constructor(
    private repository: IRepository
  ) {}
  
  async execute(request: Request): Promise<Response> {
    // Validation
    // Business logic
    // Return result
  }
}
```

### Repository Pattern
```typescript
export interface IMyRepository {
  findById(id: string): Promise<Entity | null>;
  save(entity: Entity): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Test Pattern
```typescript
describe('MyComponent', () => {
  let component: MyComponent;
  
  beforeEach(() => {
    // Setup
  });
  
  it('should do something', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## 🔑 Key Principles

1. **Clean Architecture** - Separate layers
2. **SOLID** - Single responsibility
3. **DRY** - Don't repeat yourself
4. **KISS** - Keep it simple
5. **Test First** - Write test before code

## 📚 Essential Files

- `CLAUDE.md` - Full guidelines
- `ARCHITECTURE.md` - System design
- `package.json` - Scripts and dependencies
- `jest.config.js` - Test configuration
- `esbuild.config.mjs` - Build configuration

## 💡 Pro Tips

1. **Follow existing patterns** - Don't reinvent
2. **Test everything** - Especially edge cases
3. **User-focused commits** - Think benefits
4. **Small commits** - Easier to review
5. **Update docs** - Keep them current

## 🚨 Never Do This

- ❌ Skip tests
- ❌ Ignore TypeScript errors
- ❌ Commit without testing
- ❌ Add unused dependencies
- ❌ Break existing features
- ❌ Write technical release notes
- ❌ Forget to update version

## 🎉 Success Checklist

- [ ] Tests pass
- [ ] Coverage > 70%
- [ ] Build succeeds
- [ ] Version updated
- [ ] CHANGELOG updated (user-focused!)
- [ ] Committed with clear message
- [ ] Pushed to GitHub

---

**Quick Help**: When in doubt, look at existing code for patterns!