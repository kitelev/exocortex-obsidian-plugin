import { App as ObsidianApp } from "obsidian";

export class BacklinksCacheManager {
  private backlinksCache: Map<string, Set<string>> = new Map();
  private cacheValid = false;

  constructor(private app: ObsidianApp) {}

  buildCache(): void {
    if (this.cacheValid) return;

    this.backlinksCache.clear();
    const resolvedLinks = this.app.metadataCache.resolvedLinks;

    for (const sourcePath in resolvedLinks) {
      const links = resolvedLinks[sourcePath];
      for (const targetPath in links) {
        const existingBacklinks = this.backlinksCache.get(targetPath);
        if (!existingBacklinks) {
          this.backlinksCache.set(targetPath, new Set([sourcePath]));
        } else {
          existingBacklinks.add(sourcePath);
        }
      }
    }

    this.cacheValid = true;
  }

  invalidate(): void {
    this.cacheValid = false;
  }

  getBacklinks(targetPath: string): Set<string> | undefined {
    this.buildCache();
    return this.backlinksCache.get(targetPath);
  }

  isValid(): boolean {
    return this.cacheValid;
  }
}
