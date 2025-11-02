import { NoteToRDFConverter } from "../../../src/services/NoteToRDFConverter";
import { IVaultAdapter, IFile, IFrontmatter } from "../../../src/interfaces/IVaultAdapter";
import { IRI } from "../../../src/domain/models/rdf/IRI";
import { Literal } from "../../../src/domain/models/rdf/Literal";
import { Namespace } from "../../../src/domain/models/rdf/Namespace";

describe("NoteToRDFConverter", () => {
  let converter: NoteToRDFConverter;
  let mockVault: jest.Mocked<IVaultAdapter>;

  beforeEach(() => {
    mockVault = {
      getFrontmatter: jest.fn(),
      getAllFiles: jest.fn(),
      read: jest.fn(),
      create: jest.fn(),
      modify: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      updateFrontmatter: jest.fn(),
      rename: jest.fn(),
      createFolder: jest.fn(),
      getFirstLinkpathDest: jest.fn(),
      process: jest.fn(),
    } as jest.Mocked<IVaultAdapter>;

    converter = new NoteToRDFConverter(mockVault);
  });

  describe("convertNote", () => {
    it("should convert frontmatter properties to RDF triples", async () => {
      const file: IFile = {
        path: "test-note.md",
        basename: "test-note",
        name: "test-note.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        exo__Asset_label: "Test Task",
        exo__Instance_class: "ems__Task",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      expect(triples.length).toBeGreaterThan(0);
      expect(mockVault.getFrontmatter).toHaveBeenCalledWith(file);
    });

    it("should return empty array if frontmatter is null", async () => {
      const file: IFile = {
        path: "test-note.md",
        basename: "test-note",
        name: "test-note.md",
        parent: null,
      };

      mockVault.getFrontmatter.mockReturnValue(null);

      const triples = await converter.convertNote(file);

      expect(triples).toEqual([]);
    });

    it("should create obsidian:// IRI for note subject", async () => {
      const file: IFile = {
        path: "path/to/My Task.md",
        basename: "My Task",
        name: "My Task.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        exo__Asset_label: "Test",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const subject = triples[0].subject;
      expect(subject).toBeInstanceOf(IRI);
      expect((subject as IRI).value).toContain("obsidian://vault/");
    });

    it("should convert exo__ properties to RDF triples", async () => {
      const file: IFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        exo__Asset_label: "My Label",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const labelTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Asset_label")
      );

      expect(labelTriple).toBeDefined();
      expect((labelTriple!.object as Literal).value).toBe("My Label");
    });

    it("should convert ems__ properties to RDF triples", async () => {
      const file: IFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        ems__Effort_status: "ToDo",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const statusTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_status")
      );

      expect(statusTriple).toBeDefined();
      expect((statusTriple!.object as Literal).value).toBe("ToDo");
    });

    it("should convert wikilinks to IRI references", async () => {
      const file: IFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        ems__Effort_area: "[[Development]]",
      };

      const targetFile: IFile = {
        path: "Development.md",
        basename: "Development",
        name: "Development.md",
        parent: null,
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);
      mockVault.getFirstLinkpathDest.mockReturnValue(targetFile);

      const triples = await converter.convertNote(file);

      const areaTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_area")
      );

      expect(areaTriple).toBeDefined();
      expect(areaTriple!.object).toBeInstanceOf(IRI);
      expect((areaTriple!.object as IRI).value).toContain("obsidian://vault/Development.md");
    });

    it("should handle array values by creating multiple triples", async () => {
      const file: IFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        exo__Instance_class: ["ems__Task", "ems__Effort"],
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const classTriples = triples.filter((t) =>
        (t.predicate as IRI).value.includes("Instance_class")
      );

      expect(classTriples.length).toBe(2);
    });

    it("should convert Asset class to rdf:type triple", async () => {
      const file: IFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        exo__Instance_class: "ems__Task",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const typeTriple = triples.find((t) =>
        (t.predicate as IRI).value === Namespace.RDF.term("type").value
      );

      expect(typeTriple).toBeDefined();
      expect((typeTriple!.object as IRI).value).toContain("Task");
    });

    it("should handle archived notes with exo__Asset_isArchived", async () => {
      const file: IFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        exo__Asset_isArchived: true,
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const archivedTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Asset_isArchived")
      );

      expect(archivedTriple).toBeDefined();
      expect((archivedTriple!.object as Literal).value).toBe("true");
    });

    it("should skip non-exo and non-ems properties", async () => {
      const file: IFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        someOtherProperty: "value",
        tags: ["tag1", "tag2"],
        exo__Asset_label: "Test",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const nonExoEmsTriples = triples.filter((t) => {
        const pred = (t.predicate as IRI).value;
        return !pred.includes("exocortex.org");
      });

      expect(nonExoEmsTriples.length).toBe(0);
    });

    it("should handle quoted wikilinks", async () => {
      const file: IFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
        parent: null,
      };

      const frontmatter: IFrontmatter = {
        ems__Effort_area: '"[[Development]]"',
      };

      const targetFile: IFile = {
        path: "Development.md",
        basename: "Development",
        name: "Development.md",
        parent: null,
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);
      mockVault.getFirstLinkpathDest.mockReturnValue(targetFile);

      const triples = await converter.convertNote(file);

      const areaTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_area")
      );

      expect(areaTriple).toBeDefined();
      expect(areaTriple!.object).toBeInstanceOf(IRI);
    });
  });

  describe("convertVault", () => {
    it("should convert all files in vault", async () => {
      const file1: IFile = {
        path: "note1.md",
        basename: "note1",
        name: "note1.md",
        parent: null,
      };

      const file2: IFile = {
        path: "note2.md",
        basename: "note2",
        name: "note2.md",
        parent: null,
      };

      const frontmatter1: IFrontmatter = {
        exo__Asset_label: "Note 1",
      };

      const frontmatter2: IFrontmatter = {
        exo__Asset_label: "Note 2",
      };

      mockVault.getAllFiles.mockReturnValue([file1, file2]);
      mockVault.getFrontmatter.mockImplementation((file) => {
        if (file.path === "note1.md") return frontmatter1;
        if (file.path === "note2.md") return frontmatter2;
        return null;
      });

      const triples = await converter.convertVault();

      expect(triples.length).toBeGreaterThan(0);
      expect(mockVault.getAllFiles).toHaveBeenCalled();
    });

    it("should complete within performance budget for 100 notes", async () => {
      const files: IFile[] = [];
      for (let i = 0; i < 100; i++) {
        files.push({
          path: `note${i}.md`,
          basename: `note${i}`,
          name: `note${i}.md`,
          parent: null,
        });
      }

      mockVault.getAllFiles.mockReturnValue(files);
      mockVault.getFrontmatter.mockReturnValue({
        exo__Asset_label: "Test",
      });

      const start = Date.now();
      await converter.convertVault();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe("notePathToIRI", () => {
    it("should convert note path to obsidian:// IRI", () => {
      const iri = converter.notePathToIRI("path/to/note.md");
      expect(iri.value).toBe("obsidian://vault/path/to/note.md");
    });

    it("should handle spaces in path", () => {
      const iri = converter.notePathToIRI("My Folder/My Note.md");
      expect(iri.value).toBe("obsidian://vault/My%20Folder/My%20Note.md");
    });
  });
});
