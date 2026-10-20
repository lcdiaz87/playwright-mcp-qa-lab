import type { Page } from '@playwright/test';
import { test, expect } from '../pages/fixtures';

type ContrastIssue = { text: string; color: string; background: string; ratio: number; required: number };

// Recorre todos los elementos con texto propio y visible, calcula el
// contraste WCAG entre su color y el primer fondo opaco de sus ancestros,
// y devuelve los que no llegan al mínimo AA (4.5:1, o 3:1 si el texto es
// grande). Los fondos con imagen no se tienen en cuenta.
async function findContrastIssues(page: Page): Promise<ContrastIssue[]> {
  return page.evaluate(() => {
    const channels = (rgb: string) => rgb.match(/[\d.]+/g)!.map(Number);
    const luminance = (rgb: string) => {
      const [r, g, b] = channels(rgb).slice(0, 3).map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: string, b: string) => {
      const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (light + 0.05) / (dark + 0.05);
    };
    const backgroundOf = (element: Element | null) => {
      for (; element; element = element.parentElement) {
        const color = getComputedStyle(element).backgroundColor;
        if (channels(color)[3] !== 0) return color;
      }
      return 'rgb(255, 255, 255)';
    };

    const issues: ContrastIssue[] = [];
    for (const element of document.body.querySelectorAll('*')) {
      const ownText = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent!.trim())
        .join(' ')
        .trim();
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const size = parseFloat(style.fontSize);
      // font-size 0 oculta el texto a la vista y lo deja solo para lectores
      // de pantalla (p. ej. los enlaces sociales del pie, que son iconos)
      if (!ownText || size === 0 || style.visibility === 'hidden' || box.width === 0 || box.height === 0) continue;

      const bold = Number(style.fontWeight) >= 700;
      const required = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      const background = backgroundOf(element);
      const ratio = contrast(style.color, background);
      if (ratio < required) {
        issues.push({ text: ownText.slice(0, 40), color: style.color, background, ratio: Math.round(ratio * 100) / 100, required });
      }
    }
    return issues;
  });
}

test.describe('Contraste de color (WCAG AA)', () => {
  test('página de login', async ({ page, loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();

    expect(await findContrastIssues(page)).toEqual([]);
  });

  test('mensaje de error del login', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('', '');
    await expect(loginPage.error).toBeVisible();

    expect(await findContrastIssues(page)).toEqual([]);
  });

  test('inventario', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.loginAs('standard_user');
    await expect(inventoryPage.items).toHaveCount(6);

    expect(await findContrastIssues(page)).toEqual([]);
  });
});
