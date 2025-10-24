import React from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { GraphCanvas } from "../components/GraphCanvas";
import { ReactRenderer } from "../utils/ReactRenderer";

export const GRAPH_VIEW_TYPE = "exocortex-graph-view";

export class ExocortexGraphView extends ItemView {
  private renderer: ReactRenderer;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: ExocortexPlugin
  ) {
    super(leaf);
    this.renderer = new ReactRenderer();
  }

  getViewType(): string {
    return GRAPH_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Exocortex Graph";
  }

  getIcon(): string {
    return "git-fork";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.classList.add("exocortex-graph-view-container");

    this.renderer.render(
      container as HTMLElement,
      React.createElement(GraphCanvas, {
        app: this.app,
        plugin: this.plugin,
      })
    );
  }

  async onClose(): Promise<void> {
    this.renderer.unmount(this.containerEl.children[1] as HTMLElement);
  }
}
