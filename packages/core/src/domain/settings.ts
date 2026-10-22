import { z } from 'zod';
import { timestampSchema } from './common';

export const smtpSettingsSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  user: z.string().min(1).nullable(),
  password: z.string().min(1).nullable(),
  from: z.string().min(1),
});

export type SmtpSettings = z.infer<typeof smtpSettingsSchema>;

/**
 * Singleton record, same pattern as InstallerState. SMTP configuration is
 * entered once through the setup wizard (or later through an admin settings
 * screen) and persisted through the active StorageDriver, rather than only
 * living in environment variables - that keeps it editable without a
 * process restart, which matters for a wizard step.
 */
export const appSettingsSchema = z.object({
  smtp: smtpSettingsSchema.nullable(),
  updatedAt: timestampSchema,
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  smtp: null,
  updatedAt: new Date(0).toISOString(),
};

export const updateAppSettingsInputSchema = z.object({
  smtp: smtpSettingsSchema.nullable(),
});
export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsInputSchema>;
