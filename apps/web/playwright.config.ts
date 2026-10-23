import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const PORT = 3199;
const DATA_DIR = path.join(__dirname, '.e2e-data');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  // Dev-mode Turbopack cold-compiles each route on first visit and this
  // sandbox's CPU is sometimes under heavy contention from other tooling
  // running concurrently; the default 5s assertion timeout is too tight.
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    navigationTimeout: 20_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm exec next dev --port ' + PORT,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      AUTH_SECRET: 'e2e-test-secret-do-not-use-in-production',
      STORAGE_DRIVER: 'json',
      DATA_DIR,
    },
  },
});
