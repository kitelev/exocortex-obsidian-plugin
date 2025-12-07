import "reflect-metadata";
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
      updateLinks: jest.fn(),
      getDefaultNewFileParent: jest.fn(),
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
        // Namespace uses exocortex.my not exocortex.org
        return !pred.includes("exocortex.my");
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

  describe("xsd:dateTime typed literals", () => {
    const file: IFile = {
      path: "test.md",
      basename: "test",
      name: "test.md",
      parent: null,
    };

    it("should convert ISO 8601 UTC timestamp to xsd:dateTime literal", async () => {
      const frontmatter: IFrontmatter = {
        ems__Effort_startTimestamp: "2025-10-24T14:30:45Z",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const timestampTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_startTimestamp")
      );

      expect(timestampTriple).toBeDefined();
      expect(timestampTriple!.object).toBeInstanceOf(Literal);
      const literal = timestampTriple!.object as Literal;
      expect(literal.value).toBe("2025-10-24T14:30:45Z");
      expect(literal.datatype).toBeDefined();
      expect(literal.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
    });

    it("should convert ISO 8601 local timestamp (no timezone) to xsd:dateTime literal", async () => {
      const frontmatter: IFrontmatter = {
        ems__Effort_endTimestamp: "2025-10-24T14:30:45",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const timestampTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_endTimestamp")
      );

      expect(timestampTriple).toBeDefined();
      const literal = timestampTriple!.object as Literal;
      expect(literal.value).toBe("2025-10-24T14:30:45");
      expect(literal.datatype).toBeDefined();
      expect(literal.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
    });

    it("should convert ISO 8601 timestamp with milliseconds to xsd:dateTime literal", async () => {
      const frontmatter: IFrontmatter = {
        exo__Asset_createdAt: "2025-10-24T14:30:45.123Z",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const timestampTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Asset_createdAt")
      );

      expect(timestampTriple).toBeDefined();
      const literal = timestampTriple!.object as Literal;
      expect(literal.value).toBe("2025-10-24T14:30:45.123Z");
      expect(literal.datatype).toBeDefined();
      expect(literal.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
    });

    it("should convert ISO 8601 timestamp with positive timezone offset to xsd:dateTime literal", async () => {
      const frontmatter: IFrontmatter = {
        ems__Effort_startTimestamp: "2025-10-24T14:30:45+08:00",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const timestampTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_startTimestamp")
      );

      expect(timestampTriple).toBeDefined();
      const literal = timestampTriple!.object as Literal;
      expect(literal.value).toBe("2025-10-24T14:30:45+08:00");
      expect(literal.datatype).toBeDefined();
      expect(literal.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
    });

    it("should convert ISO 8601 timestamp with negative timezone offset to xsd:dateTime literal", async () => {
      const frontmatter: IFrontmatter = {
        ems__Effort_endTimestamp: "2025-10-24T14:30:45-05:00",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const timestampTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_endTimestamp")
      );

      expect(timestampTriple).toBeDefined();
      const literal = timestampTriple!.object as Literal;
      expect(literal.value).toBe("2025-10-24T14:30:45-05:00");
      expect(literal.datatype).toBeDefined();
      expect(literal.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
    });

    it("should NOT apply xsd:dateTime to plain text strings", async () => {
      const frontmatter: IFrontmatter = {
        exo__Asset_label: "My Task Label",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const labelTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Asset_label")
      );

      expect(labelTriple).toBeDefined();
      const literal = labelTriple!.object as Literal;
      expect(literal.value).toBe("My Task Label");
      expect(literal.datatype).toBeUndefined();
    });

    it("should NOT apply xsd:dateTime to date-only strings (YYYY-MM-DD)", async () => {
      const frontmatter: IFrontmatter = {
        exo__Asset_label: "2025-10-24",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const labelTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Asset_label")
      );

      expect(labelTriple).toBeDefined();
      const literal = labelTriple!.object as Literal;
      expect(literal.value).toBe("2025-10-24");
      expect(literal.datatype).toBeUndefined();
    });

    it("should handle multiple timestamp properties in same note", async () => {
      const frontmatter: IFrontmatter = {
        ems__Effort_startTimestamp: "2025-10-24T09:00:00Z",
        ems__Effort_endTimestamp: "2025-10-24T17:30:00Z",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const startTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_startTimestamp")
      );
      const endTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_endTimestamp")
      );

      expect(startTriple).toBeDefined();
      expect(endTriple).toBeDefined();

      const startLiteral = startTriple!.object as Literal;
      const endLiteral = endTriple!.object as Literal;

      expect(startLiteral.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
      expect(endLiteral.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
    });

    it("should serialize xsd:dateTime literal correctly via toString()", async () => {
      const frontmatter: IFrontmatter = {
        ems__Effort_startTimestamp: "2025-10-24T14:30:45Z",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const timestampTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_startTimestamp")
      );

      const literal = timestampTriple!.object as Literal;
      expect(literal.toString()).toBe(
        '"2025-10-24T14:30:45Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>'
      );
    });

    it("should convert JavaScript Date object to xsd:dateTime literal (js-yaml auto-parsing)", async () => {
      // js-yaml automatically parses ISO 8601 strings to Date objects
      const dateValue = new Date("2025-10-24T14:30:45Z");
      const frontmatter: IFrontmatter = {
        ems__Effort_startTimestamp: dateValue,
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const timestampTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_startTimestamp")
      );

      expect(timestampTriple).toBeDefined();
      const literal = timestampTriple!.object as Literal;
      expect(literal.value).toBe("2025-10-24T14:30:45.000Z");
      expect(literal.datatype).toBeDefined();
      expect(literal.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
    });

    it("should handle Date object without milliseconds (local timezone)", async () => {
      // Simulate a Date object parsed from "2025-11-03T10:39:54"
      const dateValue = new Date("2025-11-03T10:39:54");
      const frontmatter: IFrontmatter = {
        ems__Effort_startTimestamp: dateValue,
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const timestampTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Effort_startTimestamp")
      );

      expect(timestampTriple).toBeDefined();
      const literal = timestampTriple!.object as Literal;
      // Date.toISOString() always returns UTC with Z suffix
      expect(literal.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(literal.datatype!.value).toBe(Namespace.XSD.term("dateTime").value);
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

    // Issue #621: Ensure consistent URI normalization for SPARQL exact matches
    describe("URI normalization for SPARQL queries (Issue #621)", () => {
      it("should preserve forward slashes in path (not encode to %2F)", () => {
        const iri = converter.notePathToIRI("03 Knowledge/kitelev/f2dccb6a-802d-48d3-8e8a-2c4264197692.md");
        // Should preserve / but encode space
        expect(iri.value).toBe("obsidian://vault/03%20Knowledge/kitelev/f2dccb6a-802d-48d3-8e8a-2c4264197692.md");
        // Critical: should NOT contain %2F
        expect(iri.value).not.toContain("%2F");
      });

      it("should encode special characters that are not valid in URI paths", () => {
        const iri = converter.notePathToIRI("Tasks/Review PR #123.md");
        // # should be encoded
        expect(iri.value).toBe("obsidian://vault/Tasks/Review%20PR%20#123.md");
      });

      it("should handle nested folders with spaces", () => {
        const iri = converter.notePathToIRI("01 Areas/02 Projects/My Project.md");
        expect(iri.value).toBe("obsidian://vault/01%20Areas/02%20Projects/My%20Project.md");
        expect(iri.value).not.toContain("%2F");
      });

      it("should handle UUID-based filenames (prototype pattern)", () => {
        const iri = converter.notePathToIRI("03 Knowledge/kitelev/2d369bb0-159f-4639-911d-ec2c585e8d00.md");
        expect(iri.value).toBe("obsidian://vault/03%20Knowledge/kitelev/2d369bb0-159f-4639-911d-ec2c585e8d00.md");
      });

      it("should produce consistent IRIs for same path (idempotent)", () => {
        const path = "My Folder/Sub Folder/Note.md";
        const iri1 = converter.notePathToIRI(path);
        const iri2 = converter.notePathToIRI(path);
        expect(iri1.value).toBe(iri2.value);
      });

      it("should handle paths with Cyrillic characters", () => {
        const iri = converter.notePathToIRI("Заметки/Мой файл.md");
        // Cyrillic characters should be encoded
        expect(iri.value).toBe("obsidian://vault/%D0%97%D0%B0%D0%BC%D0%B5%D1%82%D0%BA%D0%B8/%D0%9C%D0%BE%D0%B9%20%D1%84%D0%B0%D0%B9%D0%BB.md");
        // But slashes should remain (obsidian:// has 2, vault/ has 1, folder/ has 1)
        expect(iri.value.split("/").length).toBe(5);
      });

      it("should handle paths with special characters (parentheses, brackets)", () => {
        const iri = converter.notePathToIRI("Notes/My (Important) Note [v2].md");
        // encodeURI encodes brackets to %5B and %5D
        expect(iri.value).toBe("obsidian://vault/Notes/My%20(Important)%20Note%20%5Bv2%5D.md");
      });

      it("should handle deep nested paths", () => {
        const iri = converter.notePathToIRI("a/b/c/d/e/f/file.md");
        expect(iri.value).toBe("obsidian://vault/a/b/c/d/e/f/file.md");
        // All 6 slashes should be preserved plus obsidian://vault/ (3 more)
        expect((iri.value.match(/\//g) || []).length).toBe(9);
      });
    });
  });

  describe("Property_domain normalization (Issue #668)", () => {
    const file: IFile = {
      path: "property.md",
      basename: "property",
      name: "property.md",
      parent: null,
    };

    it("should convert Property_domain wiki-link to namespace IRI when file not found", async () => {
      const frontmatter: IFrontmatter = {
        exo__Property_domain: "[[ems__Effort]]",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);
      mockVault.getFirstLinkpathDest.mockReturnValue(null); // File not found

      const triples = await converter.convertNote(file);

      const domainTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Property_domain")
      );

      expect(domainTriple).toBeDefined();
      expect(domainTriple!.object).toBeInstanceOf(IRI);
      expect((domainTriple!.object as IRI).value).toBe(
        Namespace.EMS.term("Effort").value
      );
    });

    it("should convert Property_domain wiki-link with exo__ prefix to namespace IRI", async () => {
      const frontmatter: IFrontmatter = {
        exo__Property_domain: "[[exo__ObjectProperty]]",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);
      mockVault.getFirstLinkpathDest.mockReturnValue(null); // File not found

      const triples = await converter.convertNote(file);

      const domainTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Property_domain")
      );

      expect(domainTriple).toBeDefined();
      expect(domainTriple!.object).toBeInstanceOf(IRI);
      expect((domainTriple!.object as IRI).value).toBe(
        Namespace.EXO.term("ObjectProperty").value
      );
    });

    it("should convert Property_domain wiki-link to file IRI when file exists", async () => {
      const frontmatter: IFrontmatter = {
        exo__Property_domain: "[[ems__Effort]]",
      };

      const targetFile: IFile = {
        path: "classes/ems__Effort.md",
        basename: "ems__Effort",
        name: "ems__Effort.md",
        parent: null,
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);
      mockVault.getFirstLinkpathDest.mockReturnValue(targetFile);

      const triples = await converter.convertNote(file);

      const domainTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Property_domain")
      );

      expect(domainTriple).toBeDefined();
      expect(domainTriple!.object).toBeInstanceOf(IRI);
      expect((domainTriple!.object as IRI).value).toContain(
        "obsidian://vault/classes/ems__Effort.md"
      );
    });

    it("should handle quoted Property_domain wiki-link", async () => {
      const frontmatter: IFrontmatter = {
        exo__Property_domain: '"[[ems__Task]]"',
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);
      mockVault.getFirstLinkpathDest.mockReturnValue(null);

      const triples = await converter.convertNote(file);

      const domainTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Property_domain")
      );

      expect(domainTriple).toBeDefined();
      expect(domainTriple!.object).toBeInstanceOf(IRI);
      expect((domainTriple!.object as IRI).value).toBe(
        Namespace.EMS.term("Task").value
      );
    });

    it("should convert non-wikilink class reference to namespace IRI", async () => {
      const frontmatter: IFrontmatter = {
        exo__Property_domain: "ems__Area",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);

      const triples = await converter.convertNote(file);

      const domainTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Property_domain")
      );

      expect(domainTriple).toBeDefined();
      expect(domainTriple!.object).toBeInstanceOf(IRI);
      expect((domainTriple!.object as IRI).value).toBe(
        Namespace.EMS.term("Area").value
      );
    });

    it("should keep literal for non-class wiki-link when file not found", async () => {
      const frontmatter: IFrontmatter = {
        exo__Property_domain: "[[Some Random Note]]",
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);
      mockVault.getFirstLinkpathDest.mockReturnValue(null);

      const triples = await converter.convertNote(file);

      const domainTriple = triples.find((t) =>
        (t.predicate as IRI).value.includes("Property_domain")
      );

      expect(domainTriple).toBeDefined();
      expect(domainTriple!.object).toBeInstanceOf(Literal);
      expect((domainTriple!.object as Literal).value).toBe(
        "[[Some Random Note]]"
      );
    });

    it("should handle array of Property_domain values", async () => {
      const frontmatter: IFrontmatter = {
        exo__Property_domain: ["[[ems__Task]]", "[[ems__Effort]]"],
      };

      mockVault.getFrontmatter.mockReturnValue(frontmatter);
      mockVault.getFirstLinkpathDest.mockReturnValue(null);

      const triples = await converter.convertNote(file);

      const domainTriples = triples.filter((t) =>
        (t.predicate as IRI).value.includes("Property_domain")
      );

      expect(domainTriples.length).toBe(2);
      expect(domainTriples[0].object).toBeInstanceOf(IRI);
      expect(domainTriples[1].object).toBeInstanceOf(IRI);
      expect((domainTriples[0].object as IRI).value).toBe(
        Namespace.EMS.term("Task").value
      );
      expect((domainTriples[1].object as IRI).value).toBe(
        Namespace.EMS.term("Effort").value
      );
    });
  });
});
