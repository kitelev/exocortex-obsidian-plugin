# Claude Code Memory Bank - Implementation Specifications

## Current Technical Implementation

### Technology Stack (Actual)
- **Language**: TypeScript 4.7.4
- **Build System**: ESBuild 0.17.3 (fast compilation and bundling)
- **Testing Framework**: Jest 30.0.5 with jsdom environment
- **Plugin Framework**: Obsidian Plugin API (latest)
- **Dependencies**: 
  - `js-yaml` 4.1.0 (YAML parsing)
  - `ts-jest` 29.4.1 (TypeScript testing)
  - `@cucumber/cucumber` 10.0.0 (BDD documentation)

### Build Configuration

#### ESBuild Configuration (`esbuild.config.mjs`)
```javascript
export default {
  entryPoints: ['main.ts'],
  bundle: true,
  external: ['obsidian', 'electron'],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: development ? 'inline' : false,
  treeShaking: true,
  outfile: 'main.js',
}
```

#### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "CommonJS",
    "lib": ["ES2018"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false,
    "outDir": "./dist"
  }
}
```

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

### Plugin Manifest (`manifest.json`)
```json
{
  "id": "exocortex-obsidian-plugin",
  "name": "Exocortex",
  "version": "0.6.1",
  "minAppVersion": "1.0.0",
  "description": "Configurable UI system for ontology-driven layouts",
  "author": "kitelev",
  "authorUrl": "https://github.com/kitelev",
  "isDesktopOnly": false
}
```

### Version Management (`version-bump.mjs`)
Automated version bumping system that:
1. Reads current version from `manifest.json`
2. Increments patch version automatically
3. Updates `manifest.json` and `versions.json`
4. Used by GitHub Actions for automated releases

### File Structure and Naming Conventions

#### Domain Layer Files
```
/src/domain/
├── core/
│   ├── Entity.ts           # Base entity class
│   ├── AggregateRoot.ts    # DDD aggregate root
│   └── Result.ts           # Error handling pattern
├── entities/
│   ├── Asset.ts            # Core asset entity
│   ├── ButtonCommand.ts    # UI button commands
│   ├── ClassLayout.ts      # Layout configuration
│   ├── LayoutBlock.ts      # Layout block definition
│   ├── Ontology.ts         # Ontology entity
│   └── UIButton.ts         # UI button entity
├── value-objects/
│   ├── AssetId.ts          # Unique identifier
│   ├── ClassName.ts        # Class name validation
│   └── OntologyPrefix.ts   # Ontology prefix handling
└── repositories/
    ├── IAssetRepository.ts      # Asset data access
    ├── IButtonRepository.ts     # Button data access
    ├── IClassLayoutRepository.ts # Layout data access
    ├── IClassViewRepository.ts  # View data access
    └── IOntologyRepository.ts   # Ontology data access
```

#### Application Layer Files
```
/src/application/
├── core/
│   ├── Container.ts        # DI container implementation
│   └── UseCase.ts          # Base use case class
├── services/
│   └── ICommandExecutor.ts # Command execution interface
└── use-cases/
    ├── CreateAssetUseCase.ts          # Asset creation workflow
    ├── ExecuteButtonCommandUseCase.ts # Button command execution
    ├── ExecuteQueryBlockUseCase.ts    # Query block execution
    ├── GetLayoutForClassUseCase.ts    # Layout retrieval
    ├── PropertyEditingUseCase.ts      # Property editing workflow
    └── RenderClassButtonsUseCase.ts   # Button rendering workflow
```

#### Infrastructure Layer Files
```
/src/infrastructure/
├── adapters/
│   └── ObsidianVaultAdapter.ts        # Obsidian vault integration
├── container/
│   └── DIContainer.ts                 # Dependency injection setup
├── repositories/
│   ├── AssetRepository.ts             # Base asset repository
│   ├── ObsidianAssetRepository.ts     # Obsidian asset implementation
│   ├── ObsidianButtonRepository.ts    # Obsidian button implementation
│   ├── ObsidianClassLayoutRepository.ts # Obsidian layout implementation
│   ├── ObsidianClassViewRepository.ts # Obsidian view implementation
│   └── ObsidianOntologyRepository.ts  # Obsidian ontology implementation
└── services/
    └── ObsidianCommandExecutor.ts     # Obsidian command execution
```

#### Presentation Layer Files
```
/src/presentation/
├── components/
│   ├── ButtonRenderer.ts    # Button rendering component
│   └── PropertyRenderer.ts  # Property rendering component
├── modals/
│   ├── ClassTreeModal.ts    # Class selection modal
│   └── CreateAssetModal.ts  # Asset creation modal
└── renderers/
    ├── BacklinksBlockRenderer.ts    # Backlinks block
    ├── CustomBlockRenderer.ts      # Custom dataview blocks
    ├── LayoutRenderer.ts            # Main layout renderer
    ├── PropertiesBlockRenderer.ts   # Properties block
    └── QueryBlockRenderer.ts       # Query result block
