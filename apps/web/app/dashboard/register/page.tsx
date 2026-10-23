import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

export default async function RegisterIndexPage() {
  const session = await auth();
  requirePermission(session!, 'register:write');

  const storage = await getStorage();
  const schoolId = schoolIdOf(session!);
  const teacherId = userIdOf(session!);

  const assignments = await storage.teacherAssignments.findMany({ teacherId });
  const classIds = [...new Set(assignments.map((assignment) => assignment.classId))];
  const classes = (
    await Promise.all(classIds.map((classId) => storage.classes.findById(classId)))
  ).filter(
    (klass): klass is NonNullable<typeof klass> => klass !== null && klass.schoolId === schoolId,
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Class register</h1>
        <p className="text-sm text-muted-foreground">
          Take attendance and log today&apos;s lesson.
        </p>
      </div>

      {classes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          You are not assigned to any class yet. Ask an administrator to assign you in School &gt;
          Classes.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((klass) => (
            <Link key={klass.id} href={`/dashboard/register/${klass.id}?date=${today}`}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle>{klass.name}</CardTitle>
                  <CardDescription>Grade {klass.gradeLevel}</CardDescription>
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
