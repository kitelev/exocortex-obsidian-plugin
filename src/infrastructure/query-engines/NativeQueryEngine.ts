import { IQueryEngine, QueryResult, QueryEngineType, QueryContext } from '../../domain/ports/IQueryEngine';
import { App, TFile, TFolder, MetadataCache, Vault } from 'obsidian';
import { Result } from '../../domain/core/Result';

/**
 * Native query engine that works without Dataview/Datacore dependencies.
 * Optimized for iOS and mobile environments with limited resources.
 */
export class NativeQueryEngine implements IQueryEngine {
    private app: App;
    private metadataCache: MetadataCache;
    private vault: Vault;
    private queryCache: Map<string, { result: QueryResult; timestamp: number }>;
    private cacheTimeout: number = 5000; // 5 seconds cache

    constructor(app: App) {
        this.app = app;
        this.metadataCache = app?.metadataCache;
        this.vault = app?.vault;
        this.queryCache = new Map();
    }

    getName(): string {
        return 'native';
    }

    getType(): QueryEngineType {
        return 'native';
    }

    isAvailable(): boolean {
        // Native engine is available when app is provided
        return this.app != null;
    }

    async executeQuery(query: string, context?: any): Promise<Result<QueryResult>> {
        try {
            // Check cache first
            const cached = this.getCachedResult(query);
            if (cached) {
                return Result.ok(cached);
            }

            // Parse query type
            const queryType = this.parseQueryType(query);
            let result: QueryResult;

            switch (queryType.type) {
                case 'table':
                    result = await this.executeTableQuery(queryType.query, context);
                    break;
                case 'list':
                    result = await this.executeListQuery(queryType.query, context);
                    break;
                case 'task':
                    result = await this.executeTaskQuery(queryType.query, context);
                    break;
                case 'calendar':
                    result = await this.executeCalendarQuery(queryType.query, context);
                    break;
                default:
                    result = await this.executeCustomQuery(query, context);
            }

            // Cache the result
            this.cacheResult(query, result);
            return Result.ok(result);
        } catch (error) {
            return Result.fail(`Native query execution failed: ${error.message}`);
        }
    }

    private parseQueryType(query: string): { type: string; query: string } {
        const lowerQuery = query.toLowerCase().trim();
        
        if (lowerQuery.startsWith('table')) {
            return { type: 'table', query: query.substring(5).trim() };
        } else if (lowerQuery.startsWith('list')) {
            return { type: 'list', query: query.substring(4).trim() };
        } else if (lowerQuery.startsWith('task')) {
            return { type: 'task', query: query.substring(4).trim() };
        } else if (lowerQuery.startsWith('calendar')) {
            return { type: 'calendar', query: query.substring(8).trim() };
        }
        
        return { type: 'custom', query };
    }

