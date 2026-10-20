import { test, expect } from '../pages/fixtures';

// Mismo flujo con los dos usuarios: standard_user debe pasar todo y
// problem_user tiene bugs conocidos, marcados con test.fail() para que
// el informe los muestre como "fallo esperado" y avise si se arreglan.
const users = ['standard_user', 'problem_user'] as const;

const products = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
];

for (const user of users) {
  test.describe(`Inventario y checkout con ${user}`, () => {
    const knownBug = (description: string) => test.fail(user === 'problem_user', description);

    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAs(user);
    });

    test('cada producto muestra su propia imagen', async ({ inventoryPage }) => {
      knownBug('Bug: las 6 imágenes son la misma (sl-404)');

      const sources = await inventoryPage.itemImages.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
      expect(new Set(sources).size).toBe(products.length);
    });

    test('ordenar por Price (low to high)', async ({ inventoryPage }) => {
      knownBug('Bug: la ordenación no cambia y se queda en Name (A to Z)');

      await inventoryPage.sortBy('Price (low to high)');
      await expect(inventoryPage.itemNames.first()).toHaveText('Sauce Labs Onesie');
    });

    test('añadir los 6 productos al carrito', async ({ inventoryPage, header }) => {
      knownBug('Bug: Bolt T-Shirt, Fleece Jacket y T-Shirt (Red) no se añaden');

      for (const product of products) {
        await inventoryPage.addToCart(product);
      }
      await expect(header.cartBadge).toHaveText(String(products.length));
    });

    test('quitar un producto desde el inventario', async ({ inventoryPage, header }) => {
      knownBug('Bug: el botón Remove no hace nada');

      await inventoryPage.addToCart('Sauce Labs Backpack');
      await expect(header.cartBadge).toHaveText('1');

      await inventoryPage.removeFromCart('Sauce Labs Backpack');
      await expect(header.cartBadge).toHaveCount(0);
    });

    test('el formulario de checkout guarda cada campo', async ({ inventoryPage, header, cartPage, checkoutInformationPage }) => {
      knownBug('Bug: lo escrito en Last Name acaba en First Name');

      await inventoryPage.addToCart('Sauce Labs Backpack');
      await header.openCart();
      await cartPage.checkout();

      await checkoutInformationPage.fill('Luis', 'Diaz', '28001');

      await expect(checkoutInformationPage.firstName).toHaveValue('Luis');
      await expect(checkoutInformationPage.lastName).toHaveValue('Diaz');
      await expect(checkoutInformationPage.postalCode).toHaveValue('28001');
    });

    test('completar una compra', async ({
      page,
      inventoryPage,
      header,
      cartPage,
      checkoutInformationPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    }) => {
      knownBug('Bug: no se pasa del paso 1 del checkout (Last Name is required)');

      await inventoryPage.addToCart('Sauce Labs Backpack');
      await header.openCart();
      await cartPage.checkout();

      await checkoutInformationPage.fill('Luis', 'Diaz', '28001');
      await checkoutInformationPage.continue();

      await expect(page).toHaveURL(/checkout-step-two\.html/);
      await expect(checkoutOverviewPage.total).toHaveText('Total: $32.39');
      await checkoutOverviewPage.finish();

      await expect(checkoutCompletePage.heading).toBeVisible();
    });
  });
}
