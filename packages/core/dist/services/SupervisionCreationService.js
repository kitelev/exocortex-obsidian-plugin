"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisionCreationService = void 0;
const uuid_1 = require("uuid");
const DateFormatter_1 = require("../utilities/DateFormatter");
class SupervisionCreationService {
    constructor(vault) {
        this.vault = vault;
    }
    async createSupervision(formData) {
        const uid = (0, uuid_1.v4)();
        const fileName = `${uid}.md`;
        const frontmatter = this.generateFrontmatter(uid);
        const body = this.generateBody(formData);
        const fileContent = this.buildFileContent(frontmatter, body);
        const filePath = `01 Inbox/${fileName}`;
        const createdFile = await this.vault.create(filePath, fileContent);
        return createdFile;
    }
    generateFrontmatter(uid) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        return {
            exo__Asset_isDefinedBy: '"[[!kitelev]]"',
            exo__Asset_uid: uid,
            exo__Asset_createdAt: timestamp,
            exo__Instance_class: ['"[[ztlk__FleetingNote]]"'],
            ztlk__FleetingNote_type: '"[[CBT-Diary Record]]"',
        };
    }
    generateBody(formData) {
        const fields = [
            { label: "Ситуация/триггер", value: formData.situation },
            { label: "Эмоции", value: formData.emotions },
            { label: "Мысли", value: formData.thoughts },
            { label: "Поведение", value: formData.behavior },
            {
                label: "Краткосрочные последствия поведения",
                value: formData.shortTermConsequences,
            },
            {
                label: "Долгосрочные последствия поведения",
                value: formData.longTermConsequences,
            },
        ];
        return fields.map((field) => `- ${field.label}: ${field.value}`).join("\n");
    }
    buildFileContent(frontmatter, body) {
        const frontmatterLines = Object.entries(frontmatter)
            .map(([key, value]) => {
            if (Array.isArray(value)) {
                const arrayItems = value.map((item) => `  - ${item}`).join("\n");
                return `${key}:\n${arrayItems}`;
            }
            return `${key}: ${value}`;
        })
            .join("\n");
        return `---\n${frontmatterLines}\n---\n\n${body}\n`;
    }
}
exports.SupervisionCreationService = SupervisionCreationService;
