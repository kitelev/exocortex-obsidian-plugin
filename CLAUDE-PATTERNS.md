# Claude Code Memory Bank - Implementation Patterns

## Current Architecture Implementation

### Clean Architecture Layers
The project successfully implements Clean Architecture with strict dependency inversion:

**Domain Layer** (`/src/domain/`)
- **Entities**: `Asset`, `ButtonCommand`, `ClassLayout`, `LayoutBlock`, `Ontology`, `UIButton`
- **Value Objects**: `AssetId`, `ClassName`, `OntologyPrefix`
- **Repository Interfaces**: `IAssetRepository`, `IButtonRepository`, etc.
- **Core Patterns**: `Entity`, `AggregateRoot`, `Result` for error handling

**Application Layer** (`/src/application/`)
- **Use Cases**: `CreateAssetUseCase`, `PropertyEditingUseCase`, `RenderClassButtonsUseCase`
- **Services**: `ICommandExecutor` interface
- **Core**: `Container` for dependency injection, `UseCase` base class

**Infrastructure Layer** (`/src/infrastructure/`)
- **Repositories**: Obsidian-specific implementations
- **Services**: `ObsidianCommandExecutor`
- **Container**: `DIContainer` with comprehensive dependency registration
- **Adapters**: `ObsidianVaultAdapter`

**Presentation Layer** (`/src/presentation/`)
- **Components**: `ButtonRenderer`, `PropertyRenderer`
- **Modals**: `ClassTreeModal`, `CreateAssetModal`
- **Renderers**: `LayoutRenderer`, `QueryBlockRenderer`, `BacklinksBlockRenderer`

### Key Patterns Successfully Implemented

#### 1. Repository Pattern
```typescript
interface IAssetRepository {
  findById(id: AssetId): Promise<Asset | null>;
  findByPath(path: string): Promise<Asset | null>;
  save(asset: Asset): Promise<void>;
  updateFrontmatter(path: string, frontmatter: Record<string, any>): Promise<void>;
}
```

#### 2. Dependency Injection Container
```typescript
export class DIContainer {
  private container: Container;
  
  private registerDependencies(): void {
    this.container.register<IAssetRepository>(
      'IAssetRepository',
      () => new ObsidianAssetRepository(this.app)
    );
    // ... more registrations
  }
}
```

#### 3. Result Pattern for Error Handling
```typescript
export class Result<T> {
  static ok<U>(value: U): Result<U> { /* ... */ }
  static fail<U>(error: string): Result<U> { /* ... */ }
  
  isSuccess: boolean;
  getValue(): T | null;
  getError(): string;
}
```

#### 4. Value Objects with Validation
```typescript
export class AssetId {
  private constructor(private value: string) {}
  
  static create(id: string): Result<AssetId> {
    if (!this.isValid(id)) {
      return Result.fail<AssetId>('Invalid asset ID format');
    }
    return Result.ok<AssetId>(new AssetId(id));
  }
}
```

### Testing Architecture (Jest-Based)

#### Test Structure
```
/tests/
  /__mocks__/         - Obsidian API mocks
    obsidian.ts       - Comprehensive Obsidian mock
  /helpers/           - Test utilities
    FakeVaultAdapter.ts
    TestContext.ts    - Encapsulated test setup
  /unit/              - Unit tests with mocks
  /integration/       - Integration tests with fakes
  /e2e/               - End-to-end workflow tests
  /domain/            - Domain entity tests
```

#### Key Testing Patterns

**1. Fake Objects Pattern**
```typescript
export class FakeVaultAdapter implements IVaultAdapter {
  private files = new Map<string, string>();
  
  async create(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }
  
  async read(path: string): Promise<string> {
    return this.files.get(path) || '';
  }
}
```

**2. Test Context Pattern**
```typescript
export class TestContext {
  public vault: FakeVaultAdapter;
  public repository: IAssetRepository;
  
  constructor() {
    this.vault = new FakeVaultAdapter();
    this.repository = new AssetRepository(this.vault);
  }
}
```

