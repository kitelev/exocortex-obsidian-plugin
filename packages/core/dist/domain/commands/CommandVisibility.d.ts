/**
 * Command Visibility Utilities
 * Contains pure functions for determining command availability based on asset context
 * Used by both CommandManager (for Command Palette) and React components (for buttons)
 *
 * Pattern: Strategy pattern for visibility conditions
 * Benefits: DRY, testable, consistent between UI and commands
 */
export interface CommandVisibilityContext {
  instanceClass: string | string[] | null;
  currentStatus: string | string[] | null;
  metadata: Record<string, any>;
  isArchived: boolean;
  currentFolder: string;
  expectedFolder: string | null;
}
/**
 * Can execute "Create Task" command
 * Available for: ems__Area and ems__Project assets
 */
export declare function canCreateTask(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Create Project" command
 * Available for: ems__Area, ems__Initiative, and ems__Project assets
 */
export declare function canCreateProject(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Create Child Area" command
 * Available for: ems__Area assets only
 */
export declare function canCreateChildArea(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Create Instance" command
 * Available for: ems__TaskPrototype and ems__MeetingPrototype assets
 */
export declare function canCreateInstance(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Plan on today" command
 * Available for: Task and Project (any effort) that are NOT already planned for today
 */
export declare function canPlanOnToday(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Plan for Evening" command
 * Available for: Task or Meeting with Backlog status
 */
export declare function canPlanForEvening(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Shift Day Backward" command
 * Available for: Task and Project with ems__Effort_day property
 */
export declare function canShiftDayBackward(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Shift Day Forward" command
 * Available for: Task and Project with ems__Effort_day property
 */
export declare function canShiftDayForward(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Set Draft Status" command
 * Available for: Task/Project without any status
 */
export declare function canSetDraftStatus(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Move to Backlog" command
 * Available for: Task/Project with Draft status
 */
export declare function canMoveToBacklog(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Move to Analysis" command
 * Available for: Project with Backlog status
 */
export declare function canMoveToAnalysis(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Move to ToDo" command
 * Available for: Project with Analysis status
 */
export declare function canMoveToToDo(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Start Effort" command
 * Available for: Task or Meeting with Backlog status OR Project with ToDo status
 */
export declare function canStartEffort(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Mark as Done" command
 * Available for: Task/Project with Doing status
 */
export declare function canMarkDone(context: CommandVisibilityContext): boolean;
/**
 * Can execute "Trash" command
 * Available for: Task/Project without Trashed or Done status
 */
export declare function canTrashEffort(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Archive Task" command
 * Available for: Any asset that is not already archived
 */
export declare function canArchiveTask(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Clean Empty Properties" command
 * Available for: Any asset with empty properties
 */
export declare function canCleanProperties(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Repair Folder" command
 * Available for: Any asset in wrong folder (based on exo__Asset_isDefinedBy)
 */
export declare function canRepairFolder(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Rename to UID" command
 * Available for: Any asset where filename doesn't match exo__Asset_uid
 * Excluded: ims__Concept assets (concepts should keep their semantic names)
 */
export declare function canRenameToUid(
  context: CommandVisibilityContext,
  currentFilename: string,
): boolean;
/**
 * Can execute "Vote on Effort" command
 * Available for: Task and Project efforts (not archived)
 */
export declare function canVoteOnEffort(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Rollback Status" command
 * Available for: Efforts with non-null, non-Trashed status (workflow-based rollback)
 */
export declare function canRollbackStatus(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Create Related Task" command
 * Available for: ems__Task assets (not archived)
 */
export declare function canCreateRelatedTask(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Set Active Focus" command
 * Available for: ems__Area assets only
 */
export declare function canSetActiveFocus(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Copy Label to Aliases" command
 * Available for: Assets with exo__Asset_label that don't have this label in aliases yet
 */
export declare function canCopyLabelToAliases(
  context: CommandVisibilityContext,
): boolean;
/**
 * Can execute "Create Narrower Concept" command
 * Available for: ims__Concept assets
 */
export declare function canCreateNarrowerConcept(
  context: CommandVisibilityContext,
): boolean;
//# sourceMappingURL=CommandVisibility.d.ts.map
