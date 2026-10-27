import { randomUUID, randomBytes } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import type { Database } from './client';
import { hostingRequestsTable } from './schema';
import { normalizeTimestamps } from './repository-factory';

export interface CreateHostingRequestInput {
  schoolName: string;
  contactName: string;
  contactEmail: string;
  approxStudents: number | null;
  message: string | null;
  /** Optional: omitted entirely (not set to null) on an update leaves the existing value untouched. */
  requestedSubdomain?: string | null;
}

export type HostingRequestStatus = 'pending' | 'contacted' | 'activated' | 'declined';
export type ProvisioningStatus = 'not_started' | 'provisioning' | 'ready' | 'failed';

export interface HostingRequest extends Omit<CreateHostingRequestInput, 'requestedSubdomain'> {
  id: string;
  status: HostingRequestStatus;
  licenseKey: string | null;
  requestedSubdomain: string | null;
  subdomain: string | null;
  vercelProjectId: string | null;
  provisioningStatus: ProvisioningStatus;
  provisioningError: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A reference code for a hosted instance, not a real activation/DRM scheme -
 * hosting is free with no license enforcement anywhere in the app. This is
 * purely so the operator has something short and memorable to hand a school
 * and look up later.
 */
function generateLicenseCode(): string {
  const groups = Array.from({ length: 3 }, () => randomBytes(2).toString('hex').toUpperCase());
  return `OR-${groups.join('-')}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function createHostingRequest(
  db: Database,
  input: CreateHostingRequestInput,
): Promise<HostingRequest> {
  const now = nowIso();
  const [row] = await db
    .insert(hostingRequestsTable)
    .values({ id: randomUUID(), ...input, status: 'pending', createdAt: now, updatedAt: now })
    .returning();
  return normalizeTimestamps(row) as HostingRequest;
}

export async function listHostingRequests(db: Database): Promise<HostingRequest[]> {
  const rows = await db
    .select()
    .from(hostingRequestsTable)
    .orderBy(desc(hostingRequestsTable.createdAt));
  return rows.map((row) => normalizeTimestamps(row) as HostingRequest);
}

export async function updateHostingRequestStatus(
  db: Database,
  id: string,
  status: HostingRequestStatus,
): Promise<HostingRequest | null> {
  const [row] = await db
    .update(hostingRequestsTable)
    .set({ status, updatedAt: nowIso() })
    .where(eq(hostingRequestsTable.id, id))
    .returning();
  return row ? (normalizeTimestamps(row) as HostingRequest) : null;
}

export async function updateHostingRequestDetails(
  db: Database,
  id: string,
  patch: CreateHostingRequestInput,
): Promise<HostingRequest | null> {
  const [row] = await db
    .update(hostingRequestsTable)
    .set({ ...patch, updatedAt: nowIso() })
    .where(eq(hostingRequestsTable.id, id))
    .returning();
  return row ? (normalizeTimestamps(row) as HostingRequest) : null;
}

export async function deleteHostingRequest(db: Database, id: string): Promise<void> {
  await db.delete(hostingRequestsTable).where(eq(hostingRequestsTable.id, id));
}

export async function generateLicenseKey(db: Database, id: string): Promise<HostingRequest | null> {
  const [row] = await db
    .update(hostingRequestsTable)
    .set({ licenseKey: generateLicenseCode(), updatedAt: nowIso() })
    .where(eq(hostingRequestsTable.id, id))
    .returning();
  return row ? (normalizeTimestamps(row) as HostingRequest) : null;
}

export async function isSubdomainTaken(db: Database, subdomain: string): Promise<boolean> {
  const [row] = await db
    .select({ id: hostingRequestsTable.id })
    .from(hostingRequestsTable)
    .where(eq(hostingRequestsTable.subdomain, subdomain))
    .limit(1);
  return row !== undefined;
}

export async function assignSubdomain(
  db: Database,
  id: string,
  subdomain: string,
): Promise<HostingRequest | null> {
  const [row] = await db
    .update(hostingRequestsTable)
    .set({ subdomain, updatedAt: nowIso() })
    .where(eq(hostingRequestsTable.id, id))
    .returning();
  return row ? (normalizeTimestamps(row) as HostingRequest) : null;
}

export async function setProvisioningState(
  db: Database,
  id: string,
  state: {
    provisioningStatus: ProvisioningStatus;
    vercelProjectId?: string | null;
    provisioningError?: string | null;
  },
): Promise<HostingRequest | null> {
  const [row] = await db
    .update(hostingRequestsTable)
    .set({ ...state, updatedAt: nowIso() })
    .where(eq(hostingRequestsTable.id, id))
    .returning();
  return row ? (normalizeTimestamps(row) as HostingRequest) : null;
}
