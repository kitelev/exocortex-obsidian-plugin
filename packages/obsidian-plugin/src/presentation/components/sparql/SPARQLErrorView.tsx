import React from "react";

export interface SPARQLError {
  message: string;
  line?: number;
  column?: number;
  queryString?: string;
}

export interface SPARQLErrorViewProps {
  error: SPARQLError;
}

const highlightErrorPosition = (
  queryString: string,
  line?: number,
  column?: number,
): { beforeError: string; errorChar: string; afterError: string } => {
  if (!line || !column) {
    return { beforeError: queryString, errorChar: "", afterError: "" };
  }

  const lines = queryString.split("\n");
  const errorLineIndex = line - 1;

  if (errorLineIndex < 0 || errorLineIndex >= lines.length) {
    return { beforeError: queryString, errorChar: "", afterError: "" };
  }

  const errorLine = lines[errorLineIndex];
  const errorColIndex = column - 1;

  if (errorColIndex < 0 || errorColIndex >= errorLine.length) {
    return { beforeError: queryString, errorChar: "", afterError: "" };
  }

  const beforeLines = lines.slice(0, errorLineIndex).join("\n");
  const beforeError = beforeLines + (beforeLines ? "\n" : "") + errorLine.slice(0, errorColIndex);
  const errorChar = errorLine[errorColIndex];
  const afterError = errorLine.slice(errorColIndex + 1) + "\n" + lines.slice(errorLineIndex + 1).join("\n");

  return { beforeError, errorChar, afterError };
};

export const SPARQLErrorView: React.FC<SPARQLErrorViewProps> = ({ error }) => {
  const isParseError = error.line !== undefined && error.column !== undefined;
  const highlighted = error.queryString
    ? highlightErrorPosition(error.queryString, error.line, error.column)
    : null;

  return (
    <div className="sparql-error-view">
      <div className="sparql-error-header">
        <span className="sparql-error-icon">⚠️</span>
        <h3 className="sparql-error-title">
          {isParseError ? "syntax error" : "query execution error"}
        </h3>
      </div>

      <div className="sparql-error-message">
        <strong>error:</strong> {error.message}
      </div>

      {isParseError && (
        <div className="sparql-error-position">
          at line {error.line}, column {error.column}
        </div>
      )}

      {highlighted && isParseError && (
        <div className="sparql-error-code">
          <pre className="sparql-error-query">
            {highlighted.beforeError}
            <span className="sparql-error-highlight">{highlighted.errorChar}</span>
            {highlighted.afterError}
          </pre>
        </div>
      )}

      <div className="sparql-error-hint">
        <strong>hint:</strong>{" "}
        {isParseError
          ? "check your SPARQL syntax. common issues: missing brackets, unclosed quotes, invalid keywords"
          : "verify your query logic, check triple store data, ensure proper variable bindings"}
      </div>
    </div>
  );
};
