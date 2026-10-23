import { notFound, redirect } from 'next/navigation';
import { classIdSchema, subjectIdSchema, weightedAverage } from '@openregistro/core';
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
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { SaveEvaluationDialog } from '@/components/report-cards/save-evaluation-dialog';

export const dynamic = 'force-dynamic';

export default async function ReportCardSubjectPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string }>;
}) {
  const { classId, subjectId } = await params;
  const session = await auth();
  requirePermission(session!, 'reports:generate');

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
    classId: klass.id,
    subjectId: subject.id,
  });
  const isAssignedTeacher = assignments.some((a) => a.teacherId === teacherId);
  if (!isAssignedTeacher && session!.user.role === 'teacher') {
    redirect('/forbidden');
  }

  const terms = await storage.terms.findMany({ schoolYearId: klass.schoolYearId });
  const today = new Date().toISOString().slice(0, 10);
  const activeTerm =
    terms.find((term) => term.startDate <= today && today <= term.endDate) ?? terms[0];

  const enrollments = await storage.enrollments.findMany({ classId: klass.id });
  const activeStudentIds = enrollments.filter((e) => !e.withdrawnAt).map((e) => e.studentId);
  const students = (
    await Promise.all(activeStudentIds.map((studentId) => storage.users.findById(studentId)))
  ).filter((student): student is NonNullable<typeof student> => student !== null);

  if (!activeTerm) {
    return (
      <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No term is configured for this school year yet.
      </p>
    );
  }

  const [grades, evaluations] = await Promise.all([
    storage.grades.findMany({ classId: klass.id, subjectId: subject.id, termId: activeTerm.id }),
    storage.termEvaluations.findMany({ subjectId: subject.id, termId: activeTerm.id }),
  ]);

  const gradesByStudent = new Map<string, typeof grades>();
  for (const grade of grades) {
    const list = gradesByStudent.get(grade.studentId) ?? [];
    list.push(grade);
    gradesByStudent.set(grade.studentId, list);
  }
  const evaluationByStudent = new Map(evaluations.map((e) => [e.studentId, e]));

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
          <CardTitle>Term evaluations</CardTitle>
          <CardDescription>
            The gradebook average is shown as a reference; the final grade is a separate decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Gradebook average</TableHead>
                  <TableHead>Final grade</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const average = weightedAverage(gradesByStudent.get(student.id) ?? []);
                  const evaluation = evaluationByStudent.get(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{average !== null ? average.toFixed(2) : '-'}</TableCell>
                      <TableCell>{evaluation ? evaluation.finalGrade.toFixed(2) : '-'}</TableCell>
                      <TableCell>
                        <SaveEvaluationDialog
                          classId={klass.id}
                          subjectId={subject.id}
                          termId={activeTerm.id}
                          studentId={student.id}
                          studentName={student.fullName}
                          currentGrade={evaluation?.finalGrade ?? null}
                          currentComment={evaluation?.comment ?? null}
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
