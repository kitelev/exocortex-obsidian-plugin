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
            mockVault.getMarkdownFiles.mockReturnValue([]);

            await repository.save(asset);

            expect(mockVault.create).toHaveBeenCalledWith(
                'Test Asset.md',
                expect.stringContaining('exo__Asset_uid')
            );
        });

        it('should update existing asset and preserve content', async () => {
            const asset = Asset.create({
                id: AssetId.generate(),
                label: 'Existing Asset',
                className: { value: 'TestClass' } as any,
                ontology: { value: 'test' } as any,
                properties: {}
            }).getValue()!;

            const mockFile = { path: 'Existing Asset.md' };
            const existingContent = `---
exo__Asset_uid: old-id
exo__Asset_label: Existing Asset
---

# Some content

This content should be preserved`;

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
            mockVault.read.mockResolvedValue(existingContent);

            await repository.save(asset);

            expect(mockVault.modify).toHaveBeenCalledWith(
                mockFile,
                expect.stringContaining('# Some content')
            );
            expect(mockVault.create).not.toHaveBeenCalled();
        });
    });

    describe('updateFrontmatterByPath', () => {
        it('should update frontmatter for file with existing frontmatter', async () => {
            const filePath = 'test/file.md';
            const mockFile = { path: filePath } as TFile;
            const originalContent = `---
title: Original Title
status: pending
---

# Content

This is the body content.`;

            const expectedContent = `---
title: Original Title
status: completed
---

# Content

This is the body content.`;

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockVault.read.mockResolvedValue(originalContent);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    title: 'Original Title',
                    status: 'pending'
                }
            } as any);

            await repository.updateFrontmatterByPath(filePath, {
                status: 'completed'
            });

            expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
        });

        it('should create frontmatter for file without frontmatter', async () => {
            const filePath = 'test/file.md';
            const mockFile = { path: filePath } as TFile;
            const originalContent = `# Content

This is a file without frontmatter.`;

            const expectedContent = `---
status: completed
---

# Content

This is a file without frontmatter.`;

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockVault.read.mockResolvedValue(originalContent);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: {}
            } as any);

            await repository.updateFrontmatterByPath(filePath, {
                status: 'completed'
            });

            expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
        });

        it('should handle special characters in values correctly', async () => {
            const filePath = 'test/file.md';
            const mockFile = { path: filePath } as TFile;
            const originalContent = `---
title: Test
---

Content`;

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockVault.read.mockResolvedValue(originalContent);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    title: 'Test'
                }
            } as any);

            await repository.updateFrontmatterByPath(filePath, {
                description: 'Value with: colon',
                tags: ['tag1', 'tag2'],
                link: '[[Some Page]]',
                number: 42,
                boolean: true
            });

            const modifyCall = mockVault.modify.mock.calls[0];
            const modifiedContent = modifyCall[1];

            // Check that special characters are properly quoted
            expect(modifiedContent).toContain('description: "Value with: colon"');
            expect(modifiedContent).toContain('tags:\n  - tag1\n  - tag2');
            expect(modifiedContent).toContain('link: "[[Some Page]]"');
            expect(modifiedContent).toContain('number: 42');
            expect(modifiedContent).toContain('boolean: true');
        });

        it('should throw error if file not found', async () => {
            const filePath = 'nonexistent/file.md';
            mockVault.getAbstractFileByPath.mockReturnValue(null);

            await expect(
                repository.updateFrontmatterByPath(filePath, { status: 'completed' })
            ).rejects.toThrow('File not found: nonexistent/file.md');
        });

        it('should skip null and undefined values', async () => {
            const filePath = 'test/file.md';
            const mockFile = { path: filePath } as TFile;
            const originalContent = `---
title: Test
existing: value
---

Content`;

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockVault.read.mockResolvedValue(originalContent);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    title: 'Test',
                    existing: 'value'
                }
            } as any);

            await repository.updateFrontmatterByPath(filePath, {
                nullValue: null,
                undefinedValue: undefined,
                validValue: 'test'
            });

            const modifyCall = mockVault.modify.mock.calls[0];
            const modifiedContent = modifyCall[1];

            // Check that null/undefined are not included
            expect(modifiedContent).not.toContain('nullValue');
            expect(modifiedContent).not.toContain('undefinedValue');
            expect(modifiedContent).toContain('validValue: test');
            expect(modifiedContent).toContain('existing: value');
        });
    });
});