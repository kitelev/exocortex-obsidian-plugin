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
export class FrontmatterService {
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
    parse(content) {
        const match = content.match(FrontmatterService.FRONTMATTER_REGEX);
        if (!match) {
            return {
                exists: false,
                content: "",
                originalContent: content,
            };
        }
        return {
            exists: true,
            content: match[1],
            originalContent: content,
        };
    }
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
    updateProperty(content, property, value) {
        const parsed = this.parse(content);
        // No frontmatter exists - create new block
        if (!parsed.exists) {
            return this.createFrontmatter(content, { [property]: value });
        }
        // Frontmatter exists - update or add property
        let updatedFrontmatter = parsed.content;
        // Property already exists - replace value
        if (this.hasProperty(updatedFrontmatter, property)) {
            const propertyRegex = new RegExp(`${this.escapeRegex(property)}:.*$`, "m");
            updatedFrontmatter = updatedFrontmatter.replace(propertyRegex, `${property}: ${value}`);
        }
        else {
            // Property doesn't exist - append to frontmatter
            // Add newline separator only if frontmatter is not empty
            const separator = updatedFrontmatter.length > 0 ? "\n" : "";
            updatedFrontmatter += `${separator}${property}: ${value}`;
        }
        // Replace frontmatter block in original content
        return content.replace(FrontmatterService.FRONTMATTER_REGEX, `---\n${updatedFrontmatter}\n---`);
    }
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
    addProperty(content, property, value) {
        return this.updateProperty(content, property, value);
    }
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
    removeProperty(content, property) {
        const parsed = this.parse(content);
        // No frontmatter or property doesn't exist - return unchanged
        if (!parsed.exists || !this.hasProperty(parsed.content, property)) {
            return content;
        }
        // Remove property line (including trailing newline if present)
        const propertyLineRegex = new RegExp(`\n?${this.escapeRegex(property)}:.*$`, "m");
        const updatedFrontmatter = parsed.content.replace(propertyLineRegex, "");
        // Replace frontmatter block in original content
        return content.replace(FrontmatterService.FRONTMATTER_REGEX, `---\n${updatedFrontmatter}\n---`);
    }
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
    hasProperty(frontmatterContent, property) {
        return frontmatterContent.includes(`${property}:`);
    }
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
    createFrontmatter(content, properties) {
        const frontmatterLines = Object.entries(properties).map(([key, value]) => `${key}: ${value}`);
        const frontmatterBlock = `---\n${frontmatterLines.join("\n")}\n---`;
        // Preserve leading newline if original content starts with one
        const separator = content.startsWith("\n") ? "" : "\n";
        return `${frontmatterBlock}${separator}${content}`;
    }
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
    getPropertyValue(frontmatterContent, property) {
        const propertyRegex = new RegExp(`${this.escapeRegex(property)}:\\s*(.*)$`, "m");
        const match = frontmatterContent.match(propertyRegex);
        return match ? match[1].trim() : null;
    }
    /**
     * Escape special regex characters in property names.
     *
     * Handles property names with special characters like dots, underscores, etc.
     *
     * @param str - String to escape
     * @returns Escaped string safe for use in RegExp
     * @private
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
}
/**
 * Regex pattern for matching YAML frontmatter blocks.
 * Matches: ---\n[content]\n---
 */
FrontmatterService.FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJvbnRtYXR0ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRnJvbnRtYXR0ZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztHQVFHO0FBY0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMEJHO0FBQ0gsTUFBTSxPQUFPLGtCQUFrQjtJQU83Qjs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxLQUFLLENBQUMsT0FBZTtRQUNuQixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFFbEUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1gsT0FBTztnQkFDTCxNQUFNLEVBQUUsS0FBSztnQkFDYixPQUFPLEVBQUUsRUFBRTtnQkFDWCxlQUFlLEVBQUUsT0FBTzthQUN6QixDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU87WUFDTCxNQUFNLEVBQUUsSUFBSTtZQUNaLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLGVBQWUsRUFBRSxPQUFPO1NBQ3pCLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0NHO0lBQ0gsY0FBYyxDQUFDLE9BQWUsRUFBRSxRQUFnQixFQUFFLEtBQVU7UUFDMUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVuQywyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNuQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELDhDQUE4QztRQUM5QyxJQUFJLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFFeEMsMENB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UyxHQUFHLE9BQU8sRUFBRSxDQUFDO0lBQ3JELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7O09BZUc7SUFDSCxnQkFBZ0IsQ0FDZCxrQkFBMEIsRUFDMUIsUUFBZ0I7UUFFaEIsTUFBTSxhQUFhLEdBQUcsSUFBSSxNQUFNLENBQzlCLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUN6QyxHQUFHLENBQ0osQ0FBQztRQUNGLE1BQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN0RCxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDeEMsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0ssV0FBVyxDQUFDLEdBQVc7UUFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3BELENBQUM7O0FBM1BEOzs7R0FHRztBQUNxQixvQ0FBaUIsR0FBRyx1QkFBdUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRnJvbnRtYXR0ZXJTZXJ2aWNlXG4gKlxuICogQ2VudHJhbGl6ZWQgc2VydmljZSBmb3IgWUFNTCBmcm9udG1hdHRlciBtYW5pcHVsYXRpb24gaW4gTWFya2Rvd24gZmlsZXMuXG4gKiBGb2xsb3dzIERSWSBwcmluY2lwbGUgYnkgZWxpbWluYXRpbmcgZHVwbGljYXRpb24gYWNyb3NzIDE1KyBsb2NhdGlvbnMuXG4gKlxuICogQG1vZHVsZSBpbmZyYXN0cnVjdHVyZS9zZXJ2aWNlc1xuICogQHNpbmNlIDEuMC4wXG4gKi9cblxuLyoqXG4gKiBSZXN1bHQgb2YgZnJvbnRtYXR0ZXIgcGFyc2luZyBvcGVyYXRpb25cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGcm9udG1hdHRlclBhcnNlUmVzdWx0IHtcbiAgLyoqIFdoZXRoZXIgZnJvbnRtYXR0ZXIgYmxvY2sgZXhpc3RzICovXG4gIGV4aXN0czogYm9vbGVhbjtcbiAgLyoqIFBhcnNlZCBmcm9udG1hdHRlciBjb250ZW50ICh3aXRob3V0IC0tLSBkZWxpbWl0ZXJzKSAqL1xuICBjb250ZW50OiBzdHJpbmc7XG4gIC8qKiBPcmlnaW5hbCBmdWxsIGZpbGUgY29udGVudCAqL1xuICBvcmlnaW5hbENvbnRlbnQ6IHN0cmluZztcbn1cblxuLyoqXG4gKiBTZXJ2aWNlIGZvciBtYW5pcHVsYXRpbmcgWUFNTCBmcm9udG1hdHRlciBpbiBNYXJrZG93biBmaWxlcy5cbiAqXG4gKiBIYW5kbGVzIGNvbW1vbiBvcGVyYXRpb25zIGxpa2U6XG4gKiAtIEFkZGluZy91cGRhdGluZy9yZW1vdmluZyBwcm9wZXJ0aWVzXG4gKiAtIENyZWF0aW5nIGZyb250bWF0dGVyIGJsb2NrcyB3aGVuIG1pc3NpbmdcbiAqIC0gUHJlc2VydmluZyBleGlzdGluZyBwcm9wZXJ0aWVzXG4gKiAtIE1haW50YWluaW5nIFlBTUwgZm9ybWF0dGluZ1xuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBzZXJ2aWNlID0gbmV3IEZyb250bWF0dGVyU2VydmljZSgpO1xuICpcbiAqIC8vIFVwZGF0ZSBleGlzdGluZyBwcm9wZXJ0eVxuICogY29uc3QgdXBkYXRlZCA9IHNlcnZpY2UudXBkYXRlUHJvcGVydHkoXG4gKiAgIGNvbnRlbnQsXG4gKiAgICdzdGF0dXMnLFxuICogICAnXCJbW1N0YXR1c0RvbmVdXVwiJ1xuICogKTtcbiAqXG4gKiAvLyBBZGQgbmV3IHByb3BlcnR5XG4gKiBjb25zdCB3aXRoTmV3ID0gc2VydmljZS5hZGRQcm9wZXJ0eShjb250ZW50LCAncHJpb3JpdHknLCAnaGlnaCcpO1xuICpcbiAqIC8vIFJlbW92ZSBwcm9wZXJ0eVxuICogY29uc3QgcmVtb3ZlZCA9IHNlcnZpY2UucmVtb3ZlUHJvcGVydHkoY29udGVudCwgJ2FyY2hpdmVkJyk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEZyb250bWF0dGVyU2VydmljZSB7XG4gIC8qKlxuICAgKiBSZWdleCBwYXR0ZXJuIGZvciBtYXRjaGluZyBZQU1MIGZyb250bWF0dGVyIGJsb2Nrcy5cbiAgICogTWF0Y2hlczogLS0tXFxuW2NvbnRlbnRdXFxuLS0tXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBGUk9OVE1BVFRFUl9SRUdFWCA9IC9eLS0tXFxuKFtcXHNcXFNdKj8pXFxuLS0tLztcblxuICAvKipcbiAgICogUGFyc2UgZnJvbnRtYXR0ZXIgZnJvbSBtYXJrZG93biBjb250ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gY29udGVudCAtIEZ1bGwgbWFya2Rvd24gZmlsZSBjb250ZW50XG4gICAqIEByZXR1cm5zIFBhcnNlIHJlc3VsdCB3aXRoIGV4aXN0ZW5jZSBmbGFnIGFuZCBjb250ZW50XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgcmVzdWx0ID0gc2VydmljZS5wYXJzZSgnLS0tXFxuZm9vOiBiYXJcXG4tLS1cXG5Cb2R5Jyk7XG4gICAqIC8vIHJlc3VsdC5leGlzdHMgPT09IHRydWVcbiAgICogLy8gcmVzdWx0LmNvbnRlbnQgPT09ICdmb286IGJhcidcbiAgICogYGBgXG4gICAqL1xuICBwYXJzZShjb250ZW50OiBzdHJpbmcpOiBGcm9udG1hdHRlclBhcnNlUmVzdWx0IHtcbiAgICBjb25zdCBtYXRjaCA9IGNvbnRlbnQubWF0Y2goRnJvbnRtYXR0ZXJTZXJ2aWNlLkZST05UTUFUVEVSX1JFR0VYKTtcblxuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4aXN0czogZmFsc2UsXG4gICAgICAgIGNvbnRlbnQ6IFwiXCIsXG4gICAgICAgIG9yaWdpbmFsQ29udGVudDogY29udGVudCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGV4aXN0czogdHJ1ZSxcbiAgICAgIGNvbnRlbnQ6IG1hdGNoWzFdLFxuICAgICAgb3JpZ2luYWxDb250ZW50OiBjb250ZW50LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIG9yIGFkZCBhIHByb3BlcnR5IGluIGZyb250bWF0dGVyLlxuICAgKlxuICAgKiAtIElmIGZyb250bWF0dGVyIGV4aXN0cyBhbmQgaGFzIHRoZSBwcm9wZXJ0eTogdXBkYXRlcyB2YWx1ZVxuICAgKiAtIElmIGZyb250bWF0dGVyIGV4aXN0cyBidXQgbGFja3MgcHJvcGVydHk6IGFkZHMgcHJvcGVydHlcbiAgICogLSBJZiBubyBmcm9udG1hdHRlciBleGlzdHM6IGNyZWF0ZXMgZnJvbnRtYXR0ZXIgd2l0aCBwcm9wZXJ0eVxuICAgKlxuICAgKiBAcGFyYW0gY29udGVudCAtIEZ1bGwgbWFya2Rvd24gZmlsZSBjb250ZW50XG4gICAqIEBwYXJhbSBwcm9wZXJ0eSAtIFByb3BlcnR5IG5hbWUgKGUuZy4sICdzdGF0dXMnLCAnZW1zX19FZmZvcnRfc3RhdHVzJylcbiAgICogQHBhcmFtIHZhbHVlIC0gUHJvcGVydHkgdmFsdWUgKGUuZy4sICdcIltbU3RhdHVzRG9uZV1dXCInLCAndHJ1ZScsICc0MicpXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgY29udGVudCB3aXRoIG1vZGlmaWVkIGZyb250bWF0dGVyXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogLy8gVXBkYXRlIGV4aXN0aW5nXG4gICAqIGNvbnN0IHJlc3VsdDEgPSBzZXJ2aWNlLnVwZGF0ZVByb3BlcnR5KFxuICAgKiAgICctLS1cXG5zdGF0dXM6IGRyYWZ0XFxuLS0tXFxuQm9keScsXG4gICAqICAgJ3N0YXR1cycsXG4gICAqICAgJ3B1Ymxpc2hlZCdcbiAgICogKTtcbiAgICogLy8gcmVzdWx0MSA9PT0gJy0tLVxcbnN0YXR1czogcHVibGlzaGVkXFxuLS0tXFxuQm9keSdcbiAgICpcbiAgICogLy8gQWRkIG5ldyBwcm9wZXJ0eVxuICAgKiBjb25zdCByZXN1bHQyID0gc2VydmljZS51cGRhdGVQcm9wZXJ0eShcbiAgICogICAnLS0tXFxuZm9vOiBiYXJcXG4tLS1cXG5Cb2R5JyxcbiAgICogICAnc3RhdHVzJyxcbiAgICogICAnZHJhZnQnXG4gICAqICk7XG4gICAqIC8vIHJlc3VsdDIgPT09ICctLS1cXG5mb286IGJhclxcbnN0YXR1czogZHJhZnRcXG4tLS1cXG5Cb2R5J1xuICAgKlxuICAgKiAvLyBDcmVhdGUgZnJvbnRtYXR0ZXIgaWYgbWlzc2luZ1xuICAgKiBjb25zdCByZXN1bHQzID0gc2VydmljZS51cGRhdGVQcm9wZXJ0eShcbiAgICogICAnQm9keSBjb250ZW50JyxcbiAgICogICAnc3RhdHVzJyxcbiAgICogICAnZHJhZnQnXG4gICAqICk7XG4gICAqIC8vIHJlc3VsdDMgPT09ICctLS1cXG5zdGF0dXM6IGRyYWZ0XFxuLS0tXFxuQm9keSBjb250ZW50J1xuICAgKiBgYGBcbiAgICovXG4gIHVwZGF0ZVByb3BlcnR5KGNvbnRlbnQ6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgcGFyc2VkID0gdGhpcy5wYXJzZShjb250ZW50KTtcblxuICAgIC8vIE5vIGZyb250bWF0dGVyIGV4aXN0cyAtIGNyZWF0ZSBuZXcgYmxvY2tcbiAgICBpZiAoIXBhcnNlZC5leGlzdHMpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZyb250bWF0dGVyKGNvbnRlbnQsIHsgW3Byb3BlcnR5XTogdmFsdWUgfSk7XG4gICAgfVxuXG4gICAgLy8gRnJvbnRtYXR0ZXIgZXhpc3RzIC0gdXBkYXRlIG9yIGFkZCBwcm9wZXJ0eVxuICAgIGxldCB1cGRhdGVkRnJvbnRtYXR0ZXIgPSBwYXJzZWQuY29udGVudDtcblxuICAgIC8vIFByb3BlcnR5IGFscmVhZHkgZXhpc3RzIC0gcmVwbGFjZSB2YWx1ZVxuICAgIGlmICh0aGlzLmhhc1Byb3BlcnR5KHVwZGF0ZWRGcm9udG1hdHRlciwgcHJvcGVydHkpKSB7XG4gICAgICBjb25zdCBwcm9wZXJ0eVJlZ2V4ID0gbmV3IFJlZ0V4cChgJHt0aGlzLmVzY2FwZVJlZ2V4KHByb3BlcnR5KX06LiokYCwgXCJtXCIpO1xuICAgICAgdXBkYXRlZEZyb250bWF0dGVyID0gdXBkYXRlZEZyb250bWF0dGVyLnJlcGxhY2UoXG4gICAgICAgIHByb3BlcnR5UmVnZXgsXG4gICAgICAgIGAke3Byb3BlcnR5fTogJHt2YWx1ZX1gLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUHJvcGVydHkgZG9lc24ndCBleGlzdCAtIGFwcGVuZCB0byBmcm9udG1hdHRlclxuICAgICAgLy8gQWRkIG5ld2xpbmUgc2VwYXJhdG9yIG9ubHkgaWYgZnJvbnRtYXR0ZXIgaXMgbm90IGVtcHR5XG4gICAgICBjb25zdCBzZXBhcmF0b3IgPSB1cGRhdGVkRnJvbnRtYXR0ZXIubGVuZ3RoID4gMCA/IFwiXFxuXCIgOiBcIlwiO1xuICAgICAgdXBkYXRlZEZyb250bWF0dGVyICs9IGAke3NlcGFyYXRvcn0ke3Byb3BlcnR5fTogJHt2YWx1ZX1gO1xuICAgIH1cblxuICAgIC8vIFJlcGxhY2UgZnJvbnRtYXR0ZXIgYmxvY2sgaW4gb3JpZ2luYWwgY29udGVudFxuICAgIHJldHVybiBjb250ZW50LnJlcGxhY2UoXG4gICAgICBGcm9udG1hdHRlclNlcnZpY2UuRlJPTlRNQVRURVJfUkVHRVgsXG4gICAgICBgLS0tXFxuJHt1cGRhdGVkRnJvbnRtYXR0ZXJ9XFxuLS0tYCxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBwcm9wZXJ0eSB0byBmcm9udG1hdHRlciAoYWxpYXMgZm9yIHVwZGF0ZVByb3BlcnR5KS5cbiAgICpcbiAgICogQ29udmVuaWVuY2UgbWV0aG9kIHdpdGggY2xlYXJlciBzZW1hbnRpY3MgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcy5cbiAgICpcbiAgICogQHBhcmFtIGNvbnRlbnQgLSBGdWxsIG1hcmtkb3duIGZpbGUgY29udGVudFxuICAgKiBAcGFyYW0gcHJvcGVydHkgLSBQcm9wZXJ0eSBuYW1lXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFByb3BlcnR5IHZhbHVlXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgY29udGVudFxuICAgKi9cbiAgYWRkUHJvcGVydHkoY29udGVudDogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVQcm9wZXJ0eShjb250ZW50LCBwcm9wZXJ0eSwgdmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIHByb3BlcnR5IGZyb20gZnJvbnRtYXR0ZXIuXG4gICAqXG4gICAqIC0gSWYgcHJvcGVydHkgZXhpc3RzOiByZW1vdmVzIHRoZSBsaW5lXG4gICAqIC0gSWYgcHJvcGVydHkgZG9lc24ndCBleGlzdDogcmV0dXJucyBjb250ZW50IHVuY2hhbmdlZFxuICAgKiAtIElmIG5vIGZyb250bWF0dGVyIGV4aXN0czogcmV0dXJucyBjb250ZW50IHVuY2hhbmdlZFxuICAgKlxuICAgKiBAcGFyYW0gY29udGVudCAtIEZ1bGwgbWFya2Rvd24gZmlsZSBjb250ZW50XG4gICAqIEBwYXJhbSBwcm9wZXJ0eSAtIFByb3BlcnR5IG5hbWUgdG8gcmVtb3ZlXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgY29udGVudCB3aXRoIHByb3BlcnR5IHJlbW92ZWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCByZXN1bHQgPSBzZXJ2aWNlLnJlbW92ZVByb3BlcnR5KFxuICAgKiAgICctLS1cXG5mb286IGJhclxcbnN0YXR1czogZHJhZnRcXG4tLS1cXG5Cb2R5JyxcbiAgICogICAnc3RhdHVzJ1xuICAgKiApO1xuICAgKiAvLyByZXN1bHQgPT09ICctLS1cXG5mb286IGJhclxcbi0tLVxcbkJvZHknXG4gICAqIGBgYFxuICAgKi9cbiAgcmVtb3ZlUHJvcGVydHkoY29udGVudDogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXJzZWQgPSB0aGlzLnBhcnNlKGNvbnRlbnQpO1xuXG4gICAgLy8gTm8gZnJvbnRtYXR0ZXIgb3IgcHJvcGVydHkgZG9lc24ndCBleGlzdCAtIHJldHVybiB1bmNoYW5nZWRcbiAgICBpZiAoIXBhcnNlZC5leGlzdHMgfHwgIXRoaXMuaGFzUHJvcGVydHkocGFyc2VkLmNvbnRlbnQsIHByb3BlcnR5KSkge1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIHByb3BlcnR5IGxpbmUgKGluY2x1ZGluZyB0cmFpbGluZyBuZXdsaW5lIGlmIHByZXNlbnQpXG4gICAgY29uc3QgcHJvcGVydHlMaW5lUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgYFxcbj8ke3RoaXMuZXNjYXBlUmVnZXgocHJvcGVydHkpfTouKiRgLFxuICAgICAgXCJtXCIsXG4gICAgKTtcbiAgICBjb25zdCB1cGRhdGVkRnJvbnRtYXR0ZXIgPSBwYXJzZWQuY29udGVudC5yZXBsYWNlKHByb3BlcnR5TGluZVJlZ2V4LCBcIlwiKTtcblxuICAgIC8vIFJlcGxhY2UgZnJvbnRtYXR0ZXIgYmxvY2sgaW4gb3JpZ2luYWwgY29udGVudFxuICAgIHJldHVybiBjb250ZW50LnJlcGxhY2UoXG4gICAgICBGcm9udG1hdHRlclNlcnZpY2UuRlJPTlRNQVRURVJfUkVHRVgsXG4gICAgICBgLS0tXFxuJHt1cGRhdGVkRnJvbnRtYXR0ZXJ9XFxuLS0tYCxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGZyb250bWF0dGVyIGNvbnRhaW5zIGEgc3BlY2lmaWMgcHJvcGVydHkuXG4gICAqXG4gICAqIEBwYXJhbSBmcm9udG1hdHRlckNvbnRlbnQgLSBGcm9udG1hdHRlciBjb250ZW50ICh3aXRob3V0IC0tLSBkZWxpbWl0ZXJzKVxuICAgKiBAcGFyYW0gcHJvcGVydHkgLSBQcm9wZXJ0eSBuYW1lIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgcHJvcGVydHkgZXhpc3RzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgaGFzU3RhdHVzID0gc2VydmljZS5oYXNQcm9wZXJ0eSgnZm9vOiBiYXJcXG5zdGF0dXM6IGRyYWZ0JywgJ3N0YXR1cycpO1xuICAgKiAvLyBoYXNTdGF0dXMgPT09IHRydWVcbiAgICogYGBgXG4gICAqL1xuICBoYXNQcm9wZXJ0eShmcm9udG1hdHRlckNvbnRlbnQ6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmcm9udG1hdHRlckNvbnRlbnQuaW5jbHVkZXMoYCR7cHJvcGVydHl9OmApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgZnJvbnRtYXR0ZXIgYmxvY2sgd2l0aCBnaXZlbiBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiBAcGFyYW0gY29udGVudCAtIE9yaWdpbmFsIG1hcmtkb3duIGNvbnRlbnQgKHdpdGhvdXQgZnJvbnRtYXR0ZXIpXG4gICAqIEBwYXJhbSBwcm9wZXJ0aWVzIC0gT2JqZWN0IHdpdGggcHJvcGVydHktdmFsdWUgcGFpcnNcbiAgICogQHJldHVybnMgQ29udGVudCB3aXRoIG5ldyBmcm9udG1hdHRlciBwcmVwZW5kZWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCByZXN1bHQgPSBzZXJ2aWNlLmNyZWF0ZUZyb250bWF0dGVyKFxuICAgKiAgICdCb2R5IGNvbnRlbnQnLFxuICAgKiAgIHsgc3RhdHVzOiAnZHJhZnQnLCBwcmlvcml0eTogJ2hpZ2gnIH1cbiAgICogKTtcbiAgICogLy8gcmVzdWx0ID09PSAnLS0tXFxuc3RhdHVzOiBkcmFmdFxcbnByaW9yaXR5OiBoaWdoXFxuLS0tXFxuQm9keSBjb250ZW50J1xuICAgKiBgYGBcbiAgICovXG4gIGNyZWF0ZUZyb250bWF0dGVyKFxuICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICBwcm9wZXJ0aWVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IGZyb250bWF0dGVyTGluZXMgPSBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKS5tYXAoXG4gICAgICAoW2tleSwgdmFsdWVdKSA9PiBgJHtrZXl9OiAke3ZhbHVlfWAsXG4gICAgKTtcblxuICAgIGNvbnN0IGZyb250bWF0dGVyQmxvY2sgPSBgLS0tXFxuJHtmcm9udG1hdHRlckxpbmVzLmpvaW4oXCJcXG5cIil9XFxuLS0tYDtcblxuICAgIC8vIFByZXNlcnZlIGxlYWRpbmcgbmV3bGluZSBpZiBvcmlnaW5hbCBjb250ZW50IHN0YXJ0cyB3aXRoIG9uZVxuICAgIGNvbnN0IHNlcGFyYXRvciA9IGNvbnRlbnQuc3RhcnRzV2l0aChcIlxcblwiKSA/IFwiXCIgOiBcIlxcblwiO1xuICAgIHJldHVybiBgJHtmcm9udG1hdHRlckJsb2NrfSR7c2VwYXJhdG9yfSR7Y29udGVudH1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBwcm9wZXJ0eSB2YWx1ZSBmcm9tIGZyb250bWF0dGVyIGNvbnRlbnQuXG4gICAqXG4gICAqIEBwYXJhbSBmcm9udG1hdHRlckNvbnRlbnQgLSBGcm9udG1hdHRlciBjb250ZW50ICh3aXRob3V0IC0tLSBkZWxpbWl0ZXJzKVxuICAgKiBAcGFyYW0gcHJvcGVydHkgLSBQcm9wZXJ0eSBuYW1lXG4gICAqIEByZXR1cm5zIFByb3BlcnR5IHZhbHVlIG9yIG51bGwgaWYgbm90IGZvdW5kXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgdmFsdWUgPSBzZXJ2aWNlLmdldFByb3BlcnR5VmFsdWUoXG4gICAqICAgJ2ZvbzogYmFyXFxuc3RhdHVzOiBkcmFmdCcsXG4gICAqICAgJ3N0YXR1cydcbiAgICogKTtcbiAgICogLy8gdmFsdWUgPT09ICdkcmFmdCdcbiAgICogYGBgXG4gICAqL1xuICBnZXRQcm9wZXJ0eVZhbHVlKFxuICAgIGZyb250bWF0dGVyQ29udGVudDogc3RyaW5nLFxuICAgIHByb3BlcnR5OiBzdHJpbmcsXG4gICk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IHByb3BlcnR5UmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgYCR7dGhpcy5lc2NhcGVSZWdleChwcm9wZXJ0eSl9OlxcXFxzKiguKikkYCxcbiAgICAgIFwibVwiLFxuICAgICk7XG4gICAgY29uc3QgbWF0Y2ggPSBmcm9udG1hdHRlckNvbnRlbnQubWF0Y2gocHJvcGVydHlSZWdleCk7XG4gICAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0udHJpbSgpIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFc2NhcGUgc3BlY2lhbCByZWdleCBjaGFyYWN0ZXJzIGluIHByb3BlcnR5IG5hbWVzLlxuICAgKlxuICAgKiBIYW5kbGVzIHByb3BlcnR5IG5hbWVzIHdpdGggc3BlY2lhbCBjaGFyYWN0ZXJzIGxpa2UgZG90cywgdW5kZXJzY29yZXMsIGV0Yy5cbiAgICpcbiAgICogQHBhcmFtIHN0ciAtIFN0cmluZyB0byBlc2NhcGVcbiAgICogQHJldHVybnMgRXNjYXBlZCBzdHJpbmcgc2FmZSBmb3IgdXNlIGluIFJlZ0V4cFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBlc2NhcGVSZWdleChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIH1cbn1cbiJdfQ==