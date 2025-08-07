import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import { ClassTreeModal } from './src/presentation/modals/ClassTreeModal';
import { DIContainer } from './src/infrastructure/container/DIContainer';

interface ExocortexSettings {
	defaultOntology: string;
	enableAutoLayout: boolean;
	debugMode: boolean;
	templateFolderPath: string;
	layoutsFolderPath: string;
	enableClassLayouts: boolean;
}

const DEFAULT_SETTINGS: ExocortexSettings = {
	defaultOntology: 'exo',
	enableAutoLayout: true,
	debugMode: false,
	templateFolderPath: 'templates',
	layoutsFolderPath: 'layouts',
	enableClassLayouts: true
}

export default class ExocortexPlugin extends Plugin {
	settings: ExocortexSettings;
	private diContainer: DIContainer;

	async onload() {
		await this.loadSettings();

		// Initialize Dependency Injection Container
		this.diContainer = DIContainer.initialize(this.app, this);

		// Register the universal renderer function
		(window as any).ExoUIRender = async (dv: any, ctx: any) => {
			await this.renderUniversalLayout(dv, ctx);
		};

		// Add ribbon icon
		const ribbonIconEl = this.addRibbonIcon('brain', 'Exocortex', (evt: MouseEvent) => {
			new Notice('Exocortex plugin is active');
		});
		ribbonIconEl.addClass('exocortex-ribbon-class');

		// Add command to create new ExoAsset
		this.addCommand({
			id: 'create-exo-asset',
			name: 'Create ExoAsset',
			callback: () => {
				new ExocortexAssetModal(this.app, this).open();
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

		// Use new layout system if enabled
		if (this.settings.enableClassLayouts) {
			const layoutRenderer = this.diContainer.getLayoutRenderer();
			await layoutRenderer.renderLayout(ctx.container, file, metadata, dv);
			return;
		}

		// Old system fallback
		const layoutFile = await this.findLayoutForClass(assetClass);
		if (!layoutFile) {
			// Fallback to default layout
			await this.renderDefaultLayout(dv, file, metadata, ctx.container);
			return;
		}

		// Render the layout
		await this.renderLayout(dv, file, metadata, layoutFile, ctx.container);
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

	async renderDefaultLayout(dv: any, file: TFile, metadata: any, container: HTMLElement) {
		const frontmatter = metadata.frontmatter;
		
		// Get the asset class
		const assetClass = frontmatter['exo__Instance_class'];
		const cleanClassName = assetClass ? assetClass.toString().replace(/\[\[|\]\]/g, '') : 'exo__Asset';
		
		// Create properties section with inline editing
		dv.header(2, "Properties");
		
		// Create a container for editable properties
		const propertiesContainer = container.createDiv({ cls: 'exocortex-properties-container' });
		
		// Use PropertyRenderer for editable properties
		const propertyRenderer = this.diContainer.getPropertyRenderer();
		// Get the actual asset ID from frontmatter, or use filename as fallback
		const assetId = frontmatter['exo__Asset_uid'] || file.path;
		await propertyRenderer.renderPropertiesBlock(
			propertiesContainer,
			assetId,
			cleanClassName,
			frontmatter
		);

		// Show related assets
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

	async renderLayout(dv: any, file: TFile, metadata: any, layoutFile: TFile, container: HTMLElement) {
		// This would parse the layout file and render blocks accordingly
		// For now, using default layout
		await this.renderDefaultLayout(dv, file, metadata, container);
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
		// Trigger re-render of all open assets
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
			// Skip files in template folder
			if (this.settings.templateFolderPath && file.path.startsWith(this.settings.templateFolderPath + '/')) {
				continue;
			}
			
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
		isObjectProperty: boolean;
	}[]> {
		const properties: { 
			propertyName: string; 
			label: string; 
			range: string; 
			isRequired: boolean;
			description: string;
			isObjectProperty: boolean;
		}[] = [];
		
		// Get all properties for this class and its parents
		const classHierarchy = await this.getClassHierarchy(className);
		const files = this.app.vault.getFiles();
		
		for (const file of files) {
			// Skip files in template folder
			if (this.settings.templateFolderPath && file.path.startsWith(this.settings.templateFolderPath + '/')) {
				continue;
			}
			
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
						
						// Check if this is an ObjectProperty
						const isObjectProperty = cleanClass === 'exo__ObjectProperty' || cleanClass === 'owl__ObjectProperty';
						
						properties.push({ propertyName, label, range, isRequired, description, isObjectProperty });
					}
				}
			}
		}
		
		// Add common properties based on class if not found
		if (className === 'exo__Asset' || classHierarchy.includes('exo__Asset')) {
			const commonAssetProps = [
				{ propertyName: 'exo__Asset_label', label: 'Label', range: 'string', isRequired: true, description: 'Human-readable label', isObjectProperty: false },
				{ propertyName: 'exo__Asset_description', label: 'Description', range: 'text', isRequired: false, description: 'Detailed description', isObjectProperty: false },
				{ propertyName: 'exo__Asset_relates', label: 'Related Assets', range: 'array', isRequired: false, description: 'Links to related assets', isObjectProperty: false }
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
				{ propertyName: 'ems__Task_status', label: 'Status', range: 'enum:todo,in_progress,done', isRequired: false, description: 'Task status', isObjectProperty: false },
				{ propertyName: 'ems__Task_priority', label: 'Priority', range: 'enum:low,medium,high', isRequired: false, description: 'Task priority', isObjectProperty: false },
				{ propertyName: 'ems__Task_dueDate', label: 'Due Date', range: 'date', isRequired: false, description: 'When the task is due', isObjectProperty: false }
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

	async getAllSubclasses(className: string): Promise<string[]> {
		const subclasses: string[] = [className];
		const visited = new Set<string>();
		visited.add(className);
		const files = this.app.vault.getFiles();
		
		// Find all classes that inherit from this class (recursively)
		const findSubclassesRecursive = async (parentClass: string) => {
			for (const file of files) {
				// Skip files in template folder
				if (this.settings.templateFolderPath && file.path.startsWith(this.settings.templateFolderPath + '/')) {
					continue;
				}
				
				const metadata = this.app.metadataCache.getFileCache(file);
				if (!metadata?.frontmatter) continue;
				
				const instanceClass = metadata.frontmatter['exo__Instance_class'];
				if (!instanceClass) continue;
				
				// Check if this is a class definition
				const classString = Array.isArray(instanceClass) ? instanceClass[0] : instanceClass;
				const cleanClass = classString?.toString().replace(/\[\[|\]\]/g, '');
				
				if (cleanClass === 'exo__Class' || cleanClass === 'owl__Class' || cleanClass === 'rdfs__Class') {
					const superClass = metadata.frontmatter['exo__Class_superClass'] || 
									   metadata.frontmatter['rdfs__subClassOf'];
					
					if (superClass) {
						const superClasses = Array.isArray(superClass) ? superClass : [superClass];
						for (const sc of superClasses) {
							const superClassClean = sc.toString().replace(/\[\[|\]\]/g, '');
							
							if (superClassClean === parentClass && !visited.has(file.basename)) {
								visited.add(file.basename);
								subclasses.push(file.basename);
								// Recursively find subclasses of this subclass
								await findSubclassesRecursive(file.basename);
							}
						}
					}
				}
			}
		};
		
		await findSubclassesRecursive(className);
		return subclasses;
	}

	async buildClassHierarchyTree(): Promise<any[]> {
		const files = this.app.vault.getFiles();
		const classesMap = new Map<string, any>();
		const rootClasses: any[] = [];
		
		// First pass: collect all classes and their metadata
		for (const file of files) {
			if (this.settings.templateFolderPath && file.path.startsWith(this.settings.templateFolderPath + '/')) {
				continue;
			}
			
			const metadata = this.app.metadataCache.getFileCache(file);
			if (!metadata?.frontmatter) continue;
			
			const instanceClass = metadata.frontmatter['exo__Instance_class'];
			if (!instanceClass) continue;
			
			const classString = Array.isArray(instanceClass) ? instanceClass[0] : instanceClass;
			const cleanClass = classString?.toString().replace(/\[\[|\]\]/g, '');
			
			if (cleanClass === 'exo__Class' || cleanClass === 'owl__Class' || cleanClass === 'rdfs__Class') {
				const className = file.basename;
				const label = metadata.frontmatter['exo__Asset_label'] || 
							 metadata.frontmatter['rdfs__label'] ||
							 className;
				
				const superClass = metadata.frontmatter['exo__Class_superClass'] || 
								  metadata.frontmatter['rdfs__subClassOf'];
				
				const superClasses = superClass 
					? (Array.isArray(superClass) ? superClass : [superClass])
						.map(sc => sc.toString().replace(/\[\[|\]\]/g, ''))
					: [];
				
				const isDefinedBy = metadata.frontmatter['exo__Asset_isDefinedBy'];
				const ontology = isDefinedBy ? isDefinedBy.toString().replace(/\[\[!?|\]\]/g, '') : 'unknown';
				
				classesMap.set(className, {
					className,
					label,
					ontology,
					superClasses,
					children: []
				});
			}
		}
		
		// Add common classes if not found
		const commonClasses = [
			{ className: 'exo__Asset', label: 'Asset (Base)', ontology: 'exo', superClasses: [] },
			{ className: 'exo__Class', label: 'Class', ontology: 'exo', superClasses: ['exo__Asset'] },
			{ className: 'exo__Ontology', label: 'Ontology', ontology: 'exo', superClasses: ['exo__Asset'] },
			{ className: 'exo__Instance', label: 'Instance', ontology: 'exo', superClasses: ['exo__Asset'] },
			{ className: 'ems__Task', label: 'Task (EMS)', ontology: 'ems', superClasses: ['exo__Asset'] },
			{ className: 'ems__Project', label: 'Project (EMS)', ontology: 'ems', superClasses: ['exo__Asset'] },
			{ className: 'ems__Area', label: 'Area (EMS)', ontology: 'ems', superClasses: ['exo__Asset'] },
			{ className: 'ems__Effort', label: 'Effort', ontology: 'ems', superClasses: ['exo__Asset'] },
			{ className: 'gtd__Task', label: 'Task (GTD)', ontology: 'gtd', superClasses: ['exo__Asset'] },
			{ className: 'gtd__Project', label: 'Project (GTD)', ontology: 'gtd', superClasses: ['exo__Asset'] },
			{ className: 'gtd__Context', label: 'Context', ontology: 'gtd', superClasses: ['exo__Asset'] },
			{ className: 'ims__Concept', label: 'Concept', ontology: 'ims', superClasses: ['exo__Asset'] },
			{ className: 'ims__Definition', label: 'Definition', ontology: 'ims', superClasses: ['exo__Asset'] },
			{ className: 'ims__Person', label: 'Person', ontology: 'ims', superClasses: ['exo__Asset'] },
			{ className: 'ims__Organization', label: 'Organization', ontology: 'ims', superClasses: ['exo__Asset'] },
			{ className: 'ztlk__Note', label: 'Note', ontology: 'ztlk', superClasses: ['exo__Asset'] },
			{ className: 'lit__Book', label: 'Book', ontology: 'lit', superClasses: ['exo__Asset'] },
			{ className: 'meet__Meeting', label: 'Meeting', ontology: 'meet', superClasses: ['exo__Asset'] }
		];
		
		for (const commonClass of commonClasses) {
			if (!classesMap.has(commonClass.className)) {
				classesMap.set(commonClass.className, {
					...commonClass,
					children: []
				});
			}
		}
		
		// Build the tree with cycle detection
		const buildTreeRecursive = (className: string, visited: Set<string>, path: string[] = []): any => {
			if (visited.has(className)) {
				// Cycle detected
				return {
					className: `⚠️ Recursion to ${className}`,
					label: `Cycle detected`,
					ontology: '',
					isRecursion: true,
					children: []
				};
			}
			
			const classInfo = classesMap.get(className);
			if (!classInfo) {
				return null;
			}
			
			visited.add(className);
			path.push(className);
			
			const node = {
				...classInfo,
				children: []
			};
			
			// Find all children of this class
			for (const [childName, childInfo] of classesMap) {
				if (childInfo.superClasses.includes(className)) {
					const childNode = buildTreeRecursive(childName, new Set(visited), [...path]);
					if (childNode) {
						node.children.push(childNode);
					}
				}
			}
			
			// Sort children by className
			node.children.sort((a: any, b: any) => {
				if (a.isRecursion) return 1;
				if (b.isRecursion) return -1;
				return a.className.localeCompare(b.className);
			});
			
			return node;
		};
		
		// Find root classes (classes with no superclasses or only non-existent superclasses)
		for (const [className, classInfo] of classesMap) {
			const hasValidSuperClass = classInfo.superClasses.some((sc: string) => classesMap.has(sc));
			if (!hasValidSuperClass) {
				const tree = buildTreeRecursive(className, new Set(), []);
				if (tree) {
					rootClasses.push(tree);
				}
			}
		}
		
		// Sort root classes
		rootClasses.sort((a, b) => a.className.localeCompare(b.className));
		
		return rootClasses;
	}

	async findAllClasses(): Promise<{ className: string; label: string; ontology: string }[]> {
		const classes: { className: string; label: string; ontology: string }[] = [];
		const files = this.app.vault.getFiles();
		
		for (const file of files) {
			// Skip files in template folder
			if (this.settings.templateFolderPath && file.path.startsWith(this.settings.templateFolderPath + '/')) {
				continue;
			}
			
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

	async findAssetsByClass(className: string, includeSubclasses: boolean = true): Promise<{ fileName: string; label: string; path: string; actualClass: string }[]> {
		const assets: { fileName: string; label: string; path: string; actualClass: string }[] = [];
		const files = this.app.vault.getFiles();
		
		// Clean the class name from wiki links
		const cleanClassName = className.replace(/\[\[|\]\]/g, '');
		
		// Get all classes to search for (including subclasses if requested)
		let classesToSearch: string[] = [cleanClassName];
		if (includeSubclasses) {
			classesToSearch = await this.getAllSubclasses(cleanClassName);
		}
		
		for (const file of files) {
			// Skip files in template folder
			if (this.settings.templateFolderPath && file.path.startsWith(this.settings.templateFolderPath + '/')) {
				continue;
			}
			
			const metadata = this.app.metadataCache.getFileCache(file);
			if (!metadata?.frontmatter) continue;
			
			const instanceClass = metadata.frontmatter['exo__Instance_class'];
			if (!instanceClass) continue;
			
			// Check if this asset is of the requested class or its subclasses
			const classArray = Array.isArray(instanceClass) ? instanceClass : [instanceClass];
			const cleanClasses = classArray.map((c: any) => c?.toString().replace(/\[\[|\]\]/g, ''));
			
			// Check if any of the asset's classes match our search list
			const matchingClass = cleanClasses.find(c => classesToSearch.includes(c));
			if (matchingClass) {
				const label = metadata.frontmatter['exo__Asset_label'] || 
							 metadata.frontmatter['rdfs__label'] ||
							 file.basename;
				
				assets.push({
					fileName: file.basename,
					label: label,
					path: file.path,
					actualClass: matchingClass
				});
			}
		}
		
		// Sort by label
		assets.sort((a, b) => a.label.localeCompare(b.label));
		
		return assets;
	}
}

class ExocortexAssetModal extends Modal {
	plugin: ExocortexPlugin;
	assetTitle: string = '';
	assetClass: string = 'exo__Asset';
	assetOntology: string = '';  // This will store the fileName, not prefix
	availableOntologies: { file: TFile | null; prefix: string; label: string; fileName: string }[] = [];
	availableClasses: { className: string; label: string; ontology: string }[] = [];
	classHierarchyTree: any[] = [];
	flattenedClasses: { className: string; label: string; ontology: string; level: number; isRecursion: boolean }[] = [];
	propertyValues: Map<string, any> = new Map();
	propertiesContainer: HTMLElement | null = null;
	// Store property values for each class to preserve them when switching
	classPropertyValues: Map<string, Map<string, any>> = new Map();

	constructor(app: App, plugin: ExocortexPlugin) {
		super(app);
		this.plugin = plugin;
		// Add CSS class to modal for styling
		this.modalEl.addClass('exocortex-asset-modal');
		// Don't set assetOntology here - will do it in onOpen after loading ontologies
	}

	flattenClassTree(nodes: any[], level: number = 0, visited: Set<string> = new Set()): void {
		for (const node of nodes) {
			if (node.isRecursion) {
				this.flattenedClasses.push({
					className: node.className,
					label: node.label,
					ontology: node.ontology,
					level,
					isRecursion: true
				});
			} else {
				// Check if we've already added this class at this level (for multiple inheritance)
				const key = `${node.className}_${level}`;
				if (!visited.has(key)) {
					visited.add(key);
					this.flattenedClasses.push({
						className: node.className,
						label: node.label,
						ontology: node.ontology,
						level,
						isRecursion: false
					});
					
					if (node.children && node.children.length > 0) {
						this.flattenClassTree(node.children, level + 1, visited);
					}
				}
			}
		}
	}

	async onOpen() {
		const { contentEl } = this;
		
		// Add modal title with proper styling
		const titleEl = contentEl.createEl("h2", { 
			text: "Create ExoAsset",
			cls: "modal-title"
		});
		
		// Create form container
		const formEl = contentEl.createDiv({ cls: "modal-form" });

		// Load available ontologies and classes
		this.availableOntologies = await this.plugin.findAllOntologies();
		this.availableClasses = await this.plugin.findAllClasses();
		
		// Build class hierarchy tree
		this.classHierarchyTree = await this.plugin.buildClassHierarchyTree();
		this.flattenedClasses = [];
		this.flattenClassTree(this.classHierarchyTree);
		
		// Set default ontology based on saved prefix
		const defaultOntology = this.availableOntologies.find(o => o.prefix === this.plugin.settings.defaultOntology);
		if (defaultOntology) {
			this.assetOntology = defaultOntology.fileName;
		} else if (this.availableOntologies.length > 0) {
			// Fallback to first available if saved default not found
			this.assetOntology = this.availableOntologies[0].fileName;
		}

		new Setting(formEl)
			.setName("Title")
			.setDesc("Asset title")
			.addText(text => text
				.setPlaceholder("Enter asset title")
				.setValue(this.assetTitle)
				.onChange(value => this.assetTitle = value));

		// Create the CLASS selector with tree button
		const classSetting = new Setting(formEl)
			.setName("Class")
			.setDesc("Select the type of asset (tree hierarchy)");
			
		// Create a container for the button
		const buttonEl = classSetting.controlEl.createEl('button', {
			cls: 'class-selector-button'
		});
		
		// Initial setup for the button
		const updateButtonText = () => {
			buttonEl.empty();
			const textEl = buttonEl.createEl('span', {
				cls: 'class-selector-button-text',
				text: this.assetClass || 'Select a class...'
			});
			buttonEl.createEl('span', {
				cls: 'class-selector-button-icon',
				text: '▼'
			});
		};
		
		updateButtonText();
		
		// Set default value if we have classes
		if (this.flattenedClasses.length > 0) {
			// Try to find exo__Asset as default
			const defaultClass = this.flattenedClasses.find(c => c.className === 'exo__Asset' && !c.isRecursion);
			if (defaultClass) {
				this.assetClass = defaultClass.className;
			} else {
				// Find first non-recursion class
				const firstClass = this.flattenedClasses.find(c => !c.isRecursion);
				if (firstClass) {
					this.assetClass = firstClass.className;
				}
			}
			updateButtonText();
		}
		
		// Add click handler to open tree modal
		buttonEl.addEventListener('click', () => {
			const treeModal = new ClassTreeModal(
				this.app,
				this.classHierarchyTree,
				this.assetClass,
				async (selectedClass: string) => {
					// Save current property values for the previous class before switching
					if (this.assetClass && this.propertyValues.size > 0) {
						this.classPropertyValues.set(this.assetClass, new Map(this.propertyValues));
					}
					
					this.assetClass = selectedClass;
					updateButtonText();
					// Update properties when class changes
					await this.updatePropertiesForClass(selectedClass);
				}
			);
			treeModal.open();
		});
		
		// Create the ONTOLOGY dropdown (now independent)
		new Setting(formEl)
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
					.setValue(this.assetOntology)
					.onChange(value => {
						this.assetOntology = value; // This now stores the fileName
					});
			});

		// Add a separator
		formEl.createEl("h3", { text: "Properties", cls: "exocortex-properties-header" });
		
		// Create container for dynamic properties
		this.propertiesContainer = formEl.createDiv({ cls: "exocortex-properties-container" });
		
		// Load initial properties for default class
		await this.updatePropertiesForClass(this.assetClass);

		// Create button container
		const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });
		
		new Setting(buttonContainer)
			.addButton(btn => btn
				.setButtonText("Create")
				.setCta()
				.onClick(() => {
					this.createAsset();
					this.close();
				}));
	}

	async updatePropertiesForClass(className: string) {
		if (!this.propertiesContainer) return;
		
		// Clear existing properties
		this.propertiesContainer.empty();
		this.propertyValues.clear();
		
		// Check if we have saved values for this class and restore them
		const savedValues = this.classPropertyValues.get(className);
		if (savedValues) {
			this.propertyValues = new Map(savedValues);
		}
		
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
			
			// Check if this is an ObjectProperty - show dropdown with assets of the range class
			if (prop.isObjectProperty && prop.range) {
				// Clean the range to get the class name
				const rangeClass = prop.range.replace(/\[\[|\]\]/g, '');
				
				// Get all assets of this class
				const assets = await this.plugin.findAssetsByClass(rangeClass);
				
				setting.addDropdown(dropdown => {
					dropdown.addOption('', '-- Select --');
					for (const asset of assets) {
						// Show both label and filename for clarity
						const displayName = asset.label !== asset.fileName 
							? `${asset.label} (${asset.fileName})`
							: asset.fileName;
						// Store as wiki link
						const wikiLink = `[[${asset.fileName}]]`;
						dropdown.addOption(wikiLink, displayName);
					}
					
					// Set saved value if exists
					const savedValue = this.propertyValues.get(prop.propertyName);
					if (savedValue) {
						dropdown.setValue(savedValue);
					}
					
					dropdown.onChange(value => {
						if (value) {
							this.propertyValues.set(prop.propertyName, value);
						} else {
							this.propertyValues.delete(prop.propertyName);
						}
					});
				});
			} else if (prop.range.startsWith('enum:')) {
				// Dropdown for enum
				const options = prop.range.substring(5).split(',');
				setting.addDropdown(dropdown => {
					dropdown.addOption('', '-- Select --');
					for (const option of options) {
						dropdown.addOption(option, option);
					}
					
					// Set saved value if exists
					const savedValue = this.propertyValues.get(prop.propertyName);
					if (savedValue) {
						dropdown.setValue(savedValue);
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
					// Set saved value if exists
					const savedValue = this.propertyValues.get(prop.propertyName);
					if (savedValue !== undefined) {
						toggle.setValue(savedValue);
					}
					
					toggle.onChange(value => {
						this.propertyValues.set(prop.propertyName, value);
					});
				});
			} else if (prop.range === 'date') {
				// Text input for date (could be enhanced with date picker)
				setting.addText(text => {
					text.setPlaceholder('YYYY-MM-DD');
					
					// Set saved value if exists
					const savedValue = this.propertyValues.get(prop.propertyName);
					if (savedValue) {
						text.setValue(savedValue);
					}
					
					text.onChange(value => {
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
					text.setPlaceholder('Enter number');
					
					// Set saved value if exists
					const savedValue = this.propertyValues.get(prop.propertyName);
					if (savedValue !== undefined) {
						text.setValue(savedValue.toString());
					}
					
					text.onChange(value => {
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
					text.setPlaceholder('Enter ' + prop.label.toLowerCase());
					
					// Set saved value if exists
					const savedValue = this.propertyValues.get(prop.propertyName);
					if (savedValue) {
						text.setValue(savedValue);
					}
					
					text.onChange(value => {
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
					text.setPlaceholder('Comma-separated values or [[links]]');
					
					// Set saved value if exists
					const savedValue = this.propertyValues.get(prop.propertyName);
					if (savedValue) {
						// Convert array back to string for display
						if (Array.isArray(savedValue)) {
							text.setValue(savedValue.join(', '));
						} else {
							text.setValue(savedValue);
						}
					}
					
					text.onChange(value => {
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
					text.setPlaceholder('Enter ' + prop.label.toLowerCase());
					
					// Set saved value if exists
					const savedValue = this.propertyValues.get(prop.propertyName);
					if (savedValue) {
						text.setValue(savedValue);
					}
					
					text.onChange(value => {
						if (value) {
							this.propertyValues.set(prop.propertyName, value);
						} else {
							this.propertyValues.delete(prop.propertyName);
						}
					});
				});
			}
			
			// Set default value for label if it's the Asset label property and no saved value exists
			if (prop.propertyName === 'exo__Asset_label' && this.assetTitle && !this.propertyValues.has(prop.propertyName)) {
				this.propertyValues.set(prop.propertyName, this.assetTitle);
				// Update the input if it exists
				const input = this.propertiesContainer.querySelector(`input[placeholder*="${prop.label.toLowerCase()}"]`) as HTMLInputElement;
				if (input) {
					input.value = this.assetTitle;
				}
			}
		}
	}

	async createAsset() {
		const fileName = `${this.assetTitle}.md`;
		
		// Build frontmatter with all properties
		let frontmatterLines = [
			`exo__Asset_isDefinedBy: "[[${this.assetOntology}]]"`,
			`exo__Asset_uid: ${this.generateUUID()}`,
			`exo__Asset_createdAt: ${new Date().toISOString()}`,
			`exo__Instance_class:`,
			`  - "[[${this.assetClass}]]"`
		];
		
		// Add label if not already in propertyValues
		if (!this.propertyValues.has('exo__Asset_label')) {
			frontmatterLines.push(`exo__Asset_label: "${this.assetTitle}"`);
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
			new Notice(`Created asset: ${fileName}`);
		} catch (error) {
			new Notice(`Error creating asset: ${error.message}`);
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
			.setDesc('Default ontology for new assets')
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
			.setName('Template Folder Path')
			.setDesc('Path to folder containing template files (these will be excluded from dropdowns)')
			.addText(text => text
				.setPlaceholder('templates')
				.setValue(this.plugin.settings.templateFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.templateFolderPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Layouts Folder Path')
			.setDesc('Path to folder containing UI layout configurations')
			.addText(text => text
				.setPlaceholder('layouts')
				.setValue(this.plugin.settings.layoutsFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.layoutsFolderPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Class-Based Layouts')
			.setDesc('Use configurable layouts based on asset class')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableClassLayouts)
				.onChange(async (value) => {
					this.plugin.settings.enableClassLayouts = value;
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