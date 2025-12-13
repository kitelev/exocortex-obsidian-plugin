/**
 * Error codes for debugging purposes.
 * These codes provide a consistent way to identify errors in production logs
 * without exposing sensitive implementation details.
 *
 * Format: [COMPONENT]_[NUMBER]
 * Components:
 * - SPARQL: SPARQL query execution
 * - STORE: Triple store operations
 * - RENDER: UI rendering
 * - VAULT: Vault operations
 * - CONFIG: Configuration errors
 * - GENERAL: General errors
 */
export const ErrorCodes = {
  // SPARQL-related errors (SPARQL_001 - SPARQL_099)
  SPARQL_QUERY_EXECUTION: "SPARQL_001",
  SPARQL_QUERY_REFRESH: "SPARQL_002",
  SPARQL_PARSE_ERROR: "SPARQL_003",
  SPARQL_CONSTRUCT_ERROR: "SPARQL_004",

  // Triple store errors (STORE_001 - STORE_099)
  STORE_INITIALIZATION: "STORE_001",
  STORE_ADD_TRIPLE: "STORE_002",
  STORE_QUERY: "STORE_003",

  // Rendering errors (RENDER_001 - RENDER_099)
  RENDER_COMPONENT: "RENDER_001",
  RENDER_LAYOUT: "RENDER_002",
  RENDER_TABLE: "RENDER_003",

  // Vault operations (VAULT_001 - VAULT_099)
  VAULT_READ: "VAULT_001",
  VAULT_WRITE: "VAULT_002",
  VAULT_METADATA: "VAULT_003",

  // Configuration errors (CONFIG_001 - CONFIG_099)
  CONFIG_LOAD: "CONFIG_001",
  CONFIG_SAVE: "CONFIG_002",
  CONFIG_INVALID: "CONFIG_003",

  // General errors (GEN_001 - GEN_099)
  GENERAL_UNKNOWN: "GEN_001",
  GENERAL_TIMEOUT: "GEN_002",
  GENERAL_VALIDATION: "GEN_003",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Map of error codes to user-friendly messages shown in production.
 * Stack traces and implementation details are hidden behind these messages.
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.SPARQL_QUERY_EXECUTION]: "Query execution failed",
  [ErrorCodes.SPARQL_QUERY_REFRESH]: "Query refresh failed",
  [ErrorCodes.SPARQL_PARSE_ERROR]: "Query syntax error",
  [ErrorCodes.SPARQL_CONSTRUCT_ERROR]: "Graph construction failed",

  [ErrorCodes.STORE_INITIALIZATION]: "Knowledge base initialization failed",
  [ErrorCodes.STORE_ADD_TRIPLE]: "Failed to add data",
  [ErrorCodes.STORE_QUERY]: "Data retrieval failed",

  [ErrorCodes.RENDER_COMPONENT]: "Component render failed",
  [ErrorCodes.RENDER_LAYOUT]: "Layout render failed",
  [ErrorCodes.RENDER_TABLE]: "Table render failed",

  [ErrorCodes.VAULT_READ]: "File read failed",
  [ErrorCodes.VAULT_WRITE]: "File write failed",
  [ErrorCodes.VAULT_METADATA]: "Metadata operation failed",

  [ErrorCodes.CONFIG_LOAD]: "Configuration load failed",
  [ErrorCodes.CONFIG_SAVE]: "Configuration save failed",
  [ErrorCodes.CONFIG_INVALID]: "Invalid configuration",

  [ErrorCodes.GENERAL_UNKNOWN]: "An unexpected error occurred",
  [ErrorCodes.GENERAL_TIMEOUT]: "Operation timed out",
  [ErrorCodes.GENERAL_VALIDATION]: "Validation failed",
};
