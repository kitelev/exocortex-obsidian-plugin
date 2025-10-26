"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canCreateTask = canCreateTask;
exports.canCreateProject = canCreateProject;
exports.canCreateChildArea = canCreateChildArea;
exports.canCreateInstance = canCreateInstance;
exports.canPlanOnToday = canPlanOnToday;
exports.canPlanForEvening = canPlanForEvening;
exports.canShiftDayBackward = canShiftDayBackward;
exports.canShiftDayForward = canShiftDayForward;
exports.canSetDraftStatus = canSetDraftStatus;
exports.canMoveToBacklog = canMoveToBacklog;
exports.canMoveToAnalysis = canMoveToAnalysis;
exports.canMoveToToDo = canMoveToToDo;
exports.canStartEffort = canStartEffort;
exports.canMarkDone = canMarkDone;
exports.canTrashEffort = canTrashEffort;
exports.canArchiveTask = canArchiveTask;
exports.canCleanProperties = canCleanProperties;
exports.canRepairFolder = canRepairFolder;
exports.canRenameToUid = canRenameToUid;
exports.canVoteOnEffort = canVoteOnEffort;
exports.canRollbackStatus = canRollbackStatus;
exports.canCreateRelatedTask = canCreateRelatedTask;
exports.canSetActiveFocus = canSetActiveFocus;
exports.canCopyLabelToAliases = canCopyLabelToAliases;
exports.canCreateNarrowerConcept = canCreateNarrowerConcept;
const WikiLinkHelpers_1 = require("../../utilities/WikiLinkHelpers");
const constants_1 = require("../constants");
/**
 * Check if instanceClass contains specific class
 */
function hasClass(instanceClass, targetClass) {
    if (!instanceClass)
        return false;
    const classes = Array.isArray(instanceClass)
        ? instanceClass
        : [instanceClass];
    return classes.some((cls) => WikiLinkHelpers_1.WikiLinkHelpers.normalize(cls) === targetClass);
}
/**
 * Check if instanceClass is ems__Area or ems__Project
 */
function isAreaOrProject(instanceClass) {
    return hasClass(instanceClass, constants_1.AssetClass.AREA) || hasClass(instanceClass, constants_1.AssetClass.PROJECT);
}
/**
 * Check if instanceClass is ems__Task, ems__Project, or ems__Meeting
 */
function isEffort(instanceClass) {
    return hasClass(instanceClass, constants_1.AssetClass.TASK) ||
        hasClass(instanceClass, constants_1.AssetClass.PROJECT) ||
        hasClass(instanceClass, constants_1.AssetClass.MEETING);
}
/**
 * Check if current status is Done
 */
function hasStatus(currentStatus, targetStatus) {
    if (!currentStatus)
        return false;
    const statusValue = Array.isArray(currentStatus)
        ? currentStatus[0]
        : currentStatus;
    if (!statusValue)
        return false;
    const cleanStatus = WikiLinkHelpers_1.WikiLinkHelpers.normalize(statusValue);
    return cleanStatus === targetStatus;
}
/**
 * Check if asset is archived
 * Supports multiple formats: true, "true", "yes", 1
 */
function isAssetArchived(isArchived) {
    if (isArchived === true || isArchived === 1)
        return true;
    if (typeof isArchived === "string") {
        const lowerValue = isArchived.toLowerCase();
        return lowerValue === "true" || lowerValue === "yes";
    }
    return false;
}
/**
 * Check if metadata has empty properties
 */
function hasEmptyProperties(metadata) {
    if (!metadata || Object.keys(metadata).length === 0)
        return false;
    return Object.values(metadata).some((value) => {
        if (value === null || value === undefined)
            return true;
        if (typeof value === "string" && value.trim() === "")
            return true;
        if (Array.isArray(value) && value.length === 0)
            return true;
        if (typeof value === "object" &&
            !Array.isArray(value) &&
            Object.keys(value).length === 0)
            return true;
        return false;
    });
}
/**
 * Check if folder needs repair
 */
