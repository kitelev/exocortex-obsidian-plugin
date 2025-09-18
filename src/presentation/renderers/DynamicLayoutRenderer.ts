import { MarkdownPostProcessorContext, TFile, TAbstractFile } from "obsidian";
import {
  BaseAssetRelationsRenderer,
  AssetRelation,
} from "./BaseAssetRelationsRenderer";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";

/**
 * Layout configuration specific to DynamicLayout
 */
interface DynamicLayoutConfig {
  relationsToShow: string[];
}

/**
 * DynamicLayoutRenderer - Filters relations based on ui__ClassLayout configuration
 * Extends BaseAssetRelationsRenderer for consistent display with UniversalLayout
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles filtered relation display
 * - Open/Closed: Extends base class without modifying it
 * - Liskov Substitution: Can be used wherever IViewRenderer is expected
 * - Dependency Inversion: Depends on abstractions (base class)
 */
export class DynamicLayoutRenderer extends BaseAssetRelationsRenderer {
  private logger: ILogger;

  constructor(app: any) {
    super(app);
    this.logger = LoggerFactory.create("DynamicLayoutRenderer");
  }
  /**
   * Main render method - implements the abstract method from base class
   */
  async render(
    source: string,
    container: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    try {
      // Get current file
      const file = this.getCurrentFile(ctx);
      if (!file) {
        this.renderError(container, "Unable to determine current file");
        return;
      }

      // Get metadata
      const metadata = this.getFileMetadata(file);

      // Get asset class
      const className = this.getAssetClass(metadata);
      if (!className) {
        this.renderError(
          container,
          "Unable to determine asset class. Please ensure exo__Instance_class is defined.",
        );
        return;
      }

      // Find layout configuration (now checks defaultLayout first)
      this.logger.debug(
        `DynamicLayout: Looking for ClassLayout for class: ${className}`,
      );

      // Special case: If viewing a class file itself (exo__Instance_class === "exo__Class"),
      // use the current file's metadata as the class metadata
      let classMetadata = metadata;

      // Only fetch the class file if we're not viewing the class definition itself
      if (className !== "exo__Class") {
        // Need to load the class file to get its metadata
        const classFile = await this.findClassFile(className);
        if (classFile) {
          classMetadata = this.getFileMetadata(classFile);
        } else {
          classMetadata = {};
        }
      }

      const layoutConfig = await this.findLayoutConfiguration(
        className,
        classMetadata,
      );
      if (!layoutConfig) {
        // Fallback to UniversalLayout with informational message
        const message = `There is no specific Layout for class [[${className}]] - UniversalLayout will be used`;
        this.renderMessage(container, message);

        // Render UniversalLayout content
        this.logger.debug(
          `DynamicLayout: Falling back to UniversalLayout for class: ${className}`,
        );
        await this.renderAllRelations(file, container);
        return;
      }
      this.logger.debug(
        `DynamicLayout: Found ClassLayout for ${className}`,
        { layoutConfig },
      );

      // Check if relations are configured
      if (
        !layoutConfig.relationsToShow ||
        layoutConfig.relationsToShow.length === 0
      ) {
        this.renderMessage(container, "No relations configured to display");
        return;
      }

      // Check for "all" or "*" to show everything
      if (
        layoutConfig.relationsToShow.includes("*") ||
        layoutConfig.relationsToShow.includes("all")
      ) {
        await this.renderAllRelations(file, container);
        return;
      }

      // Render filtered relations
      await this.renderFilteredRelations(file, container, layoutConfig);
    } catch (error) {
      this.logger.error("DynamicLayout rendering error", { error });
      this.renderError(container, "Failed to render DynamicLayout", error);
    }
  }

  /**
   * Get asset class from metadata
   */
  private getAssetClass(metadata: Record<string, any>): string | null {
    const instanceClass = metadata?.exo__Instance_class;
    if (!instanceClass) return null;

    if (Array.isArray(instanceClass)) {
      return this.extractBasename(instanceClass[0]);
    }

    if (typeof instanceClass === "string") {
      return this.extractBasename(instanceClass);
    }

    return null;
  }

