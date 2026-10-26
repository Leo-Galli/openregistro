import Link from 'next/link';
import type { SchoolId } from '@openregistro/core';
import { hasPermission } from '@openregistro/core';
import { Card, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { auth } from '@/auth';
import { getStorage } from '@/lib/storage';
import { NAV_ITEMS } from '@/lib/nav-items';

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
  const quickLinks = NAV_ITEMS.filter(
    (item) => item.href !== '/dashboard' && hasPermission(session!.user.role, item.permission),
  );

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
            <CardTitle className="font-ui text-4xl tabular-nums">{overview.studentCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Teachers</CardDescription>
            <CardTitle className="font-ui text-4xl tabular-nums">{overview.teacherCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Classes</CardDescription>
            <CardTitle className="font-ui text-4xl tabular-nums">{overview.classCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Quick links</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="flex h-full flex-col gap-2 p-4 transition-shadow hover:shadow-hard">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink bg-primary-300 text-ink">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
