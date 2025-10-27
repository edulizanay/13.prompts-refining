/**
 * E2E Test: Prompts CRUD with Persistence
 *
 * Tests the complete prompt creation and editing workflow with Supabase backend.
 *
 * Prerequisites:
 * - Supabase migrations applied
 * - Test user created and logged in
 * - App running on localhost:3000
 *
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

test.describe('Prompts CRUD with Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // TODO: Add login step once auth is set up
    // For now, assumes user is already logged in via cookies
  });

  test('should create a new prompt and persist after reload', async ({ page }) => {
    // Click "New Prompt" button
    await page.click('button[aria-label="Prompt menu"]');
    await page.click('text=New Prompt');

    // Fill in prompt details
    await page.fill('input[placeholder="Prompt name"]', 'Test E2E Prompt');
    await page.selectOption('select', { label: 'Generator' });
    await page.click('text=Create');

    // Verify prompt was created
    await expect(page.locator('h2:has-text("Test E2E Prompt")')).toBeVisible();

    // Edit the prompt text
    const editor = page.locator('.cm-content'); // CodeMirror editor
    await editor.fill('This is a test prompt for E2E testing.');

    // Blur the editor to trigger autosave
    await editor.blur();

    // Wait for save (check console logs or network requests)
    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload();

    // Verify the prompt still exists
    await page.click('button[aria-label="Prompt menu"]');
    await expect(page.locator('text=Test E2E Prompt')).toBeVisible();

    // Click on the prompt to load it
    await page.click('text=Test E2E Prompt');

    // Verify the text was saved
    await expect(editor).toHaveText('This is a test prompt for E2E testing.');
  });

  test('should rename a prompt', async ({ page }) => {
    // Find an existing prompt or create one
    const promptTitle = page.locator('h2').first();
    await promptTitle.click();

    // Edit the name
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Renamed Prompt');
    await nameInput.press('Enter');

    // Verify name changed
    await expect(page.locator('h2:has-text("Renamed Prompt")')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('h2:has-text("Renamed Prompt")')).toBeVisible();
  });

  test('should switch between prompts without losing changes', async ({ page }) => {
    // Create first prompt
    await page.click('button[aria-label="Prompt menu"]');
    await page.click('text=New Prompt');
    await page.fill('input[placeholder="Prompt name"]', 'First Prompt');
    await page.click('text=Create');

    const editor = page.locator('.cm-content');
    await editor.fill('First prompt text');
    await editor.blur();
    await page.waitForTimeout(500);

    // Create second prompt
    await page.click('button[aria-label="Prompt menu"]');
    await page.click('text=New Prompt');
    await page.fill('input[placeholder="Prompt name"]', 'Second Prompt');
    await page.click('text=Create');

    await editor.fill('Second prompt text');
    await editor.blur();
    await page.waitForTimeout(500);

    // Switch back to first prompt
    await page.click('button[aria-label="Prompt menu"]');
    await page.click('text=First Prompt');

    // Verify first prompt text is still there
    await expect(editor).toHaveText('First prompt text');

    // Switch to second prompt
    await page.click('button[aria-label="Prompt menu"]');
    await page.click('text=Second Prompt');

    // Verify second prompt text is still there
    await expect(editor).toHaveText('Second prompt text');
  });
});

/**
 * TODO: Add these tests once fully implemented
 *
 * - Test RLS (user can only see their own prompts)
 * - Test concurrent editing (optimistic locking)
 * - Test error handling (network failures, validation errors)
 * - Test cleanup (delete test prompts after tests)
 */
