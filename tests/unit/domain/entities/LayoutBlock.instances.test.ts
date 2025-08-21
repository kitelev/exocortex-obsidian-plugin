import { LayoutBlock, InstancesBlockConfig } from '../../../../src/domain/entities/LayoutBlock';

describe('LayoutBlock - Instances Block', () => {
    describe('create with instances block type', () => {
        it('should create a valid instances block', () => {
            const config: InstancesBlockConfig = {
                type: 'instances',
                targetProperty: 'exo__Instance_class',
                displayAs: 'table',
                showInstanceInfo: true,
                maxResults: 100
            };

            const result = LayoutBlock.create({
                id: 'instances-block-001',
                type: 'instances',
                title: 'Instances',
                order: 1,
                config: config,
                isVisible: true,
                isCollapsible: true
            });

            expect(result.isSuccess).toBe(true);
            
            const block = result.getValue();
            expect(block).toBeDefined();
            expect(block?.type).toBe('instances');
            expect(block?.config.type).toBe('instances');
            
            const instancesConfig = block?.config as InstancesBlockConfig;
            expect(instancesConfig.targetProperty).toBe('exo__Instance_class');
            expect(instancesConfig.displayAs).toBe('table');
            expect(instancesConfig.showInstanceInfo).toBe(true);
            expect(instancesConfig.maxResults).toBe(100);
        });

        it('should create instances block with minimal config', () => {
            const config: InstancesBlockConfig = {
                type: 'instances'
            };

            const result = LayoutBlock.create({
                id: 'instances-block-002',
                type: 'instances',
                title: 'Simple Instances',
                order: 2,
                config: config,
                isVisible: true
            });

            expect(result.isSuccess).toBe(true);
            
            const block = result.getValue();
            const instancesConfig = block?.config as InstancesBlockConfig;
            expect(instancesConfig.targetProperty).toBeUndefined();
            expect(instancesConfig.displayAs).toBeUndefined();
            expect(instancesConfig.showInstanceInfo).toBeUndefined();
        });

        it('should create instances block with all optional properties', () => {
            const config: InstancesBlockConfig = {
                type: 'instances',
                targetProperty: 'custom__Instance_class',
                filterByClass: 'CustomClass',
                groupByClass: true,
                maxResults: 50,
                displayAs: 'cards',
                showInstanceInfo: false
            };

            const result = LayoutBlock.create({
                id: 'instances-block-003',
                type: 'instances',
                title: 'Custom Instances',
                order: 3,
                config: config,
                isVisible: true,
                isCollapsible: false
            });

            expect(result.isSuccess).toBe(true);
            
            const block = result.getValue();
            const instancesConfig = block?.config as InstancesBlockConfig;
            expect(instancesConfig.targetProperty).toBe('custom__Instance_class');
            expect(instancesConfig.filterByClass).toBe('CustomClass');
            expect(instancesConfig.groupByClass).toBe(true);
            expect(instancesConfig.maxResults).toBe(50);
            expect(instancesConfig.displayAs).toBe('cards');
            expect(instancesConfig.showInstanceInfo).toBe(false);
        });

        it('should fail with mismatched type and config', () => {
            const config: InstancesBlockConfig = {
                type: 'instances'
            };

            const result = LayoutBlock.create({
                id: 'instances-block-004',
                type: 'query', // Wrong type!
                title: 'Mismatched Block',
                order: 4,
                config: config,
                isVisible: true
            });

            expect(result.isSuccess).toBe(false);
            expect(result.getError()).toContain('Invalid configuration for block type');
        });

        it('should update instances block config', () => {
            const initialConfig: InstancesBlockConfig = {
                type: 'instances',
                displayAs: 'list'
            };

            const blockResult = LayoutBlock.create({
                id: 'instances-block-005',
                type: 'instances',
                title: 'Updateable Instances',
                order: 5,
                config: initialConfig,
                isVisible: true
            });

            expect(blockResult.isSuccess).toBe(true);
            
            const block = blockResult.getValue()!;
            
            const newConfig: InstancesBlockConfig = {
                type: 'instances',
                displayAs: 'table',
                showInstanceInfo: true,
                maxResults: 25
            };

            const updateResult = block.updateConfig(newConfig);
            expect(updateResult.isSuccess).toBe(true);
            
            const updatedConfig = block.config as InstancesBlockConfig;
            expect(updatedConfig.displayAs).toBe('table');
            expect(updatedConfig.showInstanceInfo).toBe(true);
            expect(updatedConfig.maxResults).toBe(25);
        });

        it('should validate display format options', () => {
            const validFormats: Array<'list' | 'table' | 'cards'> = ['list', 'table', 'cards'];

            validFormats.forEach(format => {
                const config: InstancesBlockConfig = {
                    type: 'instances',
                    displayAs: format
                };

                const result = LayoutBlock.create({
                    id: `instances-block-${format}`,
                    type: 'instances',
                    title: `${format} Instances`,
                    order: 1,
                    config: config,
                    isVisible: true
                });

                expect(result.isSuccess).toBe(true);
            });
        });

        it('should handle block visibility and collapsibility', () => {
            const config: InstancesBlockConfig = {
                type: 'instances',
                displayAs: 'table'
            };

            const result = LayoutBlock.create({
                id: 'instances-block-visibility',
                type: 'instances',
                title: 'Collapsible Instances',
                order: 1,
                config: config,
                isVisible: false,
                isCollapsible: true,
                isCollapsed: true
            });

            expect(result.isSuccess).toBe(true);
            
            const block = result.getValue()!;
            expect(block.isVisible).toBe(false);
            expect(block.isCollapsible).toBe(true);
            expect(block.isCollapsed).toBe(true);

            // Test toggle methods
            block.show();
            expect(block.isVisible).toBe(true);

            block.expand();
            expect(block.isCollapsed).toBe(false);

            block.collapse();
            expect(block.isCollapsed).toBe(true);
        });
    });
});