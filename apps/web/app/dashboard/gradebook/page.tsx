import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

export default async function GradebookIndexPage() {
  const session = await auth();
  requirePermission(session!, 'grades:write');

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Gradebook</h1>
        <p className="text-sm text-muted-foreground">Enter grades for your classes.</p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          You are not assigned to teach any subject yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={`${entry.classId}-${entry.subjectId}`}
              href={`/dashboard/gradebook/${entry.classId}/${entry.subjectId}`}
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
      )}
    </div>
  );
}
