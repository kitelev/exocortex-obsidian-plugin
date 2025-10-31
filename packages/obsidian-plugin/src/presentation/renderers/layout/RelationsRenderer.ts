import { TFile, Keymap } from "obsidian";
import React from "react";
import { ReactRenderer } from "../../utils/ReactRenderer";
import { MetadataHelpers } from "@exocortex/core";
import { AssetRelationsTableWithToggle } from "../../components/AssetRelationsTable";
import { BacklinksCacheManager } from "../../../adapters/caching/BacklinksCacheManager";
import { ExocortexSettings } from "../../../domain/settings/ExocortexSettings";
import { AssetMetadataService } from "./helpers/AssetMetadataService";
import { AssetRelation } from "./types";
import { BlockerHelpers } from "../../utils/BlockerHelpers";

type ObsidianApp = any;

export interface UniversalLayoutConfig {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  showProperties?: string[];
}

export class RelationsRenderer {
  constructor(
    private app: ObsidianApp,
    private settings: ExocortexSettings,
    private plugin: any,
    private reactRenderer: ReactRenderer,
    private backlinksCacheManager: BacklinksCacheManager,
    private metadataService: AssetMetadataService,
    private refresh: () => Promise<void>,
  ) {}

  async getAssetRelations(
    file: TFile,
    config: UniversalLayoutConfig,
  ): Promise<AssetRelation[]> {
    const relations: AssetRelation[] = [];
    const cache = this.app.metadataCache;

    const backlinks = this.backlinksCacheManager.getBacklinks(file.path);
    if (!backlinks) {
      return relations;
    }

    for (const sourcePath of backlinks) {
      const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
      if (sourceFile instanceof TFile) {
        const fileCache = cache.getFileCache(sourceFile);
        const metadata = fileCache?.frontmatter || {};

        const isArchived = MetadataHelpers.isAssetArchived(metadata);

        if (isArchived && !this.settings.showArchivedAssets) {
          continue;
        }

        const referencingProperties =
          MetadataHelpers.findAllReferencingProperties(metadata, file.basename);

        const enrichedMetadata = { ...metadata };
        const resolvedLabel = this.metadataService.getAssetLabel(sourcePath);
        if (resolvedLabel) {
          enrichedMetadata.exo__Asset_label = resolvedLabel;
        }

        const isBlocked = BlockerHelpers.isEffortBlocked(this.app, metadata);

        if (referencingProperties.length > 0) {
          for (const propertyName of referencingProperties) {
            const relation: AssetRelation = {
              file: sourceFile,
              path: sourcePath,
              title: sourceFile.basename,
              metadata: enrichedMetadata,
              propertyName: propertyName,
              isBodyLink: false,
              isArchived: isArchived,
              isBlocked: isBlocked,
              created: sourceFile.stat.ctime,
              modified: sourceFile.stat.mtime,
            };
            relations.push(relation);
          }
        } else {
          const relation: AssetRelation = {
            file: sourceFile,
            path: sourcePath,
            title: sourceFile.basename,
            metadata: enrichedMetadata,
            propertyName: undefined,
            isBodyLink: true,
            isArchived: isArchived,
            isBlocked: isBlocked,
            created: sourceFile.stat.ctime,
            modified: sourceFile.stat.mtime,
          };
          relations.push(relation);
        }
      }
    }

    if (config.sortBy) {
      const sortBy = config.sortBy;
      relations.sort((a, b) => {
        const aVal = MetadataHelpers.getPropertyValue(a, sortBy);
        const bVal = MetadataHelpers.getPropertyValue(b, sortBy);
        const order = config.sortOrder === "desc" ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
    }

    return relations;
  }

  async render(
    el: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    if (relations.length === 0) {
      return;
    }

    const container = el.createDiv({ cls: "exocortex-assets-relations" });

    this.reactRenderer.render(
      container,
      React.createElement(AssetRelationsTableWithToggle, {
        relations,
        groupByProperty: true,
        sortBy: config.sortBy || "title",
        sortOrder: config.sortOrder || "asc",
        showProperties: config.showProperties || [],
        groupSpecificProperties: {
          ems__Effort_parent: ["ems__Effort_status"],
          ems__Effort_area: ["ems__Effort_status"],
        },
        showEffortVotes: this.settings.showEffortVotes,
        onToggleEffortVotes: async () => {
          this.settings.showEffortVotes = !this.settings.showEffortVotes;
          await this.plugin.saveSettings();
          await this.refresh();
        },
        onAssetClick: async (path: string, event: React.MouseEvent) => {
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
        getAssetLabel: (path: string) => this.metadataService.getAssetLabel(path),
      }),
    );
  }
}
