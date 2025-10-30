import React, { useState, useMemo } from "react";

export interface DailyProject {
  file: {
    path: string;
    basename: string;
  };
  path: string;
  title: string;
  label: string;
  startTime: string;
  endTime: string;
  status: string;
  metadata: Record<string, unknown>;
  isDone: boolean;
  isTrashed: boolean;
  isBlocked: boolean;
}

export interface DailyProjectsTableProps {
  projects: DailyProject[];
  onProjectClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

interface SortState {
  column: string | null;
  order: "asc" | "desc" | null;
}

export const DailyProjectsTable: React.FC<DailyProjectsTableProps> = ({
  projects,
  onProjectClick,
  getAssetLabel,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    order: null,
  });

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column !== column) {
        // First click on a new column: ascending
        return { column, order: "asc" };
      }
      if (prev.order === "asc") {
        // Second click: descending
        return { column, order: "desc" };
      }
      if (prev.order === "desc") {
        // Third click: reset sorting
        return { column: null, order: null };
      }
      // Default to ascending
      return { column, order: "asc" };
    });
  };
  interface WikiLink {
    target: string;
    alias?: string;
  }

  const parseWikiLink = (value: string): WikiLink => {
    const content = value.replace(/^\[\[|\]\]$/g, "");

    const pipeIndex = content.indexOf("|");

    if (pipeIndex !== -1) {
      return {
        target: content.substring(0, pipeIndex).trim(),
        alias: content.substring(pipeIndex + 1).trim(),
      };
    }

    return {
      target: content.trim(),
    };
  };

  const getDisplayName = (project: DailyProject): string => {
    const blockerIcon = project.isBlocked ? "🚩 " : "";
    const icon = project.isDone ? "✅ " : project.isTrashed ? "❌ " : "📦 ";

    let displayText = project.label || project.title;

    if (typeof getAssetLabel === "function") {
      const customLabel = getAssetLabel(project.path);
      if (
        customLabel !== null &&
        customLabel !== undefined &&
        customLabel !== ""
      ) {
        displayText = customLabel;
      }
    }

    return blockerIcon + icon + displayText;
  };

  const sortedProjects = useMemo(() => {
    if (!sortState.column || !sortState.order) {
      return projects;
    }

    return [...projects].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortState.column === "name") {
        aVal = getDisplayName(a).toLowerCase();
        bVal = getDisplayName(b).toLowerCase();
      } else if (sortState.column === "startTime") {
        aVal = a.startTime || "";
        bVal = b.startTime || "";
      } else if (sortState.column === "endTime") {
        aVal = a.endTime || "";
        bVal = b.endTime || "";
      } else if (sortState.column === "status") {
        // Extract text from wiki-link status
        const getStatusText = (status: string): string => {
          if (!status) return "";
          if (/\[\[.*?\]\]/.test(status)) {
            const content = status.replace(/^\[\[|\]\]$/g, "");
            const pipeIndex = content.indexOf("|");
            return pipeIndex !== -1
              ? content.substring(pipeIndex + 1).trim()
              : content.trim();
          }
          return status;
        };
        aVal = getStatusText(a.status).toLowerCase();
        bVal = getStatusText(b.status).toLowerCase();
      }

      // Handle null/undefined values
      if (!aVal && aVal !== 0) return 1;
      if (!bVal && bVal !== 0) return -1;

      // Compare values
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortState.order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.order === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [projects, sortState, getAssetLabel]);

  return (
    <div className="exocortex-daily-projects">
      <table className="exocortex-projects-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("name")} className="sortable">
              Name{" "}
              {sortState.column === "name" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("startTime")} className="sortable">
              Start{" "}
              {sortState.column === "startTime" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("endTime")} className="sortable">
              End{" "}
              {sortState.column === "endTime" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("status")} className="sortable">
              Status{" "}
              {sortState.column === "status" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedProjects.map((project, index) => (
            <tr key={`${project.path}-${index}`} data-path={project.path}>
              <td className="project-name">
                <a
                  data-href={project.path}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onProjectClick?.(project.path, e);
                  }}
                  className="internal-link"
                  style={{ cursor: "pointer" }}
                >
                  {getDisplayName(project)}
                </a>
              </td>
              <td className="project-start">{project.startTime || "-"}</td>
              <td className="project-end">{project.endTime || "-"}</td>
              <td className="project-status">
                {project.status
                  ? (() => {
                      const isWikiLink =
                        typeof project.status === "string" &&
                        /\[\[.*?\]\]/.test(project.status);
                      const parsed = isWikiLink
                        ? parseWikiLink(project.status)
                        : { target: project.status };
                      const displayText = parsed.alias || parsed.target;

                      return (
                        <a
                          data-href={parsed.target}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onProjectClick?.(parsed.target, e);
                          }}
                          className="internal-link"
                          style={{ cursor: "pointer" }}
                        >
                          {displayText}
                        </a>
                      );
                    })()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
