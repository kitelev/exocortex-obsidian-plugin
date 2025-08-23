import { App, Notice, TFile, TFolder } from "obsidian";
import { Graph } from "../../domain/semantic/core/Graph";
import { Triple, IRI, Literal } from "../../domain/semantic/core/Triple";
import { ExoAgent } from "../../application/services/ExoAgent";
import { SPARQLProcessor } from "../../presentation/processors/SPARQLProcessor";

/**
 * Local File-Based API Server
 * Uses local files for communication with external agents
 * External agents write requests to .exocortex-api/requests/
 * Plugin processes them and writes responses to .exocortex-api/responses/
 */
export class LocalAPIServer {
  private isRunning: boolean = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private apiKey: string;
  private exoAgent: ExoAgent;
  private sparqlProcessor: SPARQLProcessor;
  private requestsFolder = ".exocortex-api/requests";
  private responsesFolder = ".exocortex-api/responses";
  private configFile = ".exocortex-api/config.json";

  constructor(
    private app: App,
    private plugin: any,
    private graph: Graph,
  ) {
    this.apiKey = this.generateAPIKey();
    this.exoAgent = new ExoAgent(app, graph);
    this.sparqlProcessor = new SPARQLProcessor(plugin, graph);
  }

  /**
   * Initialize API folders and configuration
   */
  async initialize(): Promise<void> {
    // Create API folders if they don't exist
    await this.ensureFolder(this.requestsFolder);
    await this.ensureFolder(this.responsesFolder);

    // Write API configuration
    const config = {
      apiKey: this.apiKey,
      version: "1.0.0",
      endpoints: this.getEndpointList(),
      status: "ready",
      port: 27124, // For compatibility info
      timestamp: new Date().toISOString(),
    };

    await this.app.vault.adapter.write(
      this.configFile,
      JSON.stringify(config, null, 2),
    );

    // Create README for external agents
    const readme = `# Exocortex Local API

## How to use

1. Check API configuration in config.json
2. Write your request as JSON to requests/[timestamp].json
3. Poll for response in responses/[timestamp].json
4. Delete response file after reading

## Request Format

\`\`\`json
{
  "id": "unique-request-id",
  "apiKey": "your-api-key",
  "endpoint": "/sparql",
  "method": "POST",
  "params": {
    "query": "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10"
  }
}
\`\`\`

## Available Endpoints

${this.getEndpointList()
  .map((e) => `- ${e.method} ${e.path}: ${e.description}`)
  .join("\n")}

## Example Python Client

\`\`\`python
import json
import time
import os
from pathlib import Path

class ExocortexClient:
    def __init__(self, vault_path, api_key):
        self.vault_path = Path(vault_path)
        self.api_key = api_key
        self.api_path = self.vault_path / '.exocortex-api'
        
    def request(self, endpoint, params, timeout=5):
        request_id = f"{time.time()}"
        request_file = self.api_path / 'requests' / f'{request_id}.json'
        response_file = self.api_path / 'responses' / f'{request_id}.json'
        
        # Write request
        request_data = {
            'id': request_id,
            'apiKey': self.api_key,
            'endpoint': endpoint,
            'params': params
        }
        
        with open(request_file, 'w') as f:
            json.dump(request_data, f)
        
        # Poll for response
        start = time.time()
        while time.time() - start < timeout:
            if response_file.exists():
                with open(response_file, 'r') as f:
                    response = json.load(f)
                response_file.unlink()  # Clean up
                return response
            time.sleep(0.1)
        
        raise TimeoutError('No response received')

# Usage
client = ExocortexClient('/path/to/vault', 'your-api-key')
result = client.request('/sparql', {'query': 'SELECT ?s WHERE { ?s a ems__Task }'})
print(result)
\`\`\`
`;

    await this.app.vault.adapter.write(".exocortex-api/README.md", readme);
  }

