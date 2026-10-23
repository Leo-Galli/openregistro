import type { SchoolId } from '@openregistro/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { auth } from '@/auth';
import { getStorage } from '@/lib/storage';

async function getOverview(rawSchoolId: string) {
  const schoolId = rawSchoolId as SchoolId;
  const storage = await getStorage();
  const [school, schoolYears, students, teachers, classes] = await Promise.all([
    storage.schools.findById(schoolId),
    storage.schoolYears.findMany({ schoolId, isActive: true }),
    storage.users.findMany({ schoolId, role: 'student' }),
    storage.users.findMany({ schoolId, role: 'teacher' }),
    storage.classes.findMany({ schoolId }),
  ]);
  return {
    school,
    schoolYear: schoolYears[0] ?? null,
    studentCount: students.length,
    teacherCount: teachers.length,
    classCount: classes.length,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const overview = await getOverview(session!.user.schoolId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {overview.school?.name ?? 'Your school'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {overview.schoolYear
            ? `School year ${overview.schoolYear.label}`
            : 'No active school year set'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Students</CardDescription>
            <CardTitle className="text-3xl">{overview.studentCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Teachers</CardDescription>
            <CardTitle className="text-3xl">{overview.teacherCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Classes</CardDescription>
            <CardTitle className="text-3xl">{overview.classCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register features</CardTitle>
          <CardDescription>
            The class register, gradebook, timetable, and announcements are being built in the next
            phase of this project. This dashboard already reflects the real data stored for your
            school.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
