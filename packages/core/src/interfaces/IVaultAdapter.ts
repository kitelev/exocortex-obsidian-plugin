export interface IFile {
  path: string;
  basename: string;
  name: string;
  parent: IFolder | null;
}

export interface IFolder {
  path: string;
  name: string;
}

export interface IFrontmatter {
  [key: string]: any;
}

export interface IVaultAdapter {
  read(file: IFile): Promise<string>;
  create(path: string, content: string): Promise<IFile>;
  modify(file: IFile, newContent: string): Promise<void>;
  delete(file: IFile): Promise<void>;
  exists(path: string): Promise<boolean>;
  getAbstractFileByPath(path: string): IFile | IFolder | null;
  getAllFiles(): IFile[];

  getFrontmatter(file: IFile): IFrontmatter | null;
  updateFrontmatter(
    file: IFile,
    updater: (current: IFrontmatter) => IFrontmatter,
  ): Promise<void>;

  rename(file: IFile, newPath: string): Promise<void>;
  createFolder(path: string): Promise<void>;
  getFirstLinkpathDest(linkpath: string, sourcePath: string): IFile | null;
  process(file: IFile, fn: (content: string) => string): Promise<string>;
}
