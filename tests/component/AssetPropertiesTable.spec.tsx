import { test, expect } from '@playwright/experimental-ct-react';
import { AssetPropertiesTable } from '../../src/presentation/components/AssetPropertiesTable';

test.describe('AssetPropertiesTable Component', () => {
  const mockMetadata = {
    title: 'My Task',
    status: 'in-progress',
    priority: 'high',
    exo__Instance_class: '[[ems__Task]]',
    project: '[[My Project]]',
    tags: ['work', 'urgent', 'review'],
    count: 42,
    price: 99.99,
    active: true,
    archived: false,
  };

  test('should render properties table with metadata', async ({ mount }) => {
    const component = await mount(<AssetPropertiesTable metadata={mockMetadata} />);

    // Check table exists
    await expect(component.locator('.exocortex-properties-table')).toBeVisible();

    // Check header
    await expect(component.locator('h3:has-text("Properties")')).toBeVisible();

    // Check column headers
    await expect(component.locator('th:has-text("Property")')).toBeVisible();
    await expect(component.locator('th:has-text("Value")')).toBeVisible();

    // Check all properties are rendered
    const rows = component.locator('tbody tr');
    await expect(rows).toHaveCount(10);
  });

  test('should display simple text properties', async ({ mount }) => {
    const component = await mount(<AssetPropertiesTable metadata={mockMetadata} />);

    // Check simple text values
    await expect(component.locator('td:has-text("title")')).toBeVisible();
    await expect(component.locator('td:has-text("My Task")')).toBeVisible();

    await expect(component.locator('td:has-text("status")')).toBeVisible();
    await expect(component.locator('td:has-text("in-progress")')).toBeVisible();
  });

  test('should render wiki-links as clickable internal links', async ({ mount }) => {
    const component = await mount(<AssetPropertiesTable metadata={mockMetadata} />);

    // Check Instance Class link
    const instanceClassLink = component.locator('a.internal-link:has-text("ems__Task")');
    await expect(instanceClassLink).toBeVisible();
    await expect(instanceClassLink).toHaveClass(/internal-link/);

    // Check project link
    const projectLink = component.locator('a.internal-link:has-text("My Project")');
    await expect(projectLink).toBeVisible();
    await expect(projectLink).toHaveClass(/internal-link/);

    // Verify wiki syntax is removed
    await expect(component.locator('text=[[ems__Task]]')).not.toBeVisible();
    await expect(component.locator('text=[[My Project]]')).not.toBeVisible();
  });

  test('should handle link clicks', async ({ mount }) => {
    let clickedPath: string | null = null;

    const component = await mount(
      <AssetPropertiesTable
        metadata={mockMetadata}
        onLinkClick={path => {
          clickedPath = path;
        }}
      />
    );

    // Click on Instance Class link
    await component.locator('a:has-text("ems__Task")').click();

    // Verify callback was called
    expect(clickedPath).toBe('ems__Task');
  });

  test('should display array properties as comma-separated values', async ({ mount }) => {
    const component = await mount(<AssetPropertiesTable metadata={mockMetadata} />);

    // Check tags array is displayed
    await expect(component.locator('td:has-text("tags")')).toBeVisible();
    await expect(component.locator('text=work, urgent, review')).toBeVisible();
  });

  test('should display array with wiki-links', async ({ mount }) => {
    const metadata = {
      references: ['[[Note A]]', '[[Note B]]', '[[Note C]]'],
    };

    const component = await mount(<AssetPropertiesTable metadata={metadata} />);

    // Check all links are rendered
    await expect(component.locator('a:has-text("Note A")')).toBeVisible();
    await expect(component.locator('a:has-text("Note B")')).toBeVisible();
    await expect(component.locator('a:has-text("Note C")')).toBeVisible();

    // Check comma separators
    const valueCell = component.locator('td.property-value').filter({ hasText: 'Note A' });
    await expect(valueCell).toContainText('Note A, Note B, Note C');
  });

  test('should display boolean values', async ({ mount }) => {
    const component = await mount(<AssetPropertiesTable metadata={mockMetadata} />);

    // Check boolean values
    await expect(component.locator('text=active')).toBeVisible();
    await expect(component.locator('text=true')).toBeVisible();
    await expect(component.locator('text=archived')).toBeVisible();
    await expect(component.locator('text=false')).toBeVisible();
  });

  test('should display number values', async ({ mount }) => {
    const component = await mount(<AssetPropertiesTable metadata={mockMetadata} />);

    // Check number values
    await expect(component.locator('text=count')).toBeVisible();
    await expect(component.locator('text=42')).toBeVisible();

    await expect(component.locator('text=price')).toBeVisible();
    await expect(component.locator('text=99.99')).toBeVisible();
  });

  test('should handle null and undefined values', async ({ mount }) => {
    const metadata = {
      nullValue: null,
      undefinedValue: undefined,
      normalValue: 'test',
    };

    const component = await mount(<AssetPropertiesTable metadata={metadata} />);

    // Check null/undefined are displayed as "-"
    const cells = component.locator('td.property-value:has-text("-")');
    await expect(cells).toHaveCount(2);
  });

  test('should not render when metadata is empty', async ({ mount }) => {
    const component = await mount(<AssetPropertiesTable metadata={{}} />);

    // Component should not render anything
    await expect(component.locator('.exocortex-asset-properties')).not.toBeVisible();
  });

  test('should preserve property key formatting', async ({ mount }) => {
    const metadata = {
      'exo__Instance_class': 'test',
      'simple_name': 'test',
      'CamelCaseKey': 'test',
    };

    const component = await mount(<AssetPropertiesTable metadata={metadata} />);

    // Check keys are preserved exactly
    await expect(component.locator('td:has-text("exo__Instance_class")')).toBeVisible();
    await expect(component.locator('td:has-text("simple_name")')).toBeVisible();
    await expect(component.locator('td:has-text("CamelCaseKey")')).toBeVisible();
  });

  test('should handle mixed content in arrays', async ({ mount }) => {
    const metadata = {
      mixedArray: ['simple text', '[[Note Link]]', 'more text'],
    };

    const component = await mount(<AssetPropertiesTable metadata={metadata} />);

    // Check plain text is displayed
    await expect(component.locator('text=simple text')).toBeVisible();
    await expect(component.locator('text=more text')).toBeVisible();

    // Check link is rendered
    await expect(component.locator('a.internal-link:has-text("Note Link")')).toBeVisible();
  });

  test('should display object values as JSON', async ({ mount }) => {
    const metadata = {
      nestedObject: { author: 'John', created: '2024-01-01' },
    };

    const component = await mount(<AssetPropertiesTable metadata={metadata} />);

    // Check object is stringified
    await expect(component.locator('text=nestedObject')).toBeVisible();
    await expect(component.locator('text={"author":"John","created":"2024-01-01"}')).toBeVisible();
  });

  test('should handle empty arrays', async ({ mount }) => {
    const metadata = {
      emptyArray: [],
      normalValue: 'test',
    };

    const component = await mount(<AssetPropertiesTable metadata={metadata} />);

    // Empty array should render as empty (no content between commas)
    const emptyRow = component.locator('tr:has(td:has-text("emptyArray"))');
    await expect(emptyRow).toBeVisible();
  });
});
