import { App, MarkdownPostProcessorContext, TFile, TFolder } from "obsidian";
import { IViewRenderer } from "../processors/CodeBlockProcessor";

interface AssetRelation {
  file: TFile;
  path: string;
  title: string;
  metadata: Record<string, any>;
  propertyName?: string;
  isBodyLink: boolean;
  created: number;
  modified: number;
}

interface LayoutConfiguration {
  relationsToShow: string[];
}

export class DynamicLayoutRenderer implements IViewRenderer {
  constructor(private app: App) {}

  async render(
    source: string,
    container: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    try {
      // Get the current file from context
      const file = this.app.metadataCache.getFirstLinkpathDest(
        ctx.sourcePath,
        "",
      );

      if (!file || !(file instanceof TFile)) {
        this.renderError(container, "Unable to determine current file");
        return;
      }

      // Get metadata for the current file
      const cache = this.app.metadataCache.getFileCache(file);
      const metadata = cache?.frontmatter || {};

      const className = this.getAssetClass(metadata);
      if (!className) {
        this.renderError(
          container,
          "Unable to determine asset class. Please ensure exo__Instance_class is defined.",
        );
        return;
      }

      const layoutConfig = await this.findLayoutConfiguration(className);
      if (!layoutConfig) {
        this.renderError(
          container,
          `No ui__ClassLayout found for class: ${className}`,
          `Please create a ui__ClassLayout asset for the ${className} class to configure which relations to display.`,
        );
        return;
      }

      if (
        !layoutConfig.relationsToShow ||
        layoutConfig.relationsToShow.length === 0
      ) {
        this.renderMessage(container, "No relations configured to display");
        return;
      }

      if (
        layoutConfig.relationsToShow.includes("*") ||
        layoutConfig.relationsToShow.includes("all")
      ) {
        await this.renderAllRelations(file, metadata, container);
        return;
      }

      await this.renderFilteredRelations(
        file,
        metadata,
        container,
        layoutConfig,
      );
    } catch (error) {
      console.error("DynamicLayout rendering error:", error);
      this.renderError(container, "Failed to render DynamicLayout", error);
    }
  }

  private getAssetClass(metadata: Record<string, any>): string | null {
    const instanceClass = metadata?.exo__Instance_class;
    if (!instanceClass) return null;

    if (Array.isArray(instanceClass)) {
      const className = instanceClass[0];
      return this.extractBasename(className);
    }

    if (typeof instanceClass === "string") {
      return this.extractBasename(instanceClass);
    }

    return null;
  }

  private extractBasename(value: string): string {
    return (
      value.replace(/^\[\[/, "").replace(/\]\]$/, "").split("/").pop() || value
    );
  }

  private async findLayoutConfiguration(
    className: string,
  ): Promise<LayoutConfiguration | null> {
    try {
      const vault = this.app.vault;
      const files = vault.getMarkdownFiles();

      for (const file of files) {
        const cache = this.app.metadataCache.getFileCache(file);
        const frontmatter = cache?.frontmatter;

        if (!frontmatter) continue;

        const instanceClass = frontmatter.exo__Instance_class;
        const isLayoutClass = this.isLayoutClass(instanceClass);

        if (isLayoutClass) {
          const layoutFor =
            frontmatter.ui__ClassLayout_for ||
            file.basename.replace("Layout - ", "");

          if (layoutFor === className) {
            const relationsToShow = this.parseRelationsToShow(
              frontmatter.ui__ClassLayout_relationsToShow,
            );
            return { relationsToShow };
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error finding layout configuration:", error);
      return null;
    }
  }

  private isLayoutClass(instanceClass: any): boolean {
    if (!instanceClass) return false;

    const classNames = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];

    return classNames.some(
      (cls) => this.extractBasename(cls) === "ui__ClassLayout",
    );
  }

  private parseRelationsToShow(value: any): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.map((v) => this.extractBasename(String(v)));
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((v) => this.extractBasename(v.trim()))
        .filter((v) => v);
    }

    return [];
  }

