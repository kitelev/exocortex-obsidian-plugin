import "reflect-metadata";
import { IncrementalUpdateHandler } from "../../src/presentation/renderers/helpers/IncrementalUpdateHandler";
import { LayoutSection } from "../../src/application/services/PropertyDependencyResolver";

describe("IncrementalUpdateHandler", () => {
  let mockDeps: any;
  let handler: IncrementalUpdateHandler;
  let mockRootContainer: HTMLElement;
  let mockFile: any;

  beforeEach(() => {
    mockFile = {
      path: "test.md",
      basename: "test",
    };

    mockRootContainer = document.createElement("div");

    mockDeps = {
      propertiesRenderer: {
        render: jest.fn().mockResolvedValue(undefined),
      },
      buttonGroupsBuilder: {
        build: jest.fn().mockResolvedValue([]),
      },
      dailyTasksRenderer: {
        render: jest.fn().mockResolvedValue(undefined),
      },
      dailyProjectsRenderer: {
        render: jest.fn().mockResolvedValue(undefined),
      },
      areaTreeRenderer: {
        render: jest.fn().mockResolvedValue(undefined),
      },
      relationsRenderer: {
        render: jest.fn().mockResolvedValue(undefined),
        getAssetRelations: jest.fn().mockResolvedValue([]),
      },
      reactRenderer: {
        render: jest.fn(),
      },
      backlinksCacheManager: {
        getBacklinks: jest.fn().mockReturnValue(new Map()),
      },
      sectionStateManager: {
        isCollapsed: jest.fn().mockReturnValue(false),
        renderHeader: jest.fn(),
      },
      eventListenerManager: {},
    };

    handler = new IncrementalUpdateHandler(mockDeps);
  });

  describe("updateSections", () => {
    it("should handle empty sections array", async () => {
      await expect(
        handler.updateSections(mockRootContainer, mockFile, [], {})
      ).resolves.toBeUndefined();
    });

    it("should skip sections without matching containers", async () => {
      // No containers exist in the mock root
      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.PROPERTIES],
        {}
      );

      // Should not call render because no container was found
      expect(mockDeps.propertiesRenderer.render).not.toHaveBeenCalled();
    });

    it("should update properties section when container exists", async () => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-properties-section";
      sectionContainer.empty = jest.fn();
      mockRootContainer.appendChild(sectionContainer);

      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.PROPERTIES],
        {}
      );

      expect(sectionContainer.empty).toHaveBeenCalled();
      expect(mockDeps.propertiesRenderer.render).toHaveBeenCalled();
    });

    it("should update buttons section and create new container", async () => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-buttons-section";
      sectionContainer.remove = jest.fn();
      mockRootContainer.appendChild(sectionContainer);

      // Mock that build returns button groups
      mockDeps.buttonGroupsBuilder.build.mockResolvedValue([{ buttons: [] }]);

      // Mock createDiv on rootContainer
      mockRootContainer.createDiv = jest.fn().mockReturnValue(document.createElement("div"));

      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.BUTTONS],
        {}
      );

      expect(sectionContainer.remove).toHaveBeenCalled();
      expect(mockDeps.buttonGroupsBuilder.build).toHaveBeenCalledWith(mockFile);
    });

    it("should not create buttons container when no button groups", async () => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-buttons-section";
      sectionContainer.remove = jest.fn();
      mockRootContainer.appendChild(sectionContainer);

      // Mock that build returns empty array
      mockDeps.buttonGroupsBuilder.build.mockResolvedValue([]);

      // Mock createDiv on rootContainer
      mockRootContainer.createDiv = jest.fn().mockReturnValue(document.createElement("div"));

      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.BUTTONS],
        {}
      );

      expect(sectionContainer.remove).toHaveBeenCalled();
      // createDiv should not be called when no button groups
      expect(mockRootContainer.createDiv).not.toHaveBeenCalled();
    });

    it("should update daily tasks section", async () => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-daily-tasks-section";
      sectionContainer.empty = jest.fn();
      mockRootContainer.appendChild(sectionContainer);

      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.DAILY_TASKS],
        {}
      );

      expect(sectionContainer.empty).toHaveBeenCalled();
      expect(mockDeps.dailyTasksRenderer.render).toHaveBeenCalled();
    });

    it("should update daily projects section", async () => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-daily-projects-section";
      sectionContainer.empty = jest.fn();
      mockRootContainer.appendChild(sectionContainer);

      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.DAILY_PROJECTS],
        {}
      );

      expect(sectionContainer.empty).toHaveBeenCalled();
      expect(mockDeps.dailyProjectsRenderer.render).toHaveBeenCalled();
    });

    it("should update area tree section", async () => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-area-tree-section";
      sectionContainer.empty = jest.fn();
      mockRootContainer.appendChild(sectionContainer);

      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.AREA_TREE],
        {}
      );

      expect(sectionContainer.empty).toHaveBeenCalled();
      expect(mockDeps.areaTreeRenderer.render).toHaveBeenCalled();
    });

    it("should update relations section", async () => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-assets-relations";
      sectionContainer.empty = jest.fn();
      mockRootContainer.appendChild(sectionContainer);

      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.RELATIONS],
        {}
      );

      expect(sectionContainer.empty).toHaveBeenCalled();
      expect(mockDeps.relationsRenderer.render).toHaveBeenCalled();
    });

    it("should update multiple sections in sequence", async () => {
      // Create all section containers
      const propsContainer = document.createElement("div");
      propsContainer.className = "exocortex-properties-section";
      propsContainer.empty = jest.fn();
      mockRootContainer.appendChild(propsContainer);

      const tasksContainer = document.createElement("div");
      tasksContainer.className = "exocortex-daily-tasks-section";
      tasksContainer.empty = jest.fn();
      mockRootContainer.appendChild(tasksContainer);

      await handler.updateSections(
        mockRootContainer,
        mockFile,
        [LayoutSection.PROPERTIES, LayoutSection.DAILY_TASKS],
        {}
      );

      expect(propsContainer.empty).toHaveBeenCalled();
      expect(tasksContainer.empty).toHaveBeenCalled();
      expect(mockDeps.propertiesRenderer.render).toHaveBeenCalled();
      expect(mockDeps.dailyTasksRenderer.render).toHaveBeenCalled();
    });
  });
});
