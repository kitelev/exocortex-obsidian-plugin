import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DynamicLayoutRenderer } from '../../../../src/presentation/renderers/DynamicLayoutRenderer';
import { App, TFile, MarkdownPostProcessorContext } from 'obsidian';

describe('DynamicLayoutRenderer - defaultLayout Support', () => {
  let renderer: DynamicLayoutRenderer;
  let mockApp: App;
  let mockContainer: HTMLElement;
  let mockContext: MarkdownPostProcessorContext;

  beforeEach(() => {
    // Setup mock app
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn(),
        getAbstractFileByPath: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn(),
        getFirstLinkpathDest: jest.fn(),
      },
      workspace: {
        getActiveFile: jest.fn(),
      },
    } as any;

    // Setup container
    mockContainer = document.createElement('div');

    // Setup context
    mockContext = {
      sourcePath: 'test-file.md',
      getSectionInfo: jest.fn(),
      addChild: jest.fn(),
      containerEl: null as any,
      el: null as any,
      frontmatter: {},
    } as any;

    // Create renderer
    renderer = new DynamicLayoutRenderer(mockApp);
  });

  describe('defaultLayout property handling', () => {
    it('should check defaultLayout property first before searching', async () => {
      // Setup class file with defaultLayout
      const classFile = { path: 'exo__Class.md', basename: 'exo__Class' } as TFile;
      const layoutFile = { 
        path: '01 Inbox/87e5629f-b6c2-485f-a0a3-7b3abe119872.md', 
        basename: '87e5629f-b6c2-485f-a0a3-7b3abe119872' 
      } as TFile;

      // Mock class metadata with defaultLayout
      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
        if (file === classFile) {
          return {
            frontmatter: {
              exo__Instance_class: '[[exo__Class]]',
              exo__Class_defaultLayout: '[[87e5629f-b6c2-485f-a0a3-7b3abe119872]]',
            },
          };
        }
        if (file === layoutFile) {
          return {
            frontmatter: {
              exo__Instance_class: '[[ui__ClassLayout]]',
              ui__ClassLayout_relationsToShow: ['[[exo__Property_domain]]', '[[exo__Property_range]]'],
            },
          };
        }
        return null;
      });

      // Mock file lookups
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path) => {
        if (path === '87e5629f-b6c2-485f-a0a3-7b3abe119872.md') {
          return null; // Not in root
        }
        if (path === '01 Inbox/87e5629f-b6c2-485f-a0a3-7b3abe119872.md') {
          return layoutFile;
        }
        return null;
      });

      // Mock getMarkdownFiles - should NOT be called when defaultLayout works
      const getMarkdownFilesSpy = jest.spyOn(mockApp.vault, 'getMarkdownFiles');

      // Mock workspace getActiveFile to return our class file  
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(classFile);
      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock).mockReturnValue(classFile);

      // Execute
      mockContext.sourcePath = 'exo__Class.md';
      await renderer.render('```exocortex\\nDynamicLayout\\n```', mockContainer, mockContext);

      // Verify direct lookup was used, not file iteration
      expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith('87e5629f-b6c2-485f-a0a3-7b3abe119872.md');
      expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith('01 Inbox/87e5629f-b6c2-485f-a0a3-7b3abe119872.md');
      
      // Should not show fallback message
      expect(mockContainer.innerHTML).not.toContain('UniversalLayout will be used');
    });

    it('should fall back to search when defaultLayout UUID not found', async () => {
      // Setup class file with invalid defaultLayout
      const classFile = { path: 'test__Class.md', basename: 'test__Class' } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
        if (file === classFile) {
          return {
            frontmatter: {
              exo__Instance_class: '[[test__Class]]',
              exo__Class_defaultLayout: '[[non-existent-uuid]]',
            },
          };
        }
        return null;
      });

      // Mock file lookups - UUID not found
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

      // Mock getMarkdownFiles for fallback search
      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([]);

      // Mock workspace
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(classFile);
      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock).mockReturnValue(classFile);

      // Execute
      mockContext.sourcePath = 'test__Class.md';
      await renderer.render('```exocortex\\nDynamicLayout\\n```', mockContainer, mockContext);

      // Verify fallback search was triggered
      expect(mockApp.vault.getMarkdownFiles).toHaveBeenCalled();
      
      // Should show fallback message since no layout found
      expect(mockContainer.innerHTML).toContain('UniversalLayout will be used');
    });

    it('should handle class without defaultLayout property', async () => {
      // Setup class file without defaultLayout
      const classFile = { path: 'exo__Asset.md', basename: 'exo__Asset' } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
        if (file === classFile) {
          return {
            frontmatter: {
              exo__Instance_class: '[[exo__Asset]]',
              // No defaultLayout property
            },
          };
        }
        return null;
      });

      // Mock getMarkdownFiles for normal search
      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([]);

      // Mock workspace
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(classFile);
      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock).mockReturnValue(classFile);

      // Execute
      mockContext.sourcePath = 'exo__Asset.md';
      await renderer.render('```exocortex\\nDynamicLayout\\n```', mockContainer, mockContext);

      // Verify normal search was used
      expect(mockApp.vault.getMarkdownFiles).toHaveBeenCalled();
      
      // Should not have tried direct UUID lookup
      expect(mockApp.vault.getAbstractFileByPath).not.toHaveBeenCalled();
    });

    it('should find layout by frontmatter UID when filename lookup fails', async () => {
      // Setup files
      const classFile = { path: 'uid__TestClass.md', basename: 'uid__TestClass' } as TFile;
      const layoutFile = { 
        path: 'some-other-name.md', 
        basename: 'some-other-name' 
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
        if (file === classFile) {
          return {
            frontmatter: {
              exo__Instance_class: '[[uid__TestClass]]',
              exo__Class_defaultLayout: '[[abc-def-123]]',
            },
          };
        }
        if (file === layoutFile) {
          return {
            frontmatter: {
              exo__Instance_class: '[[ui__ClassLayout]]',
              exo__Asset_uid: 'abc-def-123',
              ui__ClassLayout_relationsToShow: ['[[test_property]]'],
            },
          };
        }
        return null;
      });

      // Mock file lookups - direct path fails
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

      // Mock getMarkdownFiles for UID search
      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([layoutFile]);

      // Mock workspace
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(classFile);
      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock).mockReturnValue(classFile);

      // Execute
      mockContext.sourcePath = 'uid__TestClass.md';
      await renderer.render('```exocortex\\nDynamicLayout\\n```', mockContainer, mockContext);

      // Should not show fallback message - layout was found
      expect(mockContainer.innerHTML).not.toContain('UniversalLayout will be used');
    });

    it('should support multiple defaultLayout property naming conventions', async () => {
      const testCases = [
        { prop: 'exo__Class_defaultLayout', value: '[[layout-1]]' },
        { prop: 'defaultLayout', value: '[[layout-2]]' },
        { prop: 'ui__defaultLayout', value: '[[layout-3]]' },
      ];

      for (const testCase of testCases) {
        // Reset mocks
        jest.clearAllMocks();
        mockContainer.innerHTML = '';

        const classFile = { path: 'test.md', basename: 'test' } as TFile;
        const layoutFile = { path: `${testCase.value.replace(/\[\[|\]\]/g, '')}.md` } as TFile;

        (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
          if (file === classFile) {
            return {
              frontmatter: {
                exo__Instance_class: '[[TestClass]]',
                [testCase.prop]: testCase.value,
              },
            };
          }
          if (file === layoutFile) {
            return {
              frontmatter: {
                exo__Instance_class: '[[ui__ClassLayout]]',
                ui__ClassLayout_relationsToShow: [],
              },
            };
          }
          return null;
        });

        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path) => {
          if (path === `${testCase.value.replace(/\[\[|\]\]/g, '')}.md`) {
            return layoutFile;
          }
          return null;
        });

        // Mock workspace
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(classFile);

        mockContext.sourcePath = 'test.md';
        await renderer.render('```exocortex\\nDynamicLayout\\n```', mockContainer, mockContext);

        // Verify the property was recognized
        expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith(
          `${testCase.value.replace(/\[\[|\]\]/g, '')}.md`
        );
      }
    });
  });

  describe('Performance optimization', () => {
    it('should complete layout resolution quickly with defaultLayout', async () => {
      // Create 1000 mock layout files
      const manyFiles = Array.from({ length: 1000 }, (_, i) => ({
        path: `layout-${i}.md`,
        basename: `layout-${i}`,
      } as TFile));

      const classFile = { path: 'perf__TestClass.md', basename: 'perf__TestClass' } as TFile;
      const targetLayout = { 
        path: 'test-layout-uuid-789.md', 
        basename: 'test-layout-uuid-789' 
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
        if (file === classFile) {
          return {
            frontmatter: {
              exo__Instance_class: '[[perf__TestClass]]',
              exo__Class_defaultLayout: '[[test-layout-uuid-789]]',
            },
          };
        }
        if (file === targetLayout) {
          return {
            frontmatter: {
              exo__Instance_class: '[[ui__ClassLayout]]',
              ui__ClassLayout_relationsToShow: [],
            },
          };
        }
        return null;
      });

      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path) => {
        if (path === 'test-layout-uuid-789.md') {
          return targetLayout;
        }
        return null;
      });

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(manyFiles);

      // Mock workspace
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(classFile);
      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock).mockReturnValue(classFile);

      const startTime = Date.now();
      
      mockContext.sourcePath = 'perf__TestClass.md';
      await renderer.render('```exocortex\\nDynamicLayout\\n```', mockContainer, mockContext);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete very quickly (< 10ms) since no iteration needed
      expect(duration).toBeLessThan(10);
      
      // Should NOT have called getMarkdownFiles (no iteration)
      expect(mockApp.vault.getMarkdownFiles).not.toHaveBeenCalled();
      
      // Should have done direct lookup only
      expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain compatibility with existing layout resolution patterns', async () => {
      // Test existing filename patterns still work
      const testCases = [
        { className: 'ems__Area', layoutName: 'Layout - ems__Area' },
        { className: 'ims__Concept', layoutName: 'ClassLayout - ims__Concept' },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        mockContainer.innerHTML = '';

        const classFile = { 
          path: `${testCase.className}.md`, 
          basename: testCase.className 
        } as TFile;
        
        const layoutFile = { 
          path: `${testCase.layoutName}.md`, 
          basename: testCase.layoutName 
        } as TFile;

        (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
          if (file === classFile) {
            return {
              frontmatter: {
                exo__Instance_class: `[[${testCase.className}]]`,
                // No defaultLayout - relies on existing search
              },
            };
          }
          if (file === layoutFile) {
            return {
              frontmatter: {
                exo__Instance_class: '[[ui__ClassLayout]]',
                ui__ClassLayout_relationsToShow: [],
              },
            };
          }
          return null;
        });

        (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([layoutFile]);

        // Mock workspace
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(classFile);

        mockContext.sourcePath = `${testCase.className}.md`;
        await renderer.render('```exocortex\\nDynamicLayout\\n```', mockContainer, mockContext);

        // Should have used traditional search
        expect(mockApp.vault.getMarkdownFiles).toHaveBeenCalled();
        
        // Should not show fallback message - layout was found
        expect(mockContainer.innerHTML).not.toContain('UniversalLayout will be used');
      }
    });
  });
});