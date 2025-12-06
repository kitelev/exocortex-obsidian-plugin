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

  describe("MINUS Translation", () => {
    it("translates SELECT with MINUS", () => {
      const query = `
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        SELECT ?task ?label
        WHERE {
          ?task ems:label ?label .
          MINUS { ?task ems:status "done" }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");

      const minusOp = input.right;
      expect(minusOp.type).toBe("minus");
      expect(minusOp.right.type).toBe("bgp");
    });

    it("translates MINUS with multiple patterns", () => {
      const query = `
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        SELECT ?task
        WHERE {
          ?task a ems:Task .
          MINUS {
            ?task ems:status "done" .
            ?task ems:archived "true" .
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");

      const minusOp = input.right;
      expect(minusOp.type).toBe("minus");
      // The right side should be a BGP with 2 triples or a join of BGPs
      expect(minusOp.right).toBeDefined();
    });

    it("translates MINUS combined with OPTIONAL", () => {
      const query = `
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        SELECT ?task ?priority
        WHERE {
          ?task a ems:Task .
          OPTIONAL { ?task ems:priority ?priority }
          MINUS { ?task ems:status "done" }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      // Should have join of (join(bgp, leftjoin)), minus)
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
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

  describe("Property Paths", () => {
    it("translates OneOrMore path (+)", () => {
      const query = `
        SELECT ?ancestor
        WHERE {
          <http://example.org/person> <http://example.org/parent>+ ?ancestor .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("bgp");
      expect(input.triples.length).toBe(1);
      const predicate = input.triples[0].predicate;
      expect(predicate.type).toBe("path");
      expect(predicate.pathType).toBe("+");
      expect(predicate.items[0].type).toBe("iri");
      expect(predicate.items[0].value).toBe("http://example.org/parent");
    });

    it("translates ZeroOrMore path (*)", () => {
      const query = `
        SELECT ?node
        WHERE {
          <http://example.org/start> <http://example.org/next>* ?node .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const predicate = input.triples[0].predicate;
      expect(predicate.type).toBe("path");
      expect(predicate.pathType).toBe("*");
    });

    it("translates ZeroOrOne path (?)", () => {
      const query = `
        SELECT ?node
        WHERE {
          <http://example.org/start> <http://example.org/next>? ?node .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const predicate = input.triples[0].predicate;
      expect(predicate.type).toBe("path");
      expect(predicate.pathType).toBe("?");
    });

    it("translates Inverse path (^)", () => {
      const query = `
        SELECT ?child
        WHERE {
          <http://example.org/parent> ^<http://example.org/hasParent> ?child .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const predicate = input.triples[0].predicate;
      expect(predicate.type).toBe("path");
      expect(predicate.pathType).toBe("^");
      expect(predicate.items[0].type).toBe("iri");
    });

    it("translates Sequence path (/)", () => {
      const query = `
        SELECT ?grandparent
        WHERE {
          ?person <http://example.org/parent>/<http://example.org/parent> ?grandparent .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const predicate = input.triples[0].predicate;
      expect(predicate.type).toBe("path");
      expect(predicate.pathType).toBe("/");
      expect(predicate.items.length).toBe(2);
      expect(predicate.items[0].type).toBe("iri");
      expect(predicate.items[1].type).toBe("iri");
    });

    it("translates Alternative path (|)", () => {
      const query = `
        SELECT ?related
        WHERE {
          ?person (<http://example.org/knows>|<http://example.org/likes>) ?related .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const predicate = input.triples[0].predicate;
      expect(predicate.type).toBe("path");
      expect(predicate.pathType).toBe("|");
      expect(predicate.items.length).toBe(2);
    });

    it("translates nested path expressions", () => {
      const query = `
        SELECT ?ancestor
        WHERE {
          ?person (<http://example.org/parent>/<http://example.org/parent>)+ ?ancestor .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const predicate = input.triples[0].predicate;
      expect(predicate.type).toBe("path");
      expect(predicate.pathType).toBe("+");
      expect(predicate.items[0].type).toBe("path");
      expect(predicate.items[0].pathType).toBe("/");
    });

    it("translates path with PREFIX", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        SELECT ?ancestor
        WHERE {
          ?person ex:parent+ ?ancestor .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const predicate = input.triples[0].predicate;
      expect(predicate.type).toBe("path");
      expect(predicate.pathType).toBe("+");
      expect(predicate.items[0].value).toBe("http://example.org/parent");
    });
  });

  describe("Subqueries", () => {
    it("translates simple subquery", () => {
      const query = `
        SELECT ?name
        WHERE {
          {
            SELECT ?x
            WHERE { ?x <http://example.org/type> <http://example.org/Person> }
          }
          ?x <http://example.org/name> ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("subquery");
      expect(input.left.query.type).toBe("project");
      expect(input.right.type).toBe("bgp");
    });

    it("translates subquery with FILTER", () => {
      const query = `
        SELECT ?person ?age
        WHERE {
          {
            SELECT ?person
            WHERE {
              ?person <http://example.org/type> <http://example.org/Person> .
              ?person <http://example.org/age> ?a .
              FILTER(?a > 18)
            }
          }
          ?person <http://example.org/age> ?age .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("subquery");
      // Inner query should have filter
      const innerQuery = input.left.query;
      expect(innerQuery.type).toBe("project");
      expect(innerQuery.input.type).toBe("filter");
    });

    it("translates subquery with ORDER BY", () => {
      const query = `
        SELECT ?name
        WHERE {
          {
            SELECT ?x
            WHERE { ?x <http://example.org/score> ?score }
            ORDER BY DESC(?score)
          }
          ?x <http://example.org/name> ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.left.type).toBe("subquery");
      const innerQuery = input.left.query;
      // OrderBy wraps the project
      expect(innerQuery.type).toBe("orderby");
      expect(innerQuery.comparators[0].descending).toBe(true);
    });

    it("translates subquery with LIMIT", () => {
      const query = `
        SELECT ?name
        WHERE {
          {
            SELECT ?x
            WHERE { ?x <http://example.org/type> <http://example.org/Task> }
            LIMIT 10
          }
          ?x <http://example.org/name> ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.left.type).toBe("subquery");
      const innerQuery = input.left.query;
      expect(innerQuery.type).toBe("slice");
      expect(innerQuery.limit).toBe(10);
    });

    it("translates subquery with OFFSET", () => {
      const query = `
        SELECT ?name
        WHERE {
          {
            SELECT ?x
            WHERE { ?x <http://example.org/type> <http://example.org/Task> }
            OFFSET 5
            LIMIT 10
          }
          ?x <http://example.org/name> ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const innerQuery = input.left.query;
      expect(innerQuery.type).toBe("slice");
      expect(innerQuery.offset).toBe(5);
      expect(innerQuery.limit).toBe(10);
    });

    it("translates subquery with DISTINCT", () => {
      const query = `
        SELECT ?name
        WHERE {
          {
            SELECT DISTINCT ?x
            WHERE { ?x <http://example.org/type> <http://example.org/Task> }
          }
          ?x <http://example.org/name> ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const innerQuery = input.left.query;
      expect(innerQuery.type).toBe("distinct");
    });

    it("translates subquery with GROUP BY", () => {
      const query = `
        SELECT ?category ?count
        WHERE {
          {
            SELECT ?category (COUNT(?task) AS ?count)
            WHERE {
              ?task <http://example.org/category> ?category
            }
            GROUP BY ?category
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("subquery");
      const innerQuery = input.query;
      expect(innerQuery.type).toBe("project");
      // Group should be in the input chain
      const groupOp = innerQuery.input;
      expect(groupOp.type).toBe("group");
      expect(groupOp.variables).toContain("category");
    });

    it("translates subquery with aggregate COUNT", () => {
      const query = `
        SELECT ?category ?total
        WHERE {
          {
            SELECT ?category (COUNT(*) AS ?total)
            WHERE {
              ?task <http://example.org/category> ?category
            }
            GROUP BY ?category
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      const innerQuery = input.query;
      const groupOp = innerQuery.input;
      expect(groupOp.type).toBe("group");
      expect(groupOp.aggregates.length).toBeGreaterThan(0);
      expect(groupOp.aggregates[0].expression.aggregation).toBe("count");
    });

    it("translates subquery-only WHERE clause", () => {
      const query = `
        SELECT ?x ?score
        WHERE {
          {
            SELECT ?x ?score
            WHERE { ?x <http://example.org/score> ?score }
            ORDER BY DESC(?score)
            LIMIT 5
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("subquery");
    });

    it("translates subquery with PREFIX", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        SELECT ?name
        WHERE {
          {
            SELECT ?x
            WHERE { ?x ex:type ex:Person }
          }
          ?x ex:name ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("subquery");
    });

    it("translates subquery with inner subquery (nested)", () => {
      const query = `
        SELECT ?name
        WHERE {
          {
            SELECT ?x
            WHERE {
              {
                SELECT ?y
                WHERE { ?y <http://example.org/active> true }
              }
              ?y <http://example.org/related> ?x
            }
          }
          ?x <http://example.org/name> ?name
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("subquery");
      // Inner subquery structure
      const innerQuery = input.left.query;
      expect(innerQuery.type).toBe("project");
      expect(innerQuery.input.type).toBe("join");
      expect(innerQuery.input.left.type).toBe("subquery");
    });

    it("handles subquery projection of fewer variables", () => {
      const query = `
        SELECT ?name ?label
        WHERE {
          {
            SELECT ?x
            WHERE {
              ?x <http://example.org/type> <http://example.org/Task> .
              ?x <http://example.org/active> true
            }
          }
          ?x <http://example.org/name> ?name .
          ?x <http://example.org/label> ?label .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const outerVars = (algebra as any).variables;
      expect(outerVars).toContain("name");
      expect(outerVars).toContain("label");

      const input = (algebra as any).input;
      expect(input.left.type).toBe("subquery");
      const innerProject = input.left.query;
      expect(innerProject.variables).toEqual(["x"]);
    });

    it("translates subquery with UNION inside", () => {
      const query = `
        SELECT ?name
        WHERE {
          {
            SELECT ?x
            WHERE {
              { ?x <http://example.org/type> <http://example.org/Task> }
              UNION
              { ?x <http://example.org/type> <http://example.org/Project> }
            }
          }
          ?x <http://example.org/name> ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      expect(input.left.type).toBe("subquery");
      const innerQuery = input.left.query;
      expect(innerQuery.input.type).toBe("union");
    });

    it("translates subquery with OPTIONAL inside", () => {
      const query = `
        SELECT ?name ?email
        WHERE {
          {
            SELECT ?x ?email
            WHERE {
              ?x <http://example.org/type> <http://example.org/Person> .
              OPTIONAL { ?x <http://example.org/email> ?email }
            }
          }
          ?x <http://example.org/name> ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      const input = (algebra as any).input;
      expect(input.left.type).toBe("subquery");
      const innerQuery = input.left.query;
      // Should contain leftjoin for OPTIONAL
      expect(innerQuery.input.type).toBe("join");
    });
  });

  describe("VALUES Translation", () => {
    it("translates simple single-variable VALUES", () => {
      const query = `
        SELECT ?task ?status
        WHERE {
          VALUES ?status { "active" "pending" "blocked" }
          ?task <http://example.org/status> ?status .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("values");
      expect(input.left.variables).toEqual(["status"]);
      expect(input.left.bindings).toHaveLength(3);
      expect(input.left.bindings[0].status.type).toBe("literal");
      expect(input.left.bindings[0].status.value).toBe("active");
    });

    it("translates multi-variable VALUES", () => {
      const query = `
        SELECT ?name ?role
        WHERE {
          VALUES (?name ?role) {
            ("Alice" "admin")
            ("Bob" "editor")
          }
          ?person <http://example.org/name> ?name .
          ?person <http://example.org/role> ?role .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("values");
      expect(input.left.variables).toContain("name");
      expect(input.left.variables).toContain("role");
      expect(input.left.bindings).toHaveLength(2);
      expect(input.left.bindings[0].name.value).toBe("Alice");
      expect(input.left.bindings[0].role.value).toBe("admin");
    });

    it("translates VALUES with IRI values", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        SELECT ?proj ?name
        WHERE {
          VALUES ?proj { ex:proj1 ex:proj2 <http://example.org/proj3> }
          ?proj ex:name ?name .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("values");
      expect(input.left.bindings).toHaveLength(3);
      expect(input.left.bindings[0].proj.type).toBe("iri");
      expect(input.left.bindings[0].proj.value).toBe("http://example.org/proj1");
    });

    it("translates VALUES with UNDEF (missing values)", () => {
      const query = `
        SELECT ?x ?y
        WHERE {
          VALUES (?x ?y) {
            (1 2)
            (UNDEF 3)
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("values");
      expect(input.bindings).toHaveLength(2);
      // First row: both bound
      expect(input.bindings[0].x.value).toBe("1");
      expect(input.bindings[0].y.value).toBe("2");
      // Second row: x is UNDEF (not present in binding)
      expect(input.bindings[1].x).toBeUndefined();
      expect(input.bindings[1].y.value).toBe("3");
    });

    it("translates VALUES with typed literals", () => {
      const query = `
        SELECT ?count
        WHERE {
          VALUES ?count { 1 2 3 }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("values");
      expect(input.bindings).toHaveLength(3);
      expect(input.bindings[0].count.type).toBe("literal");
      expect(input.bindings[0].count.datatype).toContain("integer");
    });

    it("translates VALUES-only query (no other patterns)", () => {
      const query = `
        SELECT ?x ?y
        WHERE {
          VALUES (?x ?y) {
            ("a" "b")
            ("c" "d")
          }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("values");
      expect(input.variables).toContain("x");
      expect(input.variables).toContain("y");
    });

    it("translates multiple VALUES clauses", () => {
      const query = `
        SELECT ?year ?month
        WHERE {
          VALUES ?year { 2023 2024 }
          VALUES ?month { 1 2 3 }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      // Two VALUES clauses should be joined
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("values");
      expect(input.right.type).toBe("values");
    });

    it("translates VALUES combined with FILTER", () => {
      const query = `
        SELECT ?x ?y
        WHERE {
          VALUES ?x { 1 2 3 4 5 }
          BIND(?x * 2 AS ?y)
          FILTER(?y > 4)
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("filter");
      expect(input.input.type).toBe("extend");
      expect(input.input.input.type).toBe("values");
    });

    it("translates VALUES combined with OPTIONAL", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        SELECT ?task ?status ?priority
        WHERE {
          VALUES ?status { "active" "pending" }
          ?task ex:status ?status .
          OPTIONAL { ?task ex:priority ?priority }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      // Should have join of (join(values, bgp), leftjoin)
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
    });

    it("translates VALUES with PREFIX declarations", () => {
      const query = `
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        SELECT ?task ?status
        WHERE {
          VALUES ?status { "active" "done" }
          ?task ems:status ?status .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("project");
      const input = (algebra as any).input;
      expect(input.type).toBe("join");
      expect(input.left.type).toBe("values");
    });
  });

  describe("Error Handling", () => {
    it("throws error for empty WHERE clause", () => {
      const ast = parser.parse("SELECT ?s WHERE { }");
      expect(() => translator.translate(ast)).toThrow(AlgebraTranslatorError);
    });

    it("throws error for unsupported query types (ASK)", () => {
      const ast: any = {
        type: "query",
        queryType: "ASK",
        where: [{ type: "bgp", triples: [] }],
      };
      expect(() => translator.translate(ast)).toThrow(AlgebraTranslatorError);
    });

    it("throws error for unsupported query types (DESCRIBE)", () => {
      const ast: any = {
        type: "query",
        queryType: "DESCRIBE",
        where: [{ type: "bgp", triples: [] }],
      };
      expect(() => translator.translate(ast)).toThrow(AlgebraTranslatorError);
    });
  });

  describe("CONSTRUCT Query Translation", () => {
    it("translates simple CONSTRUCT query", () => {
      const query = `
        CONSTRUCT {
          ?s <http://example.org/derived> "value" .
        }
        WHERE {
          ?s <http://example.org/type> <http://example.org/Task> .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("construct");
      expect((algebra as any).template).toHaveLength(1);
      expect((algebra as any).where.type).toBe("bgp");
    });

    it("translates CONSTRUCT with PREFIX declarations", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        CONSTRUCT {
          ?task ex:isProcessed "true" .
        }
        WHERE {
          ?task ex:type ex:Task .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("construct");
      const template = (algebra as any).template;
      expect(template[0].predicate.value).toBe("http://example.org/isProcessed");
    });

    it("translates CONSTRUCT with multiple template patterns", () => {
      const query = `
        CONSTRUCT {
          ?s <http://example.org/p1> "v1" .
          ?s <http://example.org/p2> "v2" .
        }
        WHERE {
          ?s <http://example.org/type> <http://example.org/Thing> .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("construct");
      expect((algebra as any).template).toHaveLength(2);
    });

    it("translates CONSTRUCT with FILTER in WHERE", () => {
      const query = `
        CONSTRUCT {
          ?task <http://example.org/completed> "true" .
        }
        WHERE {
          ?task <http://example.org/status> ?s .
          FILTER(?s = "done")
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("construct");
      expect((algebra as any).where.type).toBe("filter");
    });

    it("translates CONSTRUCT with BIND in WHERE", () => {
      const query = `
        CONSTRUCT {
          ?task <http://example.org/length> ?len .
        }
        WHERE {
          ?task <http://example.org/label> ?label .
          BIND(STRLEN(?label) AS ?len)
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("construct");
      expect((algebra as any).where.type).toBe("extend");
    });

    it("translates CONSTRUCT with OPTIONAL in WHERE", () => {
      const query = `
        CONSTRUCT {
          ?task <http://example.org/hasStatus> ?status .
        }
        WHERE {
          ?task <http://example.org/type> <http://example.org/Task> .
          OPTIONAL { ?task <http://example.org/status> ?status }
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("construct");
    });

    it("throws error for CONSTRUCT without WHERE clause", () => {
      const ast: any = {
        type: "query",
        queryType: "CONSTRUCT",
        template: [],
        where: [],
      };
      expect(() => translator.translate(ast)).toThrow("CONSTRUCT query must have WHERE clause");
    });

    it("handles empty template gracefully", () => {
      const query = `
        CONSTRUCT { }
        WHERE {
          ?s <http://example.org/p> ?o .
        }
      `;
      const ast = parser.parse(query);
      const algebra = translator.translate(ast);

      expect(algebra.type).toBe("construct");
      expect((algebra as any).template).toHaveLength(0);
    });
  });
});
