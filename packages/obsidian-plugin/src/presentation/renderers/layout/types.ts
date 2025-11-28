export interface AssetRelationFile {
  path: string;
  basename: string;
}

export interface AssetRelation {
  file: AssetRelationFile;
  path: string;
  title: string;
  metadata: Record<string, any>;
  propertyName?: string;
  isBodyLink: boolean;
  isArchived?: boolean;
  isBlocked?: boolean;
  created: number;
  modified: number;
}
