import {
  IQueryEngine,
  QueryEngineType,
  QueryResult,
  QueryContext,
} from "../../domain/ports/IQueryEngine";
import { Result } from "../../domain/core/Result";

/**
 * Dataview Query Engine Implementation
 * Adapts the Dataview plugin API to our generic query engine interface
 */
export class DataviewQueryEngine implements IQueryEngine {
  constructor(private dataviewApi?: any) {}

  public getType(): QueryEngineType {
    return "dataview";
  }

  public isAvailable(): boolean {
    return !!this.dataviewApi && typeof this.dataviewApi.pages === "function";
  }

  public async executeQuery(
    query: string,
    context?: QueryContext,
  ): Promise<Result<QueryResult>> {
    if (!this.isAvailable()) {
      return Result.fail<QueryResult>("Dataview is not available");
    }

    try {
      const result = await this.parseAndExecuteQuery(query, context);
      return Result.ok<QueryResult>(result);
    } catch (error) {
      return Result.fail<QueryResult>(`Dataview query error: ${error}`);
    }
  }

  public async renderQuery(
    container: HTMLElement,
    query: string,
    context?: QueryContext,
  ): Promise<Result<void>> {
    if (!this.isAvailable()) {
      return Result.fail<void>("Dataview is not available");
    }

    try {
      await this.renderDataviewQuery(container, query, context);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Dataview render error: ${error}`);
    }
  }

  public async getPages(source: string): Promise<Result<any[]>> {
    if (!this.isAvailable()) {
      return Result.fail<any[]>("Dataview is not available");
    }

    try {
      const pages = this.dataviewApi.pages(source);
      return Result.ok<any[]>(pages ? Array.from(pages) : []);
    } catch (error) {
      return Result.fail<any[]>(`Failed to get pages: ${error}`);
    }
  }

  public async getPageMetadata(
    path: string,
  ): Promise<Result<Record<string, any>>> {
    if (!this.isAvailable()) {
      return Result.fail<Record<string, any>>("Dataview is not available");
    }

    try {
      const page = this.dataviewApi.page(path);
      return Result.ok<Record<string, any>>(page || {});
    } catch (error) {
      return Result.fail<Record<string, any>>(
        `Failed to get page metadata: ${error}`,
      );
    }
  }

  public validateQuery(query: string): Result<boolean> {
    if (!query || query.trim().length === 0) {
      return Result.fail<boolean>("Query cannot be empty");
    }

    // Basic validation for Dataview query syntax
    const trimmedQuery = query.trim().toLowerCase();

    const validStartKeywords = ["table", "list", "task", "calendar"];
    const hasValidStart = validStartKeywords.some((keyword) =>
      trimmedQuery.startsWith(keyword),
    );

    if (!hasValidStart && !trimmedQuery.includes("dv.")) {
      return Result.fail<boolean>(
        "Query must start with table, list, task, calendar, or contain dv. calls",
      );
    }

    return Result.ok<boolean>(true);
  }

  private async parseAndExecuteQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    const queryLines = query.trim().split("\n");
    const firstLine = queryLines[0].toLowerCase();

    if (firstLine.startsWith("table")) {
      return await this.executeTableQuery(query, context);
    } else if (firstLine.startsWith("list")) {
      return await this.executeListQuery(query, context);
    } else if (firstLine.startsWith("task")) {
      return await this.executeTaskQuery(query, context);
    } else if (firstLine.startsWith("calendar")) {
      return await this.executeCalendarQuery(query, context);
    } else {
      // Try to execute as raw JavaScript
      return await this.executeRawQuery(query, context);
    }
  }

  private async executeTableQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    const tableMatch = query.match(/table\s+(.+?)\s+from/s);
    const fromMatch = query.match(/from\s+(.+?)(?:\s+where|$)/s);
    const whereMatch = query.match(/where\s+(.+?)$/s);

    if (!fromMatch) {
      throw new Error("Invalid table query: missing FROM clause");
    }

    const source = fromMatch[1].trim();
    const fields = tableMatch
      ? tableMatch[1].split(",").map((f) => f.trim())
      : [];

    let pages = this.dataviewApi.pages(source);

    if (whereMatch) {
      // Apply where clause (simplified - in real implementation would need proper expression evaluation)
      const whereClause = whereMatch[1];
      pages = pages.where((p: any) => this.evaluateWhereClause(p, whereClause));
    }

    const data = pages.map((p: any) => {
      const row: any = { file: p.file };
      fields.forEach((field) => {
        row[field] = this.getFieldValue(p, field);
      });
      return row;
    });

    return {
      type: "table",
      data: Array.from(data),
      columns: ["file", ...fields],
      metadata: { source, where: whereMatch?.[1] },
    };
  }

  private async executeListQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    const fromMatch = query.match(/from\s+(.+?)(?:\s+where|$)/s);

    if (!fromMatch) {
      throw new Error("Invalid list query: missing FROM clause");
    }

    const source = fromMatch[1].trim();
    const pages = this.dataviewApi.pages(source);

    return {
      type: "list",
      data: Array.from(pages).map((p: any) => p.file),
      metadata: { source },
    };
  }

  private async executeTaskQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    const fromMatch = query.match(/from\s+(.+?)(?:\s+where|$)/s);

    const source = fromMatch ? fromMatch[1].trim() : '""';
    const tasks = this.dataviewApi
      .pages(source)
      .file.tasks.where((t: any) => !t.completed);

    return {
      type: "task",
      data: Array.from(tasks),
      metadata: { source },
    };
  }

  private async executeCalendarQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    // Calendar query implementation would be more complex
    // This is a simplified version
    return {
      type: "calendar",
      data: [],
      metadata: { queryType: "calendar" },
    };
  }

  private async executeRawQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    // Execute as JavaScript with dataview context
    const AsyncFunction = Object.getPrototypeOf(
      async function () {},
    ).constructor;
    const fn = new AsyncFunction("dv", "context", query);

    const result = await fn(this.dataviewApi, context);

    return {
      type: "raw",
      data: Array.isArray(result) ? result : [result],
      metadata: { queryType: "raw" },
    };
  }

  private async renderDataviewQuery(
    container: HTMLElement,
    query: string,
    context?: QueryContext,
  ): Promise<void> {
    const dvContainer = container.createDiv({
      cls: "exocortex-dataview-container",
    });

    const queryLines = query.trim().split("\n");
    const firstLine = queryLines[0].toLowerCase();

    if (firstLine.startsWith("table")) {
      await this.renderTableQuery(dvContainer, query);
    } else if (firstLine.startsWith("list")) {
      await this.renderListQuery(dvContainer, query);
    } else if (firstLine.startsWith("task")) {
      await this.renderTaskQuery(dvContainer, query);
    } else {
      // Execute as raw JavaScript with container access
      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;
      const fn = new AsyncFunction("dv", "container", "context", query);
      await fn(this.dataviewApi, dvContainer, context);
    }
  }

  private async renderTableQuery(
    container: HTMLElement,
    query: string,
  ): Promise<void> {
    const result = await this.executeTableQuery(query);

    if (result.data.length === 0) {
      container.createEl("p", {
        text: "No results found",
        cls: "exocortex-empty",
      });
      return;
    }

    this.dataviewApi.table(
      result.columns,
      result.data.map((row: any) =>
        result.columns!.map((col) => row[col] || ""),
      ),
    );
  }

  private async renderListQuery(
    container: HTMLElement,
    query: string,
  ): Promise<void> {
    const result = await this.executeListQuery(query);

    if (result.data.length === 0) {
      container.createEl("p", {
        text: "No results found",
        cls: "exocortex-empty",
      });
      return;
    }

    this.dataviewApi.list(result.data);
  }

  private async renderTaskQuery(
    container: HTMLElement,
    query: string,
  ): Promise<void> {
    const result = await this.executeTaskQuery(query);

    if (result.data.length === 0) {
      container.createEl("p", {
        text: "No tasks found",
        cls: "exocortex-empty",
      });
      return;
    }

    this.dataviewApi.taskList(result.data);
  }

  private getFieldValue(page: any, field: string): any {
    // Handle nested field access (e.g., "file.name", "metadata.title")
    const parts = field.split(".");
    let value = page;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }

    return value || "";
  }

  private evaluateWhereClause(page: any, whereClause: string): boolean {
    // Simplified where clause evaluation
    // In a real implementation, this would need proper expression parsing
    try {
      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;
      const fn = new AsyncFunction("page", `return ${whereClause};`);
      return fn(page);
    } catch {
      return true; // Default to include if evaluation fails
    }
  }
}
