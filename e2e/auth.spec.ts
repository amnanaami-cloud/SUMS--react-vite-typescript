import { expect, test } from '@playwright/test';

test('a seeded student can authenticate and restore the application shell', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Email Address').fill('student@up.edu.ps');
  await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_DEMO_PASSWORD ?? 'SumsCi!2026');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('.app')).toBeVisible();
  await expect(page.getByRole('main').getByText('2202100054', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.app')).toBeVisible();
});
