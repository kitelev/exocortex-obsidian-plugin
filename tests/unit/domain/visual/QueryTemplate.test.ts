import { QueryTemplate, TemplateCategory, TemplateMetadata, TemplateLayout, TemplateParameter } from '../../../../src/domain/visual/QueryTemplate';
import { NodeType } from '../../../../src/domain/visual/VisualQueryNode';
import { EdgeType } from '../../../../src/domain/visual/VisualQueryEdge';

describe('QueryTemplate', () => {
    let template: QueryTemplate;
    let mockMetadata: TemplateMetadata;
    let mockLayout: TemplateLayout;
    let mockParameters: TemplateParameter[];

    beforeEach(() => {
        mockMetadata = {
            name: 'Test Template',
            description: 'A test template',
            category: TemplateCategory.EXPLORATION,
            tags: ['test'],
            difficulty: 'beginner',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            version: '1.0.0'
        };

        mockLayout = {
            nodes: [
                {
                    id: 'node1',
                    type: NodeType.ENTITY,
                    label: 'Test Entity',
                    position: { x: 100, y: 100 }
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        };

        mockParameters = [
            {
                id: 'param1',
                name: 'Entity Name',
                description: 'Name of the entity',
                type: 'entity',
                required: true
            }
        ];

        template = new QueryTemplate({
            id: 'test-template',
            metadata: mockMetadata,
            layout: mockLayout,
            parameters: mockParameters
        });
    });

    describe('Constructor', () => {
        it('should create a template with the provided properties', () => {
            expect(template.getId()).toBe('test-template');
            expect(template.getMetadata().name).toBe('Test Template');
            expect(template.getLayout().nodes).toHaveLength(1);
            expect(template.getParameters()).toHaveLength(1);
        });

        it('should freeze the template ID', () => {
            expect(() => {
                (template as any).id = 'changed';
            }).toThrow();
        });
    });

    describe('Metadata Management', () => {
        it('should allow updating metadata for non-built-in templates', () => {
            const updates = {
                name: 'Updated Template',
                description: 'Updated description'
            };

            template.updateMetadata(updates);

            const metadata = template.getMetadata();
            expect(metadata.name).toBe('Updated Template');
            expect(metadata.description).toBe('Updated description');
        });

        it('should prevent updating metadata for built-in templates', () => {
            const builtInTemplate = new QueryTemplate({
                id: 'builtin-test',
                metadata: mockMetadata,
                layout: mockLayout,
                isBuiltIn: true
            });

            expect(() => {
                builtInTemplate.updateMetadata({ name: 'Changed' });
            }).toThrow('Cannot modify built-in templates');
        });
    });

    describe('Parameter Management', () => {
        it('should allow setting parameter values', () => {
            template.setParameterValue('param1', 'test-entity');
            expect(template.getParameterValue('param1')).toBe('test-entity');
        });

        it('should throw error when setting value for non-existent parameter', () => {
            expect(() => {
                template.setParameterValue('nonexistent', 'value');
            }).toThrow('Parameter nonexistent not found');
        });

        it('should validate parameter values', () => {
            const validation = template.validateParameters();
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Parameter Entity Name is required');
        });

        it('should validate parameters as valid when all required parameters are set', () => {
            template.setParameterValue('param1', 'test-entity');
            const validation = template.validateParameters();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });

    describe('Template Instantiation', () => {
        beforeEach(() => {
            template.setParameterValue('param1', 'test-entity');
        });

        it('should instantiate template with valid parameters', () => {
            const { nodes, edges } = template.instantiate();
            expect(nodes).toHaveLength(1);
            expect(edges).toHaveLength(0);
            expect(nodes[0].getLabel()).toBe('test-entity');
        });

        it('should throw error when instantiating with invalid parameters', () => {
            template.clearParameterValues();
            expect(() => {
                template.instantiate();
            }).toThrow('Template validation failed');
        });
    });

    describe('Template Cloning', () => {
        it('should create a copy of the template', () => {
            const cloned = template.clone();
            
            expect(cloned.getId()).not.toBe(template.getId());
            expect(cloned.getMetadata().name).toBe('Test Template (Copy)');
            expect(cloned.isBuiltInTemplate()).toBe(false);
        });

        it('should create a copy with custom ID', () => {
            const cloned = template.clone('custom-id');
            expect(cloned.getId()).toBe('custom-id');
        });
    });

    describe('JSON Serialization', () => {
        it('should serialize template to JSON', () => {
            const json = template.toJSON();
            expect(json).toHaveProperty('id');
            expect(json).toHaveProperty('metadata');
            expect(json).toHaveProperty('layout');
            expect(json).toHaveProperty('parameters');
            expect(json).toHaveProperty('isBuiltIn');
        });
    });

    describe('Static Factory Methods', () => {
        it('should create template from canvas state', () => {
            const mockNodes = new Map();
            const mockEdges = new Map();
            const mockViewport = { x: 0, y: 0, zoom: 1 };

            // Mock node
            const mockNode = {
                getId: () => 'node1',
                getType: () => NodeType.ENTITY,
                getLabel: () => 'Test',
                getPosition: () => ({ x: 100, y: 100 }),
                getVariableName: () => undefined,
                getUri: () => undefined,
                getDimensions: () => ({ width: 150, height: 60 })
            };
            mockNodes.set('node1', mockNode);

            const canvasTemplate = QueryTemplate.fromCanvas(
                mockNodes as any,
                mockEdges as any,
                mockViewport,
                mockMetadata
            );

            expect(canvasTemplate.getMetadata().name).toBe('Test Template');
            expect(canvasTemplate.getLayout().nodes).toHaveLength(1);
        });
    });

    describe('Parameter Constraints', () => {
        it('should validate parameter constraints', () => {
            const constrainedParam: TemplateParameter = {
                id: 'constrained',
                name: 'Constrained Parameter',
                description: 'A parameter with constraints',
                type: 'literal',
                required: true,
                constraints: {
                    minLength: 3,
                    maxLength: 10,
                    pattern: '^[a-z]+$'
                }
            };

            template.addParameter(constrainedParam);

            // Test valid value
            template.setParameterValue('constrained', 'valid');
            expect(template.validateParameters().isValid).toBe(false); // Still need param1

            // Test invalid values
            expect(() => {
                template.setParameterValue('constrained', 'INVALID'); // Uppercase
            }).toThrow('Invalid value for parameter Constrained Parameter');

            expect(() => {
                template.setParameterValue('constrained', 'ab'); // Too short
            }).toThrow('Invalid value for parameter Constrained Parameter');

            expect(() => {
                template.setParameterValue('constrained', 'toolongvalue'); // Too long
            }).toThrow('Invalid value for parameter Constrained Parameter');
        });

        it('should validate allowed values constraint', () => {
            const selectParam: TemplateParameter = {
                id: 'select',
                name: 'Select Parameter',
                description: 'A parameter with allowed values',
                type: 'literal',
                required: true,
                constraints: {
                    allowedValues: ['option1', 'option2', 'option3']
                }
            };

            template.addParameter(selectParam);

            // Valid value
            template.setParameterValue('select', 'option1');
            
            // Invalid value
            expect(() => {
                template.setParameterValue('select', 'invalid');
            }).toThrow('Invalid value for parameter Select Parameter');
        });
    });
});