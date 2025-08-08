import ExocortexPlugin from '../../main';
import { App, TFile, Vault } from 'obsidian';

export interface TestFile {
    path: string;
    basename: string;
    name: string;
    frontmatter: any;
    content?: string;
}

export interface TestVault {
    files: Map<string, TestFile>;
    app: App;
    vault: Vault;
    cleanup: () => Promise<void>;
}

export async function createTestVault(): Promise<TestVault> {
    const files = new Map<string, TestFile>();
    
    const mockVault = {
        getAbstractFileByPath: jest.fn((path: string) => files.get(path)),
        getFiles: jest.fn(() => Array.from(files.values())),
        read: jest.fn(async (file: TFile) => {
            const testFile = files.get(file.path);
            return testFile?.content || '';
        }),
        modify: jest.fn(async (file: TFile, content: string) => {
            const testFile = files.get(file.path);
            if (testFile) {
                testFile.content = content;
            }
        }),
        create: jest.fn(async (path: string, content: string) => {
            const file: TestFile = {
                path,
                basename: path.replace('.md', ''),
                name: path.split('/').pop() || path,
                content,
                frontmatter: {}
            };
            files.set(path, file);
            return file as any;
        }),
        delete: jest.fn(async (file: TFile) => {
            files.delete(file.path);
        })
    };

    const mockApp = {
        vault: mockVault,
        metadataCache: {
            getFileCache: jest.fn((file: TFile) => {
                const testFile = files.get(file.path);
                return testFile ? { frontmatter: testFile.frontmatter } : null;
            }),
            on: jest.fn(),
            off: jest.fn()
        },
        workspace: {
            getActiveFile: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        }
    };

    return {
        files,
        app: mockApp as any,
        vault: mockVault as any,
        cleanup: async () => {
            files.clear();
        }
    };
}

export async function loadPlugin(testVault: TestVault): Promise<ExocortexPlugin> {
    const plugin = new ExocortexPlugin(testVault.app, {} as any);
    
    // Add test helper methods
    (plugin as any).createFile = async (file: TestFile) => {
        testVault.files.set(file.path, file);
        return file;
    };
    
    (plugin as any).createFiles = async (files: TestFile[]) => {
        for (const file of files) {
            testVault.files.set(file.path, file);
        }
    };
    
    (plugin as any).updateFile = async (path: string, updates: Partial<TestFile>) => {
        const file = testVault.files.get(path);
        if (file) {
            Object.assign(file, updates);
        }
    };
    
    (plugin as any).findAssetByFilename = async (filename: string) => {
        // Search by exact filename
        let file = testVault.files.get(filename);
        
        // Search by basename
        if (!file) {
            const searchName = filename.replace('.md', '');
            for (const [path, f] of testVault.files) {
                if (f.basename === searchName || f.name === filename) {
                    file = f;
                    break;
                }
            }
        }
        
        if (!file) {
            throw new Error(`Asset not found: ${filename}`);
        }
        
        return file;
    };
    
    (plugin as any).getLastSearchQuery = () => {
        return (plugin as any).lastSearchQuery || '';
    };
    
    (plugin as any).isCached = (filename: string) => {
        return testVault.files.has(filename);
    };
    
    await plugin.onload();
    
    return plugin;
}

export function expectPropertyValue(element: HTMLElement, propertyName: string, value: string) {
    const propertyElement = element.querySelector(`.property-${propertyName}`);
    expect(propertyElement).toBeTruthy();
    expect(propertyElement?.textContent).toContain(value);
}

export function expectBlockPresent(element: HTMLElement, blockType: string) {
    const blockElement = element.querySelector(`.exocortex-${blockType}-block`);
    expect(blockElement).toBeTruthy();
}