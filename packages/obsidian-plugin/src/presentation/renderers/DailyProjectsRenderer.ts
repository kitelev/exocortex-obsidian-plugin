import { TFile, Keymap } from "obsidian";
import { ILogger } from '../../adapters/logging/ILogger';
import { ExocortexSettings } from "../../domain/settings/ExocortexSettings";
import React from "react";
import { ReactRenderer } from "../utils/ReactRenderer";
import { DailyProject, DailyProjectsTable } from "../components/DailyProjectsTable";
import { AssetClass, EffortStatus } from '@exocortex/core';
import { MetadataExtractor } from '@exocortex/core';
import { EffortSortingHelpers } from '@exocortex/core';

 
type ObsidianApp = any;

export class DailyProjectsRenderer {
  private logger: ILogger;
  private app: ObsidianApp;
  private metadataExtractor: MetadataExtractor;
  private reactRenderer: ReactRenderer;
  private getAssetLabelCallback: (path: string) => string | null;

  constructor(
    app: ObsidianApp,
    _settings: ExocortexSettings,
    _plugin: any,
    logger: ILogger,
    metadataExtractor: MetadataExtractor,
    reactRenderer: ReactRenderer,
    _refresh: () => Promise<void>,
    getAssetLabel: (path: string) => string | null,
    _getEffortArea: (metadata: Record<string, unknown>) => string | null,
  ) {
    this.app = app;
    this.logger = logger;
    this.metadataExtractor = metadataExtractor;
    this.reactRenderer = reactRenderer;
    this.getAssetLabelCallback = getAssetLabel;
  }

  public async render(el: HTMLElement, file: TFile): Promise<void> {
    const metadata = this.metadataExtractor.extractMetadata(file);
    const instanceClass = this.metadataExtractor.extractInstanceClass(metadata);

    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const isDailyNote = classes.some(
      (c: string | null) => c === "[[pn__DailyNote]]" || c === "pn__DailyNote",
    );

    if (!isDailyNote) {
      return;
    }

    const dayProperty = metadata.pn__DailyNote_day;
    if (!dayProperty) {
      this.logger.debug("No pn__DailyNote_day found for daily note");
      return;
    }

    const dayMatch =
      typeof dayProperty === "string"
        ? dayProperty.match(/\[\[(.+?)\]\]/)
        : null;
    const day = dayMatch ? dayMatch[1] : String(dayProperty).replace(/^\[\[|\]\]$/g, "");

    const projects = await this.getDailyProjects(day);

    if (projects.length === 0) {
      this.logger.debug(`No projects found for day: ${day}`);
      return;
    }

    const sectionContainer = el.createDiv({ cls: "exocortex-daily-projects-section" });

    sectionContainer.createEl("h3", {
      text: "Projects",
      cls: "exocortex-section-header",
    });

    const tableContainer = sectionContainer.createDiv({ cls: "exocortex-daily-projects-table-container" });

    this.reactRenderer.render(
      tableContainer,
      React.createElement(DailyProjectsTable, {
        projects,
        onProjectClick: async (path: string, event: React.MouseEvent) => {
          const isModPressed = Keymap.isModEvent(
            event.nativeEvent as MouseEvent,
          );

          if (isModPressed) {
            const leaf = this.app.workspace.getLeaf("tab");
            await leaf.openLinkText(path, "");
          } else {
            await this.app.workspace.openLinkText(path, "", false);
          }
        },
        getAssetLabel: (path: string) => this.getAssetLabelCallback(path),
      }),
    );

    this.logger.info(`Rendered ${projects.length} projects for DailyNote: ${day}`);
  }

  private async getDailyProjects(
    day: string,
  ): Promise<DailyProject[]> {
    try {
      const projects: DailyProject[] = [];

      const allFiles = this.app.vault.getMarkdownFiles();

      for (const file of allFiles) {
        const metadata = this.metadataExtractor.extractMetadata(file);

        const effortDay = metadata.ems__Effort_day;

        if (!effortDay) {
          continue;
        }

        const effortDayStr = String(effortDay).replace(/^\[\[|\]\]$/g, "");

        if (effortDayStr !== day) {
          continue;
        }

        const instanceClass = metadata.exo__Instance_class || [];
        const instanceClassArray = Array.isArray(instanceClass)
          ? instanceClass
          : [instanceClass];
        const isProject = instanceClassArray.some(
          (c: string) => String(c).includes(AssetClass.PROJECT),
        );

        if (!isProject) {
          continue;
        }

        const effortStatus = metadata.ems__Effort_status || "";
        const effortStatusStr = String(effortStatus).replace(/^\[\[|\]\]$/g, "");

        const startTimestamp = metadata.ems__Effort_startTimestamp;
        const plannedStartTimestamp = metadata.ems__Effort_plannedStartTimestamp;
        const endTimestamp = metadata.ems__Effort_endTimestamp;
        const plannedEndTimestamp = metadata.ems__Effort_plannedEndTimestamp;

        const formatTime = (timestamp: string | number | null | undefined): string => {
          if (!timestamp) return "";
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) return "";
          return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        };

        const startTime = formatTime(startTimestamp) || formatTime(plannedStartTimestamp);
        const endTime = formatTime(endTimestamp) || formatTime(plannedEndTimestamp);

        const isDone = effortStatusStr === EffortStatus.DONE;
        const isTrashed = effortStatusStr === EffortStatus.TRASHED;

        const label = metadata.exo__Asset_label || file.basename;

        projects.push({
          file: {
            path: file.path,
            basename: file.basename,
          },
          path: file.path,
          title: file.basename,
          label,
          startTime,
          endTime,
          status: effortStatusStr,
          metadata,
          isDone,
          isTrashed,
        });
      }

      projects.sort((a, b) => EffortSortingHelpers.sortByPriority(a, b));

      return projects.slice(0, 50);
    } catch (error) {
      this.logger.error("Failed to get daily projects", { error });
      return [];
    }
  }
}
