import { SPARQLEngine } from '../../src/application/SPARQLEngine';
import { Graph } from '../../src/domain/Graph';

describe('SPARQLEngine CONSTRUCT Queries', () => {
    let engine: SPARQLEngine;
    let graph: Graph;
    
    beforeEach(() => {
        graph = new Graph();
        engine = new SPARQLEngine(graph);
        
        // Add test data
        graph.add({ subject: 'task1', predicate: 'rdf:type', object: 'ems:Task' });
        graph.add({ subject: 'task1', predicate: 'ems:deadline', object: '2025-08-10' });
        graph.add({ subject: 'task1', predicate: 'ems:status', object: 'pending' });
        
        graph.add({ subject: 'task2', predicate: 'rdf:type', object: 'ems:Task' });
        graph.add({ subject: 'task2', predicate: 'ems:deadline', object: '2025-08-08' });
        graph.add({ subject: 'task2', predicate: 'ems:status', object: 'pending' });
        
        graph.add({ subject: 'task3', predicate: 'rdf:type', object: 'ems:Task' });
        graph.add({ subject: 'task3', predicate: 'ems:assignedTo', object: 'person1' });
        graph.add({ subject: 'task3', predicate: 'ems:partOf', object: 'project1' });
    });
    
    describe('Basic CONSTRUCT', () => {
        test('should generate new triples from CONSTRUCT template', () => {
            const query = `
                CONSTRUCT {
                    ?task ems:urgency "high" .
                }
                WHERE {
                    ?task rdf:type ems:Task .
                }
            `;
            
            const result = engine.construct(query);
            
            expect(result.triples).toHaveLength(3); // 3 tasks
            expect(result.triples[0]).toEqual({
                subject: 'task1',
                predicate: 'ems:urgency',
                object: 'high'
            });
            expect(result.provenance).toContain('CONSTRUCT query at');
        });
        
        test('should handle empty WHERE results', () => {
            const query = `
                CONSTRUCT {
                    ?task ems:urgency "critical" .
                }
                WHERE {
                    ?task rdf:type ems:NonExistent .
                }
            `;
            
            const result = engine.construct(query);
            
            expect(result.triples).toHaveLength(0);
        });
        
        test('should support multiple template patterns', () => {
            const query = `
                CONSTRUCT {
                    ?task ems:urgency "high" .
                    ?task ems:needsReview true .
                }
                WHERE {
                    ?task ems:status pending .
                }
            `;
            
            const result = engine.construct(query);
            
            expect(result.triples).toHaveLength(4); // 2 tasks * 2 properties
            expect(result.triples).toContainEqual({
                subject: 'task1',
                predicate: 'ems:urgency',
                object: 'high'
            });
            expect(result.triples).toContainEqual({
                subject: 'task1',
                predicate: 'ems:needsReview',
                object: 'true'
            });
        });
    });
    
    describe('Relationship Inference', () => {
        test('should infer relationships from existing data', () => {
            const query = `
                CONSTRUCT {
                    ?person ems:contributesTo ?project .
                }
                WHERE {
                    ?task ems:assignedTo ?person .
                    ?task ems:partOf ?project .
                }
            `;
            
            const result = engine.construct(query);
            
            expect(result.triples).toHaveLength(1);
            expect(result.triples[0]).toEqual({
                subject: 'person1',
                predicate: 'ems:contributesTo',
                object: 'project1'
            });
        });
    });
    
    describe('CONSTRUCT with LIMIT', () => {
        test('should respect LIMIT clause', () => {
            const query = `
                CONSTRUCT {
                    ?task ems:processed true .
                }
                WHERE {
                    ?task rdf:type ems:Task .
                } LIMIT 2
            `;
            
            const result = engine.construct(query);
            
            expect(result.triples).toHaveLength(2);
        });
    });
    
    describe('Invalid CONSTRUCT queries', () => {
        test('should throw error for invalid format', () => {
            const query = 'CONSTRUCT WHERE { ?s ?p ?o }';
            
            expect(() => engine.construct(query)).toThrow('Invalid CONSTRUCT query format');
        });
        
        test('should handle malformed templates gracefully', () => {
            const query = `
                CONSTRUCT {
                    ?task
                }
                WHERE {
                    ?task rdf:type ems:Task .
                }
            `;
            
            const result = engine.construct(query);
            
            expect(result.triples).toHaveLength(0); // Invalid template ignored
        });
    });
    
    describe('Integration with Graph', () => {
        test('generated triples can be queried with SELECT', () => {
            // First, run CONSTRUCT to generate new triples
            const constructQuery = `
                CONSTRUCT {
                    ?task ems:priority "high" .
                }
                WHERE {
                    ?task ems:deadline ?date .
                }
            `;
            
            const constructResult = engine.construct(constructQuery);
            
            // Add generated triples to graph
            for (const triple of constructResult.triples) {
                graph.add(triple);
            }
            
            // Now query the generated triples
            const selectQuery = `
                SELECT ?task ?priority
                WHERE {
                    ?task ems:priority ?priority .
                }
            `;
            
            const selectResult = engine.select(selectQuery);
            
            expect(selectResult).toHaveLength(2); // task1 and task2 have deadlines
            expect(selectResult[0].priority).toBe('high');
        });
    });
});