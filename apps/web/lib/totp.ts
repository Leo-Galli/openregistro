import { Secret, TOTP } from 'otpauth';

export interface TotpEnrollment {
  secret: string;
  otpauthUrl: string;
}

export function generateTotpEnrollment(accountName: string): TotpEnrollment {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: 'OpenRegistro',
    label: accountName,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });
  return { secret: secret.base32, otpauthUrl: totp.toString() };
}

export function verifyTotpToken(secretBase32: string, token: string): boolean {
  const totp = new TOTP({
    issuer: 'OpenRegistro',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
  // Allow one 30s step of clock drift in either direction.
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
