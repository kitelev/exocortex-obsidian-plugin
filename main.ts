import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf } from 'obsidian';

interface ExocortexSettings {
	defaultOntology: string;
	enableAutoLayout: boolean;
	debugMode: boolean;
}

const DEFAULT_SETTINGS: ExocortexSettings = {
	defaultOntology: 'exo',
	enableAutoLayout: true,
	debugMode: false
}

export default class ExocortexPlugin extends Plugin {
	settings: ExocortexSettings;

	async onload() {
		await this.loadSettings();

		// Register the universal renderer function
		(window as any).ExoUIRender = async (dv: any, ctx: any) => {
			await this.renderUniversalLayout(dv, ctx);
		};

		// Add ribbon icon
		const ribbonIconEl = this.addRibbonIcon('brain', 'Exocortex', (evt: MouseEvent) => {
			new Notice('Exocortex plugin is active');
		});
		ribbonIconEl.addClass('exocortex-ribbon-class');

		// Add command to create new ontology-aware note
		this.addCommand({
			id: 'create-exo-note',
			name: 'Create Exocortex Note',
			callback: () => {
				new ExocortexNoteModal(this.app, this).open();
			}
		});

		// Add command to refresh layouts
		this.addCommand({
			id: 'refresh-exo-layouts',
			name: 'Refresh Exocortex Layouts',
			callback: () => {
				this.refreshAllLayouts();
			}
		});

		// Add settings tab
		this.addSettingTab(new ExocortexSettingTab(this.app, this));

		// Register interval for auto-refresh if enabled
		if (this.settings.enableAutoLayout) {
			this.registerInterval(window.setInterval(() => this.refreshAllLayouts(), 30000));
		}

		console.log('Exocortex plugin loaded');
	}

	onunload() {
		console.log('Exocortex plugin unloaded');
		delete (window as any).ExoUIRender;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async renderUniversalLayout(dv: any, ctx: any) {
		const file = ctx.container.closest('.markdown-preview-view')?.file || 
					 ctx.container.closest('.markdown-source-view')?.file ||
					 this.app.workspace.getActiveFile();
		
		if (!file) {
			dv.paragraph("Error: Could not determine current file");
			return;
		}

		const metadata = this.app.metadataCache.getFileCache(file);
		if (!metadata?.frontmatter) {
			dv.paragraph("No frontmatter found");
			return;
		}

		const assetClass = metadata.frontmatter['exo__Instance_class'];
		if (!assetClass) {
			dv.paragraph("No exo__Instance_class defined");
			return;
		}

		// Find layout for this class
		const layoutFile = await this.findLayoutForClass(assetClass);
		if (!layoutFile) {
			// Fallback to default layout
			await this.renderDefaultLayout(dv, file, metadata);
			return;
		}

		// Render the layout
		await this.renderLayout(dv, file, metadata, layoutFile);
	}

	async findLayoutForClass(className: string): Promise<TFile | null> {
		// Clean the class name from wiki links
		const cleanClassName = className.toString().replace(/\[\[|\]\]/g, '');
		
		// Search for layout file
		const layoutName = `Layout - ${cleanClassName}`;
		const files = this.app.vault.getFiles();
		
		for (const file of files) {
			if (file.basename === layoutName) {
				return file;
			}
		}
		
		return null;
	}

	async renderDefaultLayout(dv: any, file: TFile, metadata: any) {
		const frontmatter = metadata.frontmatter;
		
		dv.header(2, "Properties");
		const properties = Object.entries(frontmatter)
			.filter(([key]) => !key.startsWith('position'))
			.map(([key, value]) => {
				return { Property: key, Value: this.formatValue(value) };
			});
		dv.table(["Property", "Value"], properties.map(p => [p.Property, p.Value]));

		// Show related notes
		if (frontmatter['exo__Asset_relates']) {
			dv.header(2, "Related Assets");
			const relates = Array.isArray(frontmatter['exo__Asset_relates']) 
				? frontmatter['exo__Asset_relates'] 
				: [frontmatter['exo__Asset_relates']];
			dv.list(relates);
		}

		// Show backlinks
		const backlinks = this.app.metadataCache.getBacklinksForFile(file);
		if (backlinks && backlinks.data.size > 0) {
			dv.header(2, "Referenced By");
			const backlinkFiles = Array.from(backlinks.data.keys()).map(path => {
				const file = this.app.vault.getAbstractFileByPath(path);
				return file ? `[[${file.path}]]` : path;
			});
			dv.list(backlinkFiles);
		}
	}

	async renderLayout(dv: any, file: TFile, metadata: any, layoutFile: TFile) {
		// This would parse the layout file and render blocks accordingly
		// For now, using default layout
		await this.renderDefaultLayout(dv, file, metadata);
	}

	formatValue(value: any): string {
		if (Array.isArray(value)) {
			return value.map(v => this.formatValue(v)).join(", ");
		}
		if (typeof value === 'object' && value !== null) {
			return JSON.stringify(value);
		}
		return String(value);
	}

	refreshAllLayouts() {
		// Trigger re-render of all open notes
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			if (leaf.view instanceof MarkdownView) {
				leaf.view.previewMode.rerender(true);
			}
		});
		new Notice('Exocortex layouts refreshed');
	}
}

