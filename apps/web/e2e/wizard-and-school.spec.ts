import { test, expect, type Page } from '@playwright/test';

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
  // /login redirects an already-authenticated session straight to /dashboard,
  // so switching users mid-test must sign out of the previous session first.
  if (new URL(page.url()).pathname === '/dashboard') {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);
  }
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

// A single test, not several: this sandbox's Chromium reliably crashes
// (`browserContext.newPage: Target crashed`) the moment Playwright opens a
// second page/context in the same run, regardless of launch flags or
// available memory. One long test keeps everything on the one page Playwright
// opens for the run. See CLAUDE.md Phase 5c notes before re-splitting this.
test('completes setup, then exercises school management, register, and gradebook', async ({
  page,
}) => {
  test.setTimeout(180_000);

  // --- Setup wizard ---
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

  // --- Admin manages a class ---
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

  // --- Admin creates a subject, a teacher, and a student ---
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

  // --- Admin enrolls the student and assigns the teacher ---
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

  // --- Admin creates a term ---
  await page.goto('/dashboard/school/terms');
  await page.getByRole('button', { name: 'New term' }).click();
  await expect(page.getByRole('dialog', { name: 'New term' })).toBeVisible();
  await page.getByLabel('Label').fill('First trimester');
  await page.getByLabel('Starts on').fill('2025-09-01');
  await page.getByLabel('Ends on').fill('2025-12-20');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('cell', { name: 'First trimester' })).toBeVisible();

  // --- Admin schedules a lesson on the timetable ---
  await page.goto('/dashboard/timetable');
  await page.getByRole('link', { name: '3A' }).click();
  await expect(page.getByRole('heading', { name: /3A timetable/ })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole('button', { name: 'Add lesson' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Add a lesson' })).toBeVisible();
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Luigi Bianchi')).toBeVisible();

  // --- Admin publishes an announcement ---
  await page.goto('/dashboard/announcements');
  await page.getByRole('button', { name: 'New announcement' }).click();
  await expect(page.getByRole('dialog', { name: 'New announcement' })).toBeVisible();
  await page.getByLabel('Title').fill('Welcome back');
  await page.getByLabel('Message').fill('First trimester starts today.');
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  // --- Admin deactivates, then reactivates, the teacher's account ---
  await page.goto('/dashboard/school/people');
  const teacherRow = page.getByRole('row').filter({ hasText: 'Luigi Bianchi' });
  await teacherRow.getByRole('button', { name: 'Deactivate' }).click();
  await expect(teacherRow.getByText('Inactive')).toBeVisible();
  await teacherRow.getByRole('button', { name: 'Reactivate' }).click();
  await expect(teacherRow.getByText('Active')).toBeVisible();

  // --- Admin decides a term evaluation, separate from the gradebook average ---
  await page.goto('/dashboard/report-cards');
  await page.getByRole('link', { name: /3A/ }).click();
  await expect(page.getByRole('heading', { name: /Mathematics/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Set grade' }).click();
  await expect(page.getByRole('dialog', { name: /Term evaluation for Sara Rossi/ })).toBeVisible();
  await page.getByLabel('Final grade').fill('8.5');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('8.50')).toBeVisible();

  // --- Admin checks the audit log reflects the mutations above ---
  await page.goto('/dashboard/audit-log');
  await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible();
  await expect(page.getByText('No audit entries recorded yet.')).not.toBeVisible();

  // --- Teacher takes the class register ---
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
  await page.getByRole('option', { name: 'Absent', exact: true }).click();
  await page.getByRole('button', { name: 'Save attendance' }).click();
  await expect(page.getByText('Attendance saved.')).toBeVisible();

  // --- Teacher enters a grade ---
  await page.goto('/dashboard/gradebook');
  await page.getByRole('link', { name: /3A/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/gradebook\//, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /Mathematics/ })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Add grade' }).click();
  await expect(page.getByRole('dialog', { name: /New grade for Sara Rossi/ })).toBeVisible();
  await page.getByLabel('Value').fill('8');
  await page.getByRole('button', { name: 'Save grade' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('8.00')).toBeVisible();

  // --- Teacher assigns homework ---
  await page.goto('/dashboard/homework');
  await page.getByRole('link', { name: /3A/ }).click();
  await expect(page.getByRole('heading', { name: /Mathematics/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'New homework' }).click();
  await expect(page.getByRole('dialog', { name: 'New homework' })).toBeVisible();
  await page.getByLabel('Title').fill('Exercises 1-10');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Exercises 1-10')).toBeVisible();

  // --- Student justifies her own absence ---
  await signIn(page, STUDENT_EMAIL, STUDENT_PASSWORD);

  await page.goto('/dashboard/attendance');
  await expect(page.getByRole('cell', { name: 'Absent' })).toBeVisible();
  await page.getByRole('button', { name: 'Justify' }).click();
  await expect(page.getByRole('dialog', { name: /Justify absence on/ })).toBeVisible();
  await page.getByLabel('Reason').fill('Medical appointment.');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('pending')).toBeVisible();

  // --- Student checks her own read-only views ---
  await page.goto('/dashboard/grades');
  await expect(page.getByText('Mathematics')).toBeVisible();
  await expect(page.getByText('8.00')).toBeVisible();

  await page.goto('/dashboard/homework');
  await expect(page.getByText('Exercises 1-10')).toBeVisible();

  await page.goto('/dashboard/announcements');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  // --- Student downloads her own report card PDF and data export ---
  // Fetched directly (not via clicking the target="_blank" link) since
  // opening a second page/tab reliably crashes this sandbox's Chromium -
  // see the single-test() note above.
  await page.goto('/dashboard/report-cards');
  const reportCardHref = await page
    .getByRole('link', { name: /Download PDF/ })
    .getAttribute('href');
  const reportCardResponse = await page.request.get(reportCardHref!);
  expect(reportCardResponse.ok()).toBe(true);
  expect(reportCardResponse.headers()['content-type']).toContain('application/pdf');

  const exportResponse = await page.request.get('/api/account/export');
  expect(exportResponse.ok()).toBe(true);
  const exportPayload = await exportResponse.json();
  expect(exportPayload.profile.email).toBe(STUDENT_EMAIL);

  // --- Admin reviews and approves the justification ---
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.goto('/dashboard/attendance');
  await expect(page.getByRole('heading', { name: 'Pending justifications' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Medical appointment.' })).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('No pending justifications.')).toBeVisible();
});
