import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // En CI: un test.only olvidado rompe el build, y se reintenta dos veces
  // porque los tests dependen de webs de terceros que a veces van lentas
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://www.saucedemo.com',
    // saucedemo usa data-test en lugar del data-testid por defecto
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
