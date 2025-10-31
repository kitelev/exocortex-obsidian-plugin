export declare class MetadataHelpers {
  static findAllReferencingProperties(
    metadata: Record<string, any>,
    currentFileName: string,
  ): string[];
  static findReferencingProperty(
    metadata: Record<string, any>,
    currentFileName: string,
  ): string | undefined;
  static containsReference(value: any, fileName: string): boolean;
  static isAssetArchived(metadata: Record<string, any>): boolean;
  static getPropertyValue(
    relation: {
      title: string;
      created: number;
      modified: number;
      path: string;
      metadata?: Record<string, any>;
    },
    propertyName: string,
  ): any;
  static ensureQuoted(value: string): string;
  static buildFileContent(
    frontmatter: Record<string, any>,
    bodyContent?: string,
  ): string;
}
//# sourceMappingURL=MetadataHelpers.d.ts.map
