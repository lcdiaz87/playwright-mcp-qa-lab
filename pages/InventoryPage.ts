import type { Locator, Page } from '@playwright/test';

export class InventoryPage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemImages: Locator;
  readonly sortSelect: Locator;

  constructor(readonly page: Page) {
    // Nombre y precio no tienen rol en el snapshot de accesibilidad
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemImages = this.items.locator('img');
    this.sortSelect = page.getByRole('combobox', { name: 'Sort products' });
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  // Todos los botones "Add to cart" se llaman igual, así que el producto se
  // localiza por su tarjeta: la que contiene "View details for <nombre>".
  product(name: string) {
    return this.items.filter({ has: this.page.getByRole('button', { name: `View details for ${name}` }) });
  }

  async addToCart(name: string) {
    await this.product(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(name: string) {
    await this.product(name).getByRole('button', { name: 'Remove' }).click();
  }

  async sortBy(option: string) {
    await this.sortSelect.selectOption(option);
  }

  async prices() {
    return (await this.itemPrices.allTextContents()).map((price) => Number(price.replace('$', '')));
  }
}
