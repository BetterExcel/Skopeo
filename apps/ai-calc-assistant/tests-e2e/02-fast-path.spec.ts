// @ts-nocheck
import { test, expect } from '@playwright/test';
import { openCalcAndSidebar, typePromptAndSend } from './utils';

test.describe('AI Calc Assistant - Fast path commands', () => {
  test('sets text in A1 via fast path', async ({ page }) => {
    await openCalcAndSidebar(page);
    await typePromptAndSend(page, 'Put "hello" in A1');

    // Expect a preview or a progress message appears
    const progress = page.locator('[data-test="progress-log"]');
    await expect(progress).toContainText(/Executing: set_cell_text/i, { timeout: 15_000 });
    await expect(progress).toContainText(/Done\./i, { timeout: 30_000 });

    // If UNO bridge is available, we could further assert cell content via DOM
    // Placeholder: assert that operation finished without error toast
    await expect(page.locator('[data-test="toast-error"]')).toHaveCount(0);
  });
});
