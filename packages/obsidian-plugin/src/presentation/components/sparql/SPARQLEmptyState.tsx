import React from "react";

export interface SPARQLEmptyStateProps {
  queryString?: string;
}

const getQueryType = (query: string): string => {
  const upperQuery = query.toUpperCase().trim();
  if (upperQuery.startsWith("SELECT")) return "SELECT";
  if (upperQuery.startsWith("CONSTRUCT")) return "CONSTRUCT";
  if (upperQuery.startsWith("ASK")) return "ASK";
  if (upperQuery.startsWith("DESCRIBE")) return "DESCRIBE";
  return "query";
};

export const SPARQLEmptyState: React.FC<SPARQLEmptyStateProps> = ({ queryString }) => {
  const queryType = queryString ? getQueryType(queryString) : "query";

  return (
    <div className="sparql-empty-state">
      <div className="sparql-empty-icon">📭</div>
      <h3 className="sparql-empty-title">no results found</h3>
      <p className="sparql-empty-message">
        your {queryType} query returned no matching data
      </p>

      <div className="sparql-empty-hints">
        <h4>suggestions:</h4>
        <ul>
          <li>verify that your vault contains notes with matching properties</li>
          <li>check your WHERE clause conditions</li>
          <li>try broadening your filter criteria</li>
          <li>ensure property names match your note frontmatter (e.g., exo__Asset_label, ems__Task)</li>
        </ul>
      </div>

      <div className="sparql-empty-example">
        <strong>example query:</strong>
        <pre>
SELECT ?task ?label{"\n"}
WHERE {"{"}
{"\n"}  ?task &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt; &lt;ems__Task&gt; .{"\n"}
  ?task &lt;exo__Asset_label&gt; ?label .{"\n"}
{"}"}
        </pre>
      </div>
    </div>
  );
};
