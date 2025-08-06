import { ObsidianAssetRepository } from '../../../src/infrastructure/repositories/ObsidianAssetRepository';
import { Asset } from '../../../src/domain/entities/Asset';
import { AssetId } from '../../../src/domain/value-objects/AssetId';
import { App, TFile } from 'obsidian';

describe('ObsidianAssetRepository', () => {
    let repository: ObsidianAssetRepository;
    let mockApp: Partial<App>;
    let mockVault: any;
    let mockMetadataCache: any;

    beforeEach(() => {
        mockVault = {
            getMarkdownFiles: jest.fn(),
            getAbstractFileByPath: jest.fn(),
            read: jest.fn(),
            modify: jest.fn(),
            create: jest.fn(),
            delete: jest.fn()
        };

        mockMetadataCache = {
            getFileCache: jest.fn()
        };

        mockApp = {
            vault: mockVault as any,
            metadataCache: mockMetadataCache as any
        };

        repository = new ObsidianAssetRepository(mockApp as App);
    });

    describe('findByFilename', () => {
        it('should find asset by filename with .md extension', async () => {
            const mockFile = {
                path: 'MyAsset.md',
                name: 'MyAsset.md',
                basename: 'MyAsset'
            };

            const mockFrontmatter = {
                'exo__Asset_uid': 'test-uuid',
                'exo__Asset_label': 'My Asset',
                'exo__Instance_class': '[[TestClass]]'
            };

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: mockFrontmatter
            });

            const asset = await repository.findByFilename('MyAsset.md');

            expect(asset).not.toBeNull();
            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('MyAsset.md');
        });

        it('should find asset by filename without .md extension', async () => {
            const mockFile = {
                path: 'MyAsset.md',
                name: 'MyAsset.md',
                basename: 'MyAsset'
            };

            const mockFrontmatter = {
                'exo__Asset_uid': 'test-uuid',
                'exo__Asset_label': 'My Asset',
                'exo__Instance_class': '[[TestClass]]'
            };

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: mockFrontmatter
            });

            const asset = await repository.findByFilename('MyAsset');

            expect(asset).not.toBeNull();
            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('MyAsset.md');
        });

        it('should search all files if not found by path', async () => {
            const mockFiles = [
                { path: 'folder/MyAsset.md', name: 'MyAsset.md', basename: 'MyAsset' },
                { path: 'OtherAsset.md', name: 'OtherAsset.md', basename: 'OtherAsset' }
            ];

            const mockFrontmatter = {
                'exo__Asset_uid': 'test-uuid',
                'exo__Asset_label': 'My Asset',
                'exo__Instance_class': '[[TestClass]]'
            };

            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: mockFrontmatter
            });

            const asset = await repository.findByFilename('MyAsset.md');

            expect(asset).not.toBeNull();
            expect(mockVault.getMarkdownFiles).toHaveBeenCalled();
        });

        it('should return null if asset not found', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.getMarkdownFiles.mockReturnValue([]);

            const asset = await repository.findByFilename('NonExistent.md');

            expect(asset).toBeNull();
        });

        it('should handle special characters in filename', async () => {
            const mockFile = {
                path: "John O'Brien.md",
                name: "John O'Brien.md",
                basename: "John O'Brien"
            };

            const mockFrontmatter = {
                'exo__Asset_uid': 'test-uuid',
                'exo__Asset_label': "John O'Brien",
                'exo__Instance_class': '[[Person]]'
            };

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: mockFrontmatter
            });

            const asset = await repository.findByFilename("John O'Brien");

            expect(asset).not.toBeNull();
            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("John O'Brien.md");
        });
    });

    describe('findById', () => {
        it('should find asset by UUID', async () => {
            const mockFiles = [
                { path: 'Asset1.md', basename: 'Asset1' },
                { path: 'Asset2.md', basename: 'Asset2' }
            ];

            const targetFrontmatter = {
                'exo__Asset_uid': 'target-uuid',
                'exo__Asset_label': 'Target Asset'
            };

            mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockMetadataCache.getFileCache.mockImplementation((file: any) => {
                if (file.path === 'Asset2.md') {
                    return { frontmatter: targetFrontmatter };
                }
                return { frontmatter: { 'exo__Asset_uid': 'other-uuid' } };
            });

            const assetId = AssetId.create('target-uuid').getValue()!;
            const asset = await repository.findById(assetId);

            expect(asset).not.toBeNull();
            expect(asset?.getId().toString()).toBe('target-uuid');
        });
    });

    describe('save', () => {
        it('should save asset with correct filename', async () => {
            const asset = Asset.create({
                id: AssetId.generate(),
                label: 'Test Asset',
                className: { value: 'TestClass' } as any,
                ontology: { value: 'test' } as any,
                properties: {}
            }).getValue()!;

            mockVault.getAbstractFileByPath.mockReturnValue(null);

            await repository.save(asset);

            expect(mockVault.create).toHaveBeenCalledWith(
                'Test Asset.md',
                expect.stringContaining('exo__Asset_uid')
            );
        });

        it('should update existing asset', async () => {
            const asset = Asset.create({
                id: AssetId.generate(),
                label: 'Existing Asset',
                className: { value: 'TestClass' } as any,
                ontology: { value: 'test' } as any,
                properties: {}
            }).getValue()!;

            const mockFile = { path: 'Existing Asset.md' };
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

            await repository.save(asset);

            expect(mockVault.modify).toHaveBeenCalledWith(
                mockFile,
                expect.stringContaining('exo__Asset_uid')
            );
            expect(mockVault.create).not.toHaveBeenCalled();
        });
    });
});