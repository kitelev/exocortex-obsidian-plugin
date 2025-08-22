import { App, TFile, Vault } from "obsidian";
import {
  IQueryTemplateRepository,
  TemplateSearchCriteria,
} from "../../domain/repositories/IQueryTemplateRepository";
import {
  QueryTemplate,
  TemplateCategory,
  TemplateMetadata,
  TemplateLayout,
  TemplateParameter,
} from "../../domain/visual/QueryTemplate";
import { BuiltInQueryTemplates } from "./BuiltInQueryTemplates";

interface StoredTemplateData {
  id: string;
  metadata: TemplateMetadata;
  layout: TemplateLayout;
  parameters: TemplateParameter[];
  sparqlTemplate: string;
  isBuiltIn: boolean;
  usageCount?: number;
  lastUsed?: string;
}

interface TemplateUsageData {
  templateId: string;
  usageCount: number;
  lastUsed: Date;
  parametersFilled: number[];
}

export class ObsidianQueryTemplateRepository
  implements IQueryTemplateRepository
{
  private readonly templatesPath: string;
  private readonly usageDataPath: string;
  private templateCache: Map<string, QueryTemplate> = new Map();
  private usageData: Map<string, TemplateUsageData> = new Map();
  private cacheLoaded: boolean = false;

  constructor(
    private readonly app: App,
    templatesPath: string = ".exocortex/templates",
    usageDataPath: string = ".exocortex/template-usage.json",
  ) {
    this.templatesPath = templatesPath;
    this.usageDataPath = usageDataPath;
  }

  async findAll(): Promise<QueryTemplate[]> {
    await this.ensureCacheLoaded();
    const templates = Array.from(this.templateCache.values());

    // Sort by usage frequency and then by name
    return templates.sort((a, b) => {
      const usageA = this.usageData.get(a.getId())?.usageCount || 0;
      const usageB = this.usageData.get(b.getId())?.usageCount || 0;

      if (usageA !== usageB) {
        return usageB - usageA;
      }

      return a.getMetadata().name.localeCompare(b.getMetadata().name);
    });
  }

  async findByCriteria(
    criteria: TemplateSearchCriteria,
  ): Promise<QueryTemplate[]> {
    await this.ensureCacheLoaded();
    let templates = Array.from(this.templateCache.values());

    if (criteria.category) {
      templates = templates.filter(
        (t) => t.getMetadata().category === criteria.category,
      );
    }

    if (criteria.difficulty) {
      templates = templates.filter(
        (t) => t.getMetadata().difficulty === criteria.difficulty,
      );
    }

    if (criteria.nameContains) {
      const searchTerm = criteria.nameContains.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.getMetadata().name.toLowerCase().includes(searchTerm) ||
          t.getMetadata().description.toLowerCase().includes(searchTerm),
      );
    }

    if (criteria.tags && criteria.tags.length > 0) {
      templates = templates.filter((t) => {
        const templateTags = t.getMetadata().tags;
        return criteria.tags!.some((tag) => templateTags.includes(tag));
      });
    }

    if (criteria.includeBuiltIn !== undefined) {
      templates = templates.filter(
        (t) => t.isBuiltInTemplate() === criteria.includeBuiltIn,
      );
    }

    if (criteria.includeCustom !== undefined) {
      templates = templates.filter(
        (t) => !t.isBuiltInTemplate() === criteria.includeCustom,
      );
    }

    return templates;
  }

  async findById(id: string): Promise<QueryTemplate | undefined> {
    await this.ensureCacheLoaded();
    return this.templateCache.get(id);
  }

  async findByCategory(category: TemplateCategory): Promise<QueryTemplate[]> {
    return this.findByCriteria({ category });
  }

  async findByTags(tags: string[]): Promise<QueryTemplate[]> {
    return this.findByCriteria({ tags });
  }

  async save(template: QueryTemplate): Promise<QueryTemplate> {
    if (template.isBuiltInTemplate()) {
      throw new Error("Cannot modify built-in templates");
    }

    const exists = await this.exists(template.getId());
    if (exists) {
      return this.update(template);
    } else {
      return this.create(template);
    }
  }

  async create(template: QueryTemplate): Promise<QueryTemplate> {
    if (template.isBuiltInTemplate()) {
      throw new Error("Cannot create built-in templates through repository");
    }

    const exists = await this.exists(template.getId());
    if (exists) {
      throw new Error(`Template with ID ${template.getId()} already exists`);
    }

    await this.ensureTemplatesDirectoryExists();

    const fileName = `${this.sanitizeFileName(template.getMetadata().name)}-${template.getId()}.json`;
    const filePath = `${this.templatesPath}/${fileName}`;

    const data: StoredTemplateData = {
      id: template.getId(),
      metadata: template.getMetadata(),
      layout: template.getLayout(),
      parameters: template.getParameters(),
      sparqlTemplate: template.getSparqlTemplate(),
      isBuiltIn: template.isBuiltInTemplate(),
    };

    await this.app.vault.create(filePath, JSON.stringify(data, null, 2));
    this.templateCache.set(template.getId(), template);

    return template;
  }

  async update(template: QueryTemplate): Promise<QueryTemplate> {
    if (template.isBuiltInTemplate()) {
      throw new Error("Cannot modify built-in templates");
    }

    const exists = await this.exists(template.getId());
    if (!exists) {
      throw new Error(`Template with ID ${template.getId()} not found`);
    }

    await this.ensureTemplatesDirectoryExists();

    const fileName = await this.findTemplateFile(template.getId());
    if (!fileName) {
      throw new Error(`Template file not found for ID ${template.getId()}`);
    }

    const filePath = `${this.templatesPath}/${fileName}`;
    const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;

    const data: StoredTemplateData = {
      id: template.getId(),
      metadata: template.getMetadata(),
      layout: template.getLayout(),
      parameters: template.getParameters(),
      sparqlTemplate: template.getSparqlTemplate(),
      isBuiltIn: template.isBuiltInTemplate(),
    };

    await this.app.vault.modify(file, JSON.stringify(data, null, 2));
    this.templateCache.set(template.getId(), template);

    return template;
  }

  async delete(id: string): Promise<boolean> {
    const template = await this.findById(id);
    if (!template) {
      return false;
    }

    if (template.isBuiltInTemplate()) {
      throw new Error("Cannot delete built-in templates");
    }

    const fileName = await this.findTemplateFile(id);
    if (!fileName) {
      return false;
    }

    const filePath = `${this.templatesPath}/${fileName}`;
    const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;

    if (file) {
      await this.app.vault.delete(file);
      this.templateCache.delete(id);
      this.usageData.delete(id);
      await this.saveUsageData();
      return true;
    }

    return false;
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureCacheLoaded();
    return this.templateCache.has(id);
  }

  async importTemplates(templatesData: object[]): Promise<QueryTemplate[]> {
    const imported: QueryTemplate[] = [];

    for (const templateData of templatesData) {
      try {
        const data = templateData as StoredTemplateData;

        // Don't import if already exists and is built-in
        const existing = this.templateCache.get(data.id);
        if (existing && existing.isBuiltInTemplate()) {
          continue;
        }

        const template = this.createTemplateFromData(data);
        await this.save(template);
        imported.push(template);
      } catch (error) {
        console.warn("Failed to import template:", error);
      }
    }

    return imported;
  }

  async exportTemplates(templateIds?: string[]): Promise<object[]> {
    await this.ensureCacheLoaded();

    let templates: QueryTemplate[];
    if (templateIds) {
      templates = templateIds
        .map((id) => this.templateCache.get(id))
        .filter((t) => t !== undefined) as QueryTemplate[];
    } else {
      templates = Array.from(this.templateCache.values());
    }

    return templates.map((template) => template.toJSON());
  }

  async getBuiltInTemplates(): Promise<QueryTemplate[]> {
    return this.findByCriteria({ includeBuiltIn: true, includeCustom: false });
  }

  async getCustomTemplates(): Promise<QueryTemplate[]> {
    return this.findByCriteria({ includeBuiltIn: false, includeCustom: true });
  }

  async getRecentlyUsed(limit: number = 10): Promise<QueryTemplate[]> {
    await this.ensureCacheLoaded();

    const templateUsage = Array.from(this.usageData.entries())
      .sort((a, b) => b[1].lastUsed.getTime() - a[1].lastUsed.getTime())
      .slice(0, limit);

    return templateUsage
      .map(([id]) => this.templateCache.get(id))
      .filter((t) => t !== undefined) as QueryTemplate[];
  }

  async recordUsage(templateId: string): Promise<void> {
    await this.ensureCacheLoaded();

    const existing = this.usageData.get(templateId);
    if (existing) {
      existing.usageCount++;
      existing.lastUsed = new Date();
    } else {
      this.usageData.set(templateId, {
        templateId,
        usageCount: 1,
        lastUsed: new Date(),
        parametersFilled: [],
      });
    }

    await this.saveUsageData();
  }

  async getUsageStats(templateId: string): Promise<{
    usageCount: number;
    lastUsed?: Date;
    averageParametersFilled?: number;
  }> {
    await this.ensureCacheLoaded();

    const usage = this.usageData.get(templateId);
    if (!usage) {
      return { usageCount: 0 };
    }

    const averageParametersFilled =
      usage.parametersFilled.length > 0
        ? usage.parametersFilled.reduce((sum, count) => sum + count, 0) /
          usage.parametersFilled.length
        : undefined;

    return {
      usageCount: usage.usageCount,
      lastUsed: usage.lastUsed,
      averageParametersFilled,
    };
  }

  async refresh(): Promise<void> {
    this.templateCache.clear();
    this.usageData.clear();
    this.cacheLoaded = false;
    await this.loadBuiltInTemplates();
    await this.loadCustomTemplates();
    await this.loadUsageData();
    this.cacheLoaded = true;
  }

  private async ensureCacheLoaded(): Promise<void> {
    if (!this.cacheLoaded) {
      await this.refresh();
    }
  }

  private async ensureTemplatesDirectoryExists(): Promise<void> {
    const templatesDir = this.app.vault.getAbstractFileByPath(
      this.templatesPath,
    );
    if (!templatesDir) {
      await this.app.vault.createFolder(this.templatesPath);
    }
  }

  private async loadBuiltInTemplates(): Promise<void> {
    const builtInTemplates = BuiltInQueryTemplates.getAll();
    builtInTemplates.forEach((template) => {
      this.templateCache.set(template.getId(), template);
    });
  }

  private async loadCustomTemplates(): Promise<void> {
    await this.ensureTemplatesDirectoryExists();

    const templatesDir = this.app.vault.getAbstractFileByPath(
      this.templatesPath,
    );
    if (!templatesDir || !(templatesDir as any).children) {
      return;
    }

    const files = (templatesDir as any).children.filter(
      (file: any) => file.extension === "json" && file.name.endsWith(".json"),
    );

    for (const file of files) {
      try {
        const content = await this.app.vault.read(file);
        const data = JSON.parse(content) as StoredTemplateData;

        const template = this.createTemplateFromData(data);
        this.templateCache.set(template.getId(), template);
      } catch (error) {
        console.warn(`Failed to load template from ${file.path}:`, error);
      }
    }
  }

  private async loadUsageData(): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(
        this.usageDataPath,
      ) as TFile;
      if (file) {
        const content = await this.app.vault.read(file);
        const data = JSON.parse(content) as TemplateUsageData[];

        this.usageData.clear();
        data.forEach((usage) => {
          usage.lastUsed = new Date(usage.lastUsed);
          this.usageData.set(usage.templateId, usage);
        });
      }
    } catch (error) {
      // Usage data file doesn't exist or is corrupted - start fresh
      this.usageData.clear();
    }
  }

  private async saveUsageData(): Promise<void> {
    const data = Array.from(this.usageData.values());
    const content = JSON.stringify(data, null, 2);

    const file = this.app.vault.getAbstractFileByPath(
      this.usageDataPath,
    ) as TFile;
    if (file) {
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(this.usageDataPath, content);
    }
  }

  private async findTemplateFile(templateId: string): Promise<string | null> {
    await this.ensureTemplatesDirectoryExists();

    const templatesDir = this.app.vault.getAbstractFileByPath(
      this.templatesPath,
    );
    if (!templatesDir || !(templatesDir as any).children) {
      return null;
    }

    const files = (templatesDir as any).children.filter(
      (file: any) =>
        file.extension === "json" && file.name.includes(templateId),
    );

    return files.length > 0 ? files[0].name : null;
  }

  private createTemplateFromData(data: StoredTemplateData): QueryTemplate {
    return new QueryTemplate({
      id: data.id,
      metadata: data.metadata,
      layout: data.layout,
      parameters: data.parameters,
      sparqlTemplate: data.sparqlTemplate || "SELECT * WHERE { ?s ?p ?o }",
      isBuiltIn: data.isBuiltIn,
    });
  }

  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
  }
}
