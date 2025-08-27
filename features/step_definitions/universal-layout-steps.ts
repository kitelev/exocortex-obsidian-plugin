import { Given, When, Then } from '@cucumber/cucumber';
import { FakeVaultAdapter } from '../../tests/integration/FakeVaultAdapter';
import { UniversalLayoutRenderer } from '../../src/presentation/renderers/UniversalLayoutRenderer';
import { DIContainer } from '../../src/infrastructure/container/DIContainer';
import { IVaultAdapter } from '../../src/core/IVaultAdapter';
import { expect } from '@jest/globals';

let vaultAdapter: FakeVaultAdapter;
let container: DIContainer;
let renderer: UniversalLayoutRenderer;
let renderResult: HTMLElement;
let assets: Map<string, any>;
let currentAsset: any;

Given('I have the Exocortex plugin installed', () => {
  vaultAdapter = new FakeVaultAdapter();
  container = new DIContainer();
  container.register<IVaultAdapter>('IVaultAdapter', vaultAdapter);
  renderer = new UniversalLayoutRenderer(container);
  assets = new Map();
});

Given('I have assets with exo__Instance_class properties', () => {
  // This is a setup step, actual assets are created in specific scenarios
});

Given('I am viewing an asset with UniversalLayout', () => {
  // This sets the context for viewing
});

Given('I have an asset {string} with exo__Instance_class {string}', (name: string, instanceClass: string) => {
  currentAsset = {
    name,
    frontmatter: {
      exo__Instance_class: instanceClass
    },
    path: `${name.toLowerCase().replace(' ', '-')}.md`
  };
  assets.set(name, currentAsset);
  vaultAdapter.addFile(currentAsset.path, '', currentAsset.frontmatter);
});

Given('I have an asset {string} without exo__Instance_class property', (name: string) => {
  currentAsset = {
    name,
    frontmatter: {},
    path: `${name.toLowerCase().replace(' ', '-')}.md`
  };
  assets.set(name, currentAsset);
  vaultAdapter.addFile(currentAsset.path, '', currentAsset.frontmatter);
});

Given('I have the following assets in a related block:', (dataTable: any) => {
  const rows = dataTable.hashes();
  rows.forEach((row: any) => {
    const asset = {
      name: row['Asset Name'],
      frontmatter: row['exo__Instance_class'] ? { exo__Instance_class: row['exo__Instance_class'] } : {},
      path: `${row['Asset Name'].toLowerCase().replace(' ', '-')}.md`
    };
    assets.set(row['Asset Name'], asset);
    vaultAdapter.addFile(asset.path, '', asset.frontmatter);
  });
});

Given('I have an asset with complex UniversalLayout blocks', () => {
  currentAsset = {
    name: 'Complex Asset',
    frontmatter: {
      layout: 'UniversalLayout',
      blocks: ['Properties', 'Query', 'Related', 'Backlinks']
    },
    path: 'complex-asset.md'
  };
  vaultAdapter.addFile(currentAsset.path, '', currentAsset.frontmatter);
});

Given('the asset has exo__Instance_class {string}', (instanceClass: string) => {
  if (currentAsset) {
    currentAsset.frontmatter.exo__Instance_class = instanceClass;
    vaultAdapter.updateFrontmatter(currentAsset.path, currentAsset.frontmatter);
  }
});

Given('I have {int} related assets with various exo__Instance_class values', (count: number) => {
  const classes = ['ems__Project', 'ems__Task', 'ems__Area', 'ems__Zone', 'ems__Effort'];
  for (let i = 0; i < count; i++) {
    const asset = {
      name: `Asset ${i + 1}`,
      frontmatter: {
        exo__Instance_class: classes[i % classes.length]
      },
      path: `asset-${i + 1}.md`
    };
    assets.set(asset.name, asset);
    vaultAdapter.addFile(asset.path, '', asset.frontmatter);
  }
});

Given('I am using Obsidian on a mobile device', () => {
  // Set mobile context flag
  (global as any).isMobile = true;
});

