import { ProjectCreationService } from '../../src/services/ProjectCreationService';

// Refactored tests to eliminate duplication using parameterized scenarios

describe('ProjectCreationService', () => {
  let service: any;
  let mockVault: any;

  beforeEach(() => {
    // Set up a mock vault and service before each test
    mockVault = { create: jest.fn() };
    service = new ProjectCreationService(mockVault as any);
  });

  describe('generateProjectFrontmatter', () => {
    const baseMetadata = { exo__Asset_isDefinedBy: '"[[!user]]"' };

    interface EffortScenario {
      sourceClass: string;
      expectedKey: string;
      expectedValue: string;
    }

    const effortScenarios: EffortScenario[] = [
      {
        sourceClass: 'ems__Area',
        expectedKey: 'ems__Effort_area',
        expectedValue: '[[My Area]]',
      },
      {
        sourceClass: 'ems__Initiative',
        expectedKey: 'ems__Effort_parent',
        expectedValue: '[[My Area]]',
      },
    ];

    test.each(effortScenarios)('adds correct effort field for $sourceClass', ({ sourceClass, expectedKey, expectedValue }) => {
      const frontmatter = service.generateProjectFrontmatter(baseMetadata, 'My Area', sourceClass, 'Label');
      expect(frontmatter[expectedKey]).toBe(expectedValue);
    });

    interface DefinedByScenario {
      metadata: any;
      expected: string[];
    }

    const definedByCases: DefinedByScenario[] = [
      { metadata: { exo__Asset_isDefinedBy: '"[[!user]]"' }, expected: ['[[!user]]'] },
      { metadata: { exo__Asset_isDefinedBy: '"[[!user]]", "[[!team]]"' }, expected: ['[[!user]]', '[[!team]]'] },
    ];

    test.each(definedByCases)('parses exo__Asset_isDefinedBy values', ({ metadata, expected }) => {
      const fm = service.generateProjectFrontmatter(metadata, 'My Area', 'ems__Area', 'Label');
      expect(fm.exo__Asset_isDefinedBy).toEqual(expected);
    });

    it('generates timestamp in ISO format', () => {
      const fm = service.generateProjectFrontmatter(baseMetadata, 'My Area', 'ems__Area', 'Label');
      expect(fm.exo__Asset_creationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('uses provided UID when specified', () => {
      const fm = service.generateProjectFrontmatter({ ...baseMetadata, exo__Asset_uid: '1234' }, 'My Area', 'ems__Area', 'Label');
      expect(fm.exo__Asset_uid).toBe('1234');
    });

    it('creates UID when none provided', () => {
      const fm = service.generateProjectFrontmatter(baseMetadata, 'My Area', 'ems__Area', 'Label');
      expect(fm.exo__Asset_uid).toMatch(/[0-9a-f-]{36}/);
    });

    it('handles label trimming and omission', () => {
      const fmEmpty = service.generateProjectFrontmatter(baseMetadata, 'My Area', 'ems__Area', '');
      expect(fmEmpty.exo__Asset_label).toBeUndefined();
      const fmTrim = service.generateProjectFrontmatter(baseMetadata, 'My Area', 'ems__Area', '  Test Label  ');
      expect(fmTrim.exo__Asset_label).toBe('Test Label');
    });
  });

  describe('createProject', () => {
    it('should create file with UUID-based filename', async () => {
      const mockSourceFile = { basename: 'Test Area', parent: { path: '03 Knowledge/user' } } as any;
      await service.createProject(mockSourceFile, { exo__Asset_isDefinedBy: '"[[!user]]"' }, 'ems__Area');
      expect(mockVault.create).toHaveBeenCalledTimes(1);
      const [filePath] = mockVault.create.mock.calls[0];
      expect(filePath).toMatch(/^03 Knowledge\/user\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.md$/);
    });

    it('should use same UUID for filename and exo__Asset_uid', async () => {
      const mockSourceFile = { basename: 'Test Initiative', parent: { path: '03 Knowledge/user' } } as any;
      await service.createProject(mockSourceFile, { exo__Asset_isDefinedBy: '"[[!user]]"' }, 'ems__Initiative');
      const [filePath, content] = mockVault.create.mock.calls[0];
      const filenameMatch = filePath.match(/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.md$/);
      expect(filenameMatch).not.toBeNull();
      const filenameUid = filenameMatch![1];
      const uidMatch = content.match(/exo__Asset_uid: ([0-9a-f-]+)/);
      expect(uidMatch).not.toBeNull();
      const frontmatterUid = uidMatch![1];
      expect(filenameUid).toBe(frontmatterUid);
    });
  });
});
