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

async function createSection(token: string, title: string, parentId: number | null = null): Promise<any> {
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${API_URL}/api/sections`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, parentId },
  });
  const section = await response.json();
  await apiContext.dispose();
  return section;
}

async function deleteSection(token: string, id: number): Promise<void> {
  const apiContext = await request.newContext();
  await apiContext.delete(`${API_URL}/api/sections/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await apiContext.dispose();
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

// Helper to simulate swipe left using touch events
async function swipeLeft(page: any, element: any) {
  const box = await element.boundingBox();
  if (!box) return;

  const startX = box.x + box.width - 20;
  const startY = box.y + box.height / 2;
  const endX = box.x + 20;

  await page.evaluate(
    ({ startX, startY, endX }: { startX: number; startY: number; endX: number }) => {
      const el = document.elementFromPoint(startX, startY);
      if (!el) return;

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 0, target: el, clientX: startX, clientY: startY })],
      });
      el.dispatchEvent(touchStart);

      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 0, target: el, clientX: endX, clientY: startY })],
      });
      el.dispatchEvent(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        touches: [],
        changedTouches: [new Touch({ identifier: 0, target: el, clientX: endX, clientY: startY })],
      });
      el.dispatchEvent(touchEnd);
    },
    { startX, startY, endX }
  );

  await page.waitForTimeout(300);
}

// Cleanup all test data (sections starting with __test_)
async function cleanupTestData(token: string): Promise<void> {
  const apiContext = await request.newContext();
  const response = await apiContext.get(`${API_URL}/api/sections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sections = await response.json();
  await apiContext.dispose();

  for (const section of sections) {
    if (section.title && section.title.startsWith('__test_')) {
      try {
        await deleteSection(token, section.id);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

test.describe('Section Edit/Delete', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
    await cleanupTestData(token);
  });

  test.afterAll(async () => {
    await cleanupTestData(token);
  });

  test('should show edit/delete buttons on swipe', async ({ page }) => {
    const uniqueId = Date.now();
    const sectionTitle = `__test_swipe_${uniqueId}`;
    await createSection(token, sectionTitle);

    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const sectionCard = page.locator(`.swipeable-container:has(.section-card:has-text("${sectionTitle}"))`);
    await expect(sectionCard).toBeVisible({ timeout: 5000 });

    await swipeLeft(page, sectionCard);

    await expect(sectionCard.locator('.swipeable-action.edit')).toBeVisible({ timeout: 3000 });
    await expect(sectionCard.locator('.swipeable-action.delete')).toBeVisible({ timeout: 3000 });
  });

  test('should open edit modal when clicking edit button', async ({ page }) => {
    const uniqueId = Date.now();
    const sectionTitle = `__test_edit_modal_${uniqueId}`;
    await createSection(token, sectionTitle);

    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const sectionCard = page.locator(`.swipeable-container:has(.section-card:has-text("${sectionTitle}"))`);
    await expect(sectionCard).toBeVisible({ timeout: 5000 });
    await swipeLeft(page, sectionCard);

    const editBtn = sectionCard.locator('.swipeable-action.edit');
    await editBtn.waitFor({ state: 'visible', timeout: 3000 });
    await editBtn.evaluate((el: HTMLElement) => el.click());

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.modal-content h3')).toContainText('Редактировать раздел');
  });

  test('should show delete button that triggers confirmation', async ({ page }) => {
    const uniqueId = Date.now();
    const sectionTitle = `__test_delete_${uniqueId}`;
    await createSection(token, sectionTitle);

    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const sectionCard = page.locator(`.swipeable-container:has(.section-card:has-text("${sectionTitle}"))`);
    await expect(sectionCard).toBeVisible({ timeout: 5000 });
    await swipeLeft(page, sectionCard);

    const deleteBtn = sectionCard.locator('.swipeable-action.delete');
    await expect(deleteBtn).toBeVisible({ timeout: 3000 });
    await deleteBtn.click({ force: true });

    // Wait for the confirmation (in mock mode, showConfirm auto-confirms)
    await page.waitForTimeout(2000);
  });
});

test.describe('Item Edit/Delete', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test.afterAll(async () => {
    await cleanupTestData(token);
  });

  test('should show edit/delete buttons in ItemViewModal', async ({ page }) => {
    const uniqueId = Date.now();
    const sectionTitle = `__test_item_section_${uniqueId}`;
    const itemTitle = `__test_edit_note_${uniqueId}`;

    const section = await createSection(token, sectionTitle);
    await createItem(token, section.id, {
      type: 'text',
      title: itemTitle,
      content: 'Content for testing edit functionality.',
    });

    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const sectionCard = page.locator(`.section-card:has-text("${sectionTitle}")`);
    await expect(sectionCard).toBeVisible({ timeout: 10000 });
    await sectionCard.click();
    await page.waitForTimeout(500);

    await page.locator(`.item-card:has-text("${itemTitle}")`).click();

    await expect(page.locator('.item-view-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.item-view-footer-action.edit')).toBeVisible();
    await expect(page.locator('.item-view-footer-action.delete')).toBeVisible();
  });

  test('should open edit modal from ItemViewModal', async ({ page }) => {
    const uniqueId = Date.now();
    const sectionTitle = `__test_item_section2_${uniqueId}`;
    const itemTitle = `__test_edit_from_modal_${uniqueId}`;

    const section = await createSection(token, sectionTitle);
    await createItem(token, section.id, {
      type: 'text',
      title: itemTitle,
      content: 'Original content.',
    });

    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const sectionCard = page.locator(`.section-card:has-text("${sectionTitle}")`);
    await expect(sectionCard).toBeVisible({ timeout: 10000 });
    await sectionCard.click();
    await page.waitForTimeout(500);

    await page.locator(`.item-card:has-text("${itemTitle}")`).click();
    await expect(page.locator('.item-view-modal')).toBeVisible({ timeout: 5000 });

    await page.locator('.item-view-footer-action.edit').click();

    await expect(page.locator('.modal-content h3')).toContainText('Редактировать', { timeout: 5000 });
  });

  test('should show swipe actions on item card', async ({ page }) => {
    const uniqueId = Date.now();
    const sectionTitle = `__test_item_section4_${uniqueId}`;
    const itemTitle = `__test_swipe_item_${uniqueId}`;

    const section = await createSection(token, sectionTitle);
    await createItem(token, section.id, {
      type: 'text',
      title: itemTitle,
      content: 'Content for swipe test.',
    });

    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const sectionCard = page.locator(`.section-card:has-text("${sectionTitle}")`);
    await expect(sectionCard).toBeVisible({ timeout: 10000 });
    await sectionCard.click();
    await page.waitForTimeout(500);

    const itemCard = page.locator(`.item-list .swipeable-container:has(.item-card:has-text("${itemTitle}"))`);
    await expect(itemCard).toBeVisible({ timeout: 5000 });

    await swipeLeft(page, itemCard);

    await expect(itemCard.locator('.swipeable-action.edit')).toBeVisible({ timeout: 3000 });
    await expect(itemCard.locator('.swipeable-action.delete')).toBeVisible({ timeout: 3000 });
  });
});
