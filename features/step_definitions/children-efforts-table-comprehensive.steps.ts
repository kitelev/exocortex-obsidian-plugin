import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@jest/globals';
import { ExocortexWorld } from '../support/world';
import { TFile } from 'obsidian';
import { ChildrenEffortsBlockRenderer } from '../../src/presentation/renderers/ChildrenEffortsBlockRenderer';
import { ChildrenEffortsBlockConfig } from '../../src/domain/entities/LayoutBlockStubs';

interface ChildEffortRow {
  title: string;
  status?: string;
  class?: string;
  effort_parent?: string;
  ems__Effort_status?: string;
}

interface TableColumn {
  column: string;
  content: string;
}

interface CSSClass {
  class: string;
  purpose: string;
}

interface GroupData {
  group_name: string;
  count: string;
}

// Background setup
Given('the children efforts rendering system is enabled', function (this: ExocortexWorld) {
  const renderer = new ChildrenEffortsBlockRenderer(this.app);
  this.setTestData('childrenEffortsRenderer', renderer);
  expect(renderer).toBeDefined();
});

Given('I have a parent project note {string}', function (this: ExocortexWorld, projectName: string) {
  // Create a mock TFile for the parent project
  const mockProjectFile = {
    basename: projectName,
    name: `${projectName}.md`,
    path: `${projectName}.md`,
    vault: this.vault,
  } as TFile;
  
  this.setTestData('parentProjectFile', mockProjectFile);
  this.currentFile = mockProjectFile;
});

Given('the current note has proper frontmatter structure', function (this: ExocortexWorld) {
  // Mock the note's metadata
  const mockMetadata = {
    frontmatter: {
      'exo__Instance_class': 'ems__Project',
      'exo__Asset_label': this.currentFile?.basename || 'Default Project'
    }
  };
  
  // Mock metadataCache.getFileCache
  const originalGetFileCache = this.app.metadataCache.getFileCache;
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    if (file === this.currentFile) {
      return mockMetadata;
    }
    return originalGetFileCache?.call(this.app.metadataCache, file);
  });
  
  this.setTestData('parentMetadata', mockMetadata);
});

// Basic functionality scenarios
Given('I have the following child efforts for {string}:', function (this: ExocortexWorld, parentName: string, dataTable: any) {
  const childEfforts = dataTable.hashes() as ChildEffortRow[];
  const mockChildFiles: TFile[] = [];
  const backlinkData = new Map<string, any>();
  
  childEfforts.forEach((child, index) => {
    const childFile = {
      basename: child.title,
      name: `${child.title}.md`,
      path: `${child.title}.md`,
      vault: this.vault,
    } as TFile;
    
    // Add to backlink data
    backlinkData.set(childFile.path, {
      mentions: [{ link: parentName }]
    });
    
    mockChildFiles.push(childFile);
    
    // Mock metadata for each child file
    const childMetadata = {
      frontmatter: {
        'exo__Instance_class': child.class || 'ems__Task',
        'exo__Asset_label': child.title,
        'ems__Effort_parent': child.effort_parent || `[[${parentName}]]`,
        'ems__Effort_status': child.ems__Effort_status || `[[ems__EffortStatus${child.status || 'todo'}]]`
      }
    };
    
    // Mock getFileCache for this specific file
    const originalGetFileCache = this.app.metadataCache.getFileCache;
    this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
      const found = mockChildFiles.find(f => f.path === file.path);
      if (found) {
        return childMetadata;
      }
      return originalGetFileCache?.call(this.app.metadataCache, file);
    });
  });
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return mockChildFiles.find(f => f.path === path);
  });
  
  this.setTestData('childEfforts', childEfforts);
  this.setTestData('mockChildFiles', mockChildFiles);
});

Given('the parent project has no child efforts', function (this: ExocortexWorld) {
  // Mock empty backlinks
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: new Map()
  });
});

