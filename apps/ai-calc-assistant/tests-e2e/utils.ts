// @ts-nocheck
import { Page, expect } from '@playwright/test';

export async function openCalcAndSidebar(page: Page, url?: string) {
  await page.goto(url || '/');

  // Sidebar bootstrap marker from our client app root element
  const sidebar = page.locator('#ai-calc-assistant-root');
  await expect(sidebar).toBeVisible();
  return sidebar;
}

export async function typePromptAndSend(page: Page, prompt: string) {
  const input = page.locator('[data-test="chat-input"]');
  await input.click();
  await input.fill(prompt);
  await page.locator('[data-test="send-btn"]').click();
}