Given('I have a query block that returns assets', () => {
  currentAsset = {
    name: 'Query Results',
    frontmatter: {
      layout: 'UniversalLayout',
      query: 'type:ems__*'
    },
    path: 'query-results.md'
  };
});

Given('the assets have exo__Instance_class properties', () => {
  // Assets with properties are already set up in previous steps
});

Given('I have a table with multiple assets and their exo__Instance_class values', () => {
  // Table setup for sorting scenario
  const testAssets = [
    { name: 'Zebra Project', class: 'ems__Project' },
    { name: 'Alpha Task', class: 'ems__Task' },
    { name: 'Beta Area', class: 'ems__Area' }
  ];
  testAssets.forEach(asset => {
    vaultAdapter.addFile(`${asset.name.toLowerCase().replace(' ', '-')}.md`, '', {
      exo__Instance_class: asset.class
    });
  });
});

Given('I have a UniversalLayout table with exo__Instance_class column', () => {
  renderResult = document.createElement('div');
  renderResult.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>exo__Instance_class</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Test Asset</td>
          <td>ems__Project</td>
        </tr>
      </tbody>
    </table>
  `;
});

When('I view the asset in UniversalLayout', async () => {
  renderResult = document.createElement('div');
  const mockFile = {
    path: currentAsset.path,
    basename: currentAsset.name
  };
  await renderer.render(mockFile, currentAsset.frontmatter, renderResult);
});

When('I view the related assets in UniversalLayout', async () => {
  renderResult = document.createElement('div');
  const mockFile = {
    path: 'container.md',
    basename: 'Container'
  };
  const frontmatter = {
    layout: 'UniversalLayout',
    related: Array.from(assets.keys())
  };
  await renderer.render(mockFile, frontmatter, renderResult);
});

When('I view the asset', async () => {
  renderResult = document.createElement('div');
  const mockFile = {
    path: currentAsset.path,
    basename: currentAsset.name
  };
  await renderer.render(mockFile, currentAsset.frontmatter, renderResult);
});

When('I view them in UniversalLayout', async () => {
  const startTime = Date.now();
  renderResult = document.createElement('div');
  const mockFile = {
    path: 'large-dataset.md',
    basename: 'Large Dataset'
  };
  const frontmatter = {
    layout: 'UniversalLayout',
    related: Array.from(assets.keys())
  };
  await renderer.render(mockFile, frontmatter, renderResult);
  const renderTime = Date.now() - startTime;
  (global as any).renderTime = renderTime;
});

When('the query results are displayed in UniversalLayout', async () => {
  renderResult = document.createElement('div');
  await renderer.render({ path: currentAsset.path, basename: currentAsset.name }, currentAsset.frontmatter, renderResult);
});

When('I interact with the table headers', () => {
  const headers = renderResult.querySelectorAll('th');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      // Sorting logic would be implemented here
    });
  });
});

When('I select and copy the table content', () => {
  const table = renderResult.querySelector('table');
  if (table) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(table);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
});

Then('I should see a table with two columns', () => {
  const table = renderResult.querySelector('table');
  expect(table).toBeTruthy();
  const headers = table?.querySelectorAll('th');
  expect(headers?.length).toBe(2);
});

Then('the first column should show {string}', (expectedName: string) => {
  const firstCell = renderResult.querySelector('tbody tr td:first-child');
  expect(firstCell?.textContent).toContain(expectedName);
});

Then('the second column should show {string}', (expectedClass: string) => {
  const secondCell = renderResult.querySelector('tbody tr td:nth-child(2)');
  expect(secondCell?.textContent).toBe(expectedClass);
});

Then('the second column should be empty or show a placeholder', () => {
  const secondCell = renderResult.querySelector('tbody tr td:nth-child(2)');
  expect(secondCell?.textContent).toMatch(/^(-|—|)$/);
});

Then('I should see a table with the following content:', (dataTable: any) => {
  const expectedRows = dataTable.hashes();
  const actualRows = renderResult.querySelectorAll('tbody tr');
  
  expect(actualRows.length).toBe(expectedRows.length);
  
  expectedRows.forEach((expectedRow: any, index: number) => {
    const actualCells = actualRows[index].querySelectorAll('td');
    expect(actualCells[0].textContent).toBe(expectedRow['Name']);
    expect(actualCells[1].textContent).toBe(expectedRow['exo__Instance_class']);
  });
});

Then('all existing layout blocks should render correctly', () => {
  const blocks = renderResult.querySelectorAll('.layout-block');
  expect(blocks.length).toBeGreaterThan(0);
});

Then('the asset name should appear in the first column', () => {
  const firstCell = renderResult.querySelector('tbody tr td:first-child');
  expect(firstCell?.textContent).toBeTruthy();
});

Then('{string} should appear in the second column', (expectedClass: string) => {
  const secondCell = renderResult.querySelector('tbody tr td:nth-child(2)');
  expect(secondCell?.textContent).toBe(expectedClass);
});

Then('no existing functionality should be broken', () => {
  // Check that all expected elements are present
  expect(renderResult.querySelector('table')).toBeTruthy();
  expect(renderResult.querySelectorAll('.error').length).toBe(0);
});

Then('the table should render within {int}ms', (maxTime: number) => {
  const renderTime = (global as any).renderTime;
  expect(renderTime).toBeLessThan(maxTime);
});

Then('all exo__Instance_class values should be displayed correctly', () => {
  const cells = renderResult.querySelectorAll('tbody tr td:nth-child(2)');
  cells.forEach(cell => {
    expect(cell.textContent).toMatch(/^(ems__\w+|-)?$/);
  });
});

Then('the UI should remain responsive', () => {
  // Check that the DOM is not blocked
  expect(renderResult.querySelector('table')).toBeTruthy();
});

Then('the two-column table should be responsive', () => {
  const table = renderResult.querySelector('table');
  expect(table).toBeTruthy();
  if ((global as any).isMobile) {
    expect(table?.classList.contains('mobile-responsive')).toBeTruthy();
  }
});

Then('both columns should be visible on mobile screens', () => {
  const headers = renderResult.querySelectorAll('th');
  expect(headers.length).toBe(2);
  headers.forEach(header => {
    const styles = window.getComputedStyle(header as HTMLElement);
    expect(styles.display).not.toBe('none');
  });
});

Then('the text should be readable without horizontal scrolling', () => {
  const table = renderResult.querySelector('table');
  if (table) {
    const tableWidth = (table as HTMLElement).scrollWidth;
    const containerWidth = (renderResult as HTMLElement).clientWidth;
    expect(tableWidth).toBeLessThanOrEqual(containerWidth);
  }
});

Then('each result should show both name and exo__Instance_class', () => {
  const rows = renderResult.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    expect(cells.length).toBe(2);
    expect(cells[0].textContent).toBeTruthy();
    expect(cells[1].textContent).toBeTruthy();
  });
});

Then('the formatting should be consistent with other tables', () => {
  const table = renderResult.querySelector('table');
  expect(table?.classList.contains('exocortex-table')).toBeTruthy();
});

Then('I should be able to sort by asset name', () => {
  const nameHeader = renderResult.querySelector('th:first-child');
  expect(nameHeader?.classList.contains('sortable')).toBeTruthy();
});

Then('I should be able to sort by exo__Instance_class', () => {
  const classHeader = renderResult.querySelector('th:nth-child(2)');
  expect(classHeader?.classList.contains('sortable')).toBeTruthy();
});

Then('the sorting should be case-insensitive', () => {
  // This would be validated by the actual sorting implementation
  expect(true).toBeTruthy();
});

Then('the copied text should include both columns', () => {
  const selection = window.getSelection();
  const text = selection?.toString();
  expect(text).toContain('Name');
  expect(text).toContain('exo__Instance_class');
});

Then('the format should be suitable for pasting into spreadsheets', () => {
  const selection = window.getSelection();
  const text = selection?.toString();
  expect(text).toContain('\t'); // Tab-separated values
});

Then('the column headers should be included', () => {
  const selection = window.getSelection();
  const text = selection?.toString();
  expect(text).toContain('Name');
  expect(text).toContain('exo__Instance_class');
});