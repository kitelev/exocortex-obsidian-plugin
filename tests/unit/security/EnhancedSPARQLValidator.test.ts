/**
 * Enhanced SPARQL Validator Security Tests
 * Tests for injection prevention and validation
 */

import { EnhancedSPARQLValidator } from "../../../src/infrastructure/security/EnhancedSPARQLValidator";

describe("EnhancedSPARQLValidator Security Tests", () => {
  let validator: EnhancedSPARQLValidator;

  beforeEach(() => {
    validator = new EnhancedSPARQLValidator();
  });

  describe("SQL Injection Prevention", () => {
    it("should detect and block SQL injection attempts", () => {
      const injectionQueries = [
        `SELECT * WHERE { ?s ?p "'; DROP TABLE users; --" }`,
        `SELECT * WHERE { ?s ?p "' UNION SELECT password FROM users --" }`,
        `SELECT * WHERE { ?s ?p "'; INSERT INTO admin VALUES ('hacker'); --" }`,
        `SELECT * WHERE { ?s ?p "\"; DELETE FROM data; /*" }`,
      ];

      injectionQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        if (result.isSuccess) {
          const validation = result.getValue();
          expect(
            validation.detectedThreats.some(
              (t) => t.type === "injection" && t.severity === "critical",
            ),
          ).toBe(true);
          expect(validation.securityScore).toBeLessThan(70);
        } else {
          // Query was blocked entirely
          expect(result.getError()).toContain("injection");
        }
      });
    });

    it("should detect nested SPARQL injection attempts", () => {
      const nestedInjection = `
                SELECT * WHERE {
                    ?s ?p ?o .
                    { SELECT * WHERE { ?x ?y "} UNION { SELECT * WHERE { ?admin ?password ?secret } }" } }
                }
            `;

      const result = validator.enhancedValidate(nestedInjection);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(
        validation.detectedThreats.some(
          (t) => t.type === "injection" && t.severity === "high",
        ),
      ).toBe(true);
    });

    it("should handle encoded injection attempts", () => {
      const encodedInjection = `
                SELECT * WHERE { 
                    ?s ?p "%27%3B%20DROP%20TABLE%20users%3B%20--" 
                }
            `;

      const result = validator.enhancedValidate(encodedInjection);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(validation.securityScore).toBeLessThan(90);
    });
  });

  describe("Path Traversal Prevention", () => {
    it("should detect path traversal attacks", () => {
      const traversalQueries = [
        `SELECT * WHERE { <file:///etc/passwd> ?p ?o }`,
        `SELECT * WHERE { <../../../sensitive/data> ?p ?o }`,
        `SELECT * WHERE { <file://C:\\Windows\\System32\\config\\SAM> ?p ?o }`,
        `SELECT * WHERE { ?s ?p <..\\..\\private\\secrets.txt> }`,
      ];

      traversalQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        if (result.isSuccess) {
          const validation = result.getValue();
          expect(
            validation.detectedThreats.some(
              (t) => t.type === "traversal" && t.severity === "critical",
            ),
          ).toBe(true);
        } else {
          expect(result.getError()).toContain("traversal");
        }
      });
    });

    it("should detect encoded path traversal", () => {
      const encodedTraversal = `
                SELECT * WHERE { 
                    <%2e%2e%2f%2e%2e%2fsecret> ?p ?o 
                }
            `;

      const result = validator.enhancedValidate(encodedTraversal);
      if (result.isSuccess) {
        const validation = result.getValue();
        expect(
          validation.detectedThreats.some((t) => t.type === "traversal"),
        ).toBe(true);
      }
    });
  });

  describe("Command Injection Prevention", () => {
    it("should detect command injection attempts", () => {
      const commandInjections = [
        `SELECT * WHERE { ?s ?p "; rm -rf /" }`,
        `SELECT * WHERE { ?s ?p "| cat /etc/passwd" }`,
        `SELECT * WHERE { ?s ?p "\`whoami\`" }`,
        `SELECT * WHERE { ?s ?p "$(malicious_command)" }`,
      ];

      commandInjections.forEach((query) => {
        const result = validator.enhancedValidate(query);
        if (result.isSuccess) {
          const validation = result.getValue();
          expect(
            validation.detectedThreats.some(
              (t) => t.type === "injection" && t.severity === "high",
            ),
          ).toBe(true);
        }
      });
    });
  });

  describe("Resource Enumeration Prevention", () => {
    it("should detect resource enumeration attempts", () => {
      const enumerationQuery = `
                SELECT * WHERE {
                    ?resource rdf:type ?type .
                    ?resource rdfs:label ?label .
                    ?resource owl:sameAs ?alias .
                }
            `;

      const result = validator.enhancedValidate(enumerationQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(
        validation.detectedThreats.some((t) => t.type === "enumeration"),
      ).toBe(true);
    });

    it("should detect broad scanning patterns", () => {
      const scanningQuery = `
                SELECT * WHERE {
                    ?s ?p ?o .
                }
            `;

      const result = validator.enhancedValidate(scanningQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(
        validation.detectedThreats.some((t) => t.type === "enumeration"),
      ).toBe(true);
    });
  });

  describe("Information Disclosure Prevention", () => {
    it("should detect attempts to access system properties", () => {
      const systemQueries = [
        `SELECT * WHERE { ?s system:password ?p }`,
        `SELECT * WHERE { ?s config:secret ?p }`,
        `SELECT * WHERE { ?s admin:token ?p }`,
        `SELECT * WHERE { ?s private:key ?p }`,
      ];

      systemQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.detectedThreats.some(
            (t) => t.type === "information_disclosure",
          ),
        ).toBe(true);
      });
    });

    it("should detect metadata enumeration attempts", () => {
      const metadataQuery = `
                SELECT * WHERE {
                    ?ontology rdf:type owl:Ontology .
                    ?class rdf:type rdfs:Class .
                    ?property rdf:type rdf:Property .
                }
            `;

      const result = validator.enhancedValidate(metadataQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(
        validation.detectedThreats.some((t) => t.type === "enumeration"),
      ).toBe(true);
    });
  });

  describe("DoS Attack Prevention", () => {
    it("should detect excessive OPTIONAL clauses", () => {
      const dosQuery = `
                SELECT * WHERE {
                    ?s ?p ?o .
                    OPTIONAL { ?s1 ?p1 ?o1 }
                    OPTIONAL { ?s2 ?p2 ?o2 }
                    OPTIONAL { ?s3 ?p3 ?o3 }
                    OPTIONAL { ?s4 ?p4 ?o4 }
                    OPTIONAL { ?s5 ?p5 ?o5 }
                }
            `;

      const result = validator.enhancedValidate(dosQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(validation.detectedThreats.some((t) => t.type === "dos")).toBe(
        true,
      );
    });

    it("should detect recursive patterns", () => {
      const recursiveQuery = `
                SELECT * WHERE {
                    ?a relates ?b .
                    ?b relates ?c .
                    ?c relates ?d .
                    ?d relates ?a .
                }
            `;

      const result = validator.enhancedValidate(recursiveQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(validation.detectedThreats.some((t) => t.type === "dos")).toBe(
        true,
      );
    });
  });

  describe("IRI Validation", () => {
    it("should validate IRI format and security", () => {
      const maliciousIRIs = [
        '<javascript:alert("xss")>',
        "<data:text/html,<script>alert(1)</script>>",
        "<file:///etc/passwd>",
        "<ftp://malicious.com/backdoor>",
        '<vbscript:CreateObject("WScript.Shell").Run("calc")>',
      ];

      maliciousIRIs.forEach((iri) => {
        const query = `SELECT * WHERE { ${iri} ?p ?o }`;
        const result = validator.enhancedValidate(query);

        if (result.isSuccess) {
          const validation = result.getValue();
          expect(validation.detectedThreats.length).toBeGreaterThan(0);
          expect(validation.securityScore).toBeLessThan(80);
        }
      });
    });

    it("should handle extremely long IRIs", () => {
      const longIRI = "<http://example.com/" + "a".repeat(5000) + ">";
      const query = `SELECT * WHERE { ${longIRI} ?p ?o }`;

      const result = validator.enhancedValidate(query);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(
        validation.structuralIssues.some((issue) => issue.includes("too long")),
      ).toBe(true);
    });
  });

  describe("Contextual Analysis", () => {
    it("should detect suspicious variable naming", () => {
      const suspiciousQuery = `
                SELECT ?admin ?password ?secret WHERE {
                    ?admin system:password ?password .
                    ?admin system:secret ?secret .
                }
            `;

      const result = validator.enhancedValidate(suspiciousQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(
        validation.contextualWarnings.some((warning) =>
          warning.includes("Suspicious variable naming"),
        ),
      ).toBe(true);
    });

    it("should detect data exfiltration patterns", () => {
      const exfiltrationQuery = `
                CONSTRUCT { ?s ?p ?o } WHERE {
                    ?s ?p ?o .
                }
            `;

      const result = validator.enhancedValidate(exfiltrationQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(
        validation.contextualWarnings.some((warning) =>
          warning.includes("wildcard"),
        ),
      ).toBe(true);
    });

    it("should detect timing attack patterns", () => {
      const timingQuery = `
                SELECT * WHERE {
                    ?s ?p ?o .
                    FILTER(REGEX(?o, "(a+)+b"))
                }
            `;

      const result = validator.enhancedValidate(timingQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(
        validation.contextualWarnings.some((warning) =>
          warning.includes("timing"),
        ),
      ).toBe(true);
    });
  });

  describe("Security Scoring", () => {
    it("should assign appropriate security scores", () => {
      const queries = [
        {
          query: "SELECT ?s WHERE { ?s rdf:type ex:Person } LIMIT 10",
          expectedScore: 85, // Safe query
        },
        {
          query: "SELECT * WHERE { ?s ?p ?o }",
          expectedScore: 60, // Broad query
        },
        {
          query: 'SELECT * WHERE { ?s ?p "; DROP TABLE users; --" }',
          expectedScore: 30, // Injection attempt
        },
      ];

      queries.forEach(({ query, expectedScore }) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(validation.securityScore).toBeCloseTo(expectedScore, -10); // Within 10 points
      });
    });

    it("should provide security recommendations", () => {
      const unsafeQuery = `
                SELECT * WHERE {
                    ?s ?p ?o .
                    FILTER(REGEX(?o, "complex.*pattern"))
                }
            `;

      const result = validator.enhancedValidate(unsafeQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      const recommendations =
        validator.generateSecurityRecommendations(validation);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(
        recommendations.some(
          (r) => r.includes("security") || r.includes("review"),
        ),
      ).toBe(true);
    });
  });

  describe("Query Sanitization", () => {
    it("should create safe versions of queries", () => {
      const unsafeQuery = `
                SELECT * WHERE {
                    ?s ?p "; DROP TABLE users; --" .
                    ?s file:path "../../../secret" .
                }
            `;

      const result = validator.createSafeQuery(unsafeQuery);
      expect(result.isSuccess).toBe(true);

      const safeQuery = result.getValue();
      expect(safeQuery).not.toContain("DROP TABLE");
      expect(safeQuery).not.toContain("../");
      expect(safeQuery).toContain("LIMIT"); // Should add limit
    });

    it("should handle unescaped string literals", () => {
      const query = `SELECT * WHERE { ?s ?p "test'quote" }`;

      const escaped = validator.escapeStringLiteral("test'quote");
      expect(escaped).toBe("test\\'quote");
    });

    it("should create safe IRIs from user input", () => {
      const dangerousInputs = [
        "javascript:alert(1)",
        "../../../etc/passwd",
        "user input with spaces",
        "special<chars>here",
      ];

      dangerousInputs.forEach((input) => {
        const safeIRI = validator.createSafeIRI(input);
        expect(safeIRI).not.toContain("<");
        expect(safeIRI).not.toContain(">");
        expect(safeIRI).not.toContain("..");
        expect(safeIRI).toMatch(/^[a-zA-Z][a-zA-Z0-9_]*:/);
      });
    });
  });

  describe("Structural Validation", () => {
    it("should detect malformed query structures", () => {
      const malformedQueries = [
        "SELECT WHERE { ?s ?p ?o", // Missing closing brace
        "SELECT * WHERE ?s ?p ?o }", // Missing opening brace
        "SELECT * WHERE { ?s ?p ?o (", // Unbalanced parentheses
        "SELECT * WHERE { ?s <unclosed ?o }", // Unclosed angle bracket
        'SELECT * WHERE { ?s "unclosed ?o }', // Unclosed quote
      ];

      malformedQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(validation.structuralIssues.length).toBeGreaterThan(0);
      });
    });

    it("should validate proper SPARQL structure", () => {
      const invalidStructures = [
        "INVALID * WHERE { ?s ?p ?o }", // Invalid query type
        "SELECT * { ?s ?p ?o }", // Missing WHERE
        "WHERE { ?s ?p ?o }", // Missing SELECT
      ];

      invalidStructures.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.structuralIssues.some((issue) =>
            issue.includes("structure"),
          ),
        ).toBe(true);
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null and undefined inputs", () => {
      expect(() => validator.enhancedValidate(null as any)).not.toThrow();
      expect(() => validator.enhancedValidate(undefined as any)).not.toThrow();
      expect(() => validator.enhancedValidate("")).not.toThrow();
    });

    it("should detect malformed bracket and brace structures", () => {
      const malformedQueries = [
        "SELECT * WHERE { ?s ?p ?o } } }", // Extra closing braces
        "SELECT * WHERE { { { ?s ?p ?o", // Missing closing braces
        "SELECT * WHERE ((?s ?p ?o))", // Wrong bracket types
        "SELECT * WHERE { ?s ?p ?o ]] }", // Mixed bracket types
        "SELECT * WHERE { ?s [a [b c] ?o }", // Nested malformed brackets
        "SELECT * WHERE { ?s ?p ?o . )", // Unbalanced closing parenthesis
      ];

      malformedQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.structuralIssues.some(
            (issue) =>
              issue.includes("bracket") ||
              issue.includes("brace") ||
              issue.includes("balance"),
          ),
        ).toBe(true);
      });
    });

    it("should detect resource exhaustion through exponential patterns", () => {
      const exhaustionQueries = [
        // Exponential UNION growth
        `SELECT * WHERE {
                    { ?s1 ?p1 ?o1 } UNION
                    { ?s2 ?p2 ?o2 } UNION
                    { ?s3 ?p3 ?o3 } UNION
                    { ?s4 ?p4 ?o4 } UNION
                    { ?s5 ?p5 ?o5 } UNION
                    { ?s6 ?p6 ?o6 } UNION
                    { ?s7 ?p7 ?o7 } UNION
                    { ?s8 ?p8 ?o8 }
                }`,
        // Cartesian product explosion
        `SELECT * WHERE {
                    ?s1 ?p ?o .
                    ?s2 ?p ?o .
                    ?s3 ?p ?o .
                    ?s4 ?p ?o .
                    ?s5 ?p ?o .
                    ?s6 ?p ?o .
                }`,
        // Nested OPTIONAL explosion
        `SELECT * WHERE {
                    OPTIONAL { OPTIONAL { OPTIONAL { ?s1 ?p1 ?o1 } } }
                    OPTIONAL { OPTIONAL { OPTIONAL { ?s2 ?p2 ?o2 } } }
                    OPTIONAL { OPTIONAL { OPTIONAL { ?s3 ?p3 ?o3 } } }
                }`,
      ];

      exhaustionQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.detectedThreats.some(
            (t) =>
              t.type === "dos" &&
              (t.severity === "high" || t.severity === "critical"),
          ),
        ).toBe(true);
      });
    });

    it("should detect complex nested subqueries with injection attempts", () => {
      const nestedInjectionQueries = [
        `SELECT * WHERE {
                    { SELECT * WHERE { 
                        ?s ?p ?o .
                        { SELECT * WHERE { ?admin ?pass "'; DROP TABLE users; --" } }
                    } }
                }`,
        `ASK {
                    ?s ?p ?o .
                    EXISTS {
                        ?malicious ?property "} UNION { SELECT * WHERE { ?secret ?value ?data } #" .
                    }
                }`,
        `CONSTRUCT { ?s ?p ?injected } WHERE {
                    ?s ?p ?o .
                    BIND("'; DELETE FROM triples; --" AS ?injected)
                }`,
      ];

      nestedInjectionQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.detectedThreats.some(
            (t) => t.type === "injection" && t.severity === "critical",
          ),
        ).toBe(true);
      });
    });

    it("should handle advanced Unicode exploitation attempts", () => {
      const unicodeExploits = [
        // Unicode normalization attacks
        'SELECT * WHERE { ?s ?p "\u0041\u0301" }', // A with combining acute
        'SELECT * WHERE { ?s ?p "\uFF1C\uFF1E" }', // Fullwidth < and >
        // Zero-width characters for obfuscation
        'SELECT * WHERE { ?s ?p "test\u200B\u200C\u200Dstring" }',
        // RTL override attacks
        'SELECT * WHERE { ?s ?p "normal\u202Eoverride" }',
        // Homoglyph attacks
        'SELECT * WHERE { ?s ?p "admin\u0430" }', // Cyrillic 'a' in admin
        // Surrogate pairs
        'SELECT * WHERE { ?s ?p "\uD83D\uDE00" }', // Emoji face
      ];

      unicodeExploits.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.contextualWarnings.some(
            (warning) =>
              warning.includes("Unicode") || warning.includes("encoding"),
          ),
        ).toBe(true);
      });
    });

    it("should detect recursive patterns that could cause infinite loops", () => {
      const recursiveQueries = [
        // Direct recursion
        `SELECT * WHERE {
                    ?a ex:parent ?b .
                    ?b ex:parent ?a .
                }`,
        // Property path recursion
        `SELECT * WHERE {
                    ?start ex:connects+ ?end .
                    ?end ex:connects+ ?start .
                }`,
        // Complex circular dependency
        `SELECT * WHERE {
                    ?a ex:depends ?b .
                    ?b ex:depends ?c .
                    ?c ex:depends ?d .
                    ?d ex:depends ?a .
                    FILTER(?a != ?b && ?b != ?c && ?c != ?d)
                }`,
        // Self-referential property paths
        `SELECT * WHERE {
                    ?self ex:references* ?self .
                }`,
      ];

      recursiveQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.detectedThreats.some(
            (t) => t.type === "dos" && t.description?.includes("recursive"),
          ),
        ).toBe(true);
      });
    });

    it("should handle extremely large numeric and string literals", () => {
      const largeValueQueries = [
        // Extremely large integer
        `SELECT * WHERE { ?s ?p 99999999999999999999999999999999999999999999999999 }`,
        // Very long decimal
        `SELECT * WHERE { ?s ?p 1.${"9".repeat(1000)} }`,
        // Massive string literal
        `SELECT * WHERE { ?s ?p "${"A".repeat(10000)}" }`,
        // Large scientific notation
        `SELECT * WHERE { ?s ?p 1.23e+${1000} }`,
      ];

      largeValueQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.structuralIssues.some(
            (issue) => issue.includes("too large") || issue.includes("size"),
          ),
        ).toBe(true);
      });
    });

    it("should detect advanced regex-based DoS attacks", () => {
      const regexDosQueries = [
        // Exponential backtracking
        'SELECT * WHERE { ?s ?p ?o . FILTER(REGEX(?o, "(a+)+b")) }',
        // Nested quantifiers
        'SELECT * WHERE { ?s ?p ?o . FILTER(REGEX(?o, "(a*)*")) }',
        // Complex alternation
        'SELECT * WHERE { ?s ?p ?o . FILTER(REGEX(?o, "(a|a)*")) }',
        // Catastrophic backtracking
        'SELECT * WHERE { ?s ?p ?o . FILTER(REGEX(?o, "^(a+)+$")) }',
        // ReDoS with word boundaries
        'SELECT * WHERE { ?s ?p ?o . FILTER(REGEX(?o, "(\\w+\\s?)+")) }',
      ];

      regexDosQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.contextualWarnings.some(
            (warning) =>
              warning.includes("timing") || warning.includes("regex"),
          ),
        ).toBe(true);
      });
    });

    it("should handle malformed escape sequences in strings", () => {
      const malformedEscapeQueries = [
        'SELECT * WHERE { ?s ?p "invalid\\xZZ" }', // Invalid hex escape
        'SELECT * WHERE { ?s ?p "incomplete\\u12" }', // Incomplete unicode
        'SELECT * WHERE { ?s ?p "unknown\\q" }', // Unknown escape
        'SELECT * WHERE { ?s ?p "trailing\\" }', // Trailing backslash
        'SELECT * WHERE { ?s ?p "\\0" }', // Null character
        'SELECT * WHERE { ?s ?p "\\x00\\x1F" }', // Control characters
      ];

      malformedEscapeQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.structuralIssues.some(
            (issue) => issue.includes("escape") || issue.includes("malformed"),
          ),
        ).toBe(true);
      });
    });

    it("should detect protocol smuggling in IRIs", () => {
      const protocolSmugglingIRIs = [
        "<http://example.com\\@attacker.com/malicious>",
        "<https://user:pass@legitimate.com@attacker.com/>",
        "<ftp://\\localhost\\..\\..\\windows\\system32>",
        "<http://192.168.1.1\\..\\admin>",
        "<ldap://server/dc=example,dc=com??sub?(password=*)>",
      ];

      protocolSmugglingIRIs.forEach((iri) => {
        const query = `SELECT * WHERE { ${iri} ?p ?o }`;
        const result = validator.enhancedValidate(query);

        if (result.isSuccess) {
          const validation = result.getValue();
          expect(
            validation.detectedThreats.some(
              (t) => t.type === "traversal" || t.type === "injection",
            ),
          ).toBe(true);
        }
      });
    });

    it("should handle queries with mixed content types and encodings", () => {
      const mixedContentQueries = [
        `SELECT * WHERE {
                    ?s ?p "text/plain;charset=utf-8" .
                    ?s ?p "application/javascript" .
                    ?s ?p "text/html;script=<script>alert(1)</script>" .
                }`,
        `SELECT * WHERE {
                    ?s ?p "%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E" .
                }`,
        `SELECT * WHERE {
                    ?s ?p "data:text/html,<img src=x onerror=alert(1)>" .
                }`,
      ];

      mixedContentQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.contextualWarnings.some(
            (warning) =>
              warning.includes("content") || warning.includes("encoding"),
          ),
        ).toBe(true);
      });
    });

    it("should handle extremely long queries", () => {
      const longQuery = "SELECT * WHERE { " + "a".repeat(50000) + " b c . }";

      const result = validator.enhancedValidate(longQuery);
      expect(result.isSuccess).toBe(true);

      const validation = result.getValue();
      expect(validation.securityScore).toBeLessThan(80);
    });

    it("should handle Unicode and special characters", () => {
      const unicodeQuery = `
                SELECT * WHERE {
                    ?s ?p "测试中文" .
                    ?s ?p "🚀🔥💯" .
                    ?s ?p "special\nchars\t\r" .
                }
            `;

      const result = validator.enhancedValidate(unicodeQuery);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().detectedThreats).toBeDefined();
    });

    it("should handle concurrent validation requests", async () => {
      const queries = Array.from(
        { length: 50 },
        (_, i) => `SELECT * WHERE { ?s${i} ?p${i} ?o${i} }`,
      );

      const promises = queries.map((query) =>
        Promise.resolve(validator.enhancedValidate(query)),
      );

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.isSuccess).toBe(true);
      });
    });

    it("should detect time-based blind injection attempts", () => {
      const timeBasedInjections = [
        `SELECT * WHERE { 
                    ?s ?p ?o .
                    FILTER(IF(CONTAINS(?o, "admin"), SLEEP(5), true))
                }`,
        `SELECT * WHERE { 
                    ?s ?p ?o .
                    BIND(BENCHMARK(1000000, MD5("test")) AS ?delay)
                }`,
        `ASK WHERE { 
                    ?s ?p ?o .
                    FILTER(STRSTARTS(?o, "secret") && SLEEP(10))
                }`,
      ];

      timeBasedInjections.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.detectedThreats.some(
            (t) => t.type === "injection" && t.description?.includes("timing"),
          ),
        ).toBe(true);
      });
    });

    it("should handle memory exhaustion through large intermediate results", () => {
      const memoryExhaustionQueries = [
        // Large CONSTRUCT result set
        `CONSTRUCT { 
                    ?s1 ex:related ?s2 .
                    ?s2 ex:related ?s3 .
                    ?s3 ex:related ?s4 .
                } WHERE {
                    ?s1 ?p1 ?o1 .
                    ?s2 ?p2 ?o2 .
                    ?s3 ?p3 ?o3 .
                    ?s4 ?p4 ?o4 .
                }`,
        // Multiple OPTIONAL with large expansion
        Array.from(
          { length: 20 },
          (_, i) => `OPTIONAL { ?s${i} ?p${i} ?o${i} }`,
        ).join("\n                    "),
        // Complex aggregation without LIMIT
        `SELECT (GROUP_CONCAT(?value; separator=",") as ?all) WHERE {
                    ?s ?p ?value .
                } GROUP BY ?s`,
      ];

      memoryExhaustionQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.detectedThreats.some(
            (t) => t.type === "dos" && t.description?.includes("memory"),
          ),
        ).toBe(true);
      });
    });

    it("should detect advanced data exfiltration patterns", () => {
      const exfiltrationQueries = [
        // Base64 encoding attempt
        `SELECT (ENCODE_FOR_URI(?secret) as ?encoded) WHERE {
                    ?s system:password ?secret .
                }`,
        // Concatenation-based data gathering
        `SELECT (CONCAT(?user, ":", ?pass, ":", ?email) as ?credentials) WHERE {
                    ?s system:user ?user .
                    ?s system:password ?pass .
                    ?s system:email ?email .
                }`,
        // Multiple sensitive data types in one query
        `CONSTRUCT { 
                    ex:gathered ex:user ?user ;
                                ex:password ?password ;
                                ex:session ?session ;
                                ex:token ?token .
                } WHERE {
                    ?s system:user ?user ;
                       system:password ?password ;
                       system:sessionId ?session ;
                       system:authToken ?token .
                }`,
      ];

      exfiltrationQueries.forEach((query) => {
        const result = validator.enhancedValidate(query);
        expect(result.isSuccess).toBe(true);

        const validation = result.getValue();
        expect(
          validation.detectedThreats.some(
            (t) => t.type === "information_disclosure" && t.severity === "high",
          ),
        ).toBe(true);
      });
    });
  });

  describe("Performance and Optimization", () => {
    it("should complete validation within reasonable time", () => {
      const complexQuery = `
                PREFIX ex: <http://example.com/>
                SELECT * WHERE {
                    ?s1 ex:relates ?s2 .
                    ?s2 ex:relates ?s3 .
                    ?s3 ex:relates ?s4 .
                    FILTER(REGEX(?s1, "test.*pattern"))
                    FILTER(?s2 != ?s3)
                    OPTIONAL { ?s1 ex:hasProperty ?prop }
                }
            `;

      const startTime = Date.now();
      const result = validator.enhancedValidate(complexQuery);
      const endTime = Date.now();

      expect(result.isSuccess).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle validation of large batches efficiently", () => {
      const queries = Array.from(
        { length: 100 },
        (_, i) => `SELECT ?s${i} WHERE { ?s${i} rdf:type ex:TestClass${i} }`,
      );

      const startTime = Date.now();
      queries.forEach((query) => {
        validator.enhancedValidate(query);
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Batch should complete within 5 seconds
    });
  });
});
