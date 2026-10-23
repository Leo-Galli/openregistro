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
import type { Session } from 'next-auth';
import type { UserId } from '@openregistro/core';
import { auth } from '@/auth';
import { can, requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { JustifyDialog } from '@/components/attendance/justify-dialog';
import { ReviewActions } from '@/components/attendance/review-actions';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  early_leave: 'Early leave',
};

async function OwnOrChildrenAttendance({ session }: { session: Session }) {
  const storage = await getStorage();
  const userId = userIdOf(session);

  let studentIds: UserId[] = [userId];
  if (session.user.role === 'guardian') {
    const guardianships = await storage.guardianships.findMany({ guardianId: userId });
    studentIds = guardianships.map((g) => g.studentId);
  }

  const studentsById = new Map(
    (await Promise.all(studentIds.map((id) => storage.users.findById(id))))
      .filter((student): student is NonNullable<typeof student> => student !== null)
      .map((student) => [student.id, student]),
  );

  const allRecords = (
    await Promise.all(studentIds.map((id) => storage.attendanceRecords.findMany({ studentId: id })))
  )
    .flat()
    .filter((record) => record.status !== 'present')
    .sort((a, b) => b.date.localeCompare(a.date));

  const allJustifications = await storage.absenceJustifications.findMany();
  const justificationByRecord = new Map(allJustifications.map((j) => [j.attendanceRecordId, j]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>Absences, late arrivals, and early leaves.</CardDescription>
      </CardHeader>
      <CardContent>
        {allRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">No absences or late arrivals recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {studentIds.length > 1 ? <TableHead>Student</TableHead> : null}
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Justification</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRecords.map((record) => {
                const justification = justificationByRecord.get(record.id);
                return (
                  <TableRow key={record.id}>
                    {studentIds.length > 1 ? (
                      <TableCell>
                        {studentsById.get(record.studentId)?.fullName ?? 'Unknown'}
                      </TableCell>
                    ) : null}
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{STATUS_LABELS[record.status]}</TableCell>
                    <TableCell>
                      {justification ? (
                        <Badge
                          variant={
                            justification.status === 'approved'
                              ? 'success'
                              : justification.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {justification.status}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.status === 'absent' && !justification ? (
                        <JustifyDialog attendanceRecordId={record.id} date={record.date} />
                      ) : null}
                    </TableCell>
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

async function PendingJustificationsReview() {
  const storage = await getStorage();
  const pending = (await storage.absenceJustifications.findMany({ status: 'pending' })).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );

  const records = await Promise.all(
    pending.map((justification) =>
      storage.attendanceRecords.findById(justification.attendanceRecordId),
    ),
  );
  const submitters = await Promise.all(
    pending.map((justification) => storage.users.findById(justification.submittedBy)),
  );
  const students = await Promise.all(
    records.map((record) => (record ? storage.users.findById(record.studentId) : null)),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending justifications</CardTitle>
        <CardDescription>Review absence justifications submitted by families.</CardDescription>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending justifications.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Submitted by</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((justification, index) => (
                <TableRow key={justification.id}>
                  <TableCell className="font-medium">
                    {students[index]?.fullName ?? 'Unknown'}
                  </TableCell>
                  <TableCell>{records[index]?.date ?? '-'}</TableCell>
                  <TableCell>{submitters[index]?.fullName ?? 'Unknown'}</TableCell>
                  <TableCell className="max-w-xs truncate" title={justification.reason}>
                    {justification.reason}
                  </TableCell>
                  <TableCell>
                    <ReviewActions justificationId={justification.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AttendancePage() {
  const session = await auth();
  requirePermission(session!, 'attendance:read');

  const showReview = can(session!, 'attendance:review');
  const showOwn = session!.user.role === 'student' || session!.user.role === 'guardian';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Attendance</h1>
      </div>
      {showReview ? <PendingJustificationsReview /> : null}
      {showOwn ? <OwnOrChildrenAttendance session={session!} /> : null}
      {!showReview && !showOwn ? (
        <p className="text-sm text-muted-foreground">Nothing to show here for your role yet.</p>
      ) : null}
    </div>
  );
}