```

### Testing Implementation Details

#### Test File Organization
```
/tests/
├── __mocks__/
│   └── obsidian.ts               # Comprehensive Obsidian mocks
├── helpers/
│   ├── FakeVaultAdapter.ts       # Test vault implementation
│   └── TestContext.ts            # Encapsulated test setup
├── domain/entities/
│   └── Asset.test.ts             # Domain entity tests
├── unit/repositories/
│   └── ObsidianAssetRepository.test.ts # Repository unit tests
├── integration/
│   └── PropertyEditingUseCase.test.ts  # Use case integration tests
├── e2e/
│   └── inline-editing.test.ts    # End-to-end workflow tests
├── main.test.ts                  # Main plugin tests
└── modal.test.ts                 # Modal interaction tests
```

#### Mock Implementation Patterns
```typescript
// Obsidian API Mocking
export class TFile {
  constructor(public path: string, public basename: string) {}
}

export class Vault {
  create = jest.fn().mockResolvedValue(undefined);
  read = jest.fn().mockResolvedValue('');
  modify = jest.fn().mockResolvedValue(undefined);
  getFiles = jest.fn().mockReturnValue([]);
}

export class MetadataCache {
  getFileCache = jest.fn().mockReturnValue(null);
}
```

### GitHub Actions Workflows

#### Quality Gate (`quality-gate.yml`)
```yaml
name: Quality Gate
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Check file sizes
      - name: Validate manifest
```

#### Auto Release (`auto-release.yml`)
```yaml
name: Auto Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node version-bump.mjs
      - run: npm run build
      - name: Create Release
      - name: Upload Release Assets
```

### CSS and Styling

#### Main Styles (`styles.css`)
- Desktop-optimized styles
- Obsidian theme integration
- Layout block styling
- Modal and button styles

#### Mobile Styles (`styles-mobile.css`)
- Responsive design adaptations
- Touch-friendly button sizes (44px minimum)
- Mobile-specific layout adjustments
- Safe area handling for iOS

### Configuration Files

#### Plugin Settings Interface
```typescript
interface ExocortexSettings {
  defaultOntology: string;           # Default: 'exo'
  enableAutoLayout: boolean;         # Default: true
  debugMode: boolean;                # Default: false
  templateFolderPath: string;        # Default: 'templates'
  layoutsFolderPath: string;         # Default: 'layouts'  
  enableClassLayouts: boolean;       # Default: true
}
```

#### Layout Configuration Format
```yaml
# Layout - ClassName.md frontmatter
exo__Instance_class: "[[ui__ClassLayout]]"
ui__ClassLayout_targetClass: "[[ems__Project]]"
ui__ClassLayout_priority: 10
ui__ClassLayout_blocks:
  - id: "tasks"
    type: "query"
    title: "Active Tasks"
    config:
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_project"
          operator: "equals"
          value: "{{current_asset}}"
```

### Performance Optimizations

#### Build Optimizations
- **Tree Shaking**: ESBuild removes unused code
- **Minification**: Production builds are minified
- **Source Maps**: Available in development only
- **Bundle Splitting**: Single bundle for faster loading

#### Runtime Optimizations
- **Lazy Loading**: Components loaded on-demand
- **Caching**: Layout configurations cached
- **Debouncing**: UI updates debounced
- **Memory Management**: Proper cleanup on unload

### Error Handling Implementation

#### Result Pattern Usage
```typescript
// Domain entities return Results
const assetResult = Asset.create(props);
if (!assetResult.isSuccess) {
  console.error(assetResult.getError());
  return;
}

// Use cases handle Results
async execute(request: CreateAssetRequest): Promise<Result<Asset>> {
  const validationResult = this.validateRequest(request);
  if (!validationResult.isSuccess) {
    return Result.fail(validationResult.getError());
  }
  // ...
}
```

#### UI Error Handling
```typescript
// User-facing errors
new Notice('Error: Could not create asset');

// Developer errors
console.error('Repository error:', error);

// Graceful degradation
if (!layoutFile) {
  await this.renderDefaultLayout(dv, file, metadata, container);
  return;
}
```

### Plugin Integration Points

#### Obsidian Command Registration
```typescript
this.addCommand({
  id: 'create-exo-asset',
  name: 'Create ExoAsset',
  callback: () => new ExocortexAssetModal(this.app, this).open()
});
```

#### Settings Tab Integration
```typescript
this.addSettingTab(new ExocortexSettingTab(this.app, this));
```

#### Global Function Registration
```typescript
(window as any).ExoUIRender = async (dv: any, ctx: any) => {
  await this.renderUniversalLayout(dv, ctx);
};
```

### Data Flow Architecture

#### Asset Creation Flow
1. **UI**: CreateAssetModal collects user input
2. **Validation**: Modal validates required fields
3. **Use Case**: CreateAssetUseCase coordinates creation
4. **Domain**: Asset entity validates business rules
5. **Repository**: ObsidianAssetRepository persists to vault
6. **UI Update**: Modal closes, file opens in editor

#### Property Editing Flow
1. **UI**: PropertyRenderer detects click on editable property
2. **Use Case**: PropertyEditingUseCase validates change
3. **Repository**: Updates frontmatter via Obsidian API
4. **UI Update**: Property display refreshes

#### Layout Rendering Flow
1. **Trigger**: Dataview code block executes
2. **Detection**: Plugin identifies asset class
3. **Layout Discovery**: Finds appropriate layout configuration
4. **Rendering**: LayoutRenderer processes blocks sequentially
5. **Display**: Each block type renders its content

This implementation specification reflects the actual working codebase as of version 0.6.1, providing accurate technical details for future development and maintenance.