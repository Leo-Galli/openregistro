import Link from 'next/link';
import type { Session } from 'next-auth';
import type { Grade, SubjectId, UserId } from '@openregistro/core';
import { weightedAverage } from '@openregistro/core';
import {
  Badge,
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
import { can, requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

async function StudentGrades({ studentId, showName }: { studentId: UserId; showName: boolean }) {
  const storage = await getStorage();
  const student = await storage.users.findById(studentId);
  if (!student) return null;

  const enrollments = await storage.enrollments.findMany({ studentId });
  const activeEnrollment = enrollments.find((e) => !e.withdrawnAt);
  if (!activeEnrollment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{showName ? student.fullName : 'Grades'}</CardTitle>
          <CardDescription>Not currently enrolled in a class.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const klass = await storage.classes.findById(activeEnrollment.classId);
  if (!klass) return null;

  const terms = await storage.terms.findMany({ schoolYearId: klass.schoolYearId });
  const today = new Date().toISOString().slice(0, 10);
  const activeTerm =
    terms.find((term) => term.startDate <= today && today <= term.endDate) ?? terms[0];

  const assignments = await storage.teacherAssignments.findMany({ classId: klass.id });
  const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];
  const subjects = (
    await Promise.all(subjectIds.map((subjectId) => storage.subjects.findById(subjectId)))
  ).filter((subject): subject is NonNullable<typeof subject> => subject !== null);

  const gradesBySubject = activeTerm
    ? new Map(
        await Promise.all(
          subjects.map(
            async (subject) =>
              [
                subject.id,
                await storage.grades.findMany({
                  studentId,
                  classId: klass.id,
                  subjectId: subject.id,
                  termId: activeTerm.id,
                }),
              ] as const,
          ),
        ),
      )
    : new Map<SubjectId, Grade[]>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{showName ? student.fullName : 'Grades'}</CardTitle>
        <CardDescription>
          {klass.name}
          {activeTerm ? ` · ${activeTerm.label}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!activeTerm || subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Grades</TableHead>
                <TableHead>Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => {
                const subjectGrades = gradesBySubject.get(subject.id) ?? [];
                const average = weightedAverage(subjectGrades);
                return (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {subjectGrades.length === 0 ? (
                          <span className="text-sm text-muted-foreground">-</span>
                        ) : (
                          subjectGrades.map((grade) => (
                            <Badge key={grade.id} variant="outline">
                              {grade.value}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{average !== null ? average.toFixed(2) : '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

async function OwnOrChildrenGrades({ session }: { session: Session }) {
  const storage = await getStorage();
  const userId = userIdOf(session);

  let studentIds: UserId[] = [userId];
  if (session.user.role === 'guardian') {
    const guardianships = await storage.guardianships.findMany({ guardianId: userId });
    studentIds = guardianships.map((g) => g.studentId);
  }

  if (studentIds.length === 0) {
    return <p className="text-sm text-muted-foreground">No linked students yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {studentIds.map((studentId) => (
        <StudentGrades key={studentId} studentId={studentId} showName={studentIds.length > 1} />
      ))}
    </div>
  );
}

export default async function GradesPage() {
  const session = await auth();
  requirePermission(session!, 'grades:read');

  const showOwn = session!.user.role === 'student' || session!.user.role === 'guardian';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Grades</h1>
      </div>
      {showOwn ? (
        <OwnOrChildrenGrades session={session!} />
      ) : (
        <p className="text-sm text-muted-foreground">
          This read-only view is for students and guardians.
          {can(session!, 'grades:write') ? (
            <>
              {' '}
              Manage grades for your assigned classes in{' '}
              <Link href="/dashboard/gradebook" className="text-primary underline">
                Gradebook
              </Link>
              .
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}
