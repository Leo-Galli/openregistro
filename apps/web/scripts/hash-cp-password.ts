import { hashPassword } from '../lib/password';

/**
 * Prints an Argon2id hash of the given password, for pasting into the
 * CP_ADMIN_PASSWORD_HASH environment variable of the operator's own managed
 * deployment - see lib/cp-admin.ts. Not relevant to self-hosted installs,
 * which never set CP_ADMIN_PASSWORD_HASH at all.
 */
async function main(): Promise<void> {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: pnpm --filter @openregistro/web hash-cp-password <password>');
    process.exitCode = 1;
    return;
  }
  console.warn(await hashPassword(password));
}

main().catch((error: unknown) => {
  console.error('Failed to hash the password:', error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
