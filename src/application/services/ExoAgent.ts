import { App } from "obsidian";
import { Graph } from "../../domain/semantic/core/Graph";
import { IRI, Literal } from "../../domain/semantic/core/Triple";

export interface QueryIntent {
  type: "query_tasks" | "query_projects" | "query_relations" | "general";
  entities: string[];
  filters: Record<string, any>;
  timeframe?: string;
}

export interface QueryResult {
  intent: QueryIntent;
  sparql: string;
  results: any[];
  formatted: string;
}

export class ExoAgent {
  constructor(
    private app: App,
    private graph: Graph,
  ) {}

  async processQuery(nlQuery: string): Promise<QueryResult> {
    const intent = this.parseIntent(nlQuery);
    const sparqlQuery = this.generateSPARQL(intent);
    const results = await this.executeSPARQL(sparqlQuery);
    const formatted = this.formatResults(results, intent);

    return {
      intent,
      sparql: sparqlQuery,
      results,
      formatted,
    };
  }

  private parseIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("task") || lowerQuery.includes("todo")) {
      return {
        type: "query_tasks",
        entities: this.extractEntities(query),
        filters: this.extractFilters(query),
        timeframe: this.extractTimeframe(query),
      };
    }

    if (lowerQuery.includes("project")) {
      return {
        type: "query_projects",
        entities: this.extractEntities(query),
        filters: this.extractFilters(query),
      };
    }

    if (lowerQuery.includes("relation") || lowerQuery.includes("connect")) {
      return {
        type: "query_relations",
        entities: this.extractEntities(query),
        filters: {},
      };
    }

    return {
      type: "general",
      entities: this.extractEntities(query),
      filters: {},
    };
  }

  private extractEntities(query: string): string[] {
    const entities: string[] = [];

    const quotedMatches = query.match(/"([^"]+)"/g);
    if (quotedMatches) {
      entities.push(...quotedMatches.map((m) => m.replace(/"/g, "")));
    }

    const wikiLinkMatches = query.match(/\[\[([^\]]+)\]\]/g);
    if (wikiLinkMatches) {
      entities.push(...wikiLinkMatches.map((m) => m.replace(/\[\[|\]\]/g, "")));
    }

    return entities;
  }

  private extractFilters(query: string): Record<string, any> {
    const filters: Record<string, any> = {};

    if (
      query.toLowerCase().includes("pending") ||
      query.toLowerCase().includes("todo")
    ) {
      filters.status = "pending";
    }

    if (
      query.toLowerCase().includes("completed") ||
      query.toLowerCase().includes("done")
    ) {
      filters.status = "completed";
    }

    if (
      query.toLowerCase().includes("high priority") ||
      query.toLowerCase().includes("urgent")
    ) {
      filters.priority = "high";
    }

    return filters;
  }

  private extractTimeframe(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("today")) return "today";
    if (lowerQuery.includes("tomorrow")) return "tomorrow";
    if (lowerQuery.includes("this week")) return "this_week";
    if (lowerQuery.includes("next week")) return "next_week";
    if (lowerQuery.includes("this month")) return "this_month";

    return undefined;
  }

  private generateSPARQL(intent: QueryIntent): string {
    switch (intent.type) {
      case "query_tasks":
        return this.generateTaskQuery(intent);
      case "query_projects":
        return this.generateProjectQuery(intent);
      case "query_relations":
        return this.generateRelationQuery(intent);
      default:
        return this.generateGeneralQuery(intent);
    }
  }

  private generateTaskQuery(intent: QueryIntent): string {
    let query = `
            SELECT ?task ?label ?status ?priority WHERE {
                ?task a ems__Task .
                ?task exo__Asset_label ?label .
        `;

    if (intent.filters.status) {
      query += `\n                ?task ems__Task_status "${intent.filters.status}" .`;
    } else {
      query += `\n                OPTIONAL { ?task ems__Task_status ?status }`;
    }

    if (intent.filters.priority) {
      query += `\n                ?task ems__Task_priority "${intent.filters.priority}" .`;
    } else {
      query += `\n                OPTIONAL { ?task ems__Task_priority ?priority }`;
    }

    if (intent.timeframe) {
      query += `\n                ?task ems__Task_dueDate ?date .`;
    }

    query += `
            } LIMIT 20
        `;

    return query.trim();
  }

  private generateProjectQuery(intent: QueryIntent): string {
    return `
            SELECT ?project ?label ?status WHERE {
                ?project a ems__Project .
                ?project exo__Asset_label ?label .
                OPTIONAL { ?project ems__Project_status ?status }
            } LIMIT 20
        `.trim();
  }

  private generateRelationQuery(intent: QueryIntent): string {
    if (intent.entities.length > 0) {
      const entity = intent.entities[0];
      return `
                SELECT ?related ?predicate ?label WHERE {
                    { <${entity}> ?predicate ?related } 
                    UNION 
                    { ?related ?predicate <${entity}> }
                    OPTIONAL { ?related exo__Asset_label ?label }
                } LIMIT 20
            `.trim();
    }

    return `
            SELECT ?s ?p ?o WHERE {
                ?s ?p ?o
            } LIMIT 20
        `.trim();
  }

  private generateGeneralQuery(intent: QueryIntent): string {
    if (intent.entities.length > 0) {
      const entity = intent.entities[0];
      return `
                SELECT ?property ?value WHERE {
                    <${entity}> ?property ?value
                } LIMIT 20
            `.trim();
    }

    return `
            SELECT ?s ?label WHERE {
                ?s exo__Asset_label ?label
            } LIMIT 20
        `.trim();
  }

  private async executeSPARQL(query: string): Promise<any[]> {
    const triples = this.graph.match(null, null, null);
    const results: any[] = [];

    const isSelectQuery = query.toLowerCase().includes("select");
    if (!isSelectQuery) return [];

    const whereMatch = query.match(/WHERE\s*\{(.*?)\}/is);
    if (!whereMatch) return [];

    const patterns = whereMatch[1]
      .trim()
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith("OPTIONAL") && !p.startsWith("FILTER"));

    if (patterns.length === 0) return [];

    const firstPattern = patterns[0];
    const parts = firstPattern.split(/\s+/).filter((p) => p);
    if (parts.length < 3) return [];

    const [s, p, o] = parts;

    const subject = s.startsWith("?") ? null : new IRI(s.replace(/[<>]/g, ""));
    const predicate = p.startsWith("?") ? null : new IRI(p);
    const object = o.startsWith("?")
      ? null
      : o.startsWith('"')
        ? Literal.string(o.replace(/[<>"]/g, "").replace(".", ""))
        : new IRI(o.replace(/[<>]/g, "").replace(".", ""));

    const matchedTriples = this.graph.match(subject, predicate, object);

    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 20;

    return matchedTriples.slice(0, limit);
  }

  private formatResults(results: any[], intent: QueryIntent): string {
    if (results.length === 0) {
      return "No results found.";
    }

    switch (intent.type) {
      case "query_tasks":
        return this.formatTaskResults(results);
      case "query_projects":
        return this.formatProjectResults(results);
      case "query_relations":
        return this.formatRelationResults(results);
      default:
        return this.formatGeneralResults(results);
    }
  }

  private formatTaskResults(results: any[]): string {
    const tasks = results.map((r, i) => {
      const label = r.object || r.label || `Task ${i + 1}`;
      const status = r.status || "pending";
      return `${i + 1}. ${label} (${status})`;
    });

    return `Found ${results.length} task(s):\n${tasks.join("\n")}`;
  }

  private formatProjectResults(results: any[]): string {
    const projects = results.map((r, i) => {
      const label = r.object || r.label || `Project ${i + 1}`;
      const status = r.status || "active";
      return `${i + 1}. ${label} (${status})`;
    });

    return `Found ${results.length} project(s):\n${projects.join("\n")}`;
  }

  private formatRelationResults(results: any[]): string {
    const relations = results.map((r, i) => {
      return `${i + 1}. ${r.subject} → ${r.predicate} → ${r.object}`;
    });

    return `Found ${results.length} relation(s):\n${relations.join("\n")}`;
  }

  private formatGeneralResults(results: any[]): string {
    const items = results.map((r, i) => {
      if (r.subject && r.predicate && r.object) {
        return `${i + 1}. ${r.subject} → ${r.predicate} → ${r.object}`;
      }
      return `${i + 1}. ${JSON.stringify(r)}`;
    });

    return `Found ${results.length} result(s):\n${items.join("\n")}`;
  }
}
