import { notFound } from 'next/navigation';
import { classIdSchema } from '@openregistro/core';
import {
  Badge,
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
import { schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { EnrollStudentDialog } from '@/components/school/enroll-student-dialog';
import { AssignTeacherDialog } from '@/components/school/assign-teacher-dialog';

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const session = await auth();
  const schoolId = schoolIdOf(session!);
  const storage = await getStorage();

  const parsedClassId = classIdSchema.safeParse(classId);
  if (!parsedClassId.success) notFound();
  const klass = await storage.classes.findById(parsedClassId.data);
  if (!klass || klass.schoolId !== schoolId) notFound();

  const [allEnrollments, allStudents, allSubjects, allTeachers, allAssignments] = await Promise.all([
    storage.enrollments.findMany({ classId: klass.id }),
    storage.users.findMany({ schoolId, role: 'student' }),
    storage.subjects.findMany({ schoolId }),
    storage.users.findMany({ schoolId, role: 'teacher' }),
    storage.teacherAssignments.findMany({ classId: klass.id }),
  ]);

  const activeEnrollments = allEnrollments.filter((enrollment) => !enrollment.withdrawnAt);
  const enrolledStudentIds = new Set(activeEnrollments.map((enrollment) => enrollment.studentId));
  const availableStudents = allStudents.filter((student) => !enrolledStudentIds.has(student.id));
  const studentsById = new Map(allStudents.map((student) => [student.id, student]));
  const subjectsById = new Map(allSubjects.map((subject) => [subject.id, subject]));
  const teachersById = new Map(allTeachers.map((teacher) => [teacher.id, teacher]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {klass.name} <span className="text-muted-foreground">· grade {klass.gradeLevel}</span>
        </h1>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Roster</CardTitle>
          <EnrollStudentDialog
            classId={klass.id}
            students={availableStudents.map((student) => ({ id: student.id, fullName: student.fullName }))}
          />
        </CardHeader>
        <CardContent>
          {activeEnrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enrolled on</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEnrollments.map((enrollment) => {
                  const student = studentsById.get(enrollment.studentId);
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{student?.fullName ?? 'Unknown'}</TableCell>
                      <TableCell>{student?.email}</TableCell>
                      <TableCell>{enrollment.enrolledAt}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Subjects taught</CardTitle>
          <AssignTeacherDialog
            classId={klass.id}
            teachers={allTeachers.map((teacher) => ({ id: teacher.id, label: teacher.fullName }))}
            subjects={allSubjects.map((subject) => ({ id: subject.id, label: subject.name }))}
          />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {allAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers assigned yet.</p>
          ) : (
            allAssignments.map((assignment) => (
              <Badge key={assignment.id} variant="secondary">
                {subjectsById.get(assignment.subjectId)?.name ?? 'Unknown subject'} ·{' '}
                {teachersById.get(assignment.teacherId)?.fullName ?? 'Unknown teacher'} ({assignment.weeklyHours}h)
              </Badge>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
