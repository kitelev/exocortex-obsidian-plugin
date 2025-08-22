import { Result } from "../core/Result";

export interface AssetMetadata {
  readonly path: string;
  readonly frontmatter: Record<string, any>;
  readonly content: string;
  readonly lastModified: Date;
  readonly size: number;
}

export interface AssetReference {
  readonly path: string;
  readonly displayName: string;
  readonly linkType: "internal" | "external" | "embed";
}

export interface IAssetMetadataProvider {
  getMetadata(assetPath: string): Promise<Result<AssetMetadata>>;

  getBacklinks(assetPath: string): Promise<Result<AssetReference[]>>;

  getForwardLinks(assetPath: string): Promise<Result<AssetReference[]>>;

  updateFrontmatter(
    assetPath: string,
    frontmatter: Record<string, any>,
  ): Promise<Result<void>>;

  getAllAssets(): Promise<Result<AssetMetadata[]>>;

  getAssetsByClass(className: string): Promise<Result<AssetMetadata[]>>;

  searchAssets(query: string): Promise<Result<AssetMetadata[]>>;
}
