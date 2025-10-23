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

  test('should not render when tree has no children', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeSingleNode} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('table.exocortex-relation-table')).not.toBeVisible();
  });

  test('should render table structure with children', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('table.exocortex-relation-table')).toBeVisible();
    await expect(component.locator('thead')).toBeVisible();
    await expect(component.locator('th')).toHaveCount(2);
    await expect(component.locator('th').first()).toHaveText('Area');
    await expect(component.locator('th').last()).toHaveText('Class');
  });

  test('should render only direct children, not root', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('tbody tr')).toHaveCount(2);
    await expect(component.locator('text=Root Area')).not.toBeVisible();
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

  test('should display multi-level hierarchy with collapsible nodes', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeMultiLevel} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('tbody tr')).toHaveCount(2);
    await expect(component.locator('[data-href="areas/root.md"]')).not.toBeVisible();
    await expect(component.locator('[data-href="areas/child1.md"]')).toBeVisible();
    await expect(component.locator('[data-href="areas/grandchild1.md"]')).toBeVisible();
  });

  test('should show indentation for hierarchy levels', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeMultiLevel} currentAreaPath="areas/root.md" />
    );

    const childLink = component.locator('[data-href="areas/child1.md"]');
    const grandchildLink = component.locator('[data-href="areas/grandchild1.md"]');

    const childText = await childLink.textContent();
    const grandchildText = await grandchildLink.textContent();

    expect(childText?.indexOf('Child 1')).toBe(0);
    expect(grandchildText?.indexOf('Grandchild 1')).toBeGreaterThan(0);
  });

  test('should style archived child areas', async ({ mount }) => {
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

  test('should display label when available for child nodes', async ({ mount }) => {
    const treeWithLabel: AreaNode = {
      path: 'areas/parent.md',
      title: 'parent',
      label: 'Parent',
      isArchived: false,
      depth: 0,
      children: [{
        path: 'areas/child.md',
        title: 'child',
        label: 'Child Label',
        isArchived: false,
        depth: 1,
        parentPath: 'areas/parent.md',
        children: [],
      }],
    };

    const component = await mount(
      <AreaHierarchyTree tree={treeWithLabel} currentAreaPath="areas/parent.md" />
    );

    await expect(component.locator('td:nth-child(1) .internal-link')).toContainText('Child Label');
  });

  test('should fallback to title when label is not available for child nodes', async ({ mount }) => {
    const treeWithoutLabel: AreaNode = {
      path: 'areas/parent.md',
      title: 'parent',
      isArchived: false,
      depth: 0,
      children: [{
        path: 'areas/child.md',
        title: 'child-title',
        isArchived: false,
        depth: 1,
        parentPath: 'areas/parent.md',
        children: [],
      }],
    };

    const component = await mount(
      <AreaHierarchyTree tree={treeWithoutLabel} currentAreaPath="areas/parent.md" />
    );

    await expect(component.locator('td:nth-child(1) .internal-link')).toContainText('child-title');
  });

  test('should display ems__Area class for all child rows', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/root.md" />
    );

    const classLinks = component.locator('td:nth-child(2) .internal-link');
    await expect(classLinks).toHaveCount(2);
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

  test('should display collapse/expand toggle for nodes with children', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeMultiLevel} currentAreaPath="areas/root.md" />
    );

    const toggle = component.locator('.area-tree-toggle').first();
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('▼');
  });

  test('should not display toggle for nodes without children', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/root.md" />
    );

    const toggles = component.locator('.area-tree-toggle');
    await expect(toggles).toHaveCount(0);
  });

  test('should collapse children when toggle is clicked', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeMultiLevel} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('[data-href="areas/grandchild1.md"]')).toBeVisible();

    const toggle = component.locator('.area-tree-toggle').first();
    await toggle.click();

    await expect(toggle).toHaveText('▶');
    await expect(component.locator('[data-href="areas/grandchild1.md"]')).not.toBeVisible();
  });

  test('should expand children when toggle is clicked again', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeMultiLevel} currentAreaPath="areas/root.md" />
    );

    const toggle = component.locator('.area-tree-toggle').first();

    await toggle.click();
    await expect(component.locator('[data-href="areas/grandchild1.md"]')).not.toBeVisible();
    await expect(toggle).toHaveText('▶');

    await toggle.click();
    await expect(component.locator('[data-href="areas/grandchild1.md"]')).toBeVisible();
    await expect(toggle).toHaveText('▼');
  });

  test('should maintain independent collapse states for different nodes', async ({ mount }) => {
    const treeWithMultipleBranches: AreaNode = {
      path: 'areas/root.md',
      title: 'root',
      label: 'Root',
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
        {
          path: 'areas/child2.md',
          title: 'child2',
          label: 'Child 2',
          isArchived: false,
          depth: 1,
          parentPath: 'areas/root.md',
          children: [
            {
              path: 'areas/grandchild2.md',
              title: 'grandchild2',
              label: 'Grandchild 2',
              isArchived: false,
              depth: 2,
              parentPath: 'areas/child2.md',
              children: [],
            },
          ],
        },
      ],
    };

    const component = await mount(
      <AreaHierarchyTree tree={treeWithMultipleBranches} currentAreaPath="areas/root.md" />
    );

    const toggles = component.locator('.area-tree-toggle');
    await expect(toggles).toHaveCount(2);

    await toggles.nth(0).click();
    await expect(component.locator('[data-href="areas/grandchild1.md"]')).not.toBeVisible();
    await expect(component.locator('[data-href="areas/grandchild2.md"]')).toBeVisible();

    await toggles.nth(1).click();
    await expect(component.locator('[data-href="areas/grandchild1.md"]')).not.toBeVisible();
    await expect(component.locator('[data-href="areas/grandchild2.md"]')).not.toBeVisible();
  });
});
