import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJsonStorageDriver } from '@openregistro/db';
import type { StorageDriver } from '@openregistro/core';
import { seedDemoData } from './seed-demo';

describe('seedDemoData', () => {
  let dataDir: string;
  let storage: StorageDriver;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), 'openregistro-seed-'));
    storage = createJsonStorageDriver({ dataDir });
    await storage.connect();
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('creates a fully linked demo dataset', async () => {
    await seedDemoData(storage);

    const [school] = await storage.schools.findMany();
    expect(school?.name).toBe('Istituto Comprensivo Demo');

    const students = await storage.users.findMany({ role: 'student' });
    const teachers = await storage.users.findMany({ role: 'teacher' });
    const guardians = await storage.users.findMany({ role: 'guardian' });
    expect(students).toHaveLength(3);
    expect(teachers).toHaveLength(1);
    expect(guardians).toHaveLength(3);

    for (const student of students) {
      const enrollments = await storage.enrollments.findMany({ studentId: student.id });
      expect(enrollments.length).toBeGreaterThan(0);
      const grades = await storage.grades.findMany({ studentId: student.id });
      expect(grades.length).toBeGreaterThan(0);
    }

    const announcements = await storage.announcements.findMany();
    expect(announcements.length).toBeGreaterThan(0);
  });

  it('is idempotent: running it twice does not duplicate the school', async () => {
    await seedDemoData(storage);
    await seedDemoData(storage);

    const schools = await storage.schools.findMany();
    expect(schools).toHaveLength(1);

    const students = await storage.users.findMany({ role: 'student' });
    expect(students).toHaveLength(3);
  });
});
