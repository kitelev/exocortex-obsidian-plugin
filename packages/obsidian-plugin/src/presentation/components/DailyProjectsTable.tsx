import React, { useState, useMemo } from "react";

interface SortState {
  column: string;
  order: "asc" | "desc";
}

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

export const DailyProjectsTable: React.FC<DailyProjectsTableProps> = ({
  projects,
  onProjectClick,
  getAssetLabel,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: "",
    order: "asc",
  });

  const handleSort = (column: string) => {
    setSortState((prev) => ({
      column,
      order: prev.column === column && prev.order === "asc" ? "desc" : "asc",
    }));
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
    if (!sortState.column) {
      return projects;
    }

    const sorted = [...projects];

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortState.column) {
        case "name":
          aValue = getDisplayName(a).toLowerCase();
          bValue = getDisplayName(b).toLowerCase();
          break;
        case "start":
          aValue = a.startTime || "";
          bValue = b.startTime || "";
          break;
        case "end":
          aValue = a.endTime || "";
          bValue = b.endTime || "";
          break;
        case "status":
          aValue = a.status?.toLowerCase() || "";
          bValue = b.status?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortState.order === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortState.order === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [projects, sortState, getAssetLabel]);

  return (
    <div className="exocortex-daily-projects">
      <table className="exocortex-projects-table">
        <thead>
          <tr>
            <th
              onClick={() => handleSort("name")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              Name{" "}
              {sortState.column === "name" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("start")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              Start{" "}
              {sortState.column === "start" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("end")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              End{" "}
              {sortState.column === "end" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("status")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
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
