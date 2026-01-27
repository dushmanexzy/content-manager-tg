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

async function createSection(token: string, title: string, parentId: number | null = null): Promise<number> {
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${API_URL}/api/sections`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, parentId },
  });
  const data = await response.json();
  await apiContext.dispose();
  return data.id;
}

async function deleteSection(token: string, id: number): Promise<void> {
  const apiContext = await request.newContext();
  await apiContext.delete(`${API_URL}/api/sections/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await apiContext.dispose();
}

test.describe('BottomActions Component', () => {
  test('should show single button on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // Проверяем контейнер кнопок
    const bottomActions = page.locator('.bottom-actions');
    await expect(bottomActions).toBeVisible({ timeout: 5000 });

    // Проверяем одну кнопку для добавления раздела
    const buttons = page.locator('.bottom-action-btn');
    await expect(buttons).toHaveCount(1);

    const addButton = buttons.first();
    await expect(addButton).toContainText('Добавить раздел');
  });

  test('should show two buttons in section page', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_two_buttons_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Проверяем две кнопки
      const buttons = page.locator('.bottom-action-btn');
      await expect(buttons).toHaveCount(2);

      // Проверяем текст кнопок
      const sectionButton = buttons.first();
      await expect(sectionButton).toContainText('Раздел');

      const itemButton = buttons.last();
      await expect(itemButton).toContainText('Элемент');
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should open add section modal on home page button click', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const addButton = page.locator('.bottom-action-btn').first();
    await addButton.click();

    // Проверяем что модал открылся
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should open add section modal on section page button click', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_modal_section_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Кликаем на кнопку "Раздел"
      const sectionButton = page.locator('.bottom-action-btn').first();
      await sectionButton.click();

      // Проверяем что модал открылся
      const modal = page.locator('.modal-overlay');
      await expect(modal).toBeVisible({ timeout: 5000 });
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should open add item modal on item button click', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_modal_item_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Кликаем на кнопку "Элемент"
      const itemButton = page.locator('.bottom-action-btn').last();
      await itemButton.click();

      // Проверяем что модал открылся (модал для добавления item)
      const modal = page.locator('.modal-overlay');
      await expect(modal).toBeVisible({ timeout: 5000 });
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should have proper styling and be fixed at bottom', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const bottomActions = page.locator('.bottom-actions');
    await expect(bottomActions).toBeVisible({ timeout: 5000 });

    // Проверяем что контейнер зафиксирован внизу
    const position = await bottomActions.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        bottom: styles.bottom,
        left: styles.left,
        right: styles.right,
      };
    });

    expect(position.position).toBe('fixed');
    expect(position.bottom).toBe('0px');
    expect(position.left).toBe('0px');
    expect(position.right).toBe('0px');
  });

  test('should show icons in buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const addButton = page.locator('.bottom-action-btn').first();

    // Проверяем наличие SVG иконки
    const icon = addButton.locator('svg');
    await expect(icon).toBeVisible();
  });
});