  /**
   * Start the API server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      // API server already running
      return;
    }

    await this.initialize();

    // Start polling for requests
    this.pollInterval = setInterval(async () => {
      await this.processRequests();
    }, 100); // Poll every 100ms for low latency

    this.isRunning = true;

    new Notice(
      `🌐 Local API Server started\nAPI Key: ${this.apiKey.substring(0, 10)}...`,
    );
    // Local API Server started
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Update config to show stopped
    const config = {
      status: "stopped",
      timestamp: new Date().toISOString(),
    };

    await this.app.vault.adapter.write(
      this.configFile,
      JSON.stringify(config, null, 2),
    );

    this.isRunning = false;

    new Notice("Local API Server stopped");
    // Local API Server stopped
  }

  /**
   * Process pending requests
   */
  private async processRequests(): Promise<void> {
    try {
      // Check if requests folder exists
      const folder = this.app.vault.getAbstractFileByPath(this.requestsFolder);
      if (!folder) return;

      // List request files
      const files = await this.app.vault.adapter.list(this.requestsFolder);

      for (const file of files.files) {
        if (file.endsWith(".json")) {
          await this.processRequestFile(file);
        }
      }
    } catch (error) {
      // Silently ignore errors (folder might not exist)
    }
  }

  /**
   * Process a single request file
   */
  private async processRequestFile(filePath: string): Promise<void> {
    try {
      // Read request
      const content = await this.app.vault.adapter.read(filePath);
      const request = JSON.parse(content);

      // Validate API key
      if (request.apiKey !== this.apiKey) {
        await this.writeResponse(request.id, {
          error: "Invalid API key",
          status: 401,
        });
        await this.app.vault.adapter.remove(filePath);
        return;
      }

      // Process request
      const response = await this.handleRequest(request);

      // Write response
      await this.writeResponse(request.id, response);

      // Delete request file
      await this.app.vault.adapter.remove(filePath);
    } catch (error) {
      console.error("Error processing request:", error);
    }
  }

  /**
   * Handle API request
   */
  private async handleRequest(request: any): Promise<any> {
    try {
      switch (request.endpoint) {
        case "/sparql":
          return await this.handleSPARQL(request.params);

        case "/nlp":
          return await this.handleNLP(request.params);

        case "/graph":
          return await this.handleGraph(request.params);

        case "/assets/search":
          return await this.handleSearchAssets(request.params);

        case "/assets/create":
          return await this.handleCreateAsset(request.params);

        case "/focus/set":
          return await this.handleSetFocus(request.params);

        case "/focus/get":
          return await this.handleGetFocus();

        case "/health":
          return {
            status: 200,
            data: {
              status: "ok",
              timestamp: new Date().toISOString(),
            },
          };

        default:
          return {
            error: "Unknown endpoint",
            status: 404,
          };
      }
    } catch (error) {
      return {
        error: error.message,
        status: 500,
      };
    }
  }

  /**
   * Handle SPARQL query
   */
  private async handleSPARQL(params: any): Promise<any> {
    if (!params?.query) {
      return { error: "Query required", status: 400 };
    }

    try {
      const queryResult = await this.sparqlProcessor.executeQuery(params.query);
      return {
        status: 200,
        data: {
          results: queryResult.results,
          count: queryResult.results.length,
          cached: queryResult.cached,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { error: error.message, status: 400 };
    }
  }

  /**
   * Handle NLP query
   */
  private async handleNLP(params: any): Promise<any> {
    if (!params?.query) {
      return { error: "Query required", status: 400 };
    }

    try {
      const result = await this.exoAgent.processQuery(params.query);
      return {
        status: 200,
        data: result,
      };
    } catch (error) {
      return { error: error.message, status: 400 };
    }
  }

  /**
   * Handle graph operations
   */
  private async handleGraph(params: any): Promise<any> {
    if (params.operation === "match") {
      const triples = this.graph.match(
        params.subject || null,
        params.predicate || null,
        params.object || null,
      );

      const limit = params.limit || 100;
      const results = triples.slice(0, limit);

      return {
        status: 200,
        data: {
          triples: results,
          total: triples.length,
          returned: results.length,
        },
      };
    } else if (params.operation === "add") {
      if (!params.subject || !params.predicate || !params.object) {
        return {
          error: "Subject, predicate, and object required",
          status: 400,
        };
      }

      const subjectNode = new IRI(params.subject);
      const predicateNode = new IRI(params.predicate);
      const objectNode =
        typeof params.object === "string" && params.object.startsWith('"')
          ? Literal.string(params.object.replace(/^"|"$/g, ""))
          : new IRI(params.object);

      this.graph.add(new Triple(subjectNode, predicateNode, objectNode));

      return {
        status: 201,
        data: { success: true },
      };
    }

    return { error: "Unknown operation", status: 400 };
  }

  /**
   * Handle asset search
   */
  private async handleSearchAssets(params: any): Promise<any> {
    const files = this.app.vault.getMarkdownFiles();
    const results = [];
    const limit = params.limit || 20;

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache?.frontmatter) continue;

      const fm = cache.frontmatter;

      // Apply filters
      if (params.class && fm["exo__Instance_class"] !== params.class) {
        continue;
      }

      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        const label = (fm["exo__Asset_label"] || "").toLowerCase();
        const desc = (fm["exo__Asset_description"] || "").toLowerCase();

        if (!label.includes(kw) && !desc.includes(kw)) {
          continue;
        }
      }

      results.push({
        path: file.path,
        uid: fm["exo__Asset_uid"],
        class: fm["exo__Instance_class"],
        label: fm["exo__Asset_label"],
        metadata: fm,
      });

      if (results.length >= limit) break;
    }

