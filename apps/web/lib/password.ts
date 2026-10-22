import { hash, verify } from '@node-rs/argon2';

/**
 * OWASP-recommended Argon2id parameters for an interactive login path
 * (memory cost in KiB). Tuned for a self-hosted single-instance deployment,
 * not a high-throughput multi-tenant SaaS.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  algorithm: 2, // argon2id
} as const;

export function hashPassword(plainTextPassword: string): Promise<string> {
  return hash(plainTextPassword, ARGON2_OPTIONS);
}

export function verifyPassword(hashedPassword: string, plainTextPassword: string): Promise<boolean> {
  return verify(hashedPassword, plainTextPassword);
}
