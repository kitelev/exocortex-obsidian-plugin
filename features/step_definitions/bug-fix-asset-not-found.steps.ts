import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ExocortexPlugin } from '../../main';

let plugin: ExocortexPlugin;
let assetFile: any;
let foundAsset: any;
let errorMessage: string | null;
let searchResult: any;

Before(async function() {
    this.testVault = await createTestVault();
    this.plugin = await loadPlugin(this.testVault);
    plugin = this.plugin;
    errorMessage = null;
});

After(async function() {
    await this.testVault.cleanup();
});

// Background
Given('I have an asset file {string} in my vault', async function(fileName: string) {
    assetFile = {
        path: fileName,
        basename: fileName.replace('.md', ''),
        name: fileName,
        frontmatter: {
            'exo__Asset_uid': 'test-uuid-123',
            'exo__Asset_label': 'Test Asset',
            'exo__Instance_class': ['[[exo__Asset]]']
        }
    };
    
    await plugin.createFile(assetFile);
});

// Scenario: Find asset by filename with extension
When('I search for the asset by filename {string}', async function(searchTerm: string) {
    try {
        foundAsset = await plugin.findAssetByFilename(searchTerm);
    } catch (error) {
        errorMessage = error.message;
    }
});

Then('the asset should be found successfully', async function() {
    expect(foundAsset).toBeDefined();
    expect(foundAsset).not.toBeNull();
    expect(errorMessage).toBeNull();
});

Then('the asset ID should be {string}', async function(expectedId: string) {
    expect(foundAsset.id).toBe(expectedId);
});

// Scenario: Find asset by filename without extension
Then('the search should handle the missing extension', async function() {
    // Verify that .md was added automatically
    const searchLog = plugin.getLastSearchQuery();
    expect(searchLog).toContain('.md');
});

// Scenario: Find asset with special characters
Given('I have an asset file {string} with special characters', async function(fileName: string) {
    assetFile = {
        path: fileName,
        basename: fileName.replace('.md', ''),
        name: fileName,
        frontmatter: {
            'exo__Asset_uid': 'special-uuid-456',
            'exo__Asset_label': fileName.replace('.md', ''),
            'exo__Instance_class': ['[[exo__Person]]']
        }
    };
    
    await plugin.createFile(assetFile);
});

Then('special characters should be handled correctly', async function() {
    expect(foundAsset).toBeDefined();
    expect(foundAsset.label).toContain("O'Brien");
});

// Scenario: Handle non-existent asset gracefully
When('I search for a non-existent asset {string}', async function(fileName: string) {
    try {
        foundAsset = await plugin.findAssetByFilename(fileName);
    } catch (error) {
        errorMessage = error.message;
    }
});

Then('the result should be null', async function() {
    expect(foundAsset).toBeNull();
});

Then('no error should be thrown', async function() {
    expect(errorMessage).toBeNull();
});

// Scenario: Find asset in subfolder
Given('I have an asset in subfolder {string}', async function(folderPath: string) {
    assetFile = {
        path: `${folderPath}/SubfolderAsset.md`,
        basename: 'SubfolderAsset',
        name: 'SubfolderAsset.md',
        frontmatter: {
            'exo__Asset_uid': 'subfolder-uuid-789',
            'exo__Asset_label': 'Subfolder Asset',
            'exo__Instance_class': ['[[exo__Document]]']
        }
    };
    
    await plugin.createFile(assetFile);
});

When('I search by just the filename {string}', async function(fileName: string) {
    foundAsset = await plugin.findAssetByFilename(fileName);
});

Then('the asset should be found regardless of folder location', async function() {
    expect(foundAsset).toBeDefined();
    expect(foundAsset.path).toContain('Projects/Active');
});

// Scenario: Case sensitivity handling
Given('I have an asset {string} with mixed case', async function(fileName: string) {
    assetFile = {
        path: fileName,
        basename: fileName.replace('.md', ''),
        name: fileName,
        frontmatter: {
            'exo__Asset_uid': 'mixed-case-uuid',
            'exo__Asset_label': 'Mixed Case Asset',
            'exo__Instance_class': ['[[exo__Asset]]']
        }
    };
    
    await plugin.createFile(assetFile);
});

