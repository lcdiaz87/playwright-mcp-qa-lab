import { test, expect } from '../pages/fixtures';

test.describe('Login en saucedemo (selectores por rol)', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('credenciales correctas', async ({ page, loginPage, header }) => {
    await loginPage.login('standard_user', 'secret_sauce');

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(header.menuButton).toBeVisible();
    await expect(loginPage.error).toHaveCount(0);
  });

  test('contraseña incorrecta', async ({ page, loginPage }) => {
    await loginPage.login('standard_user', 'wrong_password');

    await expect(page).toHaveURL('/');
    await expect(loginPage.error).toHaveText(
      'Epic sadface: Username and password do not match any user in this service',
    );
  });

  test('campos vacíos', async ({ page, loginPage }) => {
    await loginPage.login('', '');

    await expect(page).toHaveURL('/');
    await expect(loginPage.error).toHaveText('Epic sadface: Username is required');
  });

  test('contraseña vacía', async ({ page, loginPage }) => {
    await loginPage.login('standard_user', '');

    await expect(page).toHaveURL('/');
    await expect(loginPage.error).toHaveText('Epic sadface: Password is required');
  });

  test('usuario bloqueado locked_out_user', async ({ page, loginPage }) => {
    await loginPage.login('locked_out_user', 'secret_sauce');

    await expect(page).toHaveURL('/');
    await expect(loginPage.error).toHaveText(
      'Epic sadface: Sorry, this user has been locked out.',
    );
  });
});
