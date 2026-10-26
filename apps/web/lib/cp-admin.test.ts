import { beforeAll, describe, expect, it } from 'vitest';
import { hashPassword } from './password';

// env.ts caches getEnv()'s result for the lifetime of the module, so the
// configured password hash is fixed once here rather than changed per test.
const PASSWORD = 'Leonardo8888';

describe('cp-admin', () => {
  beforeAll(async () => {
    process.env.CP_ADMIN_USERNAME = 'admin';
    process.env.CP_ADMIN_PASSWORD_HASH = await hashPassword(PASSWORD);
  });

  it('accepts the configured username and password', async () => {
    const { verifyCpCredentials } = await import('./cp-admin');
    expect(await verifyCpCredentials('admin', PASSWORD)).toBe(true);
  });

  it('rejects a wrong username or password', async () => {
    const { verifyCpCredentials } = await import('./cp-admin');
    expect(await verifyCpCredentials('admin', 'wrong-password')).toBe(false);
    expect(await verifyCpCredentials('someone-else', PASSWORD)).toBe(false);
  });
});
