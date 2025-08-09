#!/usr/bin/env node

/**
 * UI Test Setup Validation Script
 * Validates that UI tests can run in CI environment
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function validateSetup() {
  console.log('🔍 Validating UI test setup for CI...\n');

  // Check required files
  const requiredFiles = [
    'wdio.conf.ts',
    'wdio.conf.ci.ts',
    'tsconfig.wdio.json',
    'tests/ui/fixtures/vault',
    'tests/ui/specs',
    'tests/ui/pageobjects'
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    console.error('\n❌ Missing required files. Setup incomplete.');
    process.exit(1);
  }

  // Check package.json scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['test:ui', 'test:ui:ci', 'test:ui:headless'];
  
  console.log('\n📝 Checking package.json scripts:');
  for (const script of requiredScripts) {
    if (packageJson.scripts[script]) {
      console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`❌ ${script} - MISSING`);
      allFilesExist = false;
    }
  }

  // Check wdio dependencies
  const wdioDeps = [
    '@wdio/cli',
    '@wdio/local-runner',
    '@wdio/mocha-framework',
    '@wdio/spec-reporter',
    'wdio-obsidian-service'
  ];

  console.log('\n📦 Checking WebdriverIO dependencies:');
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  for (const dep of wdioDeps) {
    if (allDeps[dep]) {
      console.log(`✅ ${dep}: ${allDeps[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  }

  // Validate TypeScript configuration
  console.log('\n📝 Validating TypeScript configuration:');
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.wdio.json', 'utf8'));
    const includes = tsConfig.include || [];
    
    if (includes.includes('wdio.conf.ts') && includes.includes('wdio.conf.ci.ts')) {
      console.log('✅ TypeScript config includes both wdio configurations');
    } else {
      console.log('❌ TypeScript config missing wdio configuration files');
      allFilesExist = false;
    }
  } catch (error) {
    console.log(`❌ Error reading tsconfig.wdio.json: ${error.message}`);
    allFilesExist = false;
  }

  // Check if we can compile TypeScript
  console.log('\n🔨 Testing TypeScript compilation:');
  try {
    await runCommand('npx', ['tsc', '-p', 'tsconfig.wdio.json', '--noEmit']);
    console.log('✅ TypeScript compilation successful');
  } catch (error) {
    console.log(`❌ TypeScript compilation failed: ${error.message}`);
    allFilesExist = false;
  }

  // Final validation
  if (allFilesExist) {
    console.log('\n🎉 UI test setup validation completed successfully!');
    console.log('\n🚀 Ready to run:');
    console.log('  Local tests:  npm run test:ui');
    console.log('  Headless:     npm run test:ui:headless');
    console.log('  CI mode:      npm run test:ui:ci');
    console.log('\n📝 Environment variables for customization:');
    console.log('  CI=true                 # Enable CI mode');
    console.log('  DEBUG=true             # Enable debug logging');
    console.log('  TAKE_SCREENSHOTS=true # Force screenshot capture');
  } else {
    console.error('\n❌ UI test setup validation failed. Please fix the issues above.');
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'pipe',
      shell: true 
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// Run validation
validateSetup().catch(error => {
  console.error('❌ Validation error:', error.message);
  process.exit(1);
});