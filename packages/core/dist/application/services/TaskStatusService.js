"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatusService = void 0;
const FrontmatterService_1 = require("../../infrastructure/utilities/FrontmatterService");
const DateFormatter_1 = require("../../infrastructure/utilities/DateFormatter");
const constants_1 = require("../../domain/constants");
class TaskStatusService {
    constructor(fs) {
        this.fs = fs;
        this.frontmatterService = new FrontmatterService_1.FrontmatterService();
    }
    async setDraftStatus(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_status", '"[[ems__EffortStatusDraft]]"');
        await this.fs.updateFile(taskFilePath, updated);
    }
    async moveToBacklog(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_status", '"[[ems__EffortStatusBacklog]]"');
        await this.fs.updateFile(taskFilePath, updated);
    }
    async moveToAnalysis(projectFilePath) {
        const content = await this.fs.readFile(projectFilePath);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_status", '"[[ems__EffortStatusAnalysis]]"');
        await this.fs.updateFile(projectFilePath, updated);
    }
    async moveToToDo(projectFilePath) {
        const content = await this.fs.readFile(projectFilePath);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_status", '"[[ems__EffortStatusToDo]]"');
        await this.fs.updateFile(projectFilePath, updated);
    }
    async startEffort(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(new Date());
        let updated = this.frontmatterService.updateProperty(content, "ems__Effort_status", '"[[ems__EffortStatusDoing]]"');
        updated = this.frontmatterService.updateProperty(updated, "ems__Effort_startTimestamp", timestamp);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async markTaskAsDone(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(new Date());
        let updated = this.frontmatterService.updateProperty(content, "ems__Effort_status", '"[[ems__EffortStatusDone]]"');
        updated = this.frontmatterService.updateProperty(updated, "ems__Effort_endTimestamp", timestamp);
        updated = this.frontmatterService.updateProperty(updated, "ems__Effort_resolutionTimestamp", timestamp);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async syncEffortEndTimestamp(taskFilePath, date) {
        const content = await this.fs.readFile(taskFilePath);
        const targetDate = date || new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(targetDate);
        let updated = this.frontmatterService.updateProperty(content, "ems__Effort_endTimestamp", timestamp);
        updated = this.frontmatterService.updateProperty(updated, "ems__Effort_resolutionTimestamp", timestamp);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async trashEffort(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(new Date());
        let updated = this.frontmatterService.updateProperty(content, "ems__Effort_status", '"[[ems__EffortStatusTrashed]]"');
        updated = this.frontmatterService.updateProperty(updated, "ems__Effort_resolutionTimestamp", timestamp);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async archiveTask(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const updated = this.frontmatterService.updateProperty(content, "archived", "true");
        await this.fs.updateFile(taskFilePath, updated);
    }
    async planOnToday(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const todayWikilink = DateFormatter_1.DateFormatter.getTodayWikilink();
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_day", todayWikilink);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async planForEvening(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const evening = new Date();
        evening.setHours(19, 0, 0, 0);
        const eveningTimestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(evening);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_plannedStartTimestamp", eveningTimestamp);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async shiftDayBackward(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const currentEffortDay = this.extractEffortDay(content);
        if (!currentEffortDay) {
            throw new Error("ems__Effort_day property not found");
        }
        const currentDate = this.parseDateFromWikilink(currentEffortDay);
        if (!currentDate) {
            throw new Error("Invalid date format in ems__Effort_day");
        }
        const newDate = DateFormatter_1.DateFormatter.addDays(currentDate, -1);
        const newWikilink = DateFormatter_1.DateFormatter.toDateWikilink(newDate);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_day", newWikilink);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async shiftDayForward(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const currentEffortDay = this.extractEffortDay(content);
        if (!currentEffortDay) {
            throw new Error("ems__Effort_day property not found");
        }
        const currentDate = this.parseDateFromWikilink(currentEffortDay);
        if (!currentDate) {
            throw new Error("Invalid date format in ems__Effort_day");
        }
        const newDate = DateFormatter_1.DateFormatter.addDays(currentDate, 1);
        const newWikilink = DateFormatter_1.DateFormatter.toDateWikilink(newDate);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_day", newWikilink);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async rollbackStatus(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const currentStatus = this.extractCurrentStatus(content);
        const instanceClass = this.extractInstanceClass(content);
        if (!currentStatus) {
            throw new Error("No current status to rollback from");
        }
        const previousStatus = this.getPreviousStatusFromWorkflow(currentStatus, instanceClass);
        if (previousStatus === undefined) {
            throw new Error("Cannot rollback from current status");
        }
        let updated = content;
        if (previousStatus === null) {
            updated = this.frontmatterService.removeProperty(updated, "ems__Effort_status");
        }
        else {
            updated = this.frontmatterService.updateProperty(updated, "ems__Effort_status", previousStatus);
        }
        const normalizedStatus = currentStatus.replace(/["'[\]]/g, "").trim();
        if (normalizedStatus === constants_1.EffortStatus.DONE) {
            updated = this.frontmatterService.removeProperty(updated, "ems__Effort_endTimestamp");
            updated = this.frontmatterService.removeProperty(updated, "ems__Effort_resolutionTimestamp");
        }
        else if (normalizedStatus === constants_1.EffortStatus.DOING) {
            updated = this.frontmatterService.removeProperty(updated, "ems__Effort_startTimestamp");
        }
        await this.fs.updateFile(taskFilePath, updated);
    }
    parseDateFromWikilink(wikilink) {
        const cleanValue = wikilink.replace(/["'[\]]/g, "").trim();
        const date = new Date(cleanValue);
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    }
    extractEffortDay(content) {
        const parsed = this.frontmatterService.parse(content);
        if (!parsed.exists)
            return null;
        return this.frontmatterService.getPropertyValue(parsed.content, "ems__Effort_day");
    }
    extractCurrentStatus(content) {
        const parsed = this.frontmatterService.parse(content);
        if (!parsed.exists)
            return null;
        return this.frontmatterService.getPropertyValue(parsed.content, "ems__Effort_status");
    }
    getPreviousStatusFromWorkflow(currentStatus, instanceClass) {
        const normalizedStatus = currentStatus.replace(/["'[\]]/g, "").trim();
        if (normalizedStatus === constants_1.EffortStatus.DRAFT) {
            return null;
        }
        if (normalizedStatus === constants_1.EffortStatus.BACKLOG) {
            return `"[[${constants_1.EffortStatus.DRAFT}]]"`;
        }
        if (normalizedStatus === constants_1.EffortStatus.ANALYSIS) {
            return `"[[${constants_1.EffortStatus.BACKLOG}]]"`;
        }
        if (normalizedStatus === constants_1.EffortStatus.TODO) {
            return `"[[${constants_1.EffortStatus.ANALYSIS}]]"`;
        }
        if (normalizedStatus === constants_1.EffortStatus.DOING) {
            const isProject = this.hasInstanceClass(instanceClass, constants_1.AssetClass.PROJECT);
            return isProject
                ? `"[[${constants_1.EffortStatus.TODO}]]"`
                : `"[[${constants_1.EffortStatus.BACKLOG}]]"`;
        }
        if (normalizedStatus === constants_1.EffortStatus.DONE) {
            return `"[[${constants_1.EffortStatus.DOING}]]"`;
        }
        return undefined;
    }
    hasInstanceClass(instanceClass, targetClass) {
        if (!instanceClass)
            return false;
        const classes = Array.isArray(instanceClass)
            ? instanceClass
            : [instanceClass];
        return classes.some((cls) => cls.replace(/["'[\]]/g, "").trim() === targetClass);
    }
    extractInstanceClass(content) {
        const parsed = this.frontmatterService.parse(content);
        if (!parsed.exists)
            return null;
        const arrayMatch = parsed.content.match(/exo__Instance_class:\s*\n((?:\s*-\s*.*\n?)+)/);
        if (arrayMatch) {
            const lines = arrayMatch[1].split("\n").filter(l => l.trim());
            return lines.map((line) => line.replace(/^\s*-\s*/, "").trim());
        }
        return this.frontmatterService.getPropertyValue(parsed.content, "exo__Instance_class");
    }
}
exports.TaskStatusService = TaskStatusService;