class ExocortexNoteModal extends Modal {
	plugin: ExocortexPlugin;
	noteTitle: string = '';
	noteClass: string = 'exo__Asset';
	noteOntology: string = 'exo';

	constructor(app: App, plugin: ExocortexPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Create Exocortex Note" });

		new Setting(contentEl)
			.setName("Title")
			.setDesc("Note title")
			.addText(text => text
				.setPlaceholder("Enter note title")
				.setValue(this.noteTitle)
				.onChange(value => this.noteTitle = value));

		new Setting(contentEl)
			.setName("Class")
			.setDesc("Ontology class for the note")
			.addText(text => text
				.setPlaceholder("e.g., exo__Asset, ems__Task")
				.setValue(this.noteClass)
				.onChange(value => this.noteClass = value));

		new Setting(contentEl)
			.setName("Ontology")
			.setDesc("Ontology namespace")
			.addText(text => text
				.setPlaceholder("e.g., exo, ems, gtd")
				.setValue(this.noteOntology)
				.onChange(value => this.noteOntology = value));

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText("Create")
				.setCta()
				.onClick(() => {
					this.createNote();
					this.close();
				}));
	}

	async createNote() {
		const fileName = `${this.noteTitle}.md`;
		const frontmatter = `---
exo__Asset_isDefinedBy: "[[!${this.noteOntology}]]"
exo__Asset_uid: ${this.generateUUID()}
exo__Asset_createdAt: ${new Date().toISOString()}
exo__Instance_class:
  - "[[${this.noteClass}]]"
exo__Asset_label: "${this.noteTitle}"
---

\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
`;

		try {
			const file = await this.app.vault.create(fileName, frontmatter);
			const leaf = this.app.workspace.getLeaf();
			await leaf.openFile(file);
			new Notice(`Created note: ${fileName}`);
		} catch (error) {
			new Notice(`Error creating note: ${error.message}`);
		}
	}

	generateUUID(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ExocortexSettingTab extends PluginSettingTab {
	plugin: ExocortexPlugin;

	constructor(app: App, plugin: ExocortexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Exocortex Settings' });

		new Setting(containerEl)
			.setName('Default Ontology')
			.setDesc('Default ontology namespace for new notes')
			.addText(text => text
				.setPlaceholder('exo')
				.setValue(this.plugin.settings.defaultOntology)
				.onChange(async (value) => {
					this.plugin.settings.defaultOntology = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Auto Layout')
			.setDesc('Automatically refresh layouts periodically')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAutoLayout)
				.onChange(async (value) => {
					this.plugin.settings.enableAutoLayout = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Debug Mode')
			.setDesc('Enable debug logging to console')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debugMode)
				.onChange(async (value) => {
					this.plugin.settings.debugMode = value;
					await this.plugin.saveSettings();
				}));
	}
}