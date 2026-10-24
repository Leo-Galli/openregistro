import { randomUUID } from 'node:crypto';
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
}

export type HostingRequestStatus = 'pending' | 'contacted' | 'activated' | 'declined';

export interface HostingRequest extends CreateHostingRequestInput {
  id: string;
  status: HostingRequestStatus;
  createdAt: string;
  updatedAt: string;
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
