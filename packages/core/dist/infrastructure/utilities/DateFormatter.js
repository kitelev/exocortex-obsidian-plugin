"use strict";
/**
 * DateFormatter Utility
 *
 * Centralized date formatting utilities to eliminate code duplication.
 * Follows DRY principle by providing reusable date formatting functions.
 *
 * @module infrastructure/utilities
 * @since 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateFormatter = void 0;
/**
 * Utility class for consistent date formatting across the application.
 *
 * Provides standardized formats for:
 * - ISO 8601 local timestamps (for frontmatter metadata)
 * - Obsidian wikilink date format (for date references)
 *
 * @example
 * ```typescript
 * const now = new Date();
 *
 * // For timestamp metadata
 * const timestamp = DateFormatter.toLocalTimestamp(now);
 * // "2025-10-24T14:30:45"
 *
 * // For date wikilinks
 * const wikilink = DateFormatter.toDateWikilink(now);
 * // "[[2025-10-24]]"
 *
 * // Get current date as wikilink
 * const today = DateFormatter.getTodayWikilink();
 * // "[[2025-10-24]]"
 * ```
 */
class DateFormatter {
    /**
     * Format date to local timestamp string in ISO 8601 format (without timezone).
     *
     * Format: `YYYY-MM-DDTHH:MM:SS`
     *
     * Used for frontmatter properties like:
     * - `ems__Effort_created`
     * - `ems__Effort_modified`
     * - `ems__Effort_archived`
     *
     * @param date - Date object to format
     * @returns ISO 8601 local timestamp string
     *
     * @example
     * ```typescript
     * const date = new Date('2025-10-24T14:30:45Z');
     * const timestamp = DateFormatter.toLocalTimestamp(date);
     * // "2025-10-24T14:30:45"
     * ```
     */
    static toLocalTimestamp(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    /**
     * Format date to Obsidian wikilink format (quoted).
     *
     * Format: `"[[YYYY-MM-DD]]"`
     *
     * Used for frontmatter properties like:
     * - `ems__Effort_day` (daily note reference)
     * - `pn__DailyNote_day` (daily note date)
     *
     * Note: Returns quoted string ready for YAML frontmatter.
     *
     * @param date - Date object to format
     * @returns Quoted wikilink string
     *
     * @example
     * ```typescript
     * const date = new Date('2025-10-24T14:30:45Z');
     * const wikilink = DateFormatter.toDateWikilink(date);
     * // "[[2025-10-24]]"
     * ```
     */
    static toDateWikilink(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `"[[${year}-${month}-${day}]]"`;
    }
    /**
     * Get current date as wikilink format.
     *
     * Convenience method equivalent to `toDateWikilink(new Date())`.
     *
     * @returns Today's date as quoted wikilink
     *
     * @example
     * ```typescript
     * const today = DateFormatter.getTodayWikilink();
     * // "[[2025-10-24]]"
     * ```
     */
    static getTodayWikilink() {
        return DateFormatter.toDateWikilink(new Date());
    }
    /**
     * Format date to simple date string (no brackets, no quotes).
     *
     * Format: `YYYY-MM-DD`
     *
     * Used for generating default labels or simple date formatting.
     *
     * @param date - Date object to format
     * @returns Simple date string
     *
     * @example
     * ```typescript
     * const date = new Date('2025-10-24T14:30:45Z');
     * const dateStr = DateFormatter.toDateString(date);
     * // "2025-10-24"
     * ```
     */
    static toDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    /**
     * Parse wikilink format back to date string (without quotes).
     *
     * Extracts date from `"[[YYYY-MM-DD]]"` or `[[YYYY-MM-DD]]` format.
     *
     * @param wikilink - Wikilink string (with or without quotes)
     * @returns Date string in YYYY-MM-DD format, or null if invalid
     *
     * @example
     * ```typescript
     * const date1 = DateFormatter.parseWikilink('"[[2025-10-24]]"');
     * // "2025-10-24"
     *
     * const date2 = DateFormatter.parseWikilink('[[2025-10-24]]');
     * // "2025-10-24"
     *
     * const invalid = DateFormatter.parseWikilink('invalid');
     * // null
     * ```
     */
    static parseWikilink(wikilink) {
        // Remove quotes if present
        const cleaned = wikilink.replace(/^["']|["']$/g, "");
        // Extract date from [[YYYY-MM-DD]]
        const match = cleaned.match(/\[\[(\d{4}-\d{2}-\d{2})\]\]/);
        return match ? match[1] : null;
    }
    /**
     * Add days to a date and return new date.
     *
     * @param date - Starting date
     * @param days - Number of days to add (negative for subtraction)
     * @returns New date object with days added
     *
     * @example
     * ```typescript
     * const today = new Date('2025-10-24');
     * const tomorrow = DateFormatter.addDays(today, 1);
     * const yesterday = DateFormatter.addDays(today, -1);
     * ```
     */
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    /**
     * Check if two dates are on the same day (ignoring time).
     *
     * @param date1 - First date
     * @param date2 - Second date
     * @returns True if dates are on same day
     *
     * @example
     * ```typescript
     * const morning = new Date('2025-10-24T08:00:00');
     * const evening = new Date('2025-10-24T20:00:00');
     * const isSameDay = DateFormatter.isSameDay(morning, evening);
     * // true
     * ```
     */
    static isSameDay(date1, date2) {
        return (date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate());
    }
}
exports.DateFormatter = DateFormatter;
