import { test, expect, type Page } from '@playwright/test';

// Todos los botones "Add to cart" se llaman igual, así que el producto se
// localiza por su tarjeta: la que contiene "View details for <nombre>".
function addToCartButton(page: Page, productName: string) {
  return page
    .getByTestId('inventory-item')
    .filter({ has: page.getByRole('button', { name: `View details for ${productName}` }) })
    .getByRole('button', { name: 'Add to cart' });
}

test('compra completa de dos productos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Username' }).fill('standard_user');
  await page.getByRole('textbox', { name: 'Password' }).fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();

  await addToCartButton(page, 'Sauce Labs Backpack').click();
  await addToCartButton(page, 'Sauce Labs Bike Light').click();
  await page.getByRole('button', { name: 'Cart, 2 items' }).click();

  await expect(page).toHaveURL(/cart\.html/);
  await expect(page.getByRole('button', { name: 'View details for Sauce Labs Backpack' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View details for Sauce Labs Bike Light' })).toBeVisible();
  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.getByRole('textbox', { name: 'First Name' }).fill('Luis');
  await page.getByRole('textbox', { name: 'Last Name' }).fill('Diaz');
  await page.getByRole('textbox', { name: 'Zip/Postal Code' }).fill('28001');
  await page.getByRole('button', { name: 'Continue' }).click();

  // 29.99 + 9.99 = 39.98; impuesto del 8 % = 3.20; total = 43.18
  await expect(page.getByTestId('subtotal-label')).toHaveText('Item total: $39.98');
  await expect(page.getByTestId('tax-label')).toHaveText('Tax: $3.20');
  await expect(page.getByTestId('total-label')).toHaveText('Total: $43.18');
  await page.getByRole('button', { name: 'Finish' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
});
