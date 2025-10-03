import { test, expect } from '@playwright/experimental-ct-react';
import { ChildrenEffortsTable, ChildEffort } from '../../src/presentation/components/ChildrenEffortsTable';

test.describe('ChildrenEffortsTable Component', () => {
  const mockChildren: ChildEffort[] = [
    {
      path: 'tasks/child1.md',
      title: 'Child Task 1',
      status: 'active',
      priority: 'high',
      effort: 5,
      progress: 80,
      metadata: {},
    },
    {
      path: 'tasks/child2.md',
      title: 'Child Task 2',
      status: 'completed',
      priority: 'medium',
      effort: 3,
      progress: 100,
      metadata: {},
    },
    {
      path: 'tasks/child3.md',
      title: 'Child Task 3',
      status: 'pending',
      priority: 'low',
      effort: 2,
      progress: 30,
      metadata: {},
    },
  ];

  test('should render table with children', async ({ mount }) => {
    const component = await mount(<ChildrenEffortsTable children={mockChildren} />);

    // Check table exists
    await expect(component.locator('.children-efforts-table')).toBeVisible();

    // Check all children are rendered
    await expect(component.locator('tbody tr')).toHaveCount(3);

    // Check titles
    await expect(component.locator('text=Child Task 1')).toBeVisible();
    await expect(component.locator('text=Child Task 2')).toBeVisible();
    await expect(component.locator('text=Child Task 3')).toBeVisible();
  });

  test('should display status badges', async ({ mount }) => {
    const component = await mount(<ChildrenEffortsTable children={mockChildren} showStatus={true} />);

    // Check status badges exist
    await expect(component.locator('.status-badge')).toHaveCount(3);

    // Check status values
    await expect(component.locator('.status-badge:has-text("active")')).toBeVisible();
    await expect(component.locator('.status-badge:has-text("completed")')).toBeVisible();
    await expect(component.locator('.status-badge:has-text("pending")')).toBeVisible();
  });

  test('should display priority badges', async ({ mount }) => {
    const component = await mount(<ChildrenEffortsTable children={mockChildren} showPriority={true} />);

    // Check priority badges
    await expect(component.locator('.priority-badge')).toHaveCount(3);

    // Check priority values
    await expect(component.locator('.priority-badge:has-text("high")')).toBeVisible();
    await expect(component.locator('.priority-badge:has-text("medium")')).toBeVisible();
    await expect(component.locator('.priority-badge:has-text("low")')).toBeVisible();
  });

  test('should display effort values', async ({ mount }) => {
    const component = await mount(<ChildrenEffortsTable children={mockChildren} showEffort={true} />);

    // Check effort column exists
    await expect(component.locator('th:has-text("Effort")')).toBeVisible();

    // Check effort values (in tbody, not tfoot)
    const effortCells = component.locator('tbody tr td:nth-child(4)');
    await expect(effortCells.nth(0)).toHaveText('5');
    await expect(effortCells.nth(1)).toHaveText('3');
    await expect(effortCells.nth(2)).toHaveText('2');
  });

  test('should display progress bars', async ({ mount }) => {
    const component = await mount(<ChildrenEffortsTable children={mockChildren} showProgress={true} />);

    // Check progress bars exist
    await expect(component.locator('.progress-bar')).toHaveCount(3);

    // Check progress percentages
    await expect(component.locator('.progress-text:has-text("80%")')).toBeVisible();
    await expect(component.locator('.progress-text:has-text("100%")')).toBeVisible();
    await expect(component.locator('.progress-text:has-text("30%")')).toBeVisible();
  });

  test('should calculate totals correctly', async ({ mount }) => {
    const component = await mount(<ChildrenEffortsTable children={mockChildren} showEffort={true} showProgress={true} />);

    // Check totals row exists
    await expect(component.locator('.totals-row')).toBeVisible();

    // Check total effort (5 + 3 + 2 = 10)
    await expect(component.locator('.totals-row td:nth-child(4)')).toContainText('10');

    // Check average progress ((80 + 100 + 30) / 3 = 70%)
    await expect(component.locator('.totals-row td:nth-child(5)')).toContainText('70.0%');
  });

  test('should handle child click', async ({ mount }) => {
    let clickedPath: string | null = null;

    const component = await mount(
      <ChildrenEffortsTable
        children={mockChildren}
        onChildClick={path => {
          clickedPath = path;
        }}
      />
    );

    // Click on first child link
    await component.locator('a:has-text("Child Task 1")').click();

    // Verify callback was called
    expect(clickedPath).toBe('tasks/child1.md');
  });

  test('should handle empty children list', async ({ mount }) => {
    const component = await mount(<ChildrenEffortsTable children={[]} />);

    // Should show message
    await expect(component).toContainText('No child efforts found');

    // Should not show table
    await expect(component.locator('.children-efforts-table')).not.toBeVisible();
  });

  test('should hide columns when flags are false', async ({ mount }) => {
    const component = await mount(
      <ChildrenEffortsTable
        children={mockChildren}
        showStatus={false}
        showPriority={false}
        showEffort={false}
        showProgress={false}
      />
    );

    // Only Title column should be visible
    await expect(component.locator('th:has-text("Status")')).not.toBeVisible();
    await expect(component.locator('th:has-text("Priority")')).not.toBeVisible();
    await expect(component.locator('th:has-text("Effort")')).not.toBeVisible();
    await expect(component.locator('th:has-text("Progress")')).not.toBeVisible();

    // Title should still be visible
    await expect(component.locator('th:has-text("Title")')).toBeVisible();
  });

  test('should handle missing optional fields', async ({ mount }) => {
    const incompleteChildren: ChildEffort[] = [
      {
        path: 'tasks/incomplete.md',
        title: 'Incomplete Task',
        metadata: {},
      },
    ];

    const component = await mount(<ChildrenEffortsTable children={incompleteChildren} />);

    // Should render without errors
    await expect(component.locator('text=Incomplete Task')).toBeVisible();

    // Missing fields should show as dash or empty
    await expect(component.locator('.status-badge')).toHaveText('-');
  });

  test('should display item count in totals', async ({ mount }) => {
    const component = await mount(<ChildrenEffortsTable children={mockChildren} />);

    // Check item count
    await expect(component.locator('.totals-row')).toContainText('Totals (3 items)');
  });
});
