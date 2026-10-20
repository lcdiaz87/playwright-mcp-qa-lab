import { test, expect } from '../pages/fixtures';

test.describe('Ordenar productos en el inventario', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAs('standard_user');
  });

  test('Price (low to high) muestra primero el producto más barato', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('Price (low to high)');

    await expect(inventoryPage.itemNames.first()).toHaveText('Sauce Labs Onesie');
    await expect(inventoryPage.itemPrices.first()).toHaveText('$7.99');

    const prices = await inventoryPage.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
