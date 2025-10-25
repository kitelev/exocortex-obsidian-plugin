export interface IFileSystemAdapter {
    readFile(path: string): Promise<string>;
    fileExists(path: string): Promise<boolean>;
    getFileMetadata(path: string): Promise<Record<string, any>>;
    createFile(path: string, content: string): Promise<string>;
    updateFile(path: string, content: string): Promise<void>;
    writeFile(path: string, content: string): Promise<void>;
    deleteFile(path: string): Promise<void>;
    renameFile(oldPath: string, newPath: string): Promise<void>;
    createDirectory(path: string): Promise<void>;
    directoryExists(path: string): Promise<boolean>;
    getMarkdownFiles(rootPath?: string): Promise<string[]>;
    findFilesByMetadata(query: Record<string, any>): Promise<string[]>;
    findFileByUID(uid: string): Promise<string | null>;
}
export declare class FileNotFoundError extends Error {
    constructor(path: string);
}
export declare class FileAlreadyExistsError extends Error {
    constructor(path: string);
}
//# sourceMappingURL=IFileSystemAdapter.d.ts.map