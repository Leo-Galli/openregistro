import Link from 'next/link';
import type { Session } from 'next-auth';
import type { UserId } from '@openregistro/core';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@openregistro/ui';
import { Download } from 'lucide-react';
import { auth } from '@/auth';
import { can, requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

async function StaffReportCardIndex({ session }: { session: Session }) {
  const storage = await getStorage();
  const schoolId = schoolIdOf(session);

  const assignments =
    session.user.role === 'teacher'
      ? await storage.teacherAssignments.findMany({ teacherId: userIdOf(session) })
      : await storage.teacherAssignments.findMany();

  const seen = new Set<string>();
  const entries = (
    await Promise.all(
      assignments.map(async (assignment) => {
        const key = `${assignment.classId}-${assignment.subjectId}`;
        if (seen.has(key)) return null;
        seen.add(key);
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
        No class/subject assignments yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <Link
          key={`${entry.classId}-${entry.subjectId}`}
          href={`/dashboard/report-cards/${entry.classId}/${entry.subjectId}`}
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

async function OwnOrChildrenReportCards({ session }: { session: Session }) {
  const storage = await getStorage();
  const userId = userIdOf(session);

  let studentIds: UserId[] = [userId];
  if (session.user.role === 'guardian') {
    const guardianships = await storage.guardianships.findMany({ guardianId: userId });
    studentIds = guardianships.map((g) => g.studentId);
  }

  const students = (await Promise.all(studentIds.map((id) => storage.users.findById(id)))).filter(
    (student): student is NonNullable<typeof student> => student !== null,
  );

  return (
    <div className="flex flex-col gap-4">
      {students.map((student) => (
        <StudentTerms
          key={student.id}
          studentId={student.id}
          studentName={student.fullName}
          showName={students.length > 1}
        />
      ))}
    </div>
  );
}

async function StudentTerms({
  studentId,
  studentName,
  showName,
}: {
  studentId: string;
  studentName: string;
  showName: boolean;
}) {
  const storage = await getStorage();
  const enrollments = await storage.enrollments.findMany({ studentId: studentId as UserId });
  const activeEnrollment = enrollments.find((e) => !e.withdrawnAt);
  const klass = activeEnrollment ? await storage.classes.findById(activeEnrollment.classId) : null;
  const terms = klass ? await storage.terms.findMany({ schoolYearId: klass.schoolYearId }) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{showName ? studentName : 'Report cards'}</CardTitle>
        <CardDescription>{klass ? klass.name : 'Not currently enrolled.'}</CardDescription>
      </CardHeader>
      <CardContent>
        {terms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No terms available yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {terms.map((term) => (
              <li key={term.id} className="flex items-center justify-between gap-4">
                <span className="text-sm">{term.label}</span>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`/api/report-cards/${studentId}/${term.id}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function ReportCardsPage() {
  const session = await auth();
  requirePermission(session!, 'reports:read');

  const showOwn = session!.user.role === 'student' || session!.user.role === 'guardian';
  const canGenerate = can(session!, 'reports:generate');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Report cards</h1>
        {canGenerate ? (
          <p className="text-sm text-muted-foreground">Select a class to enter term evaluations.</p>
        ) : null}
      </div>
      {canGenerate ? (
        <StaffReportCardIndex session={session!} />
      ) : showOwn ? (
        <OwnOrChildrenReportCards session={session!} />
      ) : null}
    </div>
  );
}
