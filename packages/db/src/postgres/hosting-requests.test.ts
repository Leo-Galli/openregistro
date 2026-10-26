import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createPostgresClient, type Database } from './client';
import { hostingRequestsTable } from './schema';
import {
  createHostingRequest,
  listHostingRequests,
  updateHostingRequestStatus,
  updateHostingRequestDetails,
  deleteHostingRequest,
  generateLicenseKey,
  assignSubdomain,
  isSubdomainTaken,
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
    expect(request.licenseKey).toBeNull();
    expect(request.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('generates a unique license key in the expected format', async () => {
    const request = await createHostingRequest(db, {
      schoolName: 'License School',
      contactName: 'L',
      contactEmail: 'l@example.com',
      approxStudents: null,
      message: null,
    });
    createdIds.push(request.id);

    const first = await generateLicenseKey(db, request.id);
    expect(first?.licenseKey).toMatch(/^OR-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);

    const second = await generateLicenseKey(db, request.id);
    expect(second?.licenseKey).not.toBe(first?.licenseKey);
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

  it('edits request details', async () => {
    const request = await createHostingRequest(db, {
      schoolName: 'Old Name',
      contactName: 'Old Contact',
      contactEmail: 'old@example.com',
      approxStudents: 10,
      message: null,
    });
    createdIds.push(request.id);

    const updated = await updateHostingRequestDetails(db, request.id, {
      schoolName: 'New Name',
      contactName: 'New Contact',
      contactEmail: 'new@example.com',
      approxStudents: 20,
      message: 'Updated message',
    });

    expect(updated?.schoolName).toBe('New Name');
    expect(updated?.approxStudents).toBe(20);
    expect(updated?.message).toBe('Updated message');
  });

  it('assigns a subdomain and reports it as taken afterward', async () => {
    const request = await createHostingRequest(db, {
      schoolName: 'Subdomain School',
      contactName: 'S',
      contactEmail: 's@example.com',
      approxStudents: null,
      message: null,
    });
    createdIds.push(request.id);

    expect(await isSubdomainTaken(db, 'subdomain-school')).toBe(false);

    const updated = await assignSubdomain(db, request.id, 'subdomain-school');
    expect(updated?.subdomain).toBe('subdomain-school');
    expect(await isSubdomainTaken(db, 'subdomain-school')).toBe(true);
  });

  it('deletes a request', async () => {
    const request = await createHostingRequest(db, {
      schoolName: 'To Delete',
      contactName: 'X',
      contactEmail: 'x@example.com',
      approxStudents: null,
      message: null,
    });

    await deleteHostingRequest(db, request.id);

    const list = await listHostingRequests(db);
    expect(list.find((r) => r.id === request.id)).toBeUndefined();
  });
});
