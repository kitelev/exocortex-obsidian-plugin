import React from "react";
import { TFile } from "obsidian";

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
  onArchive,
}) => {
  const isTask = React.useMemo(() => {
    if (!instanceClass) return false;
    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    return classes.some((cls) => {
      const cleanClass = cls.replace(/\[\[|\]\]/g, "").trim();
      return cleanClass === "ems__Task";
    });
  }, [instanceClass]);

  const isDone = React.useMemo(() => {
    if (!currentStatus) return false;
    const statusValue = Array.isArray(currentStatus)
      ? currentStatus[0]
      : currentStatus;
    if (!statusValue) return false;
    const cleanStatus = statusValue.replace(/\[\[|\]\]/g, "").trim();
    return cleanStatus === "ems__EffortStatusDone";
  }, [currentStatus]);

  const archived = React.useMemo(() => {
    if (isArchived === true || isArchived === 1) return true;
    if (typeof isArchived === "string") {
      const lower = isArchived.toLowerCase().trim();
      return lower === "true" || lower === "yes" || lower === "1";
    }
    return false;
  }, [isArchived]);

  const shouldShowButton = React.useMemo(() => {
    return isTask && isDone && !archived;
  }, [isTask, isDone, archived]);

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
