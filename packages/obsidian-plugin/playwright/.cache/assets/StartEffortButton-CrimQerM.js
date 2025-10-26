import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { i as canStartEffort } from './index-BFV2YJKW.js';

"use strict";
const StartEffortButton = ({
  instanceClass,
  currentStatus,
  sourceFile,
  onStartEffort
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
    return canStartEffort(context);
  }, [instanceClass, currentStatus, sourceFile]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onStartEffort();
  };
  if (!shouldShowButton) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-start-effort-btn",
      onClick: handleClick,
      type: "button",
      children: "Start Effort"
    }
  );
};

export { StartEffortButton };
//# sourceMappingURL=StartEffortButton-CrimQerM.js.map
