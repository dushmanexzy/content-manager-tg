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

test.describe('Header Component', () => {
  test('should NOT show search on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // На главной странице поиск не должен быть виден
    const searchIcon = page.locator('.header-search-icon');
    await expect(searchIcon).not.toBeVisible();
  });

  test('should show search icon in section page', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      // Создаём раздел
      sectionId = await createSection(token, `__test_header_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      // Ждём появления раздела и кликаем на него
      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      // Ждём загрузки страницы раздела
      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Проверяем наличие иконки поиска
      const searchIcon = page.locator('.header-search-icon');
      await expect(searchIcon).toBeVisible({ timeout: 5000 });
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should expand search on icon click', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_expand_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Кликаем на иконку поиска
      const searchIcon = page.locator('.header-search-icon');
      await expect(searchIcon).toBeVisible({ timeout: 5000 });
      await searchIcon.click();

      // Проверяем что input появился
      const searchInput = page.locator('.header-search-input');
      await expect(searchInput).toBeVisible({ timeout: 2000 });

      // Проверяем что input в фокусе (автофокус)
      await expect(searchInput).toBeFocused();

      // Проверяем что иконка закрытия появилась
      const closeButton = page.locator('.header-search-close');
      await expect(closeButton).toBeVisible();
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should close search on close button click', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_close_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Открываем поиск
      const searchIcon = page.locator('.header-search-icon');
      await searchIcon.click();

      const searchInput = page.locator('.header-search-input');
      await expect(searchInput).toBeVisible({ timeout: 2000 });

      // Вводим текст
      await searchInput.fill('test query');
      await expect(searchInput).toHaveValue('test query');

      // Закрываем поиск
      const closeButton = page.locator('.header-search-close');
      await closeButton.click();

      // Проверяем что input исчез
      await expect(searchInput).not.toBeVisible({ timeout: 2000 });

      // Проверяем что иконка поиска вернулась
      await expect(searchIcon).toBeVisible();
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });

  test('should hide breadcrumbs when search is expanded', async ({ page }) => {
    const token = await getAuthToken();
    let sectionId: number | null = null;

    try {
      sectionId = await createSection(token, `__test_breadcrumbs_${Date.now()}`);

      await page.goto('/');
      await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

      const sectionCard = page.locator('.section-card').first();
      await expect(sectionCard).toBeVisible({ timeout: 10000 });
      await sectionCard.click();

      await expect(page.locator('.section-page')).toBeVisible({ timeout: 10000 });

      // Проверяем что breadcrumbs видны
      const breadcrumbs = page.locator('.collapsed-breadcrumbs');
      await expect(breadcrumbs).toBeVisible({ timeout: 5000 });

      // Открываем поиск
      const searchIcon = page.locator('.header-search-icon');
      await searchIcon.click();

      // Проверяем что контейнер breadcrumbs получил класс hidden
      const breadcrumbsContainer = page.locator('.header-breadcrumbs');
      await expect(breadcrumbsContainer).toHaveClass(/hidden/, { timeout: 2000 });
    } finally {
      if (sectionId) {
        await deleteSection(token, sectionId);
      }
    }
  });
});