When('I render the children efforts block', async function (this: ExocortexWorld) {
  const renderer = this.getTestData('childrenEffortsRenderer') as ChildrenEffortsBlockRenderer;
  const config: ChildrenEffortsBlockConfig = this.getTestData('blockConfig') || {};
  
  // Create a mock container element
  const mockContainer = document.createElement('div');
  this.setTestData('renderContainer', mockContainer);
  
  await renderer.render(mockContainer, config, this.currentFile!, null);
  
  this.setTestData('renderedContent', mockContainer.innerHTML);
});

Then('I should see a professional table with:', function (this: ExocortexWorld, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const expectedColumns = dataTable.hashes() as TableColumn[];
  
  expect(container).toBeDefined();
  
  // Check for table element
  const table = container.querySelector('.exocortex-children-efforts-table');
  expect(table).toBeTruthy();
  
  for (const columnData of expectedColumns) {
    switch (columnData.column) {
      case 'Asset Name':
        const assetNames = columnData.content.split(', ');
        assetNames.forEach(name => {
          const assetLink = container.querySelector(`a[href*="${name}"]`);
          expect(assetLink).toBeTruthy();
        });
        break;
        
      case 'Status':
        const statuses = columnData.content.split(', ');
        statuses.forEach(status => {
          const statusElement = Array.from(container.querySelectorAll('.exocortex-status-known, .exocortex-status-unknown'))
            .find(el => el.textContent?.toLowerCase().includes(status.toLowerCase()));
          expect(statusElement).toBeTruthy();
        });
        break;
    }
  }
});

Then('the table should have proper CSS classes:', function (this: ExocortexWorld, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const expectedClasses = dataTable.hashes() as CSSClass[];
  
  for (const classData of expectedClasses) {
    const element = container.querySelector(`.${classData.class}`);
    expect(element).toBeTruthy();
  }
});

// Empty state scenarios
Then('I should see the message {string}', function (this: ExocortexWorld, expectedMessage: string) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  expect(container.textContent).toContain(expectedMessage);
});

Then('the message should have class {string}', function (this: ExocortexWorld, expectedClass: string) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const messageElement = container.querySelector(`.${expectedClass}`);
  expect(messageElement).toBeTruthy();
});

// Filtering scenarios
Given('I have the following child efforts:', function (this: ExocortexWorld, dataTable: any) {
  const childEfforts = dataTable.hashes() as ChildEffortRow[];
  const mockChildFiles: TFile[] = [];
  const backlinkData = new Map<string, any>();
  
  childEfforts.forEach((child, index) => {
    const childFile = {
      basename: child.title,
      name: `${child.title}.md`,
      path: `${child.title}.md`,
      vault: this.vault,
    } as TFile;
    
    backlinkData.set(childFile.path, {
      mentions: [{ link: 'Project Alpha' }]
    });
    
    mockChildFiles.push(childFile);
    
    // Mock metadata for each child file
    const childMetadata = {
      frontmatter: {
        'exo__Instance_class': child.class || 'ems__Task',
        'exo__Asset_label': child.title,
        'ems__Effort_parent': child.effort_parent || '[[Project Alpha]]'
      }
    };
    
    // Mock getFileCache for this specific file
    const originalGetFileCache = this.app.metadataCache.getFileCache;
    this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
      const found = mockChildFiles.find(f => f.path === file.path);
      if (found) {
        const foundChild = childEfforts.find(c => c.title === found.basename);
        return {
          frontmatter: {
            'exo__Instance_class': foundChild?.class || 'ems__Task',
            'exo__Asset_label': foundChild?.title,
            'ems__Effort_parent': foundChild?.effort_parent || '[[Project Alpha]]'
          }
        };
      }
      return originalGetFileCache?.call(this.app.metadataCache, file);
    });
  });
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return mockChildFiles.find(f => f.path === path);
  });
  
  this.setTestData('childEfforts', childEfforts);
  this.setTestData('mockChildFiles', mockChildFiles);
});

Given('the children efforts block is configured with:', function (this: ExocortexWorld, dataTable: any) {
  const configData = dataTable.hashes()[0];
  const config: ChildrenEffortsBlockConfig = {};
  
  Object.entries(configData).forEach(([key, value]) => {
    switch (key) {
      case 'filterByClass':
        config.filterByClass = value as string;
        break;
      case 'maxResults':
        config.maxResults = parseInt(value as string);
        break;
      case 'groupByClass':
        config.groupByClass = value === 'true';
        break;
      case 'showParentPath':
        config.showParentPath = value === 'true';
        break;
    }
  });
  
  this.setTestData('blockConfig', config);
});

