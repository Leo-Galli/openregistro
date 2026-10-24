import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createPostgresClient, type Database } from './client';
import { hostingRequestsTable } from './schema';
import {
  createHostingRequest,
  listHostingRequests,
  updateHostingRequestStatus,
} from './hosting-requests';

/**
 * Same real-database, skip-if-unset pattern as postgres-driver.test.ts, but
 * deliberately does NOT reuse its beforeEach table-wipe: these tests must be
 * safe to run against a database that already holds real hosting-request
 * leads, so cleanup here only ever deletes the exact rows this file created.
 */
const connectionString = process.env.DATABASE_URL;

describe.skipIf(!connectionString)('hosting requests', () => {
  let db: Database;
  let close: () => Promise<void>;
  const createdIds: string[] = [];

  beforeAll(() => {
    const client = createPostgresClient(connectionString!);
    db = client.db;
    close = client.close;
  });

  afterEach(async () => {
    while (createdIds.length > 0) {
      const id = createdIds.pop()!;
      await db.delete(hostingRequestsTable).where(eq(hostingRequestsTable.id, id));
    }
  });

  afterAll(async () => {
    await close();
  });

  it('creates a request defaulting to pending status', async () => {
    const request = await createHostingRequest(db, {
      schoolName: 'Test School',
      contactName: 'Jane Doe',
      contactEmail: 'jane@example.com',
      approxStudents: 120,
      message: 'We would like a quote.',
    });
    createdIds.push(request.id);

    expect(request.status).toBe('pending');
    expect(request.schoolName).toBe('Test School');
    expect(request.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('lists requests newest first and updates status', async () => {
    const first = await createHostingRequest(db, {
      schoolName: 'School A',
      contactName: 'A',
      contactEmail: 'a@example.com',
      approxStudents: null,
      message: null,
    });
    createdIds.push(first.id);
    const second = await createHostingRequest(db, {
      schoolName: 'School B',
      contactName: 'B',
      contactEmail: 'b@example.com',
      approxStudents: null,
      message: null,
    });
    createdIds.push(second.id);

    const list = await listHostingRequests(db);
    const ids = list.map((r) => r.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));

    const updated = await updateHostingRequestStatus(db, first.id, 'contacted');
    expect(updated?.status).toBe('contacted');
  });

  it('returns null when updating a request that does not exist', async () => {
    const updated = await updateHostingRequestStatus(
      db,
      '00000000-0000-0000-0000-000000000000',
      'declined',
    );
    expect(updated).toBeNull();
  });
});
