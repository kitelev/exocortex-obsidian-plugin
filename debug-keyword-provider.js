// Simple debug script to test KeywordSuggestionProvider behavior
const { KeywordSuggestionProvider } = require('./src/infrastructure/autocomplete/KeywordSuggestionProvider');
const { QueryContext, ClauseType, QueryType } = require('./src/domain/autocomplete/QueryContext');

console.log('Testing KeywordSuggestionProvider...');

// Test the problematic case
const provider = new KeywordSuggestionProvider();

const context = QueryContext.create({
    query: 'SELECT * WHERE { ?s ?p ?o } ',
    cursorPosition: 30,
    currentToken: '',
    previousTokens: ['SELECT', '*', 'WHERE', '{', '?s', '?p', '?o', '}'],
    queryType: QueryType.SELECT,
    currentClause: null,
    clauses: [{
        type: ClauseType.WHERE,
        startPosition: 9,
        endPosition: 29,
        variables: ['s', 'p', 'o'],
        content: 'WHERE { ?s ?p ?o }'
    }]
});

console.log('Context:', {
    query: context.getQuery(),
    cursorPosition: context.getCursorPosition(),
    queryType: context.getQueryType(),
    currentClause: context.getCurrentClause(),
    clauses: context.getClauses(),
    isAfterWhere: context.isAfterClause(ClauseType.WHERE)
});

const suggestions = provider.getSuggestions(context);
console.log('Suggestions:', suggestions.map(s => ({ 
    text: s.getText(), 
    contextualScore: s.getContextualScore() 
})));