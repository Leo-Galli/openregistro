import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';

// env.ts caches getEnv()'s result for the lifetime of the module, so the
// configured password hash is fixed once here rather than changed per test.
const PASSWORD = 'Leonardo8888';

describe('cp-admin', () => {
  beforeAll(() => {
    process.env.CP_ADMIN_USERNAME = 'admin';
    process.env.CP_ADMIN_PASSWORD_SHA256 = createHash('sha256').update(PASSWORD).digest('hex');
  });

  it('hashes a value as a 64-character hex SHA-256 digest', async () => {
    const { sha256 } = await import('./cp-admin');
    const hash = sha256(PASSWORD);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', async () => {
    const { sha256 } = await import('./cp-admin');
    expect(sha256('same-input')).toBe(sha256('same-input'));
  });

  it('accepts the configured username and password', async () => {
    const { verifyCpCredentials } = await import('./cp-admin');
    expect(verifyCpCredentials('admin', PASSWORD)).toBe(true);
  });

  it('rejects a wrong username or password', async () => {
    const { verifyCpCredentials } = await import('./cp-admin');
    expect(verifyCpCredentials('admin', 'wrong-password')).toBe(false);
    expect(verifyCpCredentials('someone-else', PASSWORD)).toBe(false);
  });
});