  /**
   * Find layout configuration for a given class
   * First checks for defaultLayout property, then falls back to search
   */
  private async findLayoutConfiguration(
    className: string,
    classMetadata?: Record<string, any>,
  ): Promise<DynamicLayoutConfig | null> {
    try {
      // PERFORMANCE OPTIMIZATION: Check for defaultLayout property first
      if (classMetadata) {
        const defaultLayoutRef = this.extractDefaultLayout(classMetadata);
        if (defaultLayoutRef) {
          this.logger.debug(
            `DynamicLayout: Found defaultLayout reference: ${defaultLayoutRef}`,
          );
          const layoutConfig = await this.findLayoutByUUID(defaultLayoutRef);
          if (layoutConfig) {
            this.logger.debug(
              `DynamicLayout: Successfully loaded layout via defaultLayout property`,
            );
            return layoutConfig;
          }
          this.logger.debug(
            `DynamicLayout: defaultLayout UUID not found, falling back to search`,
          );
        }
      }

      // FALLBACK: Original search logic
      const vault = this.app.vault;
      const files = vault.getMarkdownFiles();

      for (const file of files) {
        const metadata = this.getFileMetadata(file);
        if (!metadata) continue;

        const instanceClass = metadata.exo__Instance_class;
        if (!this.isLayoutClass(instanceClass)) continue;

        // Debug: Log ClassLayout files found
        this.logger.debug(`DynamicLayout: Found ClassLayout file: ${file.path}`);

        // Try to determine which class this layout is for
        // 1. Check ui__ClassLayout property (exact class name)
        // 2. Check ui__ClassLayout_for property (explicit declaration)
        // 3. Extract from filename patterns: "Layout - ClassName" or "ClassLayout - ClassName"
        let layoutFor =
          metadata.ui__ClassLayout || metadata.ui__ClassLayout_for;

        if (!layoutFor) {
          // Extract class name from filename
          const basename = file.basename;
          if (basename.startsWith("ClassLayout - ")) {
            layoutFor = basename.replace("ClassLayout - ", "");
          } else if (basename.startsWith("Layout - ")) {
            layoutFor = basename.replace("Layout - ", "");
          } else if (basename.includes(" - ")) {
            // Handle other patterns like "UI ClassLayout - ClassName"
            const parts = basename.split(" - ");
            if (parts.length === 2) {
              layoutFor = parts[1];
            }
          }
        }

        // Clean up the extracted class name (remove wiki links if present)
        if (layoutFor) {
          layoutFor = this.extractBasename(layoutFor);
        }

        if (layoutFor === className) {
          const relationsToShow = this.parseRelationsToShow(
            metadata.ui__ClassLayout_relationsToShow,
          );
          return { relationsToShow };
        }
      }

      return null;
    } catch (error) {
      this.logger.error("Error finding layout configuration", { error });
      return null;
    }
  }

  /**
   * Check if a class is ui__ClassLayout
   */
  private isLayoutClass(instanceClass: any): boolean {
    if (!instanceClass) return false;

    const classNames = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];

