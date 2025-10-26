import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { g as canPlanOnToday } from './index-BFV2YJKW.js';

"use strict";
const PlanOnTodayButton = ({
  instanceClass,
  metadata,
  sourceFile,
  onPlanOnToday
}) => {
  const shouldShowButton = React.useMemo(() => {
    const context = {
      instanceClass,
      currentStatus: null,
      metadata,
      isArchived: false,
      currentFolder: sourceFile.parent?.path || "",
      expectedFolder: null
    };
    return canPlanOnToday(context);
  }, [instanceClass, metadata, sourceFile]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onPlanOnToday();
  };
  if (!shouldShowButton) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-plan-on-today-btn",
      onClick: handleClick,
      type: "button",
      children: "Plan on today"
    }
  );
};

export { PlanOnTodayButton };
//# sourceMappingURL=PlanOnTodayButton-ByXteW2G.js.map
