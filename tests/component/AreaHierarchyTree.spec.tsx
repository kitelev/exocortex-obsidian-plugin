import { test, expect } from '@playwright/experimental-ct-react';
import { AreaHierarchyTree, AreaNode } from '../../src/presentation/components/AreaHierarchyTree';
import '../../styles.css';

test.describe('AreaHierarchyTree Component', () => {
  const mockTreeSingleNode: AreaNode = {
    path: 'areas/root.md',
    title: 'root',
    label: 'Root Area',
    isArchived: false,
    depth: 0,
    children: [],
  };

  const mockTreeWithChildren: AreaNode = {
    path: 'areas/root.md',
    title: 'root',
    label: 'Root Area',
    isArchived: false,
    depth: 0,
    children: [
      {
        path: 'areas/child1.md',
        title: 'child1',
        label: 'Child 1',
        isArchived: false,
        depth: 1,
        parentPath: 'areas/root.md',
        children: [],
      },
      {
        path: 'areas/child2.md',
        title: 'child2',
        label: 'Child 2',
        isArchived: false,
        depth: 1,
        parentPath: 'areas/root.md',
        children: [],
      },
    ],
  };

  const mockTreeMultiLevel: AreaNode = {
    path: 'areas/root.md',
    title: 'root',
    label: 'Root Area',
    isArchived: false,
    depth: 0,
    children: [
      {
        path: 'areas/child1.md',
        title: 'child1',
        label: 'Child 1',
        isArchived: false,
        depth: 1,
        parentPath: 'areas/root.md',
        children: [
          {
            path: 'areas/grandchild1.md',
            title: 'grandchild1',
            label: 'Grandchild 1',
            isArchived: false,
            depth: 2,
            parentPath: 'areas/child1.md',
            children: [],
          },
        ],
      },
    ],
  };

  const mockTreeWithArchived: AreaNode = {
    path: 'areas/root.md',
    title: 'root',
    label: 'Root Area',
    isArchived: false,
    depth: 0,
    children: [
      {
        path: 'areas/archived-child.md',
        title: 'archived-child',
        label: 'Archived Child',
        isArchived: true,
        depth: 1,
        parentPath: 'areas/root.md',
        children: [],
      },
    ],
  };

  test('should render table structure', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeSingleNode} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('table.exocortex-relation-table')).toBeVisible();
    await expect(component.locator('thead')).toBeVisible();
    await expect(component.locator('th')).toHaveCount(2);
    await expect(component.locator('th').first()).toHaveText('Area');
    await expect(component.locator('th').last()).toHaveText('Class');
  });

  test('should render single node tree as table row', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeSingleNode} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('tbody tr')).toHaveCount(1);
    await expect(component.locator('.internal-link').first()).toHaveText('Root Area');
  });

  test('should render all levels in flat table', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('tbody tr')).toHaveCount(3);
    await expect(component.locator('text=Root Area')).toBeVisible();
    await expect(component.locator('text=Child 1')).toBeVisible();
    await expect(component.locator('text=Child 2')).toBeVisible();
  });

  test('should highlight current area', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/child1.md" />
    );

    const currentLink = component.locator('.internal-link.area-tree-current');
    await expect(currentLink).toBeVisible();
    await expect(currentLink).toContainText('Child 1');
  });

  test('should display multi-level hierarchy in flat table', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeMultiLevel} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('tbody tr')).toHaveCount(3);
    await expect(component.locator('[data-href="areas/root.md"]')).toBeVisible();
    await expect(component.locator('[data-href="areas/child1.md"]')).toBeVisible();
    await expect(component.locator('[data-href="areas/grandchild1.md"]')).toBeVisible();
  });

  test('should show indentation for hierarchy levels', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeMultiLevel} currentAreaPath="areas/root.md" />
    );

    const rootLink = component.locator('[data-href="areas/root.md"]');
    const childLink = component.locator('[data-href="areas/child1.md"]');
    const grandchildLink = component.locator('[data-href="areas/grandchild1.md"]');

    const rootText = await rootLink.textContent();
    const childText = await childLink.textContent();
    const grandchildText = await grandchildLink.textContent();

    expect(rootText?.indexOf('Root Area')).toBe(0);
    expect(childText?.indexOf('Child 1')).toBeGreaterThan(0);
    expect(grandchildText?.indexOf('Grandchild 1')).toBeGreaterThan(childText?.indexOf('Child 1') || 0);
  });

  test('should style archived areas', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithArchived} currentAreaPath="areas/root.md" />
    );

    const archivedLink = component.locator('.internal-link.is-archived');
    await expect(archivedLink).toBeVisible();
    await expect(archivedLink).toContainText('Archived Child');
  });

  test('should handle area click events', async ({ mount }) => {
    let clickedPath: string | null = null;

    const component = await mount(
      <AreaHierarchyTree
        tree={mockTreeWithChildren}
        currentAreaPath="areas/root.md"
        onAreaClick={(path) => {
          clickedPath = path;
        }}
      />
    );

    const child1Link = component.locator('[data-href="areas/child1.md"]');
    await child1Link.click();

    expect(clickedPath).toBe('areas/child1.md');
  });

  test('should display label when available', async ({ mount }) => {
    const treeWithLabel: AreaNode = {
      path: 'areas/test.md',
      title: 'test',
      label: 'Test Label',
      isArchived: false,
      depth: 0,
      children: [],
    };

    const component = await mount(
      <AreaHierarchyTree tree={treeWithLabel} currentAreaPath="areas/test.md" />
    );

    await expect(component.locator('td:nth-child(1) .internal-link')).toContainText('Test Label');
  });

  test('should fallback to title when label is not available', async ({ mount }) => {
    const treeWithoutLabel: AreaNode = {
      path: 'areas/test.md',
      title: 'test-title',
      isArchived: false,
      depth: 0,
      children: [],
    };

    const component = await mount(
      <AreaHierarchyTree tree={treeWithoutLabel} currentAreaPath="areas/test.md" />
    );

    await expect(component.locator('td:nth-child(1) .internal-link')).toContainText('test-title');
  });

  test('should display ems__Area class for all rows', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/root.md" />
    );

    const classLinks = component.locator('td:nth-child(2) .internal-link');
    await expect(classLinks).toHaveCount(3);
    await expect(classLinks.first()).toHaveText('ems__Area');
  });

  test.skip('should use custom label from getAssetLabel', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree
        tree={mockTreeSingleNode}
        currentAreaPath="areas/root.md"
        getAssetLabel={(path) => {
          if (path === 'areas/root.md') return 'Custom Label';
          return null;
        }}
      />
    );

    await expect(component.locator('td:nth-child(1) .internal-link')).toContainText('Custom Label');
  });
});
