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
 * Can execute "Create Instance" command
 * Available for: ems__TaskPrototype assets
 */
export function canCreateInstance(context: CommandVisibilityContext): boolean {
  return hasClass(context.instanceClass, "ems__TaskPrototype");
}

/**
 * Can execute "Plan on today" command
 * Available for: Task and Project (any effort)
 */
export function canPlanOnToday(context: CommandVisibilityContext): boolean {
  return isEffort(context.instanceClass);
}

/**
 * Can execute "Start Effort" command
 * Available for: Task/Project without Doing or Done status
 */
export function canStartEffort(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Show for efforts without status
  if (!context.currentStatus) return true;

  // Hide if status is Doing or Done
  const statuses = Array.isArray(context.currentStatus)
    ? context.currentStatus
    : [context.currentStatus];

  const hasDoingOrDone = statuses.some((status) => {
    const cleanStatus = normalizeClassName(status);
    return (
      cleanStatus === "ems__EffortStatusDoing" ||
      cleanStatus === "ems__EffortStatusDone"
    );
  });

  return !hasDoingOrDone;
}

/**
 * Can execute "Mark as Done" command
 * Available for: Task/Project without Done status
 */
export function canMarkDone(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  // Show for efforts without status
  if (!context.currentStatus) return true;

  // Hide if status is Done
  return !hasStatus(context.currentStatus, "ems__EffortStatusDone");
}

/**
 * Can execute "Archive Task" command
 * Available for: Task/Project with Done status and not archived
 */
export function canArchiveTask(context: CommandVisibilityContext): boolean {
  if (!isEffort(context.instanceClass)) return false;

  const isDone = hasStatus(context.currentStatus, "ems__EffortStatusDone");
  const archived = isAssetArchived(context.isArchived);

  return isDone && !archived;
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
