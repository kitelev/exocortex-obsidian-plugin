import { TFile } from "obsidian";

export interface AssetRelation {
  file: TFile;
  path: string;
  title: string;
  metadata: Record<string, any>;
  propertyName?: string;
  isBodyLink: boolean;
  isArchived?: boolean;
  created: number;
  modified: number;
}
