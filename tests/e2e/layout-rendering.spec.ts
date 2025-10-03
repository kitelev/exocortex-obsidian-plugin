import { test, expect } from '@playwright/test';
import {
  launchObsidian,
  closeObsidian,
  createTestNote,
  openNote,
  waitForPlugin,
  elementExists,
} from './setup/helpers';

test.describe('Layout Rendering', () => {
  test.beforeAll(async () => {
    await createTestNote(
      'Test Task.md',
      '# Test Task\n\nThis is a test task for E2E testing.',
      {
        exo__Instance_class: '[[ems__Task]]',
        exo__Asset_uid: '550e8400-e29b-41d4-a716-446655440000',
        exo__Asset_isDefinedBy: '[[!ems]]',
        exo__Asset_createdAt: '2025-01-01T00:00:00',
        status: 'active',
      }
    );
  });

  test('should render layout for asset note', async () => {
    const context = await launchObsidian();
    await waitForPlugin(context.window, 'exocortex-obsidian-plugin');

    await openNote(context.window, 'Test Task');
    await context.window.waitForTimeout(2000);

    const hasLayout = await elementExists(
      context.window,
      '.exocortex-layout, [data-exocortex-layout]'
    );

    expect(hasLayout).toBe(true);
    await closeObsidian(context);
  });

  test('should display asset properties in layout', async () => {
    const context = await launchObsidian();
    await waitForPlugin(context.window, 'exocortex-obsidian-plugin');

    await openNote(context.window, 'Test Task');
    await context.window.waitForTimeout(2000);

    const statusVisible = await context.window.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('active') || text.includes('status');
    });

    expect(statusVisible).toBe(true);
    await closeObsidian(context);
  });

  test('should handle note without frontmatter gracefully', async () => {
    await createTestNote(
      'Regular Note.md',
      '# Regular Note\n\nThis note has no frontmatter.'
    );

    const context = await launchObsidian();
    await waitForPlugin(context.window, 'exocortex-obsidian-plugin');

    await openNote(context.window, 'Regular Note');
    await context.window.waitForTimeout(1000);

    const contentVisible = await context.window.evaluate(() => {
      return document.body.innerText.includes('Regular Note');
    });

    expect(contentVisible).toBe(true);
    await closeObsidian(context);
  });
});
