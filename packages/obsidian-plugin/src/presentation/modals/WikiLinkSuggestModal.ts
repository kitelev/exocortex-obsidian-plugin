import { App, FuzzySuggestModal, TFile } from "obsidian";

export interface WikiLinkSuggestResult {
  file: TFile | null;
  wikiLink: string | null;
}

export class WikiLinkSuggestModal extends FuzzySuggestModal<TFile> {
  private onSelect: (result: WikiLinkSuggestResult) => void;
  private files: TFile[];

  constructor(app: App, onSelect: (result: WikiLinkSuggestResult) => void) {
    super(app);
    this.onSelect = onSelect;
    this.files = this.app.vault.getMarkdownFiles();
    this.setPlaceholder("Search for a file...");
  }

  override getItems(): TFile[] {
    return this.files;
  }

  override getItemText(file: TFile): string {
    return file.basename;
  }

  override onChooseItem(file: TFile, _evt: MouseEvent | KeyboardEvent): void {
    this.onSelect({
      file,
      wikiLink: `"[[${file.basename}]]"`,
    });
  }

  override onNoSuggestion(): void {
    this.onSelect({
      file: null,
      wikiLink: null,
    });
  }
}
