# Functionality Removal
# BDD Specifications for ensuring proper removal of non-essential components

Feature: Functionality Removal
  As a system maintainer
  I want non-essential functionality to be completely removed
  So that the codebase is simplified and maintainable

  Background:
    Given the Exocortex plugin refactoring is complete
    And only UniversalLayout, DynamicLayout, and CreateAssetModal are preserved
    And the following components should be completely removed:
      | Component Type | Components to Remove |
      | Button Commands | ExecuteButtonCommandUseCase, RenderClassButtonsUseCase |
      | Query Blocks | ExecuteQueryBlockUseCase, QueryBlockRenderer |
      | Block Renderers | BacklinksBlockRenderer, ButtonsBlockRenderer, ChildrenEffortsBlockRenderer |
      | Block Renderers | InstancesBlockRenderer, NarrowerBlockRenderer, PropertiesBlockRenderer |
      | Block Renderers | RelationPropertiesBlockRenderer, SimplifiedRelationPropertiesRenderer |
      | Specialized Renderers | AssetListRenderer, ButtonsViewRenderer, CustomBlockRenderer |
      | Legacy Renderers | LayoutRenderer, RefactoredLayoutRenderer, RefactoredUniversalLayoutRenderer |
      | Strategy Components | StrategyBasedLayoutRenderer, CustomLayoutRenderingStrategy, DefaultLayoutRenderingStrategy |
      | Button Services | ButtonRenderer, IButtonRepository, ObsidianButtonRepository |
      | Command Services | ICommandExecutor, ObsidianCommandExecutor |

  Scenario: Button command functionality is completely removed
    Given the refactored plugin is loaded
    When I search for button command related code
    Then ExecuteButtonCommandUseCase should not exist in the codebase
    And RenderClassButtonsUseCase should not exist in the codebase
    And ButtonCommand entity should not exist in the codebase
    And UIButton entity should not exist in the codebase
    And IButtonRepository interface should not exist in the codebase
    And ObsidianButtonRepository implementation should not exist in the codebase
    And ButtonRenderer component should not exist in the codebase
    And no button-related use cases should be registered in DIContainer

  Scenario: Query block functionality is completely removed
    Given the refactored plugin is loaded
    When I search for query block related code
    Then ExecuteQueryBlockUseCase should not exist in the codebase
    And QueryBlockRenderer should not exist in the codebase
    And QueryCache service should not exist in the codebase
    And QueryEngineService should not exist in the codebase
    And IQueryEngine port should not exist in the codebase
    And no query-related processors should be registered
    And no query block types should be recognized by the code block processor

  Scenario: Specialized block renderers are completely removed
    Given the refactored plugin is loaded
    When I examine the presentation/renderers directory
    Then the following files should not exist:
      | File | Reason for Removal |
      | BacklinksBlockRenderer.ts | Superseded by UniversalLayout |
      | ButtonsBlockRenderer.ts | Button functionality removed |
      | ChildrenEffortsBlockRenderer.ts | Specialized feature removed |
      | InstancesBlockRenderer.ts | Functionality consolidated |
      | NarrowerBlockRenderer.ts | Specialized feature removed |
      | PropertiesBlockRenderer.ts | Functionality consolidated |
      | RelationPropertiesBlockRenderer.ts | Functionality consolidated |
      | SimplifiedRelationPropertiesRenderer.ts | Deprecated renderer |
    And no references to these renderers should exist in the codebase
    And the BlockRendererFactory should not instantiate these renderers

  Scenario: Legacy and redundant renderers are removed
    Given the refactored plugin is loaded
    When I examine renderer implementations
    Then the following legacy renderers should not exist:
      | Renderer | Replacement |
      | LayoutRenderer | DynamicLayoutRenderer |
      | RefactoredLayoutRenderer | DynamicLayoutRenderer |
      | RefactoredUniversalLayoutRenderer | UniversalLayoutRenderer |
      | AssetListRenderer | UniversalLayoutRenderer |
      | ButtonsViewRenderer | Removed (no replacement) |
      | CustomBlockRenderer | Removed (no replacement) |
    And the StrategyBasedLayoutRenderer should not exist
    And ILayoutRenderingStrategy interface should not exist
    And CustomLayoutRenderingStrategy should not exist
    And DefaultLayoutRenderingStrategy should not exist

  Scenario: Command execution infrastructure is removed
    Given button functionality has been removed
    When I examine the command infrastructure
    Then ICommandExecutor interface should not exist
    And ObsidianCommandExecutor implementation should not exist
    And ICommandController port should not exist
    And CommandRegistry should not exist
    And AssetCommandController should not exist
    And OntologizeAssetCommand should not exist
    And no command-related services should be registered in DIContainer

  Scenario: Unnecessary services and utilities are cleaned up
    Given specialized functionality has been removed
    When I examine the services and utilities
    Then BlockRenderingService should not exist (if only used for removed components)
    And DynamicBacklinksService should not exist (if superseded by UniversalLayout)
    And RelationOntologizer should not exist (if unused by preserved components)
    And any utility functions only used by removed components should not exist
    And the codebase should have no dead code or unused imports

  Scenario: Entity and value object cleanup
    Given button and query functionality is removed
    When I examine the domain entities and value objects
    Then ButtonCommand entity should not exist
    And UIButton entity should not exist
    And any value objects specific to removed functionality should not exist
    And ExoFocus entity should not exist (if unused by preserved components)
    And Task entity should not exist (if unused by preserved components)
    And no orphaned domain objects should remain

  Scenario: Repository interface cleanup
    Given removed entities no longer need persistence
    When I examine repository interfaces
    Then IButtonRepository should not exist
    And ITaskRepository should not exist (if Task entity is removed)
    And any repository interfaces for removed entities should not exist
    And corresponding infrastructure implementations should not exist
    And DIContainer should not register removed repositories

  Scenario: Use case cleanup verification
    Given functionality has been properly removed
    When I examine the application layer use cases
    Then only the following use cases should exist:
      | Use Case | Purpose |
      | CreateAssetUseCase | Asset creation via modal |
      | RenderLayoutUseCase | Layout rendering coordination |
      | GetLayoutForClassUseCase | Class layout discovery |
      | PropertyEditingUseCase | Property manipulation |
      | GetClassHierarchyUseCase | Class hierarchy queries |
      | FindAllOntologiesUseCase | Ontology discovery |
    And ExecuteButtonCommandUseCase should not exist
    And ExecuteQueryBlockUseCase should not exist
    And RenderClassButtonsUseCase should not exist
    And any other use cases only serving removed functionality should not exist

  Scenario: Event and specification cleanup
    Given removed entities no longer generate events
    When I examine domain events and specifications
    Then events related to ButtonCommand should not exist
    And events related to query execution should not exist
    And specifications for removed entities should not exist
    And the DomainEventBus should not handle removed event types
    And no orphaned event handlers should remain

  Scenario: Modal and component cleanup
    Given only CreateAssetModal is preserved
    When I examine presentation components
    Then the following modals should not exist:
      | Modal | Reason for Removal |
      | ClassTreeModal | Functionality consolidated or unused |
      | EffortSearchModal | Specialized feature removed |
      | EnhancedCreateAssetModal | Consolidated into CreateAssetModal |
    And PropertyRenderer should not exist (if only used by removed components)
    And ErrorMessageComponent should not exist (if unused by preserved components)

  Scenario: Configuration and settings cleanup
    Given removed functionality no longer needs configuration
    When I examine plugin settings and configuration
    Then no settings for button commands should exist
    And no settings for query blocks should exist
    And no settings for removed block renderers should exist
    And the ExocortexSettingTab should only contain settings for preserved functionality
    And QueryEngineConfig should not exist
    And any configuration objects for removed functionality should not exist

  Scenario: Test cleanup verification
    Given removed functionality is no longer tested
    When I examine the test suite
    Then tests for removed components should not exist or should be properly disabled
    And test mocks for removed services should not exist
    And integration tests should only cover preserved functionality
    And no broken test references to removed components should remain
    And test coverage should focus on UniversalLayout, DynamicLayout, and CreateAssetModal

  Scenario: Documentation and type cleanup
    Given the API surface has been simplified
    When I examine type definitions and documentation
    Then types for removed components should not exist in domain.ts, rendering.ts, etc.
    And guards for removed entities should not exist in guards.ts
    And any documentation references to removed functionality should be updated or removed
    And the public API should only expose preserved functionality