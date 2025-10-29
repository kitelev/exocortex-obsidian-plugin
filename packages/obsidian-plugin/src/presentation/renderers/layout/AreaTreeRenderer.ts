import { TFile, Keymap } from "obsidian";
import React from "react";
import { ReactRenderer } from "../../utils/ReactRenderer";
import { MetadataExtractor, AssetClass, AreaHierarchyBuilder } from "@exocortex/core";
import { AreaHierarchyTree } from "../../components/AreaHierarchyTree";
import { ObsidianVaultAdapter } from "../../../adapters/ObsidianVaultAdapter";
import { AssetMetadataService } from "./helpers/AssetMetadataService";
import { AssetRelation } from "./types";
import { ILogger } from "../../../adapters/logging/ILogger";

type ObsidianApp = any;

export class AreaTreeRenderer {
  constructor(
    private app: ObsidianApp,
    private reactRenderer: ReactRenderer,
    private metadataExtractor: MetadataExtractor,
    private vaultAdapter: ObsidianVaultAdapter,
    private metadataService: AssetMetadataService,
    private logger: ILogger,
  ) {}

  async render(
    el: HTMLElement,
    file: TFile,
    relations: AssetRelation[],
  ): Promise<void> {
    const metadata = this.metadataExtractor.extractMetadata(file);
    const instanceClass = this.metadataService.extractInstanceClass(metadata);

    if (instanceClass !== AssetClass.AREA) {
      return;
    }

    const hierarchyBuilder = new AreaHierarchyBuilder(this.vaultAdapter);
    const tree = hierarchyBuilder.buildHierarchy(file.path, relations);

    if (!tree) {
      return;
    }

    const sectionContainer = el.createDiv({
      cls: "exocortex-area-tree-section",
    });

    sectionContainer.createEl("h3", {
      text: "Area tree",
      cls: "exocortex-section-header",
    });

    const treeContainer = sectionContainer.createDiv({
      cls: "exocortex-area-tree-container",
    });

    this.reactRenderer.render(
      treeContainer,
      React.createElement(AreaHierarchyTree, {
        tree,
        currentAreaPath: file.path,
        onAreaClick: async (path: string, event: React.MouseEvent) => {
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

    this.logger.info(`Rendered Area Tree for ${file.path}`);
  }
}
