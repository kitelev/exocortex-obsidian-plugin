import { test, expect } from '@playwright/experimental-ct-react';
import { PropertyDisplay } from '../../src/presentation/components/PropertyDisplay';

test.describe('PropertyDisplay Component', () => {
  test('should render text property', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="title" value="My Task" type="text" />
    );

    await expect(component.locator('.property-name')).toHaveText('title:');
    await expect(component.locator('.property-value')).toHaveText('My Task');
  });

  test('should render number property', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="effort" value={5} type="number" />
    );

    await expect(component.locator('.property-value')).toHaveText('5');
  });

  test('should render date property', async ({ mount }) => {
    const date = new Date('2025-01-01');
    const component = await mount(
      <PropertyDisplay name="created" value={date.getTime()} type="date" />
    );

    await expect(component.locator('.property-value')).toContainText('1/1/2025');
  });

  test('should render boolean property', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="completed" value={true} type="boolean" />
    );

    await expect(component.locator('.property-value')).toHaveText('Yes');
  });

  test('should render list property', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="tags" value={['tag1', 'tag2', 'tag3']} type="list" />
    );

    await expect(component.locator('.property-value')).toHaveText('tag1, tag2, tag3');
  });

  test('should handle null/undefined values', async ({ mount }) => {
    const component = await mount(<PropertyDisplay name="empty" value={null} />);

    await expect(component.locator('.property-value')).toHaveText('-');
  });

  test('should show edit button when editable', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="title" value="My Task" editable={true} />
    );

    await expect(component.locator('.property-edit')).toBeVisible();
    await expect(component.locator('.property-edit')).toHaveText('Edit');
  });

  test('should not show edit button when not editable', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="title" value="My Task" editable={false} />
    );

    await expect(component.locator('.property-edit')).not.toBeVisible();
  });

  test('should enter edit mode on edit button click', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="title" value="My Task" editable={true} />
    );

    await component.locator('.property-edit').click();

    // Check edit mode UI
    await expect(component.locator('.property-input')).toBeVisible();
    await expect(component.locator('.property-save')).toBeVisible();
    await expect(component.locator('.property-cancel')).toBeVisible();
  });

  test('should save edited value', async ({ mount }) => {
    let savedValue: any = null;

    const component = await mount(
      <PropertyDisplay
        name="title"
        value="My Task"
        editable={true}
        onEdit={(name, value) => {
          savedValue = value;
        }}
      />
    );

    // Enter edit mode
    await component.locator('.property-edit').click();

    // Change value
    await component.locator('.property-input').fill('Updated Task');

    // Save
    await component.locator('.property-save').click();

    // Check callback was called
    expect(savedValue).toBe('Updated Task');

    // Check not in edit mode anymore
    await expect(component.locator('.property-input')).not.toBeVisible();
  });

  test('should cancel editing', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="title" value="My Task" editable={true} />
    );

    // Enter edit mode
    await component.locator('.property-edit').click();

    // Change value
    await component.locator('.property-input').fill('Updated Task');

    // Cancel
    await component.locator('.property-cancel').click();

    // Check back to view mode
    await expect(component.locator('.property-input')).not.toBeVisible();
    await expect(component.locator('.property-value')).toHaveText('My Task');
  });

  test('should focus input when entering edit mode', async ({ mount }) => {
    const component = await mount(
      <PropertyDisplay name="title" value="My Task" editable={true} />
    );

    await component.locator('.property-edit').click();

    // Input should be focused
    await expect(component.locator('.property-input')).toBeFocused();
  });
});
