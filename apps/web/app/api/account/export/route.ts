import { NextResponse } from 'next/server';
import { toPublicUser } from '@openregistro/core';
import { auth } from '@/auth';
import { userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * Self-service personal data export (GDPR Article 15/20): every user can
 * download the records where they are the subject, scoped to their own
 * account only - this is not an admin tool and never takes another user's
 * id as input.
 */
export async function GET() {
  const session = await auth();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const storage = await getStorage();
  const userId = userIdOf(session);
  const user = await storage.users.findById(userId);
  if (!user) return new NextResponse('Not found', { status: 404 });

  const [
    guardianships,
    submittedJustifications,
    announcementReadReceipts,
    grades,
    attendanceRecords,
    termEvaluations,
    lessonLogs,
    teacherAssignments,
  ] = await Promise.all([
    storage.guardianships.findMany({ guardianId: userId }),
    storage.absenceJustifications.findMany({ submittedBy: userId }),
    storage.announcementReadReceipts.findMany({ userId }),
    storage.grades.findMany({ studentId: userId }),
    storage.attendanceRecords.findMany({ studentId: userId }),
    storage.termEvaluations.findMany({ studentId: userId }),
    storage.lessonLogs.findMany({ teacherId: userId }),
    storage.teacherAssignments.findMany({ teacherId: userId }),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    profile: toPublicUser(user),
    guardianships,
    absenceJustificationsSubmitted: submittedJustifications,
    announcementReadReceipts,
    grades,
    attendanceRecords,
    termEvaluations,
    lessonLogsAuthored: lessonLogs,
    teacherAssignments,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="my-data-export.json"',
    },
  });
}
