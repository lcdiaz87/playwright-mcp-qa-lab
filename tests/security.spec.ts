import { test, expect } from '@playwright/test';

// El login de saucedemo se resuelve entero en el navegador: el código
// compara la contraseña y guarda el usuario en una cookie sin firmar.
// Los tests describen lo que debería pasar; los que hoy fallan por ese
// diseño van marcados con test.fail() y avisarán si se corrige.

test('una cookie de sesión falsificada no debería dar acceso', async ({ page, context }) => {
  test.fail(true, 'Bug de seguridad: basta con crear session-username=standard_user para entrar');

  await context.addCookies([
    { name: 'session-username', value: 'standard_user', url: 'https://www.saucedemo.com' },
  ]);
  await page.goto('/inventory.html');

  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('inventory-item')).toHaveCount(0);
});

test('una cookie con un usuario inexistente no da acceso', async ({ page, context }) => {
  await context.addCookies([
    { name: 'session-username', value: 'cualquier_cosa', url: 'https://www.saucedemo.com' },
  ]);
  await page.goto('/inventory.html');

  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('inventory-item')).toHaveCount(0);
});

test('la contraseña no debería estar en el código que descarga el navegador', async ({ page, request }) => {
  test.fail(true, 'Bug de seguridad: usuarios y contraseña están escritos en el bundle de JavaScript');

  await page.goto('/');
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((elements) => elements.map((element) => (element as HTMLScriptElement).src));
  expect(scripts.length).toBeGreaterThan(0);

  for (const src of scripts) {
    const code = await (await request.get(src)).text();
    expect(code.includes('secret_sauce'), `${src} contiene la contraseña`).toBe(false);
  }
});
