import type { Locator, Page } from '@playwright/test';

export const DEFAULT_PASSWORD = 'secret_sauce';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;

  constructor(readonly page: Page) {
    this.username = page.getByRole('textbox', { name: 'Username' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.error = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/');
  }

  // Un campo vacío no se rellena, para poder probar los mensajes de validación
  async login(username: string, password: string) {
    if (username) await this.username.fill(username);
    if (password) await this.password.fill(password);
    await this.loginButton.click();
  }

  async loginAs(username: string, password = DEFAULT_PASSWORD) {
    await this.goto();
    await this.login(username, password);
    await this.page.waitForURL(/inventory\.html/);
  }
}
