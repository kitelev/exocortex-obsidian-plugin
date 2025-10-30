import { TFile } from "obsidian";
import { ILogger } from "../../adapters/logging/ILogger";
import { MetadataExtractor } from "@exocortex/core";
import { DateFormatter } from "@exocortex/core";

type ObsidianApp = any;

/**
 * Renderer for daily note navigation links (previous/next day).
 * 
 * Renders navigation links at the top of DailyNote layouts to allow
 * quick navigation between consecutive days.
 */
export class DailyNavigationRenderer {
  private logger: ILogger;
  private metadataExtractor: MetadataExtractor;

  constructor(
    _app: ObsidianApp,
    logger: ILogger,
    metadataExtractor: MetadataExtractor,
  ) {
    this.logger = logger;
    this.metadataExtractor = metadataExtractor;
  }

  /**
   * Render navigation links for a DailyNote.
   * Only renders if the file is a DailyNote with a valid day property.
   */
  public render(el: HTMLElement, file: TFile): void {
    const metadata = this.metadataExtractor.extractMetadata(file);
    const instanceClass = this.metadataExtractor.extractInstanceClass(metadata);

    // Check if this is a DailyNote
    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const isDailyNote = classes.some(
      (c: string | null) => c === "[[pn__DailyNote]]" || c === "pn__DailyNote",
    );

    if (!isDailyNote) {
      return;
    }

    // Extract the day property
    const dayProperty = metadata.pn__DailyNote_day;
    if (!dayProperty) {
      this.logger.debug("No pn__DailyNote_day found for daily note");
      return;
    }

    // Parse the date from the wikilink format
    const dateStr = DateFormatter.parseWikilink(String(dayProperty));
    
    if (!dateStr) {
      this.logger.debug("Could not parse date from pn__DailyNote_day");
      return;
    }

    const currentDate = new Date(dateStr);
    
    // Validate the date is valid
    if (isNaN(currentDate.getTime())) {
      this.logger.debug("Invalid date parsed from pn__DailyNote_day");
      return;
    }

    // Calculate previous and next dates
    const prevDate = DateFormatter.addDays(currentDate, -1);
    const nextDate = DateFormatter.addDays(currentDate, 1);
    
    // Format dates for links (remove quotes from wikilink format)
    const prevLink = DateFormatter.toDateString(prevDate);
    const nextLink = DateFormatter.toDateString(nextDate);
    
    // Create navigation container
    const navContainer = el.createDiv({
      cls: "exocortex-daily-navigation",
    });
    
    // Previous day link
    const prevSpan = navContainer.createSpan({ cls: "exocortex-nav-prev" });
    prevSpan.createEl("a", {
      text: `← ${prevLink}`,
      cls: "internal-link",
      attr: { "data-href": prevLink },
    });
    
    // Next day link
    const nextSpan = navContainer.createSpan({ cls: "exocortex-nav-next" });
    nextSpan.createEl("a", {
      text: `${nextLink} →`,
      cls: "internal-link",
      attr: { "data-href": nextLink },
    });

    this.logger.debug(`Rendered daily navigation for ${dateStr}`);
  }
}
