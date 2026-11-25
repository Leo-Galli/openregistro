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
import { userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

type SubjectAverage = {
  subjectId: SubjectId;
  subjectName: string;
  average: number | null;
  gradeCount: number;
};

type StudentSnapshot = {
  studentId: UserId;
  studentName: string;
  className: string | null;
  termLabel: string | null;
  overallAverage: number | null;
  subjects: SubjectAverage[];
  absenceCount: number;
  unjustifiedAbsenceCount: number;
  upcomingHomework: { id: string; title: string; dueDate: string; subjectName: string }[];
  recentAnnouncements: { id: string; title: string; publishedAt: string; unread: boolean }[];
};

async function loadStudentSnapshot(
  studentId: UserId,
  viewerId: UserId,
): Promise<StudentSnapshot | null> {
  const storage = await getStorage();
  const student = await storage.users.findById(studentId);
  if (!student) return null;

  const enrollments = await storage.enrollments.findMany({ studentId });
  const activeEnrollment = enrollments.find((e) => !e.withdrawnAt);
  const klass = activeEnrollment ? await storage.classes.findById(activeEnrollment.classId) : null;

  const today = new Date().toISOString().slice(0, 10);
  const terms = klass ? await storage.terms.findMany({ schoolYearId: klass.schoolYearId }) : [];
  const activeTerm =
    terms.find((term) => term.startDate <= today && today <= term.endDate) ?? terms[0] ?? null;

  const assignments = klass ? await storage.teacherAssignments.findMany({ classId: klass.id }) : [];
  const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];
  const subjects = (
    await Promise.all(subjectIds.map((id) => storage.subjects.findById(id)))
  ).filter((subject): subject is NonNullable<typeof subject> => subject !== null);

  const gradesBySubject = new Map<SubjectId, Grade[]>();
  if (klass && activeTerm) {
    await Promise.all(
      subjects.map(async (subject) => {
        const grades = await storage.grades.findMany({
          studentId,
          classId: klass.id,
          subjectId: subject.id,
          termId: activeTerm.id,
        });
        gradesBySubject.set(subject.id, grades);
      }),
    );
  }

  const subjectAverages: SubjectAverage[] = subjects.map((subject) => {
    const grades = gradesBySubject.get(subject.id) ?? [];
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      average: weightedAverage(grades),
      gradeCount: grades.length,
    };
  });

  const averagesWithValues = subjectAverages
    .map((s) => s.average)
    .filter((avg): avg is number => avg !== null);
  const overallAverage =
    averagesWithValues.length > 0
      ? averagesWithValues.reduce((sum, value) => sum + value, 0) / averagesWithValues.length
      : null;

  const attendance = await storage.attendanceRecords.findMany({ studentId });
  const absences = attendance.filter((record) => record.status === 'absent');
  const justifications = await storage.absenceJustifications.findMany();
  const justifiedRecordIds = new Set(
    justifications.filter((j) => j.status === 'approved').map((j) => j.attendanceRecordId),
  );
  const unjustifiedAbsenceCount = absences.filter(
    (record) => !justifiedRecordIds.has(record.id),
  ).length;

  const homework = klass
    ? (await storage.homeworkAssignments.findMany({ classId: klass.id }))
        .filter((item) => item.dueDate >= today)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5)
    : [];
  const homeworkSubjects = (
    await Promise.all(homework.map((item) => storage.subjects.findById(item.subjectId)))
  ).filter((subject): subject is NonNullable<typeof subject> => subject !== null);
  const homeworkSubjectById = new Map(homeworkSubjects.map((s) => [s.id, s]));

  const allAnnouncements = await storage.announcements.findMany();
  const classIds = new Set(klass ? [klass.id] : []);
  const visible = allAnnouncements
    .filter((a) => a.classId === null || classIds.has(a.classId))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 5);
  const receipts = await Promise.all(
    visible.map((a) => storage.announcementReadReceipts.findMany({ announcementId: a.id })),
  );
  const recentAnnouncements = visible.map((announcement, index) => ({
    id: announcement.id,
    title: announcement.title,
    publishedAt: announcement.publishedAt.slice(0, 10),
    unread: !receipts[index]?.some((receipt) => receipt.userId === viewerId),
  }));

  return {
    studentId,
    studentName: student.fullName,
    className: klass?.name ?? null,
    termLabel: activeTerm?.label ?? null,
    overallAverage,
    subjects: subjectAverages,
    absenceCount: absences.length,
    unjustifiedAbsenceCount,
    upcomingHomework: homework.map((item) => ({
      id: item.id,
      title: item.title,
      dueDate: item.dueDate,
      subjectName: homeworkSubjectById.get(item.subjectId)?.name ?? 'Unknown',
    })),
    recentAnnouncements,
  };
}

function StudentSnapshotCards({
  snapshot,
  showName,
}: {
  snapshot: StudentSnapshot;
  showName: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">
          {showName ? snapshot.studentName : 'Your overview'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {[snapshot.className, snapshot.termLabel].filter(Boolean).join(' · ') ||
            'Not currently enrolled in a class'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Overall average</CardDescription>
            <CardTitle className="font-ui text-4xl tabular-nums">
              {snapshot.overallAverage !== null ? snapshot.overallAverage.toFixed(2) : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Absences</CardDescription>
            <CardTitle className="font-ui text-4xl tabular-nums">{snapshot.absenceCount}</CardTitle>
            <CardDescription>
              {snapshot.unjustifiedAbsenceCount} still need justification
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Upcoming homework</CardDescription>
            <CardTitle className="font-ui text-4xl tabular-nums">
              {snapshot.upcomingHomework.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subject averages</CardTitle>
            <CardDescription>
              Weighted averages for the active term.{' '}
              <Link href="/dashboard/grades" className="text-primary underline">
                Full grades
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects yet.</p>
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
                  {snapshot.subjects.map((subject) => (
                    <TableRow key={subject.subjectId}>
                      <TableCell className="font-medium">{subject.subjectName}</TableCell>
                      <TableCell className="tabular-nums">{subject.gradeCount}</TableCell>
                      <TableCell className="tabular-nums">
                        {subject.average !== null ? subject.average.toFixed(2) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Homework due soon</CardTitle>
              <CardDescription>
                <Link href="/dashboard/homework" className="text-primary underline">
                  All homework
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshot.upcomingHomework.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing due soon.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {snapshot.upcomingHomework.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <span>
                        <span className="font-medium">{item.title}</span>
                        <span className="block text-muted-foreground">{item.subjectName}</span>
                      </span>
                      <Badge variant="outline">{item.dueDate}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>
                <Link href="/dashboard/announcements" className="text-primary underline">
                  All announcements
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshot.recentAnnouncements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {snapshot.recentAnnouncements.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="font-medium">{item.title}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {item.unread ? <Badge>New</Badge> : null}
                        <span className="text-muted-foreground">{item.publishedAt}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export async function StudentHome({ session }: { session: Session }) {
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

  const snapshots = (
    await Promise.all(studentIds.map((id) => loadStudentSnapshot(id, userId)))
  ).filter((snapshot): snapshot is StudentSnapshot => snapshot !== null);

  return (
    <div className="flex flex-col gap-10">
      {snapshots.map((snapshot) => (
        <StudentSnapshotCards
          key={snapshot.studentId}
          snapshot={snapshot}
          showName={snapshots.length > 1}
        />
      ))}
    </div>
  );
}
