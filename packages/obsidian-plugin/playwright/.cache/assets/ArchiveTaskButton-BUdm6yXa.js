import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { c as canArchiveTask } from './index-BFV2YJKW.js';

"use strict";
const ArchiveTaskButton = ({
  instanceClass,
  currentStatus,
  isArchived,
  sourceFile,
  onArchive
}) => {
  const shouldShowButton = React.useMemo(() => {
    const normalizedArchived = Boolean(
      isArchived === true || isArchived === "true" || isArchived === "yes" || isArchived === 1
    );
    const context = {
      instanceClass,
      currentStatus,
      metadata: {},
      isArchived: normalizedArchived,
      currentFolder: sourceFile.parent?.path || "",
      expectedFolder: null
    };
    return canArchiveTask(context);
  }, [instanceClass, currentStatus, isArchived, sourceFile]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onArchive();
  };
  if (!shouldShowButton) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-archive-task-btn",
      onClick: handleClick,
      type: "button",
      children: "To Archive"
    }
  );
};

export { ArchiveTaskButton };
//# sourceMappingURL=ArchiveTaskButton-BUdm6yXa.js.map
