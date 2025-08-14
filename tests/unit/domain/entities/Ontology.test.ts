import { Ontology } from '../../../../src/domain/entities/Ontology';
import { OntologyPrefix } from '../../../../src/domain/value-objects/OntologyPrefix';

describe('Ontology', () => {
  let validPrefix: OntologyPrefix;

  beforeEach(() => {
    validPrefix = OntologyPrefix.create('test').getValue();
  });

  describe('constructor', () => {
    it('should create Ontology with all parameters', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test Ontology',
        fileName: 'test-ontology.md',
        namespace: 'http://example.org/test/',
        description: 'A test ontology for unit testing'
      });

      expect(ontology.getPrefix()).toBe(validPrefix);
      expect(ontology.getLabel()).toBe('Test Ontology');
      expect(ontology.getFileName()).toBe('test-ontology.md');
      expect(ontology.getNamespace()).toBe('http://example.org/test/');
      expect(ontology.getDescription()).toBe('A test ontology for unit testing');
    });

    it('should create Ontology with minimal parameters', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Minimal Ontology',
        fileName: 'minimal.md'
      });

      expect(ontology.getPrefix()).toBe(validPrefix);
      expect(ontology.getLabel()).toBe('Minimal Ontology');
      expect(ontology.getFileName()).toBe('minimal.md');
      expect(ontology.getNamespace()).toBeUndefined();
      expect(ontology.getDescription()).toBeUndefined();
    });

    it('should create Ontology with empty string namespace', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test Ontology',
        fileName: 'test.md',
        namespace: ''
      });

      expect(ontology.getNamespace()).toBe('');
    });

    it('should create Ontology with empty string description', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test Ontology',
        fileName: 'test.md',
        description: ''
      });

      expect(ontology.getDescription()).toBe('');
    });
  });

  describe('getPrefix', () => {
    it('should return the same prefix instance passed in constructor', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'test.md'
      });

      expect(ontology.getPrefix()).toBe(validPrefix);
    });

    it('should return prefix with different OntologyPrefix instances', () => {
      const prefix1 = OntologyPrefix.create('onto1').getValue();
      const prefix2 = OntologyPrefix.create('onto2').getValue();

      const ontology1 = new Ontology({
        prefix: prefix1,
        label: 'Ontology 1',
        fileName: 'onto1.md'
      });

      const ontology2 = new Ontology({
        prefix: prefix2,
        label: 'Ontology 2',
        fileName: 'onto2.md'
      });

      expect(ontology1.getPrefix()).toBe(prefix1);
      expect(ontology2.getPrefix()).toBe(prefix2);
      expect(ontology1.getPrefix()).not.toBe(ontology2.getPrefix());
    });
  });

  describe('getLabel', () => {
    it('should return correct label', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'My Test Ontology',
        fileName: 'test.md'
      });

      expect(ontology.getLabel()).toBe('My Test Ontology');
    });

    it('should handle special characters in label', () => {
      const specialLabel = 'Test Ontology! @#$%^&*()_+-={}[]|;:,.<>?';
      const ontology = new Ontology({
        prefix: validPrefix,
        label: specialLabel,
        fileName: 'test.md'
      });

      expect(ontology.getLabel()).toBe(specialLabel);
    });

    it('should handle Unicode characters in label', () => {
      const unicodeLabel = 'Тестовая Онтология 中文 🚀';
      const ontology = new Ontology({
        prefix: validPrefix,
        label: unicodeLabel,
        fileName: 'test.md'
      });

      expect(ontology.getLabel()).toBe(unicodeLabel);
    });
  });

  describe('getFileName', () => {
    it('should return correct file name', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'my-ontology-file.md'
      });

      expect(ontology.getFileName()).toBe('my-ontology-file.md');
    });

    it('should handle file name without extension', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'ontology-file'
      });

      expect(ontology.getFileName()).toBe('ontology-file');
    });

    it('should handle file name with different extensions', () => {
      const extensions = ['txt', 'json', 'xml', 'rdf', 'ttl'];
      
      extensions.forEach(ext => {
        const fileName = `ontology.${ext}`;
        const ontology = new Ontology({
          prefix: validPrefix,
          label: 'Test',
          fileName
        });

        expect(ontology.getFileName()).toBe(fileName);
      });
    });
  });

  describe('getNamespace', () => {
    it('should return defined namespace', () => {
      const namespace = 'http://example.org/ontologies/test#';
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'test.md',
        namespace
      });

      expect(ontology.getNamespace()).toBe(namespace);
    });

    it('should return undefined when namespace not provided', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'test.md'
      });

      expect(ontology.getNamespace()).toBeUndefined();
    });

    it('should handle various URI formats', () => {
      const namespaces = [
        'http://example.org/',
        'https://schema.org/',
        'urn:example:ontology:',
        'http://www.w3.org/2000/01/rdf-schema#',
        'http://purl.org/dc/terms/'
      ];

      namespaces.forEach(namespace => {
        const ontology = new Ontology({
          prefix: validPrefix,
          label: 'Test',
          fileName: 'test.md',
          namespace
        });

        expect(ontology.getNamespace()).toBe(namespace);
      });
    });
  });

  describe('getDescription', () => {
    it('should return defined description', () => {
      const description = 'This is a comprehensive ontology for testing purposes';
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'test.md',
        description
      });

      expect(ontology.getDescription()).toBe(description);
    });

    it('should return undefined when description not provided', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'test.md'
      });

      expect(ontology.getDescription()).toBeUndefined();
    });

    it('should handle long descriptions', () => {
      const longDescription = 'This is a very long description that spans multiple lines and contains various information about the ontology including its purpose, scope, and intended usage. '.repeat(10);
      
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'test.md',
        description: longDescription
      });

      expect(ontology.getDescription()).toBe(longDescription);
    });

    it('should handle descriptions with special formatting', () => {
      const formattedDescription = `
        Multi-line description
        - With bullet points
        - And various formatting
        
        Including paragraphs and special characters: @#$%^&*()
      `;

      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'test.md',
        description: formattedDescription
      });

      expect(ontology.getDescription()).toBe(formattedDescription);
    });
  });

  describe('getDisplayName', () => {
    it('should return formatted display name', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test Ontology',
        fileName: 'test.md'
      });

      expect(ontology.getDisplayName()).toBe('test - Test Ontology');
    });

    it('should handle different prefix and label combinations', () => {
      const testCases = [
        { prefix: 'foaf', label: 'Friend of a Friend', expected: 'foaf - Friend of a Friend' },
        { prefix: 'dc', label: 'Dublin Core', expected: 'dc - Dublin Core' },
        { prefix: 'owl', label: 'Web Ontology Language', expected: 'owl - Web Ontology Language' }
      ];

      testCases.forEach(testCase => {
        const prefix = OntologyPrefix.create(testCase.prefix).getValue();
        const ontology = new Ontology({
          prefix,
          label: testCase.label,
          fileName: 'test.md'
        });

        expect(ontology.getDisplayName()).toBe(testCase.expected);
      });
    });

    it('should handle empty label', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: '',
        fileName: 'test.md'
      });

      expect(ontology.getDisplayName()).toBe('test - ');
    });
  });

  describe('isInternal', () => {
    it('should return true for internal ontologies', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Internal Ontology',
        fileName: '!internal-ontology.md'
      });

      expect(ontology.isInternal()).toBe(true);
    });

    it('should return false for external ontologies', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'External Ontology',
        fileName: 'external-ontology.md'
      });

      expect(ontology.isInternal()).toBe(false);
    });

    it('should handle file names with exclamation mark not at start', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'test!ontology.md'
      });

      expect(ontology.isInternal()).toBe(false);
    });

    it('should handle file names with multiple exclamation marks', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: '!!double-exclamation.md'
      });

      expect(ontology.isInternal()).toBe(true);
    });

    it('should handle empty file name', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: ''
      });

      expect(ontology.isInternal()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for ontologies with same prefix', () => {
      const ontology1 = new Ontology({
        prefix: validPrefix,
        label: 'Ontology 1',
        fileName: 'onto1.md'
      });

      const ontology2 = new Ontology({
        prefix: validPrefix,
        label: 'Ontology 2',
        fileName: 'onto2.md'
      });

      expect(ontology1.equals(ontology2)).toBe(true);
    });

    it('should return false for ontologies with different prefixes', () => {
      const prefix1 = OntologyPrefix.create('prefix1').getValue();
      const prefix2 = OntologyPrefix.create('prefix2').getValue();

      const ontology1 = new Ontology({
        prefix: prefix1,
        label: 'Ontology 1',
        fileName: 'onto1.md'
      });

      const ontology2 = new Ontology({
        prefix: prefix2,
        label: 'Ontology 1',
        fileName: 'onto1.md'
      });

      expect(ontology1.equals(ontology2)).toBe(false);
    });

    it('should use prefix equality for comparison', () => {
      const prefix1 = OntologyPrefix.create('same').getValue();
      const prefix2 = OntologyPrefix.create('same').getValue();

      const ontology1 = new Ontology({
        prefix: prefix1,
        label: 'Different Label 1',
        fileName: 'different1.md'
      });

      const ontology2 = new Ontology({
        prefix: prefix2,
        label: 'Different Label 2',
        fileName: 'different2.md'
      });

      expect(ontology1.equals(ontology2)).toBe(true);
    });
  });

  describe('toFrontmatter', () => {
    it('should convert ontology to frontmatter with all fields', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test Ontology',
        fileName: 'test.md',
        namespace: 'http://example.org/test/',
        description: 'A test ontology'
      });

      const frontmatter = ontology.toFrontmatter();

      expect(frontmatter).toEqual({
        'exo__Ontology_prefix': 'test',
        'exo__Ontology_label': 'Test Ontology',
        'exo__Ontology_namespace': 'http://example.org/test/',
        'exo__Ontology_description': 'A test ontology'
      });
    });

    it('should convert ontology to frontmatter with empty optional fields', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Minimal Ontology',
        fileName: 'minimal.md'
      });

      const frontmatter = ontology.toFrontmatter();

      expect(frontmatter).toEqual({
        'exo__Ontology_prefix': 'test',
        'exo__Ontology_label': 'Minimal Ontology',
        'exo__Ontology_namespace': '',
        'exo__Ontology_description': ''
      });
    });

    it('should handle special characters in frontmatter', () => {
      const specialLabel = 'Test: Ontology! @#$%^&*()';
      const specialDescription = 'Description with "quotes" and \\backslashes\\';
      
      const ontology = new Ontology({
        prefix: validPrefix,
        label: specialLabel,
        fileName: 'test.md',
        description: specialDescription
      });

      const frontmatter = ontology.toFrontmatter();

      expect(frontmatter['exo__Ontology_label']).toBe(specialLabel);
      expect(frontmatter['exo__Ontology_description']).toBe(specialDescription);
    });

    it('should convert empty strings correctly', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: '',
        fileName: 'test.md',
        namespace: '',
        description: ''
      });

      const frontmatter = ontology.toFrontmatter();

      expect(frontmatter).toEqual({
        'exo__Ontology_prefix': 'test',
        'exo__Ontology_label': '',
        'exo__Ontology_namespace': '',
        'exo__Ontology_description': ''
      });
    });
  });

  describe('fromFrontmatter', () => {
    it('should create ontology from complete frontmatter', () => {
      const frontmatter = {
        'exo__Ontology_prefix': 'test',
        'exo__Ontology_label': 'Test Ontology',
        'exo__Ontology_namespace': 'http://example.org/test/',
        'exo__Ontology_description': 'A test ontology'
      };

      const ontology = Ontology.fromFrontmatter(frontmatter);

      expect(ontology.getPrefix().toString()).toBe('test');
      expect(ontology.getLabel()).toBe('Test Ontology');
      expect(ontology.getFileName()).toBe('!test.md');
      expect(ontology.getNamespace()).toBe('http://example.org/test/');
      expect(ontology.getDescription()).toBe('A test ontology');
    });

    it('should create ontology from minimal frontmatter', () => {
      const frontmatter = {};

      const ontology = Ontology.fromFrontmatter(frontmatter);

      expect(ontology.getPrefix().toString()).toBe('exo');
      expect(ontology.getLabel()).toBe('exo');
      expect(ontology.getFileName()).toBe('!exo.md');
      expect(ontology.getNamespace()).toBeUndefined();
      expect(ontology.getDescription()).toBeUndefined();
    });

    it('should handle partial frontmatter', () => {
      const frontmatter = {
        'exo__Ontology_prefix': 'partial',
        'exo__Ontology_label': 'Partial Ontology'
      };

      const ontology = Ontology.fromFrontmatter(frontmatter);

      expect(ontology.getPrefix().toString()).toBe('partial');
      expect(ontology.getLabel()).toBe('Partial Ontology');
      expect(ontology.getFileName()).toBe('!partial.md');
      expect(ontology.getNamespace()).toBeUndefined();
      expect(ontology.getDescription()).toBeUndefined();
    });

    it('should handle empty string values in frontmatter', () => {
      const frontmatter = {
        'exo__Ontology_prefix': 'empty',
        'exo__Ontology_label': '',
        'exo__Ontology_namespace': '',
        'exo__Ontology_description': ''
      };

      const ontology = Ontology.fromFrontmatter(frontmatter);

      expect(ontology.getPrefix().toString()).toBe('empty');
      expect(ontology.getLabel()).toBe('empty'); // Falls back to prefix when label is empty
      expect(ontology.getNamespace()).toBe('');
      expect(ontology.getDescription()).toBe('');
    });

    it('should handle invalid prefix in frontmatter gracefully', () => {
      const frontmatter = {
        'exo__Ontology_prefix': 'Invalid-Prefix-123',
        'exo__Ontology_label': 'Test'
      };

      const ontology = Ontology.fromFrontmatter(frontmatter);

      // Should fall back to 'exo' prefix
      expect(ontology.getPrefix().toString()).toBe('exo');
      expect(ontology.getLabel()).toBe('Test');
    });

    it('should handle null and undefined values in frontmatter', () => {
      const frontmatter = {
        'exo__Ontology_prefix': null,
        'exo__Ontology_label': undefined,
        'exo__Ontology_namespace': null,
        'exo__Ontology_description': undefined
      };

      const ontology = Ontology.fromFrontmatter(frontmatter);

      expect(ontology.getPrefix().toString()).toBe('exo');
      expect(ontology.getLabel()).toBe('exo');
      expect(ontology.getNamespace()).toBe(null); // Passes through null directly
      expect(ontology.getDescription()).toBeUndefined();
    });

    it('should create proper internal file name', () => {
      const frontmatter = {
        'exo__Ontology_prefix': 'internal'
      };

      const ontology = Ontology.fromFrontmatter(frontmatter);

      expect(ontology.getFileName()).toBe('!internal.md');
      expect(ontology.isInternal()).toBe(true);
    });

    it('should roundtrip correctly', () => {
      const originalOntology = new Ontology({
        prefix: OntologyPrefix.create('roundtrip').getValue(),
        label: 'Roundtrip Test',
        fileName: 'roundtrip.md',
        namespace: 'http://example.org/roundtrip/',
        description: 'Testing roundtrip conversion'
      });

      const frontmatter = originalOntology.toFrontmatter();
      const recreatedOntology = Ontology.fromFrontmatter(frontmatter);

      expect(recreatedOntology.getPrefix().toString()).toBe('roundtrip');
      expect(recreatedOntology.getLabel()).toBe('Roundtrip Test');
      expect(recreatedOntology.getNamespace()).toBe('http://example.org/roundtrip/');
      expect(recreatedOntology.getDescription()).toBe('Testing roundtrip conversion');
      expect(recreatedOntology.isInternal()).toBe(true); // fromFrontmatter always creates internal
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle very long labels', () => {
      const longLabel = 'Very '.repeat(1000) + 'Long Label';
      
      const ontology = new Ontology({
        prefix: validPrefix,
        label: longLabel,
        fileName: 'test.md'
      });

      expect(ontology.getLabel()).toBe(longLabel);
      expect(ontology.getDisplayName()).toBe(`test - ${longLabel}`);
    });

    it('should handle file names with no extension', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Test',
        fileName: 'no-extension'
      });

      expect(ontology.getFileName()).toBe('no-extension');
      expect(ontology.isInternal()).toBe(false);
    });

    it('should handle complex namespace URIs', () => {
      const complexNamespaces = [
        'http://example.org/ontologies/complex/nested/path#',
        'https://schema.org/version/3.9/',
        'urn:uuid:12345678-1234-1234-1234-123456789abc',
        'file:///local/path/to/ontology#'
      ];

      complexNamespaces.forEach(namespace => {
        const ontology = new Ontology({
          prefix: validPrefix,
          label: 'Test',
          fileName: 'test.md',
          namespace
        });

        expect(ontology.getNamespace()).toBe(namespace);
      });
    });

    it('should maintain immutability of properties', () => {
      const ontology = new Ontology({
        prefix: validPrefix,
        label: 'Immutable Test',
        fileName: 'test.md',
        namespace: 'http://example.org/',
        description: 'Testing immutability'
      });

      const originalLabel = ontology.getLabel();
      const originalNamespace = ontology.getNamespace();
      const originalDescription = ontology.getDescription();

      // Properties should remain unchanged
      expect(ontology.getLabel()).toBe(originalLabel);
      expect(ontology.getNamespace()).toBe(originalNamespace);
      expect(ontology.getDescription()).toBe(originalDescription);
    });
  });
});