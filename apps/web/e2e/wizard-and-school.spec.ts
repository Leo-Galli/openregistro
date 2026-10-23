import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

/**
 * Radix's Select is a custom listbox, not a native <select>: clicking the
 * trigger opens an animated popover, and this sandbox's dev server can be
 * slow enough under load that clicking the option before the popover has
 * finished opening silently no-ops. Waiting for the listbox role first makes
 * this robust regardless of how long the open animation/render takes.
 */
async function chooseOption(page: Page, triggerLabel: string, optionName: string) {
  // getByRole('combobox', ...) rather than getByLabel: a dialog whose title
  // happens to contain the same word as the field label (e.g. "Enroll a
  // student" vs. the "Student" field) otherwise matches both, since Radix
  // dialogs are themselves labelled via aria-labelledby.
  await page.getByRole('combobox', { name: triggerLabel }).click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('option', { name: optionName }).click();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

const ADMIN_EMAIL = 'admin@scuolaplaywright.it';
const ADMIN_PASSWORD = 'SuperSecret123!';
const TEACHER_EMAIL = 'luigi.bianchi@scuolaplaywright.it';
const TEACHER_PASSWORD = 'TeacherPass123!';
const STUDENT_EMAIL = 'sara.rossi@scuolaplaywright.it';
const STUDENT_PASSWORD = 'StudentPass123!';

test('completes the setup wizard and logs in', async ({ page }) => {
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
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByLabel('Confirm password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/setup\/smtp$/);
  await page.getByRole('button', { name: 'Skip for now' }).click();

  await expect(page).toHaveURL(/\/setup\/demo$/);
  await page.getByRole('button', { name: 'Finish setup' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page.getByRole('heading', { name: 'Scuola Playwright' })).toBeVisible();

  // Revisiting the wizard must be permanently blocked.
  await page.goto('/setup/welcome');
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('admin manages a class through the UI', async ({ page }) => {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

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
  await expect(page.getByRole('heading', { name: /3A/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('No students enrolled yet.')).toBeVisible();
});

test('admin creates a subject, a teacher, and a student', async ({ page }) => {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.goto('/dashboard/school/subjects');
  await page.getByRole('button', { name: 'New subject' }).click();
  await page.getByLabel('Name').fill('Mathematics');
  await page.getByLabel('Short code').fill('MATH');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('cell', { name: 'Mathematics' })).toBeVisible();

  await page.goto('/dashboard/school/people');

  await page.getByRole('button', { name: 'New person' }).click();
  await expect(page.getByRole('dialog', { name: 'New account' })).toBeVisible();
  await chooseOption(page, 'Role', 'Teacher');
  await page.getByLabel('Full name').fill('Luigi Bianchi');
  await page.getByLabel('Email').fill(TEACHER_EMAIL);
  await page.getByLabel('Temporary password').fill(TEACHER_PASSWORD);
  await page.getByLabel('Confirm').fill(TEACHER_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('cell', { name: 'Luigi Bianchi' })).toBeVisible();

  await page.getByRole('button', { name: 'New person' }).click();
  await expect(page.getByRole('dialog', { name: 'New account' })).toBeVisible();
  await chooseOption(page, 'Role', 'Student');
  await page.getByLabel('Full name').fill('Sara Rossi');
  await page.getByLabel('Email').fill(STUDENT_EMAIL);
  await page.getByLabel('Temporary password').fill(STUDENT_PASSWORD);
  await page.getByLabel('Confirm').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('cell', { name: 'Sara Rossi' })).toBeVisible();
});

test('admin enrolls the student and assigns the teacher', async ({ page }) => {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.goto('/dashboard/school/classes');
  await page.getByRole('link', { name: 'Manage' }).click();
  await expect(page.getByRole('heading', { name: /3A/ })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Enroll student' }).click();
  await expect(page.getByRole('dialog', { name: 'Enroll a student' })).toBeVisible();
  await chooseOption(page, 'Student', 'Sara Rossi');
  await page.getByRole('button', { name: 'Enroll' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('cell', { name: 'Sara Rossi' })).toBeVisible();

  await page.getByRole('button', { name: 'Assign teacher' }).click();
  await expect(page.getByRole('dialog', { name: 'Assign a teacher' })).toBeVisible();
  await chooseOption(page, 'Teacher', 'Luigi Bianchi');
  await chooseOption(page, 'Subject', 'Mathematics');
  await page.getByRole('button', { name: 'Assign' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText(/Mathematics.*Luigi Bianchi/)).toBeVisible();
});

test('teacher takes the class register', async ({ page }) => {
  await signIn(page, TEACHER_EMAIL, TEACHER_PASSWORD);

  await page.goto('/dashboard/register');
  await page.getByRole('link', { name: '3A' }).click();
  await expect(page).toHaveURL(/\/dashboard\/register\//, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: '3A' })).toBeVisible({ timeout: 30_000 });

  await chooseOption(page, 'Subject', 'Mathematics');
  await page.getByLabel('Lesson topic').fill('Linear equations, introduction');
  await page.getByRole('button', { name: 'Sign and save' }).click();
  await expect(page.getByText('Lesson logged and signed.')).toBeVisible();

  const studentRow = page.getByRole('row').filter({ hasText: 'Sara Rossi' });
  await studentRow.getByRole('combobox').click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('option', { name: 'Late' }).click();
  await page.getByRole('button', { name: 'Save attendance' }).click();
  await expect(page.getByText('Attendance saved.')).toBeVisible();
});