  private async renderAllRelations(
    file: TFile,
    metadata: Record<string, any>,
    container: HTMLElement,
  ): Promise<void> {
    const relations = await this.collectAllRelations(file);
    const groupedRelations = this.groupRelationsByProperty(relations);
    this.renderGroupedRelations(container, groupedRelations);
  }

  private async renderFilteredRelations(
    file: TFile,
    metadata: Record<string, any>,
    container: HTMLElement,
    layoutConfig: LayoutConfiguration,
  ): Promise<void> {
    const allRelations = await this.collectAllRelations(file);
    const filteredRelations = this.filterRelations(
      allRelations,
      layoutConfig.relationsToShow,
    );
    const groupedRelations = this.groupRelationsByProperty(filteredRelations);

    const orderedGroups = this.orderGroupsByConfig(
      groupedRelations,
      layoutConfig.relationsToShow,
    );

    this.renderGroupedRelations(container, orderedGroups);
  }

  private async collectAllRelations(file: TFile): Promise<AssetRelation[]> {
    const relations: AssetRelation[] = [];
    const cache = this.app.metadataCache;
    const resolvedLinks = cache.resolvedLinks;

    for (const sourcePath in resolvedLinks) {
      const links = resolvedLinks[sourcePath];
      if (links && links[file.path]) {
        const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
        if (sourceFile instanceof TFile) {
          const fileCache = cache.getFileCache(sourceFile);
          const metadata = fileCache?.frontmatter || {};

          const propertyName = this.findReferencingProperty(
            metadata,
            file.basename,
            file.path,
          );

          const relation: AssetRelation = {
            file: sourceFile,
            path: sourcePath,
            title: sourceFile.basename,
            metadata,
            propertyName,
            isBodyLink: !propertyName,
            created: sourceFile.stat.ctime,
            modified: sourceFile.stat.mtime,
          };

          relations.push(relation);
        }
      }
    }

    return relations.sort((a, b) => b.modified - a.modified);
  }

  private findReferencingProperty(
    metadata: Record<string, any>,
    targetBasename: string,
    targetPath: string,
  ): string | undefined {
    for (const [key, value] of Object.entries(metadata)) {
      if (!value) continue;

      const valueStr = String(value);
      if (
        valueStr.includes(`[[${targetBasename}]]`) ||
        valueStr.includes(`[[${targetPath}]]`) ||
        valueStr.includes(`[[${targetPath.replace(".md", "")}]]`)
      ) {
        return key;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          const itemStr = String(item);
          if (
            itemStr.includes(`[[${targetBasename}]]`) ||
            itemStr.includes(`[[${targetPath}]]`) ||
            itemStr.includes(`[[${targetPath.replace(".md", "")}]]`)
          ) {
            return key;
          }
        }
      }
    }

