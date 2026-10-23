import { notFound, redirect } from 'next/navigation';
import { classIdSchema, subjectIdSchema, weightedAverage } from '@openregistro/core';
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
import { auth } from '@/auth';
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { AddGradeDialog } from '@/components/gradebook/add-grade-dialog';

export const dynamic = 'force-dynamic';

const GRADE_TYPE_LABELS: Record<string, string> = {
  written: 'Written',
  oral: 'Oral',
  practical: 'Practical',
};

export default async function GradebookSubjectPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string }>;
}) {
  const { classId, subjectId } = await params;
  const session = await auth();
  requirePermission(session!, 'grades:write');

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

  const terms = await storage.terms.findMany({ schoolYearId: klass.schoolYearId });
  const today = new Date().toISOString().slice(0, 10);
  const activeTerm =
    terms.find((term) => term.startDate <= today && today <= term.endDate) ?? terms[0];

  const [enrollments, grades] = await Promise.all([
    storage.enrollments.findMany({ classId: klass.id }),
    activeTerm
      ? storage.grades.findMany({ classId: klass.id, subjectId: subject.id, termId: activeTerm.id })
      : Promise.resolve([]),
  ]);

  const activeStudentIds = enrollments.filter((e) => !e.withdrawnAt).map((e) => e.studentId);
  const students = (
    await Promise.all(activeStudentIds.map((studentId) => storage.users.findById(studentId)))
  ).filter((student): student is NonNullable<typeof student> => student !== null);

  const gradesByStudent = new Map<string, typeof grades>();
  for (const grade of grades) {
    const list = gradesByStudent.get(grade.studentId) ?? [];
    list.push(grade);
    gradesByStudent.set(grade.studentId, list);
  }

  if (!activeTerm) {
    return (
      <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No term is configured for this school year yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {subject.name} <span className="text-muted-foreground">· {klass.name}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{activeTerm.label}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Averages are weighted by each grade&apos;s weight.</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Grades</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const studentGrades = gradesByStudent.get(student.id) ?? [];
                  const average = weightedAverage(studentGrades);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {studentGrades.map((grade) => (
                            <Badge
                              key={grade.id}
                              variant="outline"
                              title={GRADE_TYPE_LABELS[grade.type]}
                            >
                              {grade.value}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{average !== null ? average.toFixed(2) : '-'}</TableCell>
                      <TableCell>
                        <AddGradeDialog
                          classId={klass.id}
                          subjectId={subject.id}
                          termId={activeTerm.id}
                          studentId={student.id}
                          studentName={student.fullName}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
