"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCreationService = void 0;
const uuid_1 = require("uuid");
const WikiLinkHelpers_1 = require("../utilities/WikiLinkHelpers");
const MetadataHelpers_1 = require("../utilities/MetadataHelpers");
const constants_1 = require("../domain/constants");
const TaskFrontmatterGenerator_1 = require("./TaskFrontmatterGenerator");
const AlgorithmExtractor_1 = require("./AlgorithmExtractor");
class TaskCreationService {
    constructor(vault) {
        this.vault = vault;
        this.frontmatterGenerator = new TaskFrontmatterGenerator_1.TaskFrontmatterGenerator();
        this.algorithmExtractor = new AlgorithmExtractor_1.AlgorithmExtractor();
    }
    async createTask(sourceFile, sourceMetadata, sourceClass, label, taskSize) {
        const uid = (0, uuid_1.v4)();
        const fileName = `${uid}.md`;
        const frontmatter = this.frontmatterGenerator.generateTaskFrontmatter(sourceMetadata, sourceFile.basename, sourceClass, label, uid, taskSize);
        let bodyContent = "";
        const cleanSourceClass = WikiLinkHelpers_1.WikiLinkHelpers.normalize(sourceClass);
        if (cleanSourceClass === constants_1.AssetClass.TASK_PROTOTYPE) {
            const prototypeContent = await this.vault.read(sourceFile);
            const algorithmSection = this.algorithmExtractor.extractH2Section(prototypeContent, "Algorithm");
            if (algorithmSection) {
                bodyContent = `## Algorithm\n\n${algorithmSection}`;
            }
        }
        const fileContent = MetadataHelpers_1.MetadataHelpers.buildFileContent(frontmatter, bodyContent);
        const folderPath = sourceFile.parent?.path || "";
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
        const createdFile = await this.vault.create(filePath, fileContent);
        return createdFile;
    }
    async createRelatedTask(sourceFile, sourceMetadata, label, taskSize) {
        const uid = (0, uuid_1.v4)();
        const fileName = `${uid}.md`;
        const frontmatter = this.frontmatterGenerator.generateRelatedTaskFrontmatter(sourceMetadata, sourceFile.basename, label, uid, taskSize);
        const fileContent = MetadataHelpers_1.MetadataHelpers.buildFileContent(frontmatter);
        const folderPath = sourceFile.parent?.path || "";
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
        const createdFile = await this.vault.create(filePath, fileContent);
        await this.addRelationToSourceFile(sourceFile, uid);
        return createdFile;
    }
    generateTaskFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid, taskSize) {
        return this.frontmatterGenerator.generateTaskFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid, taskSize);
    }
    // Used only by unit tests via (service as any)._generateRelatedTaskFrontmatter
    // @ts-ignore - Used by tests through type casting
    _generateRelatedTaskFrontmatter(sourceMetadata, sourceName, label, uid, taskSize) {
        return this.frontmatterGenerator.generateRelatedTaskFrontmatter(sourceMetadata, sourceName, label, uid, taskSize);
    }
    // Used only by unit tests via (service as any)._extractH2Section
    // @ts-ignore - Used by tests through type casting
    _extractH2Section(content, heading) {
        return this.algorithmExtractor.extractH2Section(content, heading);
    }
    async addRelationToSourceFile(sourceFile, newTaskUid) {
        const content = await this.vault.read(sourceFile);
        const updatedContent = this.addRelationToFrontmatter(content, newTaskUid);
        await this.vault.modify(sourceFile, updatedContent);
    }
    addRelationToFrontmatter(content, relatedTaskUid) {
        const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
        const match = content.match(frontmatterRegex);
        const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
        if (!match) {
            const newFrontmatter = `---${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"${lineEnding}---${lineEnding}${content}`;
            return newFrontmatter;
        }
        const frontmatterContent = match[1];
        let updatedFrontmatter = frontmatterContent;
        if (updatedFrontmatter.includes("exo__Asset_relates:")) {
            const relatesMatch = updatedFrontmatter.match(/exo__Asset_relates:\r?\n((?: {2}- .*\r?\n)*)/);
            if (relatesMatch) {
                const existingItems = relatesMatch[1];
                const newItem = `  - "[[${relatedTaskUid}]]"${lineEnding}`;
                updatedFrontmatter = updatedFrontmatter.replace(/exo__Asset_relates:\r?\n((?: {2}- .*\r?\n)*)/, `exo__Asset_relates:${lineEnding}${existingItems}${newItem}`);
            }
        }
        else {
            updatedFrontmatter += `${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"`;
        }
        return content.replace(frontmatterRegex, `---${lineEnding}${updatedFrontmatter}${lineEnding}---`);
    }
}
exports.TaskCreationService = TaskCreationService;