    private async executeTableQuery(query: string, context?: any): Promise<QueryResult> {
        // Parse table query: "columns FROM source WHERE conditions"
        const tableRegex = /^(.+?)\s+from\s+"([^"]+)"(?:\s+where\s+(.+))?$/i;
        const match = query.match(tableRegex);
        
        if (!match) {
            throw new Error('Invalid table query format: missing FROM clause');
        }

        const [, columns, source, conditions] = match;
        const files = await this.getFilesFromSource(source, conditions);
        const columnList = columns.split(',').map(c => c.trim());
        
        const rows = await Promise.all(files.map(async file => {
            const metadata = this.metadataCache.getFileCache(file);
            const row: any = {};
            
            for (const col of columnList) {
                row[col] = await this.extractProperty(file, metadata, col);
            }
            
            return row;
        }));

        return {
            type: 'table',
            data: rows,
            columns: columnList,
            metadata: { 
                renderHtml: this.renderTable(columnList, rows),
                where: conditions || undefined
            }
        };
    }

    private async executeListQuery(query: string, context?: any): Promise<QueryResult> {
        // Parse list query: "FROM source WHERE conditions"
        const listRegex = /^from\s+"([^"]+)"(?:\s+where\s+(.+))?$/i;
        const match = query.match(listRegex);
        
        if (!match) {
            throw new Error('Invalid list query format: missing FROM clause');
        }

        const [, source, conditions] = match;
        const files = await this.getFilesFromSource(source, conditions);
        
        const items = files.map(file => ({
            text: file.basename,
            link: `[[${file.path}]]`
        }));

        return {
            type: 'list',
            data: items,
            metadata: { renderHtml: this.renderList(items) }
        };
    }

    private async executeTaskQuery(query: string, context?: any): Promise<QueryResult> {
        // Find all tasks in vault
        const tasks: any[] = [];
        
        if (!this.vault) {
            return {
                type: 'task',
                data: [],
                metadata: { renderHtml: this.renderTasks([]) }
            };
        }
        
        const files = this.vault.getMarkdownFiles();
        
        for (const file of files) {
            try {
                const content = await this.vault.cachedRead(file);
                const taskRegex = /^[\s]*- \[(.)\] (.+)$/gm;
                let match;
                
                while ((match = taskRegex.exec(content)) !== null) {
                    const [, status, text] = match;
                    tasks.push({
                        status: status === 'x' ? 'completed' : 'pending',
                        completed: status === 'x',
                        text,
                        file: file.path
                    });
                }
            } catch (error) {
                // Skip files that can't be read
                continue;
            }
        }

        // Apply filters if specified in query
        const filteredTasks = this.filterTasks(tasks, query);

        return {
            type: 'task',
            data: filteredTasks,
            metadata: { renderHtml: this.renderTasks(filteredTasks) }
        };
    }

    private async executeCalendarQuery(query: string, context?: any): Promise<QueryResult> {
        // Find all files with dates
        const events: any[] = [];
        
        if (!this.vault || !this.metadataCache) {
            return {
                type: 'calendar',
                data: events,
                metadata: { renderHtml: this.renderCalendar(events) }
            };
        }
        
        const files = this.vault.getMarkdownFiles();
        
        for (const file of files) {
            const metadata = this.metadataCache.getFileCache(file);
            if (metadata?.frontmatter?.date || metadata?.frontmatter?.dueDate) {
                events.push({
                    title: file.basename,
                    date: metadata.frontmatter.date || metadata.frontmatter.dueDate,
                    file: file.path
                });
            }
        }

        return {
            type: 'calendar',
            data: events,
            metadata: { renderHtml: this.renderCalendar(events) }
        };
    }

    private async executeCustomQuery(query: string, context?: any): Promise<QueryResult> {
        // Handle custom queries with basic pattern matching
        const files = this.vault.getMarkdownFiles();
        const results: any[] = [];
        
        for (const file of files) {
            const metadata = this.metadataCache.getFileCache(file);
            if (this.matchesQuery(file, metadata, query)) {
                results.push({
                    file: file.path,
                    title: file.basename
                });
            }
        }

        return {
            type: 'raw',
            data: results,
            metadata: { renderHtml: this.renderCustom(results) }
        };
    }

    private async getFilesFromSource(source: string, conditions?: string): Promise<TFile[]> {
        let files: TFile[] = [];
        
        if (!this.vault) {
            return files;
        }
        
        if (source === '' || source === '#' || source === '/') {
            // All files in vault
            files = this.vault.getMarkdownFiles();
        } else if (source.startsWith('#')) {
            // Files with tag
            const tag = source.substring(1);
            files = this.getFilesWithTag(tag);
        } else {
            // Files in folder - check both exact match and folder contains file
            const allFiles = this.vault.getMarkdownFiles();
            files = allFiles.filter(file => {
                return file.path.startsWith(source) || file.path.includes(source);
            });
            
            // If no files found with folder logic, try direct folder lookup
            if (files.length === 0) {
                const folder = this.vault.getAbstractFileByPath(source);
                if (folder instanceof TFolder) {
                    files = this.getFilesInFolder(folder);
                }
            }
        }

        // Apply conditions if present
        if (conditions) {
            files = await this.filterFiles(files, conditions);
        }

        return files;
    }

    private getFilesWithTag(tag: string): TFile[] {
        const files: TFile[] = [];
        
        if (!this.vault || !this.metadataCache) {
            return files;
        }
        
        const allFiles = this.vault.getMarkdownFiles();
        
        for (const file of allFiles) {
            const metadata = this.metadataCache.getFileCache(file);
            if (metadata?.tags?.some(t => t.tag === `#${tag}`)) {
                files.push(file);
            }
        }
        
        return files;
    }

    private getFilesInFolder(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        
        const traverse = (abstractFile: TFolder) => {
            for (const child of abstractFile.children) {
                if (child instanceof TFile && child.extension === 'md') {
                    files.push(child);
                } else if (child instanceof TFolder) {
                    traverse(child);
                }
            }
        };
        
        traverse(folder);
        return files;
    }

    private async filterFiles(files: TFile[], conditions: string): Promise<TFile[]> {
        // Simple condition parsing for common patterns
        const filtered: TFile[] = [];
        
        for (const file of files) {
            const metadata = this.metadataCache.getFileCache(file);
            if (await this.evaluateCondition(file, metadata, conditions)) {
                filtered.push(file);
            }
        }
        
        return filtered;
    }

    private async evaluateCondition(file: TFile, metadata: any, condition: string): Promise<boolean> {
        // Basic condition evaluation
        // Support patterns like: "status = 'active'", "priority > 3", etc.
        
        const comparisonRegex = /(\w+)\s*(=|!=|>|<|>=|<=)\s*['"]?([^'"]+)['"]?/;
        const match = condition.match(comparisonRegex);
        
        if (!match) return true;
        
        const [, property, operator, value] = match;
        const actualValue = await this.extractProperty(file, metadata, property);
        
        return this.compareValues(actualValue, operator, value);
    }

    private compareValues(actual: any, operator: string, expected: string): boolean {
        switch (operator) {
            case '=':
            case '==':
                return String(actual) === expected;
            case '!=':
                return String(actual) !== expected;
            case '>':
                return Number(actual) > Number(expected);
            case '<':
                return Number(actual) < Number(expected);
            case '>=':
                return Number(actual) >= Number(expected);
            case '<=':
                return Number(actual) <= Number(expected);
            default:
                return false;
        }
    }

    private async extractProperty(file: TFile, metadata: any, property: string): Promise<any> {
        // Extract property from file or metadata
        const lowerProp = property.toLowerCase();
        
        switch (lowerProp) {
            case 'file.name':
            case 'name':
                return file.basename;
            case 'file.path':
            case 'path':
                return file.path;
            case 'file.size':
            case 'size':
                return file.stat.size;
            case 'file.mtime':
            case 'modified':
                return file.stat.mtime;
            case 'file.ctime':
            case 'created':
                return file.stat.ctime;
            default:
                // Check frontmatter
                if (metadata?.frontmatter?.[property]) {
                    return metadata.frontmatter[property];
                }
                return ''; // Return empty string instead of null for better compatibility
        }
    }

    private filterTasks(tasks: any[], query: string): any[] {
        // Filter tasks based on query parameters
        if (query.includes('not done')) {
            return tasks.filter(t => t.status !== 'completed');
        } else if (query.includes('done')) {
            return tasks.filter(t => t.status === 'completed');
        }
        // By default, return only incomplete tasks
        return tasks.filter(t => t.status !== 'completed');
    }

    private matchesQuery(file: TFile, metadata: any, query: string): boolean {
        // Basic pattern matching for custom queries
        const searchTerm = query.toLowerCase();
        
        // Check filename
        if (file.basename.toLowerCase().includes(searchTerm)) {
            return true;
        }
        
        // Check tags
        if (metadata?.tags?.some((t: any) => t.tag.toLowerCase().includes(searchTerm))) {
            return true;
        }
        
        // Check frontmatter
        if (metadata?.frontmatter) {
            for (const value of Object.values(metadata.frontmatter)) {
                if (String(value).toLowerCase().includes(searchTerm)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // Rendering methods for different query types
    private renderTable(headers: string[], rows: any[]): string {
        let html = '<table class="exo-native-table"><thead><tr>';
        
        for (const header of headers) {
            html += `<th>${header}</th>`;
        }
        
        html += '</tr></thead><tbody>';
        
        for (const row of rows) {
            html += '<tr>';
            for (const header of headers) {
                html += `<td>${row[header] || ''}</td>`;
            }
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        return html;
    }

    private renderList(items: any[]): string {
        let html = '<ul class="exo-native-list">';
        
        for (const item of items) {
            html += `<li>${item.link || item.text}</li>`;
        }
        
        html += '</ul>';
        return html;
    }

    private renderTasks(tasks: any[]): string {
        let html = '<div class="exo-native-tasks">';
        
        for (const task of tasks) {
            const checked = task.status === 'completed' ? 'checked' : '';
            html += `
                <div class="task-item">
                    <input type="checkbox" ${checked} disabled>
                    <span>${task.text}</span>
                    <small>(${task.file})</small>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    private renderCalendar(events: any[]): string {
        let html = '<div class="exo-native-calendar">';
        
        // Sort events by date
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        for (const event of events) {
            html += `
                <div class="calendar-event">
                    <span class="event-date">${event.date}</span>
                    <span class="event-title">${event.title}</span>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    private renderCustom(results: any[]): string {
        let html = '<div class="exo-native-custom">';
        
        for (const result of results) {
            html += `<div class="custom-result">[[${result.file}|${result.title}]]</div>`;
        }
        
        html += '</div>';
        return html;
    }

    // Cache management
    private getCachedResult(query: string): QueryResult | null {
        const cached = this.queryCache.get(query);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.result;
        }
        
        return null;
    }

    private cacheResult(query: string, result: QueryResult): void {
        this.queryCache.set(query, {
            result,
            timestamp: Date.now()
        });
        
        // Clean old cache entries
        if (this.queryCache.size > 100) {
            const oldestKey = this.queryCache.keys().next().value;
            this.queryCache.delete(oldestKey);
        }
    }

    /**
     * Executes a query and renders the result to a container
     */
    async renderQuery(
        container: HTMLElement,
        query: string,
        context?: QueryContext
    ): Promise<Result<void>> {
        try {
            const result = await this.executeQuery(query, context);
            if (!result.isSuccess) {
                return Result.fail(result.getErrorMessage());
            }

            const queryResult = result.getValue();
            if (queryResult?.metadata?.renderHtml) {
                container.innerHTML = queryResult.metadata.renderHtml;
            } else {
                // Fallback rendering
                container.innerHTML = this.renderFallback(queryResult);
            }

            return Result.ok();
        } catch (error) {
            return Result.fail(`Failed to render query: ${error.message}`);
        }
    }

    /**
     * Gets pages/files matching the given source expression
     */
    async getPages(source: string): Promise<Result<any[]>> {
        try {
            const cleanSource = source.replace(/['"]/g, ''); // Remove quotes
            const files = await this.getFilesFromSource(cleanSource);
            const pages = await Promise.all(files.map(async file => {
                const metadata = this.metadataCache?.getFileCache(file);
                return {
                    file: {
                        path: file.path,
                        name: file.basename,
                        size: file.stat.size,
                        mtime: file.stat.mtime,
                        ctime: file.stat.ctime
                    },
                    ...metadata?.frontmatter
                };
            }));

            return Result.ok(pages);
        } catch (error) {
            return Result.fail(`Failed to get pages: ${error.message}`);
        }
    }

    /**
     * Gets metadata for a specific page/file
     */
    async getPageMetadata(path: string): Promise<Result<Record<string, any>>> {
        try {
            const file = this.vault.getAbstractFileByPath(path);
            if (!file || !(file instanceof TFile)) {
                return Result.fail(`File not found: ${path}`);
            }

            const metadata = this.metadataCache.getFileCache(file);
            const result = {
                file: {
                    path: file.path,
                    name: file.basename,
                    size: file.stat.size,
                    mtime: file.stat.mtime,
                    ctime: file.stat.ctime,
                    extension: file.extension
                },
                frontmatter: metadata?.frontmatter || {},
                tags: metadata?.tags?.map(t => t.tag) || [],
                links: metadata?.links?.map(l => l.link) || [],
                headings: metadata?.headings?.map(h => ({ level: h.level, heading: h.heading })) || []
            };

            return Result.ok(result);
        } catch (error) {
            return Result.fail(`Failed to get page metadata: ${error.message}`);
        }
    }

    /**
     * Validates if a query string is syntactically correct
     */
    validateQuery(query: string): Result<boolean> {
        try {
            if (!query || typeof query !== 'string') {
                return Result.fail('Query must be a non-empty string');
            }

            const trimmed = query.trim();
            if (trimmed.length === 0) {
                return Result.fail('Query cannot be empty');
            }

            // Basic validation - check for dangerous patterns
            const dangerousPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+\s*=/i
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(trimmed)) {
                    return Result.fail('Query contains potentially unsafe content');
                }
            }

            // Check for valid query keywords
            const lowerQuery = trimmed.toLowerCase();
            const validKeywords = ['table', 'list', 'task', 'calendar'];
            const hasValidKeyword = validKeywords.some(keyword => lowerQuery.startsWith(keyword));
            
            if (!hasValidKeyword) {
                return Result.fail('Query must start with a valid keyword (table, list, task, calendar)');
            }

            return Result.ok(true);
        } catch (error) {
            return Result.fail(`Query validation failed: ${error.message}`);
        }
    }

    private renderFallback(queryResult: QueryResult | null): string {
        if (!queryResult || !queryResult.data) {
            return '<div class="exo-native-empty">No results found</div>';
        }

        const items = Array.isArray(queryResult.data) ? queryResult.data : [queryResult.data];
        return `
            <div class="exo-native-fallback">
                ${items.map(item => `<div class="result-item">${JSON.stringify(item)}</div>`).join('')}
            </div>
        `;
    }

    /**
     * Clear the query cache
     */
    public clearCache(): void {
        this.queryCache.clear();
    }

    /**
     * Clear all caches (alias for compatibility)
     */
    public clearCaches(): void {
        this.queryCache.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { queryCache: number; metadataCache: number } {
        return {
            queryCache: this.queryCache.size,
            metadataCache: 0 // Metadata cache is managed by Obsidian
        };
    }
}