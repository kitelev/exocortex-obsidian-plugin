import { App, Notice, Plugin, requestUrl, RequestUrlParam } from "obsidian";
import { Graph } from "../../domain/semantic/core/Graph";
import { Triple, IRI, Literal } from "../../domain/semantic/core/Triple";
import { ExoAgent } from "../../application/services/ExoAgent";
import { RelationOntologizer } from "../../application/services/RelationOntologizer";
import { LocalAPIServer } from "./LocalAPIServer";

export interface APISettings {
  enabled: boolean;
  port: number;
  securePort: number;
  useHttps: boolean;
  apiKey: string;
  corsEnabled: boolean;
  allowedOrigins: string[];
}

export class ExocortexAPIServer {
  private httpServer: any = null;
  private httpsServer: any = null;
  private apiKey: string;
  private queryProcessor: any;
  private exoAgent: ExoAgent;
  private relationOntologizer: RelationOntologizer;
  private settings: APISettings;

  constructor(
    private app: App,
    private plugin: Plugin,
    private graph: Graph,
    settings?: Partial<APISettings>,
  ) {
    this.settings = {
      enabled: true,
      port: 27124,
      securePort: 27125,
      useHttps: false,
      apiKey: this.generateAPIKey(),
      corsEnabled: true,
      allowedOrigins: ["*"],
      ...settings,
    };

    this.apiKey = this.settings.apiKey;
    this.queryProcessor = null; // Removed SPARQL processor
    this.exoAgent = new ExoAgent(app, graph);
    this.relationOntologizer = new RelationOntologizer(app);
  }

  async start(): Promise<void> {
    if (!this.settings.enabled) {
      console.log("REST API server is disabled");
      return;
    }

    try {
      if (this.settings.useHttps) {
        await this.startHttpsServer();
      } else {
        await this.startHttpServer();
      }

      new Notice(
        `🌐 Exocortex REST API started on port ${this.settings.useHttps ? this.settings.securePort : this.settings.port}`,
      );
      console.log(`API Key: ${this.apiKey}`);
      console.log(
        `API Documentation: http://localhost:${this.settings.port}/api/docs`,
      );
    } catch (error) {
      console.error("Failed to start REST API server:", error);
      new Notice("Failed to start REST API server");
    }
  }

