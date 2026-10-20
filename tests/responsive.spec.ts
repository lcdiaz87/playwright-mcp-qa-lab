import { test, expect } from '../pages/fixtures';

const viewports = [
  { name: 'móvil', width: 375, height: 667, columns: 1 },
  { name: 'escritorio', width: 1280, height: 800, columns: 2 },
];

for (const viewport of viewports) {
  test.describe(`Inventario en ${viewport.name} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAs('standard_user');
    });

    test('no hay scroll horizontal', async ({ page }) => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test(`los productos se muestran en ${viewport.columns} columna(s)`, async ({ inventoryPage }) => {
      const lefts = await inventoryPage.items.evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().left)),
      );
      expect(new Set(lefts).size).toBe(viewport.columns);
    });

    test('el menú se abre y muestra Logout', async ({ header }) => {
      await header.openMenu();
      await expect(header.logoutLink).toBeVisible();
    });

    test('se puede ordenar y añadir al carrito', async ({ inventoryPage, header }) => {
      await inventoryPage.sortBy('Price (low to high)');
      await expect(inventoryPage.itemNames.first()).toHaveText('Sauce Labs Onesie');

      await inventoryPage.addToCart('Sauce Labs Onesie');
      await expect(header.cartBadge).toHaveText('1');
    });
  });
}
