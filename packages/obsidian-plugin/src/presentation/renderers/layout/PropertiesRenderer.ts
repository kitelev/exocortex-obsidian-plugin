import { TFile, Keymap } from "obsidian";
import React from "react";
import { ReactRenderer } from "../../utils/ReactRenderer";
import { MetadataExtractor } from "@exocortex/core";
import { AssetPropertiesTable } from "../../components/AssetPropertiesTable";
import { AssetMetadataService } from "./helpers/AssetMetadataService";

type ObsidianApp = any;

export class PropertiesRenderer {
  constructor(
    private app: ObsidianApp,
    private reactRenderer: ReactRenderer,
    private metadataExtractor: MetadataExtractor,
    private metadataService: AssetMetadataService,
  ) {}

  async render(el: HTMLElement, file: TFile): Promise<void> {
    const metadata = this.metadataExtractor.extractMetadata(file);

    if (Object.keys(metadata).length === 0) {
      return;
    }

    const container = el.createDiv({ cls: "exocortex-properties-section" });

    this.reactRenderer.render(
      container,
      React.createElement(AssetPropertiesTable, {
        metadata,
        onLinkClick: async (path: string, event: React.MouseEvent) => {
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
