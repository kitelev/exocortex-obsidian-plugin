/**
 * Data Transfer Object for task creation request
 * Encapsulates all data needed to create a new task
 * Following Clean Architecture principles for data flow
 */

export interface CreateTaskRequest {
  /**
   * Task title (required)
   */
  title: string;

  /**
   * Task description (optional)
   */
  description?: string;

  /**
   * Priority level (low, medium, high, urgent)
   * Defaults to medium if not specified
   */
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * Task status (todo, in-progress, done, cancelled)
   * Defaults to todo if not specified
   */
  status?: 'todo' | 'in-progress' | 'done' | 'cancelled';

  /**
   * Project ID to associate the task with
   * Optional - task can exist without project
   */
  projectId?: string;

  /**
   * Due date for the task
   * ISO date string format
   */
  dueDate?: string;

  /**
   * Estimated hours for task completion
   * Must be positive number
   */
  estimatedHours?: number;

  /**
   * Tags to associate with the task
   * Used for categorization and filtering
   */
  tags?: string[];

  /**
   * Template ID for applying task template
   * Used to pre-populate task properties
   */
  templateId?: string;

  /**
   * Template variables to replace in template
   * Key-value pairs for template substitution
   */
  templateVariables?: Record<string, string>;

  /**
   * Context information from current workspace
   * Used for intelligent task creation
   */
  context?: {
    /**
     * Current active file path
     */
    activeFile?: string;
    
    /**
     * Current selection or cursor position
     */
    selection?: string;
    
    /**
     * Current focus context
     */
    focusContext?: string;
    
    /**
     * Related entities from current context
     */
    relatedEntities?: string[];
  };
}

/**
 * Response object for task creation
 */
export interface CreateTaskResponse {
  /**
   * Indicates if creation was successful
   */
  success: boolean;

  /**
   * Created task ID
   */
  taskId?: string;

  /**
   * Success or error message
   */
  message: string;

  /**
   * Created task details for UI feedback
   */
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    projectId?: string;
    dueDate?: string;
    tags: string[];
  };

  /**
   * Validation errors if creation failed
   */
  errors?: Record<string, string[]>;

  /**
   * RDF triples created/updated during task creation
   * Used for graph synchronization
   */
  rdfTriples?: Array<{
    subject: string;
    predicate: string;
    object: string;
  }>;
}

/**
 * Request object for getting current project context
 */
export interface GetCurrentProjectRequest {
  /**
   * Current active file path
   */
  activeFile?: string;

  /**
   * Current focus context ID
   */
  focusId?: string;

  /**
   * User preferences for project detection
   */
  preferences?: {
    /**
     * Include completed projects in results
     */
    includeCompleted?: boolean;
    
    /**
     * Maximum number of projects to return
     */
    maxResults?: number;
    
    /**
     * Preferred project selection strategy
     */
    selectionStrategy?: 'recent' | 'active' | 'priority' | 'context';
  };
}

/**
 * Response object for current project context
 */
export interface GetCurrentProjectResponse {
  /**
   * Indicates if operation was successful
   */
  success: boolean;

  /**
   * Current project if detected
   */
  currentProject?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    description?: string;
  };

  /**
   * Available projects for task association
   */
  availableProjects: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    description?: string;
    isActive: boolean;
    lastUpdated: string;
  }>;

  /**
   * Context information used for project detection
   */
  context: {
    /**
     * Detection strategy used
     */
    strategy: string;
    
    /**
     * Confidence score (0-1) for current project detection
     */
    confidence: number;
    
    /**
     * Reasoning for project selection
     */
    reasoning: string;
  };

  /**
   * Error message if operation failed
   */
  message?: string;
}