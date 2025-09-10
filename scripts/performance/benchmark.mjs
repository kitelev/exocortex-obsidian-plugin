import { execSync } from 'node:child_process';
import fs from 'node:fs';

function formatMs(ms) {
  return `${ms.toFixed(0)} ms`;
}

function getBundleSizeBytes(file) {
  try {
    const stat = fs.statSync(file);
    return stat.size;
  } catch {
    return 0;
  }
}

function writeHtmlReport({ buildTimeMs, bundleSizeBytes, outfile }) {
  const kb = (bundleSizeBytes / 1024).toFixed(1);
  const mb = (bundleSizeBytes / 1024 / 1024).toFixed(2);
  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Exocortex Performance Report</title>
<style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial;margin:24px} .card{border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:12px} .metric{font-size:14px;color:#333} .value{font-weight:600}</style>
</head><body>
  <h1>Exocortex Performance Report</h1>
  <div class="card"><div class="metric">Build time: <span class="value">${formatMs(buildTimeMs)}</span></div></div>
  <div class="card"><div class="metric">Bundle size (main.js): <span class="value">${kb} KB (${mb} MB)</span></div></div>
  <p>Generated at ${new Date().toISOString()}</p>
</body></html>`;
  fs.writeFileSync(outfile, html, 'utf8');
}

function main() {
  const start = Date.now();
  // Production build includes metafile and bundle analysis logging
  execSync('node esbuild.config.mjs production', { stdio: 'inherit' });
  const buildTimeMs = Date.now() - start;

  const bundleSizeBytes = getBundleSizeBytes('main.js');
  fs.mkdirSync('test-results', { recursive: true });
  const reportPath = 'test-results/performance-report.html';
  writeHtmlReport({ buildTimeMs, bundleSizeBytes, outfile: reportPath });
  console.log(`\n📊 Performance report written to ${reportPath}`);
}

main();