When('I search with different case {string}', async function(searchTerm: string) {
    foundAsset = await plugin.findAssetByFilename(searchTerm);
});

Then('the search should be case-insensitive', async function() {
    expect(foundAsset).toBeDefined();
    expect(foundAsset.label).toBe('Mixed Case Asset');
});

// Scenario: Performance with many files
Given('I have {int} asset files in my vault', async function(count: number) {
    const files = [];
    for (let i = 0; i < count; i++) {
        files.push({
            path: `Asset${i}.md`,
            basename: `Asset${i}`,
            name: `Asset${i}.md`,
            frontmatter: {
                'exo__Asset_uid': `uuid-${i}`,
                'exo__Asset_label': `Asset ${i}`,
                'exo__Instance_class': ['[[exo__Asset]]']
            }
        });
    }
    
    await plugin.createFiles(files);
});

When('I search for asset number {int}', async function(assetNumber: number) {
    const startTime = Date.now();
    foundAsset = await plugin.findAssetByFilename(`Asset${assetNumber}.md`);
    searchResult = {
        duration: Date.now() - startTime,
        found: foundAsset
    };
});

Then('the search should complete in less than {int}ms', async function(maxDuration: number) {
    expect(searchResult.duration).toBeLessThan(maxDuration);
});

// Scenario: Concurrent searches
When('I perform {int} concurrent searches', async function(searchCount: number) {
    const searches = [];
    for (let i = 0; i < searchCount; i++) {
        searches.push(plugin.findAssetByFilename(`Asset${i}.md`));
    }
    
    const results = await Promise.all(searches);
    searchResult = {
        results,
        allFound: results.every(r => r !== null)
    };
});

Then('all searches should complete successfully', async function() {
    expect(searchResult.allFound).toBe(true);
    expect(searchResult.results.length).toBe(10);
});

// Scenario: Cache invalidation
Given('the asset {string} is cached', async function(fileName: string) {
    // First search to populate cache
    await plugin.findAssetByFilename(fileName);
    expect(plugin.isCached(fileName)).toBe(true);
});

When('the asset file is modified', async function() {
    assetFile.frontmatter['exo__Asset_label'] = 'Modified Asset';
    await plugin.updateFile(assetFile);
});

When('I search for the asset again', async function() {
    foundAsset = await plugin.findAssetByFilename(assetFile.name);
});

Then('the cache should be invalidated and fresh data returned', async function() {
    expect(foundAsset.label).toBe('Modified Asset');
});

// Helper functions
async function createTestVault() {
    const files: any[] = [];
    
    return {
        files,
        cleanup: async () => {
            files.length = 0;
        }
    };
}

async function loadPlugin(vault: any) {
    let lastSearchQuery: string = '';
    const cache = new Map();
    
    return {
        createFile: async (file: any) => {
            vault.files.push(file);
        },
        
        createFiles: async (files: any[]) => {
            vault.files.push(...files);
        },
        
        updateFile: async (file: any) => {
            const index = vault.files.findIndex((f: any) => f.path === file.path);
            if (index >= 0) {
                vault.files[index] = file;
                cache.delete(file.name); // Invalidate cache
            }
        },
        
        findAssetByFilename: async (filename: string) => {
            lastSearchQuery = filename;
            
            // Check cache first
            if (cache.has(filename)) {
                return cache.get(filename);
            }
            
            // Add .md if missing
            if (!filename.endsWith('.md')) {
                filename = `${filename}.md`;
            }
            
            // Search in all files
            const file = vault.files.find((f: any) => {
                return f.name === filename || 
                       f.path === filename ||
                       f.path.endsWith(`/${filename}`);
            });
            
            if (file) {
                const asset = {
                    id: file.frontmatter['exo__Asset_uid'],
                    label: file.frontmatter['exo__Asset_label'],
                    path: file.path,
                    ...file.frontmatter
                };
                
                // Cache the result
                cache.set(filename, asset);
                return asset;
            }
            
            return null;
        },
        
        getLastSearchQuery: () => lastSearchQuery,
        
        isCached: (filename: string) => {
            return cache.has(filename) || cache.has(`${filename}.md`);
        }
    };
}