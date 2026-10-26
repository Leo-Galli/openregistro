import type { StorageDriver } from '@openregistro/core';
import { hashPassword } from './password';

const DEMO_PASSWORD = 'DemoPassword123!';

/**
 * Realistic but clearly fictional data: every person uses a @demo.openregistro.local
 * email address and no name corresponds to a real individual. Safe to run against a
 * public demo instance (paired with scripts/demo-reset.sh) or a fresh self-hosted
 * install that opted into "load demo data" in the setup wizard.
 */
export async function seedDemoData(storage: StorageDriver): Promise<void> {
  let [school] = await storage.schools.findMany();
  if (!school) {
    school = await storage.schools.create({
      name: 'Istituto Comprensivo Demo',
      address: 'Via Esempio 1, 00100 Roma',
      contactEmail: 'segreteria@demo.openregistro.local',
      logoUrl: null,
      // Deliberately distinct from the default ink-blue so the public demo
      // visibly demonstrates per-school brand color customization.
      primaryColor: '#0d7a6b',
      // Demo guardian accounts use fake @demo.openregistro.local addresses -
      // never send real platform email to them (it would just bounce).
      usePlatformEmail: false,
    });
  }

  let [schoolYear] = await storage.schoolYears.findMany({ schoolId: school.id });
  if (!schoolYear) {
    schoolYear = await storage.schoolYears.create({
      schoolId: school.id,
      label: '2025/2026',
      startDate: '2025-09-15',
      endDate: '2026-06-10',
      isActive: true,
    });
  }

  const existingTerms = await storage.terms.findMany({ schoolYearId: schoolYear.id });
  const term =
    existingTerms[0] ??
    (await storage.terms.create({
      schoolYearId: schoolYear.id,
      kind: 'trimester',
      label: 'First trimester',
      sequence: 1,
      startDate: '2025-09-15',
      endDate: '2025-12-20',
    }));

  const demoPasswordHash = await hashPassword(DEMO_PASSWORD);

  const admin =
    (await storage.users.findMany({ email: 'admin@demo.openregistro.local' }))[0] ??
    (await storage.users.create({
      schoolId: school.id,
      role: 'school_admin',
      email: 'admin@demo.openregistro.local',
      fullName: 'Admin Demo',
      passwordHash: demoPasswordHash,
      totpSecret: null,
      isActive: true,
      lastLoginAt: null,
    }));

  const klass =
    (await storage.classes.findMany({ schoolId: school.id }))[0] ??
    (await storage.classes.create({
      schoolId: school.id,
      schoolYearId: schoolYear.id,
      name: '3A',
      gradeLevel: 8,
    }));

  const mathSubject =
    (await storage.subjects.findMany({ schoolId: school.id, name: 'Mathematics' }))[0] ??
    (await storage.subjects.create({
      schoolId: school.id,
      name: 'Mathematics',
      shortCode: 'MATH',
    }));

  const literatureSubject =
    (await storage.subjects.findMany({ schoolId: school.id, name: 'Italian Literature' }))[0] ??
    (await storage.subjects.create({
      schoolId: school.id,
      name: 'Italian Literature',
      shortCode: 'ITA',
    }));

  const teacher =
    (await storage.users.findMany({ email: 'teacher@demo.openregistro.local' }))[0] ??
    (await storage.users.create({
      schoolId: school.id,
      role: 'teacher',
      email: 'teacher@demo.openregistro.local',
      fullName: 'Giulia Romano',
      passwordHash: demoPasswordHash,
      totpSecret: null,
      isActive: true,
      lastLoginAt: null,
    }));

  await storage.teacherAssignments.create({
    teacherId: teacher.id,
    classId: klass.id,
    subjectId: mathSubject.id,
    weeklyHours: 4,
  });

  const studentNames = ['Marco Esposito', 'Sara Conti', 'Luca Ferrari'];
  const students = [];
  for (const [index, fullName] of studentNames.entries()) {
    const email = `student${index + 1}@demo.openregistro.local`;
    const student =
      (await storage.users.findMany({ email }))[0] ??
      (await storage.users.create({
        schoolId: school.id,
        role: 'student',
        email,
        fullName,
        passwordHash: demoPasswordHash,
        totpSecret: null,
        isActive: true,
        lastLoginAt: null,
      }));
    students.push(student);

    const alreadyEnrolled =
      (await storage.enrollments.findMany({ studentId: student.id })).length > 0;
    if (!alreadyEnrolled) {
      await storage.enrollments.create({
        studentId: student.id,
        classId: klass.id,
        schoolYearId: schoolYear.id,
        enrolledAt: schoolYear.startDate,
        withdrawnAt: null,
      });
    }

    const guardianEmail = `guardian${index + 1}@demo.openregistro.local`;
    const guardian =
      (await storage.users.findMany({ email: guardianEmail }))[0] ??
      (await storage.users.create({
        schoolId: school.id,
        role: 'guardian',
        email: guardianEmail,
        fullName: `${fullName.split(' ')[1]} ${fullName.split(' ')[0]} (genitore)`,
        passwordHash: demoPasswordHash,
        totpSecret: null,
        isActive: true,
        lastLoginAt: null,
      }));

    const alreadyLinked =
      (await storage.guardianships.findMany({ guardianId: guardian.id, studentId: student.id }))
        .length > 0;
    if (!alreadyLinked) {
      await storage.guardianships.create({
        guardianId: guardian.id,
        studentId: student.id,
        relationship: 'parent',
        isPrimaryContact: true,
      });
    }

    await storage.grades.create({
      studentId: student.id,
      classId: klass.id,
      subjectId: mathSubject.id,
      termId: term.id,
      teacherId: teacher.id,
      type: 'written',
      value: 7 + index * 0.5,
      weight: 1,
      date: '2025-10-10',
      note: null,
    });

    await storage.attendanceRecords.create({
      studentId: student.id,
      classId: klass.id,
      date: '2025-10-13',
      status: index === 0 ? 'absent' : 'present',
      minutesLate: null,
      recordedBy: teacher.id,
    });
  }

  await storage.lessonLogs.create({
    classId: klass.id,
    subjectId: literatureSubject.id,
    teacherId: teacher.id,
    date: '2025-10-13',
    hourSlot: 2,
    topic: 'Introduction to Dante’s Inferno, Canto I',
  });

  await storage.homeworkAssignments.create({
    classId: klass.id,
    subjectId: mathSubject.id,
    teacherId: teacher.id,
    title: 'Exercises on linear equations',
    description: 'Textbook page 42, exercises 1 through 10.',
    assignedDate: '2025-10-13',
    dueDate: '2025-10-20',
  });

  await storage.announcements.create({
    schoolId: school.id,
    classId: null,
    authorId: teacher.id,
    title: 'Parent-teacher meetings next week',
    body: 'Booking slots will open on the meetings page starting Monday.',
    attachments: [],
  });

  await storage.timetableSlots.create({
    classId: klass.id,
    subjectId: mathSubject.id,
    teacherId: teacher.id,
    weekday: 1,
    hourSlot: 1,
  });

  await storage.calendarEvents.create({
    classId: null,
    subjectId: null,
    type: 'test',
    title: 'Mathematics test - linear equations',
    description: 'Covers chapter 3: solving and graphing linear equations.',
    date: '2025-10-27',
    createdBy: admin.id,
  });

  await storage.meetingSlots.create({
    teacherId: teacher.id,
    startsAt: '2025-10-27T15:00:00.000Z',
    endsAt: '2025-10-27T15:20:00.000Z',
    location: 'Room 12',
    capacity: 2,
  });

  await storage.disciplinaryNotes.create({
    studentId: students[0]!.id,
    classId: klass.id,
    authorId: teacher.id,
    date: '2025-10-14',
    description: 'Arrived 10 minutes late to class without a justification.',
  });
}