    return {
      status: 200,
      data: {
        assets: results,
        count: results.length,
      },
    };
  }

  /**
   * Handle asset creation
   */
  private async handleCreateAsset(params: any): Promise<any> {
    if (!params.name || !params.class) {
      return { error: "Name and class required", status: 400 };
    }

    const uid =
      "asset-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toISOString();

    const frontmatter: Record<string, any> = {
      exo__Asset_uid: uid,
      exo__Asset_isDefinedBy: params.ontology || "!exo",
      exo__Instance_class: `[[${params.class}]]`,
      exo__Asset_label: params.name,
      exo__Asset_createdAt: timestamp,
    };

    // Add custom properties
    if (params.properties) {
      Object.assign(frontmatter, params.properties);
    }

    // Generate YAML
    const yaml = this.generateYAML(frontmatter);
    const content = `---\n${yaml}---\n\n# ${params.name}\n\nCreated via API at ${timestamp}`;

    // Create file
    const fileName = params.name.replace(/[^a-zA-Z0-9 -]/g, "") + ".md";
    const filePath = `03 Knowledge/${fileName}`;

    await this.app.vault.create(filePath, content);

    return {
      status: 201,
      data: {
        uid,
        path: filePath,
        name: params.name,
        class: params.class,
      },
    };
  }

  /**
   * Handle focus context setting
   */
  private async handleSetFocus(params: any): Promise<any> {
    const focusData = {
      context: params.context || "default",
      filters: params.filters || {},
      timestamp: new Date().toISOString(),
    };

    await this.app.vault.adapter.write(
      ".exocortex-api/focus.json",
      JSON.stringify(focusData, null, 2),
    );

    return {
      status: 200,
      data: focusData,
    };
  }

  /**
   * Handle focus context getting
   */
  private async handleGetFocus(): Promise<any> {
    try {
      const content = await this.app.vault.adapter.read(
        ".exocortex-api/focus.json",
      );
      return {
        status: 200,
        data: JSON.parse(content),
      };
    } catch {
      return {
        status: 200,
        data: null,
      };
    }
  }

  /**
   * Write response file
   */
  private async writeResponse(requestId: string, response: any): Promise<void> {
    const responsePath = `${this.responsesFolder}/${requestId}.json`;
    await this.app.vault.adapter.write(
      responsePath,
      JSON.stringify(response, null, 2),
    );
  }

  /**
   * Ensure folder exists
   */
  private async ensureFolder(path: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (!folder) {
      await this.app.vault.adapter.mkdir(path);
    }
  }

  /**
   * Generate YAML
   */
  private generateYAML(obj: Record<string, any>): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - "${item}"`);
        }
      } else if (typeof value === "string" && value.includes("[[")) {
        lines.push(`${key}: "${value}"`);
      } else {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    }

    return lines.join("\n") + "\n";
  }

  /**
   * Get endpoint list
   */
  private getEndpointList(): any[] {
    return [
      { method: "POST", path: "/sparql", description: "Execute SPARQL query" },
      { method: "POST", path: "/nlp", description: "Natural language query" },
      {
        method: "POST",
        path: "/graph",
        description: "Graph operations (match/add)",
      },
      { method: "POST", path: "/assets/search", description: "Search assets" },
      {
        method: "POST",
        path: "/assets/create",
        description: "Create new asset",
      },
      { method: "POST", path: "/focus/set", description: "Set focus context" },
      { method: "GET", path: "/focus/get", description: "Get focus context" },
      { method: "GET", path: "/health", description: "Check API health" },
    ];
  }

  /**
   * Generate API key
   */
  private generateAPIKey(): string {
    return (
      "exo-" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Get API key
   */
  getAPIKey(): string {
    return this.apiKey;
  }

  /**
   * Check if running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}
