#!/usr/bin/env node

/**
 * Quick Setup Verification Test
 * Runs a minimal test to verify the real testing infrastructure is working
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SetupVerificationTest {
    constructor() {
        this.PROJECT_ROOT = path.join(__dirname, '../../..');
        this.errors = [];
        this.warnings = [];
    }
    
    log(message, type = 'info') {
        const prefix = {
            'info': '📋',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        
        console.log(`${prefix[type]} ${message}`);
        
        if (type === 'error') {
            this.errors.push(message);
        } else if (type === 'warning') {
            this.warnings.push(message);
        }
    }
    
    checkFile(filePath, description) {
        if (fs.existsSync(filePath)) {
            this.log(`${description}: Found`, 'success');
            return true;
        } else {
            this.log(`${description}: Missing - ${filePath}`, 'error');
            return false;
        }
    }
    
    checkCommand(command, description) {
        try {
            execSync(`which ${command}`, { stdio: 'pipe' });
            this.log(`${description}: Available`, 'success');
            return true;
        } catch (error) {
            this.log(`${description}: Not found`, 'error');
            return false;
        }
    }
    
    async runVerification() {
        console.log('🔍 SETUP VERIFICATION TEST');
        console.log('═'.repeat(50));
        console.log('🎯 Verifying real plugin testing infrastructure...');
        console.log('');
        
        // Check prerequisites
        this.log('Checking prerequisites...');
        this.checkCommand('docker', 'Docker');
        this.checkCommand('docker-compose', 'Docker Compose');
        this.checkCommand('node', 'Node.js');
        this.checkCommand('npm', 'NPM');
        
        // Check plugin files
        this.log('\nChecking plugin build files...');
        this.checkFile(path.join(this.PROJECT_ROOT, 'main.js'), 'Plugin main.js');
        this.checkFile(path.join(this.PROJECT_ROOT, 'manifest.json'), 'Plugin manifest.json');
        this.checkFile(path.join(this.PROJECT_ROOT, 'package.json'), 'Package.json');
        
        // Check test files
        this.log('\nChecking real test files...');
        this.checkFile(path.join(__dirname, 'real-plugin-test.js'), 'Real plugin test');
        this.checkFile(path.join(__dirname, 'broken-plugin-test.js'), 'Negative test');
        this.checkFile(path.join(__dirname, 'run-real-tests.sh'), 'Test runner script');
        this.checkFile(path.join(__dirname, 'docker-compose.e2e.yml'), 'Docker compose config');
        
        // Check configuration
        this.log('\nChecking configuration files...');
        this.checkFile(path.join(__dirname, 'obsidian-config/app.json'), 'Obsidian app config');
        this.checkFile(path.join(__dirname, 'obsidian-config/community-plugins.json'), 'Plugin list config');
        
        // Check test script permissions
        const testScript = path.join(__dirname, 'run-real-tests.sh');
        if (fs.existsSync(testScript)) {
            const stats = fs.statSync(testScript);
            if (stats.mode & fs.constants.S_IXUSR) {
                this.log('Test runner script: Executable', 'success');
            } else {
                this.log('Test runner script: Not executable (run: chmod +x run-real-tests.sh)', 'warning');
            }
        }
        
        // Test Docker connectivity
        this.log('\nTesting Docker connectivity...');
        try {
            execSync('docker info', { stdio: 'pipe' });
            this.log('Docker daemon: Running', 'success');
        } catch (error) {
            this.log('Docker daemon: Not running or not accessible', 'error');
        }
        
        // Check if port 8084 is available
        this.log('\nChecking port availability...');
        try {
            const { execSync } = require('child_process');
            const result = execSync('netstat -an | grep :8084 || echo "PORT_FREE"', { encoding: 'utf8' });
            if (result.includes('PORT_FREE') || result.trim() === '') {
                this.log('Port 8084: Available', 'success');
            } else {
                this.log('Port 8084: In use (may cause conflicts)', 'warning');
            }
        } catch (error) {
            this.log('Port 8084: Could not check availability', 'warning');
        }
        
        // Generate report
        this.log('\n' + '═'.repeat(50));
        this.log('VERIFICATION RESULTS');
        this.log('═'.repeat(50));
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            this.log('🎉 ALL CHECKS PASSED!', 'success');
            this.log('✅ Real plugin testing infrastructure is ready');
            this.log('🔥 Run ./run-real-tests.sh to execute tests');
        } else {
            if (this.errors.length > 0) {
                this.log(`❌ ${this.errors.length} ERRORS found:`, 'error');
                this.errors.forEach(error => console.log(`   • ${error}`));
            }
            
            if (this.warnings.length > 0) {
                this.log(`⚠️ ${this.warnings.length} WARNINGS:`, 'warning');
                this.warnings.forEach(warning => console.log(`   • ${warning}`));
            }
            
            if (this.errors.length > 0) {
                this.log('\n💡 Fix the errors above before running tests', 'error');
                return false;
            } else {
                this.log('\n💡 Warnings can usually be ignored, but check them', 'warning');
            }
        }
        
        this.log('\n📚 Next steps:');
        console.log('   1. Run: ./run-real-tests.sh');
        console.log('   2. Check results in test-results/ directory'); 
        console.log('   3. View live Obsidian: http://localhost:8084');
        console.log('   4. Review REAL_TESTS_README.md for details');
        
        return this.errors.length === 0;
    }
}

// Run verification
const verifier = new SetupVerificationTest();
verifier.runVerification().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
});