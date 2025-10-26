import { WikiLinkHelpers } from "../../utilities/WikiLinkHelpers";
import { AssetClass, EffortStatus } from "../constants";
/**
 * Check if instanceClass contains specific class
 */
function hasClass(instanceClass, targetClass) {
    if (!instanceClass)
        return false;
    const classes = Array.isArray(instanceClass)
        ? instanceClass
        : [instanceClass];
    return classes.some((cls) => WikiLinkHelpers.normalize(cls) === targetClass);
}
/**
 * Check if instanceClass is ems__Area or ems__Project
 */
function isAreaOrProject(instanceClass) {
    return hasClass(instanceClass, AssetClass.AREA) || hasClass(instanceClass, AssetClass.PROJECT);
}
/**
 * Check if instanceClass is ems__Task, ems__Project, or ems__Meeting
 */
function isEffort(instanceClass) {
    return hasClass(instanceClass, AssetClass.TASK) ||
        hasClass(instanceClass, AssetClass.PROJECT) ||
        hasClass(instanceClass, AssetClass.MEETING);
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
    const cleanStatus = WikiLinkHelpers.normalize(statusValue);
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
export function canCreateTask(context) {
    return isAreaOrProject(context.instanceClass);
}
/**
 * Can execute "Create Project" command
 * Available for: ems__Area, ems__Initiative, and ems__Project assets
 */
export function canCreateProject(context) {
    return hasClass(context.instanceClass, AssetClass.AREA) ||
        hasClass(context.instanceClass, AssetClass.INITIATIVE) ||
        hasClass(context.instanceClass, AssetClass.PROJECT);
}
/**
 * Can execute "Create Child Area" command
 * Available for: ems__Area assets only
 */
export function canCreateChildArea(context) {
    return hasClass(context.instanceClass, AssetClass.AREA);
}
/**
 * Can execute "Create Instance" command
 * Available for: ems__TaskPrototype and ems__MeetingPrototype assets
 */
export function canCreateInstance(context) {
    return hasClass(context.instanceClass, AssetClass.TASK_PROTOTYPE) ||
        hasClass(context.instanceClass, AssetClass.MEETING_PROTOTYPE);
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
export function canPlanOnToday(context) {
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
export function canPlanForEvening(context) {
    if (!hasClass(context.instanceClass, AssetClass.TASK) && !hasClass(context.instanceClass, AssetClass.MEETING))
        return false;
    // Show only for Backlog status
    return hasStatus(context.currentStatus, EffortStatus.BACKLOG);
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
export function canShiftDayBackward(context) {
    if (!isEffort(context.instanceClass))
        return false;
    return hasEffortDay(context.metadata);
}
/**
 * Can execute "Shift Day Forward" command
 * Available for: Task and Project with ems__Effort_day property
 */
export function canShiftDayForward(context) {
    if (!isEffort(context.instanceClass))
        return false;
    return hasEffortDay(context.metadata);
}
/**
 * Can execute "Set Draft Status" command
 * Available for: Task/Project without any status
 */
export function canSetDraftStatus(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Show only when status is not set
    return !context.currentStatus;
}
/**
 * Can execute "Move to Backlog" command
 * Available for: Task/Project with Draft status
 */
export function canMoveToBacklog(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Show only for Draft status
    return hasStatus(context.currentStatus, EffortStatus.DRAFT);
}
/**
 * Can execute "Move to Analysis" command
 * Available for: Project with Backlog status
 */
export function canMoveToAnalysis(context) {
    if (!hasClass(context.instanceClass, AssetClass.PROJECT))
        return false;
    // Show only for Backlog status
    return hasStatus(context.currentStatus, EffortStatus.BACKLOG);
}
/**
 * Can execute "Move to ToDo" command
 * Available for: Project with Analysis status
 */
export function canMoveToToDo(context) {
    if (!hasClass(context.instanceClass, AssetClass.PROJECT))
        return false;
    // Show only for Analysis status
    return hasStatus(context.currentStatus, EffortStatus.ANALYSIS);
}
/**
 * Can execute "Start Effort" command
 * Available for: Task or Meeting with Backlog status OR Project with ToDo status
 */
export function canStartEffort(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Task and Meeting: Backlog → Doing
    if (hasClass(context.instanceClass, AssetClass.TASK) || hasClass(context.instanceClass, AssetClass.MEETING)) {
        return hasStatus(context.currentStatus, EffortStatus.BACKLOG);
    }
    // Project: ToDo → Doing
    if (hasClass(context.instanceClass, AssetClass.PROJECT)) {
        return hasStatus(context.currentStatus, EffortStatus.TODO);
    }
    return false;
}
/**
 * Can execute "Mark as Done" command
 * Available for: Task/Project with Doing status
 */
export function canMarkDone(context) {
    if (!isEffort(context.instanceClass))
        return false;
    // Show only for Doing status
    return hasStatus(context.currentStatus, EffortStatus.DOING);
}
/**
 * Can execute "Trash" command
 * Available for: Task/Project without Trashed or Done status
 */
export function canTrashEffort(context) {
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
        const cleanStatus = WikiLinkHelpers.normalize(status);
        return (cleanStatus === EffortStatus.TRASHED ||
            cleanStatus === EffortStatus.DONE);
    });
    return !hasTrashedOrDone;
}
/**
 * Can execute "Archive Task" command
 * Available for: Any asset that is not already archived
 */
export function canArchiveTask(context) {
    return !isAssetArchived(context.isArchived);
}
/**
 * Can execute "Clean Empty Properties" command
 * Available for: Any asset with empty properties
 */
export function canCleanProperties(context) {
    return hasEmptyProperties(context.metadata);
}
/**
 * Can execute "Repair Folder" command
 * Available for: Any asset in wrong folder (based on exo__Asset_isDefinedBy)
 */
export function canRepairFolder(context) {
    return needsFolderRepair(context.currentFolder, context.expectedFolder);
}
/**
 * Can execute "Rename to UID" command
 * Available for: Any asset where filename doesn't match exo__Asset_uid
 * Excluded: ims__Concept assets (concepts should keep their semantic names)
 */
export function canRenameToUid(context, currentFilename) {
    const uid = context.metadata.exo__Asset_uid;
    if (!uid)
        return false;
    if (hasClass(context.instanceClass, AssetClass.CONCEPT))
        return false;
    return currentFilename !== uid;
}
/**
 * Can execute "Vote on Effort" command
 * Available for: Task and Project efforts (not archived)
 */
export function canVoteOnEffort(context) {
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
export function canRollbackStatus(context) {
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
    const cleanStatus = WikiLinkHelpers.normalize(statusValue);
    if (cleanStatus === EffortStatus.TRASHED)
        return false;
    return true;
}
/**
 * Can execute "Create Related Task" command
 * Available for: ems__Task assets (not archived)
 */
export function canCreateRelatedTask(context) {
    if (!hasClass(context.instanceClass, AssetClass.TASK))
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
export function canSetActiveFocus(context) {
    return hasClass(context.instanceClass, AssetClass.AREA);
}
/**
 * Can execute "Copy Label to Aliases" command
 * Available for: Assets with exo__Asset_label that don't have this label in aliases yet
 */
export function canCopyLabelToAliases(context) {
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
export function canCreateNarrowerConcept(context) {
    return hasClass(context.instanceClass, AssetClass.CONCEPT);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tbWFuZFZpc2liaWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDb21tYW5kVmlzaWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDbEUsT0FBTyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFvQnhEOztHQUVHO0FBQ0gsU0FBUyxRQUFRLENBQ2YsYUFBdUMsRUFDdkMsV0FBbUI7SUFFbkIsSUFBSSxDQUFDLGFBQWE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUVqQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUMxQyxDQUFDLENBQUMsYUFBYTtRQUNmLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRXBCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxXQUFXLENBQUMsQ0FBQztBQUMvRSxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGVBQWUsQ0FBQyxhQUF1QztJQUM5RCxPQUFPLFFBQVEsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pHLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsUUFBUSxDQUFDLGFBQXVDO0lBQ3ZELE9BQU8sUUFBUSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDO1FBQ3hDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQztRQUMzQyxRQUFRLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLFNBQVMsQ0FD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Q0FBQztRQUM1QyxPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxZQUFZLENBQUM7SUFDdkMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLHdCQUF3QixDQUFDLE9BQWlDO0lBQ3hFLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzdELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXaWtpTGlua0hlbHBlcnMgfSBmcm9tIFwiLi4vLi4vdXRpbGl0aWVzL1dpa2lMaW5rSGVscGVyc1wiO1xuaW1wb3J0IHsgQXNzZXRDbGFzcywgRWZmb3J0U3RhdHVzIH0gZnJvbSBcIi4uL2NvbnN0YW50c1wiO1xuXG4vKipcbiAqIENvbW1hbmQgVmlzaWJpbGl0eSBVdGlsaXRpZXNcbiAqIENvbnRhaW5zIHB1cmUgZnVuY3Rpb25zIGZvciBkZXRlcm1pbmluZyBjb21tYW5kIGF2YWlsYWJpbGl0eSBiYXNlZCBvbiBhc3NldCBjb250ZXh0XG4gKiBVc2VkIGJ5IGJvdGggQ29tbWFuZE1hbmFnZXIgKGZvciBDb21tYW5kIFBhbGV0dGUpIGFuZCBSZWFjdCBjb21wb25lbnRzIChmb3IgYnV0dG9ucylcbiAqXG4gKiBQYXR0ZXJuOiBTdHJhdGVneSBwYXR0ZXJuIGZvciB2aXNpYmlsaXR5IGNvbmRpdGlvbnNcbiAqIEJlbmVmaXRzOiBEUlksIHRlc3RhYmxlLCBjb25zaXN0ZW50IGJldHdlZW4gVUkgYW5kIGNvbW1hbmRzXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBDb21tYW5kVmlzaWJpbGl0eUNvbnRleHQge1xuICBpbnN0YW5jZUNsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bGw7XG4gIGN1cnJlbnRTdGF0dXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbDtcbiAgbWV0YWRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIGlzQXJjaGl2ZWQ6IGJvb2xlYW47XG4gIGN1cnJlbnRGb2xkZXI6IHN0cmluZztcbiAgZXhwZWN0ZWRGb2xkZXI6IHN0cmluZyB8IG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgaW5zdGFuY2VDbGFzcyBjb250YWlucyBzcGVjaWZpYyBjbGFzc1xuICovXG5mdW5jdGlvbiBoYXNDbGFzcyhcbiAgaW5zdGFuY2VDbGFzczogc3RyaW5nIHwgc3RyaW5nW10gfCBudWxsLFxuICB0YXJnZXRDbGFzczogc3RyaW5nLFxuKTogYm9vbGVhbiB7XG4gIGlmICghaW5zdGFuY2VDbGFzcykgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGNsYXNzZXMgPSBBcnJheS5pc0FycmF5KGluc3RhbmNlQ2xhc3MpXG4gICAgPyBpbnN0YW5jZUNsYXNzXG4gICAgOiBbaW5zdGFuY2VDbGFzc107XG5cbiAgcmV0dXJuIGNsYXNzZXMuc29tZSgoY2xzKSA9PiBXaWtpTGlua0hlbHBlcnMubm9ybWFsaXplKGNscykgPT09IHRhcmdldENsYXNzKTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBpbnN0YW5jZUNsYXNzIGlzIGVtc19fQXJlYSBvciBlbXNfX1Byb2plY3RcbiAqL1xuZnVuY3Rpb24gaXNBcmVhT3JQcm9qZWN0KGluc3RhbmNlQ2xhc3M6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaGFzQ2xhc3MoaW5zdGFuY2VDbGFzcywgQXNzZXRDbGFzcy5BUkVBKSB8fCBoYXNDbGFzcyhpbnN0YW5jZUNsYXNzLCBBc3NldENsYXNzLlBST0pFQ1QpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGluc3RhbmNlQ2xhc3MgaXMgZW1zX19UYXNrLCBlbXNfX1Byb2plY3QsIG9yIGVtc19fTWVldGluZ1xuICovXG5mdW5jdGlvbiBpc0VmZm9ydChpbnN0YW5jZUNsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bGwpOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc0NsYXNzKGluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuVEFTSykgfHxcbiAgICAgICAgIGhhc0NsYXNzKGluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuUFJPSkVDVCkgfHxcbiAgICAgICAgIGhhc0NsYXNzKGluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuTUVFVElORyk7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgY3VycmVudCBzdGF0dXMgaXMgRG9uZVxuICovXG5mdW5jdGlvbiBoYXNTdGF0dXMoXG4gIGN1cnJlbnRTdGF0dXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbCxcbiAgdGFyZ2V0U3RhdHVzOiBzdHJpbmcsXG4pOiBib29sZWFuIHtcbiAgaWYgKCFjdXJyZW50U3RhdHVzKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3Qgc3RhdHVzVmFsdWUgPSBBcnJheS5pc0FycmF5KGN1cnJlbnRTdGF0dXMpXG4gICAgPyBjdXJyZW50U3RhdHVzWzBdXG4gICAgOiBjdXJyZW50U3RhdHVzO1xuXG4gIGlmICghc3RhdHVzVmFsdWUpIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBjbGVhblN0YXR1cyA9IFdpa2lMaW5rSGVscGVycy5ub3JtYWxpemUoc3RhdHVzVmFsdWUpO1xuICByZXR1cm4gY2xlYW5TdGF0dXMgPT09IHRhcmdldFN0YXR1cztcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhc3NldCBpcyBhcmNoaXZlZFxuICogU3VwcG9ydHMgbXVsdGlwbGUgZm9ybWF0czogdHJ1ZSwgXCJ0cnVlXCIsIFwieWVzXCIsIDFcbiAqL1xuZnVuY3Rpb24gaXNBc3NldEFyY2hpdmVkKGlzQXJjaGl2ZWQ6IGFueSk6IGJvb2xlYW4ge1xuICBpZiAoaXNBcmNoaXZlZCA9PT0gdHJ1ZSB8fCBpc0FyY2hpdmVkID09PSAxKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKHR5cGVvZiBpc0FyY2hpdmVkID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgbG93ZXJWYWx1ZSA9IGlzQXJjaGl2ZWQudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gbG93ZXJWYWx1ZSA9PT0gXCJ0cnVlXCIgfHwgbG93ZXJWYWx1ZSA9PT0gXCJ5ZXNcIjtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgbWV0YWRhdGEgaGFzIGVtcHR5IHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gaGFzRW1wdHlQcm9wZXJ0aWVzKG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogYm9vbGVhbiB7XG4gIGlmICghbWV0YWRhdGEgfHwgT2JqZWN0LmtleXMobWV0YWRhdGEpLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiBPYmplY3QudmFsdWVzKG1ldGFkYXRhKS5zb21lKCh2YWx1ZSkgPT4ge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLnRyaW0oKSA9PT0gXCJcIikgcmV0dXJuIHRydWU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKFxuICAgICAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmXG4gICAgICAhQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICAgIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGggPT09IDBcbiAgICApXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGZvbGRlciBuZWVkcyByZXBhaXJcbiAqL1xuZnVuY3Rpb24gbmVlZHNGb2xkZXJSZXBhaXIoXG4gIGN1cnJlbnRGb2xkZXI6IHN0cmluZyxcbiAgZXhwZWN0ZWRGb2xkZXI6IHN0cmluZyB8IG51bGwsXG4pOiBib29sZWFuIHtcbiAgaWYgKCFleHBlY3RlZEZvbGRlcikgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIE5vcm1hbGl6ZSBwYXRocyBmb3IgY29tcGFyaXNvbiAocmVtb3ZlIHRyYWlsaW5nIHNsYXNoZXMpXG4gIGNvbnN0IG5vcm1hbGl6ZWRDdXJyZW50ID0gY3VycmVudEZvbGRlci5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gIGNvbnN0IG5vcm1hbGl6ZWRFeHBlY3RlZCA9IGV4cGVjdGVkRm9sZGVyLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcblxuICByZXR1cm4gbm9ybWFsaXplZEN1cnJlbnQgIT09IG5vcm1hbGl6ZWRFeHBlY3RlZDtcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUHVibGljIEFQSTogQ29tbWFuZCBWaXNpYmlsaXR5IEZ1bmN0aW9uc1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiQ3JlYXRlIFRhc2tcIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBlbXNfX0FyZWEgYW5kIGVtc19fUHJvamVjdCBhc3NldHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkNyZWF0ZVRhc2soY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0FyZWFPclByb2plY3QoY29udGV4dC5pbnN0YW5jZUNsYXNzKTtcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIkNyZWF0ZSBQcm9qZWN0XCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogZW1zX19BcmVhLCBlbXNfX0luaXRpYXRpdmUsIGFuZCBlbXNfX1Byb2plY3QgYXNzZXRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5DcmVhdGVQcm9qZWN0KGNvbnRleHQ6IENvbW1hbmRWaXNpYmlsaXR5Q29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaGFzQ2xhc3MoY29udGV4dC5pbnN0YW5jZUNsYXNzLCBBc3NldENsYXNzLkFSRUEpIHx8XG4gICAgICAgICBoYXNDbGFzcyhjb250ZXh0Lmluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuSU5JVElBVElWRSkgfHxcbiAgICAgICAgIGhhc0NsYXNzKGNvbnRleHQuaW5zdGFuY2VDbGFzcywgQXNzZXRDbGFzcy5QUk9KRUNUKTtcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIkNyZWF0ZSBDaGlsZCBBcmVhXCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogZW1zX19BcmVhIGFzc2V0cyBvbmx5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5DcmVhdGVDaGlsZEFyZWEoY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiBoYXNDbGFzcyhjb250ZXh0Lmluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuQVJFQSk7XG59XG5cbi8qKlxuICogQ2FuIGV4ZWN1dGUgXCJDcmVhdGUgSW5zdGFuY2VcIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBlbXNfX1Rhc2tQcm90b3R5cGUgYW5kIGVtc19fTWVldGluZ1Byb3RvdHlwZSBhc3NldHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkNyZWF0ZUluc3RhbmNlKGNvbnRleHQ6IENvbW1hbmRWaXNpYmlsaXR5Q29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaGFzQ2xhc3MoY29udGV4dC5pbnN0YW5jZUNsYXNzLCBBc3NldENsYXNzLlRBU0tfUFJPVE9UWVBFKSB8fFxuICAgICAgICAgaGFzQ2xhc3MoY29udGV4dC5pbnN0YW5jZUNsYXNzLCBBc3NldENsYXNzLk1FRVRJTkdfUFJPVE9UWVBFKTtcbn1cblxuLyoqXG4gKiBHZXQgdG9kYXkncyBkYXRlIGluIFlZWVktTU0tREQgZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIGdldFRvZGF5RGF0ZVN0cmluZygpOiBzdHJpbmcge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCB5ZWFyID0gbm93LmdldEZ1bGxZZWFyKCk7XG4gIGNvbnN0IG1vbnRoID0gU3RyaW5nKG5vdy5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICBjb25zdCBkYXkgPSBTdHJpbmcobm93LmdldERhdGUoKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tJHtkYXl9YDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBlbXNfX0VmZm9ydF9kYXkgaXMgc2V0IHRvIHRvZGF5J3MgZGF0ZVxuICogSGFuZGxlcyBmb3JtYXRzOiBcIltbWVlZWS1NTS1ERF1dXCIgb3IgW1tZWVlZLU1NLUREXV1cbiAqL1xuZnVuY3Rpb24gaXNQbGFubmVkRm9yVG9kYXkobWV0YWRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgZWZmb3J0RGF5ID0gbWV0YWRhdGEuZW1zX19FZmZvcnRfZGF5O1xuICBpZiAoIWVmZm9ydERheSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IHRvZGF5U3RyaW5nID0gZ2V0VG9kYXlEYXRlU3RyaW5nKCk7XG5cbiAgLy8gSGFuZGxlIHN0cmluZyB2YWx1ZVxuICBpZiAodHlwZW9mIGVmZm9ydERheSA9PT0gXCJzdHJpbmdcIikge1xuICAgIC8vIFJlbW92ZSBxdW90ZXMgYW5kIGJyYWNrZXRzXG4gICAgY29uc3QgY2xlYW5WYWx1ZSA9IGVmZm9ydERheS5yZXBsYWNlKC9bXCInW1xcXV0vZywgXCJcIikudHJpbSgpO1xuICAgIHJldHVybiBjbGVhblZhbHVlID09PSB0b2RheVN0cmluZztcbiAgfVxuXG4gIC8vIEhhbmRsZSBhcnJheSB2YWx1ZSAodGFrZSBmaXJzdCBlbGVtZW50KVxuICBpZiAoQXJyYXkuaXNBcnJheShlZmZvcnREYXkpICYmIGVmZm9ydERheS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY2xlYW5WYWx1ZSA9IFN0cmluZyhlZmZvcnREYXlbMF0pLnJlcGxhY2UoL1tcIidbXFxdXS9nLCBcIlwiKS50cmltKCk7XG4gICAgcmV0dXJuIGNsZWFuVmFsdWUgPT09IHRvZGF5U3RyaW5nO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiUGxhbiBvbiB0b2RheVwiIGNvbW1hbmRcbiAqIEF2YWlsYWJsZSBmb3I6IFRhc2sgYW5kIFByb2plY3QgKGFueSBlZmZvcnQpIHRoYXQgYXJlIE5PVCBhbHJlYWR5IHBsYW5uZWQgZm9yIHRvZGF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5QbGFuT25Ub2RheShjb250ZXh0OiBDb21tYW5kVmlzaWJpbGl0eUNvbnRleHQpOiBib29sZWFuIHtcbiAgaWYgKCFpc0VmZm9ydChjb250ZXh0Lmluc3RhbmNlQ2xhc3MpKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gSGlkZSBidXR0b24gaWYgYWxyZWFkeSBwbGFubmVkIGZvciB0b2RheVxuICBpZiAoaXNQbGFubmVkRm9yVG9kYXkoY29udGV4dC5tZXRhZGF0YSkpIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIlBsYW4gZm9yIEV2ZW5pbmdcIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBUYXNrIG9yIE1lZXRpbmcgd2l0aCBCYWNrbG9nIHN0YXR1c1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuUGxhbkZvckV2ZW5pbmcoY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIGlmICghaGFzQ2xhc3MoY29udGV4dC5pbnN0YW5jZUNsYXNzLCBBc3NldENsYXNzLlRBU0spICYmICFoYXNDbGFzcyhjb250ZXh0Lmluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuTUVFVElORykpIHJldHVybiBmYWxzZTtcblxuICAvLyBTaG93IG9ubHkgZm9yIEJhY2tsb2cgc3RhdHVzXG4gIHJldHVybiBoYXNTdGF0dXMoY29udGV4dC5jdXJyZW50U3RhdHVzLCBFZmZvcnRTdGF0dXMuQkFDS0xPRyk7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgZW1zX19FZmZvcnRfZGF5IHByb3BlcnR5IGV4aXN0c1xuICovXG5mdW5jdGlvbiBoYXNFZmZvcnREYXkobWV0YWRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgZWZmb3J0RGF5ID0gbWV0YWRhdGEuZW1zX19FZmZvcnRfZGF5O1xuICBpZiAoIWVmZm9ydERheSkgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgZWZmb3J0RGF5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgY2xlYW5WYWx1ZSA9IGVmZm9ydERheS5yZXBsYWNlKC9bXCInW1xcXV0vZywgXCJcIikudHJpbSgpO1xuICAgIHJldHVybiBjbGVhblZhbHVlLmxlbmd0aCA+IDA7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShlZmZvcnREYXkpICYmIGVmZm9ydERheS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY2xlYW5WYWx1ZSA9IFN0cmluZyhlZmZvcnREYXlbMF0pLnJlcGxhY2UoL1tcIidbXFxdXS9nLCBcIlwiKS50cmltKCk7XG4gICAgcmV0dXJuIGNsZWFuVmFsdWUubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIlNoaWZ0IERheSBCYWNrd2FyZFwiIGNvbW1hbmRcbiAqIEF2YWlsYWJsZSBmb3I6IFRhc2sgYW5kIFByb2plY3Qgd2l0aCBlbXNfX0VmZm9ydF9kYXkgcHJvcGVydHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhblNoaWZ0RGF5QmFja3dhcmQoY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIGlmICghaXNFZmZvcnQoY29udGV4dC5pbnN0YW5jZUNsYXNzKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gaGFzRWZmb3J0RGF5KGNvbnRleHQubWV0YWRhdGEpO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiU2hpZnQgRGF5IEZvcndhcmRcIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBUYXNrIGFuZCBQcm9qZWN0IHdpdGggZW1zX19FZmZvcnRfZGF5IHByb3BlcnR5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5TaGlmdERheUZvcndhcmQoY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIGlmICghaXNFZmZvcnQoY29udGV4dC5pbnN0YW5jZUNsYXNzKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gaGFzRWZmb3J0RGF5KGNvbnRleHQubWV0YWRhdGEpO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiU2V0IERyYWZ0IFN0YXR1c1wiIGNvbW1hbmRcbiAqIEF2YWlsYWJsZSBmb3I6IFRhc2svUHJvamVjdCB3aXRob3V0IGFueSBzdGF0dXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhblNldERyYWZ0U3RhdHVzKGNvbnRleHQ6IENvbW1hbmRWaXNpYmlsaXR5Q29udGV4dCk6IGJvb2xlYW4ge1xuICBpZiAoIWlzRWZmb3J0KGNvbnRleHQuaW5zdGFuY2VDbGFzcykpIHJldHVybiBmYWxzZTtcblxuICAvLyBTaG93IG9ubHkgd2hlbiBzdGF0dXMgaXMgbm90IHNldFxuICByZXR1cm4gIWNvbnRleHQuY3VycmVudFN0YXR1cztcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIk1vdmUgdG8gQmFja2xvZ1wiIGNvbW1hbmRcbiAqIEF2YWlsYWJsZSBmb3I6IFRhc2svUHJvamVjdCB3aXRoIERyYWZ0IHN0YXR1c1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuTW92ZVRvQmFja2xvZyhjb250ZXh0OiBDb21tYW5kVmlzaWJpbGl0eUNvbnRleHQpOiBib29sZWFuIHtcbiAgaWYgKCFpc0VmZm9ydChjb250ZXh0Lmluc3RhbmNlQ2xhc3MpKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gU2hvdyBvbmx5IGZvciBEcmFmdCBzdGF0dXNcbiAgcmV0dXJuIGhhc1N0YXR1cyhjb250ZXh0LmN1cnJlbnRTdGF0dXMsIEVmZm9ydFN0YXR1cy5EUkFGVCk7XG59XG5cbi8qKlxuICogQ2FuIGV4ZWN1dGUgXCJNb3ZlIHRvIEFuYWx5c2lzXCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogUHJvamVjdCB3aXRoIEJhY2tsb2cgc3RhdHVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5Nb3ZlVG9BbmFseXNpcyhjb250ZXh0OiBDb21tYW5kVmlzaWJpbGl0eUNvbnRleHQpOiBib29sZWFuIHtcbiAgaWYgKCFoYXNDbGFzcyhjb250ZXh0Lmluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuUFJPSkVDVCkpIHJldHVybiBmYWxzZTtcblxuICAvLyBTaG93IG9ubHkgZm9yIEJhY2tsb2cgc3RhdHVzXG4gIHJldHVybiBoYXNTdGF0dXMoY29udGV4dC5jdXJyZW50U3RhdHVzLCBFZmZvcnRTdGF0dXMuQkFDS0xPRyk7XG59XG5cbi8qKlxuICogQ2FuIGV4ZWN1dGUgXCJNb3ZlIHRvIFRvRG9cIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBQcm9qZWN0IHdpdGggQW5hbHlzaXMgc3RhdHVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5Nb3ZlVG9Ub0RvKGNvbnRleHQ6IENvbW1hbmRWaXNpYmlsaXR5Q29udGV4dCk6IGJvb2xlYW4ge1xuICBpZiAoIWhhc0NsYXNzKGNvbnRleHQuaW5zdGFuY2VDbGFzcywgQXNzZXRDbGFzcy5QUk9KRUNUKSkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIFNob3cgb25seSBmb3IgQW5hbHlzaXMgc3RhdHVzXG4gIHJldHVybiBoYXNTdGF0dXMoY29udGV4dC5jdXJyZW50U3RhdHVzLCBFZmZvcnRTdGF0dXMuQU5BTFlTSVMpO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiU3RhcnQgRWZmb3J0XCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogVGFzayBvciBNZWV0aW5nIHdpdGggQmFja2xvZyBzdGF0dXMgT1IgUHJvamVjdCB3aXRoIFRvRG8gc3RhdHVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5TdGFydEVmZm9ydChjb250ZXh0OiBDb21tYW5kVmlzaWJpbGl0eUNvbnRleHQpOiBib29sZWFuIHtcbiAgaWYgKCFpc0VmZm9ydChjb250ZXh0Lmluc3RhbmNlQ2xhc3MpKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gVGFzayBhbmQgTWVldGluZzogQmFja2xvZyDihpIgRG9pbmdcbiAgaWYgKGhhc0NsYXNzKGNvbnRleHQuaW5zdGFuY2VDbGFzcywgQXNzZXRDbGFzcy5UQVNLKSB8fCBoYXNDbGFzcyhjb250ZXh0Lmluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuTUVFVElORykpIHtcbiAgICByZXR1cm4gaGFzU3RhdHVzKGNvbnRleHQuY3VycmVudFN0YXR1cywgRWZmb3J0U3RhdHVzLkJBQ0tMT0cpO1xuICB9XG5cbiAgLy8gUHJvamVjdDogVG9EbyDihpIgRG9pbmdcbiAgaWYgKGhhc0NsYXNzKGNvbnRleHQuaW5zdGFuY2VDbGFzcywgQXNzZXRDbGFzcy5QUk9KRUNUKSkge1xuICAgIHJldHVybiBoYXNTdGF0dXMoY29udGV4dC5jdXJyZW50U3RhdHVzLCBFZmZvcnRTdGF0dXMuVE9ETyk7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ2FuIGV4ZWN1dGUgXCJNYXJrIGFzIERvbmVcIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBUYXNrL1Byb2plY3Qgd2l0aCBEb2luZyBzdGF0dXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbk1hcmtEb25lKGNvbnRleHQ6IENvbW1hbmRWaXNpYmlsaXR5Q29udGV4dCk6IGJvb2xlYW4ge1xuICBpZiAoIWlzRWZmb3J0KGNvbnRleHQuaW5zdGFuY2VDbGFzcykpIHJldHVybiBmYWxzZTtcblxuICAvLyBTaG93IG9ubHkgZm9yIERvaW5nIHN0YXR1c1xuICByZXR1cm4gaGFzU3RhdHVzKGNvbnRleHQuY3VycmVudFN0YXR1cywgRWZmb3J0U3RhdHVzLkRPSU5HKTtcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIlRyYXNoXCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogVGFzay9Qcm9qZWN0IHdpdGhvdXQgVHJhc2hlZCBvciBEb25lIHN0YXR1c1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuVHJhc2hFZmZvcnQoY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIGlmICghaXNFZmZvcnQoY29udGV4dC5pbnN0YW5jZUNsYXNzKSkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIFNob3cgZm9yIGVmZm9ydHMgd2l0aG91dCBzdGF0dXNcbiAgaWYgKCFjb250ZXh0LmN1cnJlbnRTdGF0dXMpIHJldHVybiB0cnVlO1xuXG4gIC8vIEhpZGUgaWYgc3RhdHVzIGlzIFRyYXNoZWQgb3IgRG9uZVxuICBjb25zdCBzdGF0dXNlcyA9IEFycmF5LmlzQXJyYXkoY29udGV4dC5jdXJyZW50U3RhdHVzKVxuICAgID8gY29udGV4dC5jdXJyZW50U3RhdHVzXG4gICAgOiBbY29udGV4dC5jdXJyZW50U3RhdHVzXTtcblxuICBjb25zdCBoYXNUcmFzaGVkT3JEb25lID0gc3RhdHVzZXMuc29tZSgoc3RhdHVzKSA9PiB7XG4gICAgY29uc3QgY2xlYW5TdGF0dXMgPSBXaWtpTGlua0hlbHBlcnMubm9ybWFsaXplKHN0YXR1cyk7XG4gICAgcmV0dXJuIChcbiAgICAgIGNsZWFuU3RhdHVzID09PSBFZmZvcnRTdGF0dXMuVFJBU0hFRCB8fFxuICAgICAgY2xlYW5TdGF0dXMgPT09IEVmZm9ydFN0YXR1cy5ET05FXG4gICAgKTtcbiAgfSk7XG5cbiAgcmV0dXJuICFoYXNUcmFzaGVkT3JEb25lO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiQXJjaGl2ZSBUYXNrXCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogQW55IGFzc2V0IHRoYXQgaXMgbm90IGFscmVhZHkgYXJjaGl2ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkFyY2hpdmVUYXNrKGNvbnRleHQ6IENvbW1hbmRWaXNpYmlsaXR5Q29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gIWlzQXNzZXRBcmNoaXZlZChjb250ZXh0LmlzQXJjaGl2ZWQpO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiQ2xlYW4gRW1wdHkgUHJvcGVydGllc1wiIGNvbW1hbmRcbiAqIEF2YWlsYWJsZSBmb3I6IEFueSBhc3NldCB3aXRoIGVtcHR5IHByb3BlcnRpZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkNsZWFuUHJvcGVydGllcyhcbiAgY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0LFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBoYXNFbXB0eVByb3BlcnRpZXMoY29udGV4dC5tZXRhZGF0YSk7XG59XG5cbi8qKlxuICogQ2FuIGV4ZWN1dGUgXCJSZXBhaXIgRm9sZGVyXCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogQW55IGFzc2V0IGluIHdyb25nIGZvbGRlciAoYmFzZWQgb24gZXhvX19Bc3NldF9pc0RlZmluZWRCeSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhblJlcGFpckZvbGRlcihjb250ZXh0OiBDb21tYW5kVmlzaWJpbGl0eUNvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5lZWRzRm9sZGVyUmVwYWlyKGNvbnRleHQuY3VycmVudEZvbGRlciwgY29udGV4dC5leHBlY3RlZEZvbGRlcik7XG59XG5cbi8qKlxuICogQ2FuIGV4ZWN1dGUgXCJSZW5hbWUgdG8gVUlEXCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogQW55IGFzc2V0IHdoZXJlIGZpbGVuYW1lIGRvZXNuJ3QgbWF0Y2ggZXhvX19Bc3NldF91aWRcbiAqIEV4Y2x1ZGVkOiBpbXNfX0NvbmNlcHQgYXNzZXRzIChjb25jZXB0cyBzaG91bGQga2VlcCB0aGVpciBzZW1hbnRpYyBuYW1lcylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhblJlbmFtZVRvVWlkKFxuICBjb250ZXh0OiBDb21tYW5kVmlzaWJpbGl0eUNvbnRleHQsXG4gIGN1cnJlbnRGaWxlbmFtZTogc3RyaW5nLFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHVpZCA9IGNvbnRleHQubWV0YWRhdGEuZXhvX19Bc3NldF91aWQ7XG4gIGlmICghdWlkKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGhhc0NsYXNzKGNvbnRleHQuaW5zdGFuY2VDbGFzcywgQXNzZXRDbGFzcy5DT05DRVBUKSkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiBjdXJyZW50RmlsZW5hbWUgIT09IHVpZDtcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIlZvdGUgb24gRWZmb3J0XCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogVGFzayBhbmQgUHJvamVjdCBlZmZvcnRzIChub3QgYXJjaGl2ZWQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5Wb3RlT25FZmZvcnQoY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIGlmICghaXNFZmZvcnQoY29udGV4dC5pbnN0YW5jZUNsYXNzKSkgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Fzc2V0QXJjaGl2ZWQoY29udGV4dC5pc0FyY2hpdmVkKSkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiUm9sbGJhY2sgU3RhdHVzXCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogRWZmb3J0cyB3aXRoIG5vbi1udWxsLCBub24tVHJhc2hlZCBzdGF0dXMgKHdvcmtmbG93LWJhc2VkIHJvbGxiYWNrKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuUm9sbGJhY2tTdGF0dXMoY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIGlmICghaXNFZmZvcnQoY29udGV4dC5pbnN0YW5jZUNsYXNzKSkgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Fzc2V0QXJjaGl2ZWQoY29udGV4dC5pc0FyY2hpdmVkKSkgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICghY29udGV4dC5jdXJyZW50U3RhdHVzKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3Qgc3RhdHVzVmFsdWUgPSBBcnJheS5pc0FycmF5KGNvbnRleHQuY3VycmVudFN0YXR1cylcbiAgICA/IGNvbnRleHQuY3VycmVudFN0YXR1c1swXVxuICAgIDogY29udGV4dC5jdXJyZW50U3RhdHVzO1xuXG4gIGlmICghc3RhdHVzVmFsdWUpIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBjbGVhblN0YXR1cyA9IFdpa2lMaW5rSGVscGVycy5ub3JtYWxpemUoc3RhdHVzVmFsdWUpO1xuXG4gIGlmIChjbGVhblN0YXR1cyA9PT0gRWZmb3J0U3RhdHVzLlRSQVNIRUQpIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIkNyZWF0ZSBSZWxhdGVkIFRhc2tcIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBlbXNfX1Rhc2sgYXNzZXRzIChub3QgYXJjaGl2ZWQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5DcmVhdGVSZWxhdGVkVGFzayhjb250ZXh0OiBDb21tYW5kVmlzaWJpbGl0eUNvbnRleHQpOiBib29sZWFuIHtcbiAgaWYgKCFoYXNDbGFzcyhjb250ZXh0Lmluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuVEFTSykpIHJldHVybiBmYWxzZTtcblxuICAvLyBEb24ndCBzaG93IGJ1dHRvbiBpZiBhcmNoaXZlZFxuICBpZiAoaXNBc3NldEFyY2hpdmVkKGNvbnRleHQuaXNBcmNoaXZlZCkpIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDYW4gZXhlY3V0ZSBcIlNldCBBY3RpdmUgRm9jdXNcIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBlbXNfX0FyZWEgYXNzZXRzIG9ubHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhblNldEFjdGl2ZUZvY3VzKGNvbnRleHQ6IENvbW1hbmRWaXNpYmlsaXR5Q29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaGFzQ2xhc3MoY29udGV4dC5pbnN0YW5jZUNsYXNzLCBBc3NldENsYXNzLkFSRUEpO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiQ29weSBMYWJlbCB0byBBbGlhc2VzXCIgY29tbWFuZFxuICogQXZhaWxhYmxlIGZvcjogQXNzZXRzIHdpdGggZXhvX19Bc3NldF9sYWJlbCB0aGF0IGRvbid0IGhhdmUgdGhpcyBsYWJlbCBpbiBhbGlhc2VzIHlldFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuQ29weUxhYmVsVG9BbGlhc2VzKGNvbnRleHQ6IENvbW1hbmRWaXNpYmlsaXR5Q29udGV4dCk6IGJvb2xlYW4ge1xuICBjb25zdCBsYWJlbCA9IGNvbnRleHQubWV0YWRhdGEuZXhvX19Bc3NldF9sYWJlbDtcbiAgaWYgKCFsYWJlbCB8fCB0eXBlb2YgbGFiZWwgIT09IFwic3RyaW5nXCIgfHwgbGFiZWwudHJpbSgpID09PSBcIlwiKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3QgdHJpbW1lZExhYmVsID0gbGFiZWwudHJpbSgpO1xuICBjb25zdCBhbGlhc2VzID0gY29udGV4dC5tZXRhZGF0YS5hbGlhc2VzO1xuXG4gIGlmICghYWxpYXNlcykgcmV0dXJuIHRydWU7XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGFsaWFzZXMpKSByZXR1cm4gdHJ1ZTtcblxuICBpZiAoYWxpYXNlcy5sZW5ndGggPT09IDApIHJldHVybiB0cnVlO1xuXG4gIHJldHVybiAhYWxpYXNlcy5zb21lKChhbGlhcykgPT4ge1xuICAgIGlmICh0eXBlb2YgYWxpYXMgIT09IFwic3RyaW5nXCIpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gYWxpYXMudHJpbSgpID09PSB0cmltbWVkTGFiZWw7XG4gIH0pO1xufVxuXG4vKipcbiAqIENhbiBleGVjdXRlIFwiQ3JlYXRlIE5hcnJvd2VyIENvbmNlcHRcIiBjb21tYW5kXG4gKiBBdmFpbGFibGUgZm9yOiBpbXNfX0NvbmNlcHQgYXNzZXRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5DcmVhdGVOYXJyb3dlckNvbmNlcHQoY29udGV4dDogQ29tbWFuZFZpc2liaWxpdHlDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiBoYXNDbGFzcyhjb250ZXh0Lmluc3RhbmNlQ2xhc3MsIEFzc2V0Q2xhc3MuQ09OQ0VQVCk7XG59XG4iXX0=