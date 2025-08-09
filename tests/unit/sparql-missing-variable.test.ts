import ExocortexPlugin from '../../main';
import { Plugin, Notice, App, Vault, TFile } from 'obsidian';

describe('SPARQL Missing Variable Error', () => {
    let plugin: ExocortexPlugin;
    let mockApp: any;
    let mockVault: any;
    
    beforeEach(() => {
        // Mock Obsidian API
        mockVault = {
            getMarkdownFiles: jest.fn(),
            read: jest.fn()
        };
        
        mockApp = {
            vault: mockVault,
            workspace: {
                openLinkText: jest.fn()
            }
        };
        
        plugin = new ExocortexPlugin(mockApp, {} as any);
    });
    
    describe('processQuery with missing variables', () => {
        it('should handle queries with undefined variables gracefully', () => {
            const triples = [
                { subject: 'file://test.md', predicate: 'title', object: 'Test File' },
                { subject: 'file://test2.md', predicate: 'author', object: 'John Doe' }
            ];
            
            // Query asking for ?name which doesn't exist in our mapping
            const query = 'SELECT ?name WHERE { ?s ?p ?o } LIMIT 10';
            
            // This should not throw an error
            const results = plugin.processQuery(query, triples);
            
            // Results should be empty or have undefined values
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
            
            // Each result should have the requested variable, even if undefined
            results.forEach(result => {
                expect(result).toHaveProperty('name');
                expect(result.name).toBeUndefined();
            });
        });
        
        it('should handle SELECT with only undefined variables', () => {
            const triples = [
                { subject: 'file://task1.md', predicate: 'exo__Instance_class', object: '[[ems__Task]]' },
                { subject: 'file://task1.md', predicate: 'exo__Asset_label', object: 'My Task' }
            ];
            
            // Query with undefined variable
            const query = 'SELECT ?unknown WHERE { ?s ?p ?o } LIMIT 5';
            
            const results = plugin.processQuery(query, triples);
            
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
            results.forEach(result => {
                expect(result).toHaveProperty('unknown');
                expect(result.unknown).toBeUndefined();
            });
        });
        
        it('should handle mixed defined and undefined variables', () => {
            const triples = [
                { subject: 'file://doc.md', predicate: 'title', object: 'Document' }
            ];
            
            // Query with both defined and undefined variables
            const query = 'SELECT ?subject ?undefined ?predicate WHERE { ?s ?p ?o } LIMIT 3';
            
            const results = plugin.processQuery(query, triples);
            
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
            
            results.forEach(result => {
                expect(result).toHaveProperty('subject');
                expect(result).toHaveProperty('undefined');
                expect(result).toHaveProperty('predicate');
                
                expect(result.subject).toBeDefined();
                expect(result.predicate).toBeDefined();
                expect(result.undefined).toBeUndefined();
            });
        });
        
        it('should return results even when no variables match', () => {
            const triples = [
                { subject: 'file://test.md', predicate: 'type', object: 'document' }
            ];
            
            // Query with completely unrecognized variables
            const query = 'SELECT ?foo ?bar ?baz WHERE { ?s ?p ?o } LIMIT 2';
            
            const results = plugin.processQuery(query, triples);
            
            // Should still return results with undefined values
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
            
            results.forEach(result => {
                expect(Object.keys(result)).toEqual(['foo', 'bar', 'baz']);
                expect(result.foo).toBeUndefined();
                expect(result.bar).toBeUndefined();
                expect(result.baz).toBeUndefined();
            });
        });
        
        it('should reproduce the "Binding missing variable: subject" error', () => {
            const triples = [
                { subject: 'file://note.md', predicate: 'title', object: 'My Note' }
            ];
            
            // This query should have caused the error before the fix
            const query = 'SELECT ?s WHERE { ?s ?p ?o }';
            
            // The 's' variable is not explicitly handled, only 'subject'
            const results = plugin.processQuery(query, triples);
            
            // After fix, should return results with properly mapped variables
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
            results.forEach(result => {
                expect(result).toHaveProperty('s');
                // Since 's' is handled as an alias for 'subject', it should have a value
                expect(result.s).toBeDefined();
                expect(result.s).toContain('file://');
            });
        });
    });
    
    describe('executeSPARQL integration', () => {
        it('should handle missing variables in full SPARQL execution', async () => {
            // Mock file system
            const mockFile = { 
                basename: 'test.md',
                path: 'test.md'
            } as TFile;
            
            mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
            mockVault.read.mockResolvedValue(`---
title: Test Document
author: John Doe
---
Content here`);
            
            // Query with undefined variable
            const query = 'SELECT ?nonexistent WHERE { ?s ?p ?o } LIMIT 5';
            
            const results = await plugin.executeSPARQL(query);
            
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
            
            results.forEach(result => {
                expect(result).toHaveProperty('nonexistent');
                expect(result.nonexistent).toBeUndefined();
            });
        });
    });
});