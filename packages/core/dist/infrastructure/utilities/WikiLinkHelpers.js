"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WikiLinkHelpers = void 0;
class WikiLinkHelpers {
    static normalize(value) {
        if (!value)
            return "";
        return value.replace(this.WIKI_LINK_PATTERN, "").trim();
    }
    static normalizeArray(values) {
        if (!values)
            return [];
        const arr = Array.isArray(values) ? values : [values];
        return arr.map((v) => this.normalize(v)).filter((v) => v.length > 0);
    }
    static equals(a, b) {
        return this.normalize(a) === this.normalize(b);
    }
    static includes(array, value) {
        const normalized = this.normalizeArray(array);
        const target = this.normalize(value);
        return normalized.includes(target);
    }
}
exports.WikiLinkHelpers = WikiLinkHelpers;
WikiLinkHelpers.WIKI_LINK_PATTERN = /\[\[|\]\]/g;
