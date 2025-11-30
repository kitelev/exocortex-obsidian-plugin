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
        PREFIX ems: <https://exocortex.my/ontology/ems#>
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
      // FILTER wraps the BGP, not joined with it
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("comparison");
      expect(input.expression.operator).toBe(">");
      expect(input.input.type).toBe("bgp");
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
      // FILTER wraps the BGP, not joined with it
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("function");
      expect(input.expression.function).toBe("regex");
      expect(input.input.type).toBe("bgp");
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

      // FILTER wraps the BGP (sparqljs combines adjacent triples into one BGP)
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("logical");
      expect(input.expression.operator).toBe("&&");
      // Input to filter is a single BGP with 2 triples
      expect(input.input.type).toBe("bgp");
      expect(input.input.triples).toHaveLength(2);
    });
  });

  describe("OPTIONAL Translation", () => {
    it("translates SELECT with OPTIONAL", () => {
      const query = `
        PREFIX ems: <https://exocortex.my/ontology/ems#>
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
        PREFIX ems: <https://exocortex.my/ontology/ems#>
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

  describe("BIND Translation", () => {
    it("translates BIND with variable copy", () => {
      const query = `
        SELECT ?s ?copy WHERE {
          ?s <http://example.org/p> ?o .
          BIND(?o AS ?copy)
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("extend");
      expect(input.variable).toBe("copy");
      expect(input.expression.type).toBe("variable");
      expect(input.expression.name).toBe("o");
      expect(input.input.type).toBe("bgp");
    });

    it("translates BIND with REPLACE function", () => {
      const query = `
        SELECT ?s ?clean WHERE {
          ?s <http://example.org/label> ?raw .
          BIND(REPLACE(?raw, "[[", "") AS ?clean)
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("extend");
      expect(input.variable).toBe("clean");
      expect(input.expression.type).toBe("function");
      expect(input.expression.function).toBe("replace");
      expect(input.expression.args).toHaveLength(3);
    });

    it("translates BIND with STR function", () => {
      const query = `
        SELECT ?s ?strValue WHERE {
          ?s <http://example.org/p> ?o .
          BIND(STR(?o) AS ?strValue)
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("extend");
      expect(input.variable).toBe("strValue");
      expect(input.expression.type).toBe("function");
      expect(input.expression.function).toBe("str");
    });

    it("translates BIND with nested REPLACE functions", () => {
      const query = `
        SELECT ?s ?clean WHERE {
          ?s <http://example.org/label> ?raw .
          BIND(REPLACE(REPLACE(?raw, "[[", ""), "]]", "") AS ?clean)
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("extend");
      expect(input.variable).toBe("clean");
      expect(input.expression.type).toBe("function");
      expect(input.expression.function).toBe("replace");
      // First arg is another REPLACE function
      expect(input.expression.args[0].type).toBe("function");
      expect(input.expression.args[0].function).toBe("replace");
    });

    it("translates multiple BIND patterns", () => {
      const query = `
        SELECT ?s ?a ?b WHERE {
          ?s <http://example.org/p> ?o .
          BIND(?o AS ?a)
          BIND(STR(?o) AS ?b)
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      let current = (algebra as any).input;

      // Second BIND wraps first
      expect(current.type).toBe("extend");
      expect(current.variable).toBe("b");

      current = current.input;
      expect(current.type).toBe("extend");
      expect(current.variable).toBe("a");

      current = current.input;
      expect(current.type).toBe("bgp");
    });

    it("translates BIND before FILTER", () => {
      const query = `
        SELECT ?s ?clean WHERE {
          ?s <http://example.org/label> ?raw .
          BIND(REPLACE(?raw, "prefix_", "") AS ?clean)
          FILTER(CONTAINS(?clean, "test"))
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;

      // FILTER should wrap the extend
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("function");
      expect(input.expression.function).toBe("contains");

      // extend is input to filter
      expect(input.input.type).toBe("extend");
      expect(input.input.variable).toBe("clean");
    });
  });

  describe("EXISTS Translation", () => {
    it("translates FILTER EXISTS with simple BGP", () => {
      const query = `
        SELECT ?task
        WHERE {
          ?task <http://example.org/type> <http://example.org/Task> .
          FILTER EXISTS { ?task <http://example.org/status> "Done" }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("exists");
      expect(input.expression.negated).toBe(false);
      expect(input.expression.pattern.type).toBe("bgp");
      expect(input.expression.pattern.triples).toHaveLength(1);
    });

    it("translates FILTER NOT EXISTS with simple BGP", () => {
      const query = `
        SELECT ?task
        WHERE {
          ?task <http://example.org/type> <http://example.org/Task> .
          FILTER NOT EXISTS { ?task <http://example.org/blocker> ?blocker }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("exists");
      expect(input.expression.negated).toBe(true);
      expect(input.expression.pattern.type).toBe("bgp");
    });

    it("translates EXISTS with multiple triples", () => {
      const query = `
        SELECT ?project
        WHERE {
          ?project <http://example.org/type> <http://example.org/Project> .
          FILTER EXISTS {
            ?task <http://example.org/parent> ?project .
            ?task <http://example.org/status> "Done"
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("exists");
      expect(input.expression.negated).toBe(false);
      expect(input.expression.pattern.type).toBe("bgp");
      expect(input.expression.pattern.triples).toHaveLength(2);
    });

    it("translates EXISTS combined with AND", () => {
      const query = `
        SELECT ?task
        WHERE {
          ?task <http://example.org/type> <http://example.org/Task> .
          ?task <http://example.org/priority> ?priority .
          FILTER(?priority > 5 && EXISTS { ?task <http://example.org/blocker> ?b })
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("logical");
      expect(input.expression.operator).toBe("&&");
      expect(input.expression.operands[0].type).toBe("comparison");
      expect(input.expression.operands[1].type).toBe("exists");
    });

    it("translates NOT EXISTS combined with OR", () => {
      const query = `
        SELECT ?task
        WHERE {
          ?task <http://example.org/type> <http://example.org/Task> .
          FILTER(
            NOT EXISTS { ?task <http://example.org/blocker> ?b } ||
            NOT EXISTS { ?task <http://example.org/dependency> ?d }
          )
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("logical");
      expect(input.expression.operator).toBe("||");
      expect(input.expression.operands[0].type).toBe("exists");
      expect(input.expression.operands[0].negated).toBe(true);
      expect(input.expression.operands[1].type).toBe("exists");
      expect(input.expression.operands[1].negated).toBe(true);
    });

    it("translates nested NOT with EXISTS", () => {
      const query = `
        SELECT ?task
        WHERE {
          ?task <http://example.org/type> <http://example.org/Task> .
          FILTER(!EXISTS { ?task <http://example.org/blocker> ?b })
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      // sparqljs may parse !EXISTS as logical NOT with EXISTS child
      // or as notexists directly depending on version
      if (input.expression.type === "logical") {
        expect(input.expression.operator).toBe("!");
        expect(input.expression.operands[0].type).toBe("exists");
      } else {
        expect(input.expression.type).toBe("exists");
      }
    });

    it("translates EXISTS with PREFIX declarations", () => {
      const query = `
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?task
        WHERE {
          ?task rdf:type ems:Task .
          FILTER EXISTS { ?task ems:assignee ?person }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("exists");
      expect(input.expression.pattern.type).toBe("bgp");
    });

    it("translates EXISTS with OPTIONAL inside", () => {
      const query = `
        SELECT ?project
        WHERE {
          ?project <http://example.org/type> <http://example.org/Project> .
          FILTER EXISTS {
            ?task <http://example.org/parent> ?project .
            OPTIONAL { ?task <http://example.org/assignee> ?person }
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("exists");
      // Pattern should contain join with leftjoin for OPTIONAL
      const pattern = input.expression.pattern;
      expect(pattern).toBeDefined();
    });

    it("translates EXISTS with FILTER inside", () => {
      const query = `
        SELECT ?project
        WHERE {
          ?project <http://example.org/type> <http://example.org/Project> .
          FILTER EXISTS {
            ?task <http://example.org/parent> ?project .
            ?task <http://example.org/effort> ?effort .
            FILTER(?effort > 60)
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.expression.type).toBe("exists");
      const pattern = input.expression.pattern;
      // Pattern should contain nested FILTER
      expect(pattern.type).toBe("filter");
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
