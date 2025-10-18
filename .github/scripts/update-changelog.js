#!/usr/bin/env node

const fs = require('fs');

const version = process.argv[2];
const commitMsg = process.argv[3];

if (!version || !commitMsg) {
  console.error('Usage: update-changelog.js <version> <commit-message>');
  process.exit(1);
}

const date = new Date().toISOString().split('T')[0];

let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

if (changelog.includes(`## [${version}]`)) {
  console.log(`Version ${version} already exists in CHANGELOG.md`);
  process.exit(0);
}

const entry = `

## [${version}] - ${date}

### Changed
- ${commitMsg}
`;

changelog = changelog.replace('## [Unreleased]', `## [Unreleased]${entry}`);

fs.writeFileSync('CHANGELOG.md', changelog);

console.log(`✅ Added version ${version} to CHANGELOG.md`);
