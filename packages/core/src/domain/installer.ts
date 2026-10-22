import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Singleton record. Once `completed` is true the first-run wizard is
 * permanently locked and must never be reachable again, even if the admin
 * account is later deleted.
 */
export const installerStateSchema = z.object({
  completed: z.boolean(),
  completedAt: timestampSchema.nullable(),
  storageDriver: z.enum(['json', 'postgres']).nullable(),
});

export type InstallerState = z.infer<typeof installerStateSchema>;

export const DEFAULT_INSTALLER_STATE: InstallerState = {
  completed: false,
  completedAt: null,
  storageDriver: null,
};
