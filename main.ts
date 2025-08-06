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

	async findAllOntologies(): Promise<{ file: TFile | null; prefix: string; label: string; fileName: string }[]> {
		const ontologies: { file: TFile | null; prefix: string; label: string; fileName: string }[] = [];
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
				
				// Store the actual filename (basename) for linking
				const fileName = file.basename;
				
				ontologies.push({ file, prefix, label, fileName });
			}
		}
		
		// Sort by prefix
		ontologies.sort((a, b) => a.prefix.localeCompare(b.prefix));
		
		// Always include default ontologies even if not found
		// These will use the convention of !prefix for the filename
		const defaultOntologies = [
			{ prefix: 'exo', label: 'EXO', fileName: '!exo' },
			{ prefix: 'ems', label: 'EMS', fileName: '!ems' },
			{ prefix: 'gtd', label: 'GTD', fileName: '!gtd' },
			{ prefix: 'ims', label: 'IMS', fileName: '!ims' }
		];
		
		for (const defaultOnt of defaultOntologies) {
			if (!ontologies.some(o => o.prefix === defaultOnt.prefix)) {
				ontologies.push({
					file: null,
					prefix: defaultOnt.prefix,
					label: defaultOnt.label,
					fileName: defaultOnt.fileName
				});
			}
		}
		
		return ontologies;
	}

	async findPropertiesForClass(className: string): Promise<{ 
		propertyName: string; 
		label: string; 
		range: string; 
		isRequired: boolean;
		description: string;
	}[]> {
		const properties: { 
			propertyName: string; 
			label: string; 
			range: string; 
			isRequired: boolean;
			description: string;
		}[] = [];
		
		// Get all properties for this class and its parents
		const classHierarchy = await this.getClassHierarchy(className);
		const files = this.app.vault.getFiles();
		
		for (const file of files) {
			const metadata = this.app.metadataCache.getFileCache(file);
			if (!metadata?.frontmatter) continue;
			
			const instanceClass = metadata.frontmatter['exo__Instance_class'];
			if (!instanceClass) continue;
			
			// Check if this is a property definition
			const classString = Array.isArray(instanceClass) ? instanceClass[0] : instanceClass;
			const cleanClass = classString?.toString().replace(/\[\[|\]\]/g, '');
			
			if (cleanClass === 'exo__Property' || cleanClass === 'exo__DatatypeProperty' || cleanClass === 'exo__ObjectProperty' || 
				cleanClass === 'rdf__Property' || cleanClass === 'owl__DatatypeProperty' || cleanClass === 'owl__ObjectProperty') {
				
				// Check if this property applies to our class or its parents
				const domain = metadata.frontmatter['exo__Property_domain'] || 
							  metadata.frontmatter['rdfs__domain'];
				if (domain) {
					const domainClean = Array.isArray(domain) 
						? domain.map(d => d.toString().replace(/\[\[|\]\]/g, ''))
						: [domain.toString().replace(/\[\[|\]\]/g, '')];
					
					// Check if any of the domains match our class hierarchy
					const applies = domainClean.some(d => classHierarchy.includes(d));
					
					if (applies) {
						const propertyName = file.basename;
						const label = metadata.frontmatter['exo__Asset_label'] || 
									 metadata.frontmatter['rdfs__label'] ||
									 propertyName;
						
						const range = metadata.frontmatter['exo__Property_range'] || 
									 metadata.frontmatter['rdfs__range'] ||
									 'string';
						
						const isRequired = metadata.frontmatter['exo__Property_required'] || false;
						const description = metadata.frontmatter['exo__Asset_description'] || 
										   metadata.frontmatter['rdfs__comment'] || '';
						
						properties.push({ propertyName, label, range, isRequired, description });
					}
				}
			}
		}
		
		// Add common properties based on class if not found
		if (className === 'exo__Asset' || classHierarchy.includes('exo__Asset')) {
			const commonAssetProps = [
				{ propertyName: 'exo__Asset_label', label: 'Label', range: 'string', isRequired: true, description: 'Human-readable label' },
				{ propertyName: 'exo__Asset_description', label: 'Description', range: 'text', isRequired: false, description: 'Detailed description' },
				{ propertyName: 'exo__Asset_relates', label: 'Related Assets', range: 'array', isRequired: false, description: 'Links to related assets' }
			];
			
			for (const prop of commonAssetProps) {
				if (!properties.some(p => p.propertyName === prop.propertyName)) {
					properties.push(prop);
				}
			}
		}
		
		// Add class-specific common properties
		if (className === 'ems__Task') {
			const taskProps = [
				{ propertyName: 'ems__Task_status', label: 'Status', range: 'enum:todo,in_progress,done', isRequired: false, description: 'Task status' },
				{ propertyName: 'ems__Task_priority', label: 'Priority', range: 'enum:low,medium,high', isRequired: false, description: 'Task priority' },
				{ propertyName: 'ems__Task_dueDate', label: 'Due Date', range: 'date', isRequired: false, description: 'When the task is due' }
			];
			
			for (const prop of taskProps) {
				if (!properties.some(p => p.propertyName === prop.propertyName)) {
					properties.push(prop);
				}
			}
		}
		
		return properties;
	}

	async getClassHierarchy(className: string): Promise<string[]> {
		const hierarchy: string[] = [className];
		const visited = new Set<string>();
		visited.add(className);
		
		let current = className;
		const files = this.app.vault.getFiles();
		
		// Recursively find parent classes
		while (current) {
			let parentFound = false;
			
			for (const file of files) {
				if (file.basename === current) {
					const metadata = this.app.metadataCache.getFileCache(file);
					if (metadata?.frontmatter) {
						const superClass = metadata.frontmatter['exo__Class_superClass'] || 
										  metadata.frontmatter['rdfs__subClassOf'];
						
						if (superClass) {
							const superClassClean = Array.isArray(superClass) 
								? superClass[0].toString().replace(/\[\[|\]\]/g, '')
								: superClass.toString().replace(/\[\[|\]\]/g, '');
							
							if (!visited.has(superClassClean)) {
								hierarchy.push(superClassClean);
								visited.add(superClassClean);
								current = superClassClean;
								parentFound = true;
								break;
							}
						}
					}
				}
			}
			
			if (!parentFound) break;
		}
		
		return hierarchy;
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
	noteOntology: string = '';  // This will store the fileName, not prefix
	availableOntologies: { file: TFile | null; prefix: string; label: string; fileName: string }[] = [];
	availableClasses: { className: string; label: string; ontology: string }[] = [];
	propertyValues: Map<string, any> = new Map();
	propertiesContainer: HTMLElement | null = null;

	constructor(app: App, plugin: ExocortexPlugin) {
		super(app);
		this.plugin = plugin;
		// Initialize with default ontology filename
		this.noteOntology = `!${plugin.settings.defaultOntology}`;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Create Exocortex Note" });

		// Load available ontologies and classes
		this.availableOntologies = await this.plugin.findAllOntologies();
		this.availableClasses = await this.plugin.findAllClasses();
		
		// If current default ontology fileName is not in the list, use the first one
		if (this.availableOntologies.length > 0 && !this.availableOntologies.some(o => o.fileName === this.noteOntology)) {
			this.noteOntology = this.availableOntologies[0].fileName;
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
				
				dropdown.onChange(async value => {
					this.noteClass = value;
					// Update properties when class changes
					await this.updatePropertiesForClass(value);
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
					// Use fileName as the value to store the correct reference
					dropdown.addOption(ontology.fileName, displayName);
				}
				
				dropdown
					.setValue(this.noteOntology)
					.onChange(value => {
						this.noteOntology = value; // This now stores the fileName
					});
			});

		// Add a separator
		contentEl.createEl("h3", { text: "Properties", cls: "exocortex-properties-header" });
		
		// Create container for dynamic properties
		this.propertiesContainer = contentEl.createDiv({ cls: "exocortex-properties-container" });
		
		// Load initial properties for default class
		await this.updatePropertiesForClass(this.noteClass);

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText("Create")
				.setCta()
				.onClick(() => {
					this.createNote();
					this.close();
				}));
	}

	async updatePropertiesForClass(className: string) {
		if (!this.propertiesContainer) return;
		
		// Clear existing properties
		this.propertiesContainer.empty();
		this.propertyValues.clear();
		
		// Get properties for this class
		const properties = await this.plugin.findPropertiesForClass(className);
		
		if (properties.length === 0) {
			this.propertiesContainer.createEl("p", { 
				text: "No specific properties for this class", 
				cls: "exocortex-no-properties" 
			});
			return;
		}
		
		// Create input for each property
		for (const prop of properties) {
			const setting = new Setting(this.propertiesContainer)
				.setName(prop.label + (prop.isRequired ? ' *' : ''))
				.setDesc(prop.description);
			
			// Add appropriate input based on range
			if (prop.range.startsWith('enum:')) {
				// Dropdown for enum
				const options = prop.range.substring(5).split(',');
				setting.addDropdown(dropdown => {
					dropdown.addOption('', '-- Select --');
					for (const option of options) {
						dropdown.addOption(option, option);
					}
					dropdown.onChange(value => {
						if (value) {
							this.propertyValues.set(prop.propertyName, value);
						} else {
							this.propertyValues.delete(prop.propertyName);
						}
					});
				});
			} else if (prop.range === 'boolean') {
				// Toggle for boolean
				setting.addToggle(toggle => {
					toggle.onChange(value => {
						this.propertyValues.set(prop.propertyName, value);
					});
				});
			} else if (prop.range === 'date') {
				// Text input for date (could be enhanced with date picker)
				setting.addText(text => {
					text.setPlaceholder('YYYY-MM-DD')
						.onChange(value => {
							if (value) {
								this.propertyValues.set(prop.propertyName, value);
							} else {
								this.propertyValues.delete(prop.propertyName);
							}
						});
				});
			} else if (prop.range === 'number') {
				// Text input for number
				setting.addText(text => {
					text.setPlaceholder('Enter number')
						.onChange(value => {
							if (value) {
								const num = parseFloat(value);
								if (!isNaN(num)) {
									this.propertyValues.set(prop.propertyName, num);
								}
							} else {
								this.propertyValues.delete(prop.propertyName);
							}
						});
				});
			} else if (prop.range === 'text' || prop.propertyName.includes('description') || prop.propertyName.includes('comment')) {
				// Textarea for long text
				setting.addTextArea(text => {
					text.setPlaceholder('Enter ' + prop.label.toLowerCase())
						.onChange(value => {
							if (value) {
								this.propertyValues.set(prop.propertyName, value);
							} else {
								this.propertyValues.delete(prop.propertyName);
							}
						});
				});
			} else if (prop.range === 'array' || prop.propertyName.includes('relates')) {
				// Text input for arrays (comma-separated)
				setting.addText(text => {
					text.setPlaceholder('Comma-separated values or [[links]]')
						.onChange(value => {
							if (value) {
								// Parse as array of wiki links if contains [[
								if (value.includes('[[')) {
									const links = value.match(/\[\[([^\]]+)\]\]/g) || [];
									this.propertyValues.set(prop.propertyName, links);
								} else {
									// Otherwise split by comma
									const items = value.split(',').map(s => s.trim()).filter(s => s);
									this.propertyValues.set(prop.propertyName, items);
								}
							} else {
								this.propertyValues.delete(prop.propertyName);
							}
						});
				});
			} else {
				// Default text input
				setting.addText(text => {
					text.setPlaceholder('Enter ' + prop.label.toLowerCase())
						.onChange(value => {
							if (value) {
								this.propertyValues.set(prop.propertyName, value);
							} else {
								this.propertyValues.delete(prop.propertyName);
							}
						});
				});
			}
			
			// Set default value for label if it's the Asset label property
			if (prop.propertyName === 'exo__Asset_label' && this.noteTitle) {
				this.propertyValues.set(prop.propertyName, this.noteTitle);
				// Update the input if it exists
				const input = this.propertiesContainer.querySelector(`input[placeholder*="${prop.label.toLowerCase()}"]`) as HTMLInputElement;
				if (input) {
					input.value = this.noteTitle;
				}
			}
		}
	}

	async createNote() {
		const fileName = `${this.noteTitle}.md`;
		
		// Build frontmatter with all properties
		let frontmatterLines = [
			`exo__Asset_isDefinedBy: "[[${this.noteOntology}]]"`,
			`exo__Asset_uid: ${this.generateUUID()}`,
			`exo__Asset_createdAt: ${new Date().toISOString()}`,
			`exo__Instance_class:`,
			`  - "[[${this.noteClass}]]"`
		];
		
		// Add label if not already in propertyValues
		if (!this.propertyValues.has('exo__Asset_label')) {
			frontmatterLines.push(`exo__Asset_label: "${this.noteTitle}"`);
		}
		
		// Add all property values
		for (const [propName, propValue] of this.propertyValues) {
			if (Array.isArray(propValue)) {
				// Handle arrays
				frontmatterLines.push(`${propName}:`);
				for (const item of propValue) {
					if (typeof item === 'string' && item.includes('[[')) {
						frontmatterLines.push(`  - "${item}"`);
					} else {
						frontmatterLines.push(`  - ${JSON.stringify(item)}`);
					}
				}
			} else if (typeof propValue === 'boolean') {
				frontmatterLines.push(`${propName}: ${propValue}`);
			} else if (typeof propValue === 'number') {
				frontmatterLines.push(`${propName}: ${propValue}`);
			} else if (typeof propValue === 'string') {
				// Handle strings, checking for wiki links
				if (propValue.includes('[[')) {
					frontmatterLines.push(`${propName}: "${propValue}"`);
				} else if (propValue.includes('\n')) {
					// Multiline string
					frontmatterLines.push(`${propName}: |`);
					const lines = propValue.split('\n');
					for (const line of lines) {
						frontmatterLines.push(`  ${line}`);
					}
				} else {
					frontmatterLines.push(`${propName}: "${propValue}"`);
				}
			} else {
				frontmatterLines.push(`${propName}: ${JSON.stringify(propValue)}`);
			}
		}
		
		const frontmatter = `---
${frontmatterLines.join('\n')}
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

	async display(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Exocortex Settings' });

		// Load available ontologies
		const ontologies = await this.plugin.findAllOntologies();

		new Setting(containerEl)
			.setName('Default Ontology')
			.setDesc('Default ontology for new notes')
			.addDropdown(dropdown => {
				// Add all found ontologies to dropdown
				for (const ontology of ontologies) {
					const displayName = `${ontology.prefix} - ${ontology.label}`;
					dropdown.addOption(ontology.prefix, displayName);
				}
				
				// Set current value
				dropdown.setValue(this.plugin.settings.defaultOntology);
				
				// Handle change
				dropdown.onChange(async (value) => {
					this.plugin.settings.defaultOntology = value;
					await this.plugin.saveSettings();
				});
			});

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