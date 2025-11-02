import { SPARQLParser } from "../../../../src/infrastructure/sparql/SPARQLParser";
import {
  AlgebraTranslator,
  AlgebraTranslatorError,
} from "../../../../src/infrastructure/sparql/algebra/AlgebraTranslator";
import { AlgebraOptimizer } from "../../../../src/infrastructure/sparql/algebra/AlgebraOptimizer";
import { AlgebraSerializer } from "../../../../src/infrastructure/sparql/algebra/AlgebraSerializer";
import type { AlgebraOperation } from "../../../../src/infrastructure/sparql/algebra/AlgebraOperation";

describe("AlgebraTranslator", () => {
  let parser: SPARQLParser;
  let translator: AlgebraTranslator;
  let optimizer: AlgebraOptimizer;
  let serializer: AlgebraSerializer;

  beforeEach(() => {
    parser = new SPARQLParser();
    translator = new AlgebraTranslator();
    optimizer = new AlgebraOptimizer();
    serializer = new AlgebraSerializer();
  });

  describe("Basic Translation", () => {
    it("translates simple SELECT with BGP", () => {
      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      expect((algebra as any).variables).toEqual(["s", "p", "o"]);
      expect((algebra as any).input.type).toBe("bgp");
      expect((algebra as any).input.triples).toHaveLength(1);
    });

    it("translates SELECT * with BGP", () => {
      const query = "SELECT * WHERE { ?s ?p ?o }";
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("bgp");
      expect((algebra as any).triples).toHaveLength(1);
    });

    it("translates SELECT with multiple triples (implicit JOIN)", () => {
      const query = `
        SELECT ?s ?label
        WHERE {
          ?s <http://example.org/type> <http://example.org/Task> .
          ?s <http://example.org/label> ?label .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("bgp");
      expect(input.triples).toHaveLength(2);
    });

    it("translates SELECT with PREFIX declarations", () => {
      const query = `
        PREFIX ems: <http://exocortex.org/ems#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?task ?label
        WHERE {
          ?task rdf:type ems:Task .
          ?task ems:label ?label .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      expect((algebra as any).variables).toEqual(["task", "label"]);
    });
  });

  describe("FILTER Translation", () => {
    it("translates SELECT with FILTER", () => {
      const query = `
        SELECT ?task ?effort
        WHERE {
          ?task <http://example.org/effort> ?effort .
          FILTER(?effort > 60)
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");

      const filterOp = input.right;
      expect(filterOp.type).toBe("filter");
      expect(filterOp.expression.type).toBe("comparison");
      expect(filterOp.expression.operator).toBe(">");
    });

    it("translates FILTER with regex", () => {
      const query = `
        SELECT ?task ?label
        WHERE {
          ?task <http://example.org/label> ?label .
          FILTER(regex(?label, "bug", "i"))
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");

      const filterOp = input.right;
      expect(filterOp.type).toBe("filter");
      expect(filterOp.expression.type).toBe("function");
      expect(filterOp.expression.function).toBe("regex");
    });

    it("translates FILTER with logical operators", () => {
      const query = `
        SELECT ?task
        WHERE {
          ?task <http://example.org/effort> ?effort .
          ?task <http://example.org/status> ?status .
          FILTER(?effort > 60 && ?status = "Done")
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;

      const findFilter = (op: any): any => {
        if (op.type === "filter") return op;
        if (op.type === "join") return findFilter(op.left) || findFilter(op.right);
        return null;
      };

      const filterOp = findFilter(input);
      expect(filterOp).toBeTruthy();
      expect(filterOp.expression.type).toBe("logical");
      expect(filterOp.expression.operator).toBe("&&");
    });
  });

  describe("OPTIONAL Translation", () => {
    it("translates SELECT with OPTIONAL", () => {
      const query = `
        PREFIX ems: <http://exocortex.org/ems#>
        SELECT ?task ?label ?priority
        WHERE {
          ?task ems:label ?label .
          OPTIONAL { ?task ems:priority ?priority }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");

      const optionalOp = input.right;
      expect(optionalOp.type).toBe("leftjoin");
    });
  });

  describe("UNION Translation", () => {
    it("translates SELECT with UNION", () => {
      const query = `
        PREFIX ems: <http://exocortex.org/ems#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?asset
        WHERE {
          { ?asset rdf:type ems:Task }
          UNION
          { ?asset rdf:type ems:Project }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("union");
      expect(input.left.type).toBe("bgp");
      expect(input.right.type).toBe("bgp");
    });
  });

  describe("Solution Modifiers", () => {
    it("translates SELECT DISTINCT", () => {
      const query = "SELECT DISTINCT ?status WHERE { ?task <http://example.org/status> ?status }";
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("distinct");
      const input = (algebra as any).input;
      expect(input.type).toBe("project");
    });

    it("translates SELECT with ORDER BY ASC", () => {
      const query = `
        SELECT ?task ?effort
        WHERE { ?task <http://example.org/effort> ?effort }
        ORDER BY ASC(?effort)
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("orderby");
      expect((algebra as any).comparators).toHaveLength(1);
      expect((algebra as any).comparators[0].descending).toBe(false);
    });

    it("translates SELECT with ORDER BY DESC", () => {
      const query = `
        SELECT ?task ?effort
        WHERE { ?task <http://example.org/effort> ?effort }
        ORDER BY DESC(?effort)
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("orderby");
      expect((algebra as any).comparators[0].descending).toBe(true);
    });

    it("translates SELECT with LIMIT", () => {
      const query = `
        SELECT ?task WHERE { ?task <http://example.org/type> <http://example.org/Task> } LIMIT 10
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("slice");
      expect((algebra as any).limit).toBe(10);
      expect((algebra as any).offset).toBeUndefined();
    });

    it("translates SELECT with LIMIT and OFFSET", () => {
      const query = `
        SELECT ?task WHERE { ?task <http://example.org/type> <http://example.org/Task> } LIMIT 10 OFFSET 20
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("slice");
      expect((algebra as any).limit).toBe(10);
      expect((algebra as any).offset).toBe(20);
    });

    it("translates SELECT with multiple modifiers", () => {
      const query = `
        SELECT DISTINCT ?task ?effort
        WHERE {
          ?task <http://example.org/effort> ?effort .
          FILTER(?effort > 60)
        }
        ORDER BY DESC(?effort)
        LIMIT 20
        OFFSET 10
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("slice");
      expect((algebra as any).limit).toBe(20);
      expect((algebra as any).offset).toBe(10);

      let current = (algebra as any).input;
      expect(current.type).toBe("orderby");

      current = current.input;
      expect(current.type).toBe("distinct");

      current = current.input;
      expect(current.type).toBe("project");
    });
  });

  describe("Error Handling", () => {
    it("throws error for empty WHERE clause", () => {
      const ast = parser.parse("SELECT ?s WHERE { }");
      expect(() => translator.translate(ast)).toThrow(AlgebraTranslatorError);
    });

    it("throws error for non-SELECT query types", () => {
      const ast: any = {
        type: "query",
        queryType: "CONSTRUCT",
        template: [],
        where: [],
      };
      expect(() => translator.translate(ast)).toThrow(AlgebraTranslatorError);
    });
  });
});
