import {
  IQueryEngine,
  QueryEngineType,
  QueryResult,
  QueryContext,
} from "../../domain/ports/IQueryEngine";
import { Result } from "../../domain/core/Result";

/**
 * Datacore Query Engine Implementation
 * Adapts the Datacore plugin API to our generic query engine interface
 */
export class DatacoreQueryEngine implements IQueryEngine {
  constructor(private datacoreApi?: any) {}

  public getType(): QueryEngineType {
    return "datacore";
  }

  public isAvailable(): boolean {
    return !!this.datacoreApi && typeof this.datacoreApi.query === "function";
  }

  public async executeQuery(
    query: string,
    context?: QueryContext,
  ): Promise<Result<QueryResult>> {
    if (!this.isAvailable()) {
      return Result.fail<QueryResult>("Datacore is not available");
    }

    try {
      const result = await this.parseAndExecuteQuery(query, context);
      return Result.ok<QueryResult>(result);
    } catch (error) {
      return Result.fail<QueryResult>(`Datacore query error: ${error}`);
    }
  }

  public async renderQuery(
    container: HTMLElement,
    query: string,
    context?: QueryContext,
  ): Promise<Result<void>> {
    if (!this.isAvailable()) {
      return Result.fail<void>("Datacore is not available");
    }

    try {
      await this.renderDatacoreQuery(container, query, context);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Datacore render error: ${error}`);
    }
  }

  public async getPages(source: string): Promise<Result<any[]>> {
    if (!this.isAvailable()) {
      return Result.fail<any[]>("Datacore is not available");
    }

    try {
      // Datacore uses different syntax - convert from Dataview format if needed
      const datacoreSource = this.convertDataviewSource(source);
      const result = await this.datacoreApi.query(datacoreSource);
      return Result.ok<any[]>(result ? Array.from(result) : []);
    } catch (error) {
      return Result.fail<any[]>(`Failed to get pages: ${error}`);
    }
  }

  public async getPageMetadata(
    path: string,
  ): Promise<Result<Record<string, any>>> {
    if (!this.isAvailable()) {
      return Result.fail<Record<string, any>>("Datacore is not available");
    }

    try {
      const page = await this.datacoreApi.page(path);
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

    // Basic validation for Datacore query syntax
    const trimmedQuery = query.trim().toLowerCase();

    // Datacore supports both Dataview-style queries and its own query language
    const validDataviewStart = ["table", "list", "task", "calendar"];
    const hasValidDataviewStart = validDataviewStart.some((keyword) =>
      trimmedQuery.startsWith(keyword),
    );

    // Datacore also supports SQL-like queries and JavaScript
    const hasDatacorePattern =
      trimmedQuery.includes("from") ||
      trimmedQuery.includes("select") ||
      trimmedQuery.includes("dc.") ||
      trimmedQuery.includes("datacore.");

    if (!hasValidDataviewStart && !hasDatacorePattern) {
      return Result.fail<boolean>(
        "Query must be valid Dataview or Datacore syntax",
      );
    }

    return Result.ok<boolean>(true);
  }

  private async parseAndExecuteQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    const trimmedQuery = query.trim();
    const firstLine = trimmedQuery.split("\n")[0].toLowerCase();

    // Check if it's a Dataview-style query that needs conversion
    if (firstLine.startsWith("table")) {
      return await this.executeTableQuery(query, context);
    } else if (firstLine.startsWith("list")) {
      return await this.executeListQuery(query, context);
    } else if (firstLine.startsWith("task")) {
      return await this.executeTaskQuery(query, context);
    } else if (firstLine.startsWith("calendar")) {
      return await this.executeCalendarQuery(query, context);
    } else {
      // Execute as native Datacore query or JavaScript
      return await this.executeNativeQuery(query, context);
    }
  }

  private async executeTableQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    // Convert Dataview table query to Datacore format
    const datacoreQuery = this.convertDataviewTableQuery(query);

    const result = await this.datacoreApi.query(datacoreQuery);

    return {
      type: "table",
      data: Array.from(result),
      columns: this.extractColumnsFromResult(result),
      metadata: {
        originalQuery: query,
        convertedQuery: datacoreQuery,
        engine: "datacore",
      },
    };
  }

  private async executeListQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    // Convert Dataview list query to Datacore format
    const datacoreQuery = this.convertDataviewListQuery(query);

    const result = await this.datacoreApi.query(datacoreQuery);

    return {
      type: "list",
      data: Array.from(result),
      metadata: {
        originalQuery: query,
        convertedQuery: datacoreQuery,
        engine: "datacore",
      },
    };
  }

  private async executeTaskQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    // Datacore has different task handling - adapt as needed
    const datacoreQuery = this.convertDataviewTaskQuery(query);

    const result = await this.datacoreApi.query(datacoreQuery);

    return {
      type: "task",
      data: Array.from(result),
      metadata: {
        originalQuery: query,
        convertedQuery: datacoreQuery,
        engine: "datacore",
      },
    };
  }

  private async executeCalendarQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    // Calendar functionality would need to be implemented based on Datacore capabilities
    return {
      type: "calendar",
      data: [],
      metadata: {
        queryType: "calendar",
        engine: "datacore",
        note: "Calendar queries not yet implemented for Datacore",
      },
    };
  }

  private async executeNativeQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryResult> {
    // Execute as native Datacore query
    const result = await this.datacoreApi.query(query, context);

    return {
      type: "raw",
      data: Array.isArray(result) ? result : [result],
      metadata: {
        queryType: "native",
        engine: "datacore",
      },
    };
  }

  private async renderDatacoreQuery(
    container: HTMLElement,
    query: string,
    context?: QueryContext,
  ): Promise<void> {
    const dcContainer = container.createDiv({
      cls: "exocortex-datacore-container",
    });

    try {
      const result = await this.parseAndExecuteQuery(query, context);

      switch (result.type) {
        case "table":
          this.renderTable(dcContainer, result);
          break;
        case "list":
          this.renderList(dcContainer, result);
          break;
        case "task":
          this.renderTasks(dcContainer, result);
          break;
        case "calendar":
          this.renderCalendar(dcContainer, result);
          break;
        default:
          this.renderRaw(dcContainer, result);
      }
    } catch (error) {
      dcContainer.createEl("p", {
        text: `Datacore execution error: ${error}`,
        cls: "exocortex-error",
      });
    }
  }

  private renderTable(container: HTMLElement, result: QueryResult): void {
    if (!result.data.length) {
      container.createEl("p", {
        text: "No results found",
        cls: "exocortex-empty",
      });
      return;
    }

    const table = container.createEl("table", { cls: "exocortex-table" });

    // Create header
    if (result.columns) {
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      result.columns.forEach((col) => {
        headerRow.createEl("th", { text: col });
      });
    }

    // Create body
    const tbody = table.createEl("tbody");
    result.data.forEach((row: any) => {
      const tr = tbody.createEl("tr");
      if (result.columns) {
        result.columns.forEach((col) => {
          tr.createEl("td", { text: this.formatCellValue(row[col]) });
        });
      } else {
        // Fallback if no columns defined
        Object.values(row).forEach((value) => {
          tr.createEl("td", { text: this.formatCellValue(value) });
        });
      }
    });
  }

  private renderList(container: HTMLElement, result: QueryResult): void {
    if (!result.data.length) {
      container.createEl("p", {
        text: "No results found",
        cls: "exocortex-empty",
      });
      return;
    }

    const list = container.createEl("ul", { cls: "exocortex-list" });
    result.data.forEach((item: any) => {
      const li = list.createEl("li");
      li.textContent = this.formatCellValue(item);
    });
  }

  private renderTasks(container: HTMLElement, result: QueryResult): void {
    if (!result.data.length) {
      container.createEl("p", {
        text: "No tasks found",
        cls: "exocortex-empty",
      });
      return;
    }

    const taskList = container.createEl("ul", { cls: "exocortex-task-list" });
    result.data.forEach((task: any) => {
      const li = taskList.createEl("li");
      const checkbox = li.createEl("input", { type: "checkbox" });
      checkbox.checked = task.completed || false;
      li.appendText(` ${task.text || task.description || "Untitled task"}`);
    });
  }

  private renderCalendar(container: HTMLElement, result: QueryResult): void {
    container.createEl("p", {
      text: "Calendar view not yet implemented for Datacore",
      cls: "exocortex-info",
    });
  }

  private renderRaw(container: HTMLElement, result: QueryResult): void {
    const pre = container.createEl("pre", { cls: "exocortex-raw-result" });
    pre.textContent = JSON.stringify(result.data, null, 2);
  }

  private convertDataviewSource(source: string): string {
    // Convert Dataview source format to Datacore format
    // This would need to be implemented based on actual Datacore syntax
    // For now, return as-is and let Datacore handle it
    return source;
  }

  private convertDataviewTableQuery(query: string): string {
    // Convert Dataview table query to Datacore equivalent
    // This is a simplified conversion - real implementation would be more sophisticated

    const tableMatch = query.match(
      /table\s+(.+?)\s+from\s+(.+?)(?:\s+where\s+(.+?))?$/s,
    );

    if (!tableMatch) {
      return query; // Return original if can't parse
    }

    const [, fields, source, where] = tableMatch;

    let datacoreQuery = `SELECT ${fields.trim()} FROM ${source.trim()}`;

    if (where) {
      datacoreQuery += ` WHERE ${where.trim()}`;
    }

    return datacoreQuery;
  }

  private convertDataviewListQuery(query: string): string {
    // Convert Dataview list query to Datacore equivalent
    const fromMatch = query.match(/from\s+(.+?)(?:\s+where\s+(.+?))?$/s);

    if (!fromMatch) {
      return query;
    }

    const [, source, where] = fromMatch;

    let datacoreQuery = `SELECT file FROM ${source.trim()}`;

    if (where) {
      datacoreQuery += ` WHERE ${where.trim()}`;
    }

    return datacoreQuery;
  }

  private convertDataviewTaskQuery(query: string): string {
    // Convert Dataview task query to Datacore equivalent
    // This would need to be implemented based on how Datacore handles tasks
    return query; // Placeholder
  }

  private extractColumnsFromResult(result: any): string[] | undefined {
    if (!result || !Array.isArray(result) || result.length === 0) {
      return undefined;
    }

    const firstRow = result[0];
    if (typeof firstRow === "object" && firstRow !== null) {
      return Object.keys(firstRow);
    }

    return undefined;
  }

  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.formatCellValue(v)).join(", ");
    }

    if (typeof value === "object") {
      // Handle links, dates, and other objects
      if (value.path) {
        return `[[${value.path}]]`;
      }
      return JSON.stringify(value);
    }

    return String(value);
  }
}
