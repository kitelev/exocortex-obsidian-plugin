import React from "react";
import { TFile } from "obsidian";
import { canArchiveTask, CommandVisibilityContext } from "../../domain/commands/CommandVisibility";

export interface ArchiveTaskButtonProps {
  instanceClass: string | string[] | null;
  currentStatus: string | string[] | null;
  isArchived: boolean | string | number | null;
  sourceFile: TFile;
  onArchive: () => Promise<void>;
}

export const ArchiveTaskButton: React.FC<ArchiveTaskButtonProps> = ({
  instanceClass,
  currentStatus,
  isArchived,
  sourceFile,
  onArchive,
}) => {
  // Use centralized visibility logic from CommandVisibility
  const shouldShowButton = React.useMemo(() => {
    const context: CommandVisibilityContext = {
      instanceClass,
      currentStatus,
      metadata: {},
      isArchived: isArchived ?? false,
      currentFolder: sourceFile.parent?.path || "",
      expectedFolder: null,
    };
    return canArchiveTask(context);
  }, [instanceClass, currentStatus, isArchived, sourceFile]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onArchive();
  };

  if (!shouldShowButton) {
    return null;
  }

  return (
    <div className="exocortex-archive-task-section">
      <button
        className="exocortex-archive-task-btn"
        onClick={handleClick}
        type="button"
      >
        To Archive
      </button>
    </div>
  );
};