  private async startHttpServer(): Promise<void> {
    try {
      const http = (window as any).require("http");
      this.httpServer = http.createServer((req: any, res: any) => {
        this.handleRequest(req, res);
      });

      return new Promise((resolve, reject) => {
        this.httpServer.listen(this.settings.port, () => {
          console.log(`HTTP server listening on port ${this.settings.port}`);
          resolve();
        });

        this.httpServer.on("error", (error: any) => {
          console.error("HTTP server error:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error(
        "Failed to start HTTP server. Using file-based API fallback.",
        error,
      );
      await this.startFileBasedAPI();
    }
  }

  private async startHttpsServer(): Promise<void> {
    try {
      const https = (window as any).require("https");
      const cert = this.generateSelfSignedCertificate();

      this.httpsServer = https.createServer(
        {
          key: cert.privateKey,
          cert: cert.certificate,
        },
        (req: any, res: any) => {
          this.handleRequest(req, res);
        },
      );

      return new Promise((resolve, reject) => {
        this.httpsServer.listen(this.settings.securePort, () => {
          console.log(
            `HTTPS server listening on port ${this.settings.securePort}`,
          );
          resolve();
        });

        this.httpsServer.on("error", (error: any) => {
          console.error("HTTPS server error:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error(
        "Failed to start HTTPS server. Using file-based API fallback.",
        error,
      );
      await this.startFileBasedAPI();
    }
  }

  private async startFileBasedAPI(): Promise<void> {
    const localAPI = new LocalAPIServer(this.app, this.plugin, this.graph);
    await localAPI.start();
    this.httpServer = localAPI;
  }

  private async handleRequest(req: any, res: any): Promise<void> {
    if (this.settings.corsEnabled) {
      this.setCorsHeaders(res);
    }

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const apiKey = this.extractApiKey(req);
    if (apiKey !== this.apiKey) {
      this.sendError(res, 401, "Invalid API key");
      return;
    }

    const url = new URL(
      req.url || "/",
      `http://localhost:${this.settings.port}`,
    );
    const path = url.pathname;

    try {
      await this.routeRequest(req, res, path, url);
    } catch (error) {
      console.error("Request handling error:", error);
      this.sendError(res, 500, error.message);
    }
  }

  private async routeRequest(
    req: any,
    res: any,
    path: string,
    url: URL,
  ): Promise<void> {
    const routes: Record<string, () => Promise<void>> = {
      "/api/docs": async () => this.handleDocs(res),
      "/api/health": async () => this.handleHealth(res),
      "/api/sparql": async () => this.handleSparql(req, res, url),
      "/api/nlp": async () => this.handleNlp(req, res, url),
      "/api/graph": async () => this.handleGraph(req, res, url),
      "/api/assets": async () => this.handleAssets(req, res, url),
      "/api/assets/create": async () => this.handleCreateAsset(req, res),
      "/api/relations/ontologize": async () => this.handleOntologize(req, res),
      "/api/focus": async () => this.handleFocus(req, res, url),
      "/api/vault/files": async () => this.handleVaultFiles(res),
      "/api/vault/search": async () => this.handleVaultSearch(req, res, url),
    };

    const handler = routes[path];
    if (handler) {
      await handler();
    } else {
      this.sendError(res, 404, "Endpoint not found");
    }
  }

  private async handleDocs(res: any): Promise<void> {
    const docs = {
      name: "Exocortex REST API",
      version: "1.0.0",
      baseUrl: `http://localhost:${this.settings.port}`,
      authentication: {
        type: "API Key",
        header: "X-API-Key",
        description: "Include your API key in the X-API-Key header",
      },
      endpoints: [
        {
          path: "/api/health",
          method: "GET",
          description: "Check API health status",
        },
        {
          path: "/api/sparql",
          method: "GET/POST",
          description: "Execute SPARQL queries",
          parameters: {
            query: "SPARQL query string",
          },
        },
        {
          path: "/api/nlp",
          method: "GET/POST",
          description: "Natural language query",
          parameters: {
            q: "Natural language query",
          },
        },
        {
          path: "/api/graph",
          method: "GET/POST",
          description: "Graph operations",
          parameters: {
            s: "Subject",
            p: "Predicate",
            o: "Object",
            operation: "match|add|remove",
          },
        },
        {
          path: "/api/assets",
          method: "GET",
          description: "Search assets",
          parameters: {
            q: "Search keyword",
            class: "Asset class",
            limit: "Result limit",
          },
        },
        {
          path: "/api/assets/create",
          method: "POST",
          description: "Create new asset",
          body: {
            name: "Asset name",
            class: "Asset class",
            properties: "Additional properties",
          },
        },
        {
          path: "/api/relations/ontologize",
          method: "POST",
          description: "Ontologize asset relations",
          body: {
            assetPath: "Path to asset file",
          },
        },
        {
          path: "/api/focus",
          method: "GET/POST",
          description: "Manage ExoFocus context",
        },
        {
          path: "/api/vault/files",
          method: "GET",
          description: "List vault files",
        },
        {
          path: "/api/vault/search",
          method: "GET",
          description: "Search vault content",
          parameters: {
            q: "Search query",
          },
        },
      ],
    };

    this.sendJson(res, docs);
  }

  private async handleHealth(res: any): Promise<void> {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      graph: {
        triples: this.graph.match(null, null, null).length,
        size: this.graph.size,
      },
      vault: {
        files: this.app.vault.getMarkdownFiles().length,
      },
    };

    this.sendJson(res, health);
  }

  private async handleSparql(req: any, res: any, url: URL): Promise<void> {
    let query: string;

    if (req.method === "POST") {
      const body = await this.getRequestBody(req);
      const data = JSON.parse(body);
      query = data.query;
    } else {
      query = url.searchParams.get("query") || "";
    }

    if (!query) {
      this.sendError(res, 400, "Query parameter required");
      return;
    }

    try {
      const queryResult = await this.queryProcessor?.executeQuery(query);
      this.sendJson(res, {
        results: queryResult.results,
        count: queryResult.results.length,
        cached: queryResult.cached,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.sendError(res, 400, error.message);
    }
  }

  private async handleNlp(req: any, res: any, url: URL): Promise<void> {
    let query: string;

    if (req.method === "POST") {
      const body = await this.getRequestBody(req);
      const data = JSON.parse(body);
      query = data.q || data.query;
    } else {
      query = url.searchParams.get("q") || "";
    }

    if (!query) {
      this.sendError(res, 400, "Query parameter required");
      return;
    }

    try {
      const result = await this.exoAgent.processQuery(query);
      this.sendJson(res, result);
    } catch (error) {
      this.sendError(res, 400, error.message);
    }
  }

  private async handleGraph(req: any, res: any, url: URL): Promise<void> {
    if (req.method === "GET") {
      const subject = url.searchParams.get("s");
      const predicate = url.searchParams.get("p");
      const object = url.searchParams.get("o");
      const limit = parseInt(url.searchParams.get("limit") || "100");

      const subjectNode = subject ? new IRI(subject) : null;
      const predicateNode = predicate ? new IRI(predicate) : null;
      const objectNode = object
        ? object.startsWith('"')
          ? Literal.string(object.replace(/^"|"$/g, ""))
          : new IRI(object)
        : null;

      const triples = this.graph
        .match(subjectNode, predicateNode, objectNode)
        .slice(0, limit);

      this.sendJson(res, {
        triples,
        count: triples.length,
      });
    } else if (req.method === "POST") {
      const body = await this.getRequestBody(req);
      const data = JSON.parse(body);

      if (data.operation === "add") {
        if (!data.subject || !data.predicate || !data.object) {
          this.sendError(res, 400, "Subject, predicate, and object required");
          return;
        }

        const subjectNode = new IRI(data.subject);
        const predicateNode = new IRI(data.predicate);
        const objectNode =
          typeof data.object === "string" && data.object.startsWith('"')
            ? Literal.string(data.object.replace(/^"|"$/g, ""))
            : new IRI(data.object);

        this.graph.add(new Triple(subjectNode, predicateNode, objectNode));

        this.sendJson(res, { success: true });
      } else if (data.operation === "remove") {
        const subjectNode = data.subject ? new IRI(data.subject) : null;
        const predicateNode = data.predicate ? new IRI(data.predicate) : null;
        const objectNode = data.object
          ? typeof data.object === "string" && data.object.startsWith('"')
            ? Literal.string(data.object.replace(/^"|"$/g, ""))
            : new IRI(data.object)
          : null;

        const triples = this.graph.match(
          subjectNode,
          predicateNode,
          objectNode,
        );

        for (const triple of triples) {
          this.graph.remove(triple);
        }

        this.sendJson(res, {
          success: true,
          removed: triples.length,
        });
      } else {
        this.sendError(res, 400, "Invalid operation");
      }
    } else {
      this.sendError(res, 405, "Method not allowed");
    }
  }

  private async handleAssets(req: any, res: any, url: URL): Promise<void> {
    const keyword = url.searchParams.get("q") || "";
    const className = url.searchParams.get("class");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const files = this.app.vault.getMarkdownFiles();
    const results = [];

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache?.frontmatter) continue;

      const fm = cache.frontmatter;

      if (className && fm["exo__Instance_class"] !== className) {
        continue;
      }

      if (keyword) {
        const label = (fm["exo__Asset_label"] || "").toLowerCase();
        const desc = (fm["exo__Asset_description"] || "").toLowerCase();
        const kw = keyword.toLowerCase();

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

    this.sendJson(res, {
      assets: results,
      count: results.length,
    });
  }

  private async handleCreateAsset(req: any, res: any): Promise<void> {
    if (req.method !== "POST") {
      this.sendError(res, 405, "Method not allowed");
      return;
    }

    const body = await this.getRequestBody(req);
    const data = JSON.parse(body);

    if (!data.name || !data.class) {
      this.sendError(res, 400, "Name and class required");
      return;
    }

    const uid = this.generateUID();
    const timestamp = new Date().toISOString();

    const frontmatter = {
      exo__Asset_uid: uid,
      exo__Asset_isDefinedBy: data.ontology || "[[!exo]]",
      exo__Instance_class: `[[${data.class}]]`,
      exo__Asset_label: data.name,
      exo__Asset_createdAt: timestamp,
      ...data.properties,
    };

    const yamlContent = this.generateYAML(frontmatter);
    const content = `---\n${yamlContent}---\n\n# ${data.name}\n\nCreated via REST API at ${timestamp}`;

    const fileName = `${data.name.replace(/[^a-zA-Z0-9 -]/g, "")}.md`;
    const filePath = `03 Knowledge/${fileName}`;

    try {
      await this.app.vault.create(filePath, content);

      this.sendJson(
        res,
        {
          uid,
          path: filePath,
          name: data.name,
          class: data.class,
        },
        201,
      );
    } catch (error) {
      this.sendError(res, 500, error.message);
    }
  }

  private async handleOntologize(req: any, res: any): Promise<void> {
    if (req.method !== "POST") {
      this.sendError(res, 405, "Method not allowed");
      return;
    }

    const body = await this.getRequestBody(req);
    const data = JSON.parse(body);

    if (!data.assetPath) {
      this.sendError(res, 400, "Asset path required");
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(data.assetPath);
    if (!file) {
      this.sendError(res, 404, "Asset not found");
      return;
    }

    try {
      const relations = await this.relationOntologizer.ontologizeAsset(
        file as any,
      );
      await this.relationOntologizer.createRelationFiles(relations);

      this.sendJson(res, {
        relationsCreated: relations.length,
        relations: relations.map((r) => ({
          uid: r.uid,
          subject: r.subject,
          predicate: r.predicate,
          object: r.object,
        })),
      });
    } catch (error) {
      this.sendError(res, 500, error.message);
    }
  }

  private async handleFocus(req: any, res: any, url: URL): Promise<void> {
    const focusPath = ".exocortex/focus.json";

    if (req.method === "GET") {
      try {
        const content = await this.app.vault.adapter.read(focusPath);
        this.sendJson(res, JSON.parse(content));
      } catch {
        this.sendJson(res, { context: null, filters: {} });
      }
    } else if (req.method === "POST") {
      const body = await this.getRequestBody(req);
      const data = JSON.parse(body);

      const focusData = {
        context: data.context || "default",
        filters: data.filters || {},
        timestamp: new Date().toISOString(),
      };

      await this.app.vault.adapter.write(
        focusPath,
        JSON.stringify(focusData, null, 2),
      );
      this.sendJson(res, focusData);
    } else {
      this.sendError(res, 405, "Method not allowed");
    }
  }

  private async handleVaultFiles(res: any): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();
    const fileList = files.map((f) => ({
      path: f.path,
      name: f.name,
      basename: f.basename,
    }));

    this.sendJson(res, {
      files: fileList,
      count: fileList.length,
    });
  }

  private async handleVaultSearch(req: any, res: any, url: URL): Promise<void> {
    const query = url.searchParams.get("q") || "";

    if (!query) {
      this.sendError(res, 400, "Query parameter required");
      return;
    }

    const files = this.app.vault.getMarkdownFiles();
    const results = [];
    const limit = 20;

    for (const file of files) {
      const content = await this.app.vault.read(file);
      if (content.toLowerCase().includes(query.toLowerCase())) {
        const lines = content.split("\n");
        const matches = [];

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(query.toLowerCase())) {
            matches.push({
              line: i + 1,
              text: lines[i].substring(0, 200),
            });

            if (matches.length >= 3) break;
          }
        }

        results.push({
          path: file.path,
          matches,
        });

        if (results.length >= limit) break;
      }
    }

    this.sendJson(res, {
      results,
      count: results.length,
      query,
    });
  }

  private setCorsHeaders(res: any): void {
    const origins = this.settings.allowedOrigins.join(", ");
    res.setHeader("Access-Control-Allow-Origin", origins);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  private extractApiKey(req: any): string | null {
    return (
      (req.headers["x-api-key"] as string) ||
      req.headers["authorization"]?.replace("Bearer ", "") ||
      null
    );
  }

  private async getRequestBody(req: any): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk: any) => (body += chunk.toString()));
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });
  }

  private sendJson(res: any, data: any, status: number = 200): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data, null, 2));
  }

