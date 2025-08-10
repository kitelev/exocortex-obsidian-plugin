import * as http from 'http';
import { App, Notice } from 'obsidian';
import { Graph } from '../../domain/semantic/core/Graph';
import { ExoAgent } from '../../application/services/ExoAgent';

/**
 * Simple HTTP Server for REST API
 * Uses Node.js http module which is available in Electron
 */
export class SimpleHTTPServer {
    private server: http.Server | null = null;
    private port: number = 27124;
    private apiKey: string;
    private exoAgent: ExoAgent;
    
    constructor(
        private app: App,
        private graph: Graph
    ) {
        this.apiKey = this.generateAPIKey();
        this.exoAgent = new ExoAgent(app, graph);
    }
    
    /**
     * Start the HTTP server
     */
    async start(): Promise<void> {
        if (this.server) {
            console.log('HTTP server already running');
            return;
        }
        
        try {
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res);
            });
            
            this.server.listen(this.port, () => {
                console.log(`🌐 REST API Server running at http://localhost:${this.port}`);
                console.log(`API Key: ${this.apiKey}`);
                new Notice(`REST API started on port ${this.port}`);
            });
            
            this.server.on('error', (error) => {
                console.error('Server error:', error);
                new Notice('Failed to start REST API server');
            });
        } catch (error) {
            console.error('Failed to create server:', error);
            throw error;
        }
    }
    
    /**
     * Stop the HTTP server
     */
    async stop(): Promise<void> {
        if (!this.server) {
            return;
        }
        
        return new Promise((resolve) => {
            this.server!.close(() => {
                this.server = null;
                console.log('REST API Server stopped');
                new Notice('REST API server stopped');
                resolve();
            });
        });
    }
    
    /**
     * Handle HTTP request
     */
    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
        
        // Handle preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Check API key
        const apiKey = req.headers['x-api-key'] as string;
        if (apiKey !== this.apiKey) {
            this.sendError(res, 401, 'Invalid API key');
            return;
        }
        
        // Parse URL
        const url = new URL(req.url || '/', `http://localhost:${this.port}`);
        const path = url.pathname;
        
        // Route request
        try {
            switch (path) {
                case '/api/sparql':
                    await this.handleSPARQL(req, res, url);
                    break;
                    
                case '/api/nlp':
                    await this.handleNLP(req, res, url);
                    break;
                    
                case '/api/graph':
                    await this.handleGraph(req, res, url);
                    break;
                    
                case '/api/assets':
                    await this.handleAssets(req, res, url);
                    break;
                    
                case '/api/health':
                    this.sendJSON(res, { status: 'ok', timestamp: new Date().toISOString() });
                    break;
                    
                case '/api/info':
                    await this.handleInfo(req, res);
                    break;
                    
                default:
                    this.sendError(res, 404, 'Endpoint not found');
            }
        } catch (error) {
            console.error('Request error:', error);
            this.sendError(res, 500, error.message);
        }
    }
    
    /**
     * Handle SPARQL endpoint
     */
    private async handleSPARQL(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> {
        if (req.method === 'POST') {
            const body = await this.getRequestBody(req);
            const { query } = JSON.parse(body);
            
            if (!query) {
                this.sendError(res, 400, 'Query required');
                return;
            }
            
            // Execute SPARQL query
            const triples = this.executeSPARQL(query);
            this.sendJSON(res, {
                results: triples,
                count: triples.length
            });
        } else if (req.method === 'GET') {
            const query = url.searchParams.get('query');
            
            if (!query) {
                this.sendError(res, 400, 'Query parameter required');
                return;
            }
            
            const triples = this.executeSPARQL(query);
            this.sendJSON(res, {
                results: triples,
                count: triples.length
            });
        } else {
            this.sendError(res, 405, 'Method not allowed');
        }
    }
    
    /**
     * Handle NLP endpoint
     */
    private async handleNLP(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> {
        let query: string;
        
        if (req.method === 'POST') {
            const body = await this.getRequestBody(req);
            ({ query } = JSON.parse(body));
        } else if (req.method === 'GET') {
            query = url.searchParams.get('q') || '';
        } else {
            this.sendError(res, 405, 'Method not allowed');
            return;
        }
        
        if (!query) {
            this.sendError(res, 400, 'Query required');
            return;
        }
        
        const result = await this.exoAgent.processQuery(query);
        this.sendJSON(res, result);
    }
    
    /**
     * Handle graph endpoint
     */
    private async handleGraph(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> {
        if (req.method === 'GET') {
            const subject = url.searchParams.get('s');
            const predicate = url.searchParams.get('p');
            const object = url.searchParams.get('o');
            const limit = parseInt(url.searchParams.get('limit') || '100');
            
            const triples = this.graph.match(
                subject || null,
                predicate || null,
                object || null
            ).slice(0, limit);
            
            this.sendJSON(res, {
                triples,
                count: triples.length
            });
        } else if (req.method === 'POST') {
            const body = await this.getRequestBody(req);
            const { subject, predicate, object } = JSON.parse(body);
            
            if (!subject || !predicate || !object) {
                this.sendError(res, 400, 'Subject, predicate, and object required');
                return;
            }
            
            this.graph.add({ subject, predicate, object });
            this.sendJSON(res, { success: true });
        } else {
            this.sendError(res, 405, 'Method not allowed');
        }
    }
    
    /**
     * Handle assets endpoint
     */
    private async handleAssets(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> {
        if (req.method !== 'GET') {
            this.sendError(res, 405, 'Method not allowed');
            return;
        }
        
        const keyword = url.searchParams.get('q') || '';
        const className = url.searchParams.get('class');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        
        const files = this.app.vault.getMarkdownFiles();
        const results = [];
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache?.frontmatter) continue;
            
            const fm = cache.frontmatter;
            
            // Filter by class
            if (className && fm['exo__Instance_class'] !== className) {
                continue;
            }
            
            // Filter by keyword
            if (keyword) {
                const label = (fm['exo__Asset_label'] || '').toLowerCase();
                const desc = (fm['exo__Asset_description'] || '').toLowerCase();
                const kw = keyword.toLowerCase();
                
                if (!label.includes(kw) && !desc.includes(kw)) {
                    continue;
                }
            }
            
            results.push({
                path: file.path,
                uid: fm['exo__Asset_uid'],
                class: fm['exo__Instance_class'],
                label: fm['exo__Asset_label']
            });
            
            if (results.length >= limit) break;
        }
        
        this.sendJSON(res, {
            assets: results,
            count: results.length
        });
    }
    
    /**
     * Handle info endpoint
     */
    private async handleInfo(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const files = this.app.vault.getMarkdownFiles();
        const tripleCount = this.graph.match(null, null, null).length;
        
        this.sendJSON(res, {
            name: 'Exocortex REST API',
            version: '1.0.0',
            status: 'running',
            stats: {
                files: files.length,
                triples: tripleCount,
                graphSize: this.graph.size
            },
            endpoints: [
                'GET /api/health',
                'GET /api/info',
                'GET/POST /api/sparql',
                'GET/POST /api/nlp',
                'GET/POST /api/graph',
                'GET /api/assets'
            ]
        });
    }
    
    /**
     * Execute SPARQL query
     */
    private executeSPARQL(query: string): any[] {
        // Simple SELECT query execution
        const whereMatch = query.match(/WHERE\s*\{(.*?)\}/is);
        if (!whereMatch) return [];
        
        const patterns = whereMatch[1].trim().split('\n')
            .map(p => p.trim())
            .filter(p => p && !p.startsWith('FILTER'));
        
        if (patterns.length === 0) return [];
        
        // Parse first pattern
        const firstPattern = patterns[0];
        const parts = firstPattern.split(/\s+/).filter(p => p);
        if (parts.length < 3) return [];
        
        const [s, p, o] = parts;
        
        // Execute match
        const triples = this.graph.match(
            s.startsWith('?') ? null : s.replace(/"/g, ''),
            p.startsWith('?') ? null : p.replace(/"/g, ''),
            o.startsWith('?') ? null : o.replace(/"/g, '').replace('.', '')
        );
        
        // Apply LIMIT
        const limitMatch = query.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
            const limit = parseInt(limitMatch[1]);
            return triples.slice(0, limit);
        }
        
        return triples;
    }
    
    /**
     * Get request body
     */
    private getRequestBody(req: http.IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }
    
    /**
     * Send JSON response
     */
    private sendJSON(res: http.ServerResponse, data: any): void {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }
    
    /**
     * Send error response
     */
    private sendError(res: http.ServerResponse, status: number, message: string): void {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message, status }, null, 2));
    }
    
    /**
     * Generate API key
     */
    private generateAPIKey(): string {
        return 'exo-' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Get current API key
     */
    getAPIKey(): string {
        return this.apiKey;
    }
    
    /**
     * Check if server is running
     */
    isRunning(): boolean {
        return this.server !== null;
    }
}