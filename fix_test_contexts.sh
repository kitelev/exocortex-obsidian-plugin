#!/bin/bash

# Fix all the context issues in the test file
file="/Users/kitelev/Documents/exocortex-obsidian-plugin/tests/unit/presentation/renderers/UniversalLayoutRenderer.test.ts"

# Replace all occurrences of {} as MarkdownPostProcessorContext with proper sourcePath
sed -i '' 's/{} as MarkdownPostProcessorContext/{ sourcePath: "current-file.md" } as MarkdownPostProcessorContext/g' "$file"

# Add getFirstLinkpathDest mocks where needed
# This will be handled manually for specific test cases that need it
echo "Basic context replacements completed"