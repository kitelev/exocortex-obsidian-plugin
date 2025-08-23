/**
 * Layout System Configuration Test
 * 
 * This script tests the layout system configuration to identify why layouts are not working
 * for the specific project file.
 * 
 * Test scenarios:
 * 1. Check if layout file path is configured correctly in plugin settings
 * 2. Verify the layout file location (/examples/layouts/ vs actual configured path)
 * 3. Test if ExoUIRender function is properly initialized
 * 4. Check if LayoutRenderer is receiving the correct parameters
 * 5. Verify if the layout is being found but buttons block is skipped
 */

// Test 1: Check plugin configuration
function testPluginConfiguration() {
    console.log("=== TEST 1: Plugin Configuration ===");
    
    // Check if ExoUIRender function exists
    if (typeof window.ExoUIRender === 'function') {
        console.log("✅ ExoUIRender function is available");
    } else {
        console.log("❌ ExoUIRender function is NOT available");
        return false;
    }
    
    // Check plugin instance
    if (window.app && window.app.plugins) {
        const exocortexPlugin = window.app.plugins.plugins['exocortex-obsidian-plugin'];
        if (exocortexPlugin) {
            console.log("✅ Exocortex plugin is loaded");
            console.log("Plugin instance:", exocortexPlugin);
            
            // Check layout renderer
            if (exocortexPlugin.layoutRenderer) {
                console.log("✅ LayoutRenderer is initialized");
            } else {
                console.log("❌ LayoutRenderer is NOT initialized");
            }
        } else {
            console.log("❌ Exocortex plugin is NOT loaded");
        }
    }
    
    return true;
}

// Test 2: Check layout file paths
function testLayoutPaths() {
    console.log("\n=== TEST 2: Layout File Paths ===");
    
    if (!window.app || !window.app.vault) {
        console.log("❌ Vault is not available");
        return false;
    }
    
    const vault = window.app.vault;
    const files = vault.getFiles();
    
    // Check for layout files in different locations
    const layoutPaths = [
        'layouts/',
        'examples/layouts/',
        '/examples/layouts/',
        'vault-2025/layouts/'
    ];
    
    const layoutFiles = [];
    
    files.forEach(file => {
        if (file.name.includes('Layout - ems__Project') || file.name.includes('ems__Project')) {
            layoutFiles.push(file.path);
        }
    });
    
    console.log("Found layout files:", layoutFiles);
    
    // Check specific layout file
    const targetLayoutFile = files.find(f => f.path === 'examples/layouts/Layout - ems__Project.md');
    if (targetLayoutFile) {
        console.log("✅ Target layout file found at:", targetLayoutFile.path);
    } else {
        console.log("❌ Target layout file NOT found at examples/layouts/Layout - ems__Project.md");
    }
    
    return true;
}

// Test 3: Test layout file parsing
async function testLayoutParsing() {
    console.log("\n=== TEST 3: Layout File Parsing ===");
    
    if (!window.app) return false;
    
    const vault = window.app.vault;
    const metadataCache = window.app.metadataCache;
    
    // Find the layout file
    const layoutFile = vault.getFiles().find(f => 
        f.path.includes('Layout - ems__Project') || f.name.includes('Layout - ems__Project')
    );
    
    if (!layoutFile) {
        console.log("❌ Layout file not found");
        return false;
    }
    
    console.log("✅ Layout file found:", layoutFile.path);
    
    // Get metadata
    const metadata = metadataCache.getFileCache(layoutFile);
    if (metadata && metadata.frontmatter) {
        console.log("✅ Layout file has frontmatter");
        console.log("Instance class:", metadata.frontmatter['exo__Instance_class']);
        console.log("Target class:", metadata.frontmatter['ui__ClassLayout_targetClass']);
        console.log("Enabled:", metadata.frontmatter['ui__ClassLayout_enabled']);
        console.log("Priority:", metadata.frontmatter['ui__ClassLayout_priority']);
        console.log("Blocks count:", metadata.frontmatter['ui__ClassLayout_blocks']?.length || 0);
    } else {
        console.log("❌ Layout file has no frontmatter or is not cached");
    }
    
    return true;
}

