export class Plugin {
  app: App;
  manifest: any;
  
  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }
  
  async loadData(): Promise<any> {
    return {};
  }
  
  async saveData(data: any): Promise<void> {}
  
  addCommand(command: any): void {}
  
  addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => void): HTMLElement {
    const el = document.createElement('div');
    el.addClass = jest.fn();
    return el;
  }
  
  addSettingTab(settingTab: any): void {}
  
  registerInterval(interval: number): number {
    return interval;
  }
}

export class Modal {
  app: App;
  contentEl: HTMLElement;
  
  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
  }
  
  open(): void {}
  close(): void {}
  onOpen(): void {}
  onClose(): void {}
}

export class PluginSettingTab {
  app: App;
  containerEl: HTMLElement;
  
  constructor(app: App, plugin: any) {
    this.app = app;
    this.containerEl = document.createElement('div');
  }
  
  display(): void {}
  hide(): void {}
}

export class Setting {
  containerEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.nameEl = document.createElement('div');
    this.descEl = document.createElement('div');
  }
  
  setName(name: string): this {
    return this;
  }
  
  setDesc(desc: string): this {
    return this;
  }
  
  addText(cb: (text: TextComponent) => void): this {
    cb(new TextComponent(this.containerEl));
    return this;
  }
  
  addTextArea(cb: (text: TextAreaComponent) => void): this {
    cb(new TextAreaComponent(this.containerEl));
    return this;
  }
  
  addToggle(cb: (toggle: ToggleComponent) => void): this {
    cb(new ToggleComponent(this.containerEl));
    return this;
  }
  
  addButton(cb: (button: ButtonComponent) => void): this {
    cb(new ButtonComponent(this.containerEl));
    return this;
  }
  
  addDropdown(cb: (dropdown: DropdownComponent) => void): this {
    cb(new DropdownComponent(this.containerEl));
    return this;
  }
}

export class TextComponent {
  containerEl: HTMLElement;
  inputEl: HTMLInputElement;
  
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.inputEl = document.createElement('input');
  }
  
  setPlaceholder(placeholder: string): this {
    return this;
  }
  
  setValue(value: string): this {
    this.inputEl.value = value;
    return this;
  }
  
  onChange(callback: (value: string) => void): this {
    return this;
  }
}

export class TextAreaComponent {
  containerEl: HTMLElement;
  inputEl: HTMLTextAreaElement;
  
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.inputEl = document.createElement('textarea');
  }
  
  setPlaceholder(placeholder: string): this {
    return this;
  }
  
  setValue(value: string): this {
    this.inputEl.value = value;
    return this;
  }
  
  onChange(callback: (value: string) => void): this {
    return this;
  }
}

export class ToggleComponent {
  containerEl: HTMLElement;
  toggleEl: HTMLElement;
  
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.toggleEl = document.createElement('input');
  }
  
  setValue(value: boolean): this {
    return this;
  }
  
  onChange(callback: (value: boolean) => void): this {
    return this;
  }
}

export class ButtonComponent {
  containerEl: HTMLElement;
  buttonEl: HTMLButtonElement;
  
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.buttonEl = document.createElement('button');
  }
  
  setButtonText(text: string): this {
    return this;
  }
  
  setCta(): this {
    return this;
  }
  
  onClick(callback: () => void): this {
    return this;
  }
}

export class DropdownComponent {
  containerEl: HTMLElement;
  selectEl: HTMLSelectElement;
  
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.selectEl = document.createElement('select');
  }
  
  addOption(value: string, display: string): this {
    return this;
  }
  
  setValue(value: string): this {
    this.selectEl.value = value;
    return this;
  }
  
  onChange(callback: (value: string) => void): this {
    return this;
  }
}

export class Notice {
  constructor(message: string) {}
}

export class MarkdownView {
  previewMode: {
    rerender: (force: boolean) => void;
  };
  
  constructor() {
    this.previewMode = {
      rerender: jest.fn()
    };
  }
}

export class TFile {
  path: string;
  basename: string;
  extension: string;
  
  constructor(path: string) {
    this.path = path;
    this.basename = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    this.extension = path.split('.').pop() || '';
  }
}

export class WorkspaceLeaf {
  view: any;
  
  constructor() {
    this.view = null;
  }
  
  openFile(file: TFile): Promise<void> {
    return Promise.resolve();
  }
}

export class App {
  vault: Vault;
  workspace: Workspace;
  metadataCache: MetadataCache;
  
  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
    this.metadataCache = new MetadataCache();
  }
}

export class Vault {
  getFiles(): TFile[] {
    return [];
  }
  
  getAbstractFileByPath(path: string): TFile | null {
    return null;
  }
  
  create(path: string, content: string): Promise<TFile> {
    return Promise.resolve(new TFile(path));
  }
}

export class Workspace {
  getActiveFile(): TFile | null {
    return null;
  }
  
  getLeaf(): WorkspaceLeaf {
    return new WorkspaceLeaf();
  }
  
  iterateAllLeaves(callback: (leaf: WorkspaceLeaf) => void): void {}
}

export class MetadataCache {
  getFileCache(file: TFile): any {
    return null;
  }
  
  getBacklinksForFile(file: TFile): any {
    return null;
  }
}

export interface Editor {}