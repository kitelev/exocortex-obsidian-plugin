import { FullConfig } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Global setup for real E2E tests
 * Prepares test environment with actual plugin installation
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up real E2E test environment...');
  
  const projectRoot = path.join(__dirname, '../../../..');
  const testVaultPath = path.join(__dirname, '../test-vault');
  const pluginPath = path.join(testVaultPath, '.obsidian/plugins/exocortex-obsidian-plugin');
  
  // Step 1: Build the plugin
  console.log('📦 Building plugin...');
  try {
    execSync('npm run build', { 
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log('✅ Plugin built successfully');
  } catch (error) {
    console.error('❌ Failed to build plugin:', error);
    throw error;
  }
  
  // Step 2: Create test vault
  console.log('📁 Creating test vault...');
  await fs.ensureDir(testVaultPath);
  await fs.ensureDir(path.join(testVaultPath, '.obsidian'));
  await fs.ensureDir(path.join(testVaultPath, '.obsidian/plugins'));
  await fs.ensureDir(pluginPath);
  
  // Step 3: Copy plugin files
  console.log('📋 Installing plugin in test vault...');
  const filesToCopy = ['main.js', 'manifest.json', 'styles.css'];
  
  for (const file of filesToCopy) {
    const sourcePath = path.join(projectRoot, file);
    const destPath = path.join(pluginPath, file);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, destPath);
      console.log(`  ✅ Copied ${file}`);
    } else if (file === 'styles.css') {
      console.log(`  ⚠️ ${file} not found (optional)`);
    } else {
      throw new Error(`Required file ${file} not found`);
    }
  }
  
  // Step 4: Enable plugin
  console.log('⚙️ Enabling plugin...');
  const communityPlugins = ['exocortex-obsidian-plugin'];
  await fs.writeJson(
    path.join(testVaultPath, '.obsidian/community-plugins.json'),
    communityPlugins,
    { spaces: 2 }
  );
  
  // Step 5: Create test data
  console.log('📝 Creating test data...');
  await createTestData(testVaultPath);
  
  // Step 6: Verify setup
  const pluginMainPath = path.join(pluginPath, 'main.js');
  if (await fs.pathExists(pluginMainPath)) {
    const stats = await fs.stat(pluginMainPath);
    console.log(`✅ Plugin installed (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    throw new Error('Plugin installation verification failed');
  }
  
  console.log('🎯 Test environment ready!');
  console.log(`   Vault: ${testVaultPath}`);
  console.log(`   Plugin: ${pluginPath}`);
  
  // Store paths for tests to use
  process.env.TEST_VAULT_PATH = testVaultPath;
  process.env.PLUGIN_PATH = pluginPath;
}

async function createTestData(vaultPath: string) {
  // Create folders
  const folders = ['Classes', 'Assets', 'Properties', 'Layouts'];
  for (const folder of folders) {
    await fs.ensureDir(path.join(vaultPath, folder));
  }
  
  // Create Person class
  await fs.writeFile(
    path.join(vaultPath, 'Classes', 'Person.md'),
    `---
exo__Class: Class
name: Person
description: A person entity
---

# Person Class

Properties:
- name: string
- email: string
- role: string
- department: string
`
  );
  
  // Create Project class
  await fs.writeFile(
    path.join(vaultPath, 'Classes', 'Project.md'),
    `---
exo__Class: Class
name: Project
description: A project entity
---

# Project Class

Properties:
- name: string
- status: string
- startDate: date
- endDate: date
- description: text
`
  );
  
  // Create sample Person asset
  await fs.writeFile(
    path.join(vaultPath, 'Assets', 'John Doe.md'),
    `---
exo__Instance_class: Person
name: John Doe
email: john.doe@example.com
role: Developer
department: Engineering
---

# John Doe

A sample person for E2E testing.
`
  );
  
  // Create sample Project asset
  await fs.writeFile(
    path.join(vaultPath, 'Assets', 'Exocortex Development.md'),
    `---
exo__Instance_class: Project
name: Exocortex Development
status: In Progress
startDate: 2024-01-01
endDate: 2024-12-31
description: Development of the Exocortex plugin
---

# Exocortex Development

The main project for developing the Exocortex plugin.
`
  );
  
  // Create UniversalLayout test file
  await fs.writeFile(
    path.join(vaultPath, 'test-universal-layout.md'),
    `---
exo__Instance_class: Person
name: Test Universal Layout
---

# Universal Layout Test

This file tests the UniversalLayout rendering.
`
  );
  
  // Create DynamicLayout test file
  await fs.writeFile(
    path.join(vaultPath, 'test-dynamic-layout.md'),
    `---
exo__Instance_class: Project
name: Test Dynamic Layout
---

# Dynamic Layout Test

This file tests the DynamicLayout functionality.
`
  );
  
  console.log('  ✅ Created test classes and assets');
}

export default globalSetup;