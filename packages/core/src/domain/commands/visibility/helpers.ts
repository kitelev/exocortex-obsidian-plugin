import { WikiLinkHelpers } from "../../../utilities/WikiLinkHelpers";
import { AssetClass } from "../../constants";

/**
 * Command Visibility Helper Functions
 *
 * Pure utility functions used across visibility rule files.
 * These functions handle common checks for instance classes, status, and metadata.
 */

/**
 * Check if instanceClass contains specific class
 */
export function hasClass(
  instanceClass: string | string[] | null,
  targetClass: string,
): boolean {
  if (!instanceClass) return false;

  const classes = Array.isArray(instanceClass)
    ? instanceClass
    : [instanceClass];

  return classes.some((cls) => WikiLinkHelpers.normalize(cls) === targetClass);
}

/**
 * Check if instanceClass is ems__Area or ems__Project
 */
export function isAreaOrProject(instanceClass: string | string[] | null): boolean {
  return (
    hasClass(instanceClass, AssetClass.AREA) ||
    hasClass(instanceClass, AssetClass.PROJECT)
  );
}

/**
 * Check if instanceClass is ems__Task, ems__Project, or ems__Meeting
 */
export function isEffort(instanceClass: string | string[] | null): boolean {
  return (
    hasClass(instanceClass, AssetClass.TASK) ||
    hasClass(instanceClass, AssetClass.PROJECT) ||
    hasClass(instanceClass, AssetClass.MEETING)
  );
}

/**
 * Check if current status matches target status
 */
export function hasStatus(
  currentStatus: string | string[] | null,
  targetStatus: string,
): boolean {
  if (!currentStatus) return false;

  const statusValue = Array.isArray(currentStatus)
    ? currentStatus[0]
    : currentStatus;

  if (!statusValue) return false;

  const cleanStatus = WikiLinkHelpers.normalize(statusValue);
  return cleanStatus === targetStatus;
}

/**
 * Check if asset is archived
 * Supports multiple formats: true, "true", "yes", 1
 */
export function isAssetArchived(isArchived: any): boolean {
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
export function hasEmptyProperties(metadata: Record<string, any>): boolean {
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
export function needsFolderRepair(
  currentFolder: string,
  expectedFolder: string | null,
): boolean {
  if (!expectedFolder) return false;

  const normalizedCurrent = currentFolder.replace(/\/$/, "");
  const normalizedExpected = expectedFolder.replace(/\/$/, "");

  return normalizedCurrent !== normalizedExpected;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if ems__Effort_plannedStartTimestamp is set to today's date
 * Handles timestamp format: YYYY-MM-DDTHH:MM:SS
 */
export function isPlannedForToday(metadata: Record<string, any>): boolean {
  const plannedTimestamp = metadata.ems__Effort_plannedStartTimestamp;
  if (!plannedTimestamp) return false;

  const todayString = getTodayDateString();

  if (typeof plannedTimestamp === "string") {
    const datePart = plannedTimestamp.split("T")[0];
    return datePart === todayString;
  }

  if (Array.isArray(plannedTimestamp) && plannedTimestamp.length > 0) {
    const datePart = String(plannedTimestamp[0]).split("T")[0];
    return datePart === todayString;
  }

  return false;
}

/**
 * Check if ems__Effort_plannedStartTimestamp property exists
 */
export function hasPlannedStartTimestamp(metadata: Record<string, any>): boolean {
  const plannedTimestamp = metadata.ems__Effort_plannedStartTimestamp;
  if (!plannedTimestamp) return false;

  if (typeof plannedTimestamp === "string") {
    return plannedTimestamp.trim().length > 0;
  }

  if (Array.isArray(plannedTimestamp) && plannedTimestamp.length > 0) {
    const value = String(plannedTimestamp[0]).trim();
    return value.length > 0;
  }

  return false;
}

/**
 * Extract date string from pn__DailyNote_day property
 * Handles wiki-link format: [[2025-11-11]] -> 2025-11-11
 */
export function extractDailyNoteDate(metadata: Record<string, any>): string | null {
  const dayProperty = metadata.pn__DailyNote_day;
  if (!dayProperty) return null;

  if (typeof dayProperty === "string") {
    const wikiLinkMatch = dayProperty.match(/\[\[(.+?)\]\]/);
    return wikiLinkMatch ? wikiLinkMatch[1] : dayProperty;
  }

  if (Array.isArray(dayProperty) && dayProperty.length > 0) {
    const firstValue = String(dayProperty[0]);
    const wikiLinkMatch = firstValue.match(/\[\[(.+?)\]\]/);
    return wikiLinkMatch ? wikiLinkMatch[1] : firstValue;
  }

  return null;
}

/**
 * Check if current date is greater than or equal to DailyNote date
 */
export function isCurrentDateGteDay(dailyNoteDate: string): boolean {
  const today = getTodayDateString();
  return today >= dailyNoteDate;
}
