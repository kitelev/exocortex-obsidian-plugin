# Clean Architecture Validation
# BDD Specifications for ensuring architectural integrity after refactoring

Feature: Clean Architecture Validation
  As a software architect
  I want the clean architecture principles to be maintained after refactoring
  So that the codebase remains maintainable and follows SOLID principles

  Background:
    Given the Exocortex plugin refactoring is complete
    And the clean architecture layers are preserved:
      | Layer | Directory | Purpose |
      | Domain | src/domain | Business logic and entities |
      | Application | src/application | Use cases and application services |
      | Infrastructure | src/infrastructure | External adapters and implementations |
      | Presentation | src/presentation | UI components and renderers |
    And dependency flow follows: Presentation -> Application -> Domain
    And Infrastructure depends on Domain but not Application

  Scenario: Domain layer remains independent and pure
    Given the refactored codebase is analyzed
    When I examine the domain layer dependencies
    Then domain entities should not import from any other layers
    And domain value objects should be self-contained
    And domain services should only depend on domain interfaces
    And the following domain components should still exist:
      | Component | Purpose |
      | Asset | Core business entity |
      | ClassLayout | Layout configuration entity |
      | Ontology | Ontology management entity |
      | AssetId | Value object for asset identification |
      | ClassName | Value object for class names |
      | PropertyValue | Value object for property values |
      | Result | Error handling pattern |
    And no domain component should have dependencies on Obsidian API

  Scenario: Domain repositories remain as pure interfaces
    Given the domain layer is examined
    When I check repository interfaces
    Then the following repository interfaces should exist in domain/repositories:
      | Interface | Purpose |
      | IAssetRepository | Asset persistence abstraction |
      | IAssetReadRepository | Read-only asset operations |
      | IAssetWriteRepository | Write-only asset operations |
      | IClassLayoutRepository | Layout configuration persistence |
      | IOntologyRepository | Ontology management persistence |
      | IClassViewRepository | Class view data access |
    And these interfaces should contain no implementation details
    And they should not reference Obsidian-specific types
    And they should use domain entities and value objects only

  Scenario: Application layer maintains use case orchestration
    Given the application layer is examined
    When I check use case implementations
    Then the following use cases should exist and be properly structured:
      | Use Case | Input | Output | Dependencies |
      | CreateAssetUseCase | Asset creation request | Creation result | Domain entities, repositories |
      | RenderLayoutUseCase | Layout request | Rendered layout | Layout services |
      | GetLayoutForClassUseCase | Class name | Layout configuration | Class repositories |
      | PropertyEditingUseCase | Property changes | Edit result | Asset services |
    And use cases should depend only on domain abstractions
    And use cases should not reference presentation layer components
    And use cases should coordinate domain services effectively

  Scenario: Application services remain focused and cohesive
    Given the application services are examined
    When I check service implementations
    Then the following services should exist with clear responsibilities:
      | Service | Responsibility |
      | LayoutCoordinator | Orchestrating layout rendering |
      | ErrorHandlerService | Centralizing error handling |
    And removed services should not exist:
      | Removed Service | Reason |
      | BlockRenderingService | Only used by removed components |
      | QueryEngineService | Query functionality removed |
      | QueryCache | Query functionality removed |
    And remaining services should have single responsibilities
    And services should use dependency injection properly

  Scenario: Infrastructure layer properly implements domain contracts
    Given the infrastructure layer is examined
    When I check adapter implementations
    Then the following adapters should properly implement domain interfaces:
      | Adapter | Interface | Purpose |
      | ObsidianAssetRepository | IAssetRepository | Asset persistence with Obsidian vault |
      | ObsidianClassLayoutRepository | IClassLayoutRepository | Layout persistence |
      | ObsidianClassViewRepository | IClassViewRepository | Class view access |
      | ObsidianOntologyRepository | IOntologyRepository | Ontology management |
      | ObsidianVaultAdapter | IVaultAdapter | Vault operations |
      | ObsidianUIAdapter | IUIAdapter | UI interactions |
    And removed infrastructure should not exist:
      | Removed Component | Reason |
      | ObsidianButtonRepository | Button functionality removed |
      | ObsidianCommandExecutor | Command execution removed |
    And adapters should handle Obsidian API complexity internally

  Scenario: Presentation layer maintains proper separation
    Given the presentation layer is examined
    When I check component dependencies
    Then preserved components should follow dependency rules:
      | Component | Dependencies | Restrictions |
      | UniversalLayoutRenderer | Application use cases, domain entities | No direct domain service calls |
      | DynamicLayoutRenderer | Application use cases, domain entities | No infrastructure dependencies |
      | CreateAssetModal | Application use cases, domain entities | No repository implementations |
    And removed presentation components should not exist:
      | Removed Component | Replacement |
      | ButtonRenderer | Functionality removed |
      | QueryBlockRenderer | Functionality removed |
      | Multiple specialized renderers | Consolidated into Universal/Dynamic |
    And components should use dependency injection for services

  Scenario: Dependency injection container maintains proper registration
    Given the DIContainer is examined
    When I check service registration
    Then the container should register only services for preserved functionality:
      | Service Type | Implementations |
      | Repositories | Asset, ClassLayout, Ontology, ClassView repositories |
      | Use Cases | Create asset, render layout, property editing |
      | Services | Layout coordinator, error handler, property cache |
      | Adapters | Vault, UI, file system adapters |
    And removed services should not be registered:
      | Removed Service | Reason |
      | Button-related services | Button functionality removed |
      | Query-related services | Query functionality removed |
      | Removed renderer services | Renderer consolidation |
    And all registered services should have valid implementations
    And circular dependencies should not exist

  Scenario: Cross-layer communication follows clean architecture rules
    Given the refactored codebase is analyzed
    When I examine inter-layer dependencies
    Then presentation components should only call application use cases
    And application use cases should only depend on domain abstractions
    And infrastructure implementations should only implement domain interfaces
    And no layer should skip levels in the dependency hierarchy
    And no circular dependencies should exist between layers
    And communication should flow through proper abstraction boundaries

  Scenario: Entity and value object integrity is maintained
    Given domain entities are examined
    When I check entity implementations
    Then the Asset entity should maintain its core responsibilities:
      | Responsibility | Implementation |
      | Identity management | AssetId value object |
      | Property management | PropertyValue handling |
      | Validation | Business rule enforcement |
      | State changes | Event publishing |
    And ClassLayout entity should handle layout configuration properly
    And Ontology entity should manage ontology metadata correctly
    And all entities should encapsulate business logic appropriately
    And no entity should have infrastructure dependencies

  Scenario: Domain services maintain business logic encapsulation
    Given domain services are examined
    When I check service implementations
    Then the following services should maintain their responsibilities:
      | Service | Responsibility |
      | AssetValidationService | Business rule validation |
      | LayoutCompositionService | Layout assembly logic |
      | SemanticPropertyDiscoveryService | Property discovery logic |
      | PropertyCacheService | Property caching optimization |
      | OntologyProvisioningService | Ontology setup logic |
    And services should not contain infrastructure code
    And services should operate on domain entities and value objects
    And services should be testable in isolation

  Scenario: Error handling follows domain-driven patterns
    Given error handling is examined
    When I check error management
    Then the Result pattern should be used consistently for:
      | Operation | Error Handling |
      | Asset creation | Success/failure with detailed messages |
      | Layout rendering | Graceful degradation on errors |
      | Property discovery | Fallback mechanisms |
      | Repository operations | Clear error propagation |
    And ExocortexError should provide domain-specific error information
    And ErrorAnalyzer should help with error categorization
    And errors should not expose infrastructure details to upper layers

  Scenario: Ports and adapters pattern is properly implemented
    Given the ports and adapters architecture is examined
    When I check interface definitions and implementations
    Then domain ports should define clear contracts:
      | Port | Purpose |
      | IAssetMetadataProvider | Asset metadata abstraction |
      | ILayoutCoordinator | Layout coordination interface |
      | IUIRenderer | UI rendering abstraction |
      | IDOMRenderer | DOM manipulation interface |
    And infrastructure adapters should implement these ports
    And no business logic should leak into adapters
    And adapters should handle external system complexity internally

  Scenario: Clean architecture benefits are preserved
    Given the refactored architecture is complete
    When I assess architectural qualities
    Then the system should maintain:
      | Quality | Evidence |
      | Testability | Domain logic testable without infrastructure |
      | Maintainability | Clear separation of concerns |
      | Flexibility | Easy to change infrastructure implementations |
      | Scalability | New features can be added following patterns |
      | Independence | Business logic not tied to frameworks |
    And technical debt should be reduced compared to pre-refactoring state
    And code complexity should be manageable in each layer