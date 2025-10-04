import React from "react";
import { TFile } from "obsidian";

export interface CreateTaskButtonProps {
  instanceClass: string | null;
  metadata: Record<string, any>;
  sourceFile: TFile;
  onTaskCreate: () => Promise<void>;
}

export const CreateTaskButton: React.FC<CreateTaskButtonProps> = ({
  instanceClass,
  metadata,
  sourceFile,
  onTaskCreate,
}) => {
  // Only show button for ems__Area assets
  const shouldShowButton = React.useMemo(() => {
    if (!instanceClass) return false;

    // Handle both [[ems__Area]] and ems__Area formats
    const cleanClass = instanceClass.replace(/\[\[|\]\]/g, "").trim();
    return cleanClass === "ems__Area";
  }, [instanceClass]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Call the callback to create the file
    // The service will handle all the details
    await onTaskCreate();
  };

  if (!shouldShowButton) {
    return null;
  }

  return (
    <div className="exocortex-create-task-section">
      <button
        className="exocortex-create-task-btn"
        onClick={handleClick}
        type="button"
      >
        Create Task
      </button>
    </div>
  );
};
