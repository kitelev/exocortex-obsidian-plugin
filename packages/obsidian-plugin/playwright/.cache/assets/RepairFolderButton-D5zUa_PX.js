import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { h as canRepairFolder } from './index-BFV2YJKW.js';

"use strict";
const RepairFolderButton = ({
  currentFolder,
  expectedFolder,
  onRepair
}) => {
  const needsRepair = React.useMemo(() => {
    const context = {
      instanceClass: null,
      currentStatus: null,
      metadata: {},
      isArchived: false,
      currentFolder,
      expectedFolder
    };
    return canRepairFolder(context);
  }, [currentFolder, expectedFolder]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onRepair();
  };
  if (!needsRepair) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-repair-folder-btn",
      onClick: handleClick,
      type: "button",
      title: `Move to ${expectedFolder}`,
      children: "Repair Folder"
    }
  );
};

export { RepairFolderButton };
//# sourceMappingURL=RepairFolderButton-D5zUa_PX.js.map
