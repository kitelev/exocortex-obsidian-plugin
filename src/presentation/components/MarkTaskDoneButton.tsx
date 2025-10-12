import React from "react";
import { TFile } from "obsidian";

export interface MarkTaskDoneButtonProps {
  instanceClass: string | string[] | null;
  currentStatus: string | string[] | null;
  sourceFile: TFile;
  onMarkDone: () => Promise<void>;
}

export const MarkTaskDoneButton: React.FC<MarkTaskDoneButtonProps> = ({
  instanceClass,
  currentStatus,
  onMarkDone,
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

  const shouldShowButton = React.useMemo(() => {
    if (!isTask) return false;

    if (!currentStatus) return true;

    const statusValue = Array.isArray(currentStatus)
      ? currentStatus[0]
      : currentStatus;
    if (!statusValue) return true;

    const cleanStatus = statusValue.replace(/\[\[|\]\]/g, "").trim();
    return cleanStatus !== "ems__EffortStatusDone";
  }, [isTask, currentStatus]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onMarkDone();
  };

  if (!shouldShowButton) {
    return null;
  }

  return (
    <div className="exocortex-mark-done-section">
      <button
        className="exocortex-mark-done-btn"
        onClick={handleClick}
        type="button"
      >
        Done
      </button>
    </div>
  );
};
