import React from "react";
import { TFile } from "obsidian";

export interface RepairFolderButtonProps {
  sourceFile: TFile;
  currentFolder: string;
  expectedFolder: string | null;
  onRepair: () => Promise<void>;
}

export const RepairFolderButton: React.FC<RepairFolderButtonProps> = ({
  currentFolder,
  expectedFolder,
  onRepair,
}) => {
  const needsRepair = React.useMemo(() => {
    if (!expectedFolder) return false;

    // Normalize paths for comparison (remove trailing slashes)
    const normalizedCurrent = currentFolder.replace(/\/$/, "");
    const normalizedExpected = expectedFolder.replace(/\/$/, "");

    return normalizedCurrent !== normalizedExpected;
  }, [currentFolder, expectedFolder]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onRepair();
  };

  if (!needsRepair) {
    return null;
  }

  return (
    <div className="exocortex-repair-folder-section">
      <button
        className="exocortex-repair-folder-btn"
        onClick={handleClick}
        type="button"
        title={`Move to ${expectedFolder}`}
      >
        Repair Folder
      </button>
    </div>
  );
};
