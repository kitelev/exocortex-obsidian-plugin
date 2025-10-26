"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusTimestampService = void 0;
const FrontmatterService_1 = require("./FrontmatterService");
const DateFormatter_1 = require("../utilities/DateFormatter");
class StatusTimestampService {
    constructor(vault) {
        this.vault = vault;
        this.frontmatterService = new FrontmatterService_1.FrontmatterService();
    }
    async addStartTimestamp(taskFile) {
        const content = await this.vault.read(taskFile);
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(new Date());
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_startTimestamp", timestamp);
        await this.vault.modify(taskFile, updated);
    }
    async addEndTimestamp(taskFile, date) {
        const content = await this.vault.read(taskFile);
        const targetDate = date || new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(targetDate);
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_endTimestamp", timestamp);
        await this.vault.modify(taskFile, updated);
    }
    async addResolutionTimestamp(taskFile) {
        const content = await this.vault.read(taskFile);
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(new Date());
        const updated = this.frontmatterService.updateProperty(content, "ems__Effort_resolutionTimestamp", timestamp);
        await this.vault.modify(taskFile, updated);
    }
    async addEndAndResolutionTimestamps(taskFile, date) {
        const content = await this.vault.read(taskFile);
        const targetDate = date || new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(targetDate);
        let updated = this.frontmatterService.updateProperty(content, "ems__Effort_endTimestamp", timestamp);
        updated = this.frontmatterService.updateProperty(updated, "ems__Effort_resolutionTimestamp", timestamp);
        await this.vault.modify(taskFile, updated);
    }
    async removeStartTimestamp(taskFile) {
        const content = await this.vault.read(taskFile);
        const updated = this.frontmatterService.removeProperty(content, "ems__Effort_startTimestamp");
        await this.vault.modify(taskFile, updated);
    }
    async removeEndTimestamp(taskFile) {
        const content = await this.vault.read(taskFile);
        const updated = this.frontmatterService.removeProperty(content, "ems__Effort_endTimestamp");
        await this.vault.modify(taskFile, updated);
    }
    async removeResolutionTimestamp(taskFile) {
        const content = await this.vault.read(taskFile);
        const updated = this.frontmatterService.removeProperty(content, "ems__Effort_resolutionTimestamp");
        await this.vault.modify(taskFile, updated);
    }
    async removeEndAndResolutionTimestamps(taskFile) {
        const content = await this.vault.read(taskFile);
        let updated = this.frontmatterService.removeProperty(content, "ems__Effort_endTimestamp");
        updated = this.frontmatterService.removeProperty(updated, "ems__Effort_resolutionTimestamp");
        await this.vault.modify(taskFile, updated);
    }
}
exports.StatusTimestampService = StatusTimestampService;
