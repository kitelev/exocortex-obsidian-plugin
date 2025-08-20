import { Asset } from '../../../src/domain/entities/Asset';
import { AssetId } from '../../../src/domain/value-objects/AssetId';
import { ClassName } from '../../../src/domain/value-objects/ClassName';
import { OntologyPrefix } from '../../../src/domain/value-objects/OntologyPrefix';

describe('Asset Entity', () => {
  describe('Construction', () => {
    it('should create an asset with valid properties', () => {
      // Given
      const label = 'Test Asset';
      const id = AssetId.generate();
      const className = ClassName.create('exo__Asset').getValue()!;
      const ontology = OntologyPrefix.create('exo').getValue()!;
      
      // When
      const assetResult = Asset.create({
        id,
        label,
        className,
        ontology
      });
      
      // Then
      expect(assetResult.isSuccess).toBe(true);
      const asset = assetResult.getValue()!;
      expect(asset.getTitle()).toBe(label);
      expect(asset.getClassName()).toEqual(className);
      expect(asset.getOntologyPrefix()).toEqual(ontology);
      expect(asset.getId()).toBeDefined();
      expect(asset.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should fail when label is empty', () => {
      // Given
      const id = AssetId.generate();
      const className = ClassName.create('exo__Asset').getValue()!;
      const ontology = OntologyPrefix.create('exo').getValue()!;
      
      // When
      const assetResult = Asset.create({
        id,
        label: '',
        className,
        ontology
      });
      
      // Then
      expect(assetResult.isFailure).toBe(true);
      expect(assetResult.error).toBe('Asset label cannot be empty');
    });

    it('should handle missing className gracefully', () => {
      // When
      const result = Asset.create({
        id: AssetId.generate(),
        label: 'Test',
        className: null as any,
        ontology: OntologyPrefix.create('exo').getValue()!
      });
      
      // Then
      // Should either fail or use default, but not throw
      expect(result).toBeDefined();
    });
  });

  describe('Business Methods', () => {
    let asset: Asset;
    
    beforeEach(() => {
      const result = Asset.create({
        id: AssetId.generate(),
        label: 'Test Asset',
        className: ClassName.create('exo__Asset').getValue()!,
        ontology: OntologyPrefix.create('exo').getValue()!
      });
      asset = result.getValue()!;
    });

    it('should update title', async () => {
      // Given
      const newTitle = 'Updated Title';
      const originalUpdatedAt = asset.getUpdatedAt();
      
      // Wait a moment to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 2));
      
      // When
      asset.updateTitle(newTitle);
      
      // Then
      expect(asset.getTitle()).toBe(newTitle);
      expect(asset.getUpdatedAt().getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should set and get properties', () => {
      // When
      asset.setProperty('customProp', 'value');
      
      // Then
      expect(asset.getProperty('customProp')).toBe('value');
      expect(asset.getProperties().get('customProp')).toBe('value');
    });

    it('should remove properties', () => {
      // Given
      asset.setProperty('tempProp', 'value');
      
      // When
      asset.removeProperty('tempProp');
      
      // Then
      expect(asset.getProperty('tempProp')).toBeUndefined();
    });

    it('should change class', () => {
      // Given
      const newClass = ClassName.create('ems__Task').getValue()!;
      
      // When
      asset.changeClass(newClass);
      
      // Then
      expect(asset.getClassName()).toBe(newClass);
    });
  });

  describe('Serialization', () => {
    it('should convert to frontmatter with mandatory fields', () => {
      // Given
      const id = AssetId.generate();
      const className = ClassName.create('ems__Task').getValue()!;
      const ontology = OntologyPrefix.create('ems').getValue()!;
      
      const assetResult = Asset.create({
        id,
        label: 'Test Asset',
        className,
        ontology,
        properties: {
          'ems__Task_status': 'todo',
          'ems__Task_priority': 'high'
        }
      });
      
      const asset = assetResult.getValue()!;
      
      // When
      const frontmatter = asset.toFrontmatter();
      
      // Then - Verify all mandatory fields are present
      expect(frontmatter['exo__Asset_uid']).toBeDefined();
      expect(frontmatter['exo__Asset_uid']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(frontmatter['exo__Asset_isDefinedBy']).toBe('[[!ems]]');
      expect(frontmatter['exo__Asset_createdAt']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(frontmatter['exo__Asset_label']).toBe('Test Asset');
      expect(frontmatter['exo__Instance_class']).toEqual(['[[ems__Task]]']);
      expect(frontmatter['ems__Task_status']).toBe('todo');
      expect(frontmatter['ems__Task_priority']).toBe('high');
    });

    it('should create from valid frontmatter', () => {
      // Given - Valid frontmatter with all mandatory fields
      const frontmatter = {
        'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_isDefinedBy': '[[!ems]]',
        'exo__Asset_createdAt': '2024-01-01T00:00:00',
        'exo__Instance_class': ['[[ems__Task]]'],
        'ems__Task_status': 'done'
      };
      
      // When
      const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
      
      // Then
      expect(asset).not.toBeNull();
      expect(asset!.getId().toString()).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(asset!.getTitle()).toBe('Test Asset');
      expect(asset!.getClassName().toString()).toBe('ems__Task');
      expect(asset!.getOntologyPrefix().toString()).toBe('ems');
      expect(asset!.getProperty('ems__Task_status')).toBe('done');
    });

    it('should reject frontmatter missing mandatory exo__Asset_uid', () => {
      // Given - Missing UID
      const frontmatter = {
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_isDefinedBy': '[[!ems]]',
        'exo__Asset_createdAt': '2024-01-01T00:00:00'
      };
      
      // When
      const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
      
      // Then
      expect(asset).toBeNull();
    });

    it('should reject frontmatter with invalid UUID format', () => {
      // Given - Invalid UUID format
      const frontmatter = {
        'exo__Asset_uid': 'not-a-valid-uuid',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_isDefinedBy': '[[!ems]]',
        'exo__Asset_createdAt': '2024-01-01T00:00:00'
      };
      
      // When
      const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
      
      // Then
      expect(asset).toBeNull();
    });

    it('should reject frontmatter missing mandatory exo__Asset_isDefinedBy', () => {
      // Given - Missing isDefinedBy
      const frontmatter = {
        'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_createdAt': '2024-01-01T00:00:00'
      };
      
      // When
      const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
      
      // Then
      expect(asset).toBeNull();
    });

    it('should reject frontmatter with invalid ontology reference format', () => {
      // Given - Invalid ontology format
      const frontmatter = {
        'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_isDefinedBy': 'invalid-format',
        'exo__Asset_createdAt': '2024-01-01T00:00:00'
      };
      
      // When
      const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
      
      // Then
      expect(asset).toBeNull();
    });

    it('should reject frontmatter missing mandatory exo__Asset_createdAt', () => {
      // Given - Missing createdAt
      const frontmatter = {
        'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_isDefinedBy': '[[!ems]]'
      };
      
      // When
      const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
      
      // Then
      expect(asset).toBeNull();
    });

    it('should reject frontmatter with invalid ISO timestamp format', () => {
      // Given - Invalid timestamp format
      const frontmatter = {
        'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_isDefinedBy': '[[!ems]]',
        'exo__Asset_createdAt': '01/01/2024'
      };
      
      // When
      const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
      
      // Then
      expect(asset).toBeNull();
    });

    it('should accept various valid ontology reference formats', () => {
      const baseData = {
        'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_createdAt': '2024-01-01T00:00:00'
      };
      
      const validFormats = [
        '[[!exo]]',
        '[[Ontology - Exocortex]]',
        '[[!custom_ontology]]',
        '[[My Custom Ontology]]'
      ];
      
      validFormats.forEach(format => {
        const frontmatter = {
          ...baseData,
          'exo__Asset_isDefinedBy': format
        };
        
        const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
        expect(asset).not.toBeNull();
      });
    });

    it('should accept various valid ISO timestamp formats', () => {
      const baseData = {
        'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_isDefinedBy': '[[!exo]]'
      };
      
      const validTimestamps = [
        '2024-01-01T00:00:00',
        '2024-01-01T00:00:00.000Z',
        '2024-01-01T00:00:00+00:00',
        '2024-12-31T23:59:59.999Z'
      ];
      
      validTimestamps.forEach(timestamp => {
        const frontmatter = {
          ...baseData,
          'exo__Asset_createdAt': timestamp
        };
        
        const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
        expect(asset).not.toBeNull();
      });
    });
  });

  describe('Mandatory Asset Validation', () => {
    it('should validate all mandatory fields correctly', () => {
      // Test the private validateMandatoryProperties method through fromFrontmatter
      const validFrontmatter = {
        'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'exo__Asset_isDefinedBy': '[[!exo]]',
        'exo__Asset_createdAt': '2024-01-01T00:00:00',
        'exo__Asset_label': 'Valid Asset'
      };
      
      const asset = Asset.fromFrontmatter(validFrontmatter, 'test.md');
      expect(asset).not.toBeNull();
    });

    it('should handle edge cases in UUID validation', () => {
      const testCases = [
        { uid: 'F47AC10B-58CC-4372-A567-0E02B2C3D479', expected: true }, // Uppercase
        { uid: 'f47ac10b58cc4372a5670e02b2c3d479', expected: false }, // No dashes
        { uid: 'f47ac10b-58cc-4372-a567-0e02b2c3d47', expected: false }, // Too short
        { uid: 'f47ac10b-58cc-4372-a567-0e02b2c3d4799', expected: false }, // Too long
        { uid: 'g47ac10b-58cc-4372-a567-0e02b2c3d479', expected: false } // Invalid character
      ];
      
      testCases.forEach(({ uid, expected }) => {
        const frontmatter = {
          'exo__Asset_uid': uid,
          'exo__Asset_isDefinedBy': '[[!exo]]',
          'exo__Asset_createdAt': '2024-01-01T00:00:00'
        };
        
        const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
        if (expected) {
          expect(asset).not.toBeNull();
        } else {
          expect(asset).toBeNull();
        }
      });
    });

    it('should handle edge cases in ontology reference validation', () => {
      const testCases = [
        { ref: '[[!exo]]', expected: true },
        { ref: '[[Ontology - Name]]', expected: true },
        { ref: '[[!custom_ontology_123]]', expected: true },
        { ref: '[!exo]', expected: false }, // Missing brackets
        { ref: '[[exo]]', expected: true }, // Without exclamation
        { ref: '[[!!exo]]', expected: false }, // Double exclamation
        { ref: '[[!]]', expected: false }, // Empty after exclamation
        { ref: '[[!123]]', expected: false }, // Starting with number
        { ref: 'exo', expected: false } // No brackets at all
      ];
      
      testCases.forEach(({ ref, expected }) => {
        const frontmatter = {
          'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          'exo__Asset_isDefinedBy': ref,
          'exo__Asset_createdAt': '2024-01-01T00:00:00'
        };
        
        const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
        if (expected) {
          expect(asset).not.toBeNull();
        } else {
          expect(asset).toBeNull();
        }
      });
    });

    it('should handle edge cases in ISO timestamp validation', () => {
      const testCases = [
        { timestamp: '2024-01-01T00:00:00', expected: true },
        { timestamp: '2024-01-01T00:00:00.123', expected: true },
        { timestamp: '2024-01-01T00:00:00.123Z', expected: true },
        { timestamp: '2024-01-01T00:00:00+01:00', expected: true },
        { timestamp: '2024-01-01T00:00:00-05:00', expected: true },
        { timestamp: '2024-1-1T0:0:0', expected: false }, // No zero padding
        { timestamp: '24-01-01T00:00:00', expected: false }, // Two-digit year
        { timestamp: '2024/01/01 00:00:00', expected: false }, // Wrong format
        { timestamp: '2024-01-01 00:00:00', expected: false }, // Space instead of T
        { timestamp: '2024-13-01T00:00:00', expected: false }, // Invalid month
        { timestamp: '2024-01-32T00:00:00', expected: false }, // Invalid day
        { timestamp: '2024-01-01T25:00:00', expected: false } // Invalid hour
      ];
      
      testCases.forEach(({ timestamp, expected }) => {
        const frontmatter = {
          'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          'exo__Asset_isDefinedBy': '[[!exo]]',
          'exo__Asset_createdAt': timestamp
        };
        
        const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
        if (expected) {
          expect(asset).not.toBeNull();
        } else {
          expect(asset).toBeNull();
        }
      });
    });

    it('should silently ignore assets with multiple validation errors', () => {
      const invalidFrontmatter = {
        'exo__Asset_uid': 'invalid-uuid',
        'exo__Asset_isDefinedBy': 'invalid-format',
        'exo__Asset_createdAt': 'invalid-date'
      };
      
      // Should not throw, should return null
      const asset = Asset.fromFrontmatter(invalidFrontmatter, 'test.md');
      expect(asset).toBeNull();
    });

    it('should handle integration with repository pattern', () => {
      // Simulate repository finding assets with mixed validity
      const mockFiles = [
        {
          frontmatter: {
            'exo__Asset_uid': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            'exo__Asset_isDefinedBy': '[[!exo]]',
            'exo__Asset_createdAt': '2024-01-01T00:00:00',
            'exo__Asset_label': 'Valid Asset'
          },
          filename: 'valid.md'
        },
        {
          frontmatter: {
            'exo__Asset_uid': 'invalid-uuid',
            'exo__Asset_isDefinedBy': '[[!exo]]',
            'exo__Asset_createdAt': '2024-01-01T00:00:00',
            'exo__Asset_label': 'Invalid Asset'
          },
          filename: 'invalid.md'
        },
        {
          frontmatter: {
            'exo__Asset_uid': 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            'exo__Asset_isDefinedBy': '[[!exo]]',
            'exo__Asset_label': 'Another Valid Asset'
            // Missing createdAt - should be invalid
          },
          filename: 'missing-date.md'
        }
      ];
      
      const validAssets = mockFiles
        .map(file => Asset.fromFrontmatter(file.frontmatter, file.filename))
        .filter(asset => asset !== null);
      
      // Only one valid asset should be returned
      expect(validAssets).toHaveLength(1);
      expect(validAssets[0]!.getTitle()).toBe('Valid Asset');
    });
  });
});

describe('Asset Entity - FIRST Principles', () => {
  // Fast - Tests run quickly
  it('should create asset in milliseconds', () => {
    const start = Date.now();
    
    Asset.create({
      id: AssetId.generate(),
      label: 'Performance Test',
      className: ClassName.create('exo__Asset').getValue()!,
      ontology: OntologyPrefix.create('exo').getValue()!
    });
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10); // Should be instant
  });

  // Independent - Tests don't depend on each other
  it('should not affect other asset instances', () => {
    const asset1Result = Asset.create({
      id: AssetId.generate(),
      label: 'Asset 1',
      className: ClassName.create('exo__Asset').getValue()!,
      ontology: OntologyPrefix.create('exo').getValue()!
    });
    const asset1 = asset1Result.getValue()!;
    
    const asset2Result = Asset.create({
      id: AssetId.generate(),
      label: 'Asset 2',
      className: ClassName.create('exo__Asset').getValue()!,
      ontology: OntologyPrefix.create('exo').getValue()!
    });
    const asset2 = asset2Result.getValue()!;
    
    asset1.setProperty('prop', 'value1');
    asset2.setProperty('prop', 'value2');
    
    expect(asset1.getProperty('prop')).toBe('value1');
    expect(asset2.getProperty('prop')).toBe('value2');
  });

  // Repeatable - Same results every run
  it('should generate consistent IDs', () => {
    const assetResult = Asset.create({
      id: AssetId.generate(),
      label: 'Repeatable Test',
      className: ClassName.create('exo__Asset').getValue()!,
      ontology: OntologyPrefix.create('exo').getValue()!
    });
    const asset = assetResult.getValue()!;
    
    const id1 = asset.getId().toString();
    const id2 = asset.getId().toString();
    
    expect(id1).toBe(id2);
  });

  // Self-Validating - Clear pass/fail
  it('should clearly validate required fields', () => {
    const validAsset = () => Asset.create({
      id: AssetId.generate(),
      label: 'Valid',
      className: ClassName.create('exo__Asset').getValue()!,
      ontology: OntologyPrefix.create('exo').getValue()!
    });
    
    const invalidAsset = () => Asset.create({
      id: AssetId.generate(),
      label: '',
      className: ClassName.create('exo__Asset').getValue()!,
      ontology: OntologyPrefix.create('exo').getValue()!
    });
    
    expect(validAsset().isSuccess).toBe(true);
    expect(invalidAsset().isFailure).toBe(true);
  });

  // Timely - Written with the code
  it('should test current implementation', () => {
    const assetResult = Asset.create({
      id: AssetId.generate(),
      label: 'Current Implementation',
      className: ClassName.create('exo__Asset').getValue()!,
      ontology: OntologyPrefix.create('exo').getValue()!
    });
    const asset = assetResult.getValue()!;
    
    // Tests match current implementation
    expect(asset.getTitle()).toBe('Current Implementation');
    expect(asset.getClassName()).toBeDefined();
    expect(asset.getOntologyPrefix()).toBeDefined();
  });
});