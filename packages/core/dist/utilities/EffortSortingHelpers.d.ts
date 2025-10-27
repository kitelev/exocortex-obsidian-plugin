interface EffortItem {
  isTrashed: boolean;
  isDone: boolean;
  metadata: Record<string, any>;
  startTime?: string;
}
export declare class EffortSortingHelpers {
  static sortByPriority<T extends EffortItem>(a: T, b: T): number;
}
export {};
//# sourceMappingURL=EffortSortingHelpers.d.ts.map
