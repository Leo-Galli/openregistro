import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('completes setup, logs in, and manages a class through the UI', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(page).toHaveURL(/\/setup\/welcome$/);
  await expect(page.getByText(/Node\.js \d/)).toBeVisible();
  await page.getByRole('link', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/setup\/driver$/);
  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.getByText(/writable/i)).toBeVisible();
  await page.getByRole('link', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/setup\/school$/);
  await page.getByLabel('School name').fill('Scuola Playwright');
  await page.getByLabel('Current school year label').fill('2025/2026');
  await page.getByLabel('Starts on').fill('2025-09-01');
  await page.getByLabel('Ends on').fill('2026-06-10');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/setup\/admin$/);
  await page.getByLabel('Full name').fill('Maria Verdi');
  await page.getByLabel('Email').fill('admin@scuolaplaywright.it');
  await page.getByLabel('Password', { exact: true }).fill('SuperSecret123!');
  await page.getByLabel('Confirm password').fill('SuperSecret123!');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/setup\/smtp$/);
  await page.getByRole('button', { name: 'Skip for now' }).click();

  await expect(page).toHaveURL(/\/setup\/demo$/);
  await page.getByRole('button', { name: 'Finish setup' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill('admin@scuolaplaywright.it');
  await page.getByLabel('Password').fill('SuperSecret123!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Scuola Playwright' })).toBeVisible();

  // Revisiting the wizard must be permanently blocked.
  await page.goto('/setup/welcome');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/dashboard/school/classes');
  await expect(page.getByText('No classes yet.')).toBeVisible();

  await page.getByRole('button', { name: 'New class' }).click();
  await expect(page.getByRole('dialog', { name: 'New class' })).toBeVisible();
  await page.getByLabel('Name').fill('3A');
  await page.getByLabel('Grade level').fill('8');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('cell', { name: '3A' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '8', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Manage' }).click();
  // First navigation to a never-before-compiled dynamic route: Turbopack
  // cold-compiles it on demand in dev mode, which can take several seconds.
  await expect(page.getByRole('heading', { name: /3A/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('No students enrolled yet.')).toBeVisible();
});
