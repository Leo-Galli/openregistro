import { eq } from 'drizzle-orm';
import type { Database } from './client';
import { platformSettingsTable } from './schema';

const ROW_ID = 1;

export interface PlatformSettings {
  notificationEmails: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseEmails(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

async function ensureRow(db: Database): Promise<void> {
  const existing = await db
    .select({ id: platformSettingsTable.id })
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.id, ROW_ID))
    .limit(1);
  if (existing.length === 0) {
    await db
      .insert(platformSettingsTable)
      .values({ id: ROW_ID, notificationEmails: null, updatedAt: nowIso() });
  }
}

/**
 * Lives in the HOSTING_DATABASE_URL database, operator-editable from /cp -
 * who gets pinged when a new hosting request comes in, without a redeploy.
 */
export async function getPlatformSettings(db: Database): Promise<PlatformSettings> {
  await ensureRow(db);
  const [row] = await db
    .select()
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.id, ROW_ID))
    .limit(1);
  return { notificationEmails: parseEmails(row?.notificationEmails) };
}

export async function setNotificationEmails(
  db: Database,
  emails: string[],
): Promise<PlatformSettings> {
  await ensureRow(db);
  const normalized = emails.map((email) => email.trim()).filter(Boolean);
  const [row] = await db
    .update(platformSettingsTable)
    .set({ notificationEmails: normalized.join(','), updatedAt: nowIso() })
    .where(eq(platformSettingsTable.id, ROW_ID))
    .returning();
  return { notificationEmails: parseEmails(row?.notificationEmails) };
}
