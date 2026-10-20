import { test, expect } from '../pages/fixtures';

// problem_user es un usuario de saucedemo con bugs puestos a propósito.
// Explorándolo con Playwright MCP y comparándolo con standard_user, que
// funciona bien, aparecieron seis:
//
//   1. Imágenes: los 6 productos muestran la misma foto (sl-404.jpg).
//   2. Ordenación: elegir "Price (low to high)" no cambia nada; el primero
//      sigue siendo Sauce Labs Backpack en vez de Sauce Labs Onesie.
//   3. Add to cart: solo funciona en 3 productos. Bolt T-Shirt, Fleece
//      Jacket y T-Shirt (Red) no se añaden y el contador se queda en 3.
//   4. Remove: no quita el producto; el contador no baja.
//   5. Checkout: lo que se escribe en Last Name acaba en First Name, que
//      pierde su valor ("Luis" / "Diaz" queda como "Diaz" / vacío).
//   6. Por el bug 5, la compra no pasa del paso 1: "Last Name is required".
//
// Cómo se comprobó: con el navegador del MCP los resultados salieron
// erráticos (a veces ningún clic respondía, ni siquiera con standard_user),
// así que todo se repitió en navegadores limpios de Playwright. Ahí el
// comportamiento fue el mismo en cada ejecución, y es el que documentan
// estos tests.
//
// Cada test describe lo que debería pasar y se ejecuta con los dos usuarios.
// Con problem_user va marcado con test.fail(): si falla, cuenta como "fallo
// esperado" y la suite sigue en verde; si un día pasa, Playwright avisa de
// que el bug se ha corregido y hay que quitar la marca. Para comprobar que
// cada uno falla por su bug y no por un selector roto, se ejecutaron una vez
// sin la marca: fallan en su propia aserción con los valores de arriba.
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
