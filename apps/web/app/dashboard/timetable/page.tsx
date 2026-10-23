import Link from 'next/link';
import type { Session } from 'next-auth';
import type { ClassId, UserId } from '@openregistro/core';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { auth } from '@/auth';
import { can, requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

async function StaffTimetableIndex({ session }: { session: Session }) {
  const storage = await getStorage();
  const schoolId = schoolIdOf(session);
  const classes = (await storage.classes.findMany()).filter((c) => c.schoolId === schoolId);

  if (classes.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No classes yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((klass) => (
        <Link key={klass.id} href={`/dashboard/timetable/${klass.id}`}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>{klass.name}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function ClassTimetable({ classId, title }: { classId: ClassId; title: string }) {
  const storage = await getStorage();
  const slots = (await storage.timetableSlots.findMany({ classId })).sort(
    (a, b) => a.weekday - b.weekday || a.hourSlot - b.hourSlot,
  );

  const subjectIds = [...new Set(slots.map((s) => s.subjectId))];
  const teacherIds = [...new Set(slots.map((s) => s.teacherId))];
  const [subjects, teachers] = await Promise.all([
    Promise.all(subjectIds.map((id) => storage.subjects.findById(id))),
    Promise.all(teacherIds.map((id) => storage.users.findById(id))),
  ]);
  const subjectsById = new Map(
    subjects.filter((s): s is NonNullable<typeof s> => s !== null).map((s) => [s.id, s]),
  );
  const teachersById = new Map(
    teachers.filter((t): t is NonNullable<typeof t> => t !== null).map((t) => [t.id, t]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lessons scheduled yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Hour</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>{WEEKDAY_LABELS[slot.weekday]}</TableCell>
                  <TableCell>{slot.hourSlot}</TableCell>
                  <TableCell className="font-medium">
                    {subjectsById.get(slot.subjectId)?.name ?? 'Unknown'}
                  </TableCell>
                  <TableCell>{teachersById.get(slot.teacherId)?.fullName ?? 'Unknown'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

async function OwnOrChildrenTimetable({ session }: { session: Session }) {
  const storage = await getStorage();
  const userId = userIdOf(session);

  let studentIds: UserId[] = [userId];
  if (session.user.role === 'guardian') {
    const guardianships = await storage.guardianships.findMany({ guardianId: userId });
    studentIds = guardianships.map((g) => g.studentId);
  }

  const entries = await Promise.all(
    studentIds.map(async (studentId) => {
      const student = await storage.users.findById(studentId);
      const enrollments = await storage.enrollments.findMany({ studentId });
      const activeEnrollment = enrollments.find((e) => !e.withdrawnAt);
      const klass = activeEnrollment
        ? await storage.classes.findById(activeEnrollment.classId)
        : null;
      return { student, klass };
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      {entries.map(({ student, klass }) =>
        klass ? (
          <ClassTimetable
            key={klass.id}
            classId={klass.id}
            title={studentIds.length > 1 ? `${student?.fullName} - ${klass.name}` : klass.name}
          />
        ) : (
          <p key={student?.id ?? 'unknown'} className="text-sm text-muted-foreground">
            {student?.fullName ?? 'This student'} is not currently enrolled in a class.
          </p>
        ),
      )}
    </div>
  );
}

async function TeacherTimetable({ session }: { session: Session }) {
  const storage = await getStorage();
  const teacherId = userIdOf(session);
  const slots = (await storage.timetableSlots.findMany({ teacherId })).sort(
    (a, b) => a.weekday - b.weekday || a.hourSlot - b.hourSlot,
  );

  const classIds = [...new Set(slots.map((s) => s.classId))];
  const subjectIds = [...new Set(slots.map((s) => s.subjectId))];
  const [classes, subjects] = await Promise.all([
    Promise.all(classIds.map((id) => storage.classes.findById(id))),
    Promise.all(subjectIds.map((id) => storage.subjects.findById(id))),
  ]);
  const classesById = new Map(
    classes.filter((c): c is NonNullable<typeof c> => c !== null).map((c) => [c.id, c]),
  );
  const subjectsById = new Map(
    subjects.filter((s): s is NonNullable<typeof s> => s !== null).map((s) => [s.id, s]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lessons scheduled yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Hour</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>{WEEKDAY_LABELS[slot.weekday]}</TableCell>
                  <TableCell>{slot.hourSlot}</TableCell>
                  <TableCell className="font-medium">
                    {classesById.get(slot.classId)?.name ?? 'Unknown'}
                  </TableCell>
                  <TableCell>{subjectsById.get(slot.subjectId)?.name ?? 'Unknown'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default async function TimetablePage() {
  const session = await auth();
  requirePermission(session!, 'calendar:read');

  const canManage = can(session!, 'calendar:write');
  const showOwn = session!.user.role === 'student' || session!.user.role === 'guardian';
  const isTeacher = session!.user.role === 'teacher';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Timetable</h1>
        {canManage ? (
          <p className="text-sm text-muted-foreground">
            Select a class to edit its weekly schedule.
          </p>
        ) : null}
      </div>
      {canManage ? (
        <StaffTimetableIndex session={session!} />
      ) : showOwn ? (
        <OwnOrChildrenTimetable session={session!} />
      ) : isTeacher ? (
        <TeacherTimetable session={session!} />
      ) : null}
    </div>
  );
}
