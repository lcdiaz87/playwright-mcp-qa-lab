import { test as base, expect } from '@playwright/test';
import { CartPage } from './CartPage';
import { CheckoutCompletePage } from './CheckoutCompletePage';
import { CheckoutInformationPage } from './CheckoutInformationPage';
import { CheckoutOverviewPage } from './CheckoutOverviewPage';
import { Header } from './Header';
import { InventoryPage } from './InventoryPage';
import { LoginPage } from './LoginPage';

type Pages = {
  header: Header;
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInformationPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
};

// Cada test recibe los page objects que pide como fixtures, ya creados
// sobre su `page`.
export const test = base.extend<Pages>({
  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutInformationPage: async ({ page }, use) => use(new CheckoutInformationPage(page)),
  checkoutOverviewPage: async ({ page }, use) => use(new CheckoutOverviewPage(page)),
  checkoutCompletePage: async ({ page }, use) => use(new CheckoutCompletePage(page)),
});

export { expect };
