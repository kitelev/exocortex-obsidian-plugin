#!/usr/bin/env node

/**
 * Release Preparation Script for Obsidian Plugins
 * 
 * This script prepares the plugin for release by:
 * - Validating all files and configurations
 * - Running tests
 * - Building the plugin
 * - Updating changelog
 * - Generating release notes
 * - Validating version consistency
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReleasePreparation {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.steps = [];
    }

    log(message) {
        console.log(`🚀 ${message}`);
    }

    error(message) {
        this.errors.push(message);
        console.error(`❌ ERROR: ${message}`);
    }

    warn(message) {
        this.warnings.push(message);
        console.warn(`⚠️  WARNING: ${message}`);
    }

    success(message) {
        console.log(`✅ ${message}`);
    }

    step(message) {
        this.steps.push(message);
        console.log(`📋 STEP: ${message}`);
    }

    exec(command, description) {
        try {
            this.log(`Running: ${description}`);
            const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
            return { success: true, output: result };
        } catch (error) {
            this.error(`Failed to ${description}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    validateGitStatus() {
        this.step('Checking Git status');
        
        const statusResult = this.exec('git status --porcelain', 'check git status');
        if (!statusResult.success) {
            return false;
        }

        if (statusResult.output.trim()) {
            this.warn('Working directory has uncommitted changes:');
            console.log(statusResult.output);
            this.warn('Consider committing changes before release');
        } else {
            this.success('Working directory is clean');
        }

        return true;
    }

    validateCurrentBranch() {
        this.step('Checking current branch');
        
        const branchResult = this.exec('git branch --show-current', 'get current branch');
        if (!branchResult.success) {
            return false;
        }

        const currentBranch = branchResult.output.trim();
        if (currentBranch !== 'main' && currentBranch !== 'master') {
            this.warn(`Currently on branch '${currentBranch}'. Consider releasing from main/master branch.`);
        } else {
            this.success(`On ${currentBranch} branch`);
        }

        return true;
    }

    runTests() {
        this.step('Running test suite');
        
        const testResult = this.exec('npm test', 'run tests');
        if (!testResult.success) {
            this.error('Tests failed. Fix failing tests before release.');
            return false;
        }

        this.success('All tests passed');
        return true;
    }

    buildPlugin() {
        this.step('Building plugin');
        
        const buildResult = this.exec('npm run build', 'build plugin');
        if (!buildResult.success) {
            this.error('Build failed. Fix build errors before release.');
            return false;
        }

        // Verify build outputs
        if (!fs.existsSync('main.js')) {
            this.error('main.js not found after build');
            return false;
        }

        const stats = fs.statSync('main.js');
        if (stats.size === 0) {
            this.error('main.js is empty after build');
            return false;
        }

        this.success('Plugin built successfully');
        return true;
    }

    validatePlugin() {
        this.step('Validating plugin configuration');
        
        const validateResult = this.exec('npm run validate', 'validate plugin');
        if (!validateResult.success) {
            this.error('Plugin validation failed. Fix validation errors before release.');
            return false;
        }

        this.success('Plugin validation passed');
        return true;
    }

    updateChangelog() {
        this.step('Updating changelog');
        
        const changelogResult = this.exec('npm run generate-changelog', 'update changelog');
        if (!changelogResult.success) {
            this.warn('Failed to update changelog automatically');
            return true; // Non-critical
        }

        this.success('Changelog updated');
        return true;
    }

    checkVersions() {
        this.step('Checking version consistency');
        
        let manifestVersion, packageVersion;
        
        // Read manifest.json
        try {
            const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
            manifestVersion = manifest.version;
        } catch (error) {
            this.error('Could not read manifest.json version');
            return false;
        }

        // Read package.json if it exists
        if (fs.existsSync('package.json')) {
            try {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                packageVersion = packageJson.version;
            } catch (error) {
                this.warn('Could not read package.json version');
            }
        }

        // Check consistency
        if (packageVersion && manifestVersion !== packageVersion) {
            this.error(`Version mismatch: manifest.json (${manifestVersion}) vs package.json (${packageVersion})`);
            return false;
        }

        // Check if this version already has a git tag
        try {
            const tags = execSync('git tag', { encoding: 'utf8' }).trim().split('\n');
            if (tags.includes(manifestVersion) || tags.includes(`v${manifestVersion}`)) {
                this.warn(`Version ${manifestVersion} already has a git tag. Consider bumping the version.`);
            }
        } catch (error) {
            // Ignore git tag check errors
        }

        this.success(`Version ${manifestVersion} is consistent`);
        return true;
    }

    generateReleaseNotes() {
        this.step('Generating release notes');
        
        try {
            const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
            const version = manifest.version;
            
            // Extract changelog for current version
            let releaseNotes = `# Release ${version}\n\n`;
            
            if (fs.existsSync('CHANGELOG.md')) {
                const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
                const lines = changelog.split('\n');
                let inCurrentVersion = false;
                let currentVersionContent = [];
                
                for (const line of lines) {
                    if (line.startsWith(`## [${version}]`) || line.startsWith(`## ${version}`)) {
                        inCurrentVersion = true;
                        continue;
                    }
                    
                    if (inCurrentVersion && line.startsWith('## ')) {
                        break; // Next version found
                    }
                    
                    if (inCurrentVersion) {
                        currentVersionContent.push(line);
                    }
                }
                
                if (currentVersionContent.length > 0) {
                    releaseNotes += currentVersionContent.join('\n').trim();
                } else {
                    releaseNotes += `Release version ${version}`;
                }
            } else {
                releaseNotes += `Release version ${version}`;
            }
            
            fs.writeFileSync('RELEASE_NOTES.md', releaseNotes, 'utf8');
            this.success('Release notes generated: RELEASE_NOTES.md');
            
        } catch (error) {
            this.warn(`Failed to generate release notes: ${error.message}`);
        }
        
        return true;
    }

    generateReleaseArtifacts() {
        this.step('Preparing release artifacts');
        
        const requiredFiles = ['main.js', 'manifest.json'];
        const optionalFiles = ['styles.css'];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                this.error(`Required release file missing: ${file}`);
                return false;
            }
        }
        
        // Check file sizes
        const mainStats = fs.statSync('main.js');
        const mainSizeMB = mainStats.size / (1024 * 1024);
        
        if (mainSizeMB > 5) {
            this.warn(`main.js is quite large (${mainSizeMB.toFixed(2)}MB). Consider optimization.`);
        }
        
        this.success('Release artifacts ready');
        return true;
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('🏁 RELEASE PREPARATION SUMMARY');
        console.log('='.repeat(50));
        
        console.log(`\n📋 Steps completed: ${this.steps.length}`);
        this.steps.forEach((step, i) => console.log(`   ${i + 1}. ${step}`));
        
        if (this.errors.length > 0) {
            console.log(`\n❌ Errors (${this.errors.length}):`);
            this.errors.forEach(error => console.log(`   • ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
        
        console.log('\n' + '='.repeat(50));
        
        if (this.errors.length === 0) {
            console.log('🎉 RELEASE READY! Your plugin is prepared for release.');
            
            // Read version for next steps
            try {
                const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
                console.log('\n📝 Next steps:');
                console.log(`   1. Review RELEASE_NOTES.md`);
                console.log(`   2. Create a git tag: git tag v${manifest.version}`);
                console.log(`   3. Push the tag: git push origin v${manifest.version}`);
                console.log(`   4. Create a GitHub release with the generated files`);
            } catch (error) {
                // Ignore
            }
        } else {
            console.log('❌ RELEASE NOT READY. Please fix the errors above.');
        }
        
        return this.errors.length === 0;
    }

    run(options = {}) {
        const { 
            skipTests = false, 
            skipBuild = false,
            skipGitChecks = false 
        } = options;
        
        this.log('Starting release preparation...\n');
        
        const steps = [
            () => skipGitChecks || this.validateGitStatus(),
            () => skipGitChecks || this.validateCurrentBranch(),
            () => skipTests || this.runTests(),
            () => skipBuild || this.buildPlugin(),
            () => this.validatePlugin(),
            () => this.checkVersions(),
            () => this.updateChangelog(),
            () => this.generateReleaseNotes(),
            () => this.generateReleaseArtifacts()
        ];
        
        let allPassed = true;
        for (const step of steps) {
            if (!step()) {
                allPassed = false;
                if (this.errors.length > 0) {
                    // Stop on critical errors
                    break;
                }
            }
            console.log(''); // Add spacing
        }
        
        return this.printSummary();
    }
}

// Command line interface
const args = process.argv.slice(2);
const options = {};

if (args.includes('--skip-tests')) {
    options.skipTests = true;
}

if (args.includes('--skip-build')) {
    options.skipBuild = true;
}

if (args.includes('--skip-git-checks')) {
    options.skipGitChecks = true;
}

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Release Preparation Script

Usage: node prepare-release.js [options]

Options:
  --skip-tests       Skip running the test suite
  --skip-build       Skip building the plugin
  --skip-git-checks  Skip git status and branch checks
  --help             Show this help message

Examples:
  node prepare-release.js                    # Full preparation
  node prepare-release.js --skip-tests       # Skip tests
  node prepare-release.js --skip-git-checks  # Skip git checks
`);
    process.exit(0);
}

// Run the preparation
const preparation = new ReleasePreparation();
const success = preparation.run(options);
process.exit(success ? 0 : 1);