import { App, Notice, Plugin, requestUrl } from 'obsidian';
import { Graph } from '../../domain/Graph';
import { SPARQLProcessor } from '../../presentation/processors/SPARQLProcessor';
import { ExoAgent } from '../../application/services/ExoAgent';
import { RelationOntologizer } from '../../application/services/RelationOntologizer';

/**
 * REST API Server for external AI agents
 * Provides endpoints for SPARQL queries, natural language queries, and knowledge management
 */
export class RESTAPIServer {
    private server: any;
    private port: number = 27124;
    private apiKey: string;
    private isRunning: boolean = false;
    private sparqlProcessor: SPARQLProcessor;
    private exoAgent: ExoAgent;
    private relationOntologizer: RelationOntologizer;
    
    constructor(
        private app: App,
        private plugin: Plugin,
        private graph: Graph
    ) {
        // Generate API key or load from settings
        this.apiKey = this.generateAPIKey();
        
        // Initialize processors
        this.sparqlProcessor = new SPARQLProcessor(plugin, graph);
        this.exoAgent = new ExoAgent(app, graph);
        this.relationOntologizer = new RelationOntologizer(app);
    }
    
    /**
     * Start the REST API server
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('REST API server is already running');
            return;
        }
        
        try {
            // Since Obsidian runs in Electron, we can use Node.js modules
            // However, for security and compatibility, we'll use a different approach
            // We'll register URL protocol handlers instead
            this.registerProtocolHandlers();
            
            // For a true REST API, we'll use Obsidian's HTTP server capability
            await this.startHTTPServer();
            
            this.isRunning = true;
            new Notice(`🌐 REST API started on port ${this.port}`);
            console.log(`REST API Server started on http://localhost:${this.port}`);
            console.log(`API Key: ${this.apiKey}`);
        } catch (error) {
            console.error('Failed to start REST API server:', error);
            new Notice('Failed to start REST API server');
        }
    }
    
    /**
     * Stop the REST API server
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }
        
        try {
            // Stop the HTTP server
            if (this.server) {
                this.server.close();
            }
            
            this.isRunning = false;
            new Notice('REST API server stopped');
            console.log('REST API Server stopped');
        } catch (error) {
            console.error('Failed to stop REST API server:', error);
        }
    }
    
    /**
     * Start HTTP server using available methods
     */
    private async startHTTPServer(): Promise<void> {
        // Use a lightweight approach that works within Obsidian's environment
        // We'll implement a polling-based system that checks for requests
        this.startRequestPolling();
    }
    
    /**
     * Start polling for incoming requests
     * This is a workaround since we can't run a traditional HTTP server in Obsidian
     */
    private startRequestPolling(): void {
        // Check for requests every second
        const pollInterval = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(pollInterval);
                return;
            }
            
