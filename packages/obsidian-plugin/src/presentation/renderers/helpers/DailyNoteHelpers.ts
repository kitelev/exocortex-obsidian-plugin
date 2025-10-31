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
}
