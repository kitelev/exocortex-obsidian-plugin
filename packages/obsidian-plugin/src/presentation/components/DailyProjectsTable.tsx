import React from "react";

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

    return icon + displayText;
  };

  return (
    <div className="exocortex-daily-projects">
      <table className="exocortex-projects-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
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
