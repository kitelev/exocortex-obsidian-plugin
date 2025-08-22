import { Asset } from "../../domain/entities/Asset";
import { AssetId } from "../../domain/value-objects/AssetId";
import { ClassName } from "../../domain/value-objects/ClassName";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { ExoFocusService } from "../services/ExoFocusService";
import { IndexedGraph } from "../../domain/semantic/core/IndexedGraph";
import { IRI } from "../../domain/semantic/core/Triple";
import {
  GetCurrentProjectRequest,
  GetCurrentProjectResponse,
} from "../dtos/CreateTaskRequest";

/**
 * Use case for getting current project context
 * Implements intelligent project detection based on user context
 * Following TOGAF principles for business capability
 */
export class GetCurrentProjectUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly focusService: ExoFocusService,
    private readonly graph: IndexedGraph,
  ) {}

  async execute(
    request: GetCurrentProjectRequest,
  ): Promise<GetCurrentProjectResponse> {
    try {
      // Get all available projects
      const availableProjects = await this.getAvailableProjects(
        request.preferences?.includeCompleted ?? false,
        request.preferences?.maxResults ?? 10,
      );

      // Detect current project based on context
      const currentProject = await this.detectCurrentProject(
        request,
        availableProjects,
      );

      // Determine detection strategy and confidence
      const context = this.buildContextInfo(request, currentProject);

      return {
        success: true,
        currentProject,
        availableProjects,
        context,
      };
    } catch (error) {
      return {
        success: false,
        availableProjects: [],
        context: {
          strategy: "error",
          confidence: 0,
          reasoning: `Failed to get project context: ${error.message}`,
        },
        message: error.message,
      };
    }
  }

  /**
   * Get all available projects from the system
   */
  private async getAvailableProjects(
    includeCompleted: boolean,
    maxResults: number,
  ): Promise<GetCurrentProjectResponse["availableProjects"]> {
    try {
      // Find assets with Project class
      const projectClassName = ClassName.create("ems__Project");
      if (projectClassName.isFailure) {
        return [];
      }

      const projectAssets = await this.assetRepository.findByClass(
        projectClassName.getValue(),
      );

      // Convert to response format and filter
      const projects = projectAssets
        .filter((asset) => {
          if (!includeCompleted) {
            const status = asset.getPropertyValue("status");
            return status !== "completed" && status !== "cancelled";
          }
          return true;
        })
        .map((asset) => ({
          id: asset.getId().toString(),
          title: asset.getTitle(),
          status: asset.getPropertyValue("status") || "active",
          priority: asset.getPropertyValue("priority") || "medium",
          description: asset.getPropertyValue("description"),
          isActive: asset.getPropertyValue("status") === "active",
          lastUpdated:
            asset.getPropertyValue("updatedAt") || new Date().toISOString(),
        }))
        .sort((a, b) => {
          // Sort by active status first, then by last updated
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
        })
        .slice(0, maxResults);

      return projects;
    } catch (error) {
      console.warn("Failed to get available projects:", error);
      return [];
    }
  }

  /**
   * Detect current project based on context clues
   */
  private async detectCurrentProject(
    request: GetCurrentProjectRequest,
    availableProjects: GetCurrentProjectResponse["availableProjects"],
  ): Promise<GetCurrentProjectResponse["currentProject"] | undefined> {
    const strategy = request.preferences?.selectionStrategy || "context";

    switch (strategy) {
      case "context":
        return this.detectByContext(request, availableProjects);
      case "recent":
        return this.detectByRecentActivity(availableProjects);
      case "active":
        return this.detectByActiveStatus(availableProjects);
      case "priority":
        return this.detectByPriority(availableProjects);
      default:
        return this.detectByContext(request, availableProjects);
    }
  }

  /**
   * Detect project by analyzing current file context
   */
  private async detectByContext(
    request: GetCurrentProjectRequest,
    availableProjects: GetCurrentProjectResponse["availableProjects"],
  ): Promise<GetCurrentProjectResponse["currentProject"] | undefined> {
    if (!request.activeFile) {
      return this.detectByRecentActivity(availableProjects);
    }

    try {
      // Check if current file is a project file
      const currentAsset = await this.assetRepository.findByFilename(
        request.activeFile,
      );
      if (currentAsset) {
        const className = currentAsset.getClassName().toString();
        if (className === "ems__Project") {
          return this.assetToProjectResponse(currentAsset);
        }

        // Check if current asset has project relationship
        const projectId =
          currentAsset.getProperty("projectId") ||
          currentAsset.getProperty("exo__Effort_parent");
        if (projectId) {
          const cleanProjectId = projectId.toString().replace(/\[\[|\]\]/g, "");
          const project = availableProjects.find(
            (p) => p.id === cleanProjectId,
          );
          if (project) {
            return project;
          }
        }
      }

      // Use RDF graph to find project relationships
      const projectFromGraph = await this.findProjectFromGraph(
        request.activeFile,
        availableProjects,
      );
      if (projectFromGraph) {
        return projectFromGraph;
      }

      // Fallback to recent activity
      return this.detectByRecentActivity(availableProjects);
    } catch (error) {
      console.warn("Context-based project detection failed:", error);
      return this.detectByRecentActivity(availableProjects);
    }
  }

  /**
   * Detect project using RDF graph relationships
   */
  private async findProjectFromGraph(
    activeFile: string,
    availableProjects: GetCurrentProjectResponse["availableProjects"],
  ): Promise<GetCurrentProjectResponse["currentProject"] | undefined> {
    try {
      // Clean file path for IRI
      const fileIRI = activeFile.replace(/\.md$/, "").replace(/\s+/g, "_");

      // Query for project relationships
      const projectTriples = this.graph.query(fileIRI, "exo__Effort_parent");

      if (projectTriples.length > 0) {
        const projectIRI = projectTriples[0].getObject().toString();
        const project = availableProjects.find(
          (p) =>
            p.id === projectIRI || p.title.replace(/\s+/g, "_") === projectIRI,
        );
        if (project) {
          return project;
        }
      }

      // Check reverse relationships (project -> task)
      const taskTriples = this.graph.query(
        undefined,
        "exo__Effort_parent",
        fileIRI,
      );

      for (const triple of taskTriples) {
        const potentialProject = triple.getSubject().toString();
        const project = availableProjects.find(
          (p) =>
            p.id === potentialProject ||
            p.title.replace(/\s+/g, "_") === potentialProject,
        );
        if (project) {
          return project;
        }
      }

      return undefined;
    } catch (error) {
      console.warn("Graph-based project detection failed:", error);
      return undefined;
    }
  }

  /**
   * Detect project by recent activity
   */
  private detectByRecentActivity(
    availableProjects: GetCurrentProjectResponse["availableProjects"],
  ): GetCurrentProjectResponse["currentProject"] | undefined {
    const recentProjects = availableProjects
      .filter((p) => p.isActive)
      .sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      );

    return recentProjects[0];
  }

  /**
   * Detect project by active status
   */
  private detectByActiveStatus(
    availableProjects: GetCurrentProjectResponse["availableProjects"],
  ): GetCurrentProjectResponse["currentProject"] | undefined {
    return availableProjects.find((p) => p.isActive);
  }

  /**
   * Detect project by priority
   */
  private detectByPriority(
    availableProjects: GetCurrentProjectResponse["availableProjects"],
  ): GetCurrentProjectResponse["currentProject"] | undefined {
    const priorityOrder: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return availableProjects
      .filter((p) => p.isActive)
      .sort(
        (a, b) =>
          (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2),
      )[0];
  }

  /**
   * Build context information for response
   */
  private buildContextInfo(
    request: GetCurrentProjectRequest,
    currentProject?: GetCurrentProjectResponse["currentProject"],
  ): GetCurrentProjectResponse["context"] {
    const strategy = request.preferences?.selectionStrategy || "context";

    let confidence = 0;
    let reasoning = "";

    if (currentProject) {
      switch (strategy) {
        case "context":
          confidence = request.activeFile ? 0.8 : 0.3;
          reasoning = request.activeFile
            ? `Detected from current file context: ${request.activeFile}`
            : "Used most recent active project";
          break;
        case "recent":
          confidence = 0.6;
          reasoning = "Selected most recently updated active project";
          break;
        case "active":
          confidence = 0.5;
          reasoning = "Selected first active project";
          break;
        case "priority":
          confidence = 0.7;
          reasoning = "Selected highest priority active project";
          break;
      }
    } else {
      reasoning = "No suitable project found";
    }

    return {
      strategy,
      confidence,
      reasoning,
    };
  }

  /**
   * Convert Asset to project response format
   */
  private assetToProjectResponse(
    asset: Asset,
  ): GetCurrentProjectResponse["currentProject"] {
    return {
      id: asset.getId().toString(),
      title: asset.getTitle(),
      status: asset.getPropertyValue("status") || "active",
      priority: asset.getPropertyValue("priority") || "medium",
      description: asset.getPropertyValue("description"),
    };
  }
}
