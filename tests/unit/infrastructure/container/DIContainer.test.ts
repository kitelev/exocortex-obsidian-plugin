import { App } from "obsidian";
import { DIContainer } from "../../../../src/infrastructure/container/DIContainer";
import { Container } from "../../../../src/application/core/Container";
import { IAssetRepository } from "../../../../src/domain/repositories/IAssetRepository";
import { IOntologyRepository } from "../../../../src/domain/repositories/IOntologyRepository";
import { IClassLayoutRepository } from "../../../../src/domain/repositories/IClassLayoutRepository";
import { ErrorHandlerService } from "../../../../src/application/services/ErrorHandlerService";
import { CreateAssetUseCase } from "../../../../src/application/use-cases/CreateAssetUseCase";
import { PropertyEditingUseCase } from "../../../../src/application/use-cases/PropertyEditingUseCase";
import { ButtonRenderer } from "../../../../src/presentation/components/ButtonRenderer";
import { LayoutRenderer } from "../../../../src/presentation/renderers/LayoutRenderer";

// Mock all dependencies
jest.mock(
  "../../../../src/infrastructure/repositories/ObsidianAssetRepository",
);
jest.mock(
  "../../../../src/infrastructure/repositories/ObsidianOntologyRepository",
);
jest.mock(
  "../../../../src/infrastructure/repositories/ObsidianClassLayoutRepository",
);
jest.mock(
  "../../../../src/infrastructure/repositories/ObsidianClassViewRepository",
);
jest.mock(
  "../../../../src/infrastructure/repositories/ObsidianButtonRepository",
);
jest.mock(
  "../../../../src/infrastructure/repositories/ObsidianQueryTemplateRepository",
);
jest.mock(
  "../../../../src/infrastructure/repositories/GraphSuggestionRepository",
);
jest.mock("../../../../src/infrastructure/services/ObsidianCommandExecutor");
jest.mock("../../../../src/application/services/ErrorHandlerService");
jest.mock("../../../../src/application/services/SPARQLAutocompleteService");
jest.mock("../../../../src/application/use-cases/CreateAssetUseCase");
jest.mock("../../../../src/application/use-cases/RenderClassButtonsUseCase");
jest.mock("../../../../src/application/use-cases/ExecuteButtonCommandUseCase");
jest.mock("../../../../src/application/use-cases/PropertyEditingUseCase");
jest.mock("../../../../src/application/use-cases/QueryTemplateUseCase");
jest.mock("../../../../src/presentation/components/ButtonRenderer");
jest.mock("../../../../src/presentation/components/PropertyRenderer");
jest.mock("../../../../src/presentation/renderers/LayoutRenderer");

