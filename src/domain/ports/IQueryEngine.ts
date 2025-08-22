import { Result } from "../core/Result";

/**
 * Query Engine Type - identifies the type of query engine
 */
export type QueryEngineType = "dataview" | "datacore" | "native";

/**
 * Query Result - generic result structure for any query engine
 */
export interface QueryResult {
  type: "table" | "list" | "task" | "calendar" | "raw";
  data: any[];
  columns?: string[];
  metadata?: Record<string, any>;
}

/**
 * Query Context - provides context for query execution
 */
export interface QueryContext {
  currentFile?: string;
  currentPath?: string;
  frontmatter?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Query Engine Interface - abstracts query execution for different engines
 */
export interface IQueryEngine {
  /**
   * Gets the type of this query engine
   */
  getType(): QueryEngineType;

  /**
   * Checks if the query engine is available and ready to use
   */
  isAvailable(): boolean;

  /**
   * Executes a query string and returns structured results
   */
  executeQuery(
    query: string,
    context?: QueryContext,
  ): Promise<Result<QueryResult>>;

  /**
   * Executes a query and renders the result to a container
   * This is for backward compatibility and simpler integration
   */
  renderQuery(
    container: HTMLElement,
    query: string,
    context?: QueryContext,
  ): Promise<Result<void>>;

  /**
   * Gets pages/files matching the given source expression
   */
  getPages(source: string): Promise<Result<any[]>>;

  /**
   * Gets metadata for a specific page/file
   */
  getPageMetadata(path: string): Promise<Result<Record<string, any>>>;

  /**
   * Validates if a query string is syntactically correct
   */
  validateQuery(query: string): Result<boolean>;
}

/**
 * Query Engine Factory Interface
 */
export interface IQueryEngineFactory {
  /**
   * Creates a query engine instance based on availability and preference
   */
  createQueryEngine(preferred?: QueryEngineType): Promise<Result<IQueryEngine>>;

  /**
   * Gets all available query engine types
   */
  getAvailableEngines(): QueryEngineType[];

  /**
   * Checks if a specific query engine type is available
   */
  isEngineAvailable(type: QueryEngineType): boolean;
}
