import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { WizardShell } from '@/components/setup/wizard-shell';
import { SchoolForm } from '@/components/setup/school-form';
import { getStorage } from '@/lib/storage';

export default async function SchoolPage() {
  const storage = await getStorage();
  const [school] = await storage.schools.findMany();
  const [schoolYear] = school ? await storage.schoolYears.findMany({ schoolId: school.id }) : [];

  return (
    <WizardShell activeSlug="school">
      <Card>
        <CardHeader>
          <CardTitle>Your school</CardTitle>
          <CardDescription>
            This appears on report cards and in email notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SchoolForm
            defaults={{
              name: school?.name ?? '',
              address: school?.address ?? '',
              contactEmail: school?.contactEmail ?? '',
              primaryColor: school?.primaryColor ?? '',
              yearLabel: schoolYear?.label ?? '',
              startDate: schoolYear?.startDate ?? '',
              endDate: schoolYear?.endDate ?? '',
            }}
          />
        </CardContent>
      </Card>
    </WizardShell>
  );
}
