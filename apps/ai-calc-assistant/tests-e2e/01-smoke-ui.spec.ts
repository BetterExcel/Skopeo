// @ts-nocheck
import { test, expect } from '@playwright/test';
import { openCalcAndSidebar } from './utils';

test.describe('AI Calc Assistant - UI smoke', () => {
  test('sidebar mounts and shows diagnostics section', async ({ page }) => {
    await openCalcAndSidebar(page);

    // Diagnostics section
    const diag = page.locator('[data-test="diagnostics-section"]');
    await expect(diag).toBeVisible();

    // Chat input and send button exist
    await expect(page.locator('[data-test="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-test="send-btn"]')).toBeVisible();
  });
});
