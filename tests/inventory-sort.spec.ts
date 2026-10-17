import { test, expect } from '@playwright/test';

test.describe('Ordenar productos en el inventario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill('standard_user');
    await page.getByRole('textbox', { name: 'Password' }).fill('secret_sauce');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('Price (low to high) muestra primero el producto más barato', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Sort products' }).selectOption('Price (low to high)');

    // Nombre y precio no tienen rol en el snapshot (son generic), por eso van por data-test
    await expect(page.getByTestId('inventory-item-name').first()).toHaveText('Sauce Labs Onesie');
    await expect(page.getByTestId('inventory-item-price').first()).toHaveText('$7.99');

    const prices = (await page.getByTestId('inventory-item-price').allTextContents())
      .map((price) => Number(price.replace('$', '')));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
