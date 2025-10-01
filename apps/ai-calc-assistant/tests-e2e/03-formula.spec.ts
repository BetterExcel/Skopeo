// @ts-nocheck
import { test, expect } from '@playwright/test';
import { openCalcAndSidebar, typePromptAndSend } from './utils';

test.describe('AI Calc Assistant - Apply formula', () => {
  test('applies a formula to a cell via fast path', async ({ page }) => {
    await openCalcAndSidebar(page);
    await typePromptAndSend(page, 'Apply formula =SUM(1,2) to A1');

    const progress = page.locator('[data-test="progress-log"]');
    await expect(progress).toContainText(/Executing: apply_formula/i, { timeout: 15_000 });
    await expect(progress).toContainText(/Done\./i, { timeout: 30_000 });

    await expect(page.locator('[data-test="toast-error"]')).toHaveCount(0);
  });
});
