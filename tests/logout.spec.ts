import { test, expect } from '../pages/fixtures';

const loggedOutError = "Epic sadface: You can only access '/inventory.html' when you are logged in.";

test.describe('Cerrar sesión', () => {
  test.beforeEach(async ({ loginPage, header }) => {
    await loginPage.loginAs('standard_user');
    await header.logout();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('Logout borra la sesión', async ({ page }) => {
    await expect(page).toHaveURL('/');
    expect(await page.context().cookies()).toHaveLength(0);
  });

  test('el botón Atrás no devuelve al inventario', async ({ page, loginPage, inventoryPage }) => {
    await page.goBack();

    await expect(page).toHaveURL('/');
    await expect(loginPage.error).toHaveText(loggedOutError);
    await expect(inventoryPage.items).toHaveCount(0);
  });

  test('abrir inventory.html directamente no muestra el inventario', async ({ page, loginPage, inventoryPage }) => {
    await inventoryPage.goto();

    await expect(page).toHaveURL('/');
    await expect(loginPage.error).toHaveText(loggedOutError);
    await expect(inventoryPage.items).toHaveCount(0);
  });
});
