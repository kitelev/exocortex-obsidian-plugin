import { TFile } from "obsidian";
import { ILogger } from "../../../adapters/logging/ILogger";
import { MetadataExtractor } from "@exocortex/core";

export interface DailyNoteInfo {
  isDailyNote: boolean;
  day: string | null;
}

export class DailyNoteHelpers {
  /**
   * Checks if a file is a daily note and extracts the day property
   */
  static extractDailyNoteInfo(
    file: TFile,
    metadataExtractor: MetadataExtractor,
    logger?: ILogger,
  ): DailyNoteInfo {
    const metadata = metadataExtractor.extractMetadata(file);
    const instanceClass = metadataExtractor.extractInstanceClass(metadata);

    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const isDailyNote = classes.some(
      (c: string | null) => c === "[[pn__DailyNote]]" || c === "pn__DailyNote",
    );

    if (!isDailyNote) {
      return { isDailyNote: false, day: null };
    }

    const dayProperty = metadata.pn__DailyNote_day;
    if (!dayProperty) {
      logger?.debug("No pn__DailyNote_day found for daily note");
      return { isDailyNote: true, day: null };
    }

    const dayMatch =
      typeof dayProperty === "string"
        ? dayProperty.match(/\[\[(.+?)\]\]/)
        : null;
    const day = dayMatch
      ? dayMatch[1]
      : String(dayProperty).replace(/^\[\[|\]\]$/g, "");

    return { isDailyNote: true, day };
  }

  static findDailyNoteByDate(
    app: any,
    metadataExtractor: MetadataExtractor,
    dateStr: string,
  ): TFile | null {
    const files = app.vault.getMarkdownFiles();

    for (const file of files) {
      const dailyNoteInfo = this.extractDailyNoteInfo(
        file,
        metadataExtractor,
      );

      if (dailyNoteInfo.isDailyNote && dailyNoteInfo.day === dateStr) {
        return file;
      }
    }

    return null;
  }

  /**
   * Checks if an effort (task/project) should appear in a given day
   * based on timestamp fields falling within day's interval
   *
   * @param metadata - Effort frontmatter metadata
   * @param dayStr - Day string in format "YYYY-MM-DD" (e.g., "2025-11-02")
   * @returns true if ANY timestamp falls within day's 00:00:00 - 23:59:59 interval
   */
  static isEffortInDay(
    metadata: Record<string, unknown>,
    dayStr: string,
  ): boolean {
    // Parse day string to Date (local midnight)
    const dayDate = new Date(dayStr);
    if (isNaN(dayDate.getTime())) {
      return false; // Invalid day format
    }

    // Define day interval (local timezone)
    const dayStart = new Date(dayDate); // Already at 00:00:00.000

    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Collect all timestamp fields
    const timestampFields = [
      metadata.ems__Effort_startTimestamp,
      metadata.ems__Effort_endTimestamp,
      metadata.ems__Effort_plannedStartTimestamp,
      metadata.ems__Effort_plannedEndTimestamp,
    ];

    // Check if ANY timestamp falls within day interval
    for (const timestampValue of timestampFields) {
      if (!timestampValue) continue; // Skip empty fields

      const timestamp = new Date(timestampValue as string | number);
      if (isNaN(timestamp.getTime())) {
        continue; // Skip invalid timestamps
      }

      // Check if timestamp in day interval
      if (timestamp >= dayStart && timestamp <= dayEnd) {
        return true;
      }
    }

    return false; // No timestamps in day interval
  }
}
