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

	async findClassesForOntology(ontologyPrefix: string): Promise<{ className: string; label: string }[]> {
		const classes: { className: string; label: string }[] = [];
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
				// Check if this class belongs to the selected ontology
				const isDefinedBy = metadata.frontmatter['exo__Asset_isDefinedBy'];
				if (isDefinedBy) {
					const definedByClean = isDefinedBy.toString().replace(/\[\[!?|\]\]/g, '');
					if (definedByClean === ontologyPrefix) {
						const className = file.basename;
						const label = metadata.frontmatter['exo__Asset_label'] || 
									 metadata.frontmatter['rdfs__label'] ||
									 className;
						
						classes.push({ className, label });
					}
				}
			}
		}
		
		// Add common classes for known ontologies
		const commonClasses: Record<string, { className: string; label: string }[]> = {
			'exo': [
				{ className: 'exo__Asset', label: 'Asset' },
				{ className: 'exo__Class', label: 'Class' },
				{ className: 'exo__Ontology', label: 'Ontology' },
				{ className: 'exo__Instance', label: 'Instance' }
			],
			'ems': [
				{ className: 'ems__Task', label: 'Task' },
				{ className: 'ems__Project', label: 'Project' },
				{ className: 'ems__Area', label: 'Area' },
				{ className: 'ems__Effort', label: 'Effort' }
			],
			'gtd': [
				{ className: 'gtd__Task', label: 'Task' },
				{ className: 'gtd__Project', label: 'Project' },
				{ className: 'gtd__Context', label: 'Context' }
			],
			'ims': [
				{ className: 'ims__Concept', label: 'Concept' },
				{ className: 'ims__Definition', label: 'Definition' },
				{ className: 'ims__Person', label: 'Person' },
				{ className: 'ims__Organization', label: 'Organization' }
			]
		};
		
		// Add common classes if not already found
		if (commonClasses[ontologyPrefix]) {
			for (const commonClass of commonClasses[ontologyPrefix]) {
				if (!classes.some(c => c.className === commonClass.className)) {
					classes.push(commonClass);
				}
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

	constructor(app: App, plugin: ExocortexPlugin) {
		super(app);
		this.plugin = plugin;
		this.noteOntology = plugin.settings.defaultOntology;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Create Exocortex Note" });

		// Load available ontologies
		this.availableOntologies = await this.plugin.findAllOntologies();
		
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

		// Create the ontology dropdown first
		let classDropdown: any = null;
		
		new Setting(contentEl)
			.setName("Ontology")
			.setDesc("Select ontology from your vault")
			.addDropdown(dropdown => {
				// Add all found ontologies to dropdown
				for (const ontology of this.availableOntologies) {
					const displayName = `${ontology.prefix} - ${ontology.label}`;
					dropdown.addOption(ontology.prefix, displayName);
				}
				
				dropdown
					.setValue(this.noteOntology)
					.onChange(async value => {
						this.noteOntology = value;
						// Update the class dropdown when ontology changes
						await this.updateClassDropdown(classDropdown, value);
					});
			});

		// Create the class dropdown
		const classSetting = new Setting(contentEl)
			.setName("Class")
			.setDesc("Select class from the chosen ontology");
		
		classSetting.addDropdown(dropdown => {
			classDropdown = dropdown;
			// Initialize with classes from the default ontology
			this.updateClassDropdown(dropdown, this.noteOntology);
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
	
	async updateClassDropdown(dropdown: any, ontologyPrefix: string) {
		if (!dropdown) return;
		
		// Clear existing options
		dropdown.selectEl.empty();
		
		// Get classes for this ontology
		const classes = await this.plugin.findClassesForOntology(ontologyPrefix);
		
		// Add classes to dropdown
		for (const classInfo of classes) {
			const displayName = `${classInfo.className} - ${classInfo.label}`;
			dropdown.addOption(classInfo.className, displayName);
		}
		
		// Set default selection
		if (classes.length > 0) {
			// Try to find a sensible default based on ontology
			let defaultClass = classes[0].className;
			
			switch(ontologyPrefix) {
				case 'ems':
					const emsTask = classes.find(c => c.className === 'ems__Task');
					if (emsTask) defaultClass = emsTask.className;
					break;
				case 'gtd':
					const gtdTask = classes.find(c => c.className === 'gtd__Task');
					if (gtdTask) defaultClass = gtdTask.className;
					break;
				case 'ims':
					const concept = classes.find(c => c.className === 'ims__Concept');
					if (concept) defaultClass = concept.className;
					break;
				case 'exo':
					const asset = classes.find(c => c.className === 'exo__Asset');
					if (asset) defaultClass = asset.className;
					break;
			}
			
			this.noteClass = defaultClass;
			dropdown.setValue(defaultClass);
		}
		
		// Add change listener
		dropdown.onChange((value: string) => {
			this.noteClass = value;
		});
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