import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Page } from '@playwright/test';
import { ExocortexPlugin } from '../../main';
import { ClassTreeModal } from '../../src/presentation/modals/ClassTreeModal';

let page: Page;
let plugin: ExocortexPlugin;
let modal: ClassTreeModal;
let assetModal: any;

Before(async function() {
    // Setup test environment
    // This would typically involve setting up a test Obsidian vault
    this.testVault = await createTestVault();
    this.plugin = await loadPlugin(this.testVault);
});

After(async function() {
    // Cleanup
    await this.testVault.cleanup();
});

// Background steps
Given('I have Obsidian with Exocortex plugin installed', async function() {
    expect(this.plugin).toBeDefined();
    expect(this.plugin.manifest.id).toBe('exocortex-obsidian-plugin');
});

Given('I have ontologies with class hierarchies in my vault', async function() {
    // Verify ontologies exist
    const ontologies = await this.plugin.findAllOntologies();
    expect(ontologies.length).toBeGreaterThan(0);
});

Given('the vault contains the following classes:', async function(dataTable) {
    const classes = dataTable.hashes();
    for (const classData of classes) {
        await createTestClass(
            this.testVault,
            classData['Class Name'],
            classData['Parent Class'],
            classData['Ontology']
        );
    }
});

// Scenario: Open class tree selector modal
Given('I am in the asset creation modal', async function() {
    // Open the asset creation modal
    assetModal = await this.plugin.openAssetCreationModal();
    expect(assetModal).toBeDefined();
    expect(assetModal.modalEl.querySelector('.modal-title').textContent).toBe('Create ExoAsset');
});

When('I click on the class selection button', async function() {
    const button = assetModal.modalEl.querySelector('.class-selector-button');
    expect(button).toBeDefined();
    await button.click();
});

Then('the class tree selector modal should open', async function() {
    modal = document.querySelector('.class-tree-modal');
    expect(modal).toBeDefined();
    expect(modal.style.display).not.toBe('none');
});

Then('I should see the class hierarchy displayed as a tree', async function() {
    const treeContainer = modal.querySelector('.class-tree-container');
    expect(treeContainer).toBeDefined();
    
    const treeNodes = treeContainer.querySelectorAll('.class-tree-node');
    expect(treeNodes.length).toBeGreaterThan(0);
});

Then('the currently selected class should be highlighted', async function() {
    const selectedNode = modal.querySelector('.class-tree-node.is-selected');
    expect(selectedNode).toBeDefined();
});

// Scenario: Expand and collapse tree nodes
Given('the class tree selector modal is open', async function() {
    if (!modal) {
        await this.plugin.openAssetCreationModal();
        const button = document.querySelector('.class-selector-button');
        await button.click();
        modal = document.querySelector('.class-tree-modal');
    }
    expect(modal).toBeDefined();
});

Given('I see {string} with a collapse/expand icon', async function(className: string) {
    const node = findNodeByClassName(modal, className);
    expect(node).toBeDefined();
    
    const expandIcon = node.querySelector('.class-tree-expand-icon');
    expect(expandIcon).toBeDefined();
});

When('I click on the expand icon for {string}', async function(className: string) {
    const node = findNodeByClassName(modal, className);
    const expandIcon = node.querySelector('.class-tree-expand-icon');
    await expandIcon.click();
});

Then('I should see its child classes {string} and {string}', async function(child1: string, child2: string) {
    const child1Node = findNodeByClassName(modal, child1);
    const child2Node = findNodeByClassName(modal, child2);
    
    expect(child1Node).toBeDefined();
    expect(child2Node).toBeDefined();
    expect(child1Node.style.display).not.toBe('none');
    expect(child2Node.style.display).not.toBe('none');
});

When('I click on the collapse icon for {string}', async function(className: string) {
    const node = findNodeByClassName(modal, className);
    const collapseIcon = node.querySelector('.class-tree-expand-icon');
    await collapseIcon.click();
});

