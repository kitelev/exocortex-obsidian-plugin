# Exocortex Plugin E2E UI Tests

This directory contains end-to-end UI tests for the Exocortex Obsidian plugin using WebdriverIO and the wdio-obsidian-service.

## Architecture

### Technology Stack
- **WebdriverIO v9**: Browser automation framework
- **wdio-obsidian-service**: Specialized service for testing Obsidian plugins
- **Mocha**: Test framework
- **Chai**: Assertion library
- **TypeScript**: Type-safe test development

### Directory Structure
```
tests/ui/
├── fixtures/               # Test data and configuration
│   └── vault/             # Test vault with sample files
│       ├── .obsidian/     # Obsidian configuration
│       └── *.md           # Test markdown files
├── pageobjects/           # Page Object pattern implementations
│   ├── ObsidianApp.page.ts      # General Obsidian interactions
│   ├── SparqlBlock.page.ts      # SPARQL block specific actions
│   └── MarkdownEditor.page.ts   # Editor interactions
├── specs/                 # Test specifications
│   ├── activate.spec.ts         # Plugin activation tests
│   ├── sparql-processing.spec.ts # Basic SPARQL functionality
│   └── sparql-advanced.spec.ts   # Advanced SPARQL features
└── README.md              # This file
```

## Setup

### Prerequisites
1. Node.js 18+ or 20+
2. npm or yarn
3. Obsidian application (downloaded automatically)

### Installation
```bash
# Install dependencies
npm install

# Download Obsidian for testing
./scripts/download-obsidian.sh

# Set environment variable (from script output)
export OBSIDIAN_APP_PATH="/path/to/Obsidian.app"
```

## Running Tests

### Docker-based Testing (Recommended)
```bash
# Run UI tests in Docker with real Obsidian
npm run test:ui:docker

# Run specific test
cd tests/ui
docker-compose up --build --abort-on-container-exit

# Clean up Docker containers
npm run test:ui:docker:clean
```

### Local Development
```bash
# Run all UI tests
npm run test:ui

# Run with specific spec file
npx wdio run wdio.conf.ts --spec tests/ui/specs/create-asset-modal-real.spec.ts

# Run with debug logging
npx wdio run wdio.conf.ts --logLevel debug
```

### CI/CD
Tests run automatically on GitHub Actions for:
- Push to main/master/develop branches
- Pull requests
- Manual workflow dispatch

## Test Categories

### 1. Plugin Activation (`activate.spec.ts`)
- Workspace initialization
- Plugin enabling/disabling
- SPARQL processor registration
- Vault file verification

### 2. SPARQL Processing (`sparql-processing.spec.ts`)
- Basic query execution
- Results table rendering
- Error handling for invalid queries
- Dynamic query creation
- Multiple SPARQL blocks
- Performance metrics

### 3. Advanced Features (`sparql-advanced.spec.ts`)
- Complex query patterns
- Variable extraction (task, status, label)
- File link navigation
- Frontmatter extraction
- Array value handling
- Edge cases and error recovery

## Page Objects

### ObsidianApp.page.ts
Core Obsidian application interactions:
- `waitForWorkspaceReady()`: Wait for workspace initialization
- `openFile(path)`: Open a specific markdown file
- `enablePlugin(id)`: Enable a plugin by ID
- `executeCommand(id)`: Execute Obsidian commands
- `switchToSourceMode()`: Switch editor to source mode
- `switchToPreviewMode()`: Switch editor to preview mode

### SparqlBlock.page.ts
SPARQL-specific UI interactions:
- `waitForResults()`: Wait for SPARQL results to render
- `getTableHeaders()`: Extract table column headers
- `getTableRows()`: Get all result rows
- `getExecutionTime()`: Get query execution time
- `hasError()`: Check for error states
- `clickFileLink()`: Navigate via file links

### MarkdownEditor.page.ts
Editor manipulation:
- `insertText(text)`: Insert text at cursor
- `setContent(content)`: Replace entire content
- `insertSparqlBlock(query)`: Add SPARQL code block
- `getContent()`: Get current editor content

## Best Practices

### 1. Test Isolation
- Each spec file uses a fresh vault copy
- Tests clean up created files in `after()` hooks
- No shared state between test suites

### 2. Stable Selectors
- Use data-testid attributes where possible
- Leverage wdio-obsidian-service APIs
- Avoid brittle CSS selectors

### 3. Explicit Waits
- Use `waitUntil()` instead of `pause()`
- Set appropriate timeouts for operations
- Handle async Obsidian operations properly

### 4. Error Handling
- Tests verify both success and failure paths
- Graceful handling of missing elements
- Comprehensive error messages

## Debugging

### Visual Debugging
```bash
# Run tests with headed browser
npx wdio run wdio.conf.ts --headless false
```

### Console Logs
```javascript
// In tests
console.log(await browser.executeObsidian(({ app }) => {
  return app.workspace.getActiveFile()?.path;
}));
```

### Screenshots on Failure
Tests automatically capture screenshots on failure (when configured).

## Troubleshooting

### Common Issues

1. **"Obsidian workspace failed to become ready"**
   - Increase timeout in `waitForWorkspaceReady()`
   - Check if Obsidian path is correct
   - Ensure no modal dialogs blocking

2. **"SPARQL results container did not appear"**
   - Verify plugin is enabled
   - Check if file has valid SPARQL blocks
   - Ensure preview mode is active

3. **TypeScript errors**
   - Run `npm install` to ensure all types installed
   - Check tsconfig.wdio.json configuration
   - Verify import paths are correct

### Environment Variables
- `OBSIDIAN_APP_PATH`: Path to Obsidian executable
- `OBSIDIAN_VERSION`: Specific version to test (default: 1.8.10)
- `HEADLESS`: Run in headless mode (default: true)

## Contributing

### Adding New Tests
1. Create new spec file in `tests/ui/specs/`
2. Use existing page objects or create new ones
3. Follow naming convention: `feature-name.spec.ts`
4. Include cleanup in `after()` hooks

### Page Object Guidelines
- One page object per logical UI component
- Methods should be atomic and reusable
- Return promises for async operations
- Document complex selectors

## Resources
- [WebdriverIO Documentation](https://webdriver.io/)
- [wdio-obsidian-service](https://github.com/jesse-r-s-hines/wdio-obsidian-service)
- [Obsidian API](https://github.com/obsidianmd/obsidian-api)
- [Page Object Pattern](https://webdriver.io/docs/pageobjects/)