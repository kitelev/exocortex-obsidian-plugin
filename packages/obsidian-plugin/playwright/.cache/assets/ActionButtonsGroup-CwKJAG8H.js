import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import './index-BIdHmUZ9.js';

"use strict";
const ActionButtonsGroup = ({ groups }) => {
  const visibleGroups = groups.map((group) => ({
    ...group,
    buttons: group.buttons.filter((btn) => btn.visible !== false)
  })).filter((group) => group.buttons.length > 0);
  if (visibleGroups.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-action-buttons-container", children: visibleGroups.map((group, groupIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "exocortex-button-group", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-button-group-title", children: group.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-button-group-buttons", children: group.buttons.map((button) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        className: `exocortex-action-button exocortex-action-button--${button.variant || "secondary"}`,
        onClick: async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await button.onClick();
        },
        children: button.label
      },
      button.id
    )) }),
    groupIndex < visibleGroups.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-button-group-separator" })
  ] }, group.id)) });
};

export { ActionButtonsGroup };
//# sourceMappingURL=ActionButtonsGroup-CwKJAG8H.js.map
