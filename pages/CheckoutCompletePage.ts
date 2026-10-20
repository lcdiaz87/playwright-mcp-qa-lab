import type { Locator, Page } from '@playwright/test';

export class CheckoutCompletePage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Thank you for your order!' });
  }
}