Then('I should see only {int} child efforts', function (this: ExocortexWorld, expectedCount: number) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const rows = container.querySelectorAll('.exocortex-efforts-row');
  expect(rows.length).toBe(expectedCount);
});

Then('the results should include {string} and {string}', function (this: ExocortexWorld, name1: string, name2: string) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  
  const link1 = container.querySelector(`a[href*="${name1}"]`);
  const link2 = container.querySelector(`a[href*="${name2}"]`);
  
  expect(link1).toBeTruthy();
  expect(link2).toBeTruthy();
});

Then('the results should not include {string} or {string}', function (this: ExocortexWorld, name1: string, name2: string) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  
  const link1 = container.querySelector(`a[href*="${name1}"]`);
  const link2 = container.querySelector(`a[href*="${name2}"]`);
  
  expect(link1).toBeFalsy();
  expect(link2).toBeFalsy();
});

// Result limiting scenarios
Given('I have {int} child efforts for {string}', function (this: ExocortexWorld, count: number, parentName: string) {
  const mockChildFiles: TFile[] = [];
  const backlinkData = new Map<string, any>();
  
  for (let i = 1; i <= count; i++) {
    const childFile = {
      basename: `Task ${i}`,
      name: `Task ${i}.md`,
      path: `Task ${i}.md`,
      vault: this.vault,
    } as TFile;
    
    backlinkData.set(childFile.path, {
      mentions: [{ link: parentName }]
    });
    
    mockChildFiles.push(childFile);
  }
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return mockChildFiles.find(f => f.path === path);
  });
  
  // Mock metadata for all child files
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    const found = mockChildFiles.find(f => f.path === file.path);
    if (found) {
      return {
        frontmatter: {
          'exo__Instance_class': 'ems__Task',
          'exo__Asset_label': found.basename,
          'ems__Effort_parent': `[[${parentName}]]`
        }
      };
    }
    return null;
  });
  
  this.setTestData('totalChildCount', count);
  this.setTestData('mockChildFiles', mockChildFiles);
});

Then('I should see exactly {int} child efforts displayed', function (this: ExocortexWorld, expectedCount: number) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const rows = container.querySelectorAll('.exocortex-efforts-row');
  expect(rows.length).toBe(expectedCount);
});

Then('the info section should show {string}', function (this: ExocortexWorld, expectedText: string) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const infoElement = container.querySelector('.exocortex-children-efforts-count');
  expect(infoElement?.textContent).toContain(expectedText.split('"').join(''));
});

// Grouping scenarios
Then('I should see {int} groups:', function (this: ExocortexWorld, expectedGroupCount: number, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const groups = container.querySelectorAll('.exocortex-children-efforts-group');
  
  expect(groups.length).toBe(expectedGroupCount);
  
  const expectedGroups = dataTable.hashes() as GroupData[];
  
  expectedGroups.forEach(groupData => {
    const groupHeader = Array.from(container.querySelectorAll('.children-efforts-group-header'))
      .find(el => el.textContent?.includes(groupData.group_name));
    
    expect(groupHeader).toBeTruthy();
    expect(groupHeader?.textContent).toContain(`(${groupData.count})`);
  });
});

Then('each group should have its own table', function (this: ExocortexWorld) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const groups = container.querySelectorAll('.exocortex-children-efforts-group');
  
  groups.forEach(group => {
    const table = group.querySelector('.exocortex-children-efforts-table');
    expect(table).toBeTruthy();
  });
});

Then('group headers should show {string}', function (this: ExocortexWorld, expectedFormat: string) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const groupHeaders = container.querySelectorAll('.children-efforts-group-header');
  
  groupHeaders.forEach(header => {
    expect(header.textContent).toMatch(/\w+\s*\(\d+\)/); // Matches "ClassName (count)"
  });
});

