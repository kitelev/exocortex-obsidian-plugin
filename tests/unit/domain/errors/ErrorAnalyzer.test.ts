import { ErrorAnalyzer } from '../../../../src/domain/errors/ErrorAnalyzer';
import { ErrorSeverity, ErrorCategory } from '../../../../src/domain/errors/ExocortexError';

describe('ErrorAnalyzer', () => {
    describe('analyze', () => {
        it('should recognize SPARQL syntax errors', () => {
            const error = new Error("Unexpected token '}' at position 42");
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.severity).toBe(ErrorSeverity.ERROR);
            expect(result.category).toBe(ErrorCategory.SYNTAX);
            expect(result.title).toBe('SPARQL Syntax Error');
            expect(result.message).toContain("Unexpected '}' at position 42");
            expect(result.suggestions).toBeDefined();
            expect(result.suggestions!.length).toBeGreaterThan(0);
            expect(result.recoverable).toBe(true);
        });

        it('should recognize unknown prefix errors', () => {
            const error = new Error('Unknown prefix: foaf');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.severity).toBe(ErrorSeverity.ERROR);
            expect(result.category).toBe(ErrorCategory.SEMANTIC);
            expect(result.title).toBe('Unknown Prefix');
            expect(result.message).toContain("prefix 'foaf' is not defined");
            expect(result.suggestions![0].title).toBe('Add PREFIX Declaration');
            expect(result.suggestions![0].confidence).toBe(0.95);
        });

        it('should recognize query timeout errors', () => {
            const error = new Error('Query timeout after 5000ms');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.severity).toBe(ErrorSeverity.WARNING);
            expect(result.category).toBe(ErrorCategory.SYSTEM);
            expect(result.title).toBe('Query Timeout');
            expect(result.message).toContain('5000ms');
            expect(result.suggestions).toBeDefined();
            expect(result.suggestions!.some(s => s.title === 'Add LIMIT Clause')).toBe(true);
        });

        it('should recognize invalid IRI errors', () => {
            const error = new Error('Invalid IRI: not-a-valid-iri');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.severity).toBe(ErrorSeverity.ERROR);
            expect(result.category).toBe(ErrorCategory.VALIDATION);
            expect(result.title).toBe('Invalid IRI');
            expect(result.message).toContain('not-a-valid-iri');
            expect(result.suggestions).toBeDefined();
        });

        it('should handle empty result set as info', () => {
            const error = new Error('Empty result set');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.severity).toBe(ErrorSeverity.INFO);
            expect(result.category).toBe(ErrorCategory.SEMANTIC);
            expect(result.title).toBe('No Results Found');
            expect(result.recoverable).toBe(true);
        });

        it('should handle circular reference warnings', () => {
            const error = new Error('Circular reference detected');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.severity).toBe(ErrorSeverity.WARNING);
            expect(result.category).toBe(ErrorCategory.SEMANTIC);
            expect(result.title).toBe('Circular Reference');
            expect(result.suggestions!.some(s => s.title === 'Review Ontology Structure')).toBe(true);
        });

        it('should handle unknown errors with default values', () => {
            const error = new Error('Some random error message');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.severity).toBe(ErrorSeverity.ERROR);
            expect(result.category).toBe(ErrorCategory.SYSTEM);
            expect(result.title).toBe('Unknown Error');
            expect(result.message).toContain('unexpected error occurred');
            expect(result.recoverable).toBe(false);
        });

        it('should handle string errors', () => {
            const result = ErrorAnalyzer.analyze('Simple error string');
            
            expect(result.severity).toBe(ErrorSeverity.ERROR);
            expect(result.category).toBe(ErrorCategory.SYSTEM);
            expect(result.technicalDetails).toBe('Simple error string');
        });

        it('should preserve stack traces', () => {
            const error = new Error('Test error with stack');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.stackTrace).toBeDefined();
            expect(result.stackTrace).toContain('Test error with stack');
        });
    });

    describe('getSPARQLErrorLocation', () => {
        it('should calculate line and column from position', () => {
            const query = 'SELECT ?s ?p ?o\nWHERE {\n  ?s ?p ?o .\n}';
            const position = 24; // Position in the third line (0-indexed: 24 = line 3, col 1)
            
            const location = ErrorAnalyzer.getSPARQLErrorLocation(query, position);
            
            expect(location).toBeDefined();
            expect(location!.line).toBe(3);
            expect(location!.column).toBe(1);
        });

        it('should handle single line queries', () => {
            const query = 'SELECT ?s WHERE { ?s ?p ?o }';
            const position = 10;
            
            const location = ErrorAnalyzer.getSPARQLErrorLocation(query, position);
            
            expect(location).toBeDefined();
            expect(location!.line).toBe(1);
            expect(location!.column).toBe(11);
        });

        it('should return undefined for invalid positions', () => {
            const query = 'SELECT ?s WHERE { ?s ?p ?o }';
            
            expect(ErrorAnalyzer.getSPARQLErrorLocation(query, -1)).toBeUndefined();
            expect(ErrorAnalyzer.getSPARQLErrorLocation(query, 1000)).toBeUndefined();
            expect(ErrorAnalyzer.getSPARQLErrorLocation(query, undefined as any)).toBeUndefined();
        });

        it('should handle multi-line queries correctly', () => {
            const query = `PREFIX ex: <http://example.org/>
SELECT ?subject ?predicate ?object
WHERE {
  ?subject ?predicate ?object .
  FILTER (?object > 10)
}`;
            
            const position = 70; // Position in WHERE clause
            const location = ErrorAnalyzer.getSPARQLErrorLocation(query, position);
            
            expect(location).toBeDefined();
            expect(location!.line).toBe(3);
        });
    });

    describe('pattern management', () => {
        beforeEach(() => {
            ErrorAnalyzer.clearPatterns();
        });

        it('should allow adding custom patterns', () => {
            ErrorAnalyzer.addPattern({
                pattern: /custom error (\d+)/i,
                severity: ErrorSeverity.WARNING,
                category: ErrorCategory.SYSTEM,
                title: 'Custom Error',
                getUserMessage: (match) => `Custom error code: ${match[1]}`,
                getSuggestions: () => [{
                    title: 'Custom Fix',
                    description: 'Apply custom fix',
                    confidence: 0.8
                }],
                recoverable: true
            });

            const error = new Error('Custom error 42');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.title).toBe('Custom Error');
            expect(result.message).toBe('Custom error code: 42');
            expect(result.suggestions![0].title).toBe('Custom Fix');
        });

        it('should handle empty pattern list gracefully', () => {
            ErrorAnalyzer.clearPatterns();
            
            const error = new Error('Any error');
            const result = ErrorAnalyzer.analyze(error);
            
            expect(result.title).toBe('Unknown Error');
            expect(result.category).toBe(ErrorCategory.SYSTEM);
        });
    });
});