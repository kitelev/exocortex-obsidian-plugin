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

  test('should render single node tree', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeSingleNode} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('.area-tree-label')).toBeVisible();
    await expect(component.locator('.area-tree-label')).toHaveText('Root Area');
    await expect(component.locator('.area-tree-toggle')).toHaveCount(0);
  });

  test('should render tree with children', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('.area-tree-label').first()).toHaveText('Root Area');
    await expect(component.locator('.area-tree-children .area-tree-label')).toHaveCount(2);
    await expect(component.locator('text=Child 1')).toBeVisible();
    await expect(component.locator('text=Child 2')).toBeVisible();
  });

  test('should highlight current area', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/child1.md" />
    );

    const currentLabel = component.locator('.area-tree-label.current');
    await expect(currentLabel).toHaveText('Child 1');
    await expect(currentLabel).toHaveAttribute('aria-current', 'page');
  });

  test('should toggle collapse/expand on button click', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithChildren} currentAreaPath="areas/root.md" />
    );

    const toggleButton = component.locator('.area-tree-toggle').first();
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    await expect(component.locator('text=Child 1')).toBeVisible();

    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    await expect(component.locator('text=Child 1')).not.toBeVisible();

    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    await expect(component.locator('text=Child 1')).toBeVisible();
  });

  test('should handle multi-level hierarchy', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeMultiLevel} currentAreaPath="areas/root.md" />
    );

    await expect(component.locator('[data-href="areas/root.md"]')).toBeVisible();
    await expect(component.locator('[data-href="areas/child1.md"]')).toBeVisible();
    await expect(component.locator('[data-href="areas/grandchild1.md"]')).toBeVisible();

    const childToggles = component.locator('.area-tree-toggle');
    await expect(childToggles).toHaveCount(2);
  });

  test('should style archived areas', async ({ mount }) => {
    const component = await mount(
      <AreaHierarchyTree tree={mockTreeWithArchived} currentAreaPath="areas/root.md" />
    );

    const archivedLabel = component.locator('.area-tree-label.archived');
    await expect(archivedLabel).toBeVisible();
    await expect(archivedLabel).toHaveText('Archived Child');
    await expect(archivedLabel).toHaveClass(/archived/);
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

  test('should support keyboard navigation on label', async ({ mount }) => {
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

    const child1Label = component.locator('[data-href="areas/child1.md"]');
    await child1Label.focus();
    await child1Label.press('Enter');

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

    await expect(component.locator('.area-tree-label')).toHaveText('Test Label');
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

    await expect(component.locator('.area-tree-label')).toHaveText('test-title');
  });
});