Then('its child classes should be hidden', async function() {
    const children = modal.querySelectorAll('.class-tree-children:last-child .class-tree-node');
    children.forEach(child => {
        expect(child.parentElement.style.display).toBe('none');
    });
});

// Scenario: Search for classes
When('I type {string} in the search field', async function(searchTerm: string) {
    const searchInput = modal.querySelector('input[type="text"]');
    expect(searchInput).toBeDefined();
    
    await searchInput.focus();
    await searchInput.type(searchTerm);
});

Then('I should see only classes matching {string}', async function(searchTerm: string) {
    const visibleNodes = modal.querySelectorAll('.class-tree-node:not([style*="display: none"])');
    
    if (searchTerm === '(No classes found)') {
        expect(visibleNodes.length).toBe(0);
        const emptyMessage = modal.querySelector('.class-tree-empty');
        expect(emptyMessage).toBeDefined();
    } else {
        visibleNodes.forEach(node => {
            const className = node.querySelector('.class-tree-name').textContent;
            expect(className.toLowerCase()).toContain(searchTerm.toLowerCase());
        });
    }
});

Then('matching text should be highlighted', async function() {
    const highlights = modal.querySelectorAll('mark');
    expect(highlights.length).toBeGreaterThan(0);
});

Then('the tree should auto-expand to show matches', async function() {
    const expandedNodes = modal.querySelectorAll('.class-tree-node.is-expanded');
    expect(expandedNodes.length).toBeGreaterThan(0);
});

// Scenario: Select a class
Given('no class is currently selected', async function() {
    const selectedNode = modal.querySelector('.class-tree-node.is-selected');
    if (selectedNode) {
        selectedNode.classList.remove('is-selected');
    }
});

When('I click on {string} in the tree', async function(className: string) {
    const node = findNodeByClassName(modal, className);
    expect(node).toBeDefined();
    
    const nodeContent = node.querySelector('.class-tree-node-content');
    await nodeContent.click();
});

Then('the modal should close', async function() {
    const modalElement = document.querySelector('.class-tree-modal');
    expect(modalElement).toBeNull();
});

Then('{string} should be shown in the class selection button', async function(className: string) {
    const button = assetModal.modalEl.querySelector('.class-selector-button');
    const buttonText = button.querySelector('.class-selector-button-text').textContent;
    expect(buttonText).toBe(className);
});

Then('the properties section should update for {string}', async function(className: string) {
    const propertiesContainer = assetModal.modalEl.querySelector('.exocortex-properties-container');
    expect(propertiesContainer).toBeDefined();
    
    // Verify properties are for the selected class
    const properties = await this.plugin.findPropertiesForClass(className);
    const propertyFields = propertiesContainer.querySelectorAll('.setting-item');
    expect(propertyFields.length).toBeGreaterThan(0);
});

// Helper functions
function findNodeByClassName(container: Element, className: string): Element {
    const nodes = container.querySelectorAll('.class-tree-node');
    for (const node of nodes) {
        const nameElement = node.querySelector('.class-tree-name');
        if (nameElement && nameElement.textContent === className) {
            return node;
        }
    }
    return null;
}

async function createTestVault() {
    // Mock implementation - would create actual test vault in real tests
    return {
        cleanup: async () => {}
    };
}

async function loadPlugin(vault: any) {
    // Mock implementation - would load actual plugin in real tests
    return new ExocortexPlugin();
}

async function createTestClass(vault: any, className: string, parentClass: string, ontology: string) {
    // Mock implementation - would create actual test files in real tests
    const content = `---
exo__Instance_class: "[[exo__Class]]"
exo__Asset_label: "${className}"
exo__Class_superClass: ${parentClass !== '-' ? `"[[${parentClass}]]"` : 'null'}
exo__Asset_isDefinedBy: "[[${ontology}]]"
---

# ${className}
`;
    // Would write to vault in real implementation
}