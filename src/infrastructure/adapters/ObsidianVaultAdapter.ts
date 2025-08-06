import { Vault, MetadataCache, TFile } from 'obsidian';
import { IVaultAdapter } from '../../application/ports/IVaultAdapter';

/**
 * Adapter for Obsidian Vault API
 * Implements the IVaultAdapter interface using Obsidian's Vault
 */
export class ObsidianVaultAdapter implements IVaultAdapter {
  constructor(
    private readonly vault: Vault,
    private readonly metadataCache: MetadataCache
  ) {}

  async create(path: string, content: string): Promise<void> {
    await this.vault.create(path, content);
  }

  async read(path: string): Promise<string> {
    const file = this.vault.getAbstractFileByPath(path);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${path}`);
    }
    return await this.vault.read(file);
  }

  async update(path: string, content: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(path);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${path}`);
    }
    await this.vault.modify(file, content);
  }

  async delete(path: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(path);
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }
    await this.vault.delete(file);
  }

  async exists(path: string): Promise<boolean> {
    const file = this.vault.getAbstractFileByPath(path);
    return file !== null;
  }

  async list(pattern?: string): Promise<string[]> {
    const files = this.vault.getFiles();
    if (!pattern) {
      return files.map(f => f.path);
    }
    
    // Simple pattern matching (could be enhanced with glob)
    const regex = new RegExp(pattern);
    return files
      .filter(f => regex.test(f.path))
      .map(f => f.path);
  }

  async getMetadata(path: string): Promise<Record<string, any> | null> {
    const file = this.vault.getAbstractFileByPath(path);
    if (!file || !(file instanceof TFile)) {
      return null;
    }
    
    const cache = this.metadataCache.getFileCache(file);
    return cache?.frontmatter || null;
  }
}