import { TFile, App, Notice, TFolder } from 'obsidian';
import { RelationAsset, RelationAssetHelper } from '../../domain/entities/RelationAsset';

/**
 * Service for converting asset properties to Relation instances
 * This implements the ontologization of relationships concept
 */
export class RelationOntologizer {
    private app: App;
    private relationsFolder: string = '99 Relations'; // Folder for relation assets
    
    constructor(app: App) {
        this.app = app;
    }
    
    /**
     * Convert frontmatter object properties to Relation assets
     */
    async ontologizeAsset(file: TFile): Promise<RelationAsset[]> {
        const relations: RelationAsset[] = [];
        const cache = this.app.metadataCache.getFileCache(file);
        
        if (!cache?.frontmatter) {
            return relations;
        }
        
        const frontmatter = cache.frontmatter;
        const assetUid = frontmatter['exo__Asset_uid'] || file.basename;
        
        // Process each frontmatter property
        for (const [key, value] of Object.entries(frontmatter)) {
            if (this.isObjectProperty(key, value)) {
                const propertyRelations = await this.processProperty(
                    assetUid,
                    key,
                    value,
                    file
                );
                relations.push(...propertyRelations);
            }
        }
        
        return relations;
    }
    
    /**
     * Check if a property represents an object relationship
     */
    private isObjectProperty(key: string, value?: any): boolean {
        // Skip meta properties
        const metaProperties = [
            'exo__Asset_uid',
            'exo__Asset_createdAt',
            'exo__Asset_modifiedAt',
            'exo__Instance_class',
            'tags',
            'title',
            'status',
            'description'
        ];
        
        if (metaProperties.includes(key)) {
            return false;
        }
        
        // Object properties typically have these patterns
        const objectPropertyPatterns = [
            /_relates$/,
            /_parent$/,
            /_children$/,
            /_assignedTo$/,
            /_project$/,
            /_area$/,
            /_partOf$/,
            /_blocks$/,
            /_dependsOn$/,
            /_relatedTo$/,
            /_isDefinedBy$/,
            /_hasPart$/,
            /_hasTask$/
        ];
        
        // Check if it matches object property patterns
        if (objectPropertyPatterns.some(pattern => pattern.test(key))) {
            return true;
        }
        
        // Check if value contains wiki link pattern
        if (value !== undefined && value !== null) {
            const valueStr = Array.isArray(value) ? value[0] : String(value);
            if (valueStr && typeof valueStr === 'string' && valueStr.includes('[[')) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Process a single property and create relations
     */
    private async processProperty(
        subjectUid: string,
        predicate: string,
        value: any,
        sourceFile: TFile
    ): Promise<RelationAsset[]> {
        const relations: RelationAsset[] = [];
        
        // Handle array values
        if (Array.isArray(value)) {
            for (const item of value) {
                const relation = this.createRelation(
                    subjectUid,
                    predicate,
                    item,
                    sourceFile
                );
                if (relation) {
                    relations.push(relation);
                }
            }
        } else {
            const relation = this.createRelation(
                subjectUid,
                predicate,
                value,
                sourceFile
            );
            if (relation) {
                relations.push(relation);
            }
        }
        
        return relations;
    }
    
    /**
     * Create a single relation
     */
    private createRelation(
        subject: string,
        predicate: string,
        object: any,
        sourceFile: TFile
    ): RelationAsset | null {
        if (!object) return null;
        
        // Extract object identifier from wiki link
        let objectId = String(object);
        if (objectId.includes('[[')) {
            objectId = objectId.replace(/\[\[|\]\]/g, '');
        }
        
        // Skip empty values
        if (!objectId || objectId === 'null' || objectId === 'undefined') {
            return null;
        }
        
        return RelationAssetHelper.create({
            subject,
            predicate,
            object: objectId,
            provenance: `ontologized from ${sourceFile.path}`
        });
    }
    
    /**
     * Create relation files in vault
     */
    async createRelationFiles(relations: RelationAsset[]): Promise<void> {
        // Ensure relations folder exists
        await this.ensureRelationsFolder();
        
        const created: string[] = [];
        const failed: string[] = [];
        
        for (const relation of relations) {
            try {
                await this.createRelationFile(relation);
                created.push(relation.uid);
            } catch (error) {
                console.error(`Failed to create relation ${relation.uid}:`, error);
                failed.push(relation.uid);
            }
        }
        
        // Show summary notification
        if (created.length > 0) {
            new Notice(`Created ${created.length} relation assets`);
        }
        if (failed.length > 0) {
            new Notice(`Failed to create ${failed.length} relations`);
        }
    }
    
    /**
     * Create a single relation file
     */
    private async createRelationFile(relation: RelationAsset): Promise<TFile> {
        const filename = RelationAssetHelper.generateFilename(relation);
        const filepath = `${this.relationsFolder}/${filename}`;
        
        // Generate frontmatter
        const frontmatter = RelationAssetHelper.toFrontmatter(relation);
        const frontmatterYaml = this.generateYaml(frontmatter);
        
        // Generate content
        const content = `---
${frontmatterYaml}---

# Relation: ${relation.predicate}

**Subject**: [[${relation.subject}]]
**Predicate**: \`${relation.predicate}\`
**Object**: [[${relation.object}]]

## Metadata
- **Created**: ${relation.createdAt.toISOString()}
- **Confidence**: ${relation.confidence || 1.0}
- **Provenance**: ${relation.provenance}
${relation.inverseOf ? `- **Inverse**: [[${relation.inverseOf}]]` : ''}

## Description
This relation represents the connection between assets using the predicate \`${relation.predicate}\`.

---
*This file was automatically generated by RelationOntologizer*`;
        
        // Create the file
        const file = await this.app.vault.create(filepath, content);
        return file;
    }
    
    /**
     * Ensure relations folder exists
     */
    private async ensureRelationsFolder(): Promise<void> {
        const folder = this.app.vault.getAbstractFileByPath(this.relationsFolder);
        if (!folder) {
            await this.app.vault.createFolder(this.relationsFolder);
        }
    }
    
    /**
     * Generate YAML from object
     */
    private generateYaml(obj: Record<string, any>): string {
        const lines: string[] = [];
        
        for (const [key, value] of Object.entries(obj)) {
            if (value === undefined || value === null) continue;
            
            if (Array.isArray(value)) {
                lines.push(`${key}:`);
                for (const item of value) {
                    lines.push(`  - ${JSON.stringify(item)}`);
                }
            } else if (typeof value === 'object') {
                lines.push(`${key}: ${JSON.stringify(value)}`);
            } else {
                lines.push(`${key}: ${JSON.stringify(value)}`);
            }
        }
        
        return lines.join('\n') + '\n';
    }
    
    /**
     * Clean original asset by removing converted properties
     */
    async cleanAssetFrontmatter(file: TFile, propertiesToRemove: string[]): Promise<void> {
        const content = await this.app.vault.read(file);
        const cache = this.app.metadataCache.getFileCache(file);
        
        if (!cache?.frontmatter) return;
        
        // Parse frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) return;
        
        const frontmatterText = frontmatterMatch[1];
        const lines = frontmatterText.split('\n');
        const newLines: string[] = [];
        
        let skipProperty = false;
        for (const line of lines) {
            // Check if this line starts a property to remove
            const isPropertyLine = propertiesToRemove.some(prop => 
                line.startsWith(`${prop}:`)
            );
            
            if (isPropertyLine) {
                skipProperty = true;
                continue;
            }
            
            // Skip array items of removed properties
            if (skipProperty && (line.startsWith('  - ') || line.startsWith('    '))) {
                continue;
            } else {
                skipProperty = false;
            }
            
            newLines.push(line);
        }
        
        // Reconstruct content
        const newFrontmatter = newLines.join('\n');
        const newContent = content.replace(
            frontmatterMatch[0],
            `---\n${newFrontmatter}\n---`
        );
        
        await this.app.vault.modify(file, newContent);
    }
    
    /**
     * Migrate entire vault to relation-based model
     */
    async migrateVault(progressCallback?: (current: number, total: number) => void): Promise<{
        assetsProcessed: number;
        relationsCreated: number;
        errors: string[];
    }> {
        const files = this.app.vault.getMarkdownFiles();
        const errors: string[] = [];
        let totalRelations = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Skip relation files themselves
            if (file.path.startsWith(this.relationsFolder)) {
                continue;
            }
            
            try {
                const relations = await this.ontologizeAsset(file);
                if (relations.length > 0) {
                    await this.createRelationFiles(relations);
                    
                    // Get properties that were converted
                    const convertedProperties = [...new Set(
                        relations.map(r => r.predicate)
                    )];
                    
                    // Clean the original asset
                    await this.cleanAssetFrontmatter(file, convertedProperties);
                    
                    totalRelations += relations.length;
                }
            } catch (error) {
                errors.push(`${file.path}: ${error}`);
            }
            
            if (progressCallback) {
                progressCallback(i + 1, files.length);
            }
        }
        
        return {
            assetsProcessed: files.length,
            relationsCreated: totalRelations,
            errors
        };
    }
}