**3. Comprehensive Mocking**
```typescript
// tests/__mocks__/obsidian.ts
export class TFile {
  constructor(public path: string, public basename: string) {}
}

export class Vault {
  create = jest.fn();
  read = jest.fn();
  modify = jest.fn();
}
```

### Current Development Workflow

#### 1. Development Commands
```bash
npm run dev          # ESBuild development build with watch
npm test:watch       # Jest in watch mode
npm test:coverage    # Coverage report generation
npm run build        # Production build (TypeScript + ESBuild)
```

#### 2. Quality Gates
- **Test Coverage**: 70% threshold (configurable in jest.config.js)
- **TypeScript Compilation**: `tsc -noEmit -skipLibCheck`
- **Build Validation**: ESBuild production build
- **File Size Limits**: Enforced in GitHub Actions

#### 3. Automated Release Pipeline
```yaml
# .github/workflows/auto-release.yml
on:
  push:
    branches: [main]
    
steps:
  - Run tests and build
  - Execute version-bump.mjs
  - Update manifest.json and versions.json
  - Create GitHub release
  - Upload release artifacts
```

### Plugin Architecture Specifics

#### 1. Main Plugin Class Integration
```typescript
export default class ExocortexPlugin extends Plugin {
  private diContainer: DIContainer;
  
  async onload() {
    // Initialize DI Container
    this.diContainer = DIContainer.initialize(this.app, this);
    
    // Register universal renderer
    (window as any).ExoUIRender = async (dv: any, ctx: any) => {
      await this.renderUniversalLayout(dv, ctx);
    };
  }
}
```

#### 2. Settings Integration
```typescript
interface ExocortexSettings {
  defaultOntology: string;
  enableAutoLayout: boolean;
  debugMode: boolean;
  templateFolderPath: string;
  layoutsFolderPath: string;
  enableClassLayouts: boolean;
}
```

#### 3. Dynamic Layout System
- **Layout Discovery**: Automatic detection of `Layout - ClassName.md` files
- **Block Types**: Query, Properties, Relations, Backlinks, Custom
- **Configurable Rendering**: Through frontmatter configuration
- **Fallback Strategy**: Default layout when no configuration exists

### Performance Considerations

#### 1. Caching Strategy
- Layout configurations cached on load
- Asset metadata cached via Obsidian's MetadataCache
- Query results cached with appropriate invalidation

#### 2. Lazy Loading
- Components rendered on-demand
- Large result sets paginated or virtualized
- Assets loaded incrementally

#### 3. Memory Management
- DIContainer cleanup on plugin unload
- Event listener cleanup
- Interval cleanup for auto-refresh

### Error Handling Patterns

#### 1. Result Pattern Usage
```typescript
const assetResult = Asset.create({
  id: AssetId.generate(),
  className: ClassName.create('ems__Task').getValue()!,
  // ...
});

if (!assetResult.isSuccess) {
  console.error('Asset creation failed:', assetResult.getError());
  return;
}

const asset = assetResult.getValue()!;
```

#### 2. Graceful Degradation
- Invalid layout configurations fall back to default
- Missing files handled with empty state
- API errors logged but don't crash the plugin

#### 3. User Feedback
- Obsidian Notice for user-facing errors
- Console logging for debugging
- Error boundaries in UI components

## Best Practices Observed

1. **Strict Type Safety**: All public APIs use TypeScript interfaces
2. **Immutable Value Objects**: Value objects are immutable by design
3. **Single Responsibility**: Each class has a clear, single purpose
4. **Interface Segregation**: Small, focused interfaces
5. **Dependency Inversion**: High-level modules depend on abstractions
6. **Test-First Development**: Tests written alongside implementation
7. **Clean Error Handling**: Result pattern prevents exceptions bubbling up
8. **Consistent Naming**: Clear, descriptive naming conventions
9. **Comprehensive Mocking**: All external dependencies properly mocked
10. **Automated Quality**: CI/CD pipeline ensures quality standards