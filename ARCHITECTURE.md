# Exocortex Plugin Architecture

## Overview
This plugin follows Clean Architecture principles with a clear separation of concerns and dependency inversion.

## Architecture Principles

### 1. Clean Architecture
The plugin is organized in concentric layers:
- **Domain Layer** (innermost): Business logic and entities
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: External dependencies and adapters
- **Presentation Layer** (outermost): UI components and user interaction

Dependencies flow inward only - outer layers depend on inner layers, never the reverse.

### 2. SOLID Principles

#### Single Responsibility Principle (SRP)
Each class has one reason to change:
- `Asset` entity manages asset data
- `OntologyRepository` handles ontology persistence
- `CreateAssetUseCase` orchestrates asset creation

#### Open/Closed Principle (OCP)
Classes are open for extension, closed for modification:
- New asset types extend `Asset` base class
- New repositories implement `IRepository` interface

#### Liskov Substitution Principle (LSP)
Derived classes can substitute base classes:
- Any `IRepository` implementation works with use cases
- Any `ILayoutRenderer` can render layouts

#### Interface Segregation Principle (ISP)
Clients depend only on interfaces they use:
- `IAssetRepository` for asset operations
- `IOntologyRepository` for ontology operations
- `IVaultAdapter` for vault access

#### Dependency Inversion Principle (DIP)
High-level modules don't depend on low-level modules:
- Use cases depend on repository interfaces, not implementations
- Domain entities don't know about Obsidian API

### 3. DRY (Don't Repeat Yourself)
- Shared logic extracted to utility functions
- Common patterns implemented once in base classes
- Configuration centralized in settings

### 4. KISS (Keep It Simple, Stupid)
- Simple, clear method names
- Minimal method parameters
- Straightforward control flow

### 5. GRASP (General Responsibility Assignment Software Patterns)

#### Information Expert
Objects with the data perform operations on that data:
- `Asset` validates its own properties
- `Ontology` manages its prefixes

#### Creator
Objects create instances they closely use:
- `AssetFactory` creates assets
- `RepositoryFactory` creates repositories

#### Controller
Controllers coordinate and delegate:
- `ExocortexPlugin` coordinates plugin lifecycle
- `CreateAssetUseCase` coordinates asset creation

#### Low Coupling
Minimal dependencies between classes:
- Use interfaces instead of concrete classes
- Dependency injection for loose coupling

#### High Cohesion
Related functionality grouped together:
- All asset operations in `AssetService`
- All UI components in presentation layer

### 6. Executable Specifications
Tests serve as living documentation:
```typescript
describe('CreateAssetUseCase', () => {
  it('should create an asset with valid properties', async () => {
    // Given a valid asset request
    // When creating the asset
    // Then the asset is persisted with correct properties
  });
});
```

### 7. Test Principles

#### Fake Objects
Test doubles that provide working implementations:
```typescript
class FakeVaultAdapter implements IVaultAdapter {
  private files = new Map<string, string>();
  
  async create(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }
}
```

#### Test Context
Encapsulated test setup and utilities:
```typescript
class TestContext {
  public vault: FakeVaultAdapter;
  public repository: AssetRepository;
  
  constructor() {
    this.vault = new FakeVaultAdapter();
    this.repository = new AssetRepository(this.vault);
  }
}
```

#### FIRST Principles
- **Fast**: Tests run in milliseconds
- **Independent**: Tests don't depend on each other
- **Repeatable**: Same results every run
- **Self-Validating**: Clear pass/fail
- **Timely**: Written with or before code

## Project Structure

```
src/
├── domain/                 # Business logic (no dependencies)
│   ├── entities/
│   │   ├── Asset.ts       # Core asset entity
│   │   ├── Ontology.ts    # Ontology entity
│   │   └── Property.ts    # Property entity
│   ├── value-objects/
│   │   ├── AssetId.ts     # Asset identifier
│   │   ├── ClassName.ts   # Class name value
│   │   └── OntologyPrefix.ts
│   ├── repositories/       # Repository interfaces
│   │   ├── IAssetRepository.ts
│   │   └── IOntologyRepository.ts
│   └── services/
│       └── AssetValidator.ts
│
├── application/            # Use cases (depends on domain)
│   ├── use-cases/
│   │   ├── CreateAssetUseCase.ts
│   │   ├── FindOntologiesUseCase.ts
│   │   └── RenderLayoutUseCase.ts
│   └── ports/             # Application interfaces
│       ├── IVaultAdapter.ts
│       └── IMetadataCache.ts
│
├── infrastructure/         # External dependencies
│   ├── adapters/
│   │   ├── ObsidianVaultAdapter.ts
│   │   └── ObsidianMetadataAdapter.ts
│   └── repositories/
│       ├── AssetRepository.ts
│       └── OntologyRepository.ts
│
├── presentation/          # UI layer
│   ├── components/
│   │   └── SettingsTab.ts
│   ├── modals/
│   │   └── CreateAssetModal.ts
│   └── commands/
│       └── CommandRegistry.ts
│
└── shared/               # Cross-cutting concerns
    ├── Container.ts      # Dependency injection
    └── Logger.ts         # Logging utility
```

## Dependency Flow

```
Presentation → Application → Domain
     ↓             ↓
Infrastructure ←───┘
```

## Key Patterns

### Repository Pattern
Abstracts data access:
```typescript
interface IAssetRepository {
  findById(id: AssetId): Promise<Asset | null>;
  save(asset: Asset): Promise<void>;
  findByClass(className: ClassName): Promise<Asset[]>;
}
```

### Factory Pattern
Creates complex objects:
```typescript
class AssetFactory {
  static create(props: AssetProps): Asset {
    // Validation and creation logic
    return new Asset(props);
  }
}
```

### Adapter Pattern
Adapts external APIs to our interfaces:
```typescript
class ObsidianVaultAdapter implements IVaultAdapter {
  constructor(private vault: Vault) {}
  
  async create(path: string, content: string): Promise<void> {
    await this.vault.create(path, content);
  }
}
```

### Dependency Injection
Inverts control for testability:
```typescript
class Container {
  private services = new Map();
  
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }
  
  resolve<T>(token: string): T {
    return this.services.get(token)();
  }
}
```

## Testing Strategy

### Unit Tests
Test individual components in isolation:
- Domain entities and value objects
- Use cases with mocked dependencies
- Pure functions and utilities

### Integration Tests
Test component interactions:
- Repository with fake adapters
- Use cases with real repositories
- Modal with test context

### End-to-End Tests
Test complete workflows:
- Create asset from UI to persistence
- Load and render layouts
- Settings changes and effects

## Benefits

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Easy to test with dependency injection
3. **Flexibility**: Easy to change implementations
4. **Scalability**: Add features without affecting existing code
5. **Understandability**: Clear architecture and patterns

## Guidelines for Contributors

1. **Follow the architecture**: Place code in appropriate layers
2. **Depend on abstractions**: Use interfaces, not concrete classes
3. **Test first**: Write tests before implementation
4. **Keep it simple**: Avoid over-engineering
5. **Document decisions**: Explain non-obvious choices