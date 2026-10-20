import path from 'node:path';
import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://the-internet.herokuapp.com' });

test.describe('JavaScript alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/javascript_alerts');
  });

  // El listener se registra antes del clic: si el diálogo no se gestiona,
  // la página se queda bloqueada esperando una respuesta.
  test('aceptar un confirm', async ({ page }) => {
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Click for JS Confirm' }).click();
    await expect(page.getByText('You clicked: Ok')).toBeVisible();
  });

  test('rechazar un confirm', async ({ page }) => {
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Click for JS Confirm' }).click();
    await expect(page.getByText('You clicked: Cancel')).toBeVisible();
  });

  test('escribir en un prompt', async ({ page }) => {
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('I am a JS prompt');
      await dialog.accept('Hola desde Playwright');
    });
    await page.getByRole('button', { name: 'Click for JS Prompt' }).click();
    await expect(page.getByText('You entered: Hola desde Playwright')).toBeVisible();
  });
});

test('subir un archivo', async ({ page }) => {
  await page.goto('/upload');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose File' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(__dirname, 'fixtures', 'upload.txt'));
  await page.getByRole('button', { name: 'Upload' }).click();

  await expect(page.getByRole('heading', { name: 'File Uploaded!' })).toBeVisible();
  await expect(page.getByText('upload.txt')).toBeVisible();
});

test('arrastrar la caja A sobre la B', async ({ page }) => {
  await page.goto('/drag_and_drop');
  await expect(page.locator('#column-a header')).toHaveText('A');

  await page.locator('#column-a').dragTo(page.locator('#column-b'));

  await expect(page.locator('#column-a header')).toHaveText('B');
  await expect(page.locator('#column-b header')).toHaveText('A');
});

test('pasar el ratón por cada avatar muestra su nombre', async ({ page }) => {
  await page.goto('/hovers');
  const avatars = page.getByRole('img', { name: 'User Avatar' });
  await expect(avatars).toHaveCount(3);

  for (const n of [1, 2, 3]) {
    const name = page.getByRole('heading', { name: `name: user${n}` });
    await expect(name).toBeHidden();

    await avatars.nth(n - 1).hover();
    await expect(name).toBeVisible();
    await expect(page.locator(`a[href="/users/${n}"]`)).toBeVisible();
  }
});

test('el enlace abre una pestaña nueva', async ({ page }) => {
  await page.goto('/windows');

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Click Here' }).click();
  const popup = await popupPromise;

  await expect(popup).toHaveURL(/\/windows\/new$/);
  await expect(popup.getByRole('heading', { name: 'New Window' })).toBeVisible();
  await expect(page).toHaveURL(/\/windows$/);
  expect(page.context().pages()).toHaveLength(2);
});
