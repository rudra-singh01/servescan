import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /QR se digital menu/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Free account/i })).toBeVisible();
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('ScanServe Login')).toBeVisible();
});
