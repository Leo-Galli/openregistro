import { notFound, redirect } from 'next/navigation';
import { classIdSchema, hasAnyPermission } from '@openregistro/core';
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
import { schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { AddNoteDialog } from '@/components/discipline/add-note-dialog';

export const dynamic = 'force-dynamic';

export default async function DisciplineClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const session = await auth();
  if (!session || !hasAnyPermission(session.user.role, ['register:write', 'records:manage'])) {
    redirect('/forbidden');
  }

  const parsedClassId = classIdSchema.safeParse(classId);
  if (!parsedClassId.success) notFound();

  const storage = await getStorage();
  const schoolId = schoolIdOf(session);
  const teacherId = userIdOf(session);
  const klass = await storage.classes.findById(parsedClassId.data);
  if (!klass || klass.schoolId !== schoolId) notFound();

  if (session.user.role === 'teacher') {
    const assignments = await storage.teacherAssignments.findMany({
      teacherId,
      classId: klass.id,
    });
    if (assignments.length === 0) redirect('/forbidden');
  }

  const enrollments = await storage.enrollments.findMany({ classId: klass.id });
  const activeStudentIds = enrollments.filter((e) => !e.withdrawnAt).map((e) => e.studentId);
  const students = (
    await Promise.all(activeStudentIds.map((id) => storage.users.findById(id)))
  ).filter((student): student is NonNullable<typeof student> => student !== null);

  const notes = (await storage.disciplinaryNotes.findMany({ classId: klass.id })).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const studentsById = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold">{klass.name} disciplinary notes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>
          ) : (
            students.map((student) => (
              <div key={student.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{student.fullName}</span>
                <AddNoteDialog
                  classId={klass.id}
                  studentId={student.id}
                  studentName={student.fullName}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>A permanent record - notes cannot be edited or deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{note.date}</TableCell>
                    <TableCell className="font-medium">
                      {studentsById.get(note.studentId)?.fullName ?? 'Unknown'}
                    </TableCell>
                    <TableCell>{note.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
