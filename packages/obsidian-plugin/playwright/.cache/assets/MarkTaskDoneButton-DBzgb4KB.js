import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { e as canMarkDone } from './index-BFV2YJKW.js';

"use strict";
const MarkTaskDoneButton = ({
  instanceClass,
  currentStatus,
  sourceFile,
  onMarkDone
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
    return canMarkDone(context);
  }, [instanceClass, currentStatus, sourceFile]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onMarkDone();
  };
  if (!shouldShowButton) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-mark-done-btn",
      onClick: handleClick,
      type: "button",
      children: "Done"
    }
  );
};

export { MarkTaskDoneButton };
//# sourceMappingURL=MarkTaskDoneButton-DBzgb4KB.js.map
