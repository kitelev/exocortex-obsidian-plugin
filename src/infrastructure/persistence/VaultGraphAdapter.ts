import { Plugin, TFile, TFolder, Notice } from 'obsidian';
import { Graph } from '../../domain/Graph';
import { KnowledgeObject } from '../../domain/KnowledgeObject';

export class VaultGraphAdapter {
    private plugin: Plugin;
    private graph: Graph;
    private cacheFile = '.obsidian/plugins/exocortex/graph-cache.json';
    private watchedFiles = new Set<string>();
    private saveTimer: NodeJS.Timeout | null = null;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.graph = new Graph();
    }
    
    /**
     * Loads graph from cache or rebuilds from vault
     */
    async load(): Promise<Graph> {
        try {
            const adapter = this.plugin.app.vault.adapter;
            const cacheExists = await adapter.exists(this.cacheFile);
            
            if (cacheExists) {
                const cacheContent = await adapter.read(this.cacheFile);
                const cacheData = JSON.parse(cacheContent);
                
                if (this.isCacheValid(cacheData)) {
                    this.deserializeGraph(cacheData.triples);
                    console.log(`Loaded ${this.graph.size} triples from cache`);
                    return this.graph;
                }
            }
            
            console.log('Cache miss - rebuilding graph from vault');
            await this.syncFromVault();
            await this.save();
            return this.graph;
            
        } catch (error) {
            console.error('Graph load failed, rebuilding:', error);
            await this.syncFromVault();
            return this.graph;
        }
    }
    
    /**
     * Saves current graph state to cache file
     */
    async save(): Promise<void> {
        try {
            const cacheData = {
                timestamp: Date.now(),
                version: '1.0.0',
                tripleCount: this.graph.size,
                triples: this.serializeGraph()
            };
            
            const cacheDir = this.cacheFile.split('/').slice(0, -1).join('/');
            await this.ensureDir(cacheDir);
            
            await this.plugin.app.vault.adapter.write(
                this.cacheFile, 
                JSON.stringify(cacheData, null, 2)
            );
            
            console.log(`Saved ${this.graph.size} triples to cache`);
            
        } catch (error) {
            console.error('Failed to save graph cache:', error);
        }
    }
    
    /**
     * Schedules a save operation (debounced)
     */
    scheduleSave(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => this.save(), 5000);
    }
    
    /**
     * Scans vault and rebuilds graph from markdown files
     */
    async syncFromVault(): Promise<void> {
        this.graph.clear();
        this.watchedFiles.clear();
        
        const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
        console.log(`Scanning ${markdownFiles.length} markdown files`);
        
        for (const file of markdownFiles) {
            try {
                await this.updateFromFile(file.path);
                this.watchedFiles.add(file.path);
            } catch (error) {
                console.warn(`Failed to process ${file.path}:`, error);
            }
        }
        
        console.log(`Loaded ${this.graph.size} triples from ${this.watchedFiles.size} files`);
    }
    
    /**
     * Incrementally updates graph when file changes
     */
    async updateFromFile(filePath: string): Promise<void> {
        const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
        if (!file || !(file instanceof TFile)) return;
        
        const content = await this.plugin.app.vault.read(file);
        const frontmatter = this.extractFrontmatter(content);
        
        if (!frontmatter) return;
        
        // Remove existing triples for this file
        this.removeFileTriples(filePath);
        
        // Convert frontmatter to RDF triples
        const subject = this.fileToUri(filePath);
        
        for (const [key, value] of Object.entries(frontmatter)) {
            const predicate = this.propertyToUri(key);
            
            if (Array.isArray(value)) {
                value.forEach(v => this.addTriple(subject, predicate, v));
            } else {
                this.addTriple(subject, predicate, value);
            }
        }
        
        this.scheduleSave();
    }
    
    /**
     * Removes triples when file is deleted
     */
    async removeFile(filePath: string): Promise<void> {
        this.removeFileTriples(filePath);
        this.watchedFiles.delete(filePath);
        this.scheduleSave();
    }
    
    // Helper methods
    private isCacheValid(cacheData: any): boolean {
        if (!cacheData || !cacheData.timestamp || !cacheData.triples) {
            return false;
        }
        
        // Cache expires after 24 hours
        const cacheAge = Date.now() - cacheData.timestamp;
        return cacheAge < 24 * 60 * 60 * 1000;
    }
    
    private extractFrontmatter(content: string): any {
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match) return null;
        
        try {
            // Simple YAML parsing (for MVP)
            const yaml = match[1];
            const result: any = {};
            
            const lines = yaml.split('\n');
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    let value = line.substring(colonIndex + 1).trim();
                    
                    // Handle quoted strings
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    
                    // Handle arrays (simple case)
                    if (value === '') {
                        // Might be start of array
                        continue;
                    }
                    
                    result[key] = value;
                }
            }
            
            return result;
        } catch (error) {
            console.error('Failed to parse frontmatter:', error);
            return null;
        }
    }
    
    private fileToUri(filePath: string): string {
        // Convert file path to URI-like identifier
        return `file://${filePath.replace(/\.md$/, '')}`;
    }
    
    private propertyToUri(property: string): string {
        // Convert property name to URI
        if (property.includes('__')) {
            const [namespace, name] = property.split('__');
            return `${namespace}:${name}`;
        }
        return `exo:${property}`;
    }
    
    private addTriple(subject: string, predicate: string, object: any): void {
        this.graph.add({
            subject,
            predicate,
            object: String(object)
        });
    }
    
    private removeFileTriples(filePath: string): void {
        const subject = this.fileToUri(filePath);
        const triplesToRemove = this.graph.match(subject, null, null);
        
        for (const triple of triplesToRemove) {
            this.graph.remove(triple);
        }
    }
    
    private serializeGraph(): any[] {
        const triples: any[] = [];
        
        // Get all triples from graph
        const allTriples = this.graph.match(null, null, null);
        for (const triple of allTriples) {
            triples.push({
                s: triple.subject,
                p: triple.predicate,
                o: triple.object
            });
        }
        
        return triples;
    }
    
    private deserializeGraph(triples: any[]): void {
        for (const t of triples) {
            this.graph.add({
                subject: t.s,
                predicate: t.p,
                object: t.o
            });
        }
    }
    
    private async ensureDir(dir: string): Promise<void> {
        const adapter = this.plugin.app.vault.adapter;
        if (!(await adapter.exists(dir))) {
            await adapter.mkdir(dir);
        }
    }
    
    get size(): number {
        return this.graph.size;
    }
    
    getGraph(): Graph {
        return this.graph;
    }
}