  private sendError(res: any, status: number, message: string): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message, status }, null, 2));
  }

  private generateAPIKey(): string {
    return (
      "exo-" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private generateUID(): string {
    return (
      "asset-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9)
    );
  }

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

  private generateSelfSignedCertificate(): {
    privateKey: string;
    certificate: string;
  } {
    return {
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7W8rTVpCd\n-----END PRIVATE KEY-----",
      certificate:
        "-----BEGIN CERTIFICATE-----\nMIICpDCCAYwCCQDU+pQ3ZUD30jANBgkqhkiG9w0BAQsFADASMRAwDgYDVQQD\n-----END CERTIFICATE-----",
    };
  }

  async stop(): Promise<void> {
    const stopServer = (server: any): Promise<void> => {
      return new Promise((resolve) => {
        server.close(() => {
          console.log("Server stopped");
          resolve();
        });
      });
    };

    if (this.httpServer) {
      await stopServer(this.httpServer);
      this.httpServer = null;
    }

    if (this.httpsServer) {
      await stopServer(this.httpsServer);
      this.httpsServer = null;
    }

    new Notice("REST API server stopped");
  }

  isRunning(): boolean {
    return this.httpServer !== null || this.httpsServer !== null;
  }

  getAPIKey(): string {
    return this.apiKey;
  }

  getSettings(): APISettings {
    return this.settings;
  }

  updateSettings(settings: Partial<APISettings>): void {
    this.settings = { ...this.settings, ...settings };
  }
}
