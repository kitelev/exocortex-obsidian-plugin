import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { f as canMoveToBacklog } from './index-BFV2YJKW.js';

"use strict";
const MoveToBacklogButton = ({
  instanceClass,
  currentStatus,
  sourceFile,
  onMoveToBacklog
}) => {
  const shouldShowButton = React.useMemo(() => {
    const context = {
      instanceClass,
      currentStatus,
      metadata: {},
      isArchived: false,
      currentFolder: sourceFile.parent?.path || "",
      expectedFolder: null
    };
    return canMoveToBacklog(context);
  }, [instanceClass, currentStatus, sourceFile]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onMoveToBacklog();
  };
  if (!shouldShowButton) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-move-to-backlog-btn",
      onClick: handleClick,
      type: "button",
      children: "To Backlog"
    }
  );
};

export { MoveToBacklogButton };
//# sourceMappingURL=MoveToBacklogButton-DzmoNR_C.js.map
