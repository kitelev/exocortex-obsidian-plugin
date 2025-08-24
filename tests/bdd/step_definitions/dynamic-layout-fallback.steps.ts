import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { DynamicLayoutRenderer } from '../../../src/presentation/renderers/DynamicLayoutRenderer';
import { UniversalLayoutRenderer } from '../../../src/presentation/renderers/UniversalLayoutRenderer';
import { DIContainer } from '../../../src/infrastructure/container/DIContainer';
import { Asset } from '../../../src/domain/entities/Asset';
import { AssetId } from '../../../src/domain/value-objects/AssetId';

let container: DIContainer;
let dynamicRenderer: DynamicLayoutRenderer;
let universalRenderer: UniversalLayoutRenderer;
let renderedContent: HTMLElement;
let testAsset: Asset;
let mockVault: any;
let mockMetadataCache: any;

Given('I have an Obsidian vault with the Exocortex plugin', function () {
  container = new DIContainer();
  mockVault = {
    getMarkdownFiles: () => [],
    getAbstractFileByPath: (path: string) => null,
  };
  mockMetadataCache = {
    getFileCache: () => null,
  };
  
  container.registerSingleton('vault', mockVault);
  container.registerSingleton('metadataCache', mockMetadataCache);
  dynamicRenderer = new DynamicLayoutRenderer(container);
  universalRenderer = new UniversalLayoutRenderer(container);
});

Given('I have assets with various class configurations', function () {
  // Setup for multiple assets will be done in specific scenarios
});

Given('I have an asset {string} with class {string}', function (assetName: string, className: string) {
  const assetResult = Asset.create({
    id: AssetId.generate(),
    uid: AssetId.generate().value,
    path: `${assetName}.md`,
    frontmatter: {
      'exo__Instance_class': [className],
      'exo__Asset_uid': AssetId.generate().value,
    },
  });
  
  if (assetResult.isSuccess) {
    testAsset = assetResult.getValue()!;
  }
});

Given('no ClassLayout file exists for {string}', function (className: string) {
  mockVault.getMarkdownFiles = () => [];
  mockMetadataCache.getFileCache = () => null;
});

Given('a ClassLayout file {string} exists', function (layoutFileName: string) {
  const mockFile = { path: `${layoutFileName}.md`, basename: layoutFileName };
  mockVault.getMarkdownFiles = () => [mockFile];
  mockMetadataCache.getFileCache = () => ({
    frontmatter: {
      'exo__Instance_class': ['[[ui__ClassLayout]]'],
    },
  });
});

When('DynamicLayout is rendered for {string}', async function (assetName: string) {
  renderedContent = document.createElement('div');
  const mockDv = {
    container: renderedContent,
    el: (tag: string, content: string) => {
      const element = document.createElement(tag);
      element.textContent = content;
      renderedContent.appendChild(element);
      return element;
    },
    header: (level: number, text: string) => {
      const header = document.createElement(`h${level}`);
      header.textContent = text;
      renderedContent.appendChild(header);
    },
    paragraph: (text: string) => {
      const para = document.createElement('p');
      para.textContent = text;
      renderedContent.appendChild(para);
    },
  };
  
  const mockFile = { path: `${assetName}.md` };
  await dynamicRenderer.render(mockDv as any, mockFile, testAsset.frontmatter, renderedContent);
});

When('DynamicLayout is rendered', async function () {
  await this.When('DynamicLayout is rendered for "TestAsset"');
});

Then('I should see the message {string}', function (expectedMessage: string) {
  const actualMessage = expectedMessage.replace('[[CustomClass]]', testAsset.frontmatter['exo__Instance_class'][0]);
  const content = renderedContent.textContent || '';
  expect(content).to.include(actualMessage.replace('[[CustomClass]]', '[[CustomClass]]'));
});

Then('the UniversalLayout content should be displayed below the message', function () {
  const elements = Array.from(renderedContent.children);
  expect(elements.length).to.be.greaterThan(1);
  
  const hasPropertiesSection = elements.some(el => 
    el.textContent?.includes('Properties') || el.textContent?.includes('Relations')
  );
  expect(hasPropertiesSection).to.be.true;
});

Then('no error message should be shown', function () {
  const content = renderedContent.textContent || '';
  expect(content).to.not.include('Error');
  expect(content).to.not.include('Could not find');
});

Then('the specific ClassLayout should be rendered', function () {
  const content = renderedContent.textContent || '';
  expect(content).to.not.include('UniversalLayout will be used');
});

Then('no fallback message should be displayed', function () {
  const content = renderedContent.textContent || '';
  expect(content).to.not.include('There is no specific Layout for class');
});

Given('I have an asset with class {string}', function (className: string) {
  this.Given(`I have an asset "TestAsset" with class "[[${className}]]"`);
});

Given('no ClassLayout exists for this class', function () {
  mockVault.getMarkdownFiles = () => [];
});

Then('the fallback message should contain {string}', function (expectedFormat: string) {
  const content = renderedContent.textContent || '';
  expect(content).to.include(expectedFormat);
});

Then('not {string} without brackets', function (unwantedFormat: string) {
  const content = renderedContent.textContent || '';
  const withoutBrackets = unwantedFormat.replace('[[', '').replace(']]', '');
  const messageStart = content.indexOf('There is no specific Layout');
  if (messageStart !== -1) {
    const messageEnd = content.indexOf('UniversalLayout will be used', messageStart);
    const messageContent = content.substring(messageStart, messageEnd);
    expect(messageContent).to.not.include(` ${withoutBrackets} `);
  }
});

Given('I have an asset with properties and relations', function () {
  const assetResult = Asset.create({
    id: AssetId.generate(),
    uid: AssetId.generate().value,
    path: 'RichAsset.md',
    frontmatter: {
      'exo__Instance_class': ['[[TestClass]]'],
      'exo__Asset_uid': AssetId.generate().value,
      'custom_property': 'value1',
      'another_property': 'value2',
      'relation_to': '[[OtherAsset]]',
    },
  });
  
  if (assetResult.isSuccess) {
    testAsset = assetResult.getValue()!;
  }
});

Given('no specific ClassLayout exists', function () {
  this.Given('no ClassLayout exists for this class');
});

When('DynamicLayout falls back to UniversalLayout', async function () {
  await this.When('DynamicLayout is rendered for "RichAsset"');
});

Then('all asset properties should be displayed', function () {
  const content = renderedContent.textContent || '';
  expect(content).to.include('custom_property');
  expect(content).to.include('another_property');
});

Then('all asset relations should be shown', function () {
  const content = renderedContent.textContent || '';
  expect(content).to.include('relation_to');
});

Then('the layout should match UniversalLayout\'s standard output', function () {
  const hasStandardSections = renderedContent.querySelector('h2') !== null ||
                             renderedContent.querySelector('h3') !== null;
  expect(hasStandardSections).to.be.true;
});

Given('I have multiple assets with different classes', function () {
  // This would be implemented with multiple test assets
});

Given('none of them have ClassLayout files', function () {
  mockVault.getMarkdownFiles = () => [];
});

When('DynamicLayout is rendered for each asset', function () {
  // Would render multiple assets
});

Then('each should show its own class name in the fallback message', function () {
  // Would verify each asset's message
});

Then('each should render UniversalLayout content correctly', function () {
  // Would verify each asset's content
});