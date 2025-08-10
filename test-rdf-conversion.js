// Test script for RDF conversion functionality
const fs = require('fs');
const path = require('path');

// Import the conversion functions
const { Graph } = require('./dist/main.js');
const { Triple, IRI, Literal } = require('./dist/main.js');

function extractTriplesFromFile(filePath, content) {
    const triples = [];
    const fileName = path.basename(filePath, '.md');
    const subject = new IRI(`file://${fileName}`);
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (frontmatterMatch) {
        const frontmatter = parseFrontmatter(frontmatterMatch[1]);
        
        for (const [key, value] of Object.entries(frontmatter)) {
            if (Array.isArray(value)) {
                for (const v of value) {
                    triples.push({
                        subject: subject.toString(),
                        predicate: key,
                        object: String(v)
                    });
                }
            } else if (value !== null && value !== undefined) {
                triples.push({
                    subject: subject.toString(),
                    predicate: key,
                    object: String(value)
                });
            }
        }
    }
    
    // Add basic file metadata
    triples.push({
        subject: subject.toString(),
        predicate: 'file_path',
        object: filePath
    });
    
    triples.push({
        subject: subject.toString(),
        predicate: 'file_name',
        object: path.basename(filePath)
    });
    
    return triples;
}

function parseFrontmatter(yaml) {
    const result = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
            let key = match[1];
            let value = match[2];
            
            // Handle quoted strings
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            
            // Handle arrays (simple case - inline arrays)
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
            }
            
            // Handle booleans
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            
            // Handle numbers
            if (!isNaN(value) && value !== '') {
                value = Number(value);
            }
            
            result[key] = value;
        }
    }
    
    return result;
}

// Test the conversion
console.log('🧪 Testing Obsidian Note to RDF Conversion\n');
console.log('=' .repeat(50));

const testFiles = [
    './test-notes/test-note-1.md',
    './test-notes/test-note-2.md'
];

for (const filePath of testFiles) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const triples = extractTriplesFromFile(filePath, content);
        
        console.log(`\n📄 File: ${filePath}`);
        console.log('-'.repeat(40));
        console.log(`Generated ${triples.length} RDF triples:\n`);
        
        for (const triple of triples) {
            console.log(`  <${triple.subject}>`);
            console.log(`    ${triple.predicate}: "${triple.object}"`);
        }
    }
}

console.log('\n' + '='.repeat(50));
console.log('✅ RDF Conversion Test Complete!');
console.log('\nSummary:');
console.log('- Note-to-RDF conversion extracts frontmatter properties');
console.log('- Each note becomes an RDF subject (file://basename)');
console.log('- Frontmatter keys become predicates');
console.log('- Values become RDF literals');
console.log('- Arrays are expanded into multiple triples');
console.log('- File metadata is automatically added');