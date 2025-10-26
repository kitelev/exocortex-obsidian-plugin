/**
 * DateFormatter Utility
 *
 * Centralized date formatting utilities to eliminate code duplication.
 * Follows DRY principle by providing reusable date formatting functions.
 *
 * @module infrastructure/utilities
 * @since 1.0.0
 */
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
export class DateFormatter {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0ZUZvcm1hdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkRhdGVGb3JtYXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0dBUUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F1Qkc7QUFDSCxNQUFNLE9BQU8sYUFBYTtJQUN4Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW1CRztJQUNILE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFVO1FBQ2hDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNoQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0QsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDcEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFM0QsT0FBTyxHQUFHLElBQUksSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLEtBQUssSUFBSSxPQUFPLElBQUksT0FBTyxFQUFFLENBQUM7SUFDbEUsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW9CRztJQUNILE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBVTtRQUM5QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDaEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNELE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRXBELE9BQU8sTUFBTSxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxNQUFNLENBQUMsZ0JBQWdCO1FBQ3JCLE9BQU8sYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7O09BZ0JHO0lBQ0gsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFVO1FBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNoQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0QsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFcEQsT0FBTyxHQUFHLElBQUksSUFBSSxLQUFLLElBQUksR0FBRyxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BbUJHO0lBQ0gsTUFBTSxDQUFDLGFBQWEsQ0FBQyxRQUFnQjtRQUNuQywyQkFBMkI7UUFDM0IsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFckQsbUNBQW1DO1FBQ25DLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUMzRCxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQVUsRUFBRSxJQUFZO1FBQ3JDLE1BQU0sTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBVyxFQUFFLEtBQVc7UUFDdkMsT0FBTyxDQUNMLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQzNDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxLQUFLLENBQUMsUUFBUSxFQUFFO1lBQ3JDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQ3BDLENBQUM7SUFDSixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERhdGVGb3JtYXR0ZXIgVXRpbGl0eVxuICpcbiAqIENlbnRyYWxpemVkIGRhdGUgZm9ybWF0dGluZyB1dGlsaXRpZXMgdG8gZWxpbWluYXRlIGNvZGUgZHVwbGljYXRpb24uXG4gKiBGb2xsb3dzIERSWSBwcmluY2lwbGUgYnkgcHJvdmlkaW5nIHJldXNhYmxlIGRhdGUgZm9ybWF0dGluZyBmdW5jdGlvbnMuXG4gKlxuICogQG1vZHVsZSBpbmZyYXN0cnVjdHVyZS91dGlsaXRpZXNcbiAqIEBzaW5jZSAxLjAuMFxuICovXG5cbi8qKlxuICogVXRpbGl0eSBjbGFzcyBmb3IgY29uc2lzdGVudCBkYXRlIGZvcm1hdHRpbmcgYWNyb3NzIHRoZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBQcm92aWRlcyBzdGFuZGFyZGl6ZWQgZm9ybWF0cyBmb3I6XG4gKiAtIElTTyA4NjAxIGxvY2FsIHRpbWVzdGFtcHMgKGZvciBmcm9udG1hdHRlciBtZXRhZGF0YSlcbiAqIC0gT2JzaWRpYW4gd2lraWxpbmsgZGF0ZSBmb3JtYXQgKGZvciBkYXRlIHJlZmVyZW5jZXMpXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gKlxuICogLy8gRm9yIHRpbWVzdGFtcCBtZXRhZGF0YVxuICogY29uc3QgdGltZXN0YW1wID0gRGF0ZUZvcm1hdHRlci50b0xvY2FsVGltZXN0YW1wKG5vdyk7XG4gKiAvLyBcIjIwMjUtMTAtMjRUMTQ6MzA6NDVcIlxuICpcbiAqIC8vIEZvciBkYXRlIHdpa2lsaW5rc1xuICogY29uc3Qgd2lraWxpbmsgPSBEYXRlRm9ybWF0dGVyLnRvRGF0ZVdpa2lsaW5rKG5vdyk7XG4gKiAvLyBcIltbMjAyNS0xMC0yNF1dXCJcbiAqXG4gKiAvLyBHZXQgY3VycmVudCBkYXRlIGFzIHdpa2lsaW5rXG4gKiBjb25zdCB0b2RheSA9IERhdGVGb3JtYXR0ZXIuZ2V0VG9kYXlXaWtpbGluaygpO1xuICogLy8gXCJbWzIwMjUtMTAtMjRdXVwiXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIERhdGVGb3JtYXR0ZXIge1xuICAvKipcbiAgICogRm9ybWF0IGRhdGUgdG8gbG9jYWwgdGltZXN0YW1wIHN0cmluZyBpbiBJU08gODYwMSBmb3JtYXQgKHdpdGhvdXQgdGltZXpvbmUpLlxuICAgKlxuICAgKiBGb3JtYXQ6IGBZWVlZLU1NLUREVEhIOk1NOlNTYFxuICAgKlxuICAgKiBVc2VkIGZvciBmcm9udG1hdHRlciBwcm9wZXJ0aWVzIGxpa2U6XG4gICAqIC0gYGVtc19fRWZmb3J0X2NyZWF0ZWRgXG4gICAqIC0gYGVtc19fRWZmb3J0X21vZGlmaWVkYFxuICAgKiAtIGBlbXNfX0VmZm9ydF9hcmNoaXZlZGBcbiAgICpcbiAgICogQHBhcmFtIGRhdGUgLSBEYXRlIG9iamVjdCB0byBmb3JtYXRcbiAgICogQHJldHVybnMgSVNPIDg2MDEgbG9jYWwgdGltZXN0YW1wIHN0cmluZ1xuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgnMjAyNS0xMC0yNFQxNDozMDo0NVonKTtcbiAgICogY29uc3QgdGltZXN0YW1wID0gRGF0ZUZvcm1hdHRlci50b0xvY2FsVGltZXN0YW1wKGRhdGUpO1xuICAgKiAvLyBcIjIwMjUtMTAtMjRUMTQ6MzA6NDVcIlxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyB0b0xvY2FsVGltZXN0YW1wKGRhdGU6IERhdGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbW9udGggPSBTdHJpbmcoZGF0ZS5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgIGNvbnN0IGRheSA9IFN0cmluZyhkYXRlLmdldERhdGUoKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgIGNvbnN0IGhvdXJzID0gU3RyaW5nKGRhdGUuZ2V0SG91cnMoKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBTdHJpbmcoZGF0ZS5nZXRNaW51dGVzKCkpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBjb25zdCBzZWNvbmRzID0gU3RyaW5nKGRhdGUuZ2V0U2Vjb25kcygpKS5wYWRTdGFydCgyLCBcIjBcIik7XG5cbiAgICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tJHtkYXl9VCR7aG91cnN9OiR7bWludXRlc306JHtzZWNvbmRzfWA7XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IGRhdGUgdG8gT2JzaWRpYW4gd2lraWxpbmsgZm9ybWF0IChxdW90ZWQpLlxuICAgKlxuICAgKiBGb3JtYXQ6IGBcIltbWVlZWS1NTS1ERF1dXCJgXG4gICAqXG4gICAqIFVzZWQgZm9yIGZyb250bWF0dGVyIHByb3BlcnRpZXMgbGlrZTpcbiAgICogLSBgZW1zX19FZmZvcnRfZGF5YCAoZGFpbHkgbm90ZSByZWZlcmVuY2UpXG4gICAqIC0gYHBuX19EYWlseU5vdGVfZGF5YCAoZGFpbHkgbm90ZSBkYXRlKVxuICAgKlxuICAgKiBOb3RlOiBSZXR1cm5zIHF1b3RlZCBzdHJpbmcgcmVhZHkgZm9yIFlBTUwgZnJvbnRtYXR0ZXIuXG4gICAqXG4gICAqIEBwYXJhbSBkYXRlIC0gRGF0ZSBvYmplY3QgdG8gZm9ybWF0XG4gICAqIEByZXR1cm5zIFF1b3RlZCB3aWtpbGluayBzdHJpbmdcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBkYXRlID0gbmV3IERhdGUoJzIwMjUtMTAtMjRUMTQ6MzA6NDVaJyk7XG4gICAqIGNvbnN0IHdpa2lsaW5rID0gRGF0ZUZvcm1hdHRlci50b0RhdGVXaWtpbGluayhkYXRlKTtcbiAgICogLy8gXCJbWzIwMjUtMTAtMjRdXVwiXG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIHRvRGF0ZVdpa2lsaW5rKGRhdGU6IERhdGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbW9udGggPSBTdHJpbmcoZGF0ZS5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgIGNvbnN0IGRheSA9IFN0cmluZyhkYXRlLmdldERhdGUoKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuXG4gICAgcmV0dXJuIGBcIltbJHt5ZWFyfS0ke21vbnRofS0ke2RheX1dXVwiYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCBkYXRlIGFzIHdpa2lsaW5rIGZvcm1hdC5cbiAgICpcbiAgICogQ29udmVuaWVuY2UgbWV0aG9kIGVxdWl2YWxlbnQgdG8gYHRvRGF0ZVdpa2lsaW5rKG5ldyBEYXRlKCkpYC5cbiAgICpcbiAgICogQHJldHVybnMgVG9kYXkncyBkYXRlIGFzIHF1b3RlZCB3aWtpbGlua1xuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHRvZGF5ID0gRGF0ZUZvcm1hdHRlci5nZXRUb2RheVdpa2lsaW5rKCk7XG4gICAqIC8vIFwiW1syMDI1LTEwLTI0XV1cIlxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBnZXRUb2RheVdpa2lsaW5rKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIERhdGVGb3JtYXR0ZXIudG9EYXRlV2lraWxpbmsobmV3IERhdGUoKSk7XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IGRhdGUgdG8gc2ltcGxlIGRhdGUgc3RyaW5nIChubyBicmFja2V0cywgbm8gcXVvdGVzKS5cbiAgICpcbiAgICogRm9ybWF0OiBgWVlZWS1NTS1ERGBcbiAgICpcbiAgICogVXNlZCBmb3IgZ2VuZXJhdGluZyBkZWZhdWx0IGxhYmVscyBvciBzaW1wbGUgZGF0ZSBmb3JtYXR0aW5nLlxuICAgKlxuICAgKiBAcGFyYW0gZGF0ZSAtIERhdGUgb2JqZWN0IHRvIGZvcm1hdFxuICAgKiBAcmV0dXJucyBTaW1wbGUgZGF0ZSBzdHJpbmdcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBkYXRlID0gbmV3IERhdGUoJzIwMjUtMTAtMjRUMTQ6MzA6NDVaJyk7XG4gICAqIGNvbnN0IGRhdGVTdHIgPSBEYXRlRm9ybWF0dGVyLnRvRGF0ZVN0cmluZyhkYXRlKTtcbiAgICogLy8gXCIyMDI1LTEwLTI0XCJcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgdG9EYXRlU3RyaW5nKGRhdGU6IERhdGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbW9udGggPSBTdHJpbmcoZGF0ZS5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgIGNvbnN0IGRheSA9IFN0cmluZyhkYXRlLmdldERhdGUoKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuXG4gICAgcmV0dXJuIGAke3llYXJ9LSR7bW9udGh9LSR7ZGF5fWA7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2Ugd2lraWxpbmsgZm9ybWF0IGJhY2sgdG8gZGF0ZSBzdHJpbmcgKHdpdGhvdXQgcXVvdGVzKS5cbiAgICpcbiAgICogRXh0cmFjdHMgZGF0ZSBmcm9tIGBcIltbWVlZWS1NTS1ERF1dXCJgIG9yIGBbW1lZWVktTU0tRERdXWAgZm9ybWF0LlxuICAgKlxuICAgKiBAcGFyYW0gd2lraWxpbmsgLSBXaWtpbGluayBzdHJpbmcgKHdpdGggb3Igd2l0aG91dCBxdW90ZXMpXG4gICAqIEByZXR1cm5zIERhdGUgc3RyaW5nIGluIFlZWVktTU0tREQgZm9ybWF0LCBvciBudWxsIGlmIGludmFsaWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBkYXRlMSA9IERhdGVGb3JtYXR0ZXIucGFyc2VXaWtpbGluaygnXCJbWzIwMjUtMTAtMjRdXVwiJyk7XG4gICAqIC8vIFwiMjAyNS0xMC0yNFwiXG4gICAqXG4gICAqIGNvbnN0IGRhdGUyID0gRGF0ZUZvcm1hdHRlci5wYXJzZVdpa2lsaW5rKCdbWzIwMjUtMTAtMjRdXScpO1xuICAgKiAvLyBcIjIwMjUtMTAtMjRcIlxuICAgKlxuICAgKiBjb25zdCBpbnZhbGlkID0gRGF0ZUZvcm1hdHRlci5wYXJzZVdpa2lsaW5rKCdpbnZhbGlkJyk7XG4gICAqIC8vIG51bGxcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgcGFyc2VXaWtpbGluayh3aWtpbGluazogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgLy8gUmVtb3ZlIHF1b3RlcyBpZiBwcmVzZW50XG4gICAgY29uc3QgY2xlYW5lZCA9IHdpa2lsaW5rLnJlcGxhY2UoL15bXCInXXxbXCInXSQvZywgXCJcIik7XG5cbiAgICAvLyBFeHRyYWN0IGRhdGUgZnJvbSBbW1lZWVktTU0tRERdXVxuICAgIGNvbnN0IG1hdGNoID0gY2xlYW5lZC5tYXRjaCgvXFxbXFxbKFxcZHs0fS1cXGR7Mn0tXFxkezJ9KVxcXVxcXS8pO1xuICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgZGF5cyB0byBhIGRhdGUgYW5kIHJldHVybiBuZXcgZGF0ZS5cbiAgICpcbiAgICogQHBhcmFtIGRhdGUgLSBTdGFydGluZyBkYXRlXG4gICAqIEBwYXJhbSBkYXlzIC0gTnVtYmVyIG9mIGRheXMgdG8gYWRkIChuZWdhdGl2ZSBmb3Igc3VidHJhY3Rpb24pXG4gICAqIEByZXR1cm5zIE5ldyBkYXRlIG9iamVjdCB3aXRoIGRheXMgYWRkZWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCcyMDI1LTEwLTI0Jyk7XG4gICAqIGNvbnN0IHRvbW9ycm93ID0gRGF0ZUZvcm1hdHRlci5hZGREYXlzKHRvZGF5LCAxKTtcbiAgICogY29uc3QgeWVzdGVyZGF5ID0gRGF0ZUZvcm1hdHRlci5hZGREYXlzKHRvZGF5LCAtMSk7XG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIGFkZERheXMoZGF0ZTogRGF0ZSwgZGF5czogbnVtYmVyKTogRGF0ZSB7XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IERhdGUoZGF0ZSk7XG4gICAgcmVzdWx0LnNldERhdGUocmVzdWx0LmdldERhdGUoKSArIGRheXMpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdHdvIGRhdGVzIGFyZSBvbiB0aGUgc2FtZSBkYXkgKGlnbm9yaW5nIHRpbWUpLlxuICAgKlxuICAgKiBAcGFyYW0gZGF0ZTEgLSBGaXJzdCBkYXRlXG4gICAqIEBwYXJhbSBkYXRlMiAtIFNlY29uZCBkYXRlXG4gICAqIEByZXR1cm5zIFRydWUgaWYgZGF0ZXMgYXJlIG9uIHNhbWUgZGF5XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgbW9ybmluZyA9IG5ldyBEYXRlKCcyMDI1LTEwLTI0VDA4OjAwOjAwJyk7XG4gICAqIGNvbnN0IGV2ZW5pbmcgPSBuZXcgRGF0ZSgnMjAyNS0xMC0yNFQyMDowMDowMCcpO1xuICAgKiBjb25zdCBpc1NhbWVEYXkgPSBEYXRlRm9ybWF0dGVyLmlzU2FtZURheShtb3JuaW5nLCBldmVuaW5nKTtcbiAgICogLy8gdHJ1ZVxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBpc1NhbWVEYXkoZGF0ZTE6IERhdGUsIGRhdGUyOiBEYXRlKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIGRhdGUxLmdldEZ1bGxZZWFyKCkgPT09IGRhdGUyLmdldEZ1bGxZZWFyKCkgJiZcbiAgICAgIGRhdGUxLmdldE1vbnRoKCkgPT09IGRhdGUyLmdldE1vbnRoKCkgJiZcbiAgICAgIGRhdGUxLmdldERhdGUoKSA9PT0gZGF0ZTIuZ2V0RGF0ZSgpXG4gICAgKTtcbiAgfVxufVxuIl19