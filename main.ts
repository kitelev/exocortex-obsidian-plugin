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
		const backlinks = (this.app.metadataCache as any).getBacklinksForFile(file);
		if (backlinks && backlinks.data && backlinks.data.size > 0) {
			dv.header(2, "Referenced By");
			const backlinkFiles = Array.from(backlinks.data.keys()).map((path: string) => {
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

	async findAllOntologies(): Promise<{ file: TFile; prefix: string; label: string }[]> {
		const ontologies: { file: TFile; prefix: string; label: string }[] = [];
		const files = this.app.vault.getFiles();
		
		for (const file of files) {
			const metadata = this.app.metadataCache.getFileCache(file);
			if (!metadata?.frontmatter) continue;
			
			const instanceClass = metadata.frontmatter['exo__Instance_class'];
			if (!instanceClass) continue;
			
			// Check if this is an ontology
			const classString = Array.isArray(instanceClass) ? instanceClass[0] : instanceClass;
			const cleanClass = classString?.toString().replace(/\[\[|\]\]/g, '');
			
			if (cleanClass === 'exo__Ontology' || cleanClass === 'exo__InternalOntology' || cleanClass === 'exo__ExternalOntology') {
				const prefix = metadata.frontmatter['exo__Ontology_prefix'] || 
							  metadata.frontmatter['exo__Ontology_namespace'] ||
							  file.basename.replace(/^!/, ''); // Remove leading ! from filename
				
				const label = metadata.frontmatter['exo__Asset_label'] || 
							 metadata.frontmatter['rdfs__label'] ||
							 file.basename;
				
				ontologies.push({ file, prefix, label });
			}
		}
		
		// Sort by prefix
		ontologies.sort((a, b) => a.prefix.localeCompare(b.prefix));
		
		// Always include default ontologies even if not found
		const defaultOntologies = ['exo', 'ems', 'gtd', 'ims'];
		for (const defaultPrefix of defaultOntologies) {
			if (!ontologies.some(o => o.prefix === defaultPrefix)) {
				ontologies.push({
					file: null as any,
					prefix: defaultPrefix,
					label: defaultPrefix.toUpperCase()
				});
			}
		}
		
		return ontologies;
	}

	async findAllClasses(): Promise<{ className: string; label: string; ontology: string }[]> {
		const classes: { className: string; label: string; ontology: string }[] = [];
		const files = this.app.vault.getFiles();
		
		for (const file of files) {
			const metadata = this.app.metadataCache.getFileCache(file);
			if (!metadata?.frontmatter) continue;
			
			const instanceClass = metadata.frontmatter['exo__Instance_class'];
			if (!instanceClass) continue;
			
			// Check if this is a class definition
			const classString = Array.isArray(instanceClass) ? instanceClass[0] : instanceClass;
			const cleanClass = classString?.toString().replace(/\[\[|\]\]/g, '');
			
			if (cleanClass === 'exo__Class' || cleanClass === 'owl__Class' || cleanClass === 'rdfs__Class') {
				const className = file.basename;
				const label = metadata.frontmatter['exo__Asset_label'] || 
							 metadata.frontmatter['rdfs__label'] ||
							 className;
				
				// Get the ontology this class is defined by (for information only)
				const isDefinedBy = metadata.frontmatter['exo__Asset_isDefinedBy'];
				const ontology = isDefinedBy ? isDefinedBy.toString().replace(/\[\[!?|\]\]/g, '') : 'unknown';
				
				classes.push({ className, label, ontology });
			}
		}
		
		// Add common classes if not already found
		const commonClasses = [
			// Exo core classes
			{ className: 'exo__Asset', label: 'Asset (Base)', ontology: 'exo' },
			{ className: 'exo__Class', label: 'Class', ontology: 'exo' },
			{ className: 'exo__Ontology', label: 'Ontology', ontology: 'exo' },
			{ className: 'exo__Instance', label: 'Instance', ontology: 'exo' },
			// EMS classes
			{ className: 'ems__Task', label: 'Task (EMS)', ontology: 'ems' },
			{ className: 'ems__Project', label: 'Project (EMS)', ontology: 'ems' },
			{ className: 'ems__Area', label: 'Area (EMS)', ontology: 'ems' },
			{ className: 'ems__Effort', label: 'Effort', ontology: 'ems' },
			// GTD classes
			{ className: 'gtd__Task', label: 'Task (GTD)', ontology: 'gtd' },
			{ className: 'gtd__Project', label: 'Project (GTD)', ontology: 'gtd' },
			{ className: 'gtd__Context', label: 'Context', ontology: 'gtd' },
			// IMS classes
			{ className: 'ims__Concept', label: 'Concept', ontology: 'ims' },
			{ className: 'ims__Definition', label: 'Definition', ontology: 'ims' },
			{ className: 'ims__Person', label: 'Person', ontology: 'ims' },
			{ className: 'ims__Organization', label: 'Organization', ontology: 'ims' },
			// Other common classes
			{ className: 'ztlk__Note', label: 'Note', ontology: 'ztlk' },
			{ className: 'lit__Book', label: 'Book', ontology: 'lit' },
			{ className: 'meet__Meeting', label: 'Meeting', ontology: 'meet' }
		];
		
		// Add common classes if not already found
		for (const commonClass of commonClasses) {
			if (!classes.some(c => c.className === commonClass.className)) {
				classes.push(commonClass);
			}
		}
		
		// Sort by className
		classes.sort((a, b) => a.className.localeCompare(b.className));
		
		return classes;
	}
}

class ExocortexNoteModal extends Modal {
	plugin: ExocortexPlugin;
	noteTitle: string = '';
	noteClass: string = 'exo__Asset';
	noteOntology: string = '';
	availableOntologies: { file: TFile; prefix: string; label: string }[] = [];
	availableClasses: { className: string; label: string; ontology: string }[] = [];

	constructor(app: App, plugin: ExocortexPlugin) {
		super(app);
		this.plugin = plugin;
		this.noteOntology = plugin.settings.defaultOntology;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Create Exocortex Note" });

		// Load available ontologies and classes
		this.availableOntologies = await this.plugin.findAllOntologies();
		this.availableClasses = await this.plugin.findAllClasses();
		
		// If current default ontology is not in the list, use the first one
		if (this.availableOntologies.length > 0 && !this.availableOntologies.some(o => o.prefix === this.noteOntology)) {
			this.noteOntology = this.availableOntologies[0].prefix;
		}

		new Setting(contentEl)
			.setName("Title")
			.setDesc("Note title")
			.addText(text => text
				.setPlaceholder("Enter note title")
				.setValue(this.noteTitle)
				.onChange(value => this.noteTitle = value));

		// Create the CLASS dropdown (now independent)
		new Setting(contentEl)
			.setName("Class")
			.setDesc("Select the type of asset (all available classes)")
			.addDropdown(dropdown => {
				// Add all classes to dropdown
				for (const classInfo of this.availableClasses) {
					const displayName = `${classInfo.className} - ${classInfo.label}`;
					dropdown.addOption(classInfo.className, displayName);
				}
				
				// Set default value
				if (this.availableClasses.length > 0) {
					// Try to find exo__Asset as default
					const defaultClass = this.availableClasses.find(c => c.className === 'exo__Asset');
					if (defaultClass) {
						this.noteClass = defaultClass.className;
						dropdown.setValue(defaultClass.className);
					} else {
						this.noteClass = this.availableClasses[0].className;
						dropdown.setValue(this.availableClasses[0].className);
					}
				}
				
				dropdown.onChange(value => {
					this.noteClass = value;
				});
			});
		
		// Create the ONTOLOGY dropdown (now independent)
		new Setting(contentEl)
			.setName("Ontology")
			.setDesc("Select which knowledge graph this asset belongs to")
			.addDropdown(dropdown => {
				// Add all found ontologies to dropdown
				for (const ontology of this.availableOntologies) {
					const displayName = `${ontology.prefix} - ${ontology.label}`;
					dropdown.addOption(ontology.prefix, displayName);
				}
				
				dropdown
					.setValue(this.noteOntology)
					.onChange(value => {
						this.noteOntology = value;
					});
			});

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