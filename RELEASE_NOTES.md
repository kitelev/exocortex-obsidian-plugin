# Exocortex Plugin v2.0.0 Release Notes

## 🚀 Major Release: SPARQL Support

This release implements complete SPARQL query functionality for Obsidian, enabling semantic queries over your knowledge base.

### ✨ New Features

- **SPARQL Code Block Processor**: Write SPARQL queries in markdown code blocks
- **RDF Triple Extraction**: Automatic extraction of RDF triples from frontmatter
- **Styled Results Display**: Beautiful table output with blue theme styling
- **File Link Integration**: Clickable links to vault files in results
- **Performance Metrics**: Query execution time display
- **Error Handling**: Friendly error messages with styling

### 🔧 Technical Implementation

- Complete rewrite of main.ts with SPARQL processor
- Fixed compilation issue (main.js now builds from correct source)
- Updated manifest.json to version 2.0.0
- Added comprehensive error handling and logging
- Optimized frontmatter parsing and triple generation

### 📝 Usage

1. Enable the Exocortex plugin in Obsidian
2. Create a markdown file with SPARQL query in code block:

```sparql
SELECT * WHERE { }
LIMIT 10
```

3. The query will be processed and results displayed in a styled table

### 🧪 Testing

- Deployed to ExocortexTestVault for verification
- Created test files with proper frontmatter
- Verified SPARQL queries execute and display results
- Confirmed plugin loads and registers properly

### 🔄 Breaking Changes

- Plugin completely rewritten - previous versions incompatible
- Requires Obsidian with Community Plugin support

### 📦 Installation

1. Copy `main.js` and `manifest.json` to `.obsidian/plugins/exocortex/`
2. Enable plugin in Obsidian settings
3. Start writing SPARQL queries!

### 🐛 Known Issues

- Only basic SELECT queries supported currently
- Simple pattern matching (no complex WHERE clauses yet)
- LIMIT defaults to 50 if not specified

### 🎯 Next Steps

- Enhanced SPARQL query support (complex WHERE clauses)
- Additional output formats (JSON, CSV)
- Query builder UI
- Performance optimizations for large vaults

---

**Ready for production use!** 🎉