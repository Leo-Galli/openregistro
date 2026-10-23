import type { Session } from 'next-auth';
import type { Announcement, UserId } from '@openregistro/core';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { Paperclip } from 'lucide-react';
import { auth } from '@/auth';
import { can, requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { CreateAnnouncementDialog } from '@/components/announcements/create-announcement-dialog';
import { MarkReadOnView } from '@/components/announcements/mark-read-on-view';

export const dynamic = 'force-dynamic';

async function visibleAnnouncements(
  storage: Awaited<ReturnType<typeof getStorage>>,
  session: Session,
): Promise<Announcement[]> {
  const all = await storage.announcements.findMany();

  if (can(session, 'announcements:write')) {
    return all.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

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
  const classIds = new Set(enrollments.map((e) => e.classId));

  return all
    .filter((announcement) => announcement.classId === null || classIds.has(announcement.classId))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export default async function AnnouncementsPage() {
  const session = await auth();
  requirePermission(session!, 'announcements:read');

  const storage = await getStorage();
  const schoolId = schoolIdOf(session!);
  const announcements = await visibleAnnouncements(storage, session!);

  const classIds = [
    ...new Set(
      announcements.map((a) => a.classId).filter((id): id is NonNullable<typeof id> => id !== null),
    ),
  ];
  const authorIds = [...new Set(announcements.map((a) => a.authorId))];
  const [classes, authors] = await Promise.all([
    Promise.all(classIds.map((id) => storage.classes.findById(id))),
    Promise.all(authorIds.map((id) => storage.users.findById(id))),
  ]);
  const classesById = new Map(
    classes.filter((c): c is NonNullable<typeof c> => c !== null).map((c) => [c.id, c]),
  );
  const authorsById = new Map(
    authors.filter((u): u is NonNullable<typeof u> => u !== null).map((u) => [u.id, u]),
  );

  const canWrite = can(session!, 'announcements:write');
  const readReceiptsByAnnouncement = new Map(
    await Promise.all(
      announcements.map(
        async (a) =>
          [
            a.id,
            await storage.announcementReadReceipts.findMany({ announcementId: a.id }),
          ] as const,
      ),
    ),
  );
  const allClasses = canWrite
    ? (await storage.classes.findMany())
        .filter((c) => c.schoolId === schoolId)
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Announcements</h1>
        {canWrite ? <CreateAnnouncementDialog classes={allClasses} /> : null}
      </div>

      {announcements.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No announcements yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((announcement) => {
            const readReceipts = readReceiptsByAnnouncement.get(announcement.id) ?? [];
            const alreadyRead = readReceipts.some((r) => r.userId === userIdOf(session!));
            return (
              <Card key={announcement.id}>
                {!alreadyRead ? <MarkReadOnView announcementId={announcement.id} /> : null}
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{announcement.title}</CardTitle>
                    {!alreadyRead ? <Badge>New</Badge> : null}
                  </div>
                  <CardDescription>
                    {authorsById.get(announcement.authorId)?.fullName ?? 'Unknown'} ·{' '}
                    {announcement.classId
                      ? (classesById.get(announcement.classId)?.name ?? 'Class')
                      : 'Whole school'}{' '}
                    · {announcement.publishedAt.slice(0, 10)}
                    {canWrite ? ` · Read by ${readReceipts.length}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="whitespace-pre-wrap text-sm">{announcement.body}</p>
                  {announcement.attachments.map((attachment) => (
                    <a
                      key={attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex w-fit items-center gap-1.5 text-sm text-primary underline"
                    >
                      <Paperclip className="h-4 w-4" /> {attachment.fileName}
                    </a>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
