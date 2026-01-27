import { test, expect, request } from '@playwright/test';

const API_URL = 'http://localhost:3000';

async function getAuthToken(): Promise<string> {
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${API_URL}/auth/telegram`, {
    data: { initData: 'mock_dev_mode' },
  });
  const data = await response.json();
  await apiContext.dispose();
  return data.accessToken;
}

async function createItem(token: string, sectionId: number, data: any): Promise<any> {
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${API_URL}/api/sections/${sectionId}/items`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  const item = await response.json();
  await apiContext.dispose();
  return item;
}

async function deleteItem(token: string, itemId: number): Promise<void> {
  const apiContext = await request.newContext();
  await apiContext.delete(`${API_URL}/api/items/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await apiContext.dispose();
}

async function getSections(token: string): Promise<any[]> {
  const apiContext = await request.newContext();
  const response = await apiContext.get(`${API_URL}/api/sections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  await apiContext.dispose();
  return data;
}

test.describe('Item View Modal', () => {
  let token: string;
  let sectionId: number;
  let createdItemIds: number[] = [];

  test.beforeAll(async () => {
    token = await getAuthToken();
    const sections = await getSections(token);
    if (sections.length > 0) {
      sectionId = sections[0].id;
    }
  });

  test.afterAll(async () => {
    // Cleanup created items
    for (const itemId of createdItemIds) {
      try {
        await deleteItem(token, itemId);
      } catch (e) {
        console.log('Cleanup item failed:', e);
      }
    }
  });

  test('should open text item in modal', async ({ page }) => {
    // Create text item
    const item = await createItem(token, sectionId, {
      type: 'text',
      title: 'Test Note',
      content: 'This is a test note content for viewing.',
    });
    createdItemIds.push(item.id);

    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // Navigate to section
    await page.locator('.section-card').first().click();
    await page.waitForTimeout(500);

    // Click on specific item we just created
    await page.locator('.item-card:has-text("Test Note")').click();

    // Check modal is visible
    await expect(page.locator('.item-view-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.item-view-modal')).toContainText('Test Note');
    await expect(page.locator('.item-view-modal')).toContainText('This is a test note');

    await page.screenshot({ path: 'screenshots/item-view-text.png', fullPage: true });

    // Close modal
    await page.locator('.modal-close').click();
    await expect(page.locator('.item-view-modal')).not.toBeVisible();
  });

  test('should open link item in modal', async ({ page }) => {
    // Create link item
    const item = await createItem(token, sectionId, {
      type: 'link',
      title: 'Test Link',
      content: 'https://example.com/test-page',
    });
    createdItemIds.push(item.id);

    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // Navigate to section
    await page.locator('.section-card').first().click();
    await page.waitForTimeout(500);

    // Click on link item
    await page.locator('.item-card:has-text("Test Link")').click();

    // Check modal is visible
    await expect(page.locator('.item-view-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.item-view-modal')).toContainText('example.com');
    await expect(page.locator('.item-view-action.primary')).toContainText('Открыть ссылку');

    await page.screenshot({ path: 'screenshots/item-view-link.png', fullPage: true });
  });
});
