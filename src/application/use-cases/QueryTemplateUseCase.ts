import { IQueryTemplateRepository, TemplateSearchCriteria } from '../../domain/repositories/IQueryTemplateRepository';
import { QueryTemplate, TemplateCategory, TemplateDifficulty } from '../../domain/visual/QueryTemplate';
import { VisualQueryNode, NodeType } from '../../domain/visual/VisualQueryNode';
import { VisualQueryEdge, EdgeType } from '../../domain/visual/VisualQueryEdge';

export class QueryTemplateUseCase {
    constructor(
        private readonly templateRepository: IQueryTemplateRepository
    ) {}

    getTemplateRepository(): IQueryTemplateRepository {
        return this.templateRepository;
    }

    async getAllTemplates(): Promise<QueryTemplate[]> {
        return await this.templateRepository.findAll();
    }

    async getTemplateById(id: string): Promise<QueryTemplate | undefined> {
        return await this.templateRepository.findById(id);
    }

    async searchTemplates(criteria: TemplateSearchCriteria): Promise<QueryTemplate[]> {
        return await this.templateRepository.findByCriteria(criteria);
    }

    async getTemplatesByCategory(category: TemplateCategory): Promise<QueryTemplate[]> {
        return await this.templateRepository.findByCategory(category);
    }

    async getBuiltInTemplates(): Promise<QueryTemplate[]> {
        return await this.templateRepository.getBuiltInTemplates();
    }

    async getCustomTemplates(): Promise<QueryTemplate[]> {
        return await this.templateRepository.getCustomTemplates();
    }

    async getRecentTemplates(limit?: number): Promise<QueryTemplate[]> {
        return await this.templateRepository.getRecentlyUsed(limit);
    }

    async saveTemplate(template: QueryTemplate): Promise<QueryTemplate> {
        if (template.isBuiltInTemplate()) {
            throw new Error('Cannot save built-in templates');
        }
        return await this.templateRepository.save(template);
    }

    async createCustomTemplate(
        nodes: Map<string, VisualQueryNode>,
        edges: Map<string, VisualQueryEdge>,
        viewport: { x: number; y: number; zoom: number },
        name: string,
        description: string,
        category: TemplateCategory = TemplateCategory.CUSTOM,
        tags: string[] = []
    ): Promise<QueryTemplate> {
        const metadata = {
            name,
            description,
            category,
            tags: [...tags, 'custom'],
            difficulty: 'intermediate' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0'
        };

        const template = QueryTemplate.fromCanvas(nodes, edges, viewport, {
            name,
            description,
            category,
            difficulty: TemplateDifficulty.INTERMEDIATE,
            tags
        });
        return await this.templateRepository.create(template);
    }

    async cloneTemplate(templateId: string, newName?: string): Promise<QueryTemplate> {
        const template = await this.templateRepository.findById(templateId);
        if (!template) {
            throw new Error(`Template with ID ${templateId} not found`);
        }

        let cloned = template.clone();
        if (newName) {
            cloned = cloned.updateMetadata({
                name: newName
            });
        }

        return await this.templateRepository.create(cloned);
    }

