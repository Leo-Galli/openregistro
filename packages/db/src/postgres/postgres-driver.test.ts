import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { schoolIdSchema, type StorageDriver } from '@openregistro/core';
import { createPostgresStorageDriver } from './postgres-driver';
import { createPostgresClient } from './client';
import {
  absenceJustificationsTable,
  announcementReadReceiptsTable,
  announcementsTable,
  attendanceRecordsTable,
  auditLogTable,
  calendarEventsTable,
  classesTable,
  disciplinaryNotesTable,
  enrollmentsTable,
  gradesTable,
  guardianshipsTable,
  homeworkAssignmentsTable,
  installerStateTable,
  lessonLogsTable,
  meetingBookingsTable,
  meetingSlotsTable,
  schoolYearsTable,
  schoolsTable,
  subjectsTable,
  teacherAssignmentsTable,
  termEvaluationsTable,
  termsTable,
  timetableSlotsTable,
  usersTable,
} from './schema';

/**
 * These tests exercise the real Postgres driver against a live database and
 * only run when DATABASE_URL is set (see docs/installation.md). CI provides a
 * Postgres service container; locally, run `docker compose up db` first.
 * They are intentionally skipped rather than mocked - mocking Drizzle would
 * not catch schema/migration drift, which is the whole point of this suite
 * existing alongside the json driver's contract tests.
 */
const connectionString = process.env.DATABASE_URL;

describe.skipIf(!connectionString)('postgres storage driver', () => {
  let driver: StorageDriver;
  let cleanupClient: ReturnType<typeof createPostgresClient>;

  beforeAll(async () => {
    driver = createPostgresStorageDriver({ connectionString: connectionString! });
    await driver.connect();
    cleanupClient = createPostgresClient(connectionString!);
  });

  afterAll(async () => {
    await driver.disconnect();
    await cleanupClient.close();
  });

  beforeEach(async () => {
    const db = cleanupClient.db;
    await db.delete(auditLogTable);
    await db.delete(announcementReadReceiptsTable);
    await db.delete(announcementsTable);
    await db.delete(meetingBookingsTable);
    await db.delete(meetingSlotsTable);
    await db.delete(calendarEventsTable);
    await db.delete(timetableSlotsTable);
    await db.delete(termEvaluationsTable);
    await db.delete(homeworkAssignmentsTable);
    await db.delete(disciplinaryNotesTable);
    await db.delete(gradesTable);
    await db.delete(absenceJustificationsTable);
    await db.delete(attendanceRecordsTable);
    await db.delete(lessonLogsTable);
    await db.delete(guardianshipsTable);
    await db.delete(enrollmentsTable);
    await db.delete(teacherAssignmentsTable);
    await db.delete(subjectsTable);
    await db.delete(classesTable);
    await db.delete(termsTable);
    await db.delete(schoolYearsTable);
    await db.delete(usersTable);
    await db.delete(schoolsTable);
    await db
      .update(installerStateTable)
      .set({ completed: false, completedAt: null, storageDriver: null });
  });

  it('reports healthy once connected', async () => {
    expect(await driver.healthCheck()).toBe(true);
  });

  it('locks the installer as completed', async () => {
    const state = await driver.installer.complete('postgres');
    expect(state.completed).toBe(true);
    expect(await driver.installer.get()).toEqual(state);
  });

  it('creates, updates, and deletes a school', async () => {
    const school = await driver.schools.create({
      name: 'Liceo Galilei',
      address: null,
      contactEmail: null,
      logoUrl: null,
      primaryColor: null,
      usePlatformEmail: false,
    });
    expect(await driver.schools.findById(school.id)).toEqual(school);

    const updated = await driver.schools.update(school.id, { name: 'Liceo Fermi' });
    expect(updated.name).toBe('Liceo Fermi');

    await driver.schools.delete(school.id);
    expect(await driver.schools.findById(school.id)).toBeNull();
  });

  it('throws NotFoundError when updating a missing record', async () => {
    await expect(
      driver.schools.update(schoolIdSchema.parse('00000000-0000-0000-0000-000000000000'), {
        name: 'Ghost',
      }),
    ).rejects.toThrow('was not found');
  });

  it('walks an absence justification through review', async () => {
    const school = await driver.schools.create({
      name: 'School',
      address: null,
      contactEmail: null,
      logoUrl: null,
      primaryColor: null,
      usePlatformEmail: false,
    });
    const schoolYear = await driver.schoolYears.create({
      schoolId: school.id,
      label: '2025/2026',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
      isActive: true,
    });
    const klass = await driver.classes.create({
      schoolId: school.id,
      schoolYearId: schoolYear.id,
      name: '3A',
      gradeLevel: 3,
    });
    const student = await driver.users.create({
      schoolId: school.id,
      role: 'student',
      email: 'student@example.com',
      fullName: 'Mario Rossi',
      passwordHash: 'hash',
      totpSecret: null,
      isActive: true,
      lastLoginAt: null,
    });
    const guardian = await driver.users.create({
      schoolId: school.id,
      role: 'guardian',
      email: 'guardian@example.com',
      fullName: 'Luigi Rossi',
      passwordHash: 'hash',
      totpSecret: null,
      isActive: true,
      lastLoginAt: null,
    });
    const attendance = await driver.attendanceRecords.create({
      studentId: student.id,
      classId: klass.id,
      date: '2025-10-01',
      status: 'absent',
      minutesLate: null,
      recordedBy: guardian.id,
    });

    const justification = await driver.absenceJustifications.create({
      attendanceRecordId: attendance.id,
      submittedBy: guardian.id,
      reason: 'Medical appointment',
    });
    expect(justification.status).toBe('pending');

    const reviewed = await driver.absenceJustifications.review(
      justification.id,
      'approved',
      guardian.id,
    );
    expect(reviewed.status).toBe('approved');
  });
});