function needsFolderRepair(currentFolder, expectedFolder) {
    if (!expectedFolder)
        return false;
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
function canCreateTask(context) {
    return isAreaOrProject(context.instanceClass);
}
/**
 * Can execute "Create Project" command
 * Available for: ems__Area, ems__Initiative, and ems__Project assets
 */
function canCreateProject(context) {
    return hasClass(context.instanceClass, constants_1.AssetClass.AREA) ||
        hasClass(context.instanceClass, constants_1.AssetClass.INITIATIVE) ||
        hasClass(context.instanceClass, constants_1.AssetClass.PROJECT);
}
/**
 * Can execute "Create Child Area" command
 * Available for: ems__Area assets only
 */
function canCreateChildArea(context) {
    return hasClass(context.instanceClass, constants_1.AssetClass.AREA);
}
/**
 * Can execute "Create Instance" command
 * Available for: ems__TaskPrototype and ems__MeetingPrototype assets
 */
function canCreateInstance(context) {
    return hasClass(context.instanceClass, constants_1.AssetClass.TASK_PROTOTYPE) ||
        hasClass(context.instanceClass, constants_1.AssetClass.MEETING_PROTOTYPE);
}
/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString() {
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
function isPlannedForToday(metadata) {
    const effortDay = metadata.ems__Effort_day;
    if (!effortDay)
        return false;
    const todayString = getTodayDateString();
    // Handle string value
    if (typeof effortDay === "string") {
        // Remove quotes and brackets
        const cleanValue = effortDay.replace(/["'[\]]/g, "").trim();
        return cleanValue === todayString;
    }
    // Handle array value (take first element)
    if (Array.isArray(effortDay) && effortDay.length > 0) {
        const cleanValue = String(effortDay[0]).replace(/["'[\]]/g, "").trim();
        return cleanValue === todayString;
    }
    return false;
}
/**
 * Can execute "Plan on today" command
 * Available for: Task and Project (any effort) that are NOT already planned for today
 */
function canPlanOnToday(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Hide button if already planned for today
    if (isPlannedForToday(context.metadata))
        return false;
    return true;
}
/**
 * Can execute "Plan for Evening" command
 * Available for: Task or Meeting with Backlog status
 */
function canPlanForEvening(context) {
    if (!hasClass(context.instanceClass, constants_1.AssetClass.TASK) && !hasClass(context.instanceClass, constants_1.AssetClass.MEETING))
        return false;
    // Show only for Backlog status
    return hasStatus(context.currentStatus, constants_1.EffortStatus.BACKLOG);
}
/**
 * Check if ems__Effort_day property exists
 */
function hasEffortDay(metadata) {
    const effortDay = metadata.ems__Effort_day;
    if (!effortDay)
        return false;
    if (typeof effortDay === "string") {
        const cleanValue = effortDay.replace(/["'[\]]/g, "").trim();
        return cleanValue.length > 0;
    }
    if (Array.isArray(effortDay) && effortDay.length > 0) {
        const cleanValue = String(effortDay[0]).replace(/["'[\]]/g, "").trim();
        return cleanValue.length > 0;
    }
    return false;
}
/**
 * Can execute "Shift Day Backward" command
 * Available for: Task and Project with ems__Effort_day property
 */
function canShiftDayBackward(context) {
    if (!isEffort(context.instanceClass))
        return false;
    return hasEffortDay(context.metadata);
}
/**
 * Can execute "Shift Day Forward" command
 * Available for: Task and Project with ems__Effort_day property
 */
function canShiftDayForward(context) {
    if (!isEffort(context.instanceClass))
        return false;
    return hasEffortDay(context.metadata);
}
/**
 * Can execute "Set Draft Status" command
 * Available for: Task/Project without any status
 */
function canSetDraftStatus(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Show only when status is not set
    return !context.currentStatus;
}
/**
 * Can execute "Move to Backlog" command
 * Available for: Task/Project with Draft status
 */
function canMoveToBacklog(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Show only for Draft status
    return hasStatus(context.currentStatus, constants_1.EffortStatus.DRAFT);
}
/**
 * Can execute "Move to Analysis" command
 * Available for: Project with Backlog status
 */
function canMoveToAnalysis(context) {
    if (!hasClass(context.instanceClass, constants_1.AssetClass.PROJECT))
        return false;
    // Show only for Backlog status
    return hasStatus(context.currentStatus, constants_1.EffortStatus.BACKLOG);
}
/**
 * Can execute "Move to ToDo" command
 * Available for: Project with Analysis status
 */
function canMoveToToDo(context) {
    if (!hasClass(context.instanceClass, constants_1.AssetClass.PROJECT))
        return false;
    // Show only for Analysis status
    return hasStatus(context.currentStatus, constants_1.EffortStatus.ANALYSIS);
}
/**
 * Can execute "Start Effort" command
 * Available for: Task or Meeting with Backlog status OR Project with ToDo status
 */
function canStartEffort(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Task and Meeting: Backlog → Doing
    if (hasClass(context.instanceClass, constants_1.AssetClass.TASK) || hasClass(context.instanceClass, constants_1.AssetClass.MEETING)) {
        return hasStatus(context.currentStatus, constants_1.EffortStatus.BACKLOG);
    }
    // Project: ToDo → Doing
    if (hasClass(context.instanceClass, constants_1.AssetClass.PROJECT)) {
        return hasStatus(context.currentStatus, constants_1.EffortStatus.TODO);
    }
    return false;
}
/**
 * Can execute "Mark as Done" command
 * Available for: Task/Project with Doing status
 */
function canMarkDone(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Show only for Doing status
    return hasStatus(context.currentStatus, constants_1.EffortStatus.DOING);
}
/**
 * Can execute "Trash" command
 * Available for: Task/Project without Trashed or Done status
 */
function canTrashEffort(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Show for efforts without status
    if (!context.currentStatus)
        return true;
    // Hide if status is Trashed or Done
    const statuses = Array.isArray(context.currentStatus)
        ? context.currentStatus
        : [context.currentStatus];
    const hasTrashedOrDone = statuses.some((status) => {
        const cleanStatus = WikiLinkHelpers_1.WikiLinkHelpers.normalize(status);
        return (cleanStatus === constants_1.EffortStatus.TRASHED ||
            cleanStatus === constants_1.EffortStatus.DONE);
    });
    return !hasTrashedOrDone;
}
/**
 * Can execute "Archive Task" command
 * Available for: Any asset that is not already archived
 */
function canArchiveTask(context) {
    return !isAssetArchived(context.isArchived);
}
/**
 * Can execute "Clean Empty Properties" command
 * Available for: Any asset with empty properties
 */
function canCleanProperties(context) {
    return hasEmptyProperties(context.metadata);
}
/**
 * Can execute "Repair Folder" command
 * Available for: Any asset in wrong folder (based on exo__Asset_isDefinedBy)
 */
function canRepairFolder(context) {
    return needsFolderRepair(context.currentFolder, context.expectedFolder);
}
/**
 * Can execute "Rename to UID" command
 * Available for: Any asset where filename doesn't match exo__Asset_uid
 * Excluded: ims__Concept assets (concepts should keep their semantic names)
 */
function canRenameToUid(context, currentFilename) {
    const uid = context.metadata.exo__Asset_uid;
    if (!uid)
        return false;
    if (hasClass(context.instanceClass, constants_1.AssetClass.CONCEPT))
        return false;
    return currentFilename !== uid;
}
/**
 * Can execute "Vote on Effort" command
 * Available for: Task and Project efforts (not archived)
 */
function canVoteOnEffort(context) {
    if (!isEffort(context.instanceClass))
        return false;
    if (isAssetArchived(context.isArchived))
        return false;
    return true;
}
/**
 * Can execute "Rollback Status" command
 * Available for: Efforts with non-null, non-Trashed status (workflow-based rollback)
 */
function canRollbackStatus(context) {
    if (!isEffort(context.instanceClass))
        return false;
    if (isAssetArchived(context.isArchived))
        return false;
    if (!context.currentStatus)
        return false;
    const statusValue = Array.isArray(context.currentStatus)
        ? context.currentStatus[0]
        : context.currentStatus;
    if (!statusValue)
        return false;
    const cleanStatus = WikiLinkHelpers_1.WikiLinkHelpers.normalize(statusValue);
    if (cleanStatus === constants_1.EffortStatus.TRASHED)
        return false;
    return true;
}
/**
 * Can execute "Create Related Task" command
 * Available for: ems__Task assets (not archived)
 */
function canCreateRelatedTask(context) {
    if (!hasClass(context.instanceClass, constants_1.AssetClass.TASK))
        return false;
    // Don't show button if archived
    if (isAssetArchived(context.isArchived))
        return false;
    return true;
}
/**
 * Can execute "Set Active Focus" command
 * Available for: ems__Area assets only
 */
function canSetActiveFocus(context) {
    return hasClass(context.instanceClass, constants_1.AssetClass.AREA);
}
/**
 * Can execute "Copy Label to Aliases" command
 * Available for: Assets with exo__Asset_label that don't have this label in aliases yet
 */
function canCopyLabelToAliases(context) {
    const label = context.metadata.exo__Asset_label;
    if (!label || typeof label !== "string" || label.trim() === "")
        return false;
    const trimmedLabel = label.trim();
    const aliases = context.metadata.aliases;
    if (!aliases)
        return true;
    if (!Array.isArray(aliases))
        return true;
    if (aliases.length === 0)
        return true;
    return !aliases.some((alias) => {
        if (typeof alias !== "string")
            return false;
        return alias.trim() === trimmedLabel;
    });
}
/**
 * Can execute "Create Narrower Concept" command
 * Available for: ims__Concept assets
 */
function canCreateNarrowerConcept(context) {
    return hasClass(context.instanceClass, constants_1.AssetClass.CONCEPT);
}