    async deleteTemplate(id: string): Promise<boolean> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            return false;
        }

        if (template.isBuiltInTemplate()) {
            throw new Error('Cannot delete built-in templates');
        }

        return await this.templateRepository.delete(id);
    }

    async instantiateTemplate(template: QueryTemplate): Promise<{
        nodes: VisualQueryNode[];
        edges: VisualQueryEdge[];
    }> {
        const validation = template.validateParameters();
        if (!validation.isValid) {
            throw new Error(`Template parameters are invalid: ${validation.errors.join(', ')}`);
        }

        await this.templateRepository.recordUsage(template.getId());
        const instantiated = template.instantiate({});
        return {
            nodes: instantiated.layout.nodes.map(node => {
                // Convert serialized nodes back to VisualQueryNode instances
                return new VisualQueryNode({
                    id: node.id,
                    type: node.type as NodeType,
                    label: node.label,
                    position: node.position,
                    variableName: node.variableName,
                    uri: node.uri,
                    dimensions: node.dimensions
                });
            }),
            edges: instantiated.layout.edges.map(edge => {
                // Convert serialized edges back to VisualQueryEdge instances
                return new VisualQueryEdge({
                    id: edge.id,
                    sourceNodeId: edge.sourceNodeId,
                    targetNodeId: edge.targetNodeId,
                    type: edge.type as EdgeType,
                    label: edge.label,
                    propertyUri: edge.propertyUri
                });
            })
        };
    }

    async exportTemplates(templateIds?: string[]): Promise<string> {
        const templates = await this.templateRepository.exportTemplates(templateIds);
        return JSON.stringify(templates, null, 2);
    }

    async importTemplates(jsonData: string): Promise<QueryTemplate[]> {
        try {
            const templatesData = JSON.parse(jsonData);
            
            if (!Array.isArray(templatesData)) {
                throw new Error('Invalid JSON format: expected array of templates');
            }

            return await this.templateRepository.importTemplates(templatesData);
        } catch (error) {
            throw new Error(`Failed to import templates: ${error.message}`);
        }
    }

    async getUsageStatistics(templateId: string): Promise<{
        usageCount: number;
        lastUsed?: Date;
        averageParametersFilled?: number;
    }> {
        return await this.templateRepository.getUsageStats(templateId);
    }

    async updateTemplateMetadata(
        templateId: string,
        updates: Partial<{
            name: string;
            description: string;
            category: TemplateCategory;
            tags: string[];
            difficulty: TemplateDifficulty;
        }>
    ): Promise<QueryTemplate> {
        const template = await this.templateRepository.findById(templateId);
        if (!template) {
            throw new Error(`Template with ID ${templateId} not found`);
        }

        if (template.isBuiltInTemplate()) {
            throw new Error('Cannot modify built-in templates');
        }

        const updatedTemplate = template.updateMetadata(updates);
        return await this.templateRepository.update(updatedTemplate);
    }

    async validateTemplateParameters(template: QueryTemplate): Promise<{
        isValid: boolean;
        errors: string[];
        missingParameters: string[];
        invalidParameters: string[];
    }> {
        const validation = template.validateParameters();
        const parameters = template.getParameters();
        const parameterValues = template.getParameterValues();

        const missingParameters: string[] = [];
        const invalidParameters: string[] = [];

        parameters.forEach(param => {
            const paramId = param.id || `param_${param.name}`;
            if (param.required && !parameterValues.has(paramId)) {
                missingParameters.push(param.name);
            }

            const value = parameterValues.get(paramId);
            if (value && param.constraints) {
                // Additional validation could be added here
            }
        });

        return {
            isValid: validation.isValid,
            errors: validation.errors,
            missingParameters,
            invalidParameters
        };
    }

    async getTemplatePreview(templateId: string): Promise<{
        sparqlQuery: string;
        nodeCount: number;
        edgeCount: number;
        parameterCount: number;
        complexity: 'simple' | 'moderate' | 'complex';
    }> {
        const template = await this.templateRepository.findById(templateId);
        if (!template) {
            throw new Error(`Template with ID ${templateId} not found`);
        }

        const layout = template.getLayout();
        const parameters = template.getParameters();
        const nodeCount = layout.nodes.length;
        const edgeCount = layout.edges.length;

        // Determine complexity based on various factors
        let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
        const totalElements = nodeCount + edgeCount + parameters.length;

        if (totalElements <= 5) {
            complexity = 'simple';
        } else if (totalElements <= 10) {
            complexity = 'moderate';
        } else {
            complexity = 'complex';
        }

        // Generate example SPARQL if pattern is available
        let sparqlQuery = template.getMetadata().sparqlPattern || '';
        
        // Replace parameter placeholders with example values
        parameters.forEach(param => {
            const paramId = param.id || `param_${param.name}`;
            const placeholder = `{${paramId.toUpperCase()}}`;
            const exampleValue = param.defaultValue || `{${param.name}}`;
            sparqlQuery = sparqlQuery.replace(new RegExp(placeholder, 'g'), exampleValue);
        });

        return {
            sparqlQuery,
            nodeCount,
            edgeCount,
            parameterCount: parameters.length,
            complexity
        };
    }

    async refreshTemplateCache(): Promise<void> {
        await this.templateRepository.refresh();
    }
}