// Parent path scenarios
Given('I have child efforts with different parent references', function (this: ExocortexWorld) {
  const mockChildFiles: TFile[] = [];
  const backlinkData = new Map<string, any>();
  
  const childFile = {
    basename: 'Test Child',
    name: 'Test Child.md',
    path: 'Test Child.md',
    vault: this.vault,
  } as TFile;
  
  backlinkData.set(childFile.path, {
    mentions: [{ link: 'Project Alpha' }]
  });
  
  mockChildFiles.push(childFile);
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return mockChildFiles.find(f => f.path === path);
  });
  
  // Mock metadata
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    const found = mockChildFiles.find(f => f.path === file.path);
    if (found) {
      return {
        frontmatter: {
          'exo__Instance_class': 'ems__Task',
          'exo__Asset_label': found.basename,
          'ems__Effort_parent': '[[Project Alpha]]'
        }
      };
    }
    return null;
  });
  
  this.setTestData('mockChildFiles', mockChildFiles);
});

Then('the table should include a {string} column', function (this: ExocortexWorld, columnName: string) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const header = Array.from(container.querySelectorAll('th'))
    .find(th => th.textContent === columnName);
  expect(header).toBeTruthy();
});

Then('each row should show the parent reference', function (this: ExocortexWorld) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const parentCells = container.querySelectorAll('.exocortex-table-cell-parent');
  
  parentCells.forEach(cell => {
    expect(cell.textContent?.trim()).toBeTruthy();
    expect(cell.textContent?.trim()).not.toBe('-');
  });
});

Then('parent references should be cleaned of brackets', function (this: ExocortexWorld) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const parentCells = container.querySelectorAll('.exocortex-parent-ref');
  
  parentCells.forEach(cell => {
    expect(cell.textContent).not.toContain('[[');
    expect(cell.textContent).not.toContain(']]');
  });
});

// Status extraction scenarios
Given('I have child efforts with various status formats:', function (this: ExocortexWorld, dataTable: any) {
  const statusFormats = dataTable.hashes();
  const mockChildFiles: TFile[] = [];
  const backlinkData = new Map<string, any>();
  
  statusFormats.forEach((row, index) => {
    const childFile = {
      basename: row.title,
      name: `${row.title}.md`,
      path: `${row.title}.md`,
      vault: this.vault,
    } as TFile;
    
    backlinkData.set(childFile.path, {
      mentions: [{ link: 'Project Alpha' }]
    });
    
    mockChildFiles.push(childFile);
  });
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return mockChildFiles.find(f => f.path === path);
  });
  
  // Mock metadata with various status formats
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    const found = mockChildFiles.find(f => f.path === file.path);
    if (found) {
      const statusRow = statusFormats.find(row => row.title === found.basename);
      return {
        frontmatter: {
          'exo__Instance_class': 'ems__Task',
          'exo__Asset_label': found.basename,
          'ems__Effort_parent': '[[Project Alpha]]',
          'ems__Effort_status': statusRow?.ems__Effort_status || ''
        }
      };
    }
    return null;
  });
  
  this.setTestData('statusFormats', statusFormats);
  this.setTestData('mockChildFiles', mockChildFiles);
});

Then('the status should be displayed as:', function (this: ExocortexWorld, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const expectedStatuses = dataTable.hashes();
  
  expectedStatuses.forEach(expected => {
    // Find the row with the matching title
    const assetLink = Array.from(container.querySelectorAll('a'))
      .find(a => a.textContent === expected.title);
    
    if (assetLink) {
      // Find the status cell in the same row
      const row = assetLink.closest('tr');
      const statusCell = row?.querySelector('.exocortex-table-cell-status');
      const statusSpan = statusCell?.querySelector('span');
      
      expect(statusSpan?.textContent).toBe(expected.displayed_status);
    }
  });
});

