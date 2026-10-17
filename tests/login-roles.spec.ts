import { test, expect, type Page } from '@playwright/test';

// Selectores tomados del snapshot de accesibilidad del MCP:
//   textbox "Username", textbox "Password", button "Login",
//   alert (mensaje de error) y, ya dentro, button "Open Menu".
async function login(page: Page, username: string, password: string) {
  if (username) await page.getByRole('textbox', { name: 'Username' }).fill(username);
  if (password) await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

test.describe('Login en saucedemo (selectores por rol)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('credenciales correctas', async ({ page }) => {
    await login(page, 'standard_user', 'secret_sauce');

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByRole('button', { name: 'Open Menu' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('contraseña incorrecta', async ({ page }) => {
    await login(page, 'standard_user', 'wrong_password');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('alert')).toHaveText(
      'Epic sadface: Username and password do not match any user in this service',
    );
  });

  test('campos vacíos', async ({ page }) => {
    await login(page, '', '');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('alert')).toHaveText('Epic sadface: Username is required');
  });

  test('contraseña vacía', async ({ page }) => {
    await login(page, 'standard_user', '');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('alert')).toHaveText('Epic sadface: Password is required');
  });

  test('usuario bloqueado locked_out_user', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('alert')).toHaveText(
      'Epic sadface: Sorry, this user has been locked out.',
    );
  });
});
