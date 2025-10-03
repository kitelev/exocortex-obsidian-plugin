import React, { useMemo } from "react";

export interface ChildEffort {
  path: string;
  title: string;
  status?: string;
  priority?: string;
  effort?: number;
  progress?: number;
  metadata: Record<string, any>;
}

export interface ChildrenEffortsTableProps {
  children: ChildEffort[];
  showStatus?: boolean;
  showPriority?: boolean;
  showEffort?: boolean;
  showProgress?: boolean;
  onChildClick?: (path: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: "status-active",
  completed: "status-completed",
  blocked: "status-blocked",
  pending: "status-pending",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

export const ChildrenEffortsTable: React.FC<ChildrenEffortsTableProps> = ({
  children,
  showStatus = true,
  showPriority = true,
  showEffort = true,
  showProgress = true,
  onChildClick,
}) => {
  const totals = useMemo(() => {
    return children.reduce(
      (acc, child) => ({
        effort: acc.effort + (child.effort || 0),
        progress: acc.progress + (child.progress || 0),
      }),
      { effort: 0, progress: 0 },
    );
  }, [children]);

  const averageProgress =
    children.length > 0 ? totals.progress / children.length : 0;

  const renderStatusBadge = (status?: string) => {
    if (!status) return <span className="status-badge">-</span>;
    const colorClass = STATUS_COLORS[status.toLowerCase()] || "status-default";
    return <span className={`status-badge ${colorClass}`}>{status}</span>;
  };

  const renderPriorityBadge = (priority?: string) => {
    if (!priority) return <span className="priority-badge">-</span>;
    const colorClass =
      PRIORITY_COLORS[priority.toLowerCase()] || "priority-default";
    return <span className={`priority-badge ${colorClass}`}>{priority}</span>;
  };

  const renderProgressBar = (progress?: number) => {
    if (progress === undefined) return <span>-</span>;
    return (
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}>
          <span className="progress-text">{progress}%</span>
        </div>
      </div>
    );
  };

  if (children.length === 0) {
    return <div className="no-children">No child efforts found</div>;
  }

  return (
    <div className="exocortex-children-efforts">
      <table className="children-efforts-table">
        <thead>
          <tr>
            <th>Title</th>
            {showStatus && <th>Status</th>}
            {showPriority && <th>Priority</th>}
            {showEffort && <th>Effort</th>}
            {showProgress && <th>Progress</th>}
          </tr>
        </thead>
        <tbody>
          {children.map((child) => (
            <tr key={child.path} data-path={child.path}>
              <td>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onChildClick?.(child.path);
                  }}
                  className="internal-link"
                >
                  {child.title}
                </a>
              </td>
              {showStatus && <td>{renderStatusBadge(child.status)}</td>}
              {showPriority && <td>{renderPriorityBadge(child.priority)}</td>}
              {showEffort && <td>{child.effort || "-"}</td>}
              {showProgress && <td>{renderProgressBar(child.progress)}</td>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td>
              <strong>Totals ({children.length} items)</strong>
            </td>
            {showStatus && <td>-</td>}
            {showPriority && <td>-</td>}
            {showEffort && (
              <td>
                <strong>{totals.effort}</strong>
              </td>
            )}
            {showProgress && (
              <td>
                <strong>{averageProgress.toFixed(1)}%</strong>
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
