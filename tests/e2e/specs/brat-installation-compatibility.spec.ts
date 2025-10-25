import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('BRAT Installation Compatibility', () => {
  test('should have no draft releases that could confuse BRAT', async () => {
    const draftReleases = execSync(
      'gh api repos/:owner/:repo/releases --jq \'.[] | select(.draft == true) | {tag_name, created_at, draft}\'',
      { encoding: 'utf-8' }
    ).trim();

    expect(draftReleases).toBe('');
  });

  test('should have latest release with correct version in manifest.json', async () => {
    const latestRelease = JSON.parse(
      execSync('gh release view --json tagName,isDraft,assets', { encoding: 'utf-8' })
    );

    expect(latestRelease.isDraft).toBe(false);

    const manifestAsset = latestRelease.assets.find((a: any) => a.name === 'manifest.json');
    expect(manifestAsset).toBeDefined();

    const manifestContent = execSync(
      `gh release download ${latestRelease.tagName} -p manifest.json --clobber -O- 2>/dev/null`,
      { encoding: 'utf-8' }
    );

    const manifest = JSON.parse(manifestContent);
    const expectedVersion = latestRelease.tagName.replace(/^v/, '');

    expect(manifest.version).toBe(expectedVersion);
    expect(manifest.version).not.toBe('0.0.0-dev');
    expect(manifest.id).toBe('exocortex');
    expect(manifest.name).toBe('Exocortex');
  });

  test('should have all required release assets for BRAT installation', async () => {
    const latestRelease = JSON.parse(
      execSync('gh release view --json assets', { encoding: 'utf-8' })
    );

    const assetNames = latestRelease.assets.map((a: any) => a.name);

    expect(assetNames).toContain('main.js');
    expect(assetNames).toContain('manifest.json');
    expect(assetNames).toContain('styles.css');
  });

  test('should have manifest.json with minAppVersion for compatibility', async () => {
    const latestRelease = JSON.parse(
      execSync('gh release view --json tagName', { encoding: 'utf-8' })
    );

    const manifestContent = execSync(
      `gh release download ${latestRelease.tagName} -p manifest.json --clobber -O- 2>/dev/null`,
      { encoding: 'utf-8' }
    );

    const manifest = JSON.parse(manifestContent);

    expect(manifest.minAppVersion).toBeDefined();
    expect(manifest.minAppVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('should have consistent version across manifest.json and git tag', async () => {
    const latestRelease = JSON.parse(
      execSync('gh release view --json tagName', { encoding: 'utf-8' })
    );

    const gitTagVersion = latestRelease.tagName.replace(/^v/, '');

    const manifestContent = execSync(
      `gh release download ${latestRelease.tagName} -p manifest.json --clobber -O- 2>/dev/null`,
      { encoding: 'utf-8' }
    );

    const manifest = JSON.parse(manifestContent);

    expect(manifest.version).toBe(gitTagVersion);
  });

  test('should have main.js file in latest release', async () => {
    const latestRelease = JSON.parse(
      execSync('gh release view --json tagName', { encoding: 'utf-8' })
    );

    const mainJsSize = execSync(
      `gh release download ${latestRelease.tagName} -p main.js --clobber -O- 2>/dev/null | wc -c`,
      { encoding: 'utf-8' }
    ).trim();

    const sizeInBytes = parseInt(mainJsSize, 10);
    expect(sizeInBytes).toBeGreaterThan(1000);
  });
});
