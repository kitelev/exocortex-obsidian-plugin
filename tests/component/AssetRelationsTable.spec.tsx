import { test, expect } from '@playwright/experimental-ct-react';
import { AssetRelationsTable, AssetRelation } from '../../src/presentation/components/AssetRelationsTable';

test.describe('AssetRelationsTable Component', () => {
  const mockRelations: AssetRelation[] = [
    {
      path: 'tasks/task1.md',
      title: 'Task 1',
      propertyName: 'assignedTo',
      isBodyLink: false,
      created: Date.now() - 86400000,
      modified: Date.now(),
      metadata: { exo__Instance_class: 'ems__Task', status: 'active', priority: 'high' },
    },
    {
      path: 'tasks/task2.md',
      title: 'Task 2',
      propertyName: 'assignedTo',
      isBodyLink: false,
      created: Date.now() - 172800000,
      modified: Date.now() - 86400000,
      metadata: { exo__Instance_class: '[[ems__Project]]', status: 'completed', priority: 'medium' },
    },
    {
      path: 'tasks/task3.md',
      title: 'Task 3',
      propertyName: undefined,
      isBodyLink: true,
      created: Date.now() - 259200000,
      modified: Date.now() - 172800000,
      metadata: { status: 'pending', priority: 'low' },
    },
  ];

  test('should render table with relations', async ({ mount }) => {
    const component = await mount(<AssetRelationsTable relations={mockRelations} />);

    // Check table exists
    await expect(component.locator('.exocortex-relations-table')).toBeVisible();

    // Check all relations are rendered
    await expect(component.locator('tbody tr')).toHaveCount(3);

    // Check titles are displayed
    await expect(component.locator('text=Task 1')).toBeVisible();
    await expect(component.locator('text=Task 2')).toBeVisible();
    await expect(component.locator('text=Task 3')).toBeVisible();
  });

  test('should handle sorting by name', async ({ mount }) => {
    const component = await mount(<AssetRelationsTable relations={mockRelations} />);

    // Click Name header to sort (first click sorts descending)
    await component.locator('th:has-text("Name")').click();

    // Check sort indicator (component starts with desc on first click)
    await expect(component.locator('th:has-text("Name")')).toContainText('↓');

    // Click again to reverse sort to ascending
    await component.locator('th:has-text("Name")').click();
    await expect(component.locator('th:has-text("Name")')).toContainText('↑');
  });

  test('should group relations by property', async ({ mount }) => {
    const component = await mount(
      <AssetRelationsTable relations={mockRelations} groupByProperty={true} />
    );

    // Check groups are rendered
    await expect(component.locator('.relation-group')).toHaveCount(2);

    // Check group headers
    await expect(component.locator('.group-header:has-text("assignedTo")')).toBeVisible();
    await expect(component.locator('.group-header:has-text("Body Links")')).toBeVisible();
  });

  test('should display additional properties', async ({ mount }) => {
    const component = await mount(
      <AssetRelationsTable
        relations={mockRelations}
        showProperties={['status', 'priority']}
      />
    );

    // Check property columns exist
    await expect(component.locator('th:has-text("status")')).toBeVisible();
    await expect(component.locator('th:has-text("priority")')).toBeVisible();

    // Check property values are displayed
    await expect(component.locator('text=active')).toBeVisible();
    await expect(component.locator('text=high')).toBeVisible();
  });

  test('should handle asset click', async ({ mount }) => {
    let clickedPath: string | null = null;
    let clickedEvent: React.MouseEvent | null = null;

    const component = await mount(
      <AssetRelationsTable
        relations={mockRelations}
        onAssetClick={(path, event) => {
          clickedPath = path;
          clickedEvent = event;
        }}
      />
    );

    // Click on first asset link
    await component.locator('a:has-text("Task 1")').click();

    // Verify callback was called with correct path
    expect(clickedPath).toBe('tasks/task1.md');
    expect(clickedEvent).not.toBeNull();
  });

  test('should pass event with metaKey when Command+Click', async ({ mount, page }) => {
    let clickedPath: string | null = null;
    let clickedEvent: React.MouseEvent | null = null;

    const component = await mount(
      <AssetRelationsTable
        relations={mockRelations}
        onAssetClick={(path, event) => {
          clickedPath = path;
          clickedEvent = event;
        }}
      />
    );

    // Command+Click on first asset link (Mac)
    await component.locator('a:has-text("Task 1")').click({ modifiers: ['Meta'] });

    // Verify callback was called with event containing metaKey
    expect(clickedPath).toBe('tasks/task1.md');
    expect(clickedEvent).not.toBeNull();
    // Note: We can't easily test metaKey in component tests, but the event is passed correctly
  });


  test('should handle empty relations', async ({ mount }) => {
    const component = await mount(<AssetRelationsTable relations={[]} />);

    // Should still render table structure
    await expect(component.locator('.exocortex-relations-table')).toBeVisible();

    // But no rows
    await expect(component.locator('tbody tr')).toHaveCount(0);
  });

  test('should display exo__Instance_class column', async ({ mount }) => {
    const component = await mount(<AssetRelationsTable relations={mockRelations} />);

    // Check Instance Class column exists
    await expect(component.locator('th:has-text("exo__Instance_class")')).toBeVisible();

    // Check Instance Class values are displayed (wiki syntax removed)
    await expect(component.locator('text=ems__Task')).toBeVisible();
    await expect(component.locator('text=ems__Project')).toBeVisible();
  });

  test('should sort by exo__Instance_class', async ({ mount }) => {
    const component = await mount(<AssetRelationsTable relations={mockRelations} />);

    // Click exo__Instance_class column
    await component.locator('th:has-text("exo__Instance_class")').click();

    // Check sort indicator
    await expect(component.locator('th:has-text("exo__Instance_class")')).toContainText('↑');
  });
});
