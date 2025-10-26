import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { a as canCleanProperties } from './index-BFV2YJKW.js';

"use strict";
const CleanEmptyPropertiesButton = ({ sourceFile, metadata, onCleanup }) => {
  const hasEmptyProperties = React.useMemo(() => {
    const context = {
      instanceClass: null,
      currentStatus: null,
      metadata,
      isArchived: false,
      currentFolder: sourceFile.parent?.path || "",
      expectedFolder: null
    };
    return canCleanProperties(context);
  }, [metadata, sourceFile]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onCleanup();
  };
  if (!hasEmptyProperties) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-clean-properties-btn",
      onClick: handleClick,
      type: "button",
      children: "Clean Empty Properties"
    }
  );
};

export { CleanEmptyPropertiesButton };
//# sourceMappingURL=CleanEmptyPropertiesButton-9631c0vB.js.map
