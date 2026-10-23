'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  canTeacherActOnClassSubject,
  classIdSchema,
  subjectIdSchema,
  userIdSchema,
  attendanceStatusSchema,
} from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const lessonLogSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  date: z.string().date(),
  hourSlot: z.coerce.number().int().min(1).max(12),
  topic: z.string().min(1, 'Required').max(2000),
});

export interface LessonLogFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'topic' | 'subjectId' | 'hourSlot', string>>;
  formError?: string;
}

export async function saveLessonLog(
  _prevState: LessonLogFormState,
  formData: FormData,
): Promise<LessonLogFormState> {
  const session = await auth();
  requirePermission(session!, 'register:write');
  const teacherId = userIdOf(session!);

  const parsed = lessonLogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: LessonLogFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as 'topic' | 'subjectId' | 'hourSlot'] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    const classId = classIdSchema.parse(parsed.data.classId);
    const subjectId = subjectIdSchema.parse(parsed.data.subjectId);

    const assignments = await storage.teacherAssignments.findMany({ teacherId, classId });
    if (!canTeacherActOnClassSubject(assignments, teacherId, classId, subjectId)) {
      return { ok: false, formError: 'You are not assigned to teach this subject in this class.' };
    }

    await storage.lessonLogs.create({
      classId,
      subjectId,
      teacherId,
      date: parsed.data.date,
      hourSlot: parsed.data.hourSlot,
      topic: parsed.data.topic,
    });

    revalidatePath(`/dashboard/register/${classId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the lesson log.',
    };
  }
}

const attendanceEntrySchema = z.object({
  studentId: z.string().uuid(),
  status: attendanceStatusSchema,
  minutesLate: z.number().int().min(0).max(600).nullable(),
});

const attendancePayloadSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().date(),
  entries: z.array(attendanceEntrySchema).min(1),
});

export interface SaveAttendanceState {
  ok: boolean;
  formError?: string;
}

export async function saveAttendance(
  payload: z.infer<typeof attendancePayloadSchema>,
): Promise<SaveAttendanceState> {
  const session = await auth();
  requirePermission(session!, 'attendance:write');
  const recordedBy = userIdOf(session!);

  const parsed = attendancePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, formError: 'Invalid attendance data.' };
  }

  try {
    const storage = await getStorage();
    const classId = classIdSchema.parse(parsed.data.classId);
    const klass = await storage.classes.findById(classId);
    if (!klass) return { ok: false, formError: 'Class not found.' };

    const existing = await storage.attendanceRecords.findMany({ classId, date: parsed.data.date });
    const existingByStudent = new Map(existing.map((record) => [record.studentId, record]));

    for (const entry of parsed.data.entries) {
      const studentId = userIdSchema.parse(entry.studentId);
      const current = existingByStudent.get(studentId);
      if (current) {
        await storage.attendanceRecords.update(current.id, {
          status: entry.status,
          minutesLate: entry.status === 'late' ? entry.minutesLate : null,
        });
      } else {
        await storage.attendanceRecords.create({
          studentId,
          classId,
          date: parsed.data.date,
          status: entry.status,
          minutesLate: entry.status === 'late' ? entry.minutesLate : null,
          recordedBy,
        });
      }
    }

    revalidatePath(`/dashboard/register/${classId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save attendance.',
    };
  }
}
