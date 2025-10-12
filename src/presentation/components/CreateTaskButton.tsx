import React from "react";
import { TFile } from "obsidian";

export interface CreateTaskButtonProps {
  instanceClass: string | string[] | null;
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
  // Only show button for ems__Area and ems__Project assets
  const shouldShowButton = React.useMemo(() => {
    if (!instanceClass) return false;

    // Normalize to array for consistent handling
    const classes = Array.isArray(instanceClass) ? instanceClass : [instanceClass];

    // Check if any class matches ems__Area or ems__Project
    const supportedClasses = ["ems__Area", "ems__Project"];
    return classes.some((cls) => {
      const cleanClass = cls.replace(/\[\[|\]\]/g, "").trim();
      return supportedClasses.includes(cleanClass);
    });
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
