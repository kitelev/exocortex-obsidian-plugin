export enum QueryType {
    SELECT = 'SELECT',
    CONSTRUCT = 'CONSTRUCT',
    ASK = 'ASK',
    DESCRIBE = 'DESCRIBE',
    INSERT = 'INSERT',
    DELETE = 'DELETE'
}

export enum ClauseType {
    SELECT = 'SELECT',
    WHERE = 'WHERE',
    FILTER = 'FILTER',
    OPTIONAL = 'OPTIONAL',
    UNION = 'UNION',
    ORDER_BY = 'ORDER_BY',
    GROUP_BY = 'GROUP_BY',
    LIMIT = 'LIMIT',
    OFFSET = 'OFFSET',
    PREFIX = 'PREFIX'
}

export interface QueryClause {
    type: ClauseType;
    startPosition: number;
    endPosition: number;
    variables: string[];
    content: string;
}

export class QueryContext {
    constructor(
        private readonly query: string,
        private readonly cursorPosition: number,
        private readonly currentToken: string,
        private readonly previousTokens: string[],
        private readonly queryType: QueryType | null,
        private readonly currentClause: ClauseType | null,
        private readonly clauses: QueryClause[]
    ) {
        Object.freeze(this);
    }

    getQuery(): string {
        return this.query;
    }

    getCursorPosition(): number {
        return this.cursorPosition;
    }

    getCurrentToken(): string {
        return this.currentToken;
    }

    getPreviousTokens(): string[] {
        return [...this.previousTokens];
    }

    getQueryType(): QueryType | null {
        return this.queryType;
    }

    getCurrentClause(): ClauseType | null {
        return this.currentClause;
    }

    getClauses(): QueryClause[] {
        return [...this.clauses];
    }

    isInClause(clauseType: ClauseType): boolean {
        return this.currentClause === clauseType;
    }

    isAfterClause(clauseType: ClauseType): boolean {
        const clauseIndex = this.clauses.findIndex(c => c.type === clauseType);
        if (clauseIndex === -1) return false;
        
        const clause = this.clauses[clauseIndex];
        return this.cursorPosition > clause.endPosition;
    }

    getVariablesInScope(): string[] {
        const variables = new Set<string>();
        
        for (const clause of this.clauses) {
            if (clause.endPosition < this.cursorPosition) {
                clause.variables.forEach(v => variables.add(v));
            }
        }
        
        return Array.from(variables);
    }

    isStartOfQuery(): boolean {
        const trimmedQuery = this.query.substring(0, this.cursorPosition).trim();
        return trimmedQuery.length === 0 || trimmedQuery.length === this.currentToken.length;
    }

    static create(params: {
        query: string;
        cursorPosition: number;
        currentToken?: string;
        previousTokens?: string[];
        queryType?: QueryType | null;
        currentClause?: ClauseType | null;
        clauses?: QueryClause[];
    }): QueryContext {
        return new QueryContext(
            params.query,
            params.cursorPosition,
            params.currentToken || '',
            params.previousTokens || [],
            params.queryType || null,
            params.currentClause || null,
            params.clauses || []
        );
    }
}