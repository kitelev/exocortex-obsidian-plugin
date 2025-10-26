import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { b as canCreateInstance } from './index-BFV2YJKW.js';

"use strict";
const CreateInstanceButton = ({
  instanceClass,
  metadata,
  sourceFile,
  onInstanceCreate
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
    return canCreateInstance(context);
  }, [instanceClass, metadata, sourceFile]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onInstanceCreate();
  };
  if (!shouldShowButton) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-create-instance-btn",
      onClick: handleClick,
      type: "button",
      children: "Create Instance"
    }
  );
};

export { CreateInstanceButton };
//# sourceMappingURL=CreateInstanceButton-1QJ6WhI3.js.map
