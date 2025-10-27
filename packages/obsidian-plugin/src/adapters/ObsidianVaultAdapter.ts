import { Vault, TFile, TFolder, MetadataCache, App } from "obsidian";
import { IVaultAdapter, IFile, IFolder, IFrontmatter } from "@exocortex/core";

export class ObsidianVaultAdapter implements IVaultAdapter {
  private fileCache: WeakMap<IFile, TFile> = new WeakMap();

  constructor(
    private vault: Vault,
    private metadataCache: MetadataCache,
    private app: App
  ) {}

  async read(file: IFile): Promise<string> {
    const obsidianFile = this.toObsidianFile(file);
    return await this.vault.read(obsidianFile);
  }

  async create(path: string, content: string): Promise<IFile> {
    const createdFile = await this.vault.create(path, content);
    return this.fromObsidianFile(createdFile);
  }

  async modify(file: IFile, newContent: string): Promise<void> {
    const obsidianFile = this.toObsidianFile(file);
    await this.vault.modify(obsidianFile, newContent);
  }

  async delete(file: IFile): Promise<void> {
    const obsidianFile = this.toObsidianFile(file);
    await this.vault.delete(obsidianFile);
  }

  async exists(path: string): Promise<boolean> {
    const file = this.vault.getAbstractFileByPath(path);
    return file !== null;
  }

  getAbstractFileByPath(path: string): IFile | IFolder | null {
    const file = this.vault.getAbstractFileByPath(path);
    if (!file) return null;

    if (file instanceof TFile) {
      return this.fromObsidianFile(file);
    }

    if (file instanceof TFolder) {
      return this.fromObsidianFolder(file);
    }

    return null;
  }

  getAllFiles(): IFile[] {
    const markdownFiles = this.vault.getMarkdownFiles();
    return markdownFiles.map(f => this.fromObsidianFile(f));
  }

  getFrontmatter(file: IFile): IFrontmatter | null {
    const obsidianFile = this.toObsidianFile(file);
    const cache = this.metadataCache.getFileCache(obsidianFile);
    return cache?.frontmatter || null;
  }

  async updateFrontmatter(file: IFile, updater: (current: IFrontmatter) => IFrontmatter): Promise<void> {
    const currentFrontmatter = this.getFrontmatter(file) || {};
    const newFrontmatter = updater(currentFrontmatter);

    const obsidianFile = this.toObsidianFile(file);
    await this.app.fileManager.processFrontMatter(obsidianFile, (frontmatter) => {
      Object.keys(newFrontmatter).forEach(key => {
        frontmatter[key] = newFrontmatter[key];
      });
    });
  }

  async rename(file: IFile, newPath: string): Promise<void> {
    const obsidianFile = this.toObsidianFile(file);
    await this.app.fileManager.renameFile(obsidianFile, newPath);
  }

  async createFolder(path: string): Promise<void> {
    await this.vault.createFolder(path);
  }

  getFirstLinkpathDest(linkpath: string, sourcePath: string): IFile | null {
    const file = this.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
    if (!file) return null;
    return this.fromObsidianFile(file);
  }

  async process(file: IFile, fn: (content: string) => string): Promise<string> {
    const obsidianFile = this.toObsidianFile(file);
    return await this.vault.process(obsidianFile, fn);
  }

  private fromObsidianFile(file: TFile): IFile {
    const iFile: IFile = {
      path: file.path,
      basename: file.basename,
      name: file.name,
      parent: file.parent ? this.fromObsidianFolder(file.parent) : null
    };
    this.fileCache.set(iFile, file);
    return iFile;
  }

  private fromObsidianFolder(folder: TFolder): IFolder {
    return {
      path: folder.path,
      name: folder.name
    };
  }

  private toObsidianFile(file: IFile): TFile {
    const cachedFile = this.fileCache.get(file);
    if (cachedFile) {
      return cachedFile;
    }

    const obsidianFile = this.vault.getAbstractFileByPath(file.path);
    if (!obsidianFile || !(obsidianFile instanceof TFile)) {
      throw new Error(`File not found: ${file.path}`);
    }
    return obsidianFile;
  }

  toTFile(file: IFile): TFile {
    return this.toObsidianFile(file);
  }
}
