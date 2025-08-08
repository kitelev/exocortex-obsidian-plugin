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
    it('should convert to frontmatter', () => {
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
      
      // Then
      expect(frontmatter['exo__Asset_label']).toBe('Test Asset');
      expect(frontmatter['exo__Asset_isDefinedBy']).toBe('[[!ems]]');
      expect(frontmatter['exo__Instance_class']).toEqual(['[[ems__Task]]']);
      expect(frontmatter['ems__Task_status']).toBe('todo');
      expect(frontmatter['ems__Task_priority']).toBe('high');
    });

    it('should create from frontmatter', () => {
      // Given
      const frontmatter = {
        'exo__Asset_uid': 'test-id-123',
        'exo__Asset_label': 'Test Asset',
        'exo__Asset_isDefinedBy': '[[ems]]',
        'exo__Instance_class': ['[[ems__Task]]'],
        'exo__Asset_createdAt': '2024-01-01T00:00:00.000Z',
        'ems__Task_status': 'done'
      };
      
      // When
      const asset = Asset.fromFrontmatter(frontmatter, 'test.md');
      
      // Then
      expect(asset).not.toBeNull();
      expect(asset!.getId().toString()).toBe('test-id-123');
      expect(asset!.getTitle()).toBe('Test Asset');
      expect(asset!.getClassName().toString()).toBe('ems__Task');
      expect(asset!.getOntologyPrefix().toString()).toBe('ems');
      expect(asset!.getProperty('ems__Task_status')).toBe('done');
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