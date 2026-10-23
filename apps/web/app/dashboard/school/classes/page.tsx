import Link from 'next/link';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { auth } from '@/auth';
import { schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { CreateClassDialog } from '@/components/school/create-class-dialog';

export default async function ClassesPage() {
  const session = await auth();
  const schoolId = schoolIdOf(session!);
  const storage = await getStorage();
  const classes = await storage.classes.findMany({ schoolId });
  const enrollments = await storage.enrollments.findMany();

  const rosterSizeByClass = new Map<string, number>();
  for (const enrollment of enrollments) {
    if (enrollment.withdrawnAt) continue;
    rosterSizeByClass.set(enrollment.classId, (rosterSizeByClass.get(enrollment.classId) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateClassDialog />
      </div>

      {classes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No classes yet. Create your first class to start enrolling students.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Grade level</TableHead>
              <TableHead>Students</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((klass) => (
              <TableRow key={klass.id}>
                <TableCell className="font-medium">{klass.name}</TableCell>
                <TableCell>{klass.gradeLevel}</TableCell>
                <TableCell>{rosterSizeByClass.get(klass.id) ?? 0}</TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/school/classes/${klass.id}`}>Manage</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