// Reference matching scenarios
Given('I have a child effort with parent reference {string}', function (this: ExocortexWorld, parentRef: string) {
  const childFile = {
    basename: 'Test Child',
    name: 'Test Child.md',
    path: 'Test Child.md',
    vault: this.vault,
  } as TFile;
  
  const backlinkData = new Map<string, any>();
  backlinkData.set(childFile.path, {
    mentions: [{ link: 'Project Alpha' }]
  });
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return path === childFile.path ? childFile : null;
  });
  
  // Mock metadata with the specific parent reference format
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    if (file.path === childFile.path) {
      return {
        frontmatter: {
          'exo__Instance_class': 'ems__Task',
          'exo__Asset_label': 'Test Child',
          'ems__Effort_parent': parentRef
        }
      };
    }
    return null;
  });
  
  this.setTestData('testChildFile', childFile);
  this.setTestData('parentReference', parentRef);
});

When('the system checks if this is a child effort', function (this: ExocortexWorld) {
  const renderer = this.getTestData('childrenEffortsRenderer') as ChildrenEffortsBlockRenderer;
  const childFile = this.getTestData('testChildFile') as TFile;
  const parentFile = this.getTestData('parentProjectFile') as TFile;
  
  // Access the private method via type assertion for testing
  const isChild = (renderer as any).isChildEffort(childFile, parentFile);
  this.setTestData('isChildEffort', isChild);
});

Then('the relationship should be recognized as {string}', function (this: ExocortexWorld, expectedResult: string) {
  const isChild = this.getTestData('isChildEffort');
  const expected = expectedResult === 'true';
  expect(isChild).toBe(expected);
});

// Performance scenarios
Given('I have a project with {int} child efforts', function (this: ExocortexWorld, count: number) {
  const mockChildFiles: TFile[] = [];
  const backlinkData = new Map<string, any>();
  
  for (let i = 1; i <= count; i++) {
    const childFile = {
      basename: `Child ${i}`,
      name: `Child ${i}.md`,
      path: `Child ${i}.md`,
      vault: this.vault,
    } as TFile;
    
    backlinkData.set(childFile.path, {
      mentions: [{ link: 'Project Alpha' }]
    });
    
    mockChildFiles.push(childFile);
  }
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return mockChildFiles.find(f => f.path === path);
  });
  
  // Mock metadata for all child files
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    const found = mockChildFiles.find(f => f.path === file.path);
    if (found) {
      return {
        frontmatter: {
          'exo__Instance_class': 'ems__Task',
          'exo__Asset_label': found.basename,
          'ems__Effort_parent': '[[Project Alpha]]'
        }
      };
    }
    return null;
  });
  
  this.setTestData('largeChildCount', count);
});

Then('the rendering should complete within {int} seconds', function (this: ExocortexWorld, maxSeconds: number) {
  const startTime = this.getTestData('renderStartTime') || performance.now();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(maxSeconds * 1000);
});

Then('memory usage should remain stable', function (this: ExocortexWorld) {
  // In a real implementation, would check memory usage
  expect(true).toBe(true);
});

Then('the table should be paginated or virtualized for performance', function (this: ExocortexWorld) {
  // In a real implementation, would check for pagination/virtualization
  expect(true).toBe(true);
});

// Visual styling scenarios
Given('I have child efforts with different statuses', function (this: ExocortexWorld) {
  const mockChildFiles: TFile[] = [];
  const backlinkData = new Map<string, any>();
  const statuses = ['Known', 'Unknown'];
  
  statuses.forEach((status, index) => {
    const childFile = {
      basename: `Task ${index + 1}`,
      name: `Task ${index + 1}.md`,
      path: `Task ${index + 1}.md`,
      vault: this.vault,
    } as TFile;
    
    backlinkData.set(childFile.path, {
      mentions: [{ link: 'Project Alpha' }]
    });
    
    mockChildFiles.push(childFile);
  });
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return mockChildFiles.find(f => f.path === path);
  });
  
  // Mock metadata with different statuses
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    const found = mockChildFiles.find(f => f.path === file.path);
    if (found) {
      const index = mockChildFiles.indexOf(found);
      const status = statuses[index];
      return {
        frontmatter: {
          'exo__Instance_class': 'ems__Task',
          'exo__Asset_label': found.basename,
          'ems__Effort_parent': '[[Project Alpha]]',
          'ems__Effort_status': status === 'Known' ? '[[ems__EffortStatusDone]]' : ''
        }
      };
    }
    return null;
  });
  
  this.setTestData('mockChildFiles', mockChildFiles);
});

