import {
  QueryTemplate,
  TemplateCategory,
  TemplateParameter,
} from "../../domain/visual/QueryTemplate";
import { IQueryTemplateRepository } from "../../domain/repositories/IQueryTemplateRepository";

export interface TemplateSelectionOptions {
  onTemplateSelect?: (template: QueryTemplate) => void;
  onTemplatePreview?: (template: QueryTemplate) => void;
  onClose?: () => void;
  showPreview?: boolean;
  allowCustomTemplates?: boolean;
  filterByCategory?: TemplateCategory[];
  maxHeight?: number;
}

export class TemplateSelectionPanel {
  private container: HTMLDivElement;
  private searchInput: HTMLInputElement;
  private categoryFilter: HTMLSelectElement;
  private templateList: HTMLDivElement;
  private previewPane?: HTMLDivElement;
  private templates: QueryTemplate[] = [];
  private filteredTemplates: QueryTemplate[] = [];
  private selectedTemplate?: QueryTemplate;

  constructor(
    private readonly parentElement: HTMLElement,
    private readonly templateRepository: IQueryTemplateRepository,
    private readonly options: TemplateSelectionOptions = {},
  ) {
    this.createPanel();
    this.loadTemplates();
  }

  private createPanel(): void {
    this.container = document.createElement("div");
    this.container.className = "template-selection-panel";
    this.container.style.cssText = `
            position: relative;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-m);
            padding: 16px;
            max-height: ${this.options.maxHeight || 500}px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        `;

    this.createHeader();
    this.createSearchAndFilter();

    if (this.options.showPreview) {
      this.createMainContent();
    } else {
      this.createTemplateList();
    }

    this.parentElement.appendChild(this.container);
  }

  private createHeader(): void {
    const header = document.createElement("div");
    header.className = "template-panel-header";
    header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;

    const title = document.createElement("h3");
    title.textContent = "Query Templates";
    title.style.cssText = `
            margin: 0;
            color: var(--text-normal);
            font-size: 16px;
            font-weight: 600;
        `;

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.className = "template-close-btn";
    closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--text-muted);
            padding: 4px 8px;
            border-radius: var(--radius-s);
            transition: all 0.15s ease;
        `;

    closeButton.addEventListener("mouseenter", () => {
      closeButton.style.background = "var(--background-modifier-hover)";
      closeButton.style.color = "var(--text-normal)";
    });

    closeButton.addEventListener("mouseleave", () => {
      closeButton.style.background = "none";
      closeButton.style.color = "var(--text-muted)";
    });

    closeButton.addEventListener("click", () => {
      this.options.onClose?.();
      this.destroy();
    });

    header.appendChild(title);
    header.appendChild(closeButton);
    this.container.appendChild(header);
  }

  private createSearchAndFilter(): void {
    const filterContainer = document.createElement("div");
    filterContainer.className = "template-filter-container";
    filterContainer.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;

    // Search input
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Search templates...";
    this.searchInput.className = "template-search";
    this.searchInput.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-secondary);
            color: var(--text-normal);
            font-size: 14px;
        `;

    this.searchInput.addEventListener("input", () => this.filterTemplates());

    // Category filter
    this.categoryFilter = document.createElement("select");
    this.categoryFilter.className = "template-category-filter";
    this.categoryFilter.style.cssText = `
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-secondary);
            color: var(--text-normal);
            font-size: 14px;
        `;

    // Add category options
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All Categories";
    this.categoryFilter.appendChild(allOption);

