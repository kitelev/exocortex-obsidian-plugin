"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningService = void 0;
const FrontmatterService_1 = require("../utilities/FrontmatterService");
const DateFormatter_1 = require("../utilities/DateFormatter");
class PlanningService {
    constructor(vault) {
        this.vault = vault;
        this.frontmatterService = new FrontmatterService_1.FrontmatterService();
    }
    async planOnToday(taskPath) {
        const file = this.vault.getAbstractFileByPath(taskPath);
        if (!file || !this.isFile(file)) {
            throw new Error(`File not found: ${taskPath}`);
        }
        const content = await this.vault.read(file);
        const todayWikilink = DateFormatter_1.DateFormatter.getTodayWikilink();
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_day", todayWikilink);
        await this.vault.modify(file, updated);
    }
    isFile(file) {
        return "basename" in file;
    }
}
exports.PlanningService = PlanningService;
