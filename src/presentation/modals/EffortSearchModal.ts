import { App, Modal, Setting, TextComponent } from "obsidian";

interface EffortItem {
  fileName: string;
  label: string;
  path: string;
}

export class EffortSearchModal extends Modal {
  private efforts: EffortItem[];
  private filteredEfforts: EffortItem[];
  private onSelect: (effort: EffortItem) => void;
  private searchInput: TextComponent;
  private resultsContainer: HTMLElement;

  constructor(
    app: App,
    efforts: EffortItem[],
    onSelect: (effort: EffortItem) => void,
  ) {
    super(app);
    this.efforts = efforts;
    this.filteredEfforts = efforts.slice(0, 10);
    this.onSelect = onSelect;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Select Effort" });

    new Setting(contentEl).setName("Search").addText((text) => {
      this.searchInput = text;
      text
        .setPlaceholder("Type to search...")
        .onChange((value) => this.handleSearch(value));
    });

    this.resultsContainer = contentEl.createDiv();
    this.renderResults();
    this.searchInput.inputEl.focus();
  }

  private handleSearch(value: string) {
    if (!value) {
      this.filteredEfforts = this.efforts.slice(0, 10);
    } else {
      const term = value.toLowerCase();
      this.filteredEfforts = this.efforts
        .filter((e) => fuzzyMatch(term, e.label.toLowerCase()))
        .slice(0, 10);
    }
    this.renderResults();
  }

  private renderResults() {
    this.resultsContainer.empty();
    if (this.filteredEfforts.length === 0) {
      this.resultsContainer.createEl("div", { text: "No results" });
      return;
    }
    for (const effort of this.filteredEfforts) {
      const item = this.resultsContainer.createEl("div", {
        text: effort.label,
        cls: "search-result-item",
      });
      item.addEventListener("click", () => {
        this.onSelect(effort);
        this.close();
      });
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

function fuzzyMatch(pattern: string, text: string): boolean {
  pattern = pattern.toLowerCase();
  text = text.toLowerCase();
  let patternIdx = 0;
  let textIdx = 0;

  while (patternIdx < pattern.length && textIdx < text.length) {
    if (pattern[patternIdx] === text[textIdx]) {
      patternIdx++;
    }
    textIdx++;
  }
  return patternIdx === pattern.length;
}

export type { EffortItem };
