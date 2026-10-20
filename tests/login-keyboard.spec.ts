import { test, expect } from '../pages/fixtures';

// Login sin ratón: el foco se mueve solo con Tab y el texto se escribe
// con el teclado, como lo haría alguien que no puede usar el ratón.
test.describe('Login solo con teclado', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('Tab recorre usuario y contraseña, y Enter envía el formulario', async ({ page, loginPage }) => {
    await page.keyboard.press('Tab');
    await expect(loginPage.username).toBeFocused();
    await page.keyboard.type('standard_user');

    await page.keyboard.press('Tab');
    await expect(loginPage.password).toBeFocused();
    await page.keyboard.type('secret_sauce');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('Tab llega al botón Login y se activa con el teclado', async ({ page, loginPage }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.type('standard_user');
    await page.keyboard.press('Tab');
    await page.keyboard.type('secret_sauce');

    await page.keyboard.press('Tab');
    await expect(loginPage.loginButton).toBeFocused();

    await page.keyboard.press('Space');
    await expect(page).toHaveURL(/inventory\.html/);
  });
});
