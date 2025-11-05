import { App, TFile, EventRef } from "obsidian";
import { InMemoryTripleStore, NoteToRDFConverter } from "@exocortex/core";
import { ObsidianVaultAdapter } from "../adapters/ObsidianVaultAdapter";

export class VaultRDFIndexer {
  private tripleStore: InMemoryTripleStore;
  private converter: NoteToRDFConverter;
  private vaultAdapter: ObsidianVaultAdapter;
  private isInitialized = false;
  private eventRefs: EventRef[] = [];

  constructor(private app: App) {
    this.tripleStore = new InMemoryTripleStore();
    this.vaultAdapter = new ObsidianVaultAdapter(
      app.vault,
      app.metadataCache,
      app
    );
    this.converter = new NoteToRDFConverter(this.vaultAdapter);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const triples = await this.converter.convertVault();
    await this.tripleStore.addAll(triples);

    this.registerEventListeners();

    this.isInitialized = true;
  }

  private registerEventListeners(): void {
    this.eventRefs.push(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile) {
          this.updateFile(file).catch((error) => {
            console.error(`Failed to update file ${file.path}:`, error);
          });
        }
      })
    );

    this.eventRefs.push(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile) {
          this.removeFile(file).catch((error) => {
            console.error(`Failed to remove file ${file.path}:`, error);
          });
        }
      })
    );

    this.eventRefs.push(
      this.app.vault.on("create", (file) => {
        if (file instanceof TFile) {
          this.updateFile(file).catch((error) => {
            console.error(`Failed to add file ${file.path}:`, error);
          });
        }
      })
    );

    this.eventRefs.push(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof TFile) {
          this.renameFile(file, oldPath).catch((error) => {
            console.error(`Failed to rename file ${file.path}:`, error);
          });
        }
      })
    );
  }

  async updateFile(file: TFile): Promise<void> {
    if (file.extension !== "md") {
      return;
    }

    await this.removeFileTriples(file.path);

    const triples = await this.converter.convertNote(file as any);
    await this.tripleStore.addAll(triples);
  }

  async removeFile(file: TFile): Promise<void> {
    await this.removeFileTriples(file.path);
  }

  async renameFile(file: TFile, oldPath: string): Promise<void> {
    await this.removeFileTriples(oldPath);
    await this.updateFile(file);
  }

  private async removeFileTriples(filePath: string): Promise<void> {
    const fileIRI = `obsidian://vault/${encodeURIComponent(filePath)}`;
    const triples = await this.tripleStore.match(fileIRI as any);
    await this.tripleStore.removeAll(triples);
  }

  async refresh(): Promise<void> {
    await this.tripleStore.clear();
    const triples = await this.converter.convertVault();
    await this.tripleStore.addAll(triples);
  }

  getTripleStore(): InMemoryTripleStore {
    return this.tripleStore;
  }

  dispose(): void {
    for (const ref of this.eventRefs) {
      this.app.vault.offref(ref);
    }
    this.eventRefs = [];
    this.isInitialized = false;
  }
}
