import React from "react";
import { TFile } from "obsidian";

export interface CleanEmptyPropertiesButtonProps {
  sourceFile: TFile;
  metadata: Record<string, any>;
  onCleanup: () => Promise<void>;
}

export const CleanEmptyPropertiesButton: React.FC<
  CleanEmptyPropertiesButtonProps
> = ({ metadata, onCleanup }) => {
  const hasEmptyProperties = React.useMemo(() => {
    if (!metadata || Object.keys(metadata).length === 0) return false;

    return Object.values(metadata).some((value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === "string" && value.trim() === "") return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      )
        return true;
      return false;
    });
  }, [metadata]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onCleanup();
  };

  if (!hasEmptyProperties) {
    return null;
  }

  return (
    <div className="exocortex-clean-properties-section">
      <button
        className="exocortex-clean-properties-btn"
        onClick={handleClick}
        type="button"
      >
        Clean Empty Properties
      </button>
    </div>
  );
};
