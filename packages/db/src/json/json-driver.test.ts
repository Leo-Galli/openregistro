import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schoolIdSchema, type StorageDriver } from '@openregistro/core';
import { createJsonStorageDriver } from './json-driver';

describe('json storage driver', () => {
  let dataDir: string;
  let driver: StorageDriver;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), 'openregistro-json-'));
    driver = createJsonStorageDriver({ dataDir });
    await driver.connect();
  });

  afterEach(async () => {
    await driver.disconnect();
    await rm(dataDir, { recursive: true, force: true });
  });

  it('reports healthy once connected', async () => {
    expect(await driver.healthCheck()).toBe(true);
  });

  it('starts with the installer not completed', async () => {
    const state = await driver.installer.get();
    expect(state.completed).toBe(false);
    expect(state.storageDriver).toBeNull();
  });

  it('locks the installer as completed', async () => {
    const state = await driver.installer.complete('json');
    expect(state.completed).toBe(true);
    expect(state.storageDriver).toBe('json');
    expect(await driver.installer.get()).toEqual(state);
  });

  it('creates and retrieves a school', async () => {
    const school = await driver.schools.create({
      name: 'Liceo Galilei',
      address: null,
      contactEmail: 'info@liceogalilei.example',
      logoUrl: null,
      primaryColor: '#1a2b3c',
    });

    expect(school.id).toBeTruthy();
    expect(await driver.schools.findById(school.id)).toEqual(school);
  });

  it('updates a school and bumps updatedAt', async () => {
    const school = await driver.schools.create({
      name: 'Liceo Galilei',
      address: null,
      contactEmail: null,
      logoUrl: null,
      primaryColor: null,
    });

    const updated = await driver.schools.update(school.id, { name: 'Liceo Fermi' });
    expect(updated.name).toBe('Liceo Fermi');
    expect(updated.id).toBe(school.id);
  });

  it('deletes a school', async () => {
    const school = await driver.schools.create({
      name: 'Liceo Galilei',
      address: null,
      contactEmail: null,
      logoUrl: null,
      primaryColor: null,
    });

    await driver.schools.delete(school.id);
    expect(await driver.schools.findById(school.id)).toBeNull();
  });

  it('filters findMany by partial match', async () => {
    const schoolA = await driver.schools.create({
      name: 'School A',
      address: null,
      contactEmail: null,
      logoUrl: null,
      primaryColor: null,
    });
    await driver.schools.create({
      name: 'School B',
      address: null,
      contactEmail: null,
      logoUrl: null,
      primaryColor: null,
    });

    const results = await driver.schools.findMany({ name: 'School A' });
    expect(results).toEqual([schoolA]);
  });

  it('rejects invalid data at the storage boundary', async () => {
    await expect(
      driver.schools.create({
        name: '',
        address: null,
        contactEmail: null,
        logoUrl: null,
        primaryColor: null,
      }),
    ).rejects.toThrow();
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
    expect(reviewed.reviewedAt).toBeTruthy();
  });

  it('persists audit log entries append-only', async () => {
    const school = await driver.schools.create({
      name: 'School',
      address: null,
      contactEmail: null,
      logoUrl: null,
      primaryColor: null,
    });
    const user = await driver.users.create({
      schoolId: school.id,
      role: 'school_admin',
      email: 'admin@example.com',
      fullName: 'Admin',
      passwordHash: 'hash',
      totpSecret: null,
      isActive: true,
      lastLoginAt: null,
    });

    const entry = await driver.auditLog.create({
      actorId: user.id,
      action: 'update',
      entityKind: 'grade',
      entityId: '22222222-2222-2222-2222-222222222222',
      before: { value: 6 },
      after: { value: 7 },
    });

    expect(await driver.auditLog.findById(entry.id)).toEqual(entry);
    expect('update' in driver.auditLog).toBe(false);
  });
});
