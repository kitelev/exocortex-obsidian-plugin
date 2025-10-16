import React from "react";

export interface DailyTask {
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
  isMeeting: boolean;
}

export interface DailyTasksTableProps {
  tasks: DailyTask[];
  onTaskClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

export const DailyTasksTable: React.FC<DailyTasksTableProps> = ({
  tasks,
  onTaskClick,
  getAssetLabel,
}) => {
  const getDisplayName = (task: DailyTask): string => {
    const icon = task.isDone ? "✅ " : task.isTrashed ? "❌ " : task.isMeeting ? "👥 " : "";

    let displayText: string;
    if (typeof getAssetLabel === 'function') {
      const customLabel = getAssetLabel(task.path);
      if (customLabel !== null && customLabel !== undefined && customLabel !== "") {
        displayText = customLabel;
      } else if (customLabel === "") {
        displayText = "";
      } else {
        displayText = task.label || task.title;
      }
    } else {
      displayText = task.label || task.title;
    }

    return icon + displayText;
  };

  return (
    <div className="exocortex-daily-tasks">
      <table className="exocortex-tasks-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <tr key={`${task.path}-${index}`} data-path={task.path}>
              <td className="task-name">
                <a
                  data-href={task.path}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTaskClick?.(task.path, e);
                  }}
                  className="internal-link"
                  style={{ cursor: "pointer" }}
                >
                  {getDisplayName(task)}
                </a>
              </td>
              <td className="task-start">{task.startTime || "-"}</td>
              <td className="task-end">{task.endTime || "-"}</td>
              <td className="task-status">
                {task.status ? (
                  <a
                    data-href={task.status}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTaskClick?.(task.status, e);
                    }}
                    className="internal-link"
                    style={{ cursor: "pointer" }}
                  >
                    {task.status}
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