    return undefined;
  }

  private filterRelations(
    relations: AssetRelation[],
    propertiesToShow: string[],
  ): AssetRelation[] {
    const normalizedProps = propertiesToShow.map((p) => p.toLowerCase());
    const includeBody =
      normalizedProps.includes("body") ||
      normalizedProps.includes("untyped") ||
      normalizedProps.includes("untyped relations");

    return relations.filter((relation) => {
      if (relation.isBodyLink) {
        return includeBody;
      }

      if (!relation.propertyName) {
        return false;
      }

      return propertiesToShow.some(
        (prop) =>
          prop === relation.propertyName ||
          this.extractBasename(prop) === relation.propertyName,
      );
    });
  }

  private groupRelationsByProperty(
    relations: AssetRelation[],
  ): Map<string, AssetRelation[]> {
    const groups = new Map<string, AssetRelation[]>();

    for (const relation of relations) {
      const key = relation.propertyName || "Untyped Relations";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(relation);
    }

    return groups;
  }

  private orderGroupsByConfig(
    groups: Map<string, AssetRelation[]>,
    configOrder: string[],
  ): Map<string, AssetRelation[]> {
    const orderedGroups = new Map<string, AssetRelation[]>();

    for (const prop of configOrder) {
      const normalizedProp = this.extractBasename(prop);

      if (
        normalizedProp === "body" ||
        normalizedProp === "untyped" ||
        normalizedProp === "untyped relations"
      ) {
        if (groups.has("Untyped Relations")) {
          orderedGroups.set(
            "Untyped Relations",
            groups.get("Untyped Relations")!,
          );
        }
      } else if (groups.has(normalizedProp)) {
        orderedGroups.set(normalizedProp, groups.get(normalizedProp)!);
      } else if (groups.has(prop)) {
        orderedGroups.set(prop, groups.get(prop)!);
      }
    }

    for (const [key, value] of groups) {
      if (!orderedGroups.has(key)) {
        orderedGroups.set(key, value);
      }
    }

    return orderedGroups;
  }

  private renderGroupedRelations(
    container: HTMLElement,
    groupedRelations: Map<string, AssetRelation[]>,
  ): void {
    if (groupedRelations.size === 0) {
      const noRelationsDiv = container.createDiv({
        cls: "exocortex-no-relations",
      });
      noRelationsDiv.createEl("p", {
        text: "No matching relations found",
        cls: "exocortex-message",
      });
      return;
    }

    const relationsContainer = container.createDiv({
      cls: "exocortex-asset-relations",
    });

    for (const [propertyName, relations] of groupedRelations) {
      const groupDiv = relationsContainer.createDiv({
        cls: "exocortex-relation-group",
      });

      groupDiv.createEl("h2", {
        text: this.formatPropertyName(propertyName),
        cls: "exocortex-relation-group-header",
      });

      const listDiv = groupDiv.createDiv({
        cls: "exocortex-relation-list",
      });

      for (const relation of relations) {
        this.renderRelationItem(listDiv, relation);
      }
    }
  }

  private formatPropertyName(propertyName: string): string {
    if (propertyName === "Untyped Relations") {
      return propertyName;
    }

    return propertyName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private renderRelationItem(
    container: HTMLElement,
    relation: AssetRelation,
  ): void {
    const itemDiv = container.createDiv({
      cls: "exocortex-relation-item",
    });

    const linkEl = itemDiv.createEl("a", {
      text: relation.title,
      cls: "exocortex-relation-link internal-link",
      href: relation.path,
    });

    linkEl.addEventListener("click", (event) => {
      event.preventDefault();
      this.app.workspace.openLinkText(relation.path, "", false);
    });

    const metaDiv = itemDiv.createDiv({
      cls: "exocortex-relation-meta",
    });

    const instanceClass = relation.metadata.exo__Instance_class;
    if (instanceClass) {
      const className = Array.isArray(instanceClass)
        ? this.extractBasename(instanceClass[0])
        : this.extractBasename(instanceClass);

      metaDiv.createSpan({
        text: className,
        cls: "exocortex-relation-class",
      });
    }

    const modifiedDate = new Date(relation.modified);
    metaDiv.createSpan({
      text: this.formatDate(modifiedDate),
      cls: "exocortex-relation-date",
    });
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private renderError(
    container: HTMLElement,
    message: string,
    details?: any,
  ): void {
    const errorDiv = container.createDiv({
      cls: "exocortex-error",
    });

    errorDiv.createEl("h3", {
      text: "⚠️ DynamicLayout Error",
      cls: "exocortex-error-title",
    });

    errorDiv.createEl("p", {
      text: message,
      cls: "exocortex-error-message",
    });

    if (details) {
      errorDiv.createEl("p", {
        text: typeof details === "string" ? details : String(details),
        cls: "exocortex-error-details",
      });
    }
  }

  private renderMessage(container: HTMLElement, message: string): void {
    const messageDiv = container.createDiv({
      cls: "exocortex-message-container",
    });

    messageDiv.createEl("p", {
      text: message,
      cls: "exocortex-info-message",
    });
  }
}