describe("DIContainer", () => {
  let app: App;
  let mockPlugin: any;
  let container: DIContainer;

  beforeEach(() => {
    // Reset static instances
    DIContainer.reset();
    Container.reset();

    // Setup mock app
    app = new App();

    // Setup mock plugin with settings
    mockPlugin = {
      settings: {
        layoutsFolderPath: "test-layouts",
        templatesPath: ".test-exocortex/templates",
        templateUsageDataPath: ".test-exocortex/template-usage.json",
      },
      graph: {
        getTriples: jest.fn().mockReturnValue([]),
        findBySubject: jest.fn().mockReturnValue([]),
      },
    };
  });

  afterEach(() => {
    // Clean up after each test
    if (container) {
      container.dispose();
    }
    DIContainer.reset();
    Container.reset();
  });

  describe("Initialization and Singleton Pattern", () => {
    it("should create a singleton instance", () => {
      const container1 = DIContainer.initialize(app);
      const container2 = DIContainer.initialize(app);

      expect(container1).toBe(container2);
      expect(container1).toBeInstanceOf(DIContainer);
    });

    it("should throw error when accessing instance without initialization", () => {
      expect(() => {
        DIContainer.getInstance();
      }).toThrow("DIContainer not initialized. Call initialize(app) first.");
    });

    it("should initialize with app and plugin", () => {
      container = DIContainer.initialize(app, mockPlugin);

      expect(container).toBeInstanceOf(DIContainer);
      expect(() => DIContainer.getInstance()).not.toThrow();
    });

    it("should update app reference on re-initialization", () => {
      const container1 = DIContainer.initialize(app);
      const newApp = new App();
      const container2 = DIContainer.initialize(newApp);

      expect(container1).toBe(container2);
      // Verify that the app reference was updated
      expect(container1.resolve<App>("App")).toBe(newApp);
    });

    it("should update plugin reference on re-initialization", () => {
      container = DIContainer.initialize(app, mockPlugin);
      const newPlugin = {
        ...mockPlugin,
        settings: {
          ...mockPlugin.settings,
          layoutsFolderPath: "new-layouts",
        },
      };

      const updatedContainer = DIContainer.initialize(app, newPlugin);
      expect(container).toBe(updatedContainer);
    });

    it("should reset singleton instance", () => {
      const container1 = DIContainer.initialize(app);
      DIContainer.reset();
      const container2 = DIContainer.initialize(app);

      expect(container1).not.toBe(container2);
    });
  });

  describe("Core Service Registration", () => {
    beforeEach(() => {
      container = DIContainer.initialize(app, mockPlugin);
    });

    it("should register Obsidian App", () => {
      const resolvedApp = container.resolve<App>("App");
      expect(resolvedApp).toBe(app);
    });

    it("should register all repository interfaces", () => {
      expect(() =>
        container.resolve<IAssetRepository>("IAssetRepository"),
      ).not.toThrow();
      expect(() =>
        container.resolve<IOntologyRepository>("IOntologyRepository"),
      ).not.toThrow();
      expect(() =>
        container.resolve<IClassLayoutRepository>("IClassLayoutRepository"),
      ).not.toThrow();
    });

    it("should register services with proper dependencies", () => {
      expect(() =>
        container.resolve<ErrorHandlerService>("ErrorHandlerService"),
      ).not.toThrow();
    });

    it("should register use cases with dependencies", () => {
      expect(() =>
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase"),
      ).not.toThrow();
    });

    it("should register presentation components", () => {
      expect(() =>
        container.resolve<ButtonRenderer>("ButtonRenderer"),
      ).not.toThrow();
      expect(() =>
        container.resolve<LayoutRenderer>("LayoutRenderer"),
      ).not.toThrow();
    });
  });

  describe("Dependency Injection Chain", () => {
    beforeEach(() => {
      container = DIContainer.initialize(app, mockPlugin);
    });

    it("should resolve dependencies recursively", () => {
      const createAssetUseCase =
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
      expect(createAssetUseCase).toBeDefined();
    });

    it("should inject app into repositories", () => {
      const repository =
        container.resolve<IAssetRepository>("IAssetRepository");
      expect(repository).toBeDefined();
    });

    it("should handle circular dependency prevention", () => {
      // Test that the container can handle complex dependency graphs without errors
      expect(() => {
        container.resolve<ButtonRenderer>("ButtonRenderer");
        container.resolve<LayoutRenderer>("LayoutRenderer");
        container.resolve<PropertyEditingUseCase>("PropertyEditingUseCase");
      }).not.toThrow();
    });
  });

  describe("Service Factories and Caching", () => {
    beforeEach(() => {
      container = DIContainer.initialize(app, mockPlugin);
    });

    it("should create new instances from factories", () => {
      const service1 =
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
      const service2 =
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");

      // Factories should create new instances
      expect(service1).not.toBe(service2);
    });

    it("should handle factory errors gracefully", () => {
      expect(() => {
        container.resolve("NonExistentService");
      }).toThrow();
    });

    it("should provide error messages for missing services", () => {
      expect(() => {
        container.resolve("UnregisteredService");
      }).toThrow("Service not found: UnregisteredService");
    });
  });

  describe("Plugin Settings Integration", () => {
    it("should use plugin settings for repository configuration", () => {
      const pluginWithCustomSettings = {
        settings: {
          layoutsFolderPath: "custom-layouts",
          templatesPath: "custom-templates",
          templateUsageDataPath: "custom-usage.json",
        },
      };

      container = DIContainer.initialize(app, pluginWithCustomSettings);

      // The repositories should be created with custom settings
      expect(() =>
        container.resolve<IClassLayoutRepository>("IClassLayoutRepository"),
      ).not.toThrow();
    });

    it("should use default settings when plugin not provided", () => {
      container = DIContainer.initialize(app);

      // Should still work with default settings
      expect(() =>
        container.resolve<IClassLayoutRepository>("IClassLayoutRepository"),
      ).not.toThrow();
    });

    it("should handle missing plugin settings gracefully", () => {
      const pluginWithoutSettings = {};
      container = DIContainer.initialize(app, pluginWithoutSettings);

      expect(() =>
        container.resolve<IClassLayoutRepository>("IClassLayoutRepository"),
      ).not.toThrow();
    });

    it("should pass graph reference to suggestion repository", () => {
      container = DIContainer.initialize(app, mockPlugin);

      expect(() => container.resolve("ISuggestionRepository")).not.toThrow();
    });
  });

  describe("Container Management", () => {
    beforeEach(() => {
      container = DIContainer.initialize(app, mockPlugin);
    });

    it("should clear container on dispose", () => {
      container.dispose();

      // After dispose, services should be cleared from underlying container
      // but the DIContainer itself should still be accessible
      expect(DIContainer.getInstance()).toBe(container);
    });

    it("should re-register dependencies after container clear", () => {
      // Clear and re-initialize
      DIContainer.reset();
      container = DIContainer.initialize(app, mockPlugin);

      // Should be able to resolve services after re-initialization
      expect(() =>
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase"),
      ).not.toThrow();
    });

    it("should handle multiple dispose calls", () => {
      expect(() => {
        container.dispose();
        container.dispose();
      }).not.toThrow();
    });
  });

  describe("Service Resolution Methods", () => {
    beforeEach(() => {
      container = DIContainer.initialize(app, mockPlugin);
    });

    it("should provide convenience methods for common use cases", () => {
      expect(container.getCreateAssetUseCase()).toBeInstanceOf(
        CreateAssetUseCase,
      );
      expect(container.getRenderButtonsUseCase()).toBeDefined();
      expect(container.getExecuteButtonCommandUseCase()).toBeDefined();
    });

    it("should provide convenience methods for renderers", () => {
      expect(container.getButtonRenderer()).toBeInstanceOf(ButtonRenderer);
      expect(container.getLayoutRenderer()).toBeInstanceOf(LayoutRenderer);
      expect(container.getPropertyRenderer()).toBeDefined();
    });

    it("should provide convenience methods for specialized use cases", () => {
      expect(container.getPropertyEditingUseCase()).toBeInstanceOf(
        PropertyEditingUseCase,
      );
      expect(container.getQueryTemplateUseCase()).toBeDefined();
    });

    it("should provide repository access methods", () => {
      expect(container.getQueryTemplateRepository()).toBeDefined();
    });

    it("should maintain consistency between resolve and convenience methods", () => {
      const resolvedDirectly =
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
      const resolvedViaConvenience = container.getCreateAssetUseCase();

      // Both should be the same type but different instances (factory pattern)
      expect(resolvedDirectly).toBeInstanceOf(CreateAssetUseCase);
      expect(resolvedViaConvenience).toBeInstanceOf(CreateAssetUseCase);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle null app gracefully during initialization", () => {
      expect(() => {
        DIContainer.initialize(null as any);
      }).not.toThrow();
    });

    it("should handle undefined plugin gracefully", () => {
      container = DIContainer.initialize(app, undefined);
      expect(() =>
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase"),
      ).not.toThrow();
    });

    it("should handle plugin without settings", () => {
      const emptyPlugin = {};
      container = DIContainer.initialize(app, emptyPlugin);
      expect(() =>
        container.resolve<IClassLayoutRepository>("IClassLayoutRepository"),
      ).not.toThrow();
    });

    it("should handle plugin with partial settings", () => {
      const partialPlugin = {
        settings: {
          layoutsFolderPath: "custom-layouts",
          // Missing other settings
        },
      };
      container = DIContainer.initialize(app, partialPlugin);
      expect(() =>
        container.resolve<IClassLayoutRepository>("IClassLayoutRepository"),
      ).not.toThrow();
    });

    it("should handle missing graph in plugin", () => {
      const pluginWithoutGraph = {
        settings: mockPlugin.settings,
        // Missing graph property
      };
      container = DIContainer.initialize(app, pluginWithoutGraph);
      expect(() => container.resolve("ISuggestionRepository")).not.toThrow();
    });
  });

  describe("Backward Compatibility", () => {
    beforeEach(() => {
      container = DIContainer.initialize(app, mockPlugin);
    });

    it("should provide async initialize method for backward compatibility", async () => {
      await expect(container.initialize(app)).resolves.not.toThrow();
    });

    it("should handle async initialize without changing state", async () => {
      const serviceBefore =
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
      await container.initialize(app);
      const serviceAfter =
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");

      // Services should still be resolvable after async init
      expect(serviceBefore).toBeInstanceOf(CreateAssetUseCase);
      expect(serviceAfter).toBeInstanceOf(CreateAssetUseCase);
    });
  });

  describe("Service Override and Testing Support", () => {
    beforeEach(() => {
      container = DIContainer.initialize(app, mockPlugin);
    });

    it("should allow service re-registration through container clear and re-init", () => {
      // Get initial service
      const initialService =
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
      expect(initialService).toBeDefined();

      // Reset and re-initialize
      DIContainer.reset();
      container = DIContainer.initialize(app, mockPlugin);

      // Should get a new instance
      const newService =
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
      expect(newService).toBeDefined();
      expect(newService).not.toBe(initialService);
    });

    it("should support testing scenarios with mock dependencies", () => {
      // Verify that all mocked dependencies work correctly
      expect(() => {
        container.resolve<IAssetRepository>("IAssetRepository");
        container.resolve<IOntologyRepository>("IOntologyRepository");
        container.resolve<ErrorHandlerService>("ErrorHandlerService");
      }).not.toThrow();
    });
  });

  describe("Container Core Functionality Tests", () => {
    let baseContainer: Container;

    beforeEach(() => {
      DIContainer.reset();
      Container.reset();
      baseContainer = Container.getInstance();
    });

    describe("Service Registration", () => {
      it("should register factory functions correctly", () => {
        let callCount = 0;
        baseContainer.register("TestService", () => {
          callCount++;
          return { id: callCount };
        });

        const service1 = baseContainer.resolve("TestService");
        const service2 = baseContainer.resolve("TestService");

        expect(service1).toEqual({ id: 1 });
        expect(service2).toEqual({ id: 2 });
        expect(callCount).toBe(2);
      });

      it("should register singleton services correctly", () => {
        const singletonInstance = { value: "singleton" };
        baseContainer.registerSingleton("SingletonService", singletonInstance);

        const resolved1 = baseContainer.resolve("SingletonService");
        const resolved2 = baseContainer.resolve("SingletonService");

        expect(resolved1).toBe(singletonInstance);
        expect(resolved2).toBe(singletonInstance);
        expect(resolved1).toBe(resolved2);
      });

      it("should prioritize singletons over factories", () => {
        const factoryResult = { type: "factory" };
        const singletonResult = { type: "singleton" };

        baseContainer.register("Service", () => factoryResult);
        baseContainer.registerSingleton("Service", singletonResult);

        const resolved = baseContainer.resolve("Service");
        expect(resolved).toBe(singletonResult);
      });

      it("should allow factory override of existing registration", () => {
        baseContainer.register("Service", () => ({ version: 1 }));
        baseContainer.register("Service", () => ({ version: 2 }));

        const resolved = baseContainer.resolve("Service");
        expect(resolved).toEqual({ version: 2 });
      });

      it("should allow singleton override of existing registration", () => {
        const first = { version: 1 };
        const second = { version: 2 };

        baseContainer.registerSingleton("Service", first);
        baseContainer.registerSingleton("Service", second);

        const resolved = baseContainer.resolve("Service");
        expect(resolved).toBe(second);
      });
    });

    describe("Service Resolution", () => {
      it("should throw error for unregistered service", () => {
        expect(() => {
          baseContainer.resolve("UnregisteredService");
        }).toThrow("Service not found: UnregisteredService");
      });

      it("should handle factory returning null", () => {
        baseContainer.register("NullService", () => null);

        const resolved = baseContainer.resolve("NullService");
        expect(resolved).toBeNull();
      });

      it("should handle factory returning undefined", () => {
        baseContainer.register("UndefinedService", () => undefined);

        const resolved = baseContainer.resolve("UndefinedService");
        expect(resolved).toBeUndefined();
      });

      it("should handle factory throwing error", () => {
        baseContainer.register("ErrorService", () => {
          throw new Error("Factory error");
        });

        expect(() => {
          baseContainer.resolve("ErrorService");
        }).toThrow("Factory error");
      });

      it("should handle async factory functions", () => {
        baseContainer.register("AsyncService", () => {
          return Promise.resolve({ async: true });
        });

        const resolved = baseContainer.resolve("AsyncService");
        expect(resolved).toBeInstanceOf(Promise);
      });

      it("should resolve complex object hierarchies", () => {
        const complexObject = {
          nested: {
            deep: {
              value: "test",
              array: [1, 2, 3],
              func: () => "result",
            },
          },
          methods: {
            test: jest.fn().mockReturnValue("mocked"),
          },
        };

        baseContainer.registerSingleton("ComplexService", complexObject);

        const resolved = baseContainer.resolve("ComplexService");
        expect(resolved).toBe(complexObject);
        expect(resolved.nested.deep.value).toBe("test");
        expect(resolved.methods.test()).toBe("mocked");
      });
    });

    describe("Service Existence Check", () => {
      it("should return true for registered factories", () => {
        baseContainer.register("FactoryService", () => ({}));
        expect(baseContainer.has("FactoryService")).toBe(true);
      });

      it("should return true for registered singletons", () => {
        baseContainer.registerSingleton("SingletonService", {});
        expect(baseContainer.has("SingletonService")).toBe(true);
      });

      it("should return false for unregistered services", () => {
        expect(baseContainer.has("NonExistentService")).toBe(false);
      });

      it("should return true after registration", () => {
        expect(baseContainer.has("NewService")).toBe(false);
        baseContainer.register("NewService", () => ({}));
        expect(baseContainer.has("NewService")).toBe(true);
      });

      it("should return false after clear", () => {
        baseContainer.register("ClearTestService", () => ({}));
        expect(baseContainer.has("ClearTestService")).toBe(true);

        baseContainer.clear();
        expect(baseContainer.has("ClearTestService")).toBe(false);
      });
    });

    describe("Container Management", () => {
      it("should clear all factories and singletons", () => {
        baseContainer.register("Factory1", () => ({}));
        baseContainer.register("Factory2", () => ({}));
        baseContainer.registerSingleton("Singleton1", {});
        baseContainer.registerSingleton("Singleton2", {});

        expect(baseContainer.has("Factory1")).toBe(true);
        expect(baseContainer.has("Factory2")).toBe(true);
        expect(baseContainer.has("Singleton1")).toBe(true);
        expect(baseContainer.has("Singleton2")).toBe(true);

        baseContainer.clear();

        expect(baseContainer.has("Factory1")).toBe(false);
        expect(baseContainer.has("Factory2")).toBe(false);
        expect(baseContainer.has("Singleton1")).toBe(false);
        expect(baseContainer.has("Singleton2")).toBe(false);
      });

      it("should handle multiple clear calls", () => {
        baseContainer.register("TestService", () => ({}));

        expect(() => {
          baseContainer.clear();
          baseContainer.clear();
          baseContainer.clear();
        }).not.toThrow();

        expect(baseContainer.has("TestService")).toBe(false);
      });

      it("should allow re-registration after clear", () => {
        baseContainer.register("Service", () => ({ version: 1 }));
        baseContainer.clear();
        baseContainer.register("Service", () => ({ version: 2 }));

        const resolved = baseContainer.resolve("Service");
        expect(resolved).toEqual({ version: 2 });
      });
    });

    describe("Container Singleton Pattern", () => {
      it("should return same container instance", () => {
        const container1 = Container.getInstance();
        const container2 = Container.getInstance();

        expect(container1).toBe(container2);
      });

      it("should preserve state across getInstance calls", () => {
        const container1 = Container.getInstance();
        container1.register("PersistentService", () => ({
          state: "preserved",
        }));

        const container2 = Container.getInstance();
        const resolved = container2.resolve("PersistentService");

        expect(resolved).toEqual({ state: "preserved" });
      });

      it("should reset singleton instance", () => {
        const container1 = Container.getInstance();
        container1.register("TestService", () => ({ id: 1 }));

        Container.reset();

        const container2 = Container.getInstance();
        expect(container1).not.toBe(container2);
        expect(container2.has("TestService")).toBe(false);
      });

      it("should handle multiple reset calls", () => {
        Container.getInstance();

        expect(() => {
          Container.reset();
          Container.reset();
          Container.reset();
        }).not.toThrow();

        const newContainer = Container.getInstance();
        expect(newContainer).toBeDefined();
      });
    });
  });

  describe("DIContainer Edge Cases and Error Handling", () => {
    beforeEach(() => {
      DIContainer.reset();
      Container.reset();
    });

    describe("Null and Undefined Handling", () => {
      it("should handle null app gracefully in resolution", () => {
        container = DIContainer.initialize(null as any);

        // Should not throw during initialization
        expect(container).toBeDefined();

        // Should handle resolution of App service returning null
        const resolvedApp = container.resolve("App");
        expect(resolvedApp).toBeNull();
      });

      it("should handle undefined app gracefully", () => {
        container = DIContainer.initialize(undefined as any);

        expect(container).toBeDefined();
        const resolvedApp = container.resolve("App");
        expect(resolvedApp).toBeUndefined();
      });

      it("should handle null plugin in service resolution", () => {
        container = DIContainer.initialize(app, null);

        // Services depending on plugin should handle null
        expect(() => {
          container.resolve<IClassLayoutRepository>("IClassLayoutRepository");
        }).not.toThrow();
      });

      it("should handle deeply nested null properties", () => {
        const pluginWithNullNested = {
          settings: null,
          graph: null,
        };

        container = DIContainer.initialize(app, pluginWithNullNested);

        expect(() => {
          container.resolve("ISuggestionRepository");
          container.resolve<IClassLayoutRepository>("IClassLayoutRepository");
        }).not.toThrow();
      });
    });

    describe("Memory and Resource Management", () => {
      it("should not leak memory with repeated initialization", () => {
        // Simulate multiple plugin reloads
        for (let i = 0; i < 100; i++) {
          const testContainer = DIContainer.initialize(app, mockPlugin);
          testContainer.dispose();
          DIContainer.reset();
        }

        // Final initialization should work normally
        container = DIContainer.initialize(app, mockPlugin);
        expect(() => {
          container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
        }).not.toThrow();
      });

      it("should handle rapid initialization and disposal", () => {
        expect(() => {
          for (let i = 0; i < 10; i++) {
            const testContainer = DIContainer.initialize(app, mockPlugin);
            testContainer.resolve<ButtonRenderer>("ButtonRenderer");
            testContainer.dispose();
          }
        }).not.toThrow();
      });

      it("should clean up resources on dispose", () => {
        container = DIContainer.initialize(app, mockPlugin);

        // Resolve some services
        container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
        container.resolve<ButtonRenderer>("ButtonRenderer");

        expect(() => container.dispose()).not.toThrow();
      });
    });

    describe("Concurrent Access Patterns", () => {
      it("should handle concurrent service resolution", () => {
        container = DIContainer.initialize(app, mockPlugin);

        const promises = [];

        // Simulate concurrent resolution requests
        for (let i = 0; i < 10; i++) {
          promises.push(
            Promise.resolve().then(() => {
              return container.resolve<CreateAssetUseCase>(
                "CreateAssetUseCase",
              );
            }),
          );
        }

        return Promise.all(promises).then((services) => {
          services.forEach((service) => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(CreateAssetUseCase);
          });
        });
      });

      it("should handle mixed initialization and resolution", () => {
        // First initialization
        container = DIContainer.initialize(app, mockPlugin);
        const service1 =
          container.resolve<CreateAssetUseCase>("CreateAssetUseCase");

        // Re-initialization
        const container2 = DIContainer.initialize(app, mockPlugin);
        const service2 =
          container2.resolve<CreateAssetUseCase>("CreateAssetUseCase");

        expect(container).toBe(container2);
        expect(service1).toBeInstanceOf(CreateAssetUseCase);
        expect(service2).toBeInstanceOf(CreateAssetUseCase);
      });
    });

    describe("Service Factory Complexity", () => {
      it("should handle factories with complex dependencies", () => {
        container = DIContainer.initialize(app, mockPlugin);

        // Test service that depends on multiple other services
        const layoutRenderer =
          container.resolve<LayoutRenderer>("LayoutRenderer");
        expect(layoutRenderer).toBeDefined();
      });

      it("should handle factory returning function", () => {
        const baseContainer = Container.getInstance();
        baseContainer.register("FunctionService", () => {
          return () => "I am a function";
        });

        const resolved = baseContainer.resolve<() => string>("FunctionService");
        expect(typeof resolved).toBe("function");
        expect(resolved()).toBe("I am a function");
      });

      it("should handle factory returning class constructor", () => {
        class TestClass {
          constructor(public value: string) {}
        }

        const baseContainer = Container.getInstance();
        baseContainer.register("ClassService", () => TestClass);

        const ResolvedClass =
          baseContainer.resolve<typeof TestClass>("ClassService");
        const instance = new ResolvedClass("test");
        expect(instance.value).toBe("test");
      });
    });

    describe("Large Scale Service Registration", () => {
      it("should handle registration of many services", () => {
        const baseContainer = Container.getInstance();

        // Register 100 services
        for (let i = 0; i < 100; i++) {
          baseContainer.register(`Service${i}`, () => ({ id: i }));
        }

        // Verify all services can be resolved
        for (let i = 0; i < 100; i++) {
          const service = baseContainer.resolve(`Service${i}`);
          expect(service).toEqual({ id: i });
        }
      });

      it("should handle mixed service types at scale", () => {
        const baseContainer = Container.getInstance();

        // Register mixed factories and singletons
        for (let i = 0; i < 50; i++) {
          if (i % 2 === 0) {
            baseContainer.register(`Factory${i}`, () => ({
              type: "factory",
              id: i,
            }));
          } else {
            baseContainer.registerSingleton(`Singleton${i}`, {
              type: "singleton",
              id: i,
            });
          }
        }

        // Verify resolution works for all
        for (let i = 0; i < 50; i++) {
          if (i % 2 === 0) {
            const factory = baseContainer.resolve(`Factory${i}`);
            expect(factory).toEqual({ type: "factory", id: i });
          } else {
            const singleton = baseContainer.resolve(`Singleton${i}`);
            expect(singleton).toEqual({ type: "singleton", id: i });
          }
        }
      });
    });
  });

  describe("Performance and Optimization Tests", () => {
    beforeEach(() => {
      DIContainer.reset();
      Container.reset();
    });

    describe("Resolution Performance", () => {
      // Adaptive timeouts for different environments
      const isCI =
        process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
      const isMacOS = process.platform === "darwin";

      // macOS in CI is particularly slow, so we need different thresholds
      const getPerformanceThreshold = (baseTime: number): number => {
        if (isCI && isMacOS) {
          return baseTime * 5; // 5x for macOS in CI (very lenient)
        } else if (isCI) {
          return baseTime * 3; // 3x for other CI environments
        } else if (isMacOS) {
          return baseTime * 2; // 2x for local macOS
        }
        return baseTime; // Base time for local Linux/Windows
      };

      it("should resolve services efficiently", () => {
        container = DIContainer.initialize(app, mockPlugin);

        const start = performance.now();

        // Resolve services multiple times
        for (let i = 0; i < 1000; i++) {
          container.resolve<CreateAssetUseCase>("CreateAssetUseCase");
          container.resolve<ButtonRenderer>("ButtonRenderer");
          container.resolve<IAssetRepository>("IAssetRepository");
        }

        const end = performance.now();
        const duration = end - start;

        // Should complete within reasonable time (adjust threshold as needed)
        const threshold = getPerformanceThreshold(1000); // Base: 1 second
        expect(duration).toBeLessThan(threshold);
      });

      it("should handle repeated singleton access efficiently", () => {
        const baseContainer = Container.getInstance();
        const singletonObject = {
          value: "test",
          data: new Array(1000).fill("item"),
        };
        baseContainer.registerSingleton("LargeSingleton", singletonObject);

        const start = performance.now();

        // Access singleton many times
        for (let i = 0; i < 10000; i++) {
          const resolved = baseContainer.resolve("LargeSingleton");
          expect(resolved).toBe(singletonObject);
        }

        const end = performance.now();
        const duration = end - start;

        // Singleton access should be very fast
        const threshold = getPerformanceThreshold(500); // Base: 500ms for singleton access
        expect(duration).toBeLessThan(threshold);
      });
    });

    describe("Memory Usage", () => {
      it("should not accumulate factory instances", () => {
        const baseContainer = Container.getInstance();
        let createdInstances = 0;

        baseContainer.register("CountingService", () => {
          createdInstances++;
          return { id: createdInstances };
        });

        // Resolve many times
        for (let i = 0; i < 100; i++) {
          baseContainer.resolve("CountingService");
        }

        // Should create 100 instances (no caching)
        expect(createdInstances).toBe(100);
      });

      it("should properly clear all references on reset", () => {
        const baseContainer = Container.getInstance();
        const heavyObject = { data: new Array(10000).fill("heavy") };

        baseContainer.registerSingleton("HeavyService", heavyObject);
        baseContainer.register("FactoryService", () => ({ ref: heavyObject }));

        expect(baseContainer.has("HeavyService")).toBe(true);
        expect(baseContainer.has("FactoryService")).toBe(true);

        Container.reset();

        // New container should not have references
        const newContainer = Container.getInstance();
        expect(newContainer.has("HeavyService")).toBe(false);
        expect(newContainer.has("FactoryService")).toBe(false);
      });
    });
  });

  describe("Integration Scenarios", () => {
    beforeEach(() => {
      container = DIContainer.initialize(app, mockPlugin);
    });

    it("should support full application initialization flow", () => {
      // Simulate what happens during plugin initialization
      const buttonRenderer = container.getButtonRenderer();
      const layoutRenderer = container.getLayoutRenderer();
      const createAssetUseCase = container.getCreateAssetUseCase();

      expect(buttonRenderer).toBeDefined();
      expect(layoutRenderer).toBeDefined();
      expect(createAssetUseCase).toBeDefined();
    });

    it("should handle complex service interaction patterns", () => {
      // Test that services can be resolved in any order
      const renderer = container.getLayoutRenderer();
      const useCase = container.getPropertyEditingUseCase();
      const repository = container.resolve<IClassLayoutRepository>(
        "IClassLayoutRepository",
      );

      expect(renderer).toBeDefined();
      expect(useCase).toBeDefined();
      expect(repository).toBeDefined();
    });

    it("should support plugin lifecycle scenarios", () => {
      // Test re-initialization during plugin lifecycle
      const service1 = container.getCreateAssetUseCase();

      // Simulate plugin reload
      const newContainer = DIContainer.initialize(app, mockPlugin);
      const service2 = newContainer.getCreateAssetUseCase();

      expect(service1).toBeDefined();
      expect(service2).toBeDefined();
      expect(container).toBe(newContainer);
    });
  });
});