    Object.values(TemplateCategory).forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = this.formatCategoryName(category);
      this.categoryFilter.appendChild(option);
    });

    this.categoryFilter.addEventListener("change", () =>
      this.filterTemplates(),
    );

    filterContainer.appendChild(this.searchInput);
    filterContainer.appendChild(this.categoryFilter);
    this.container.appendChild(filterContainer);
  }

  private createMainContent(): void {
    const mainContent = document.createElement("div");
    mainContent.className = "template-main-content";
    mainContent.style.cssText = `
            display: flex;
            gap: 12px;
            flex: 1;
            overflow: hidden;
        `;

    this.createTemplateList(mainContent);
    this.createPreviewPane(mainContent);

    this.container.appendChild(mainContent);
  }

  private createTemplateList(parent?: HTMLElement): void {
    const listContainer = document.createElement("div");
    listContainer.className = "template-list-container";
    listContainer.style.cssText = `
            ${this.options.showPreview ? "flex: 0 0 300px;" : "flex: 1;"}
            display: flex;
            flex-direction: column;
            gap: 8px;
            overflow-y: auto;
            padding-right: 4px;
        `;

    this.templateList = document.createElement("div");
    this.templateList.className = "template-list";
    this.templateList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

    listContainer.appendChild(this.templateList);
    (parent || this.container).appendChild(listContainer);
  }

  private createPreviewPane(parent: HTMLElement): void {
    this.previewPane = document.createElement("div");
    this.previewPane.className = "template-preview-pane";
    this.previewPane.style.cssText = `
            flex: 1;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            padding: 16px;
            background: var(--background-secondary);
            overflow-y: auto;
        `;

    const emptyState = document.createElement("div");
    emptyState.className = "preview-empty-state";
    emptyState.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-muted);
            font-style: italic;
        `;
    emptyState.textContent = "Select a template to preview";

    this.previewPane.appendChild(emptyState);
    parent.appendChild(this.previewPane);
  }

  private async loadTemplates(): Promise<void> {
    try {
      this.templates = await this.templateRepository.findAll();
      this.filterTemplates();
    } catch (error) {
      console.error("Failed to load templates:", error);
      this.showError("Failed to load templates");
    }
  }

  private filterTemplates(): void {
    const searchTerm = this.searchInput.value.toLowerCase();
    const selectedCategory =
      (this.categoryFilter.value as TemplateCategory) || undefined;

    this.filteredTemplates = this.templates.filter((template) => {
      const metadata = template.getMetadata();

      // Category filter
      if (selectedCategory && metadata.category !== selectedCategory) {
        return false;
      }

      // Apply category restrictions from options
      if (
        this.options.filterByCategory &&
        !this.options.filterByCategory.includes(metadata.category)
      ) {
        return false;
      }

      // Custom template filter
      if (
        this.options.allowCustomTemplates === false &&
        !template.isBuiltInTemplate()
      ) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const nameMatch = metadata.name.toLowerCase().includes(searchTerm);
        const descMatch = metadata.description
          .toLowerCase()
          .includes(searchTerm);
        const tagMatch = metadata.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm),
        );

        if (!nameMatch && !descMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });

    this.renderTemplateList();
  }

  private renderTemplateList(): void {
    this.templateList.innerHTML = "";

    if (this.filteredTemplates.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "template-list-empty";
      emptyState.style.cssText = `
                text-align: center;
                padding: 24px;
                color: var(--text-muted);
                font-style: italic;
            `;
      emptyState.textContent = "No templates match your criteria";
      this.templateList.appendChild(emptyState);
      return;
    }

    this.filteredTemplates.forEach((template) => {
      const templateItem = this.createTemplateItem(template);
      this.templateList.appendChild(templateItem);
    });
  }

  private createTemplateItem(template: QueryTemplate): HTMLDivElement {
    const metadata = template.getMetadata();
    const item = document.createElement("div");
    item.className = "template-item";
    item.style.cssText = `
            padding: 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            cursor: pointer;
            transition: all 0.15s ease;
            background: var(--background-secondary);
        `;

    const header = document.createElement("div");
    header.className = "template-item-header";
    header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
        `;

    const name = document.createElement("div");
    name.className = "template-item-name";
    name.textContent = metadata.name;
    name.style.cssText = `
            font-weight: 500;
            color: var(--text-normal);
            font-size: 14px;
        `;

    const badges = document.createElement("div");
    badges.className = "template-badges";
    badges.style.cssText = `
            display: flex;
            gap: 4px;
            flex-shrink: 0;
        `;

    // Category badge
    const categoryBadge = this.createBadge(
      this.formatCategoryName(metadata.category),
      "category",
    );
    badges.appendChild(categoryBadge);

    // Difficulty badge
    const difficultyBadge = this.createBadge(metadata.difficulty, "difficulty");
    badges.appendChild(difficultyBadge);

    // Built-in badge
    if (template.isBuiltInTemplate()) {
      const builtInBadge = this.createBadge("Built-in", "builtin");
      badges.appendChild(builtInBadge);
    }

    header.appendChild(name);
    header.appendChild(badges);

    const description = document.createElement("div");
    description.className = "template-item-description";
    description.textContent = metadata.description;
    description.style.cssText = `
            color: var(--text-muted);
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 8px;
        `;

    const tags = document.createElement("div");
    tags.className = "template-item-tags";
    tags.style.cssText = `
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        `;

    metadata.tags.forEach((tag) => {
      const tagBadge = this.createBadge(tag, "tag");
      tags.appendChild(tagBadge);
    });

    item.appendChild(header);
    item.appendChild(description);
    if (metadata.tags.length > 0) {
      item.appendChild(tags);
    }

    // Event handlers
    item.addEventListener("mouseenter", () => {
      item.style.background = "var(--background-modifier-hover)";
      item.style.borderColor = "var(--background-modifier-border-hover)";

      if (this.options.showPreview) {
        this.selectedTemplate = template;
        this.updatePreview(template);
        this.options.onTemplatePreview?.(template);
      }
    });

    item.addEventListener("mouseleave", () => {
      item.style.background = "var(--background-secondary)";
      item.style.borderColor = "var(--background-modifier-border)";
    });

    item.addEventListener("click", () => {
      this.options.onTemplateSelect?.(template);
    });

    return item;
  }

  private createBadge(text: string, type: string): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = `template-badge template-badge-${type}`;
    badge.textContent = text;

    const colors = {
      category: {
        bg: "rgba(59, 130, 246, 0.15)",
        color: "#3b82f6",
        border: "#3b82f6",
      },
      difficulty: {
        bg: "rgba(168, 85, 247, 0.15)",
        color: "#a855f7",
        border: "#a855f7",
      },
      builtin: {
        bg: "rgba(34, 197, 94, 0.15)",
        color: "#22c55e",
        border: "#22c55e",
      },
      tag: {
        bg: "rgba(107, 114, 128, 0.15)",
        color: "#6b7280",
        border: "#6b7280",
      },
    };

    const style = colors[type as keyof typeof colors] || colors.tag;

    badge.style.cssText = `
            display: inline-block;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 500;
            border-radius: 4px;
            background: ${style.bg};
            color: ${style.color};
            border: 1px solid ${style.border}40;
            white-space: nowrap;
        `;

    return badge;
  }

  private updatePreview(template: QueryTemplate): void {
    if (!this.previewPane) return;

    const metadata = template.getMetadata();
    this.previewPane.innerHTML = "";

    const header = document.createElement("div");
    header.className = "preview-header";
    header.style.cssText = `
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--background-modifier-border);
        `;

    const title = document.createElement("h4");
    title.textContent = metadata.name;
    title.style.cssText = `
            margin: 0 0 8px 0;
            color: var(--text-normal);
            font-size: 16px;
        `;

    const description = document.createElement("p");
    description.textContent = metadata.description;
    description.style.cssText = `
            margin: 0;
            color: var(--text-muted);
            font-size: 14px;
            line-height: 1.5;
        `;

    header.appendChild(title);
    header.appendChild(description);

    const content = document.createElement("div");
    content.className = "preview-content";

    if (metadata.exampleUsage) {
      const exampleSection = this.createPreviewSection(
        "Example Usage",
        metadata.exampleUsage,
      );
      content.appendChild(exampleSection);
    }

    if (metadata.sparqlPattern) {
      const sparqlSection = this.createPreviewSection(
        "SPARQL Pattern",
        metadata.sparqlPattern,
        true,
      );
      content.appendChild(sparqlSection);
    }

    const parameters = template.getParameters();
    if (parameters.length > 0) {
      const parametersSection = this.createParametersSection(parameters);
      content.appendChild(parametersSection);
    }

    const useButton = document.createElement("button");
    useButton.textContent = "Use This Template";
    useButton.className = "mod-cta";
    useButton.style.cssText = `
            margin-top: 16px;
            padding: 8px 16px;
            width: 100%;
        `;

    useButton.addEventListener("click", () => {
      this.options.onTemplateSelect?.(template);
    });

    this.previewPane.appendChild(header);
    this.previewPane.appendChild(content);
    this.previewPane.appendChild(useButton);
  }

  private createPreviewSection(
    title: string,
    content: string,
    isCode = false,
  ): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "preview-section";
    section.style.cssText = "margin-bottom: 16px;";

    const sectionTitle = document.createElement("h5");
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = `
            margin: 0 0 8px 0;
            color: var(--text-normal);
            font-size: 14px;
            font-weight: 500;
        `;

    const sectionContent = document.createElement(isCode ? "pre" : "p");
    sectionContent.textContent = content;
    sectionContent.style.cssText = `
            margin: 0;
            color: var(--text-muted);
            font-size: 13px;
            line-height: 1.4;
            ${isCode ? "background: var(--background-primary); padding: 8px; border-radius: 4px; overflow-x: auto; font-family: var(--font-monospace);" : ""}
        `;

    section.appendChild(sectionTitle);
    section.appendChild(sectionContent);

    return section;
  }

  private createParametersSection(
    parameters: TemplateParameter[],
  ): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "preview-parameters";

    const title = document.createElement("h5");
    title.textContent = "Parameters";
    title.style.cssText = `
            margin: 0 0 8px 0;
            color: var(--text-normal);
            font-size: 14px;
            font-weight: 500;
        `;

    const paramList = document.createElement("div");
    paramList.className = "parameter-list";
    paramList.style.cssText =
      "display: flex; flex-direction: column; gap: 8px;";

    parameters.forEach((param) => {
      const paramItem = document.createElement("div");
      paramItem.className = "parameter-item";
      paramItem.style.cssText = `
                padding: 8px;
                background: var(--background-primary);
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
            `;

      const paramHeader = document.createElement("div");
      paramHeader.style.cssText =
        "display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;";

      const paramName = document.createElement("span");
      paramName.textContent = param.name;
      paramName.style.cssText =
        "font-weight: 500; color: var(--text-normal); font-size: 12px;";

      const paramType = document.createElement("span");
      paramType.textContent = param.type;
      paramType.style.cssText = `
                font-size: 10px;
                padding: 2px 4px;
                background: var(--background-secondary);
                border-radius: 2px;
                color: var(--text-muted);
            `;

      if (param.required) {
        const requiredBadge = document.createElement("span");
        requiredBadge.textContent = "required";
        requiredBadge.style.cssText = `
                    font-size: 10px;
                    padding: 2px 4px;
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                    border-radius: 2px;
                    margin-left: 4px;
                `;
        paramType.appendChild(requiredBadge);
      }

      const paramDescription = document.createElement("div");
      paramDescription.textContent = param.description;
      paramDescription.style.cssText =
        "color: var(--text-muted); font-size: 11px; line-height: 1.3;";

      paramHeader.appendChild(paramName);
      paramHeader.appendChild(paramType);
      paramItem.appendChild(paramHeader);
      paramItem.appendChild(paramDescription);

      if (param.defaultValue) {
        const defaultValue = document.createElement("div");
        defaultValue.textContent = `Default: ${param.defaultValue}`;
        defaultValue.style.cssText =
          "color: var(--text-muted); font-size: 10px; margin-top: 4px; font-style: italic;";
        paramItem.appendChild(defaultValue);
      }

      paramList.appendChild(paramItem);
    });

    section.appendChild(title);
    section.appendChild(paramList);

    return section;
  }

  private formatCategoryName(category: TemplateCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  private showError(message: string): void {
    const error = document.createElement("div");
    error.className = "template-error";
    error.style.cssText = `
            padding: 12px;
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: var(--radius-s);
            text-align: center;
            font-size: 14px;
        `;
    error.textContent = message;

    this.templateList.innerHTML = "";
    this.templateList.appendChild(error);
  }

  public getSelectedTemplate(): QueryTemplate | undefined {
    return this.selectedTemplate;
  }

  public refresh(): void {
    this.loadTemplates();
  }

  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
