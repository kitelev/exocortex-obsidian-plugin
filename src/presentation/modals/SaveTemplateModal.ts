import { Modal, App, Setting } from 'obsidian';
import { TemplateCategory } from '../../domain/visual/QueryTemplate';
import { VisualQueryNode } from '../../domain/visual/VisualQueryNode';
import { VisualQueryEdge } from '../../domain/visual/VisualQueryEdge';

export interface SaveTemplateOptions {
    nodes: Map<string, VisualQueryNode>;
    edges: Map<string, VisualQueryEdge>;
    viewport: { x: number; y: number; zoom: number };
    sparqlQuery?: string;
    onSave: (templateData: {
        name: string;
        description: string;
        category: TemplateCategory;
        tags: string[];
        difficulty: 'beginner' | 'intermediate' | 'advanced';
    }) => void;
    onCancel?: () => void;
}

export class SaveTemplateModal extends Modal {
    private nameInput: HTMLInputElement;
    private descriptionInput: HTMLTextAreaElement;
    private categorySelect: HTMLSelectElement;
    private difficultySelect: HTMLSelectElement;
    private tagsInput: HTMLInputElement;
    private previewContainer: HTMLElement;

    constructor(
        app: App,
        private options: SaveTemplateOptions
    ) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        this.createHeader();
        this.createForm();
        this.createPreview();
        this.createButtons();
        this.setupEventListeners();

