import React from "react";
import { TFile, Notice } from "obsidian";
import { canRenameToUid } from "../../domain/commands/CommandVisibility";

interface RenameToUidButtonProps {
  file: TFile;
  metadata: Record<string, any>;
  onRename: () => Promise<void>;
}

export const RenameToUidButton: React.FC<RenameToUidButtonProps> = ({
  file,
  metadata,
  onRename,
}) => {
  const context = {
    instanceClass: metadata.exo__Instance_class || null,
    currentStatus: metadata.ems__Effort_status || null,
    metadata,
    isArchived: metadata.archived ?? metadata.exo__Asset_isArchived ?? false,
    currentFolder: file.parent?.path || "",
    expectedFolder: null,
  };

  const visible = canRenameToUid(context, file.basename);

  if (!visible) {
    return null;
  }

  const handleClick = async () => {
    try {
      await onRename();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to rename: ${errorMessage}`);
      console.error("Rename to UID error:", error);
    }
  };

  return (
    <button
      className="exocortex-button exocortex-button-rename-to-uid"
      onClick={handleClick}
      type="button"
    >
      Rename to UID
    </button>
  );
};
