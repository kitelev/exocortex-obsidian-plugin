import React from "react";
import { TFile } from "obsidian";

export interface CreateTaskButtonProps {
  instanceClass: string | null;
  metadata: Record<string, any>;
  sourceFile: TFile;
  onTaskCreate: (fileName: string, frontmatter: Record<string, any>) => Promise<void>;
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

    // Generate timestamp for filename and frontmatter
    const now = new Date();
    const timestamp = now.toISOString().split('.')[0]; // "2025-10-04T15:30:45"
    const fileTimestamp = timestamp.replace(/:/g, '-'); // "2025-10-04T15-30-45"
    const fileName = `Task-${fileTimestamp}.md`;

    // Generate UUID (will be done by service, but we need to import it)
    const { v4: uuidv4 } = await import('uuid');

    // Build frontmatter for new task
    const taskFrontmatter: Record<string, any> = {
      exo__Instance_class: "[[ems__Task]]",
      exo__Asset_isDefinedBy: metadata.exo__Asset_isDefinedBy || "",
      exo__Asset_uid: uuidv4(),
      exo__Asset_createdAt: timestamp,
      exo__Effort_area: `[[${sourceFile.basename}]]`,
    };

    // Call the callback to create the file
    await onTaskCreate(fileName, taskFrontmatter);
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
