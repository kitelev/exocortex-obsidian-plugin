import type { App, MetadataCache, TFile } from "obsidian";
import type { GraphData } from "../../domain/models/GraphData";
import type { GraphNode } from "../../domain/models/GraphNode";
import type { GraphEdge } from "../../domain/models/GraphEdge";

export class GraphDataService {
  constructor(
    private app: App,
    private metadataCache: MetadataCache
  ) {}

  buildGraphData(): GraphData {
    const files = this.app.vault.getMarkdownFiles();
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();

    for (const file of files) {
      const cache = this.metadataCache.getFileCache(file);
      const frontmatter = cache?.frontmatter || {};

      const label = this.resolveLabel(file);
      const assetClass = frontmatter.exo__Asset_class;
      const isArchived = this.checkArchived(frontmatter);

      const node: GraphNode = {
        path: file.path,
        title: file.basename,
        label: label || file.basename,
        assetClass,
        isArchived,
      };

      nodes.push(node);
      nodeMap.set(file.path, node);
    }

    for (const file of files) {
      const cache = this.metadataCache.getFileCache(file);
      const links = cache?.links || [];

      for (const link of links) {
        const targetFile = this.metadataCache.getFirstLinkpathDest(link.link, file.path);

        if (targetFile) {
          edges.push({
            source: file.path,
            target: targetFile.path,
            type: "forward-link",
          });
        }
      }
    }

    return { nodes, edges };
  }

  private resolveLabel(file: TFile): string | null {
    const cache = this.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const label = metadata.exo__Asset_label;
    if (label && typeof label === "string" && label.trim() !== "") {
      return label;
    }

    const prototypeRef = metadata.ems__Effort_prototype;
    if (prototypeRef) {
      const prototypePath = typeof prototypeRef === "string"
        ? prototypeRef.replace(/^\[\[|\]\]$/g, "").trim()
        : null;

      if (prototypePath) {
        const prototypeFile = this.metadataCache.getFirstLinkpathDest(prototypePath, "");
        if (prototypeFile && typeof prototypeFile === "object" && "path" in prototypeFile) {
          const prototypeCache = this.metadataCache.getFileCache(prototypeFile as TFile);
          const prototypeMetadata = prototypeCache?.frontmatter || {};
          const prototypeLabel = prototypeMetadata.exo__Asset_label;

          if (prototypeLabel && typeof prototypeLabel === "string" && prototypeLabel.trim() !== "") {
            return prototypeLabel;
          }
        }
      }
    }

    return null;
  }

  private checkArchived(frontmatter: Record<string, unknown>): boolean {
    const archived = frontmatter.exo__Asset_archived;

    if (archived === true || archived === "true") {
      return true;
    }

    if (archived === false || archived === "false") {
      return false;
    }

    const archivedDate = frontmatter.ems__Effort_archived_date;
    if (archivedDate && typeof archivedDate === "string" && archivedDate.trim() !== "") {
      return true;
    }

    return false;
  }
}
