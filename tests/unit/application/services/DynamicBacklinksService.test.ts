import { DynamicBacklinksService } from '../../../../src/application/services/DynamicBacklinksService';
import { App, TFile } from '../../../__mocks__/obsidian';

describe('DynamicBacklinksService', () => {
    let service: DynamicBacklinksService;
    let mockApp: any;
    let targetFile: TFile;

    const createMockFile = (path: string, frontmatter: Record<string, any> = {}): TFile => {
        const file = new TFile();
        file.path = path;
        file.basename = path.split('/').pop()?.replace(/\.md$/, '') || '';
        
        // Store frontmatter for retrieval
        mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((f: TFile) => {
            if (f.path === path) {
                return { frontmatter };
            }
            return mockApp.metadataCache.getFileCache.mockReturnValue;
        });
        
        return file;
    };

    beforeEach(() => {
        mockApp = new App();
        service = new DynamicBacklinksService(mockApp);
        
        targetFile = createMockFile('target.md');
        
        // Setup default mocks
        mockApp.vault.getMarkdownFiles = jest.fn();
        mockApp.metadataCache.getFileCache = jest.fn();
    });

    describe('discoverPropertyBasedBacklinks', () => {
        it('should discover backlinks grouped by property', async () => {
            const file1 = createMockFile('file1.md', {
                'parent': 'target',
                'exo__Instance_class': 'Task'
            });
            
            const file2 = createMockFile('file2.md', {
                'related': ['target', 'other'],
                'exo__Instance_class': 'Note'
            });
            
            const file3 = createMockFile('file3.md', {
                'depends_on': '[[target]]',
                'exo__Instance_class': 'Task'
            });

            mockApp.vault.getMarkdownFiles.mockReturnValue([targetFile, file1, file2, file3]);
            
            // Setup metadata cache for each file
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                switch (file.path) {
                    case 'file1.md':
                        return { frontmatter: { 'parent': 'target', 'exo__Instance_class': 'Task' } };
                    case 'file2.md':
                        return { frontmatter: { 'related': ['target', 'other'], 'exo__Instance_class': 'Note' } };
                    case 'file3.md':
                        return { frontmatter: { 'depends_on': '[[target]]', 'exo__Instance_class': 'Task' } };
                    case 'target.md':
                        return { frontmatter: {} };
                    default:
                        return null;
                }
            });

            const result = await service.discoverPropertyBasedBacklinks(targetFile);

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            expect(backlinks).toHaveLength(3);
            
            // Should be sorted alphabetically by property name
            expect(backlinks[0].propertyName).toBe('depends_on');
            expect(backlinks[0].referencingFiles).toHaveLength(1);
            expect(backlinks[0].referencingFiles[0].path).toBe('file3.md');
            
            expect(backlinks[1].propertyName).toBe('parent');
            expect(backlinks[1].referencingFiles).toHaveLength(1);
            expect(backlinks[1].referencingFiles[0].path).toBe('file1.md');
            
            expect(backlinks[2].propertyName).toBe('related');
            expect(backlinks[2].referencingFiles).toHaveLength(1);
            expect(backlinks[2].referencingFiles[0].path).toBe('file2.md');
        });

        it('should exclude specified properties', async () => {
            const file1 = createMockFile('file1.md', {
                'parent': 'target',
                'exo__Asset_id': 'should-be-excluded',
                'related': 'target'
            });

            mockApp.vault.getMarkdownFiles.mockReturnValue([targetFile, file1]);
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                if (file.path === 'file1.md') {
                    return { 
                        frontmatter: { 
                            'parent': 'target', 
                            'exo__Asset_id': 'should-be-excluded',
                            'related': 'target'
                        } 
                    };
                }
                return { frontmatter: {} };
            });

            const result = await service.discoverPropertyBasedBacklinks(targetFile, {
                excludeProperties: ['exo__Asset_id']
            });

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            expect(backlinks).toHaveLength(2); // parent and related, not exo__Asset_id
            expect(backlinks.find(b => b.propertyName === 'exo__Asset_id')).toBeUndefined();
        });

        it('should filter by class when specified', async () => {
            const taskFile = createMockFile('task.md', {
                'parent': 'target',
                'exo__Instance_class': 'Task'
            });
            
            const noteFile = createMockFile('note.md', {
                'parent': 'target',
                'exo__Instance_class': 'Note'
            });

            mockApp.vault.getMarkdownFiles.mockReturnValue([targetFile, taskFile, noteFile]);
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                switch (file.path) {
                    case 'task.md':
                        return { frontmatter: { 'parent': 'target', 'exo__Instance_class': 'Task' } };
                    case 'note.md':
                        return { frontmatter: { 'parent': 'target', 'exo__Instance_class': 'Note' } };
                    default:
                        return { frontmatter: {} };
                }
            });

            const result = await service.discoverPropertyBasedBacklinks(targetFile, {
                filterByClass: 'Task'
            });

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            expect(backlinks).toHaveLength(1);
            expect(backlinks[0].propertyName).toBe('parent');
            expect(backlinks[0].referencingFiles).toHaveLength(1);
            expect(backlinks[0].referencingFiles[0].path).toBe('task.md');
        });

        it('should limit results per property when specified', async () => {
            const file1 = createMockFile('file1.md', { 'parent': 'target' });
            const file2 = createMockFile('file2.md', { 'parent': 'target' });
            const file3 = createMockFile('file3.md', { 'parent': 'target' });

            mockApp.vault.getMarkdownFiles.mockReturnValue([targetFile, file1, file2, file3]);
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                if (file.path.startsWith('file')) {
                    return { frontmatter: { 'parent': 'target' } };
                }
                return { frontmatter: {} };
            });

            const result = await service.discoverPropertyBasedBacklinks(targetFile, {
                maxResultsPerProperty: 2
            });

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            expect(backlinks).toHaveLength(1);
            expect(backlinks[0].propertyName).toBe('parent');
            expect(backlinks[0].referencingFiles).toHaveLength(2); // Limited to 2
        });

        it('should handle various reference formats', async () => {
            const file1 = createMockFile('file1.md', { 'ref': 'target' });
            const file2 = createMockFile('file2.md', { 'ref': '[[target]]' });
            const file3 = createMockFile('file3.md', { 'ref': '[[target|display]]' });
            const file4 = createMockFile('file4.md', { 'ref': ['other', 'target'] });

            mockApp.vault.getMarkdownFiles.mockReturnValue([targetFile, file1, file2, file3, file4]);
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                switch (file.path) {
                    case 'file1.md': return { frontmatter: { 'ref': 'target' } };
                    case 'file2.md': return { frontmatter: { 'ref': '[[target]]' } };
                    case 'file3.md': return { frontmatter: { 'ref': '[[target|display]]' } };
                    case 'file4.md': return { frontmatter: { 'ref': ['other', 'target'] } };
                    default: return { frontmatter: {} };
                }
            });

            const result = await service.discoverPropertyBasedBacklinks(targetFile);

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            expect(backlinks).toHaveLength(1);
            expect(backlinks[0].propertyName).toBe('ref');
            expect(backlinks[0].referencingFiles).toHaveLength(4); // All should match
        });

        it('should skip target file itself', async () => {
            const file1 = createMockFile('file1.md', { 'parent': 'target' });

            mockApp.vault.getMarkdownFiles.mockReturnValue([targetFile, file1]);
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                if (file.path === 'file1.md') {
                    return { frontmatter: { 'parent': 'target' } };
                }
                if (file.path === 'target.md') {
                    return { frontmatter: { 'self_ref': 'target' } }; // Self-reference should be ignored
                }
                return { frontmatter: {} };
            });

            const result = await service.discoverPropertyBasedBacklinks(targetFile);

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            expect(backlinks).toHaveLength(1);
            expect(backlinks[0].referencingFiles.some(f => f.path === 'target.md')).toBe(false);
        });

        it('should return empty result when no backlinks found', async () => {
            const file1 = createMockFile('file1.md', { 'other': 'different' });

            mockApp.vault.getMarkdownFiles.mockReturnValue([targetFile, file1]);
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                if (file.path === 'file1.md') {
                    return { frontmatter: { 'other': 'different' } };
                }
                return { frontmatter: {} };
            });

            const result = await service.discoverPropertyBasedBacklinks(targetFile);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(0);
        });

        it('should handle files with no frontmatter', async () => {
            const file1 = createMockFile('file1.md');
            const file2 = createMockFile('file2.md', { 'parent': 'target' });

            mockApp.vault.getMarkdownFiles.mockReturnValue([targetFile, file1, file2]);
            mockApp.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
                if (file.path === 'file1.md') {
                    return null; // No metadata
                }
                if (file.path === 'file2.md') {
                    return { frontmatter: { 'parent': 'target' } };
                }
                return { frontmatter: {} };
            });

            const result = await service.discoverPropertyBasedBacklinks(targetFile);

            expect(result.isSuccess).toBe(true);
            const backlinks = result.getValue();
            
            expect(backlinks).toHaveLength(1);
            expect(backlinks[0].referencingFiles).toHaveLength(1);
            expect(backlinks[0].referencingFiles[0].path).toBe('file2.md');
        });
    });
});