    return classNames.some(
      (cls) => this.extractBasename(cls) === "ui__ClassLayout",
    );
  }

  /**
   * Parse relationsToShow property into array of property names
   */
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

  /**
   * Render all relations without filtering
   */
  private async renderAllRelations(
    file: TFile,
    container: HTMLElement,
  ): Promise<void> {
    const relations = await this.collectAllRelations(file);
    const groupedRelations = this.groupRelationsByProperty(relations);
    this.renderGroupedRelations(container, groupedRelations);
  }

  /**
   * Render filtered relations based on configuration
   */
  private async renderFilteredRelations(
    file: TFile,
    container: HTMLElement,
    layoutConfig: DynamicLayoutConfig,
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

  /**
   * Filter relations to only include specified properties
   */
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

  /**
   * Order groups according to configuration
   */
  private orderGroupsByConfig(
    groups: Map<string, AssetRelation[]>,
    configOrder: string[],
  ): Map<string, AssetRelation[]> {
    const orderedGroups = new Map<string, AssetRelation[]>();

    // Add groups in the order specified in config
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
      } else {
        // Check both normalized and original property names
        if (groups.has(normalizedProp)) {
          orderedGroups.set(normalizedProp, groups.get(normalizedProp)!);
        } else if (groups.has(prop)) {
          orderedGroups.set(prop, groups.get(prop)!);
        }
      }
    }

    // Add any remaining groups not in config
    for (const [key, value] of groups) {
      if (!orderedGroups.has(key)) {
        orderedGroups.set(key, value);
      }
    }

    return orderedGroups;
  }

  /**
   * Find the class file by name
   */
  private async findClassFile(className: string): Promise<TFile | null> {
    // First try direct path
    let file = this.app.vault.getAbstractFileByPath(`${className}.md`) as TFile;
    if (file) return file;

    // Try common directories
    const searchPaths = [
      `02 Ontology/1 Exo/exo/Class/${className}.md`,
      `02 Ontology/2 Custom/ems/${className}.md`,
      `02 Ontology/${className}.md`,
    ];

    for (const path of searchPaths) {
      file = this.app.vault.getAbstractFileByPath(path) as TFile;
      if (file) return file;
    }

    // Fallback to search
    const files = this.app.vault.getMarkdownFiles();
    for (const f of files) {
      if (f.basename === className) {
        const cache = this.app.metadataCache.getFileCache(f);
        if (cache?.frontmatter?.exo__Instance_class === "exo__Class") {
          return f;
        }
      }
    }

    return null;
  }

  /**
   * Extract defaultLayout property from class metadata
   * Handles various property naming conventions
   */
  private extractDefaultLayout(metadata: Record<string, any>): string | null {
    // Check multiple possible property names
    const possibleProps = [
      "exo__Class_defaultLayout",
      "defaultLayout",
      "ui__defaultLayout",
    ];

    for (const prop of possibleProps) {
      if (metadata[prop]) {
        return this.extractBasename(metadata[prop]);
      }
    }

    // Check for class-specific defaultLayout pattern
    const instanceClass = metadata.exo__Instance_class;
    if (instanceClass) {
      const className = this.extractBasename(instanceClass);
      const classSpecificProp = `${className}_defaultLayout`;
      if (metadata[classSpecificProp]) {
        return this.extractBasename(metadata[classSpecificProp]);
      }
    }

    return null;
  }

  /**
   * Find layout configuration by UUID - O(1) direct lookup
   * Checks both filename and frontmatter UID
   */
  private async findLayoutByUUID(
    uuid: string,
  ): Promise<DynamicLayoutConfig | null> {
    try {
      const vault = this.app.vault;

      // First try direct filename lookup
      const directFile = vault.getAbstractFileByPath(`${uuid}.md`);
      if (directFile && directFile instanceof TFile) {
        const metadata = this.getFileMetadata(directFile as TFile);
        if (metadata && this.isLayoutClass(metadata.exo__Instance_class)) {
          const relationsToShow = this.parseRelationsToShow(
            metadata.ui__ClassLayout_relationsToShow,
          );
          return { relationsToShow };
        }
      }

      // Also check in Inbox folder
      const inboxFile = vault.getAbstractFileByPath(`01 Inbox/${uuid}.md`);
      if (inboxFile && inboxFile instanceof TFile) {
        const metadata = this.getFileMetadata(inboxFile as TFile);
        if (metadata && this.isLayoutClass(metadata.exo__Instance_class)) {
          const relationsToShow = this.parseRelationsToShow(
            metadata.ui__ClassLayout_relationsToShow,
          );
          return { relationsToShow };
        }
      }

      // Search by UID in frontmatter (still optimized - single pass)
      const files = vault.getMarkdownFiles();
      for (const file of files) {
        const metadata = this.getFileMetadata(file);
        if (!metadata) continue;

        // Check if this is a ClassLayout and has matching UID
        if (
          this.isLayoutClass(metadata.exo__Instance_class) &&
          (metadata.exo__Asset_uid === uuid ||
            metadata.uid === uuid ||
            file.basename === uuid)
        ) {
          const relationsToShow = this.parseRelationsToShow(
            metadata.ui__ClassLayout_relationsToShow,
          );
          return { relationsToShow };
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error finding layout by UUID ${uuid}`, { error });
      return null;
    }
  }
}
