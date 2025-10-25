"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningService = void 0;
const FrontmatterService_1 = require("../../infrastructure/utilities/FrontmatterService");
const DateFormatter_1 = require("../../infrastructure/utilities/DateFormatter");
class PlanningService {
    constructor(fs) {
        this.fs = fs;
        this.frontmatterService = new FrontmatterService_1.FrontmatterService();
    }
    async planOnToday(taskFilePath) {
        const content = await this.fs.readFile(taskFilePath);
        const todayWikilink = DateFormatter_1.DateFormatter.getTodayWikilink();
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_day", todayWikilink);
        await this.fs.updateFile(taskFilePath, updated);
    }
    async planOnDate(taskFilePath, date) {
        const content = await this.fs.readFile(taskFilePath);
        const dateWikilink = DateFormatter_1.DateFormatter.toDateWikilink(date);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_day", dateWikilink);
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
}
exports.PlanningService = PlanningService;
