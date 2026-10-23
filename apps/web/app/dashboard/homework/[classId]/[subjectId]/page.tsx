import { notFound, redirect } from 'next/navigation';
import { classIdSchema, subjectIdSchema } from '@openregistro/core';
import {
  Button,
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
import { Trash2 } from 'lucide-react';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { CreateHomeworkDialog } from '@/components/homework/create-homework-dialog';
import { deleteHomework } from './actions';

export const dynamic = 'force-dynamic';

export default async function HomeworkSubjectPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string }>;
}) {
  const { classId, subjectId } = await params;
  const session = await auth();
  requirePermission(session!, 'homework:write');

  const parsedClassId = classIdSchema.safeParse(classId);
  const parsedSubjectId = subjectIdSchema.safeParse(subjectId);
  if (!parsedClassId.success || !parsedSubjectId.success) notFound();

  const storage = await getStorage();
  const schoolId = schoolIdOf(session!);
  const teacherId = userIdOf(session!);

  const [klass, subject] = await Promise.all([
    storage.classes.findById(parsedClassId.data),
    storage.subjects.findById(parsedSubjectId.data),
  ]);
  if (!klass || !subject || klass.schoolId !== schoolId) notFound();

  const assignments = await storage.teacherAssignments.findMany({
    teacherId,
    classId: klass.id,
    subjectId: subject.id,
  });
  if (assignments.length === 0 && session!.user.role !== 'school_admin') {
    redirect('/forbidden');
  }

  const homework = (
    await storage.homeworkAssignments.findMany({ classId: klass.id, subjectId: subject.id })
  ).sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {subject.name} <span className="text-muted-foreground">· {klass.name}</span>
          </h1>
        </div>
        <CreateHomeworkDialog classId={klass.id} subjectId={subject.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>
            Homework you have assigned to this class for this subject.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {homework.length === 0 ? (
            <p className="text-sm text-muted-foreground">No homework assigned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {homework.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <p className="font-medium">{assignment.title}</p>
                      {assignment.description ? (
                        <p className="text-sm text-muted-foreground">{assignment.description}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{assignment.assignedDate}</TableCell>
                    <TableCell>{assignment.dueDate}</TableCell>
                    <TableCell>
                      <form action={deleteHomework}>
                        <input type="hidden" name="homeworkAssignmentId" value={assignment.id} />
                        <input type="hidden" name="classId" value={klass.id} />
                        <input type="hidden" name="subjectId" value={subject.id} />
                        <Button type="submit" size="sm" variant="ghost" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </TableCell>
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
