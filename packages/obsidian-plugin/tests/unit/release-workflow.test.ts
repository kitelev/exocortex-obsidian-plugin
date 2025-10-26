import * as fs from 'fs';
import * as path from 'path';

describe('Release Workflow Validation', () => {
  const projectRoot = path.join(__dirname, '../../../..');
  const workflowPath = path.join(projectRoot, '.github/workflows/auto-release.yml');
  const stylesPath = path.join(projectRoot, 'packages/obsidian-plugin/styles.css');

  describe('styles.css in GitHub Releases', () => {
    it('should include styles.css in auto-release.yml files list', () => {
      expect(fs.existsSync(workflowPath)).toBe(true);

      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');

      const releaseStepMatch = workflowContent.match(
        /- name: Create GitHub Release[\s\S]*?files:\s*\|[\s\S]*?(?=\n      -|\n  [a-z]|\Z)/m
      );

      expect(releaseStepMatch).toBeTruthy();
      expect(releaseStepMatch![0]).toContain('styles.css');
    });

    it('should have styles.css file in project root', () => {
      expect(fs.existsSync(stylesPath)).toBe(true);

      const stats = fs.statSync(stylesPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should reference all required plugin files in release workflow', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');

      const requiredFiles = ['main.js', 'manifest.json', 'styles.css'];

      requiredFiles.forEach(file => {
        expect(workflowContent).toContain(file);
      });
    });
  });

  describe('Release package contents', () => {
    it('should copy styles.css to release-files directory in workflow', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');

      const createPackageStepMatch = workflowContent.match(
        /- name: Create release package[\s\S]*?run:\s*\|[\s\S]*?(?=\n      -|\Z)/m
      );

      expect(createPackageStepMatch).toBeTruthy();
      expect(createPackageStepMatch![0]).toContain('cp packages/obsidian-plugin/styles.css release-files/');
    });
  });
});
