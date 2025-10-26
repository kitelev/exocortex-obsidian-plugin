"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffortStatusWorkflow = void 0;
const constants_1 = require("../domain/constants");
class EffortStatusWorkflow {
    getPreviousStatus(currentStatus, instanceClass) {
        const normalizedStatus = this.normalizeStatus(currentStatus);
        if (normalizedStatus === constants_1.EffortStatus.DRAFT) {
            return null;
        }
        if (normalizedStatus === constants_1.EffortStatus.BACKLOG) {
            return this.wrapStatus(constants_1.EffortStatus.DRAFT);
        }
        if (normalizedStatus === constants_1.EffortStatus.ANALYSIS) {
            return this.wrapStatus(constants_1.EffortStatus.BACKLOG);
        }
        if (normalizedStatus === constants_1.EffortStatus.TODO) {
            return this.wrapStatus(constants_1.EffortStatus.ANALYSIS);
        }
        if (normalizedStatus === constants_1.EffortStatus.DOING) {
            const isProject = this.hasInstanceClass(instanceClass, constants_1.AssetClass.PROJECT);
            return isProject
                ? this.wrapStatus(constants_1.EffortStatus.TODO)
                : this.wrapStatus(constants_1.EffortStatus.BACKLOG);
        }
        if (normalizedStatus === constants_1.EffortStatus.DONE) {
            return this.wrapStatus(constants_1.EffortStatus.DOING);
        }
        return undefined;
    }
    normalizeStatus(status) {
        return status.replace(/["'[\]]/g, "").trim();
    }
    wrapStatus(status) {
        return `"[[${status}]]"`;
    }
    hasInstanceClass(instanceClass, targetClass) {
        if (!instanceClass)
            return false;
        const classes = Array.isArray(instanceClass)
            ? instanceClass
            : [instanceClass];
        return classes.some((cls) => cls.replace(/["'[\]]/g, "").trim() === targetClass);
    }
}
exports.EffortStatusWorkflow = EffortStatusWorkflow;
