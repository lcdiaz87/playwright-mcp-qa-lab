import type { Locator, Page } from '@playwright/test';

// Paso 2 del checkout: resumen con importes
export class CheckoutOverviewPage {
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;

  constructor(readonly page: Page) {
    // Los importes son "generic" en el snapshot, sin rol accesible
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });
  }

  async finish() {
    await this.finishButton.click();
  }
}
