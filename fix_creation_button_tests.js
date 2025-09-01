#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const testFile = '/Users/kitelev/Documents/exocortex-obsidian-plugin/tests/unit/presentation/renderers/UniversalLayoutRenderer.creationButton.test.ts';

let content = fs.readFileSync(testFile, 'utf8');

// List of all the replacements needed
const replacements = [
  {
    from: `      const mockAssetFile = createTFileMock("Some Asset", "assets/Some Asset.md");

      mockApp.workspace.getActiveFile = jest
        .fn()
        .mockReturnValue(mockAssetFile);

      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
        frontmatter: {
          exo__Instance_class: "ems__Area", // Not a class
          rdfs__label: "Some Asset",
        },
      });`,
    to: `      const mockAssetFile = createTFileMock("Some Asset", "assets/Some Asset.md");
      setupFileMock(mockApp, mockAssetFile, {
        exo__Instance_class: "ems__Area", // Not a class
        rdfs__label: "Some Asset",
      });`
  },
  // Add more replacements as needed - let me just make the key ones manually due to complexity
];

// Apply replacements
for (const replacement of replacements) {
  content = content.replace(replacement.from, replacement.to);
}

fs.writeFileSync(testFile, content, 'utf8');
console.log('Applied fixes to creation button tests');