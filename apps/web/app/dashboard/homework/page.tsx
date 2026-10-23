import Link from 'next/link';
import type { Session } from 'next-auth';
import type { UserId } from '@openregistro/core';
import {
  Card,
  CardContent,
  CardDescription,
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

async function TeacherHomeworkIndex() {
  const session = await auth();
  const storage = await getStorage();
  const schoolId = schoolIdOf(session!);
  const teacherId = userIdOf(session!);

  const assignments = await storage.teacherAssignments.findMany({ teacherId });
  const entries = (
    await Promise.all(
      assignments.map(async (assignment) => {
        const [klass, subject] = await Promise.all([
          storage.classes.findById(assignment.classId),
          storage.subjects.findById(assignment.subjectId),
        ]);
        if (!klass || !subject || klass.schoolId !== schoolId) return null;
        return {
          classId: klass.id,
          className: klass.name,
          subjectId: subject.id,
          subjectName: subject.name,
        };
      }),
    )
  ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        You are not assigned to teach any subject yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <Link
          key={`${entry.classId}-${entry.subjectId}`}
          href={`/dashboard/homework/${entry.classId}/${entry.subjectId}`}
        >
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>{entry.className}</CardTitle>
              <CardDescription>{entry.subjectName}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function OwnOrChildrenHomework({ session }: { session: Session }) {
  const storage = await getStorage();
  const userId = userIdOf(session);

  let studentIds: UserId[] = [userId];
  if (session.user.role === 'guardian') {
    const guardianships = await storage.guardianships.findMany({ guardianId: userId });
    studentIds = guardianships.map((g) => g.studentId);
  }

  const enrollments = (
    await Promise.all(studentIds.map((id) => storage.enrollments.findMany({ studentId: id })))
  )
    .flat()
    .filter((e) => !e.withdrawnAt);

  const classIds = [...new Set(enrollments.map((e) => e.classId))];
  const assignments = (
    await Promise.all(classIds.map((classId) => storage.homeworkAssignments.findMany({ classId })))
  )
    .flat()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const subjectsById = new Map(
    (
      await Promise.all(
        [...new Set(assignments.map((a) => a.subjectId))].map((id) =>
          storage.subjects.findById(id),
        ),
      )
    )
      .filter((subject): subject is NonNullable<typeof subject> => subject !== null)
      .map((subject) => [subject.id, subject]),
  );

  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">No homework assigned.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homework</CardTitle>
        <CardDescription>Upcoming and past assignments, by due date.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Due date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium">
                  {subjectsById.get(assignment.subjectId)?.name ?? 'Unknown'}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{assignment.title}</p>
                  {assignment.description ? (
                    <p className="text-sm text-muted-foreground">{assignment.description}</p>
                  ) : null}
                </TableCell>
                <TableCell>{assignment.dueDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

async function SchoolWideHomework() {
  const storage = await getStorage();
  const assignments = (await storage.homeworkAssignments.findMany()).sort((a, b) =>
    b.dueDate.localeCompare(a.dueDate),
  );

  const classIds = [...new Set(assignments.map((a) => a.classId))];
  const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];
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

  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">No homework assigned yet.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All homework</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Due date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>{classesById.get(assignment.classId)?.name ?? 'Unknown'}</TableCell>
                <TableCell>{subjectsById.get(assignment.subjectId)?.name ?? 'Unknown'}</TableCell>
                <TableCell className="font-medium">{assignment.title}</TableCell>
                <TableCell>{assignment.dueDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function HomeworkPage() {
  const session = await auth();
  requirePermission(session!, 'homework:read');

  const showOwn = session!.user.role === 'student' || session!.user.role === 'guardian';
  const canWrite = can(session!, 'homework:write');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Homework</h1>
        {canWrite ? (
          <p className="text-sm text-muted-foreground">Select a class to add or review homework.</p>
        ) : null}
      </div>
      {canWrite ? (
        <TeacherHomeworkIndex />
      ) : showOwn ? (
        <OwnOrChildrenHomework session={session!} />
      ) : (
        <SchoolWideHomework />
      )}
    </div>
  );
}
