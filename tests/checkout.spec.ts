import { test, expect } from '../pages/fixtures';

test('compra completa de dos productos', async ({
  page,
  loginPage,
  header,
  inventoryPage,
  cartPage,
  checkoutInformationPage,
  checkoutOverviewPage,
  checkoutCompletePage,
}) => {
  await loginPage.loginAs('standard_user');

  await inventoryPage.addToCart('Sauce Labs Backpack');
  await inventoryPage.addToCart('Sauce Labs Bike Light');
  await expect(header.cartButton).toHaveAccessibleName('Cart, 2 items');
  await header.openCart();

  await expect(page).toHaveURL(/cart\.html/);
  await expect(cartPage.item('Sauce Labs Backpack')).toBeVisible();
  await expect(cartPage.item('Sauce Labs Bike Light')).toBeVisible();
  await cartPage.checkout();

  await checkoutInformationPage.fill('Luis', 'Diaz', '28001');
  await checkoutInformationPage.continue();

  // 29.99 + 9.99 = 39.98; impuesto del 8 % = 3.20; total = 43.18
  await expect(checkoutOverviewPage.subtotal).toHaveText('Item total: $39.98');
  await expect(checkoutOverviewPage.tax).toHaveText('Tax: $3.20');
  await expect(checkoutOverviewPage.total).toHaveText('Total: $43.18');
  await checkoutOverviewPage.finish();

  await expect(checkoutCompletePage.heading).toBeVisible();
  await expect(header.cartButton).toHaveAccessibleName('Cart, empty');
});
