import { test, expect, type Page } from '@playwright/test';

// Mismo flujo con los dos usuarios: standard_user debe pasar todo y
// problem_user tiene bugs conocidos, marcados con test.fail() para que
// el informe los muestre como "fallo esperado" y avise si se arreglan.
const users = ['standard_user', 'problem_user'] as const;

const products = [
  'sauce-labs-backpack',
  'sauce-labs-bike-light',
  'sauce-labs-bolt-t-shirt',
  'sauce-labs-fleece-jacket',
  'sauce-labs-onesie',
  'test.allthethings()-t-shirt-(red)',
];

async function login(page: Page, username: string) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/inventory\.html/);
}

for (const user of users) {
  test.describe(`Inventario y checkout con ${user}`, () => {
    const knownBug = (description: string) => test.fail(user === 'problem_user', description);

    test.beforeEach(async ({ page }) => {
      await login(page, user);
    });

    test('cada producto muestra su propia imagen', async ({ page }) => {
      knownBug('Bug: las 6 imágenes son la misma (sl-404)');

      const sources = await page
        .locator('[data-test="inventory-item"] img')
        .evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
      expect(new Set(sources).size).toBe(products.length);
    });

    test('ordenar por Price (low to high)', async ({ page }) => {
      knownBug('Bug: la ordenación no cambia y se queda en Name (A to Z)');

      await page.getByRole('combobox', { name: 'Sort products' }).selectOption('Price (low to high)');
      await expect(page.getByTestId('inventory-item-name').first()).toHaveText('Sauce Labs Onesie');
    });

    test('añadir los 6 productos al carrito', async ({ page }) => {
      knownBug('Bug: Bolt T-Shirt, Fleece Jacket y T-Shirt (Red) no se añaden');

      for (const id of products) {
        await page.getByTestId(`add-to-cart-${id}`).click();
      }
      await expect(page.getByTestId('shopping-cart-badge')).toHaveText(String(products.length));
    });

    test('quitar un producto desde el inventario', async ({ page }) => {
      knownBug('Bug: el botón Remove no hace nada');

      await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
      await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');

      await page.getByTestId('remove-sauce-labs-backpack').click();
      await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
    });

    test('el formulario de checkout guarda cada campo', async ({ page }) => {
      knownBug('Bug: lo escrito en Last Name acaba en First Name');

      await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
      await page.getByTestId('shopping-cart-link').click();
      await page.getByRole('button', { name: 'Checkout' }).click();

      await page.getByTestId('firstName').fill('Luis');
      await page.getByTestId('lastName').fill('Diaz');
      await page.getByTestId('postalCode').fill('28001');

      await expect(page.getByTestId('firstName')).toHaveValue('Luis');
      await expect(page.getByTestId('lastName')).toHaveValue('Diaz');
      await expect(page.getByTestId('postalCode')).toHaveValue('28001');
    });

    test('completar una compra', async ({ page }) => {
      knownBug('Bug: no se pasa del paso 1 del checkout (Last Name is required)');

      await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
      await page.getByTestId('shopping-cart-link').click();
      await page.getByRole('button', { name: 'Checkout' }).click();

      await page.getByTestId('firstName').fill('Luis');
      await page.getByTestId('lastName').fill('Diaz');
      await page.getByTestId('postalCode').fill('28001');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(/checkout-step-two\.html/);
      await expect(page.getByTestId('total-label')).toHaveText('Total: $32.39');
      await page.getByRole('button', { name: 'Finish' }).click();

      await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
    });
  });
}
