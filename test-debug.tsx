import React from "react";
import { TFile } from "obsidian";
import { canStartEffort, CommandVisibilityContext } from "./src/domain/commands/CommandVisibility";

const mockFile = { path: "test-task.md", basename: "test-task" } as TFile;

const context: CommandVisibilityContext = {
  instanceClass: "[[ems__Task]]",
  currentStatus: null,
  metadata: {},
  isArchived: false,
  currentFolder: (mockFile as any).parent?.path || "",
  expectedFolder: null,
};

console.log("Context:", context);
console.log("canStartEffort:", canStartEffort(context));

export const TestComponent: React.FC = () => {
  const shouldShowButton = React.useMemo(() => {
    const ctx: CommandVisibilityContext = {
      instanceClass: "[[ems__Task]]",
      currentStatus: null,
      metadata: {},
      isArchived: false,
      currentFolder: (mockFile as any).parent?.path || "",
      expectedFolder: null,
    };
    const result = canStartEffort(ctx);
    console.log("useMemo result:", result);
    return result;
  }, []);

  console.log("shouldShowButton:", shouldShowButton);

  if (!shouldShowButton) {
    console.log("Returning null");
    return null;
  }

  console.log("Rendering button");
  return <button>Start Effort</button>;
};
