"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffortSortingHelpers = void 0;
class EffortSortingHelpers {
    static sortByPriority(a, b) {
        if (a.isTrashed !== b.isTrashed) {
            return a.isTrashed ? 1 : -1;
        }
        if (a.isDone !== b.isDone) {
            return a.isDone ? 1 : -1;
        }
        const aVotes = typeof a.metadata.ems__Effort_votes === "number"
            ? a.metadata.ems__Effort_votes
            : 0;
        const bVotes = typeof b.metadata.ems__Effort_votes === "number"
            ? b.metadata.ems__Effort_votes
            : 0;
        if (aVotes !== bVotes) {
            return bVotes - aVotes;
        }
        if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
        }
        if (a.startTime)
            return -1;
        if (b.startTime)
            return 1;
        return 0;
    }
}
exports.EffortSortingHelpers = EffortSortingHelpers;
