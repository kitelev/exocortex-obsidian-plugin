import React from "react";
import { TFile } from "obsidian";
import { canCreateChildArea, CommandVisibilityContext } from "../../domain/commands/CommandVisibility";

export interface QuickCreateAreaButtonProps {
  instanceClass: string | string[] | null;
  metadata: Record<string, any>;
  sourceFile: TFile;
  onAreaCreate: () => Promise<void>;
}

export const QuickCreateAreaButton: React.FC<QuickCreateAreaButtonProps> = ({
  instanceClass,
  metadata,
  sourceFile,
  onAreaCreate,
}) => {
  const shouldShowButton = React.useMemo(() => {
    const context: CommandVisibilityContext = {
      instanceClass,
      currentStatus: null,
      metadata,
      isArchived: false,
      currentFolder: sourceFile.parent?.path || "",
      expectedFolder: null,
    };
    return canCreateChildArea(context);
  }, [instanceClass, metadata, sourceFile]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onAreaCreate();
  };

  if (!shouldShowButton) {
    return null;
  }

  return (
    <button
      className="exocortex-quick-create-area-btn"
      onClick={handleClick}
      type="button"
      title="Quick create child area"
    >
      ⚡ Quick Create Area
    </button>
  );
};
