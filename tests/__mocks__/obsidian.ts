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
  
  registerEvent(event: any): void {}
  
  registerInterval(interval: number): number {
    return interval;
  }
  
  registerMarkdownCodeBlockProcessor(language: string, handler: Function): void {
    // Mock implementation for SPARQL processor registration
    // Store the handler for potential testing
    (this as any).codeBlockProcessor = handler;
  }

  registerMarkdownPostProcessor(processor: Function): void {
    (this as any).markdownPostProcessor = processor;
  }

  registerView(type: string, viewCreator: Function): void {
    (this as any).registeredViews = (this as any).registeredViews || {};
    (this as any).registeredViews[type] = viewCreator;
  }

  addStatusBarItem(): HTMLElement {
    return document.createElement('div');
  }

  async onload(): Promise<void> {
    // Override in actual plugin
  }
  
  async onunload(): Promise<void> {
    // Override in actual plugin
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
  
  constructor(path?: string) {
    this.path = path || '';
    this.basename = path ? (path.split('/').pop()?.replace(/\.[^/.]+$/, '') || '') : '';
    this.extension = path ? (path.split('.').pop() || '') : '';
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
  private mockFiles: TFile[] = [];

  getFiles(): TFile[] {
    return this.mockFiles;
  }

  getMarkdownFiles(): TFile[] {
    return this.mockFiles.filter(file => file.extension === 'md');
  }
  
  getAbstractFileByPath(path: string): TFile | null {
    return this.mockFiles.find(file => file.path === path) || null;
  }
  
  create(path: string, content: string): Promise<TFile> {
    const file = new TFile(path);
    this.mockFiles.push(file);
    return Promise.resolve(file);
  }

  async read(file: TFile | string): Promise<string> {
    if (typeof file === 'string') {
      // Mock reading by path
      return Promise.resolve('Mock file content');
    }
    // Mock reading from TFile
    return Promise.resolve('Mock file content');
  }

  async modify(file: TFile, content: string): Promise<void> {
    // Mock file modification
    return Promise.resolve();
  }

  async delete(file: TFile): Promise<void> {
    const index = this.mockFiles.indexOf(file);
    if (index > -1) {
      this.mockFiles.splice(index, 1);
    }
    return Promise.resolve();
  }

  async exists(path: string): Promise<boolean> {
    return this.mockFiles.some(file => file.path === path);
  }
  
  on(event: string, callback: any): any {
    return { event, callback };
  }

  // Helper method for testing
  __addMockFile(path: string, content?: string): TFile {
    const file = new TFile(path);
    this.mockFiles.push(file);
    return file;
  }

  // Helper method to clear mock files for tests
  __clearMockFiles(): void {
    this.mockFiles = [];
  }
}

export class Workspace {
  private activeFile: TFile | null = null;
  private leaves: WorkspaceLeaf[] = [];

  getActiveFile(): TFile | null {
    return this.activeFile;
  }
  
  getLeaf(newLeaf?: boolean): WorkspaceLeaf {
    if (newLeaf || this.leaves.length === 0) {
      const leaf = new WorkspaceLeaf();
      this.leaves.push(leaf);
      return leaf;
    }
    return this.leaves[0];
  }
  
  iterateAllLeaves(callback: (leaf: WorkspaceLeaf) => void): void {
    this.leaves.forEach(callback);
  }

  getActiveViewOfType<T>(type: any): T | null {
    return null;
  }

  openLinkText(linkText: string, sourcePath: string): void {
    // Mock implementation for opening links
  }

  on(name: string, callback: Function): void {
    // Mock event listener
  }

  off(name: string, callback: Function): void {
    // Mock event listener removal
  }

  trigger(name: string, ...data: any[]): void {
    // Mock event triggering
  }

  // Helper method for testing
  __setActiveFile(file: TFile | null): void {
    this.activeFile = file;
  }
}

export class MetadataCache {
  private cache: Map<string, any> = new Map();

  getFileCache(file: TFile): any {
    return this.cache.get(file.path) || {
      frontmatter: {},
      sections: [],
      headings: [],
      links: [],
      embeds: [],
      tags: []
    };
  }
  
  getBacklinksForFile(file: TFile): any {
    return {
      data: new Map(),
      count: () => 0,
      keys: () => []
    };
  }

  getFrontmatterPropertyValue(file: TFile, property: string): any {
    const cache = this.getFileCache(file);
    return cache.frontmatter?.[property];
  }

  on(name: string, callback: Function): void {
    // Mock event listener
  }

  off(name: string, callback: Function): void {
    // Mock event listener removal
  }

  // Helper method for testing
  __setFileCache(path: string, cache: any): void {
    this.cache.set(path, cache);
  }

  // Helper method to clear cache for tests
  __clearCache(): void {
    this.cache.clear();
  }
}

export interface Editor {}

export interface MarkdownPostProcessorContext {
  sourcePath: string;
  frontmatter?: any;
  addChild(component: any): void;
  getSectionInfo(el: HTMLElement): any;
}

// Additional commonly used types and interfaces
export interface FileSystemAdapter {
  path: {
    join(...paths: string[]): string;
    dirname(path: string): string;
    basename(path: string): string;
  };
}

export class Component {
  load(): void {}
  onload(): void {}
  unload(): void {}
  onunload(): void {}
  addChild<T extends Component>(component: T): T {
    return component;
  }
  removeChild<T extends Component>(component: T): T {
    return component;
  }
}

export class MarkdownRenderer {
  static renderMarkdown(markdown: string, el: HTMLElement, sourcePath: string, component: Component): Promise<void> {
    el.innerHTML = markdown;
    return Promise.resolve();
  }
}

export class FileManager {
  generateMarkdownLink(file: TFile, sourcePath: string): string {
    return `[[${file.basename}]]`;
  }
}

// Mock normalizePath function
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

// Mock requestUrl function
export function requestUrl(request: { url: string; [key: string]: any }): Promise<any> {
  return Promise.resolve({
    status: 200,
    json: {},
    text: '',
    arrayBuffer: new ArrayBuffer(0)
  });
}

// Mock debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): T {
  return func; // Simplified mock - just return the function as-is for testing
}

// Mock moment if needed
export const moment = {
  now: () => Date.now(),
  unix: (timestamp: number) => ({
    format: (format?: string) => new Date(timestamp * 1000).toISOString()
  })
};