// Test 4: Test project file metadata
async function testProjectFileMetadata() {
    console.log("\n=== TEST 4: Project File Metadata ===");
    
    if (!window.app) return false;
    
    const vault = window.app.vault;
    const metadataCache = window.app.metadataCache;
    
    // Find the project file
    const projectFile = vault.getFiles().find(f => 
        f.path.includes('Project - Антифрод-триггеры.md')
    );
    
    if (!projectFile) {
        console.log("❌ Project file not found");
        return false;
    }
    
    console.log("✅ Project file found:", projectFile.path);
    
    // Get metadata
    const metadata = metadataCache.getFileCache(projectFile);
    if (metadata && metadata.frontmatter) {
        console.log("✅ Project file has frontmatter");
        console.log("Instance class:", metadata.frontmatter['exo__Instance_class']);
        
        // Check if instance class matches layout target
        const instanceClass = metadata.frontmatter['exo__Instance_class'];
        if (Array.isArray(instanceClass)) {
            console.log("Instance classes:", instanceClass);
            const hasProject = instanceClass.some(cls => cls.includes('ems__Project'));
            console.log("Has ems__Project class:", hasProject);
        } else if (instanceClass) {
            console.log("Single instance class:", instanceClass);
            console.log("Matches ems__Project:", instanceClass.includes('ems__Project'));
        }
    } else {
        console.log("❌ Project file has no frontmatter or is not cached");
    }
    
    return true;
}

// Test 5: Test ExoUIRender execution
async function testExoUIRenderExecution() {
    console.log("\n=== TEST 5: ExoUIRender Execution Test ===");
    
    if (typeof window.ExoUIRender !== 'function') {
        console.log("❌ ExoUIRender function not available");
        return false;
    }
    
    // Create test container
    const testContainer = document.createElement('div');
    testContainer.id = 'layout-test-container';
    testContainer.style.cssText = 'border: 2px solid red; padding: 10px; margin: 10px; background: #f0f0f0;';
    document.body.appendChild(testContainer);
    
    // Create mock dataview context
    const mockDv = {
        current: () => ({
            file: {
                path: 'vault-2025/01 Inbox/Project - Антифрод-триггеры.md'
            }
        }),
        pages: () => []
    };
    
    const mockCtx = {
        container: testContainer
    };
    
    try {
        console.log("🔄 Executing ExoUIRender...");
        await window.ExoUIRender(mockDv, mockCtx);
        console.log("✅ ExoUIRender executed without error");
        console.log("Container content:", testContainer.innerHTML);
        
        // Check if any blocks were rendered
        const blocks = testContainer.querySelectorAll('.exocortex-block');
        console.log("Rendered blocks count:", blocks.length);
        
        if (blocks.length > 0) {
            console.log("✅ Layout blocks were rendered");
            blocks.forEach((block, index) => {
                console.log(`Block ${index}:`, block.className, block.textContent?.substring(0, 100) + '...');
            });
        } else {
            console.log("❌ No layout blocks were rendered");
            
            // Check for error messages
            const errorElements = testContainer.querySelectorAll('.exocortex-error, .notice-error');
            if (errorElements.length > 0) {
                console.log("Found error messages:");
                errorElements.forEach(el => console.log("Error:", el.textContent));
            }
        }
        
    } catch (error) {
        console.log("❌ ExoUIRender execution failed:", error);
        console.log("Error stack:", error.stack);
    }
    
    return true;
}

// Test 6: Check layout repository configuration
function testLayoutRepositoryConfig() {
    console.log("\n=== TEST 6: Layout Repository Configuration ===");
    
    const plugin = window.app?.plugins?.plugins['exocortex-obsidian-plugin'];
    if (!plugin) {
        console.log("❌ Plugin not found");
        return false;
    }
    
    if (plugin.layoutRenderer) {
        const renderer = plugin.layoutRenderer;
        console.log("✅ LayoutRenderer found");
        
        // Try to access the repository through the use case
        const getLayoutUseCase = renderer.getLayoutUseCase;
        if (getLayoutUseCase) {
            console.log("✅ GetLayoutForClassUseCase found");
            
            // Check the repository configuration
            console.log("Repository info available through use case");
        } else {
            console.log("❌ GetLayoutForClassUseCase not accessible");
        }
    } else {
        console.log("❌ LayoutRenderer not found in plugin");
    }
    
    return true;
}

// Run all tests
async function runAllTests() {
    console.log("🔍 Starting Layout System Configuration Tests...\n");
    
    const results = {
        pluginConfig: testPluginConfiguration(),
        layoutPaths: testLayoutPaths(),
        layoutParsing: await testLayoutParsing(),
        projectMetadata: await testProjectFileMetadata(),
        exoUIRender: await testExoUIRenderExecution(),
        repositoryConfig: testLayoutRepositoryConfig()
    };
    
    console.log("\n=== TEST RESULTS SUMMARY ===");
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log("\n=== DIAGNOSTICS COMPLETE ===");
    
    return results;
}

// Export for console usage
window.runLayoutTests = runAllTests;

console.log("Layout System Test Script loaded. Run: window.runLayoutTests()");