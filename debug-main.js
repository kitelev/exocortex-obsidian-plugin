var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// debug-main.ts
var debug_main_exports = {};
__export(debug_main_exports, {
  default: () => ExocortexDebugPlugin
});
module.exports = __toCommonJS(debug_main_exports);
var import_obsidian = require("obsidian");
var ExocortexDebugPlugin = class extends import_obsidian.Plugin {
  onload() {
    return __async(this, null, function* () {
      console.log("Exocortex Debug Plugin: Loading...");
      new import_obsidian.Notice("Exocortex Debug: Plugin loaded!");
      this.registerMarkdownCodeBlockProcessor("sparql", (source, el, ctx) => __async(this, null, function* () {
        console.log("SPARQL Debug: Processing query:", source);
        el.empty();
        const debugDiv = el.createDiv({ cls: "sparql-debug" });
        debugDiv.createEl("h4", { text: "SPARQL Debug Output" });
        debugDiv.createEl("p", { text: "Query received:" });
        debugDiv.createEl("pre", { text: source });
        debugDiv.createEl("p", { text: "Status: Plugin is working!" });
        new import_obsidian.Notice("SPARQL query processed - check note for debug output");
      }));
      console.log("Exocortex Debug Plugin: Loaded successfully");
    });
  }
  onunload() {
    return __async(this, null, function* () {
      console.log("Exocortex Debug Plugin: Unloading...");
      new import_obsidian.Notice("Exocortex Debug: Plugin unloaded");
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
