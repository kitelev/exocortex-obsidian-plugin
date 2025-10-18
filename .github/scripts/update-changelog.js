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

let newChangelog;

// Try to find and replace ## [Unreleased] section
if (changelog.includes('## [Unreleased]')) {
  // Add new version entry after ## [Unreleased]
  newChangelog = changelog.replace('## [Unreleased]', `## [Unreleased]\n${entry}`);
} else {
  // If no ## [Unreleased] section, add new version at the beginning
  // Find the first ## [ version marker
  const versionRegex = /^## \[/m;
  const match = changelog.match(versionRegex);

  if (match) {
    // Insert before the first version
    const insertPos = match.index;
    newChangelog = changelog.slice(0, insertPos) + entry + '\n' + changelog.slice(insertPos);
  } else {
    // No versions at all, append to the end
    newChangelog = changelog + '\n' + entry;
  }
}

// Verify the change was made
if (!newChangelog.includes(`## [${version}]`)) {
  console.error(`❌ Failed to add version ${version} to CHANGELOG.md`);
  process.exit(1);
}

fs.writeFileSync('CHANGELOG.md', newChangelog);

console.log(`✅ Added version ${version} to CHANGELOG.md`);