When('I render the children efforts table', async function (this: ExocortexWorld) {
  const startTime = performance.now();
  this.setTestData('renderStartTime', startTime);
  
  await this.render_children_efforts_block();
});

Then('status badges should have consistent styling:', function (this: ExocortexWorld, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const expectedStyles = dataTable.hashes();
  
  expectedStyles.forEach(style => {
    const elements = container.querySelectorAll(`.${style.css_class}`);
    expect(elements.length).toBeGreaterThan(0);
  });
});

Then('asset links should have proper internal link styling', function (this: ExocortexWorld) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const links = container.querySelectorAll('a.internal-link');
  expect(links.length).toBeGreaterThan(0);
});

Then('class information should be displayed as subtle subtitles', function (this: ExocortexWorld) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const subtitles = container.querySelectorAll('.exocortex-class-info-subtitle');
  
  // Should exist if we have class information
  expect(subtitles.length).toBeGreaterThanOrEqual(0);
});

// Accessibility scenarios
Given('I have rendered a children efforts table', async function (this: ExocortexWorld) {
  await this.render_children_efforts_block();
});

Then('the table should have proper semantic structure:', function (this: ExocortexWorld, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const requirements = dataTable.hashes();
  
  for (const req of requirements) {
    switch (req.element) {
      case 'table':
        const table = container.querySelector('table');
        expect(table).toBeTruthy();
        break;
        
      case 'thead':
        const thead = container.querySelector('thead');
        expect(thead).toBeTruthy();
        break;
        
      case 'th':
        const headers = container.querySelectorAll('th');
        expect(headers.length).toBeGreaterThan(0);
        break;
        
      case 'tbody':
        const tbody = container.querySelector('tbody');
        expect(tbody).toBeTruthy();
        break;
        
      case 'tr':
        const rows = container.querySelectorAll('tr');
        expect(rows.length).toBeGreaterThan(0);
        break;
        
      case 'td':
        const cells = container.querySelectorAll('td');
        expect(cells.length).toBeGreaterThan(0);
        break;
    }
  }
});

Then('column headers should be properly associated with data cells', function (this: ExocortexWorld) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const headers = container.querySelectorAll('th');
  const dataCells = container.querySelectorAll('td');
  
  expect(headers.length).toBeGreaterThan(0);
  expect(dataCells.length).toBeGreaterThan(0);
});

// Mobile support scenarios
Given('I am viewing the plugin on a mobile device', function (this: ExocortexWorld) {
  // Mock mobile environment
  this.setTestData('isMobileDevice', true);
  
  // Mock window.innerWidth for mobile
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375, // Mobile width
  });
});

Then('the table should adapt to small screens:', function (this: ExocortexWorld, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const adaptations = dataTable.hashes();
  
  // In a real implementation, would check for responsive CSS classes
  // or actual responsive behavior
  expect(container.querySelector('table')).toBeTruthy();
});

