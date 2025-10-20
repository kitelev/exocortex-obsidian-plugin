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
 * Normalize class name by removing wiki-link brackets and trimming
 */
function normalizeClassName(cls: string): string {
  return cls.replace(/\[\[|\]\]/g, "").trim();
}

/**
 * Check if instanceClass contains specific class
 */
function hasClass(
  instanceClass: string | string[] | null,
  targetClass: string,
): boolean {
  if (!instanceClass) return false;

  const classes = Array.isArray(instanceClass)
    ? instanceClass
    : [instanceClass];

  return classes.some((cls) => normalizeClassName(cls) === targetClass);
}

/**
 * Check if instanceClass is ems__Area or ems__Project
 */
function isAreaOrProject(instanceClass: string | string[] | null): boolean {
  return hasClass(instanceClass, "ems__Area") || hasClass(instanceClass, "ems__Project");
}

/**
 * Check if instanceClass is ems__Task or ems__Project
 */
function isEffort(instanceClass: string | string[] | null): boolean {
  return hasClass(instanceClass, "ems__Task") || hasClass(instanceClass, "ems__Project");
}

/**
 * Check if current status is Done
 */
function hasStatus(
  currentStatus: string | string[] | null,
  targetStatus: string,
): boolean {
  if (!currentStatus) return false;

  const statusValue = Array.isArray(currentStatus)
    ? currentStatus[0]
    : currentStatus;

  if (!statusValue) return false;

  const cleanStatus = normalizeClassName(statusValue);
  return cleanStatus === targetStatus;
}

/**
 * Check if asset is archived
 * Supports multiple formats: true, "true", "yes", 1
 */
function isAssetArchived(isArchived: any): boolean {
  if (isArchived === true || isArchived === 1) return true;
  if (typeof isArchived === "string") {
    const lowerValue = isArchived.toLowerCase();
    return lowerValue === "true" || lowerValue === "yes";
  }
  return false;
}

/**
 * Check if metadata has empty properties
 */
function hasEmptyProperties(metadata: Record<string, any>): boolean {
  if (!metadata || Object.keys(metadata).length === 0) return false;

  return Object.values(metadata).some((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    )
      return true;
    return false;
  });
}

/**
 * Check if folder needs repair
 */
function needsFolderRepair(
  currentFolder: string,
  expectedFolder: string | null,
): boolean {
  if (!expectedFolder) return false;

  // Normalize paths for comparison (remove trailing slashes)
  const normalizedCurrent = currentFolder.replace(/\/$/, "");
  const normalizedExpected = expectedFolder.replace(/\/$/, "");

  return normalizedCurrent !== normalizedExpected;
}

// ============================================================================
// Public API: Command Visibility Functions
// ============================================================================

/**
 * Can execute "Create Task" command
 * Available for: ems__Area and ems__Project assets
 */
export function canCreateTask(context: CommandVisibilityContext): boolean {
  return isAreaOrProject(context.instanceClass);
}

/**
 * Can execute "Create Project" command
 * Available for: ems__Area and ems__Initiative assets
 */
export function canCreateProject(context: CommandVisibilityContext): boolean {
  return hasClass(context.instanceClass, "ems__Area") || hasClass(context.instanceClass, "ems__Initiative");
}

/**
 * Can execute "Create Instance" command
 * Available for: ems__TaskPrototype and ems__MeetingPrototype assets
 */
