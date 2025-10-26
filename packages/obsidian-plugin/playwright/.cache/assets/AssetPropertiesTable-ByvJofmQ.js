import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';

"use strict";
const AssetPropertiesTable = ({
  metadata,
  onLinkClick,
  getAssetLabel
}) => {
  const isWikiLink = (value) => {
    return typeof value === "string" && /\[\[.*?\]\]/.test(value);
  };
  const parseWikiLink = (value) => {
    const content = value.replace(/^\[\[|\]\]$/g, "");
    const pipeIndex = content.indexOf("|");
    if (pipeIndex !== -1) {
      return {
        target: content.substring(0, pipeIndex).trim(),
        alias: content.substring(pipeIndex + 1).trim()
      };
    }
    return {
      target: content.trim()
    };
  };
  const renderValue = (value) => {
    if (value === null || value === void 0) {
      return "-";
    }
    if (typeof value === "boolean" || typeof value === "number") {
      return String(value);
    }
    if (typeof value === "string") {
      if (isWikiLink(value)) {
        const parsed = parseWikiLink(value);
        const label = getAssetLabel?.(parsed.target);
        const displayText = parsed.alias || label || parsed.target;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            "data-href": parsed.target,
            className: "internal-link",
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onLinkClick?.(parsed.target, e);
            },
            style: { cursor: "pointer" },
            children: displayText
          }
        );
      }
      return value;
    }
    if (Array.isArray(value)) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: value.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
        renderValue(item),
        index < value.length - 1 ? ", " : ""
      ] }, index)) });
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };
  const metadataEntries = Object.entries(metadata || {});
  if (metadataEntries.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "exocortex-asset-properties", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Properties" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "exocortex-properties-table", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Property" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Value" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: metadataEntries.map(([key, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "property-key", children: key }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "property-value", children: renderValue(value) })
      ] }, key)) })
    ] })
  ] });
};

export { AssetPropertiesTable };
//# sourceMappingURL=AssetPropertiesTable-ByvJofmQ.js.map
