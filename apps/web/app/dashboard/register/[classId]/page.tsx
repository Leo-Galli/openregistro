import { notFound, redirect } from 'next/navigation';
import { classIdSchema } from '@openregistro/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { LessonLogForm } from '@/components/register/lesson-log-form';
import { AttendanceGrid } from '@/components/register/attendance-grid';
import { DatePicker } from '@/components/date-picker';

export const dynamic = 'force-dynamic';

export default async function ClassRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { classId } = await params;
  const { date } = await searchParams;
  const session = await auth();
  requirePermission(session!, 'register:write');

  const parsedClassId = classIdSchema.safeParse(classId);
  if (!parsedClassId.success) notFound();

  const storage = await getStorage();
  const schoolId = schoolIdOf(session!);
  const teacherId = userIdOf(session!);

  const klass = await storage.classes.findById(parsedClassId.data);
  if (!klass || klass.schoolId !== schoolId) notFound();

  const assignments = await storage.teacherAssignments.findMany({ teacherId, classId: klass.id });
  if (assignments.length === 0 && session!.user.role !== 'school_admin') {
    redirect('/forbidden');
  }

  const effectiveDate = date ?? new Date().toISOString().slice(0, 10);

  const [subjects, enrollments, attendanceRecords, lessonLogs] = await Promise.all([
    Promise.all(assignments.map((assignment) => storage.subjects.findById(assignment.subjectId))),
    storage.enrollments.findMany({ classId: klass.id }),
    storage.attendanceRecords.findMany({ classId: klass.id, date: effectiveDate }),
    storage.lessonLogs.findMany({ classId: klass.id, date: effectiveDate }),
  ]);

  const activeStudentIds = enrollments.filter((e) => !e.withdrawnAt).map((e) => e.studentId);
  const students = (
    await Promise.all(activeStudentIds.map((studentId) => storage.users.findById(studentId)))
  ).filter((student): student is NonNullable<typeof student> => student !== null);

  const subjectOptions = subjects
    .filter((subject): subject is NonNullable<typeof subject> => subject !== null)
    .map((subject) => ({ id: subject.id, label: subject.name }));

  const subjectsById = new Map(subjectOptions.map((subject) => [subject.id, subject.label]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{klass.name}</h1>
          <p className="text-sm text-muted-foreground">Grade {klass.gradeLevel}</p>
        </div>
        <DatePicker date={effectiveDate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson log</CardTitle>
          <CardDescription>Log what was covered and sign this period.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {lessonLogs.length > 0 ? (
            <ul className="flex flex-col gap-2 rounded-md border-2 border-border bg-muted/40 p-4 text-sm">
              {lessonLogs.map((log) => (
                <li key={log.id}>
                  <span className="font-medium">
                    Hour {log.hourSlot} · {subjectsById.get(log.subjectId) ?? 'Subject'}
                  </span>
                  <p className="text-muted-foreground">{log.topic}</p>
                </li>
              ))}
            </ul>
          ) : null}
          {subjectOptions.length > 0 ? (
            <LessonLogForm classId={klass.id} date={effectiveDate} subjects={subjectOptions} />
          ) : (
            <p className="text-sm text-muted-foreground">
              You have no subjects assigned in this class yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>
            Mark each student present, absent, late, or leaving early.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceGrid
            classId={klass.id}
            date={effectiveDate}
            students={students.map((student) => ({ id: student.id, fullName: student.fullName }))}
            existingRecords={attendanceRecords.map((record) => ({
              studentId: record.studentId,
              status: record.status,
              minutesLate: record.minutesLate,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