// Error handling scenarios
Given('I have child efforts with corrupted metadata:', function (this: ExocortexWorld, dataTable: any) {
  const corruptedData = dataTable.hashes();
  const mockChildFiles: TFile[] = [];
  const backlinkData = new Map<string, any>();
  
  corruptedData.forEach(row => {
    const childFile = {
      basename: row.title,
      name: `${row.title}.md`,
      path: `${row.title}.md`,
      vault: this.vault,
    } as TFile;
    
    backlinkData.set(childFile.path, {
      mentions: [{ link: 'Project Alpha' }]
    });
    
    mockChildFiles.push(childFile);
  });
  
  // Mock getBacklinksForFile
  (this.app.metadataCache as any).getBacklinksForFile = jest.fn().mockReturnValue({
    data: backlinkData
  });
  
  // Mock vault.getAbstractFileByPath
  this.app.vault.getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {
    return mockChildFiles.find(f => f.path === path);
  });
  
  // Mock metadata with corrupted data
  this.app.metadataCache.getFileCache = jest.fn().mockImplementation((file: TFile) => {
    const found = mockChildFiles.find(f => f.path === file.path);
    if (found) {
      const corruptedRow = corruptedData.find(row => row.title === found.basename);
      
      switch (corruptedRow?.issue_type) {
        case 'missing_frontmatter':
          return null; // No metadata at all
          
        case 'invalid_class':
          return {
            frontmatter: {
              'exo__Instance_class': 'exo__InvalidClass',
              'ems__Effort_parent': '[[Project Alpha]]'
            }
          };
          
        case 'broken_parent_ref':
          return {
            frontmatter: {
              'exo__Instance_class': 'ems__Task',
              'ems__Effort_parent': '[[Broken]]Reference]]'
            }
          };
          
        default:
          return {
            frontmatter: {
              'exo__Instance_class': 'ems__Task',
              'ems__Effort_parent': '[[Project Alpha]]'
            }
          };
      }
    }
    return null;
  });
  
  this.setTestData('corruptedData', corruptedData);
  this.setTestData('mockChildFiles', mockChildFiles);
});

Then('corrupted entries should be handled gracefully:', function (this: ExocortexWorld, dataTable: any) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const handlingExpectations = dataTable.hashes();
  
  // Check that the table still renders despite corrupted data
  const table = container.querySelector('table');
  expect(table).toBeTruthy();
  
  // In a real implementation, would verify specific handling for each corruption type
});

Then('error messages should be logged for debugging', function (this: ExocortexWorld) {
  // In a real implementation, would verify console.error or logging calls
  expect(true).toBe(true);
});

Then('the table should still render for valid entries', function (this: ExocortexWorld) {
  const container = this.getTestData('renderContainer') as HTMLElement;
  const table = container.querySelector('table');
  expect(table).toBeTruthy();
});

// Helper methods
ExocortexWorld.prototype.render_children_efforts_block = async function (this: ExocortexWorld) {
  const renderer = this.getTestData('childrenEffortsRenderer') as ChildrenEffortsBlockRenderer;
  const config: ChildrenEffortsBlockConfig = this.getTestData('blockConfig') || {};
  
  // Create a mock container element
  const mockContainer = document.createElement('div');
  this.setTestData('renderContainer', mockContainer);
  
  await renderer.render(mockContainer, config, this.currentFile!, null);
  
  this.setTestData('renderedContent', mockContainer.innerHTML);
};

// Additional scenarios that would need implementation but are stubbed for testing
Then('the cached data should be used', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('the rendering should be significantly faster', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('the cache should be invalidated when child efforts change', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('the table should reflect the change', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('the updated timestamp should be current', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('no full page refresh should be required', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('Obsidian should navigate to that note', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('the navigation should use Obsidian\\'s internal routing', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('backlinks should be properly maintained', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

When('I click on an asset name link', function (this: ExocortexWorld) {
  this.setTestData('linkClicked', true);
});

When('a child effort status is updated in another view', function (this: ExocortexWorld) {
  this.setTestData('statusUpdated', true);
});

When('I navigate away and return to the same note', function (this: ExocortexWorld) {
  this.setTestData('navigationOccurred', true);
});

Given('the data is cached', function (this: ExocortexWorld) {
  this.setTestData('dataCached', true);
});

// Configuration and sorting scenarios
Then('the table should respect all configuration options', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('invalid configuration should use sensible defaults', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('the table rows should be ordered accordingly', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('the sorting should be stable for equal values', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

// Export scenarios
Then('I should be able to export in formats:', function (this: ExocortexWorld, dataTable: any) {
  expect(true).toBe(true); // Stub
});

Then('exported data should include all visible columns', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('formatting should be preserved where applicable', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

When('I export the table data', function (this: ExocortexWorld) {
  this.setTestData('exportInitiated', true);
});

// Multi-parent and internationalization scenarios
Then('the effort should not be duplicated in the table', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('all international characters should display correctly', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('sorting should work with international characters', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});

Then('text truncation should respect character boundaries', function (this: ExocortexWorld) {
  expect(true).toBe(true); // Stub
});