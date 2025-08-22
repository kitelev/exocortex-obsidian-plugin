import { Task } from "../../domain/entities/Task";
import { Asset } from "../../domain/entities/Asset";
import { TaskId } from "../../domain/value-objects/TaskId";
import { AssetId } from "../../domain/value-objects/AssetId";
import { Priority } from "../../domain/value-objects/Priority";
import { TaskStatus } from "../../domain/value-objects/TaskStatus";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { IndexedGraph } from "../../domain/semantic/core/IndexedGraph";
import { Triple, IRI, Literal } from "../../domain/semantic/core/Triple";
import { GetCurrentProjectUseCase } from "./GetCurrentProjectUseCase";
import {
  CreateTaskRequest,
  CreateTaskResponse,
} from "../dtos/CreateTaskRequest";
import { Result } from "../../domain/core/Result";

/**
 * Use case for creating tasks from project context
 * Orchestrates task creation with intelligent project association
 * Following Clean Architecture and TOGAF principles
 */
export class CreateTaskFromProjectUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly assetRepository: IAssetRepository,
    private readonly graph: IndexedGraph,
    private readonly getCurrentProjectUseCase: GetCurrentProjectUseCase,
  ) {}

  async execute(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    try {
      // Validate request
      const validationResult = this.validateRequest(request);
      if (validationResult.isFailure) {
        return {
          success: false,
          message: validationResult.error,
          errors: { request: [validationResult.error] },
        };
      }

      // Apply template if specified
      const processedRequest = await this.applyTemplate(request);

      // Get project context if not explicitly provided
      const projectContext = await this.resolveProjectContext(processedRequest);

      // Create the task
      const taskResult = await this.createTask(
        processedRequest,
        projectContext,
      );
      if (taskResult.isFailure) {
        return {
          success: false,
          message: taskResult.error,
          errors: { task: [taskResult.error] },
        };
      }

      const task = taskResult.getValue();

      // Save task to repository
      await this.taskRepository.save(task);

      // Also save as asset for compatibility
      const saveResult = await this.saveTaskAsAsset(task, processedRequest);
      if (saveResult.isFailure) {
        console.warn("Failed to save task as asset:", saveResult.error);
        // Continue - task repository save was successful
      }

      // Update RDF graph
      const rdfTriples = await this.updateRDFGraph(task, projectContext);

      // Build successful response
      return {
        success: true,
        taskId: task.getId().toString(),
        message: `Task "${task.getTitle()}" created successfully`,
        task: {
          id: task.getId().toString(),
          title: task.getTitle(),
          status: task.getStatus().toString(),
          priority: task.getPriority().toString(),
          projectId: task.getProjectId()?.toString(),
          dueDate: task.getDueDate()?.toISOString().split("T")[0],
          tags: task.getTags(),
        },
        rdfTriples,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create task: ${error.message}`,
        errors: { system: [error.message] },
      };
    }
  }

  /**
   * Validate the task creation request
   */
  private validateRequest(request: CreateTaskRequest): Result<void> {
    const errors: string[] = [];

    if (!request.title || request.title.trim().length === 0) {
      errors.push("Task title is required");
    }

    if (request.title && request.title.length > 200) {
      errors.push("Task title cannot exceed 200 characters");
    }

    if (request.estimatedHours !== undefined) {
      if (
        typeof request.estimatedHours !== "number" ||
        request.estimatedHours < 0
      ) {
        errors.push("Estimated hours must be a non-negative number");
      }
    }

    if (request.dueDate) {
      const dueDate = new Date(request.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.push("Due date must be a valid date");
      }
    }

    if (
      request.priority &&
      !["low", "medium", "high", "urgent"].includes(request.priority)
    ) {
      errors.push("Priority must be one of: low, medium, high, urgent");
    }

    if (
      request.status &&
      !["todo", "in-progress", "done", "cancelled"].includes(request.status)
    ) {
      errors.push("Status must be one of: todo, in-progress, done, cancelled");
    }

    if (errors.length > 0) {
      return Result.fail<void>(errors.join("; "));
    }

    return Result.ok<void>();
  }

  /**
   * Apply task template if specified
   */
  private async applyTemplate(
    request: CreateTaskRequest,
  ): Promise<CreateTaskRequest> {
    if (!request.templateId) {
      return request;
    }

    try {
      // Load template from repository
      const templateId = AssetId.create(request.templateId);
      if (templateId.isFailure) {
        console.warn("Invalid template ID:", request.templateId);
        return request;
      }

      const template = await this.assetRepository.findById(
        templateId.getValue(),
      );
      if (!template) {
        console.warn("Template not found:", request.templateId);
        return request;
      }

      // Apply template properties
      const templateRequest = { ...request };

      // Override with template values if not explicitly set
      if (!templateRequest.description && template.getPropertyValue("description")) {
        templateRequest.description = template.getPropertyValue("description");
      }

      if (!templateRequest.priority && template.getPropertyValue("priority")) {
        templateRequest.priority = template.getPropertyValue("priority");
      }

      if (
        !templateRequest.estimatedHours &&
        template.getPropertyValue("estimatedHours")
      ) {
        templateRequest.estimatedHours = template.getPropertyValue("estimatedHours");
      }

      if (!templateRequest.tags || templateRequest.tags.length === 0) {
        const templateTags = template.getPropertyValue("tags");
        if (templateTags && Array.isArray(templateTags)) {
          templateRequest.tags = templateTags;
        }
      }

      // Apply template variable substitution
      if (request.templateVariables) {
        templateRequest.title = this.substituteVariables(
          templateRequest.title,
          request.templateVariables,
        );
        if (templateRequest.description) {
          templateRequest.description = this.substituteVariables(
            templateRequest.description,
            request.templateVariables,
          );
        }
      }

      return templateRequest;
    } catch (error) {
      console.warn("Failed to apply template:", error);
      return request;
    }
  }

  /**
   * Substitute template variables in text
   */
  private substituteVariables(
    text: string,
    variables: Record<string, string>,
  ): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Resolve project context for task association
   */
  private async resolveProjectContext(
    request: CreateTaskRequest,
  ): Promise<string | undefined> {
    if (request.projectId) {
      // Validate provided project ID
      const projectId = AssetId.create(request.projectId);
      if (projectId.isSuccess) {
        const project = await this.assetRepository.findById(
          projectId.getValue(),
        );
        if (project) {
          return request.projectId;
        }
      }
    }

    // Use context-based project detection
    const projectResponse = await this.getCurrentProjectUseCase.execute({
      activeFile: request.context?.activeFile,
      preferences: {
        includeCompleted: false,
        maxResults: 5,
        selectionStrategy: "context",
      },
    });

    return projectResponse.currentProject?.id;
  }

  /**
   * Create the task domain entity
   */
  private async createTask(
    request: CreateTaskRequest,
    projectId?: string,
  ): Promise<Result<Task>> {
    // Parse priority
    let priority: Priority;
    if (request.priority) {
      const priorityResult = Priority.create(request.priority);
      if (priorityResult.isFailure) {
        return Result.fail<Task>(`Invalid priority: ${priorityResult.error}`);
      }
      priority = priorityResult.getValue();
    } else {
      priority = Priority.medium();
    }

    // Parse status
    let status: TaskStatus;
    if (request.status) {
      const statusResult = TaskStatus.create(request.status);
      if (statusResult.isFailure) {
        return Result.fail<Task>(`Invalid status: ${statusResult.error}`);
      }
      status = statusResult.getValue();
    } else {
      status = TaskStatus.todo();
    }

    // Parse project ID
    let taskProjectId: AssetId | undefined;
    if (projectId) {
      const projectIdResult = AssetId.create(projectId);
      if (projectIdResult.isSuccess) {
        taskProjectId = projectIdResult.getValue();
      }
    }

    // Parse due date
    let dueDate: Date | undefined;
    if (request.dueDate) {
      dueDate = new Date(request.dueDate);
      if (isNaN(dueDate.getTime())) {
        return Result.fail<Task>("Invalid due date format");
      }
    }

    // Create task
    return Task.create({
      title: request.title.trim(),
      description: request.description?.trim(),
      priority: priority,
      status: status,
      projectId: taskProjectId,
      dueDate,
      estimatedHours: request.estimatedHours,
      tags: request.tags || [],
    });
  }

  /**
   * Save task as an asset in the repository
   */
  private async saveTaskAsAsset(
    task: Task,
    request: CreateTaskRequest,
  ): Promise<Result<void>> {
    try {
      // Create asset from task
      const assetResult = Asset.create({
        id: AssetId.create(task.getId().toString()).getValue(),
        label: task.getTitle(),
        className: ClassName.create("ems__Task").getValue(),
        ontology: OntologyPrefix.create("ems").getValue(),
        properties: {
          ...task.toFrontmatter(),
          // Add context information
          creationContext: {
            activeFile: request.context?.activeFile,
            selection: request.context?.selection,
            focusContext: request.context?.focusContext,
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (assetResult.isFailure) {
        return Result.fail<void>(
          `Failed to create asset: ${assetResult.error}`,
        );
      }

      const asset = assetResult.getValue();
      await this.assetRepository.save(asset);

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save task: ${error.message}`);
    }
  }

  /**
   * Update RDF graph with task relationships and metadata
   */
  private async updateRDFGraph(
    task: Task,
    projectId?: string,
  ): Promise<CreateTaskResponse["rdfTriples"]> {
    const triples: CreateTaskResponse["rdfTriples"] = [];
    const taskIRI = this.ensureValidIRI(task.getId().toString());

    try {
      // Add basic task triples
      this.addTriple(triples, taskIRI, "rdf:type", "ems:Task");
      this.addTriple(triples, taskIRI, "ems:title", task.getTitle());
      this.addTriple(
        triples,
        taskIRI,
        "ems:status",
        task.getStatus().toString(),
      );
      this.addTriple(
        triples,
        taskIRI,
        "ems:priority",
        task.getPriority().toString(),
      );
      this.addTriple(
        triples,
        taskIRI,
        "ems:createdAt",
        task.getCreatedAt().toISOString(),
      );
      this.addTriple(
        triples,
        taskIRI,
        "ems:updatedAt",
        task.getUpdatedAt().toISOString(),
      );

      // Add optional properties
      const description = task.getDescription();
      if (description) {
        this.addTriple(triples, taskIRI, "ems:description", description);
      }

      const dueDate = task.getDueDate();
      if (dueDate) {
        this.addTriple(triples, taskIRI, "ems:dueDate", dueDate.toISOString());
      }

      const estimatedHours = task.getEstimatedHours();
      if (estimatedHours !== undefined) {
        this.addTriple(
          triples,
          taskIRI,
          "ems:estimatedHours",
          estimatedHours.toString(),
        );
      }

      // Add project relationship
      if (projectId) {
        const projectIRI = this.ensureValidIRI(projectId);
        this.addTriple(triples, taskIRI, "ems:belongsToProject", projectIRI);
        this.addTriple(triples, projectIRI, "ems:hasTask", taskIRI);
      }

      // Add tags
      for (const tag of task.getTags()) {
        this.addTriple(triples, taskIRI, "ems:hasTag", tag);
      }

      // Add all triples to graph
      for (const tripleData of triples) {
        try {
          // Ensure valid IRI format for subjects and predicates
          const subjectIRI = this.ensureValidIRI(tripleData.subject);
          const predicateIRI = this.ensureValidIRI(tripleData.predicate);

          const triple = new Triple(
            new IRI(subjectIRI),
            new IRI(predicateIRI),
            tripleData.object.startsWith('"')
              ? new Literal(tripleData.object.slice(1, -1))
              : new IRI(this.ensureValidIRI(tripleData.object)),
          );
          this.graph.add(triple);
        } catch (error) {
          console.warn("Failed to create triple:", tripleData, error);
        }
      }

      return triples;
    } catch (error) {
      console.warn("Failed to update RDF graph:", error);
      return [];
    }
  }

  /**
   * Helper method to add triple data
   */
  private addTriple(
    triples: CreateTaskResponse["rdfTriples"],
    subject: string,
    predicate: string,
    object: string,
  ): void {
    if (!triples) {
      return;
    }
    triples.push({
      subject,
      predicate,
      object:
        object.includes(" ") || object.includes(":") === false
          ? `"${object}"`
          : object,
    });
  }

  /**
   * Ensure a string is formatted as a valid IRI
   */
  private ensureValidIRI(value: string): string {
    // If it looks like a UUID, wrap it in a namespace
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      return `ems:${value}`;
    }

    // If it already has a scheme or namespace, return as-is
    if (value.includes(":")) {
      return value;
    }

    // Otherwise, add default namespace
    return `ems:${value}`;
  }
}

// Import required classes that might be missing
import { ClassName } from "../../domain/value-objects/ClassName";
import { OntologyPrefix } from "../../domain/value-objects/OntologyPrefix";