export function canCreateInstance(context: CommandVisibilityContext): boolean {
  return hasClass(context.instanceClass, "ems__TaskPrototype") ||
         hasClass(context.instanceClass, "ems__MeetingPrototype");
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if ems__Effort_day is set to today's date
 * Handles formats: "[[YYYY-MM-DD]]" or [[YYYY-MM-DD]]
 */
function isPlannedForToday(metadata: Record<string, any>): boolean {
  const effortDay = metadata.ems__Effort_day;
  if (!effortDay) return false;

  const todayString = getTodayDateString();

  // Handle string value
  if (typeof effortDay === "string") {
    // Remove quotes and brackets
    const cleanValue = effortDay.replace(/["'\[\]]/g, "").trim();
    return cleanValue === todayString;
  }

  // Handle array value (take first element)
  if (Array.isArray(effortDay) && effortDay.length > 0) {
    const cleanValue = String(effortDay[0]).replace(/["'\[\]]/g, "").trim();
    return cleanValue === todayString;
  }

  return false;
}

/**
 * Can execute "Plan on today" command
 * Available for: Task and Project (any effort) that are NOT already planned for today
 */
export function canPlanOnToday(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Hide button if already planned for today
  if (isPlannedForToday(context.metadata)) return false;

  return true;
}

/**
 * Can execute "Plan for Evening" command
 * Available for: Task with Backlog status
 */
export function canPlanForEvening(context: CommandVisibilityContext): boolean {
  if (!hasClass(context.instanceClass, "ems__Task")) return false;

  // Show only for Backlog status
  return hasStatus(context.currentStatus, "ems__EffortStatusBacklog");
}

/**
 * Check if ems__Effort_day property exists
 */
function hasEffortDay(metadata: Record<string, any>): boolean {
  const effortDay = metadata.ems__Effort_day;
  if (!effortDay) return false;

  if (typeof effortDay === "string") {
    const cleanValue = effortDay.replace(/["'\[\]]/g, "").trim();
    return cleanValue.length > 0;
  }

  if (Array.isArray(effortDay) && effortDay.length > 0) {
    const cleanValue = String(effortDay[0]).replace(/["'\[\]]/g, "").trim();
    return cleanValue.length > 0;
  }

  return false;
}

/**
 * Can execute "Shift Day Backward" command
 * Available for: Task and Project with ems__Effort_day property
 */
export function canShiftDayBackward(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;
  return hasEffortDay(context.metadata);
}

/**
 * Can execute "Shift Day Forward" command
 * Available for: Task and Project with ems__Effort_day property
 */
export function canShiftDayForward(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;
  return hasEffortDay(context.metadata);
}

/**
 * Can execute "Set Draft Status" command
 * Available for: Task/Project without any status
 */
export function canSetDraftStatus(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Show only when status is not set
  return !context.currentStatus;
}

/**
 * Can execute "Move to Backlog" command
 * Available for: Task/Project with Draft status
 */
export function canMoveToBacklog(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Show only for Draft status
  return hasStatus(context.currentStatus, "ems__EffortStatusDraft");
}

/**
 * Can execute "Move to Analysis" command
 * Available for: Project with Backlog status
 */
export function canMoveToAnalysis(context: CommandVisibilityContext): boolean {
  if (!hasClass(context.instanceClass, "ems__Project")) return false;

  // Show only for Backlog status
  return hasStatus(context.currentStatus, "ems__EffortStatusBacklog");
}

/**
 * Can execute "Move to ToDo" command
 * Available for: Project with Analysis status
 */
export function canMoveToToDo(context: CommandVisibilityContext): boolean {
  if (!hasClass(context.instanceClass, "ems__Project")) return false;

  // Show only for Analysis status
  return hasStatus(context.currentStatus, "ems__EffortStatusAnalysis");
}

/**
 * Can execute "Start Effort" command
 * Available for: Task with Backlog status OR Project with ToDo status
 */
export function canStartEffort(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Task: Backlog → Doing
  if (hasClass(context.instanceClass, "ems__Task")) {
    return hasStatus(context.currentStatus, "ems__EffortStatusBacklog");
  }

  // Project: ToDo → Doing
  if (hasClass(context.instanceClass, "ems__Project")) {
    return hasStatus(context.currentStatus, "ems__EffortStatusToDo");
  }

  return false;
}

/**
 * Can execute "Mark as Done" command
 * Available for: Task/Project with Doing status
 */
export function canMarkDone(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Show only for Doing status
  return hasStatus(context.currentStatus, "ems__EffortStatusDoing");
}

/**
 * Can execute "Trash" command
 * Available for: Task/Project without Trashed or Done status
 */
export function canTrashEffort(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Show for efforts without status
  if (!context.currentStatus) return true;

  // Hide if status is Trashed or Done
  const statuses = Array.isArray(context.currentStatus)
    ? context.currentStatus
    : [context.currentStatus];

  const hasTrashedOrDone = statuses.some((status) => {
    const cleanStatus = normalizeClassName(status);
    return (
      cleanStatus === "ems__EffortStatusTrashed" ||
      cleanStatus === "ems__EffortStatusDone"
    );
  });

  return !hasTrashedOrDone;
}

/**
 * Can execute "Archive Task" command
 * Available for: Any asset that is not already archived
 */
export function canArchiveTask(context: CommandVisibilityContext): boolean {
  return !isAssetArchived(context.isArchived);
}

/**
 * Can execute "Clean Empty Properties" command
 * Available for: Any asset with empty properties
 */
export function canCleanProperties(
  context: CommandVisibilityContext,
): boolean {
  return hasEmptyProperties(context.metadata);
}

/**
 * Can execute "Repair Folder" command
 * Available for: Any asset in wrong folder (based on exo__Asset_isDefinedBy)
 */
export function canRepairFolder(context: CommandVisibilityContext): boolean {
  return needsFolderRepair(context.currentFolder, context.expectedFolder);
}

/**
 * Can execute "Rename to UID" command
 * Available for: Any asset where filename doesn't match exo__Asset_uid
 */
export function canRenameToUid(
  context: CommandVisibilityContext,
  currentFilename: string,
): boolean {
  const uid = context.metadata.exo__Asset_uid;
  if (!uid) return false;

  return currentFilename !== uid;
}

/**
 * Can execute "Vote on Effort" command
 * Available for: Task and Project efforts (not archived)
 */
export function canVoteOnEffort(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Don't show vote button if archived
  if (isAssetArchived(context.isArchived)) return false;

  return true;
}
