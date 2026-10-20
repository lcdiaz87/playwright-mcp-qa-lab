import { test, expect, type Page } from '@playwright/test';

const viewports = [
  { name: 'móvil', width: 375, height: 667, columns: 1 },
  { name: 'escritorio', width: 1280, height: 800, columns: 2 },
];

async function login(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Username' }).fill('standard_user');
  await page.getByRole('textbox', { name: 'Password' }).fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/inventory\.html/);
}

for (const viewport of viewports) {
  test.describe(`Inventario en ${viewport.name} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('no hay scroll horizontal', async ({ page }) => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test(`los productos se muestran en ${viewport.columns} columna(s)`, async ({ page }) => {
      const lefts = await page
        .getByTestId('inventory-item')
        .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().left)));
      expect(new Set(lefts).size).toBe(viewport.columns);
    });

    test('el menú se abre y muestra Logout', async ({ page }) => {
      await page.getByRole('button', { name: 'Open Menu' }).click();
      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    });

    test('se puede ordenar y añadir al carrito', async ({ page }) => {
      await page.getByRole('combobox', { name: 'Sort products' }).selectOption('Price (low to high)');
      await expect(page.getByTestId('inventory-item-name').first()).toHaveText('Sauce Labs Onesie');

      await page.getByTestId('add-to-cart-sauce-labs-onesie').click();
      await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
    });
  });
}
