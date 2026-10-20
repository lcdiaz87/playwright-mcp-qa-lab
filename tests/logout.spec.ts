import { test, expect } from '@playwright/test';

const loggedOutError = "Epic sadface: You can only access '/inventory.html' when you are logged in.";

test.describe('Cerrar sesión', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill('standard_user');
    await page.getByRole('textbox', { name: 'Password' }).fill('secret_sauce');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/inventory\.html/);

    await page.getByRole('button', { name: 'Open Menu' }).click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('Logout borra la sesión', async ({ page }) => {
    await expect(page).toHaveURL('/');
    expect(await page.context().cookies()).toHaveLength(0);
  });

  test('el botón Atrás no devuelve al inventario', async ({ page }) => {
    await page.goBack();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('alert')).toHaveText(loggedOutError);
    await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  });

  test('abrir inventory.html directamente no muestra el inventario', async ({ page }) => {
    await page.goto('/inventory.html');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('alert')).toHaveText(loggedOutError);
    await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  });
});
