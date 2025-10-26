import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { d as canCreateTask } from './index-BFV2YJKW.js';

"use strict";
const CreateTaskButton = ({
  instanceClass,
  metadata,
  sourceFile,
  onTaskCreate
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
    return canCreateTask(context);
  }, [instanceClass, metadata, sourceFile]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onTaskCreate();
  };
  if (!shouldShowButton) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-create-task-btn",
      onClick: handleClick,
      type: "button",
      children: "Create Task"
    }
  );
};

export { CreateTaskButton };
//# sourceMappingURL=CreateTaskButton-CvxJq9IF.js.map
