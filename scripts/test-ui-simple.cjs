/**
 * Simple test script to verify SPARQL container rendering
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing SPARQL Container Rendering...\n');

// Load the built plugin
const pluginCode = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

// Create mock DOM environment
global.document = {
  createElement: function(tag) {
    const element = {
      tagName: tag.toUpperCase(),
      children: [],
      innerHTML: '',
      textContent: '',
      className: '',
      style: { cssText: '' },
      appendChild: function(child) {
        this.children.push(child);
        if (child.className === 'exocortex-sparql-container') {
          console.log('✅ Container created with class: exocortex-sparql-container');
        }
      },
      empty: function() {
        this.children = [];
        this.innerHTML = '';
      },
      remove: function() {
        // noop
      },
      $: function(selector) {
        // Simple selector mock
        return this.children.find(c => 
          c.tagName === selector.toUpperCase() ||
          c.className === selector.replace('.', '')
        );
      },
      $$: function(selector) {
        return this.children.filter(c => 
          c.tagName === selector.toUpperCase() ||
          c.className === selector.replace('.', '')
        );
      }
    };
    
    // Mock specific methods for certain elements
    if (tag === 'table') {
      element.$$thead = [];
      element.$$tbody = [];
    }
    
    return element;
  }
};

// Mock Obsidian API
const ObsidianMock = {
  Plugin: class Plugin {
    constructor() {}
    registerMarkdownCodeBlockProcessor(lang, processor) {
      this.processor = processor;
      console.log(`📝 Registered processor for '${lang}' blocks`);
    }
  },
  Notice: class Notice {
    constructor(msg) {
      console.log(`📢 Notice: ${msg}`);
    }
  }
};

// Load plugin with mock
const moduleExports = { exports: {} };
function mockRequire(id) {
  if (id === 'obsidian') return ObsidianMock;
  throw new Error(`Module not found: ${id}`);
}

// Execute plugin code
try {
  const pluginFn = new Function('module', 'exports', 'require', pluginCode);
  pluginFn({ exports: moduleExports.exports }, moduleExports.exports, mockRequire);
  
  const PluginClass = moduleExports.exports.default || moduleExports.exports;
  const plugin = new PluginClass(
    { 
      vault: { 
        getMarkdownFiles: () => [],
        read: async () => '',
        on: () => {}
      },
      workspace: { openLinkText: () => {} }
    },
    {}
  );
  
  console.log('✅ Plugin loaded successfully\n');
  
  // Test SPARQL processor
  if (plugin.processor) {
    console.log('🔍 Testing SPARQL processor...');
    
    const mockEl = document.createElement('div');
    const mockContext = { sourcePath: 'test.md' };
    
    // Test with valid query
    console.log('\nTest 1: Valid SELECT query');
    plugin.processor('SELECT * WHERE { ?s ?p ?o } LIMIT 5', mockEl, mockContext);
    
    // Check for container
    const container = mockEl.children.find(c => c.className === 'exocortex-sparql-container');
    if (container) {
      console.log('✅ Container found');
      
      // Check for title
      const title = container.children.find(c => c.tagName === 'H3');
      if (title && title.textContent === 'SPARQL Query Results') {
        console.log('✅ Title correct: "SPARQL Query Results"');
      } else {
        console.log(`❌ Title incorrect: "${title?.textContent || 'not found'}"`);
      }
      
      // Check for query pre
      const pre = container.children.find(c => c.tagName === 'PRE');
      if (pre && pre.textContent.includes('SELECT')) {
        console.log('✅ Query display found');
      } else {
        console.log('❌ Query display not found');
      }
    } else {
      console.log('❌ Container not found');
      console.log('Children:', mockEl.children.map(c => c.className));
    }
    
    // Test with invalid query
    console.log('\nTest 2: Invalid query');
    const mockEl2 = document.createElement('div');
    plugin.processor('INVALID QUERY', mockEl2, mockContext);
    
    const container2 = mockEl2.children.find(c => c.className === 'exocortex-sparql-container');
    if (container2) {
      const error = container2.children.find(c => c.className === 'sparql-error');
      if (error) {
        console.log('✅ Error element found');
        if (error.style.cssText.includes('background: #ffebee')) {
          console.log('✅ Error styling correct');
        }
      } else {
        console.log('❌ Error element not found');
      }
    }
    
  } else {
    console.log('❌ SPARQL processor not registered');
  }
  
} catch (error) {
  console.error('❌ Error loading plugin:', error.message);
  process.exit(1);
}

console.log('\n✅ All checks completed');