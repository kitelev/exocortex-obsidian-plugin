import React from "react";
import { TFile } from "obsidian";

export interface StartEffortButtonProps {
  instanceClass: string | string[] | null;
  currentStatus: string | string[] | null;
  sourceFile: TFile;
  onStartEffort: () => Promise<void>;
}

export const StartEffortButton: React.FC<StartEffortButtonProps> = ({
  instanceClass,
  currentStatus,
  onStartEffort,
}) => {
  const isEffort = React.useMemo(() => {
    if (!instanceClass) return false;

    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];

    return classes.some((cls) => {
      const cleanClass = cls.replace(/\[\[|\]\]/g, "").trim();
      return cleanClass === "ems__Task" || cleanClass === "ems__Project";
    });
  }, [instanceClass]);

  const shouldShowButton = React.useMemo(() => {
    if (!isEffort) return false;

    // Don't show if no status (undefined/null) - show button for efforts without status
    // Don't show if status is Doing or Done
    if (!currentStatus) return true;

    const statuses = Array.isArray(currentStatus)
      ? currentStatus
      : [currentStatus];

    const hasDoingOrDone = statuses.some((status) => {
      const cleanStatus = status.replace(/\[\[|\]\]/g, "").trim();
      return (
        cleanStatus === "ems__EffortStatusDoing" ||
        cleanStatus === "ems__EffortStatusDone"
      );
    });

    return !hasDoingOrDone;
  }, [isEffort, currentStatus]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onStartEffort();
  };

  if (!shouldShowButton) {
    return null;
  }

  return (
    <div className="exocortex-start-effort-section">
      <button
        className="exocortex-start-effort-btn"
        onClick={handleClick}
        type="button"
      >
        Start Effort
      </button>
    </div>
  );
};
