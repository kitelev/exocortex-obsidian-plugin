import { QueryTemplate, TemplateCategory } from "../visual/QueryTemplate";

export interface TemplateSearchCriteria {
  category?: TemplateCategory;
  tags?: string[];
  nameContains?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  includeBuiltIn?: boolean;
  includeCustom?: boolean;
}

export interface IQueryTemplateRepository {
  /**
   * Retrieves all query templates
   * @returns Promise resolving to array of templates
   */
  findAll(): Promise<QueryTemplate[]>;

  /**
   * Finds templates matching search criteria
   * @param criteria Search criteria to filter templates
   * @returns Promise resolving to filtered templates
   */
  findByCriteria(criteria: TemplateSearchCriteria): Promise<QueryTemplate[]>;

  /**
   * Retrieves a template by its ID
   * @param id Template identifier
   * @returns Promise resolving to template or undefined if not found
   */
  findById(id: string): Promise<QueryTemplate | undefined>;

  /**
   * Retrieves templates by category
   * @param category Template category
   * @returns Promise resolving to templates in the category
   */
  findByCategory(category: TemplateCategory): Promise<QueryTemplate[]>;

  /**
   * Retrieves templates containing specific tags
   * @param tags Array of tags to match
   * @returns Promise resolving to templates with matching tags
   */
  findByTags(tags: string[]): Promise<QueryTemplate[]>;

  /**
   * Saves a new template or updates existing one
   * @param template Template to save
   * @returns Promise resolving to saved template
   * @throws Error if template is read-only or validation fails
   */
  save(template: QueryTemplate): Promise<QueryTemplate>;

  /**
   * Creates a new template
   * @param template Template to create
   * @returns Promise resolving to created template
   * @throws Error if template with same ID already exists
   */
  create(template: QueryTemplate): Promise<QueryTemplate>;

  /**
   * Updates an existing template
   * @param template Template with updated data
   * @returns Promise resolving to updated template
   * @throws Error if template not found or is read-only
   */
  update(template: QueryTemplate): Promise<QueryTemplate>;

  /**
   * Deletes a template by ID
   * @param id Template identifier
   * @returns Promise resolving to true if deleted, false if not found
   * @throws Error if template is built-in (read-only)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Checks if a template exists
   * @param id Template identifier
   * @returns Promise resolving to true if exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Imports templates from JSON data
   * @param templatesData Array of template JSON objects
   * @returns Promise resolving to array of imported templates
   */
  importTemplates(templatesData: object[]): Promise<QueryTemplate[]>;

  /**
   * Exports templates to JSON format
   * @param templateIds Optional array of specific template IDs to export
   * @returns Promise resolving to JSON representation
   */
  exportTemplates(templateIds?: string[]): Promise<object[]>;

  /**
   * Gets built-in templates (read-only system templates)
   * @returns Promise resolving to array of built-in templates
   */
  getBuiltInTemplates(): Promise<QueryTemplate[]>;

  /**
   * Gets custom user-created templates
   * @returns Promise resolving to array of custom templates
   */
  getCustomTemplates(): Promise<QueryTemplate[]>;

  /**
   * Gets recently used templates
   * @param limit Maximum number of templates to return
   * @returns Promise resolving to recently used templates
   */
  getRecentlyUsed(limit?: number): Promise<QueryTemplate[]>;

  /**
   * Records template usage for tracking recent usage
   * @param templateId Template identifier
   * @returns Promise resolving when usage is recorded
   */
  recordUsage(templateId: string): Promise<void>;

  /**
   * Gets template usage statistics
   * @param templateId Template identifier
   * @returns Promise resolving to usage stats
   */
  getUsageStats(templateId: string): Promise<{
    usageCount: number;
    lastUsed?: Date;
    averageParametersFilled?: number;
  }>;

  /**
   * Clears all cached data and reloads from storage
   * @returns Promise resolving when refresh is complete
   */
  refresh(): Promise<void>;
}
