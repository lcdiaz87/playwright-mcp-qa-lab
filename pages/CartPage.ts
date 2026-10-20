import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly checkoutButton: Locator;

  constructor(readonly page: Page) {
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  item(name: string) {
    return this.page.getByRole('button', { name: `View details for ${name}` });
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
