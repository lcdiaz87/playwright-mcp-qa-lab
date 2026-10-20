import type { Locator, Page } from '@playwright/test';

// Cabecera común a todas las páginas tras el login: menú lateral y carrito.
export class Header {
  readonly menuButton: Locator;
  readonly logoutLink: Locator;
  // El nombre accesible incluye la cantidad: "Cart, empty", "Cart, 2 items"
  readonly cartButton: Locator;
  readonly cartBadge: Locator;

  constructor(readonly page: Page) {
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByRole('button', { name: 'Logout' });
    this.cartButton = page.getByRole('button', { name: /^Cart, / });
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async openMenu() {
    await this.menuButton.click();
  }

  async logout() {
    await this.openMenu();
    await this.logoutLink.click();
  }

  async openCart() {
    await this.cartButton.click();
  }
}
