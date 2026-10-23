import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { auth } from '@/auth';
import { schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { BrandingForm } from '@/components/school/branding-form';

export default async function BrandingPage() {
  const session = await auth();
  const schoolId = schoolIdOf(session!);
  const storage = await getStorage();
  const school = await storage.schools.findById(schoolId);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>School branding</CardTitle>
        <CardDescription>
          Give this instance your own school&apos;s look. The brand color replaces the default
          OpenRegistro blue across buttons, links, and highlights for everyone signed into this
          register, including the sign-in page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BrandingForm
          defaults={{
            name: school?.name ?? '',
            primaryColor: school?.primaryColor ?? '',
          }}
        />
      </CardContent>
    </Card>
  );
}
