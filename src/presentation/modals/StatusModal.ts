import { App, Modal } from "obsidian";

export interface ExoDiagnostics {
  activeViews: number;
  cacheSize: number;
  loggerLevel: string;
  performanceThresholdMs: number;
  settings: Record<string, any>;
}

export class StatusModal extends Modal {
  constructor(app: App, private readonly diagnostics: ExoDiagnostics) {
    super(app);
    this.modalEl.addClass("exocortex-status-modal");
    this.titleEl.setText("Exocortex Status");
  }

  onOpen(): void {
    const { contentEl } = this;
    const d = this.diagnostics;

    const list = contentEl.createEl("div", { cls: "exocortex-status" });

    const row = (label: string, value: string) => {
      const item = list.createEl("div", { cls: "exo-row" });
      item.createEl("div", { text: label, cls: "exo-label" });
      item.createEl("div", { text: value, cls: "exo-value" });
    };

    row("Active Views", String(d.activeViews));
    row("Property Cache Size", String(d.cacheSize));
    row("Logger Level", d.loggerLevel);
    row("Performance Threshold", `${d.performanceThresholdMs} ms`);

    const settings = list.createEl("details", { cls: "exo-section" });
    settings.createEl("summary", { text: "Settings Flags" });
    const pre = settings.createEl("pre");
    pre.setText(JSON.stringify(d.settings, null, 2));
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
