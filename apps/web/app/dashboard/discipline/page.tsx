import Link from 'next/link';
import type { Session } from 'next-auth';
import { hasAnyPermission, type UserId } from '@openregistro/core';
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
import { schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

async function StaffDisciplineIndex({ session }: { session: Session }) {
  const storage = await getStorage();
  const schoolId = schoolIdOf(session);

  const classes =
    session.user.role === 'teacher'
      ? await (async () => {
          const assignments = await storage.teacherAssignments.findMany({
            teacherId: userIdOf(session),
          });
          const classIds = [...new Set(assignments.map((a) => a.classId))];
          const found = await Promise.all(classIds.map((id) => storage.classes.findById(id)));
          return found.filter((c): c is NonNullable<typeof c> => c !== null);
        })()
      : (await storage.classes.findMany()).filter((c) => c.schoolId === schoolId);

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
        <Link key={klass.id} href={`/dashboard/discipline/${klass.id}`}>
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

async function OwnOrChildrenNotes({ session }: { session: Session }) {
  const storage = await getStorage();
  const userId = userIdOf(session);

  let studentIds: UserId[] = [userId];
  if (session.user.role === 'guardian') {
    const guardianships = await storage.guardianships.findMany({ guardianId: userId });
    studentIds = guardianships.map((g) => g.studentId);
  }

  const notes = (
    await Promise.all(studentIds.map((id) => storage.disciplinaryNotes.findMany({ studentId: id })))
  )
    .flat()
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>{note.date}</TableCell>
                  <TableCell>{note.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DisciplinePage() {
  const session = await auth();
  const canWrite =
    !!session && hasAnyPermission(session.user.role, ['register:write', 'records:manage']);
  const showOwn = session?.user.role === 'student' || session?.user.role === 'guardian';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Disciplinary notes</h1>
        {canWrite ? (
          <p className="text-sm text-muted-foreground">Select a class to add or review notes.</p>
        ) : null}
      </div>
      {canWrite ? (
        <StaffDisciplineIndex session={session!} />
      ) : showOwn ? (
        <OwnOrChildrenNotes session={session!} />
      ) : (
        <p className="text-sm text-muted-foreground">Nothing to show here for your role.</p>
      )}
    </div>
  );
}