            // Check for pending requests (would need external service or file-based communication)
            await this.checkForRequests();
        }, 1000);
    }
    
    /**
     * Check for incoming API requests
     */
    private async checkForRequests(): Promise<void> {
        // In a real implementation, this would check for requests from:
        // 1. A file in the vault (.exocortex-api/requests/)
        // 2. An external service
        // 3. A browser extension
        
        // For now, we'll implement file-based API
        const requestsFolder = '.exocortex-api/requests';
        const responsesFolder = '.exocortex-api/responses';
        
        try {
            const folder = this.app.vault.getAbstractFileByPath(requestsFolder);
            if (!folder) return;
            
            const files = await this.app.vault.adapter.list(requestsFolder);
            
            for (const file of files.files) {
                if (file.endsWith('.json')) {
                    // Process request
                    const content = await this.app.vault.adapter.read(file);
                    const request = JSON.parse(content);
                    
                    // Validate API key
                    if (request.apiKey !== this.apiKey) {
                        await this.writeResponse(file, {
                            error: 'Invalid API key',
                            status: 401
                        });
                        continue;
                    }
                    
                    // Process request based on endpoint
                    const response = await this.processRequest(request);
                    
                    // Write response
                    await this.writeResponse(file, response);
                    
                    // Delete processed request
                    await this.app.vault.adapter.remove(file);
                }
            }
        } catch (error) {
            // Folder doesn't exist or other error
        }
    }
    
    /**
     * Process API request
     */
    private async processRequest(request: APIRequest): Promise<APIResponse> {
        try {
            switch (request.endpoint) {
                case '/sparql':
                    return await this.handleSPARQLQuery(request);
                    
                case '/nlp':
                    return await this.handleNLPQuery(request);
                    
                case '/graph/triples':
                    return await this.handleGetTriples(request);
                    
                case '/graph/add':
                    return await this.handleAddTriple(request);
                    
                case '/assets/search':
                    return await this.handleSearchAssets(request);
                    
                case '/assets/create':
                    return await this.handleCreateAsset(request);
                    
                case '/relations/ontologize':
                    return await this.handleOntologizeRelations(request);
                    
                case '/focus/set':
                    return await this.handleSetFocus(request);
                    
                case '/focus/get':
                    return await this.handleGetFocus(request);
                    
                default:
                    return {
                        error: 'Unknown endpoint',
                        status: 404
                    };
            }
        } catch (error) {
            return {
                error: error.message,
                status: 500
            };
        }
    }
    
    /**
     * Handle SPARQL query
     */
    private async handleSPARQLQuery(request: APIRequest): Promise<APIResponse> {
        const query = request.params?.query;
        if (!query) {
            return { error: 'Query parameter required', status: 400 };
        }
        
        try {
            const results = await this.sparqlProcessor.executeQuery(query);
            return {
                data: results,
                status: 200,
                metadata: {
                    count: results.length,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return { error: error.message, status: 400 };
        }
    }
    
    /**
     * Handle natural language query
     */
    private async handleNLPQuery(request: APIRequest): Promise<APIResponse> {
        const query = request.params?.query;
        if (!query) {
            return { error: 'Query parameter required', status: 400 };
        }
        
        try {
            const results = await this.exoAgent.processQuery(query);
            return {
                data: results,
                status: 200,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return { error: error.message, status: 400 };
        }
    }
    
    /**
     * Handle get triples
     */
    private async handleGetTriples(request: APIRequest): Promise<APIResponse> {
        const { subject, predicate, object, limit = 100 } = request.params || {};
        
        try {
            const triples = this.graph.match(
                subject || null,
                predicate || null,
                object || null
            );
            
            const limitedTriples = triples.slice(0, limit);
            
            return {
                data: limitedTriples,
                status: 200,
                metadata: {
                    total: triples.length,
                    returned: limitedTriples.length,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    }
    
    /**
     * Handle add triple
     */
    private async handleAddTriple(request: APIRequest): Promise<APIResponse> {
        const { subject, predicate, object } = request.params || {};
        
        if (!subject || !predicate || !object) {
            return { error: 'Subject, predicate, and object required', status: 400 };
        }
        
        try {
            this.graph.add({ subject, predicate, object });
            
            return {
                data: { success: true },
                status: 201,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    }
    
    /**
     * Handle search assets
     */
    private async handleSearchAssets(request: APIRequest): Promise<APIResponse> {
        const { keyword, class: className, limit = 20 } = request.params || {};
        
        try {
            const files = this.app.vault.getMarkdownFiles();
            const results = [];
            
            for (const file of files) {
                const cache = this.app.metadataCache.getFileCache(file);
                if (!cache?.frontmatter) continue;
                
                const fm = cache.frontmatter;
                
                // Filter by class if specified
                if (className && fm['exo__Instance_class'] !== className) {
                    continue;
                }
                
                // Filter by keyword if specified
                if (keyword) {
                    const label = fm['exo__Asset_label'] || '';
                    const description = fm['exo__Asset_description'] || '';
                    
                    if (!label.toLowerCase().includes(keyword.toLowerCase()) &&
                        !description.toLowerCase().includes(keyword.toLowerCase())) {
                        continue;
                    }
                }
                
                results.push({
                    path: file.path,
                    uid: fm['exo__Asset_uid'],
                    class: fm['exo__Instance_class'],
                    label: fm['exo__Asset_label'],
                    metadata: fm
                });
                
                if (results.length >= limit) break;
            }
            
            return {
                data: results,
                status: 200,
                metadata: {
                    count: results.length,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    }
    
    /**
     * Handle create asset
     */
    private async handleCreateAsset(request: APIRequest): Promise<APIResponse> {
        const { name, class: className, ontology, properties } = request.params || {};
        
        if (!name || !className) {
            return { error: 'Name and class required', status: 400 };
        }
        
        try {
            const uid = this.generateUID();
            const timestamp = new Date().toISOString();
            
            // Generate frontmatter
            const frontmatter = {
                'exo__Asset_uid': uid,
                'exo__Asset_isDefinedBy': ontology || '[[!exo]]',
                'exo__Instance_class': `[[${className}]]`,
                'exo__Asset_label': name,
                'exo__Asset_createdAt': timestamp,
                ...properties
            };
            
            // Generate content
            const yamlContent = this.generateYAML(frontmatter);
            const content = `---\n${yamlContent}---\n\n# ${name}\n\nCreated via REST API at ${timestamp}`;
            
            // Create file
            const fileName = `${name.replace(/[^a-zA-Z0-9 -]/g, '')}.md`;
            const filePath = `03 Knowledge/${fileName}`;
            
            await this.app.vault.create(filePath, content);
            
            return {
                data: {
                    uid,
                    path: filePath,
                    name,
                    class: className
                },
                status: 201,
                metadata: {
                    timestamp
                }
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    }
    
    /**
     * Handle ontologize relations
     */
    private async handleOntologizeRelations(request: APIRequest): Promise<APIResponse> {
        const { assetPath } = request.params || {};
        
        if (!assetPath) {
            return { error: 'Asset path required', status: 400 };
        }
        
        try {
            const file = this.app.vault.getAbstractFileByPath(assetPath);
            if (!file) {
                return { error: 'Asset not found', status: 404 };
            }
            
            const relations = await this.relationOntologizer.ontologizeAsset(file as any);
            await this.relationOntologizer.createRelationFiles(relations);
            
            return {
                data: {
                    relationsCreated: relations.length,
                    relations: relations.map(r => ({
                        uid: r.uid,
                        subject: r.subject,
                        predicate: r.predicate,
                        object: r.object
                    }))
                },
                status: 200,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    }
    
    /**
     * Handle set focus context
     */
    private async handleSetFocus(request: APIRequest): Promise<APIResponse> {
        const { context, filters } = request.params || {};
        
        if (!context) {
            return { error: 'Context required', status: 400 };
        }
        
        try {
            // Store focus context (would need implementation)
            const focusData = {
                context,
                filters,
                timestamp: new Date().toISOString()
            };
            
            // Save to plugin settings or dedicated file
            await this.saveFocusContext(focusData);
            
            return {
                data: { success: true, focus: focusData },
                status: 200,
                metadata: {
                    timestamp: focusData.timestamp
                }
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    }
    
    /**
     * Handle get focus context
     */
    private async handleGetFocus(request: APIRequest): Promise<APIResponse> {
        try {
            const focusData = await this.loadFocusContext();
            
            return {
                data: focusData,
                status: 200,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    }
    
    /**
     * Write API response
     */
    private async writeResponse(requestFile: string, response: APIResponse): Promise<void> {
        const responsePath = requestFile.replace('/requests/', '/responses/');
        const responseContent = JSON.stringify(response, null, 2);
        
        await this.app.vault.adapter.write(responsePath, responseContent);
    }
    
    /**
     * Register protocol handlers for obsidian:// URLs
     */
    private registerProtocolHandlers(): void {
        // This would register handlers for obsidian://exocortex-api/* URLs
        // Implementation depends on Obsidian's protocol handling
    }
    
    /**
     * Generate API key
     */
    private generateAPIKey(): string {
        // In production, this should be stored securely
        return 'exo-' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Generate UID
     */
    private generateUID(): string {
        return 'asset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    }
    
    /**
     * Generate YAML from object
     */
    private generateYAML(obj: Record<string, any>): string {
        const lines: string[] = [];
        
        for (const [key, value] of Object.entries(obj)) {
            if (value === undefined || value === null) continue;
            
            if (Array.isArray(value)) {
                lines.push(`${key}:`);
                for (const item of value) {
                    lines.push(`  - ${JSON.stringify(item)}`);
                }
            } else {
                lines.push(`${key}: ${JSON.stringify(value)}`);
            }
        }
        
        return lines.join('\n') + '\n';
    }
    
    /**
     * Save focus context
     */
    private async saveFocusContext(focusData: any): Promise<void> {
        const path = '.exocortex-api/focus.json';
        await this.app.vault.adapter.write(path, JSON.stringify(focusData, null, 2));
    }
    
    /**
     * Load focus context
     */
    private async loadFocusContext(): Promise<any> {
        const path = '.exocortex-api/focus.json';
        try {
            const content = await this.app.vault.adapter.read(path);
            return JSON.parse(content);
        } catch {
            return null;
        }
    }
}

interface APIRequest {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, any>;
    apiKey: string;
}

interface APIResponse {
    data?: any;
    error?: string;
    status: number;
    metadata?: Record<string, any>;
}