import { j as jsxRuntimeExports } from './jsx-runtime-BX3UmbFx.js';
import { R as React } from './index-DosZHr-4.js';

const PropertyDisplay = ({
  name,
  value,
  type = "text",
  editable = false,
  onEdit
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const handleSave = () => {
    onEdit?.(name, editValue);
    setIsEditing(false);
  };
  const formatValue = (val) => {
    if (val === null || val === void 0) return "-";
    switch (type) {
      case "date":
        return new Date(val).toLocaleDateString();
      case "boolean":
        return val ? "Yes" : "No";
      case "list":
        return Array.isArray(val) ? val.join(", ") : String(val);
      case "link":
        return val;
      default:
        return String(val);
    }
  };
  if (isEditing && editable) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "exocortex-property editing", "data-property": name, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "property-name", children: [
        name,
        ":"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: type === "number" ? "number" : "text",
          value: editValue,
          onChange: (e) => setEditValue(e.target.value),
          className: "property-input",
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSave, className: "property-save", children: "Save" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIsEditing(false), className: "property-cancel", children: "Cancel" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "exocortex-property", "data-property": name, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "property-name", children: [
      name,
      ":"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "property-value", children: formatValue(value) }),
    editable && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIsEditing(true), className: "property-edit", children: "Edit" })
  ] });
};

export { PropertyDisplay };
//# sourceMappingURL=PropertyDisplay-BGe6RBD3.js.map
