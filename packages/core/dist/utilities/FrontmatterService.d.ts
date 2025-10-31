/**
 * FrontmatterService
 *
 * Centralized service for YAML frontmatter manipulation in Markdown files.
 * Follows DRY principle by eliminating duplication across 15+ locations.
 *
 * @module infrastructure/services
 * @since 1.0.0
 */
/**
 * Result of frontmatter parsing operation
 */
export interface FrontmatterParseResult {
  /** Whether frontmatter block exists */
  exists: boolean;
  /** Parsed frontmatter content (without --- delimiters) */
  content: string;
  /** Original full file content */
  originalContent: string;
}
/**
 * Service for manipulating YAML frontmatter in Markdown files.
 *
 * Handles common operations like:
 * - Adding/updating/removing properties
 * - Creating frontmatter blocks when missing
 * - Preserving existing properties
 * - Maintaining YAML formatting
 *
 * @example
 * ```typescript
 * const service = new FrontmatterService();
 *
 * // Update existing property
 * const updated = service.updateProperty(
 *   content,
 *   'status',
 *   '"[[StatusDone]]"'
 * );
 *
 * // Add new property
 * const withNew = service.addProperty(content, 'priority', 'high');
 *
 * // Remove property
 * const removed = service.removeProperty(content, 'archived');
 * ```
 */
export declare class FrontmatterService {
  /**
   * Regex pattern for matching YAML frontmatter blocks.
   * Matches: ---\n[content]\n---
   */
  private static readonly FRONTMATTER_REGEX;
  /**
   * Parse frontmatter from markdown content.
   *
   * @param content - Full markdown file content
   * @returns Parse result with existence flag and content
   *
   * @example
   * ```typescript
   * const result = service.parse('---\nfoo: bar\n---\nBody');
   * // result.exists === true
   * // result.content === 'foo: bar'
   * ```
   */
  parse(content: string): FrontmatterParseResult;
  /**
   * Update or add a property in frontmatter.
   *
   * - If frontmatter exists and has the property: updates value
   * - If frontmatter exists but lacks property: adds property
   * - If no frontmatter exists: creates frontmatter with property
   *
   * @param content - Full markdown file content
   * @param property - Property name (e.g., 'status', 'ems__Effort_status')
   * @param value - Property value (e.g., '"[[StatusDone]]"', 'true', '42')
   * @returns Updated content with modified frontmatter
   *
   * @example
   * ```typescript
   * // Update existing
   * const result1 = service.updateProperty(
   *   '---\nstatus: draft\n---\nBody',
   *   'status',
   *   'published'
   * );
   * // result1 === '---\nstatus: published\n---\nBody'
   *
   * // Add new property
   * const result2 = service.updateProperty(
   *   '---\nfoo: bar\n---\nBody',
   *   'status',
   *   'draft'
   * );
   * // result2 === '---\nfoo: bar\nstatus: draft\n---\nBody'
   *
   * // Create frontmatter if missing
   * const result3 = service.updateProperty(
   *   'Body content',
   *   'status',
   *   'draft'
   * );
   * // result3 === '---\nstatus: draft\n---\nBody content'
   * ```
   */
  updateProperty(content: string, property: string, value: any): string;
  /**
   * Add a new property to frontmatter (alias for updateProperty).
   *
   * Convenience method with clearer semantics for adding new properties.
   *
   * @param content - Full markdown file content
   * @param property - Property name
   * @param value - Property value
   * @returns Updated content
   */
  addProperty(content: string, property: string, value: any): string;
  /**
   * Remove a property from frontmatter.
   *
   * - If property exists: removes the line
   * - If property doesn't exist: returns content unchanged
   * - If no frontmatter exists: returns content unchanged
   *
   * @param content - Full markdown file content
   * @param property - Property name to remove
   * @returns Updated content with property removed
   *
   * @example
   * ```typescript
   * const result = service.removeProperty(
   *   '---\nfoo: bar\nstatus: draft\n---\nBody',
   *   'status'
   * );
   * // result === '---\nfoo: bar\n---\nBody'
   * ```
   */
  removeProperty(content: string, property: string): string;
  /**
   * Check if frontmatter contains a specific property.
   *
   * @param frontmatterContent - Frontmatter content (without --- delimiters)
   * @param property - Property name to check
   * @returns True if property exists
   *
   * @example
   * ```typescript
   * const hasStatus = service.hasProperty('foo: bar\nstatus: draft', 'status');
   * // hasStatus === true
   * ```
   */
  hasProperty(frontmatterContent: string, property: string): boolean;
  /**
   * Create new frontmatter block with given properties.
   *
   * @param content - Original markdown content (without frontmatter)
   * @param properties - Object with property-value pairs
   * @returns Content with new frontmatter prepended
   *
   * @example
   * ```typescript
   * const result = service.createFrontmatter(
   *   'Body content',
   *   { status: 'draft', priority: 'high' }
   * );
   * // result === '---\nstatus: draft\npriority: high\n---\nBody content'
   * ```
   */
  createFrontmatter(content: string, properties: Record<string, any>): string;
  /**
   * Get property value from frontmatter content.
   *
   * @param frontmatterContent - Frontmatter content (without --- delimiters)
   * @param property - Property name
   * @returns Property value or null if not found
   *
   * @example
   * ```typescript
   * const value = service.getPropertyValue(
   *   'foo: bar\nstatus: draft',
   *   'status'
   * );
   * // value === 'draft'
   * ```
   */
  getPropertyValue(frontmatterContent: string, property: string): string | null;
  /**
   * Escape special regex characters in property names.
   *
   * Handles property names with special characters like dots, underscores, etc.
   *
   * @param str - String to escape
   * @returns Escaped string safe for use in RegExp
   * @private
   */
  private escapeRegex;
}
//# sourceMappingURL=FrontmatterService.d.ts.map
