import { test, expect } from '@playwright/test';

test.describe('UI Audit - Screenshots', () => {

  test('1. HomePage - empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'screenshots/01-home-empty.png', fullPage: true });
  });

  test('2. HomePage - with sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });
    // Ждём загрузки разделов
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-home-with-sections.png', fullPage: true });
  });

  test('3. AddSectionModal - open', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    const addButton = page.locator('.bottom-action-btn');
    await addButton.click();

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/03-add-section-modal.png', fullPage: true });
  });

  test('4. SectionPage - inside section with breadcrumbs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // Кликаем на первый раздел если есть
    const sectionCard = page.locator('.section-card').first();
    if (await sectionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sectionCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/04-section-page.png', fullPage: true });
    }
  });

  test('5. Search - active', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // Переходим в раздел чтобы показать поиск
    const sectionCard = page.locator('.section-card').first();
    if (await sectionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sectionCard.click();
      await page.waitForTimeout(500);

      // Открываем поиск
      const searchIcon = page.locator('.header-search-icon');
      await searchIcon.click();

      const searchInput = page.locator('.header-search-input');
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/05-search-active.png', fullPage: true });
    }
  });

  test('6. AddItemModal - open', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });

    // Переходим в раздел
    const sectionCard = page.locator('.section-card').first();
    if (await sectionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sectionCard.click();
      await page.waitForTimeout(500);

      // Кликаем на кнопку "Элемент"
      const addItemButton = page.locator('.bottom-action-btn').last();
      if (await addItemButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addItemButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/06-add-item-modal.png', fullPage: true });
      }
    }
  });

  test('7. Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('.home-page')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/07-mobile-home.png', fullPage: true });

    // Открываем модал на мобилке
    const addButton = page.locator('.bottom-action-btn');
    await addButton.click();
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/08-mobile-modal.png', fullPage: true });
  });
});
