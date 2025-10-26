interface EffortItem {
  isTrashed: boolean;
  isDone: boolean;
  metadata: Record<string, any>;
  startTime?: string;
}

export class EffortSortingHelpers {
  static sortByPriority<T extends EffortItem>(a: T, b: T): number {
    if (a.isTrashed !== b.isTrashed) {
      return a.isTrashed ? 1 : -1;
    }

    if (a.isDone !== b.isDone) {
      return a.isDone ? 1 : -1;
    }

    const aVotes =
      typeof a.metadata.ems__Effort_votes === "number"
        ? a.metadata.ems__Effort_votes
        : 0;
    const bVotes =
      typeof b.metadata.ems__Effort_votes === "number"
        ? b.metadata.ems__Effort_votes
        : 0;

    if (aVotes !== bVotes) {
      return bVotes - aVotes;
    }

    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }

    if (a.startTime) return -1;
    if (b.startTime) return 1;

    return 0;
  }
}
