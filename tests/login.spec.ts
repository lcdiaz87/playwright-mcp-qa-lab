import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, username: string, password: string) {
  if (username) await page.getByTestId('username').fill(username);
  if (password) await page.getByTestId('password').fill(password);
  await page.getByTestId('login-button').click();
}

test.describe('Login en saucedemo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('login correcto con standard_user', async ({ page }) => {
    await login(page, 'standard_user', 'secret_sauce');

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByTestId('title')).toHaveText('Products');
    await expect(page.getByTestId('error')).toHaveCount(0);
  });

  test('contraseña incorrecta', async ({ page }) => {
    await login(page, 'standard_user', 'wrong_password');

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('error')).toHaveText(
      'Epic sadface: Username and password do not match any user in this service',
    );
  });

  test('usuario y contraseña vacíos', async ({ page }) => {
    await login(page, '', '');

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('error')).toHaveText('Epic sadface: Username is required');
  });

  test('contraseña vacía', async ({ page }) => {
    await login(page, 'standard_user', '');

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('error')).toHaveText('Epic sadface: Password is required');
  });

  test('usuario bloqueado locked_out_user', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('error')).toHaveText(
      'Epic sadface: Sorry, this user has been locked out.',
    );
  });
});
