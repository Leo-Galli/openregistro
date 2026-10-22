import { TOTP, Secret } from 'otpauth';
import { describe, expect, it } from 'vitest';
import { generateTotpEnrollment, verifyTotpToken } from './totp';

describe('TOTP enrollment', () => {
  it('generates a base32 secret and a matching otpauth URL', () => {
    const enrollment = generateTotpEnrollment('admin@example.com');
    expect(enrollment.secret).toMatch(/^[A-Z2-7]+$/);
    expect(enrollment.otpauthUrl).toContain('otpauth://totp/');
    expect(enrollment.otpauthUrl).toContain('OpenRegistro');
  });

  it('verifies a token generated from the same secret', () => {
    const enrollment = generateTotpEnrollment('admin@example.com');
    const totp = new TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(enrollment.secret),
    });
    const token = totp.generate();
    expect(verifyTotpToken(enrollment.secret, token)).toBe(true);
  });

  it('rejects an incorrect token', () => {
    const enrollment = generateTotpEnrollment('admin@example.com');
    expect(verifyTotpToken(enrollment.secret, '000000')).toBe(false);
  });
});
