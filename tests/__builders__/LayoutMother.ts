import { ClassLayout, LayoutBlockConfig } from '../../src/domain/entities/ClassLayout';
import { LayoutBlock, BlockType } from '../../src/domain/entities/LayoutBlock';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { ClassName } from '../../src/domain/value-objects/ClassName';
import { Result } from '../../src/domain/core/Result';

/**
 * Mother Object pattern for creating test ClassLayout instances
 * Follows Test Data Builder pattern for flexible test setup
 */
export class LayoutMother {
    private id: string = 'test-layout-id';
    private targetClass: string = 'TestClass';
    private blocks: LayoutBlockConfig[] = [];
    private isEnabled: boolean = true;
    private priority: number = 0;

    static create(): LayoutMother {
        return new LayoutMother();
    }

    static simple(): ClassLayout {
        return LayoutMother.create()
            .withId('simple-layout')
            .withTargetClass('SimpleClass')
            .withPropertiesBlock()
            .build();
    }

    static complex(): ClassLayout {
        return LayoutMother.create()
            .withId('complex-layout')
            .withTargetClass('ComplexClass')
            .withPropertiesBlock()
            .withBacklinksBlock()
            .withChildrenEffortsBlock()
            .withCustomBlock()
            .withPriority(10)
            .build();
    }

    static empty(): ClassLayout {
        return LayoutMother.create()
            .withId('empty-layout')
            .withTargetClass('EmptyClass')
            .build();
    }

    static disabled(): ClassLayout {
        return LayoutMother.create()
            .withId('disabled-layout')
            .withTargetClass('DisabledClass')
            .disabled()
            .build();
    }

    static withCollapsibleBlocks(): ClassLayout {
        return LayoutMother.create()
            .withId('collapsible-layout')
            .withTargetClass('CollapsibleClass')
            .withCollapsibleBlock('collapsible-1', 'properties', 'Collapsible Properties')
            .withCollapsibleBlock('collapsible-2', 'backlinks', 'Collapsible Backlinks', true)
            .build();
    }

    // Builder methods
    withId(id: string): this {
        this.id = id;
        return this;
    }

    withTargetClass(targetClass: string): this {
        this.targetClass = targetClass;
        return this;
    }

    withPriority(priority: number): this {
        this.priority = priority;
        return this;
    }

    enabled(): this {
        this.isEnabled = true;
        return this;
    }

    disabled(): this {
        this.isEnabled = false;
        return this;
    }

    withBlock(block: LayoutBlockConfig): this {
        this.blocks.push(block);
        return this;
    }

    withPropertiesBlock(id: string = 'properties-block', title: string = 'Properties'): this {
        return this.withBlock({
            id,
            type: 'properties',
            title,
            order: this.blocks.length,
            config: { type: 'properties' },
            isVisible: true
        });
    }

    withBacklinksBlock(id: string = 'backlinks-block', title: string = 'Backlinks'): this {
        return this.withBlock({
            id,
            type: 'backlinks',
            title,
            order: this.blocks.length,
            config: { type: 'backlinks' },
            isVisible: true
        });
    }

    withChildrenEffortsBlock(id: string = 'children-efforts-block', title: string = 'Children Efforts'): this {
        return this.withBlock({
            id,
            type: 'children-efforts',
            title,
            order: this.blocks.length,
            config: { type: 'children-efforts' },
            isVisible: true
        });
    }

    withQueryBlock(id: string = 'query-block', title: string = 'Query Results', query: string = 'SELECT * WHERE { ?s ?p ?o }'): this {
        return this.withBlock({
            id,
            type: 'query',
            title,
            order: this.blocks.length,
            config: { type: 'query', query },
            isVisible: true
        });
    }

    withCustomBlock(id: string = 'custom-block', title: string = 'Custom Block'): this {
        return this.withBlock({
            id,
            type: 'custom',
            title,
            order: this.blocks.length,
            config: { type: 'custom', templatePath: 'templates/custom.md' },
            isVisible: true
        });
    }

    withButtonsBlock(id: string = 'buttons-block', title: string = 'Actions'): this {
        return this.withBlock({
            id,
            type: 'buttons',
            title,
            order: this.blocks.length,
            config: { 
                type: 'buttons',
                buttons: [
                    { id: 'btn-1', label: 'Action 1', commandType: 'test-command' }
                ]
            },
            isVisible: true
        });
    }

    withHiddenBlock(id: string = 'hidden-block', type: BlockType = 'properties'): this {
        return this.withBlock({
            id,
            type,
            title: 'Hidden Block',
            order: this.blocks.length,
            config: { type },
            isVisible: false
        });
    }

    withCollapsibleBlock(id: string, type: BlockType, title: string, isCollapsed: boolean = false): this {
        return this.withBlock({
            id,
            type,
            title,
            order: this.blocks.length,
            config: { type },
            isVisible: true,
            isCollapsible: true,
            isCollapsed
        });
    }

    build(): ClassLayout {
        const assetIdResult = AssetId.create(this.id);
        const classNameResult = ClassName.create(this.targetClass);

        if (assetIdResult.isFailure) {
            throw new Error(`Invalid asset ID: ${assetIdResult.error}`);
        }

        if (classNameResult.isFailure) {
            throw new Error(`Invalid class name: ${classNameResult.error}`);
        }

        const layoutResult = ClassLayout.create({
            id: assetIdResult.getValue(),
            targetClass: classNameResult.getValue(),
            blocks: this.blocks,
            isEnabled: this.isEnabled,
            priority: this.priority
        });

        if (layoutResult.isFailure) {
            throw new Error(`Failed to create layout: ${layoutResult.error}`);
        }

        return layoutResult.getValue();
    }
}

/**
 * Mother Object for creating test RenderContext instances
 */
export class RenderContextMother {
    private containerId: string = 'test-container';
    private assetPath: string = '/test/path.md';
    private metadata: Record<string, any> = {};
    private frontmatter: Record<string, any> = {};

    static create(): RenderContextMother {
        return new RenderContextMother();
    }

    static simple(): any {
        return RenderContextMother.create().build();
    }

    static withFrontmatter(frontmatter: Record<string, any>): any {
        return RenderContextMother.create()
            .withFrontmatter(frontmatter)
            .build();
    }

    static forAsset(assetPath: string): any {
        return RenderContextMother.create()
            .withAssetPath(assetPath)
            .build();
    }

    withContainerId(containerId: string): this {
        this.containerId = containerId;
        return this;
    }

    withAssetPath(assetPath: string): this {
        this.assetPath = assetPath;
        return this;
    }

    withMetadata(metadata: Record<string, any>): this {
        this.metadata = metadata;
        return this;
    }

    withFrontmatter(frontmatter: Record<string, any>): this {
        this.frontmatter = frontmatter;
        return this;
    }

    build() {
        return {
            containerId: this.containerId,
            assetPath: this.assetPath,
            metadata: { ...this.metadata, frontmatter: this.frontmatter },
            frontmatter: this.frontmatter
        };
    }
}