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

test.describe('CollapsedBreadcrumbs Component', () => {
  test('should show breadcrumbs in section page', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_breadcrumb_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Проверяем наличие breadcrumbs
      const breadcrumbs = page.locator('.collapsed-breadcrumbs');
      await expect(breadcrumbs).toBeVisible({ timeout: 5000 });
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should show home icon in breadcrumbs', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_home_icon_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Проверяем иконку домой
      const homeButton = page.locator('.breadcrumb-home');
      await expect(homeButton).toBeVisible({ timeout: 5000 });
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should navigate to home on home icon click', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_nav_home_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Кликаем на иконку домой
      const homeButton = page.locator('.breadcrumb-home');
      await homeButton.click();

      // Проверяем что вернулись на главную
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 5000 });
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should show current section name in breadcrumbs', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_current_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Проверяем что текущий раздел показан в breadcrumbs
      const currentItem = page.locator('.breadcrumb-current');
      await expect(currentItem).toBeVisible({ timeout: 5000 });

      // Проверяем что это не пустая строка
      const text = await currentItem.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should show collapsed view for deep hierarchy', async ({ page }) => {
    const token = await getAuthToken();
    const ids: number[] = [];

    try {
      // Создаём иерархию: Root > Parent > Child
      const parentId = await createSection(token, `__test_parent_${Date.now()}`);
      ids.push(parentId);

      const childId = await createSection(token, `__test_child_${Date.now()}`, parentId);
      ids.push(childId);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      // Переходим в parent
      const parentCard = page.locator('.section-card').first();
      await expect(parentCard).toBeVisible({ timeout: 10000 });
      await parentCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Переходим в child
      const childCard = page.locator('.section-card').first();
      await expect(childCard).toBeVisible({ timeout: 10000 });
      await childCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Проверяем collapsed кнопку [...]
      const collapsedButton = page.locator('.breadcrumb-collapsed');
      await expect(collapsedButton).toBeVisible({ timeout: 5000 });
      await expect(collapsedButton).toHaveText('•••');
    } finally {
      // Cleanup в обратном порядке
      for (const id of ids.reverse()) {
        await deleteSection(token, id);
      }
    }
  });
});
