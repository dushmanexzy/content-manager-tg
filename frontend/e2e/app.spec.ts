import { test, expect, request } from '@playwright/test';

const API_URL = 'http://localhost:3000';

// Хелпер для получения токена и очистки данных
async function getAuthToken(): Promise<string> {
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${API_URL}/auth/telegram`, {
    data: { initData: 'mock_dev_mode' },
  });
  const data = await response.json();
  await apiContext.dispose();
  return data.accessToken;
}

async function deleteSection(token: string, id: number): Promise<void> {
  const apiContext = await request.newContext();
  await apiContext.delete(`${API_URL}/api/sections/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await apiContext.dispose();
}

async function getAllSections(token: string): Promise<{ id: number; title: string }[]> {
  const apiContext = await request.newContext();
  const response = await apiContext.get(`${API_URL}/api/sections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  await apiContext.dispose();
  return data;
}

test.describe('Telegram Mini App UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display loading state initially', async ({ page }) => {
    await expect(page.locator('.app')).toBeVisible({ timeout: 10000 });
  });

  test('should show home page with sections title after auth', async ({ page }) => {
    await expect(page.locator('h1.home-title')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1.home-title')).toHaveText('Разделы');
  });

  test('should NOT show search on home page', async ({ page }) => {
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });
    // На главной странице поиск не показывается
    const searchIcon = page.locator('.header-search-icon');
    await expect(searchIcon).not.toBeVisible();
  });

  test('should show empty state or section list', async ({ page }) => {
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const emptyState = page.locator('.home-empty');
    const sectionList = page.locator('.section-list');

    const hasContent = await Promise.race([
      emptyState.isVisible().then(() => 'empty'),
      sectionList.isVisible().then(() => 'list'),
      new Promise(resolve => setTimeout(() => resolve('timeout'), 5000))
    ]);

    expect(['empty', 'list']).toContain(hasContent);
  });

  test('should show add button for creating sections', async ({ page }) => {
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // Проверяем кнопку создания раздела внизу страницы (новый BottomActions)
    const addButton = page.locator('.bottom-action-btn');
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await expect(addButton).toContainText('Добавить раздел');
  });

  test('should open add section modal on add button click', async ({ page }) => {
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const addButton = page.locator('.bottom-action-btn');
    await addButton.click();

    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should have correct theme class applied', async ({ page }) => {
    await expect(page.locator('.app')).toBeVisible({ timeout: 15000 });

    const app = page.locator('.app');
    const hasThemeClass = await app.evaluate((el) => {
      return el.classList.contains('light') || el.classList.contains('dark');
    });

    expect(hasThemeClass).toBe(true);
  });
});

test.describe('Section creation flow', () => {
  const testSectionTitle = `__test_section_${Date.now()}`;
  let createdSectionId: number | null = null;

  test.afterEach(async () => {
    // Cleanup: удаляем созданный раздел
    if (createdSectionId) {
      try {
        const token = await getAuthToken();
        await deleteSection(token, createdSectionId);
      } catch (e) {
        console.log('Cleanup failed:', e);
      }
      createdSectionId = null;
    }
  });

  test('should create a new section successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // Запоминаем существующие разделы до создания
    const token = await getAuthToken();
    const sectionsBefore = await getAllSections(token);
    const idsBefore = new Set(sectionsBefore.map(s => s.id));

    // Открываем модал
    const addButton = page.locator('.bottom-action-btn');
    await addButton.click();

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });

    // Заполняем форму с уникальным названием
    const titleInput = page.locator('.modal-content input#title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(testSectionTitle);

    // Отправляем форму
    await titleInput.press('Enter');

    // Проверяем что модал закрылся
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });

    // Находим созданный раздел для cleanup
    const sectionsAfter = await getAllSections(token);
    const newSection = sectionsAfter.find(s => !idsBefore.has(s.id));
    if (newSection) {
      createdSectionId = newSection.id;
    }
  });
});