        // Focus on name input
        setTimeout(() => this.nameInput.focus(), 100);
    }

    onClose(): void {
        // Clean up if needed
    }

    private createHeader(): void {
        const header = this.contentEl.createDiv('save-template-header');
        header.style.cssText = `
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--background-modifier-border);
        `;

        const title = header.createEl('h2');
        title.textContent = 'Save as Template';
        title.style.cssText = `
            margin: 0 0 8px 0;
            color: var(--text-normal);
            font-size: 20px;
            font-weight: 600;
        `;

        const subtitle = header.createDiv();
        subtitle.textContent = 'Create a reusable template from your current query';
        subtitle.style.cssText = `
            color: var(--text-muted);
            font-size: 14px;
        `;
    }

    private createForm(): void {
        const form = this.contentEl.createDiv('template-form');
        form.style.cssText = `
            display: grid;
            gap: 16px;
            margin-bottom: 20px;
        `;

        // Template name
        const nameContainer = form.createDiv('form-field');
        const nameLabel = nameContainer.createEl('label');
        nameLabel.textContent = 'Template Name *';
        nameLabel.style.cssText = `
            display: block;
            margin-bottom: 6px;
            color: var(--text-normal);
            font-weight: 500;
        `;

        this.nameInput = nameContainer.createEl('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = 'Enter a descriptive name for your template';
        this.nameInput.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 14px;
        `;

        // Description
        const descContainer = form.createDiv('form-field');
        const descLabel = descContainer.createEl('label');
        descLabel.textContent = 'Description *';
        descLabel.style.cssText = `
            display: block;
            margin-bottom: 6px;
            color: var(--text-normal);
            font-weight: 500;
        `;

        this.descriptionInput = descContainer.createEl('textarea');
        this.descriptionInput.placeholder = 'Describe what this template does and when to use it';
        this.descriptionInput.rows = 3;
        this.descriptionInput.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 14px;
            resize: vertical;
            font-family: inherit;
        `;

        // Category and Difficulty row
        const metaRow = form.createDiv('form-row');
        metaRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';

        // Category
        const categoryContainer = metaRow.createDiv('form-field');
        const categoryLabel = categoryContainer.createEl('label');
        categoryLabel.textContent = 'Category';
        categoryLabel.style.cssText = `
            display: block;
            margin-bottom: 6px;
            color: var(--text-normal);
            font-weight: 500;
        `;

        this.categorySelect = categoryContainer.createEl('select');
        this.categorySelect.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 14px;
        `;

        Object.values(TemplateCategory).forEach(category => {
            const option = this.categorySelect.createEl('option');
            option.value = category;
            option.textContent = this.formatCategoryName(category);
            if (category === TemplateCategory.CUSTOM) {
                option.selected = true;
            }
        });

        // Difficulty
        const difficultyContainer = metaRow.createDiv('form-field');
        const difficultyLabel = difficultyContainer.createEl('label');
        difficultyLabel.textContent = 'Difficulty';
        difficultyLabel.style.cssText = `
            display: block;
            margin-bottom: 6px;
            color: var(--text-normal);
            font-weight: 500;
        `;

        this.difficultySelect = difficultyContainer.createEl('select');
        this.difficultySelect.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 14px;
        `;

        ['beginner', 'intermediate', 'advanced'].forEach(difficulty => {
            const option = this.difficultySelect.createEl('option');
            option.value = difficulty;
            option.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            if (difficulty === 'intermediate') {
                option.selected = true;
            }
        });

        // Tags
        const tagsContainer = form.createDiv('form-field');
        const tagsLabel = tagsContainer.createEl('label');
        tagsLabel.textContent = 'Tags';
        tagsLabel.style.cssText = `
            display: block;
            margin-bottom: 6px;
            color: var(--text-normal);
            font-weight: 500;
        `;

        this.tagsInput = tagsContainer.createEl('input');
        this.tagsInput.type = 'text';
        this.tagsInput.placeholder = 'Enter tags separated by commas (e.g., search, filter, advanced)';
        this.tagsInput.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 14px;
        `;

        const tagsHelp = tagsContainer.createDiv();
        tagsHelp.textContent = 'Tags help others find your template. Use descriptive keywords.';
        tagsHelp.style.cssText = `
            margin-top: 4px;
            color: var(--text-muted);
            font-size: 12px;
        `;
    }

    private createPreview(): void {
        const previewSection = this.contentEl.createDiv('template-preview-section');
        previewSection.style.cssText = `
            margin-bottom: 20px;
            padding: 16px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
        `;

        const previewTitle = previewSection.createEl('h4');
        previewTitle.textContent = 'Query Preview';
        previewTitle.style.cssText = `
            margin: 0 0 12px 0;
            color: var(--text-normal);
            font-size: 14px;
            font-weight: 500;
        `;

        this.previewContainer = previewSection.createDiv('template-preview-content');
        this.updatePreview();
    }

    private updatePreview(): void {
        this.previewContainer.innerHTML = '';

        const stats = this.previewContainer.createDiv('template-stats');
        stats.style.cssText = `
            display: flex;
            gap: 16px;
            margin-bottom: 12px;
            padding: 8px;
            background: var(--background-primary);
            border-radius: 4px;
        `;

        const nodeCount = stats.createDiv();
        nodeCount.innerHTML = `<strong>Nodes:</strong> ${this.options.nodes.size}`;
        nodeCount.style.cssText = 'color: var(--text-muted); font-size: 12px;';

        const edgeCount = stats.createDiv();
        edgeCount.innerHTML = `<strong>Edges:</strong> ${this.options.edges.size}`;
        edgeCount.style.cssText = 'color: var(--text-muted); font-size: 12px;';

        if (this.options.sparqlQuery) {
            const queryPreview = this.previewContainer.createDiv('sparql-preview');
            queryPreview.style.cssText = `
                margin-top: 8px;
            `;

            const queryLabel = queryPreview.createDiv();
            queryLabel.textContent = 'Generated SPARQL:';
            queryLabel.style.cssText = `
                color: var(--text-normal);
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 4px;
            `;

            const queryCode = queryPreview.createEl('pre');
            queryCode.textContent = this.options.sparqlQuery;
            queryCode.style.cssText = `
                margin: 0;
                padding: 8px;
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                font-size: 11px;
                color: var(--text-muted);
                overflow-x: auto;
                font-family: var(--font-monospace);
            `;
        }
    }

    private createButtons(): void {
        const buttonContainer = this.contentEl.createDiv('modal-button-container');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding-top: 16px;
            border-top: 1px solid var(--background-modifier-border);
        `;

        const cancelButton = buttonContainer.createEl('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            this.options.onCancel?.();
            this.close();
        });

        const saveButton = buttonContainer.createEl('button');
        saveButton.textContent = 'Save Template';
        saveButton.className = 'mod-cta';
        saveButton.addEventListener('click', () => this.handleSave());
    }

    private setupEventListeners(): void {
        // Real-time validation
        [this.nameInput, this.descriptionInput].forEach(input => {
            input.addEventListener('input', () => this.validateForm());
        });

        // Enter to save (with Ctrl/Cmd)
        this.contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.handleSave();
            }
            
            if (e.key === 'Escape') {
                e.preventDefault();
                this.options.onCancel?.();
                this.close();
            }
        });
    }

    private validateForm(): boolean {
        const name = this.nameInput.value.trim();
        const description = this.descriptionInput.value.trim();

        // Reset styles
        [this.nameInput, this.descriptionInput].forEach(input => {
            input.style.borderColor = 'var(--background-modifier-border)';
        });

        let isValid = true;

        if (!name) {
            this.nameInput.style.borderColor = 'var(--text-error)';
            isValid = false;
        }

        if (!description) {
            this.descriptionInput.style.borderColor = 'var(--text-error)';
            isValid = false;
        }

        return isValid;
    }

    private handleSave(): void {
        if (!this.validateForm()) {
            return;
        }

        const name = this.nameInput.value.trim();
        const description = this.descriptionInput.value.trim();
        const category = this.categorySelect.value as TemplateCategory;
        const difficulty = this.difficultySelect.value as 'beginner' | 'intermediate' | 'advanced';
        const tagsText = this.tagsInput.value.trim();
        
        const tags = tagsText
            ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            : [];

        // Add automatic tags based on content
        if (this.options.nodes.size > 5) tags.push('complex');
        if (this.options.edges.size > 3) tags.push('multi-step');
        if (!tags.includes('custom')) tags.push('custom');

        this.options.onSave({
            name,
            description,
            category,
            tags,
            difficulty
        });

        this.close();
    }

    private formatCategoryName(category: TemplateCategory): string {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
}